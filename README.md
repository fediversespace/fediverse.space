# fediverse.space 🌐
The map of the fediverse that you always wanted.

![A screenshot of fediverse.space](screenshot.png)

## Requirements
- For the scraper + API:
  - Elixir
  - Postgres
- For laying out the graph:
  - Java
- For the frontend:
  - Node.js
  - Yarn

All of the above can also be run through Docker with `docker-compose`.

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

After running the backend in Docker:
- `docker-compose run gephi java -Xmx1g -jar build/libs/graphBuilder.jar` lays out the graph

`./gradlew shadowJar` compiles the graph layout program. `java -Xmx1g -jar build/libs/graphBuilder.jar` runs it.

### Frontend
- `yarn build` to create an optimized build for deployment

### Acknowledgements

[![NLnet logo](https://i.imgur.com/huV3rvo.png)](https://nlnet.nl/project/fediverse_space/)

Many thanks to [NLnet](https://nlnet.nl/project/fediverse_space/) for their support and guidance of this project.