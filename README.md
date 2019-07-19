# fediverse.space 🌐

The map of the fediverse that you always wanted.

Read the latest updates on Mastodon: [@fediversespace](https://cursed.technology/@fediversespace)

![A screenshot of fediverse.space](screenshot.png)

1. [Requirements](#requirements)
2. [Running it](#running-it)
3. [Commands](#commands)
4. [Privacy](#privacy)
5. [Acknowledgements](#acknowledgements)

## Requirements

Though dockerized, backend development is easiest if you have the following installed.

- For the scraper + API:
  - Elixir
  - Postgres
- For laying out the graph:
  - Java
- For the frontend:
  - Node.js
  - Yarn

## Running it

### Backend

- `cp example.env .env` and modify environment variables as required
- `docker-compose build`
- `docker-compose up -d phoenix`
  - if you don't specify `phoenix`, it'll also start `gephi` which should only be run as a regular one-off job

### Frontend

- `cd frontend && yarn install`
- `yarn start`

## Commands

### Backend

`./gradlew shadowJar` compiles the graph layout program. `java -Xmx1g -jar build/libs/graphBuilder.jar` runs it.
If running in docker, this means you run

- `docker-compose build gephi`
- `docker-compose run gephi java -Xmx1g -jar build/libs/graphBuilder.jar` lays out the graph

### Frontend

- `yarn build` creates an optimized build for deployment

## Privacy

This project doesn't crawl personal instances: the goal is to understand communities, not individuals. The threshold for what makes an instance "personal" is defined in the [backend config](backend/config/config.exs) and the [graph builder SQL](gephi/src/main/java/space/fediverse/graph/GraphBuilder.java).

## Acknowledgements

[![NLnet logo](https://i.imgur.com/huV3rvo.png)](https://nlnet.nl/project/fediverse_space/)

Many thanks to [NLnet](https://nlnet.nl/project/fediverse_space/) for their support and guidance of this project.
