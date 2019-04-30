# Software Bill of Materials

This is an overview of the external software components (libraries, etc.) that
are used in fediverse.space, or that are likely to be used.

## Backend

I am currently in the process of migrating from a Python and Django-based
backend to one written in Elixir. This list is what *will* be used in the near
future.
### Crawler and API
* [Elixir](https://elixir-lang.org/) (the language)
* [Phoenix](https://phoenixframework.org/) (the web framework)
* [HTTPoison](https://hexdocs.pm/httpoison/readme.html) (for crawling servers)
* See [/backend/mix.env](/backend/mix.env) for a complete overview of
  dependencies

### Graph layout
* [Gephi toolkit](https://gephi.org/toolkit/)

## Frontend
* [React](https://reactjs.org/) (the UI framework)
* [Blueprint](https://blueprintjs.com/) (a collection of pre-existing UI components)
* [Sigma.js](http://sigmajs.org/) (for graph visualization)
* See [/frontend/package.json](/frontend/package.json) for a complete overview
  of dependencies

## Other
* [Docker](https://www.docker.com/) and
  [docker-compose](https://docs.docker.com/compose/overview/)
* The frontend is hosted on [Netlify](https://www.netlify.com/)

