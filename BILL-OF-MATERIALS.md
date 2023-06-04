# Software Bill of Materials

This is an overview of the external software components (libraries, etc.) that
are used in fediverse.space.

## Backend

### Crawler and API

- [Elixir](https://elixir-lang.org/) (the language)
- [Phoenix](https://phoenixframework.org/) (the web framework)
- See [/backend/mix.env](/backend/mix.env) for a complete overview of
  dependencies

### Graph layout

- Java (the language)
- Gradle (to build)
- [Gephi toolkit](https://gephi.org/toolkit/)

## Frontend

- [React](https://reactjs.org/) (the UI framework)
- [Blueprint](https://blueprintjs.com/) (a collection of pre-existing UI components)
- [Cytoscape.js](http://js.cytoscape.org/) (for graph visualization)
- See [/frontend/package.json](/frontend/package.json) for a complete overview
  of dependencies

## Other

- [Docker](https://www.docker.com/) and
  [docker-compose](https://docs.docker.com/compose/overview/)
- [GitLab](https://gitlab.com/) and GitLab CI/CD are used for project management and CI/CD.
