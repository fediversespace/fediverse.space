# fediverse-space-backend
The Django backend for fediverse.space. Scrapes the fediverse and exposes an API to get data about it.

## Running it
* `cp config.json.template config.json` and enter your configuration details.
* Set the environment variable `FEDIVERSE_CONFIG` to point to the path of this file.
* For development, run `python manage.py runserver --settings=backend.settings.dev`
* In production, set the environment variable `DJANGO_SETTINGS_MODULE=backend.settings.production`