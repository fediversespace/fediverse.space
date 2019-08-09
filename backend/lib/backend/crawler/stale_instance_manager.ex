defmodule Backend.Crawler.StaleInstanceManager do
  use GenServer
  alias Backend.{Instance, Repo}
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
    now = get_now()

    stale_domains =
      Instance
      |> select([i], i.domain)
      |> where([i], i.next_crawl < ^now and not i.opt_out)
      |> Repo.all()
      |> MapSet.new()

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
