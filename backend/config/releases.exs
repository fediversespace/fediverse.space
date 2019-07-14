# This file is for *runtime configuration in releases* only.
# https://hexdocs.pm/phoenix/releases.html#runtime-configuration

import Config

ssl =
  case System.get_env("MIX_ENV") do
    "prod" -> true
    _ -> false
  end

config :backend, Backend.Repo,
  url: System.get_env("DATABASE_URL"),
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
  ssl: ssl

# show_sensitive_data_on_connection_error: true

port = String.to_integer(System.get_env("PORT") || "4000")

config :backend, BackendWeb.Endpoint,
  http: [:inet6, port: port],
  url: [host: System.get_env("BACKEND_HOSTNAME"), port: port],
  root: ".",
  secret_key_base: System.get_env("SECRET_KEY_BASE"),
  server: true
