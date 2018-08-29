from django.db import models


class Instance(models.Model):
    # Primary key
    name = models.CharField(max_length=200, primary_key=True)

    # Details
    domain_count = models.IntegerField(blank=True, null=True)
    status_count = models.IntegerField(blank=True, null=True)
    user_count = models.IntegerField(blank=True, null=True)
    version = models.CharField(max_length=1000, blank=True)  # In Django CharField is never stored as NULL in the db
    status = models.CharField(max_length=100)

    # Foreign keys
    # The peers endpoint returns a "list of all domain names known to this instance"
    # (https://github.com/tootsuite/mastodon/pull/6125)
    # In other words, an asymmetrical relationship here doesn't make much sense. If we one day can get a list of
    # instances that the instance actively follows (i.e. knows and not suspended), it's worth adding an
    # asymmetrical relation.
    peers = models.ManyToManyField('self', symmetrical=True)

    # Automatic fields
    first_seen = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
