from django.db import models
from django.utils import timezone


class Instance(models.Model):
    """
    The main model that saves details of an instance and links between them in the peers
    property.

    Don't change the schema without verifying that the gephi script can still read the data.
    """
    # Primary key
    name = models.CharField(max_length=200, primary_key=True)

    # Details
    description = models.TextField(blank=True)
    domain_count = models.IntegerField(blank=True, null=True)
    status_count = models.IntegerField(blank=True, null=True)
    user_count = models.IntegerField(blank=True, null=True)
    version = models.CharField(max_length=1000, blank=True)  # In Django CharField is never stored as NULL in the db
    status = models.CharField(max_length=100)

    # Foreign keys
    peers = models.ManyToManyField('self', symmetrical=False, through='PeerRelationship')

    # Graph
    x_coord = models.FloatField(blank=True, null=True)
    y_coord = models.FloatField(blank=True, null=True)

    # Automatic fields
    first_seen = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(default=timezone.now)


class PeerRelationship(models.Model):
    source = models.ForeignKey(Instance, related_name="following_relationship", on_delete=models.CASCADE)
    target = models.ForeignKey(Instance, related_name="follower_relationships", on_delete=models.CASCADE)

    # Interaction stats
    mention_count = models.IntegerField(default=0)
    statuses_seen = models.IntegerField(default=0)  # because we want mention_count as a ratio

    # Metadata
    first_seen = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(default=timezone.now)


class Edge(models.Model):
    """
    This class is automatically generated from PeerRelationship using the build_edges command.
    It aggregates stats from the asymmetrical PeerRelationship to a symmetrical one that's suitable for serving
    to the front-end.
    """
    source = models.ForeignKey(Instance, related_name='+', on_delete=models.CASCADE)
    target = models.ForeignKey(Instance, related_name='+', on_delete=models.CASCADE)
    weight = models.FloatField(blank=True, null=True)

    # Metadata
    last_updated = models.DateTimeField(default=timezone.now)
