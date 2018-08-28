from rest_framework import serializers
from collections import OrderedDict
from scraper.models import Instance, InstanceStats


class InstanceStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstanceStats
        exclude = ('id', 'instance', 'status')


class InstanceListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instance
        fields = ('name', 'user_count')

    def to_representation(self, instance):
        """
        Object instance -> Dict of primitive datatypes.
        """
        ret = super(InstanceListSerializer, self).to_representation(instance)
        ret = OrderedDict(list(filter(lambda x: x[1], ret.items())))
        return ret


class InstanceDetailSerializer(serializers.ModelSerializer):
    peers = InstanceListSerializer(many=True, read_only=True)
    stats = InstanceStatsSerializer(many=True, read_only=True)

    class Meta:
        model = Instance
        fields = ('name', 'stats', 'peers')
