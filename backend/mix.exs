defmodule Backend.MixProject do
  use Mix.Project

  def project do
    [
      app: :backend,
      version: "2.8.2",
      elixir: "~> 1.5",
      elixirc_paths: elixirc_paths(Mix.env()),
      compilers: [:phoenix, :gettext] ++ Mix.compilers(),
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
        :elasticsearch,
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
      {:phoenix, "~> 1.5"},
      {:phoenix_pubsub, "~> 2.0"},
      {:phoenix_ecto, "~> 4.0"},
      {:ecto_sql, "~> 3.0"},
      {:postgrex, ">= 0.0.0"},
      {:gettext, "~> 0.11"},
      {:jason, "~> 1.0"},
      {:plug_cowboy, "~> 2.1"},
      {:httpoison, "~> 1.7", override: true},
      {:timex, "~> 3.5"},
      {:honeydew, "~> 1.5.0"},
      {:quantum, "~> 3.3"},
      {:corsica, "~> 1.1.2"},
      {:sobelow, "~> 0.8", only: [:dev, :test]},
      {:gollum, "~> 0.3.2"},
      {:public_suffix, git: "https://github.com/axelson/publicsuffix-elixir"},
      {:swoosh, "~> 1.0"},
      {:gen_smtp, "~> 1.1"},
      {:elasticsearch, "~> 1.0"},
      {:appsignal, "~> 1.0"},
      {:credo, "~> 1.1", only: [:dev, :test], runtime: false},
      {:nebulex, "~> 1.1"},
      {:hunter, "~> 0.5.1"},
      {:scrivener_ecto, "~> 2.2"},
      {:recase, "~> 0.7"},
      {:ex_rated, "~> 2.0"},
      {:html_sanitize_ex, "~> 1.4"}
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
