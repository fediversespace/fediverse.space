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
  pubsub: [name: Backend.PubSub, adapter: Phoenix.PubSub.PG2],
  instrumenters: [Appsignal.Phoenix.Instrumenter]

config :backend, Backend.Repo, queue_target: 5000

instances_config_path =
  if System.get_env("MIX_ENV") == "prod",
    do: "lib/backend-2.3.1/priv/elasticsearch/instances.json",
    else: "priv/elasticsearch/instances.json"

config :backend, Backend.Elasticsearch.Cluster,
  url: "http://localhost:9200",
  api: Elasticsearch.API.HTTP,
  json_library: Jason,
  indexes: %{
    instances: %{
      settings: instances_config_path,
      store: Backend.Elasticsearch.Store,
      sources: [Backend.Instance],
      bulk_page_size: 1000,
      bulk_wait_interval: 1_000
    }
  }

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

config :ex_twilio,
  account_sid: System.get_env("TWILIO_ACCOUNT_SID"),
  auth_token: System.get_env("TWILIO_AUTH_TOKEN")

config :backend, Backend.Mailer,
  adapter: Swoosh.Adapters.Sendgrid,
  api_key: System.get_env("SENDGRID_API_KEY")

config :backend, :crawler,
  status_age_limit_days: 28,
  status_count_limit: 5000,
  personal_instance_threshold: 10,
  crawl_interval_mins: 60,
  crawl_workers: 100,
  blacklist: [
    "gab.best",
    "4chan.icu"
  ],
  user_agent: "fediverse.space crawler",
  admin_phone: System.get_env("ADMIN_PHONE"),
  twilio_phone: System.get_env("TWILIO_PHONE"),
  admin_email: System.get_env("ADMIN_EMAIL")

config :backend, Backend.Scheduler,
  jobs: [
    # At midnight every day
    {"@daily", {Backend.Scheduler, :prune_crawls, [1, "month"]}},
    # 00.15 daily
    {"15 0 * * *", {Backend.Scheduler, :generate_edges, []}},
    # 00.30 every night
    {"30 0 * * *", {Backend.Scheduler, :generate_insularity_scores, []}},
    # 00.45 every night
    {"45 0 * * *", {Backend.Scheduler, :generate_status_rate, []}},
    # Every 3 hours
    {"0 */3 * * *", {Backend.Scheduler, :check_for_spam_instances, []}}
  ]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
