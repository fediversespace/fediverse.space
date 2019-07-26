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
    instance_count =
      Instance
      |> where([i], not is_nil(i.version))
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

  # TODO: crawl instances with a blocking robots.txt less often (daily?)
  defp queue_stale_domains() do
    interval = -1 * get_config(:crawl_interval_mins)

    # Get domains that have never been crawled and where the last crawl is past the threshold
    crawls_subquery =
      Crawl
      |> select([c], %{
        instance_domain: c.instance_domain,
        most_recent_crawl: max(c.inserted_at),
        crawl_count: count(c.id)
      })
      |> where([c], is_nil(c.error))
      |> group_by([c], c.instance_domain)

    stale_domains =
      Instance
      |> join(:left, [i], c in subquery(crawls_subquery), on: i.domain == c.instance_domain)
      |> where(
        [i, c],
        (c.most_recent_crawl < datetime_add(^NaiveDateTime.utc_now(), ^interval, "minute") or
           is_nil(c.crawl_count)) and not i.opt_out
      )
      |> select([i], i.domain)
      |> Repo.all()

    Logger.debug("Adding #{length(stale_domains)} stale domains to queue.")

    stale_domains
    |> Enum.each(fn domain -> add_to_queue(domain) end)
  end

  defp add_to_queue(domain) do
    {:run, [domain]} |> Honeydew.async(:crawl_queue)
  end
end
