from rest_framework import serializers
from collections import OrderedDict
from scraper.models import Instance, PeerRelationship


class InstanceListSerializer(serializers.ModelSerializer):
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
    peers = InstanceListSerializer(many=True, read_only=True)

    class Meta:
        model = Instance
        fields = '__all__'


class EdgeSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField('get_pk')

    class Meta:
        model = PeerRelationship
        fields = ('source', 'target', 'id')

    def get_pk(self, obj):
        return obj.pk


class NodeSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField('get_name')
    label = serializers.SerializerMethodField('get_name')
    size = serializers.SerializerMethodField()

    class Meta:
        model = Instance
        fields = ('id', 'label', 'size')

    def get_name(self, obj):
        return obj.name

    def get_size(self, obj):
        return obj.user_count or 1

    def to_representation(self, instance):
        """
        Object instance -> Dict of primitive datatypes.
        We use a custom to_representation function to exclude empty fields in the serialized JSON.
        """
        ret = super(NodeSerializer, self).to_representation(instance)
        ret = OrderedDict(list(filter(lambda x: x[1], ret.items())))
        return ret
