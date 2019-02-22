#! /bin/bash

SLEEP_SECONDS=3

>&2 echo "Checking Postgres status..."

# https://docs.docker.com/compose/startup-order/
export PGPASSWORD=$POSTGRES_PASSWORD
until psql -h db -U "$POSTGRES_USER" -p 5432 -d "$POSTGRES_DB" -c '\q'
do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep $SLEEP_SECONDS
done
>&2 echo "Postgres is up"

python manage.py collectstatic --noinput
python manage.py migrate --noinput

if [[ $ENVIRONMENT == "development" ]]
then
  >&2 echo "Running Django server on port 8000 for development"
  python manage.py runserver 0.0.0.0:8000
else
  >&2 echo "Running gunicorn server"
  gunicorn backend.wsgi -c /config/gunicorn.conf.py
fi
