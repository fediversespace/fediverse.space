defmodule Backend.MixProject do
  use Mix.Project

  def project do
    [
      app: :backend,
      version: "2.8.2",
      elixir: "~> 1.5",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps()
    ]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [
      mod: {Backend.Application, []},
      extra_applications: [
        :logger,
        :runtime_tools,
        :gollum,
        :appsignal,
        :swoosh,
        :gen_smtp
      ]
    ]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      {:phoenix_view, "~> 2.0"},
      {:phoenix, "~> 1.7.0"},
      {:phoenix_live_view, "~> 0.18.18"},
      {:phoenix_live_dashboard, "~> 0.7.2"},
      {:phoenix_html, "~> 3.0"},
      {:telemetry_metrics, "~> 0.6"},
      {:telemetry_poller, "~> 0.5"},
      {:phoenix_pubsub, "~> 2.1.1"},
      {:phoenix_ecto, "~> 4.4.0"},
      {:ecto_sql, "~> 3.0"},
      {:postgrex, ">= 0.0.0"},
      {:gettext, "~> 0.11"},
      {:jason, "~> 1.0"},
      {:plug_cowboy, "~> 2.1"},
      {:httpoison, "~> 2.1", override: true},
      {:timex, "~> 3.5"},
      {:honeydew, "~> 1.5.0"},
      {:quantum, "~> 3.3"},
      {:corsica, "~> 1.3"},
      {:sobelow, "~> 0.8", only: [:dev, :test]},
      {:gollum, "~> 0.3.2"},
      {:public_suffix, git: "https://github.com/axelson/publicsuffix-elixir"},
      {:swoosh, "~> 1.0"},
      {:gen_smtp, "~> 1.2"},
      {:elasticsearch, "~> 1.0"},
      {:appsignal, "~> 2.7"},
      {:appsignal_phoenix, "~> 2.3"},
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:nebulex, "~> 2.4.2"},
      {:hunter, "~> 0.5.1"},
      {:scrivener_ecto, "~> 2.2"},
      {:recase, "~> 0.7"},
      {:ex_rated, "~> 2.1"},
      {:html_sanitize_ex, "~> 1.4"},
      {:mox, "~> 1.0", only: [:test]}
    ]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to create, migrate and run the seeds file at once:
  #
  #     $ mix ecto.setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    [
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      test: ["ecto.create --quiet", "ecto.migrate", "test"]
    ]
  end
end
