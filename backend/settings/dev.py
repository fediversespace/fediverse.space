from .base import *

DEBUG = True

ALLOWED_HOSTS += ['localhost']

CORS_ORIGIN_WHITELIST = [
    'localhost:3000',
    'localhost:8000',
    '127.0.0.1',
]

