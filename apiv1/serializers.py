from rest_framework import serializers
from scraper.models import Instance, InstanceStats


class InstanceStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstanceStats
        exclude = ('id', 'instance', 'status')


class InstanceListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instance
        fields = ('name', )


class InstanceDetailSerializer(serializers.ModelSerializer):
    peers = InstanceListSerializer(many=True, read_only=True)
    stats = InstanceStatsSerializer(many=True, read_only=True)

    class Meta:
        model = Instance
        fields = ('name', 'stats', 'peers')
