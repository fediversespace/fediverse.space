# fediverse.space
fediverse.space is a tool to explore instances in the fediverse.

## Running it
* `cp config.json.template config.json` and enter your configuration details.
* Set the environment variable `FEDIVERSE_CONFIG` to point to the path of this file.
* For development, run `python manage.py runserver --settings=backend.settings.dev`
* In production, set the environment variable `DJANGO_SETTINGS_MODULE=backend.settings.production`
