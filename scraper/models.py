from django.db import models


class Instance(models.Model):
    name = models.CharField(max_length=200, primary_key=True)
    peers = models.ManyToManyField('self', symmetrical=False)


class InstanceStats(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    instance = models.ForeignKey(
        Instance,
        on_delete=models.CASCADE,
    )
    num_peers = models.IntegerField(blank=True, null=True)
    num_statuses = models.IntegerField(blank=True, null=True)
    num_users = models.IntegerField(blank=True, null=True)
    version = models.CharField(max_length=1000, blank=True)
    status = models.CharField(max_length=100)
