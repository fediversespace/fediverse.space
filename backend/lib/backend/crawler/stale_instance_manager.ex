defmodule Backend.Crawler.StaleInstanceManager do
  use GenServer
  alias Backend.{Crawl, Instance, Repo}
  import Ecto.Query
  import Backend.Util
  require Logger

  @moduledoc """
  This module regularly finds stale instances (i.e. instances that haven't been updated for longer than the crawl
  interval) and adds them to the job queue. It runs once a minute.
  """

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end

  @impl true
  def init(_opts) do
    Logger.info("Starting crawler manager...")

    instance_count =
      Instance
      |> select([i], count(i.domain))
      |> Repo.one()

    case instance_count do
      # Add m.s. as the seed and schedule the next add
      0 ->
        add_to_queue("mastodon.social")
        schedule_add()

      # Start immediately
      _ ->
        Process.send(self(), :queue_stale_domains, [])
    end

    {:ok, []}
  end

  @impl true
  def handle_info(:queue_stale_domains, state) do
    queue_stale_domains()
    schedule_add()
    {:noreply, state}
  end

  defp schedule_add() do
    Process.send_after(self(), :queue_stale_domains, 60_000)
  end

  defp queue_stale_domains() do
    stale_domains =
      get_live_domains_to_crawl()
      |> MapSet.union(get_dead_domains_to_crawl())
      |> MapSet.union(get_new_domains_to_crawl())

    # Don't add a domain that's already in the queue
    domains_in_queue = get_domains_in_queue(stale_domains)
    domains_to_queue = MapSet.difference(stale_domains, domains_in_queue)

    Logger.debug("Adding #{MapSet.size(domains_to_queue)} stale domains to queue.")

    domains_to_queue
    |> Enum.each(fn domain -> add_to_queue(domain) end)
  end

  defp add_to_queue(domain) do
    {:run, [domain]} |> Honeydew.async(:crawl_queue)
  end

  # Handles instances where the most recent crawl was successful
  @spec get_live_domains_to_crawl() :: MapSet.t()
  defp get_live_domains_to_crawl() do
    interval_mins = -1 * get_config(:crawl_interval_mins)

    most_recent_crawl_subquery =
      Crawl
      |> select([c], %{
        instance_domain: c.instance_domain,
        inserted_at: max(c.inserted_at)
      })
      |> group_by([c], c.instance_domain)

    Instance
    |> join(:left, [i], most_recent_crawl in subquery(most_recent_crawl_subquery),
      on: i.domain == most_recent_crawl.instance_domain
    )
    # Joining on a timestamp is really gross, but since we're joining on a timestamp in the same table, we should be OK.
    |> join(:left, [i, most_recent_crawl], crawls in Crawl,
      on:
        i.domain == crawls.instance_domain and most_recent_crawl.inserted_at == crawls.inserted_at
    )
    |> where(
      [i, most_recent_crawl, crawls],
      is_nil(crawls.error) and
        most_recent_crawl.inserted_at <
          datetime_add(^NaiveDateTime.utc_now(), ^interval_mins, "minute") and not i.opt_out
    )
    |> select([i], i.domain)
    |> Repo.all()
    |> MapSet.new()
  end

  # Handles instances that have never been crawled at all.
  @spec get_new_domains_to_crawl() :: MapSet.t()
  defp get_new_domains_to_crawl() do
    all_crawls_subquery =
      Crawl
      |> select([c], %{
        instance_domain: c.instance_domain,
        crawl_count: count(c.id)
      })
      |> group_by([c], c.instance_domain)

    Instance
    |> join(:left, [i], c in subquery(all_crawls_subquery), on: i.domain == c.instance_domain)
    |> where([i, c], (is_nil(c.crawl_count) or c.crawl_count == 0) and not i.opt_out)
    |> select([i], i.domain)
    |> Repo.all()
    |> MapSet.new()
  end

  # Handles instances where the previous crawl(s) were unsuccessful.
  # These are crawled with an increasing delay
  @spec get_dead_domains_to_crawl() :: MapSet.t()
  defp get_dead_domains_to_crawl() do
    now = get_now()
    interval_mins = -1 * get_config(:crawl_interval_mins)

    most_recent_successful_crawl_subquery =
      Crawl
      |> select([c], %{
        instance_domain: c.instance_domain,
        timestamp: max(c.inserted_at)
      })
      |> where([c], is_nil(c.error))
      |> group_by([c], c.instance_domain)

    Instance
    |> join(
      :left,
      [i],
      most_recent_successful_crawl in subquery(most_recent_successful_crawl_subquery),
      on: i.domain == most_recent_successful_crawl.instance_domain
    )
    |> join(:left, [i, most_recent_successful_crawl_subquery], crawls in Crawl,
      on: i.domain == crawls.instance_domain
    )
    |> select([i, most_recent_successful_crawl, crawls], %{
      domain: i.domain,
      most_recent_crawl: max(crawls.inserted_at),
      failed_crawls: count(crawls.id)
    })
    |> group_by([i, most_recent_successful_crawl, crawls], i.domain)
    |> where(
      [i, most_recent_successful_crawl, crawls],
      crawls.inserted_at > most_recent_successful_crawl.timestamp and not i.opt_out
    )
    |> Repo.all()
    # We now have a list of domains, the # of failed crawls, and the most recent crawl timestamp.
    # Now we filter down to those that should be crawled now.
    |> Enum.map(fn %{
                     domain: domain,
                     most_recent_crawl: most_recent_crawl,
                     failed_crawls: failed_crawls
                   } ->
      # The interval is never more than 24 hours
      curr_interval = min(1440, interval_mins * :math.pow(2, failed_crawls))
      next_crawl = NaiveDateTime.add(most_recent_crawl, curr_interval * 60, :second)

      %{
        domain: domain,
        next_crawl: next_crawl
      }
    end)
    |> Enum.filter(fn %{next_crawl: next_crawl} ->
      NaiveDateTime.compare(now, next_crawl) == :gt
    end)
    |> Enum.map(fn %{domain: domain} -> domain end)
    |> MapSet.new()
  end

  @spec get_domains_in_queue(MapSet.t()) :: MapSet.t()
  defp get_domains_in_queue(domains) do
    Honeydew.filter(:crawl_queue, fn job ->
      is_pending_crawl_job = match?(%Honeydew.Job{completed_at: nil, task: {:run, [_]}}, job)

      if is_pending_crawl_job do
        %Honeydew.Job{completed_at: nil, task: {:run, [d]}} = job
        MapSet.member?(domains, d)
      else
        false
      end
    end)
    |> Enum.map(fn %Honeydew.Job{task: {:run, [d]}} -> d end)
    |> MapSet.new()
  end
end
