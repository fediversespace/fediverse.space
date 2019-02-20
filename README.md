# fediverse.space 🌐 [![Netlify Status](https://api.netlify.com/api/v1/badges/ddc939c0-c12f-4e0e-8ca3-cf6abe8b9a5a/deploy-status)](https://app.netlify.com/sites/sharp-curran-4b66d3/deploys)
The map of the fediverse that you always wanted.

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

