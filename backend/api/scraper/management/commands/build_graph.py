import subprocess
from django.core.management.base import BaseCommand
from django.conf import settings
from scraper.models import PeerRelationship, Edge


class Command(BaseCommand):
    help = "Takes what's in the database and calls Gephi to create and layout a graph"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def handle(self, *args, **options):
        self.stdout.write("Creating Edges from PeerRelationships...")
        # Turn symmetrical PeerRelationships into symmetrical Edges
        relationships = PeerRelationship.objects.filter(source__status='success', target__status='success')
        # Loop over once and put 'em into a dict for fast access
        relationships = {(r.source_id, r.target_id): r for r in relationships}

        edges = []
        while relationships:
            (source_id, target_id), outgoing = relationships.popitem()
            total_statuses = outgoing.statuses_seen or 0
            mention_count = outgoing.mention_count or 0
            incoming = relationships.pop((target_id, source_id), None)
            oldest_data = outgoing.last_updated
            if incoming:
                total_statuses += (incoming.statuses_seen or 0)
                mention_count += (incoming.mention_count or 0)
                oldest_data = min(oldest_data, incoming.last_updated)
            if mention_count == 0 or total_statuses == 0:
                continue
            ratio = float(mention_count)/total_statuses
            edges.append(Edge(source_id=source_id, target_id=target_id, weight=ratio, last_updated=oldest_data))

        Edge.objects.all().delete()
        Edge.objects.bulk_create(edges)

        self.stdout.write("Creating layout...")
        database_config = settings.DATABASES['default']
        subprocess.call([
            'java',
            '-Xmx1g',
            '-jar',
            'gephi/build/libs/graphBuilder.jar',
            database_config['NAME'],
            database_config['USER'],
            database_config['PASSWORD'],
        ])
