from .base import *

DEBUG = False

ALLOWED_HOSTS = ['api.fediverse.space']

CORS_ORIGIN_WHITELIST = [
    'fediverse.space',
    'www.fediverse.space',
    'staging.fediverse.space',
]
CORS_ORIGIN_REGEX_WHITELIST = (r'^(https?:\/\/)?(\w+\.)?(.*)?fediverse-space\.netlify\.com\/?$', )
