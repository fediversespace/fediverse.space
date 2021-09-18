FROM elixir:1.12-alpine as build

# install build dependencies
RUN apk add --update git build-base 

# prepare build dir
RUN mkdir /app
WORKDIR /app

# install hex + rebar
RUN mix local.hex --force && \
  mix local.rebar --force

# set build ENV
ENV MIX_ENV=prod

# install mix dependencies
COPY mix.exs ./
COPY mix.lock ./
COPY config config
RUN mix deps.get
RUN mix deps.compile

# build assets
# COPY assets assets
# RUN cd assets && npm install && npm run deploy
# RUN mix phx.digest

# build project
COPY priv priv
COPY lib lib
RUN mix compile

# build release
COPY rel rel
RUN mix release

# prepare release image
FROM alpine:3.9 AS app
RUN apk add --update bash openssl libstdc++ build-base

RUN mkdir /app
WORKDIR /app

ENV APP_NAME=backend

COPY --from=build /app/_build/prod/rel/${APP_NAME} ./
COPY Procfile ./
RUN chown -R nobody: /app
USER nobody

ENV HOME=/app

# The command to start the backend
CMD trap 'exit' INT; ${HOME}/bin/${APP_NAME} start
