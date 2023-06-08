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
    @app
  ]

  def run_all do
    migrate()
  end

  def migrate do
    for repo <- repos() do
      {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
    end
  end

  def rollback(repo, version) do
    {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :down, to: version))
  end

  defp repos do
    Application.load(@app)
    Application.fetch_env!(@app, :ecto_repos)
  end
end
