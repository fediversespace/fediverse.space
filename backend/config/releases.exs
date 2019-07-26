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

config :ex_twilio,
  account_sid: System.get_env("TWILIO_ACCOUNT_SID"),
  auth_token: System.get_env("TWILIO_AUTH_TOKEN")

config :backend, :crawler,
  admin_phone: System.get_env("ADMIN_PHONE"),
  twilio_phone: System.get_env("TWILIO_PHONE"),
  admin_email: System.get_env("ADMIN_EMAIL"),
  frontend_domain: System.get_env("FRONTEND_DOMAIN")

config :backend, Backend.Mailer,
  adapter: Swoosh.Adapters.Sendgrid,
  api_key: System.get_env("SENDGRID_API_KEY")
