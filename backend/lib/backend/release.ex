defmodule Backend.Release do
  @moduledoc """
  Functions related to releases. Can be run against the compiled binary with e.g.
  `/bin/backend eval "Backend.Release.migrate()"`
  """
  @app :backend
  @start_apps [
    :crypto,
    :ssl,
    :postgrex,
    :ecto,
    :elasticsearch,
    @app
  ]

  # Ecto repos to start, if any
  @repos Application.compile_env(:backend, :ecto_repos, [])
  # Elasticsearch clusters to start
  @clusters [Backend.Elasticsearch.Cluster]
  # Elasticsearch indexes to build
  @indexes [:instances]

  def run_all do
    migrate()
    build_elasticsearch_indexes()
  end

  def migrate do
    for repo <- repos() do
      {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
    end
  end

  def rollback(repo, version) do
    {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :down, to: version))
  end

  def build_elasticsearch_indexes do
    start_services()
    IO.puts("Building indexes...")
    Enum.each(@indexes, &Elasticsearch.Index.hot_swap(Backend.Elasticsearch.Cluster, &1))
    stop_services()
  end

  # Ensure that all OTP apps, repos used by your Elasticsearch store,
  # and your Elasticsearch Cluster(s) are started
  defp start_services do
    IO.puts("Starting dependencies...")
    Enum.each(@start_apps, &Application.ensure_all_started/1)
    IO.puts("Starting repos...")
    Enum.each(@repos, & &1.start_link(pool_size: 1))
    IO.puts("Starting clusters...")
    Enum.each(@clusters, & &1.start_link())
  end

  defp stop_services do
    :init.stop()
  end

  defp repos do
    Application.load(@app)
    Application.fetch_env!(@app, :ecto_repos)
  end
end
