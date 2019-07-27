defmodule Backend.Release do
  @app :backend

  alias Elasticsearch.Index
  alias Backend.Elasticsearch.Cluster

  def run_all do
    migrate()
    index()
  end

  def migrate do
    for repo <- repos() do
      {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
    end
  end

  def index do
    # TODO: this isn't the right way to handle this.
    # See https://github.com/danielberkompas/elasticsearch-elixir/issues/76
    Application.ensure_all_started(@app)
    Index.hot_swap(Cluster, "instances")
    :init.stop()
  end

  def rollback(repo, version) do
    {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :down, to: version))
  end

  defp repos do
    Application.load(@app)
    Application.fetch_env!(@app, :ecto_repos)
  end
end
