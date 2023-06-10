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

config :backend, Backend.Elasticsearch.Cluster,
  url: System.get_env("ELASTICSEARCH_URL") || "http://localhost:9200"

config :appsignal, :config,
  otp_app: :backend,
  name: "fediverse.space",
  active: true,
  revision: System.get_env("GIT_REV")

port = String.to_integer(System.get_env("PORT") || "4000")

config :backend, BackendWeb.Endpoint,
  http: [:inet6, port: port],
  url: [host: System.get_env("BACKEND_HOSTNAME"), port: port],
  root: ".",
  secret_key_base: System.get_env("SECRET_KEY_BASE"),
  server: true

config :backend, :crawler,
  admin_phone: System.get_env("ADMIN_PHONE"),
  admin_email: System.get_env("ADMIN_EMAIL"),
  frontend_domain: System.get_env("FRONTEND_DOMAIN")

config :backend, Backend.Mailer,
  adapter: Swoosh.Adapters.SMTP,
  relay: System.get_env("MAILER_RELAY"),
  username: System.get_env("MAILER_USERNAME"),
  password: System.get_env("MAILER_PASSWORD"),
  ssl: true,
  auth: :always,
  port: 465

config :backend, Mastodon.Messenger,
  domain: System.get_env("MASTODON_DOMAIN"),
  token: System.get_env("MASTODON_TOKEN")
