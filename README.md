# fediverse.space
fediverse.space is a tool to explore instances in the fediverse.

## Running it
* `cp config.json.template config.json` and enter your configuration details. I've used a postgres database for development.
* Set the environment variable `FEDIVERSE_CONFIG` to point to the path of this file.
* `pip install -r requirements.txt` 
* `yarn install`
* Make sure you have the Java 8 JRE (to run) or JDK (to develop) installed, and gradle
* For development, run `python manage.py runserver --settings=backend.settings.dev`
* In production, set the environment variable `DJANGO_SETTINGS_MODULE=backend.settings.production`

