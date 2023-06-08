defmodule Backend.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application
  import Backend.Util

  def start(_type, _args) do
    crawl_worker_count = get_config(:crawl_workers)

    children = [
      # Start the Ecto repository
      Backend.Repo,
      # Start the endpoint when the application starts
      BackendWeb.Endpoint,
      # Crawler children
      :hackney_pool.child_spec(:crawler, timeout: 15_000, max_connections: crawl_worker_count),
      Supervisor.child_spec(
        {Task,
         fn ->
           Honeydew.start_queue(:crawl_queue, failure_mode: Honeydew.FailureMode.Abandon)
           Honeydew.start_workers(:crawl_queue, Backend.Crawler, num: crawl_worker_count)
         end},
        id: :start_honeydew
      ),
      Supervisor.child_spec({Task, fn -> HTTPoison.start() end}, id: :start_httpoison),
      Backend.Scheduler,
      Graph.Cache
    ]

    children =
      case Enum.member?(["true", 1, "1"], System.get_env("SKIP_CRAWL")) do
        true -> children
        false -> children ++ [Backend.Crawler.StaleInstanceManager]
      end

    add_appsignal_probes()

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Backend.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  def config_change(changed, _new, removed) do
    BackendWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  defp add_appsignal_probes do
    Appsignal.Probes.register(:crawler, fn ->
      %{
        queue: %{
          mnesia: mnesia
        }
      } = Honeydew.status(:crawl_queue)

      # How much memory the mnesia queue in using
      memory = mnesia |> Map.get(:"honeydew_:crawl_queue") |> Keyword.get(:memory)
      Appsignal.set_gauge("mnesia_memory", memory)

      # How many jobs are pending in the queue
      queue_length =
        Honeydew.filter(
          :crawl_queue,
          &match?(%Honeydew.Job{completed_at: nil, task: {:run, _}}, &1)
        )
        |> Enum.count()

      Appsignal.set_gauge("queue_length", queue_length)
    end)
  end
end
