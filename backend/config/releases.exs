# This file is for *runtime configuration in releases* only.
# https://hexdocs.pm/phoenix/releases.html#runtime-configuration

import Config

# For production, don't forget to configure the url host
# to something meaningful, Phoenix uses this information
# when generating URLs.
config :backend, Backend.Repo,
  # username: System.get_env("POSTGRES_USER"),
  # password: System.get_env("POSTGRES_PASSWORD"),
  # database: System.get_env("POSTGRES_DB"),
  # hostname: System.get_env("POSTGRES_HOSTNAME"),
  url: System.get_env("ecto://" <> "DATABASE_URL"),
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
  ssl: true

# show_sensitive_data_on_connection_error: true

port = String.to_integer(System.get_env("PORT") || "4000")

config :backend, BackendWeb.Endpoint,
  http: [:inet6, port: port],
  url: [host: System.get_env("BACKEND_HOSTNAME"), port: port],
  root: ".",
  secret_key_base: System.get_env("SECRET_KEY_BASE"),
  server: true
