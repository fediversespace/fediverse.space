from django.shortcuts import render
from rest_framework import viewsets
from scraper.models import Instance
from apiv1.serializers import InstanceSerializer


class InstanceViewSet(viewsets.ModelViewSet):
    """API endpoint to view instance details"""
    queryset = Instance.objects.all()
    serializer_class = InstanceSerializer

