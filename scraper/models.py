from django.db import models


class Instance(models.Model):
    name = models.CharField(max_length=200, primary_key=True)
    peers = models.ManyToManyField('self', symmetrical=False)
    user_count = models.IntegerField(blank=True, null=True)


class InstanceStats(models.Model):
    # TODO: collect everything the API exposes
    timestamp = models.DateTimeField(auto_now_add=True)
    instance = models.ForeignKey(
        Instance,
        on_delete=models.CASCADE,
        related_name='stats',
    )
    domain_count = models.IntegerField(blank=True, null=True)
    status_count = models.IntegerField(blank=True, null=True)
    user_count = models.IntegerField(blank=True, null=True)
    version = models.CharField(max_length=1000, blank=True)  # In Django CharField is never stored as NULL in the db
    status = models.CharField(max_length=100)
