from django.db import models


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
    following = models.ManyToManyField('self', symmetrical=False, through='PeerRelationship', related_name="followers")

    # Automatic fields
    first_seen = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)


class PeerRelationship(models.Model):
    source = models.ForeignKey(Instance, related_name="following_relationship", on_delete=models.CASCADE)
    target = models.ForeignKey(Instance, related_name="follower_relationships", on_delete=models.CASCADE)

    # Metadata
    first_seen = models.DateTimeField(auto_now_add=True)
