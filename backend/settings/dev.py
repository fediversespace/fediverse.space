from .base import *

DEBUG = True

ALLOWED_HOSTS += ['localhost']

MIDDLEWARE += (
    'silk.middleware.SilkyMiddleware',
)

INSTALLED_APPS += (
    'silk',
)
