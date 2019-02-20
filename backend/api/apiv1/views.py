from rest_framework import viewsets
from scraper.models import Instance, Edge
from apiv1.serializers import InstanceListSerializer, InstanceDetailSerializer, NodeSerializer, EdgeSerializer


class InstanceViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint to view stats for, and the peers of, an instance"""

    lookup_field = 'name'
    lookup_value_regex = '[a-zA-Z0-9-_\.]+'

    queryset = Instance.objects.all()
    serializer_class = InstanceListSerializer
    detail_serializer_class = InstanceDetailSerializer  # this serializer also includes stats and a list of peers

    def get_serializer_class(self):
        if self.action == 'retrieve':
            if hasattr(self, 'detail_serializer_class'):
                return self.detail_serializer_class
        return self.serializer_class


class EdgeView(viewsets.ReadOnlyModelViewSet):
    """
    Endpoint to get a list of the graph's edges in a SigmaJS-friendly format.
    """
    queryset = Edge.objects.all()
    serializer_class = EdgeSerializer


class NodeView(viewsets.ReadOnlyModelViewSet):
    """
    Endpoint to get a list of the graph's nodes in a SigmaJS-friendly format.
    """
    queryset = Instance.objects.filter(status='success')
    serializer_class = NodeSerializer
