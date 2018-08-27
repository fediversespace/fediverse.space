from rest_framework import viewsets
from scraper.models import Instance
from apiv1.serializers import InstanceListSerializer, InstanceDetailSerializer


class InstanceViewSet(viewsets.ModelViewSet):
    """API endpoint to view instances"""

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
