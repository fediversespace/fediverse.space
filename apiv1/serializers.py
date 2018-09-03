from rest_framework import serializers
import math
from collections import OrderedDict
from scraper.models import Instance, Edge


class InstanceListSerializer(serializers.ModelSerializer):
    """
    Minimal instance details used in the full list of instances.
    """
    class Meta:
        model = Instance
        fields = ('name', 'user_count')

    def to_representation(self, instance):
        """
        Object instance -> Dict of primitive datatypes.
        We use a custom to_representation function to exclude empty fields in the serialized JSON.
        """
        ret = super(InstanceListSerializer, self).to_representation(instance)
        ret = OrderedDict(list(filter(lambda x: x[1], ret.items())))
        return ret


class InstanceDetailSerializer(serializers.ModelSerializer):
    """
    Detailed instance view.
    """
    userCount = serializers.SerializerMethodField()
    statusCount = serializers.SerializerMethodField()
    domainCount = serializers.SerializerMethodField()
    lastUpdated = serializers.SerializerMethodField()
    peers = InstanceListSerializer(many=True, read_only=True)

    def get_userCount(self, obj):
        return obj.user_count

    def get_statusCount(self, obj):
        return obj.status_count

    def get_domainCount(self, obj):
        return obj.domain_count

    def get_lastUpdated(self, obj):
        return obj.last_updated

    class Meta:
        model = Instance
        fields = ('name', 'description', 'version', 'userCount',
                  'statusCount', 'domainCount', 'peers', 'lastUpdated',
                  'status')


class EdgeSerializer(serializers.ModelSerializer):
    """
    Used for displaying the graph.
    """
    id = serializers.SerializerMethodField('get_pk')
    size = serializers.SerializerMethodField('get_weight')

    class Meta:
        model = Edge
        fields = ('source', 'target', 'id', 'size')

    def get_pk(self, obj):
        return obj.pk

    def get_weight(self, obj):
        return obj.weight


class NodeSerializer(serializers.ModelSerializer):
    """
    Used for displaying the graph.
    """
    id = serializers.SerializerMethodField('get_name')
    label = serializers.SerializerMethodField('get_name')
    size = serializers.SerializerMethodField()
    x = serializers.SerializerMethodField()
    y = serializers.SerializerMethodField()

    class Meta:
        model = Instance
        fields = ('id', 'label', 'size', 'x', 'y')

    def get_name(self, obj):
        return obj.name

    def get_size(self, obj):
        return math.log(obj.user_count) if obj.user_count else 1

    def get_x(self, obj):
        return obj.x_coord

    def get_y(self, obj):
        return obj.y_coord

    def to_representation(self, instance):
        """
        Object instance -> Dict of primitive datatypes.
        We use a custom to_representation function to exclude empty fields in the serialized JSON.
        """
        ret = super(NodeSerializer, self).to_representation(instance)
        ret = OrderedDict(list(filter(lambda x: x[1], ret.items())))
        return ret
