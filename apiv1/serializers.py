from rest_framework import serializers
from scraper.models import Instance


class InstanceSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Instance
        fields = ('name', 'peers')
