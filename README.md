# fediverse.space 🌐

The map of the fediverse that you always wanted.

Read the latest updates on Mastodon: [@fediversespace](https://mastodon.social/@fediversespace)

![A screenshot of fediverse.space](screenshot.png)

- [fediverse.space 🌐](#fediversespace-%f0%9f%8c%90)
  - [Requirements](#requirements)
  - [Running it](#running-it)
    - [Backend](#backend)
    - [Frontend](#frontend)
  - [Commands](#commands)
    - [Backend](#backend-1)
    - [Frontend](#frontend-1)
  - [Privacy](#privacy)
  - [Deployment](#deployment)
  - [Acknowledgements](#acknowledgements)

## Requirements

You'll need the following to work on fediverse.space:

- For the crawler + API:
  - Elixir
  - Postgres
  - Elasticsearch
- For laying out the graph:
  - Java
- For the frontend:
  - Node.js

## Running it

### Backend

- `cp example.env .env` and modify environment variables as required
- `docker-compose up`
- Create the elasticsearch index:
  - `iex -S mix app.start`
  - `Elasticsearch.Index.hot_swap(Backend.Elasticsearch.Cluster, :instances)`

### Frontend

- `cd frontend && npm install`
- `npm start`

## Commands

### Backend

`./gradlew shadowJar` compiles the graph layout program. `java -Xmx1g -jar build/libs/graphBuilder.jar` runs it.

### Frontend

- `npm run build` creates an optimized build for deployment

## Privacy

This project doesn't crawl personal instances: the goal is to understand communities, not individuals. The threshold for what makes an instance "personal" is defined in the [backend config](backend/config/config.exs) and the [graph builder SQL](gephi/src/main/java/space/fediverse/graph/GraphBuilder.java).

## Deployment

You don't have to follow these instructions, but it's one way to set up a continuous deployment pipeline. The following are for the backend; the frontend is just a static HTML/JS site that can be deployed anywhere.

1. Install [Dokku](http://dokku.viewdocs.io/dokku/) on your web server.
2. Install [dokku-postgres](https://github.com/dokku/dokku-postgres), [dokku-monorepo](https://github.com/notpushkin/dokku-monorepo), [dokku-elasticsearch](https://github.com/dokku/dokku-elasticsearch), and [dokku-letsencrypt](https://github.com/dokku/dokku-letsencrypt).
3. Create the apps

- `dokku apps:create phoenix`
- `dokku apps:create gephi`

4. Create the backing database

- `dokku postgres:create fediversedb`
- `dokku postgres:link fediversedb phoenix`
- `dokku postgres:link fediversedb gephi`

5. Set up ElasticSearch

- `dokku elasticsearch:create fediverse`
- `dokku elasticsearch:link fediverse phoenix`

6. Set the build dirs

- `dokku builder:set phoenix build-dir backend`
- `dokku builder:set gephi build-dir gephi`

7. Update the backend configuration. In particular, change the `user_agent` in [config.exs](/backend/config/config.exs) to something descriptive.
8. Push the apps, e.g. `git push dokku@<DOMAIN>:phoenix` (note that the first push cannot be from the CD pipeline).
9. Set up SSL for the Phoenix app

- `dokku letsencrypt:enable phoenix`
- `dokku letsencrypt:cron-job --add`

10. Set up a cron job for the graph layout (use the `dokku` user). E.g.

```
SHELL=/bin/bash
0 2 * * * /usr/bin/dokku run gephi java -Xmx1g -jar build/libs/graphBuilder.jar
```

Before the app starts running, make sure that the Elasticsearch index exists -- otherwise it'll create one called
`instances`, which should be the name of the alias. Then it won't be able to hot swap if you reindex in the future.

## Acknowledgements

[![NLnet logo](/nlnet-logo.png)](https://nlnet.nl/project/fediverse_space/)

Many thanks to [NLnet](https://nlnet.nl/project/fediverse_space/) for their support and guidance of this project.
