import subprocess
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = "Takes what's in the database and calls Gephi to create and layout a graph"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def handle(self, *args, **options):
        database_config = settings.DATABASES['default']
        subprocess.call([
            'java',
            '-Xmx4g',
            '-jar',
            'gephi/build/libs/graphBuilder.jar',
            database_config['NAME'],
            database_config['USER'],
            database_config['PASSWORD'],
        ])
