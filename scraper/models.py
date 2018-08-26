from django.db import models


class Instance(models.Model):
    name = models.CharField(max_length=200)
    peers = models.ManyToManyField('self', related_name='followers', symmetrical=False)


class InstanceStats(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    instance = models.ForeignKey(
        'Instance',
        on_delete=models.CASCADE,
    )
    num_peers = models.IntegerField()
    num_statuses = models.IntegerField()
    num_users = models.IntegerField()
    version = models.CharField(max_length=1000)
    status = models.CharField(max_length=100)
