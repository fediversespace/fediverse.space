# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :backend,
  ecto_repos: [Backend.Repo]

# Configures the endpoint
config :backend, BackendWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "XL4NKGBN9lZMrQbMEI1KJOlwAt8S7younVJl90TdAgzmwyapr3g7BRYSNYvX0sZ9",
  render_errors: [view: BackendWeb.ErrorView, accepts: ~w(json)],
  pubsub: [name: Backend.PubSub, adapter: Phoenix.PubSub.PG2]

config :backend, Backend.Repo, queue_target: 5000

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

config :backend, :crawler,
  status_age_limit_days: 28,
  status_count_limit: 5000,
  personal_instance_threshold: 10,
  crawl_interval_mins: 30,
  crawl_workers: 50,
  blacklist: [
    "gab.best",
    "4chan.icu"
  ],
  user_agent: "fediverse.space crawler"

config :backend, Backend.Scheduler,
  jobs: [
    # At midnight every day
    {"@daily", {Backend.Scheduler, :prune_crawls, [1, "month"]}},
    # 00.15 daily
    {"15 0 * * *", {Backend.Scheduler, :generate_edges, []}},
    # 00.30 every night
    {"30 0 * * *", {Backend.Scheduler, :generate_insularity_scores, []}}
  ]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
