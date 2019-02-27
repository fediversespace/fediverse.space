from .base import *

DEBUG = False

ALLOWED_HOSTS = ['backend.fediverse.space']

CORS_ORIGIN_REGEX_WHITELIST = [
    r'^(https?:\/\/)?(\w+\.)?(.*)?fediverse-space\.netlify\.com\/?$',
    r'^(https?:\/\/)?(\w+\.)?(.*)?fediverse\.space\/?$',
]
