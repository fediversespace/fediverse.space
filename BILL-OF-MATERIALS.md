# Software Bill of Materials

This is an overview of the external software components (libraries, etc.) that
are used in fediverse.space, or that are likely to be used.

## Backend

I am currently in the process of migrating from a Python and Django-based
backend to one written in Elixir. This list is what *will* be used in the near
future.
### Crawler and API
* [Elixir](https://elixir-lang.org/)
* [Phoenix](https://phoenixframework.org/)
* [HTTPoison](https://hexdocs.pm/httpoison/readme.html)
* See [/backend/mix.env](/backend/mix.env) for a complete overview of
  dependencies

### Graph layout
* [Gephi toolkit](https://gephi.org/toolkit/)

## Frontend
* [React](https://reactjs.org/)
* [Blueprint](https://blueprintjs.com/)
* See [/frontend/package.json](/frontend/package.json) for a complete overview
  of dependencies

## Other
* [Docker](https://www.docker.com/) and
  [docker-compose](https://docs.docker.com/compose/overview/)
* The frontend is hosted on [Netlify](https://www.netlify.com/)

