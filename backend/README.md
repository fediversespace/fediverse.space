# fediverse.space backend

## Notes

- This project requires Elixir >= 1.9.
- Run with `SKIP_CRAWL=true` to just run the server (useful for working on the API without also crawling)
- This project is automatically scanned for potential vulnerabilities with [Sobelow](https://sobelow.io/).

## Configuration

There are several environment variables you can set to configure how the crawler behaves.

- `DATABASE_URL` (required) . The URL of the Postgres db.
- `POOL_SIZE`. The size of the database pool. Default: 10
- `PORT`. Default: 4000
- `BACKEND_HOSTNAME` (required). The url the backend is running on.
- `SECRET_KEY_BASE` (required). Used for signing tokens.
- `TWILIO_ACCOUNT_SID`. Used for sending SMS alerts to the admin.
- `TWILIO_AUTH_TOKEN`. As above.
- `ADMIN_PHONE`. The phone number to receive alerts at.
  - At the moment, the only alert is when there are potential new spam domains.
- `TWILIO_PHONE`. The phone number to send alerts from.
- `ADMIN_EMAIL`. Used for receiving alerts.
- `FRONTEND_DOMAIN` (required). Used to generate login links for instance admins.
  - Don't enter `https://`, this is added automatically.
- `SENDGRID_API_KEY`. Needed to send emails to the admin, or to instance admins who want to opt in/out.
- `MASTODON_DOMAIN`. The domain (e.g. `mastodon.social`) that your bot login account is hosted on.
- `MASTODON_TOKEN`. The access token for the bot login account.

## Deployment

Deployment with Docker is handled as per the [Distillery docs](https://hexdocs.pm/distillery/guides/working_with_docker.html).

- To build a new version, run `make build` in this directory.
- To migrate a released version, run `./backend eval "Backend.Release.migrate"`

# Default README

To start your Phoenix server:

- Install dependencies with `mix deps.get`
- Create and migrate your database with `mix ecto.setup`
- Start Phoenix endpoint with `mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

Ready to run in production? Please [check our deployment guides](https://hexdocs.pm/phoenix/deployment.html).

## Learn more

- Official website: http://www.phoenixframework.org/
- Guides: https://hexdocs.pm/phoenix/overview.html
- Docs: https://hexdocs.pm/phoenix
- Mailing list: http://groups.google.com/group/phoenix-talk
- Source: https://github.com/phoenixframework/phoenix
