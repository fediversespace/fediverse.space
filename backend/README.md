# fediverse.space backend

## Notes

- This project requires Elixir >= 1.9.
- Run with `SKIP_CRAWL=true` to just run the server (useful for working on the API without also crawling)

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
