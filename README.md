# fediverse.space
fediverse.space is a tool to explore instances in the fediverse 🌐

## Requirements
- For everything:
  - Docker
  - Docker-compose
- For the scraper + API:
  - Python 3
- For laying out the graph:
  - Java
- For the frontend:
  - Yarn

## Running it
### Backend
- `cp example.env .env` and modify environment variables as required
- `docker-compose build`
- `docker-compose up -d`
### Frontend
- `cd frontend && yarn install`
- `yarn start`

## Commands
### Backend
- `python manage.py scrape` scrapes the entire fediverse
- `python manage.py build_graph` uses this information to lay out a graph

To run in production, use `docker-compose -f docker-compose.yml -f docker-compose.production.yml` instead of just `docker-compose`.

### Frontend
- `yarn build` to create an optimized build for deployment

