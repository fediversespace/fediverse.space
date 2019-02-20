"""backend URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework import routers
from apiv1 import views


class OptionalTrailingSlashRouter(routers.DefaultRouter):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = r'/?'


router = OptionalTrailingSlashRouter()
router.register(r'instances', views.InstanceViewSet)
router.register(r'graph/nodes', views.NodeView)
router.register(r'graph/edges', views.EdgeView, base_name='edge')

urlpatterns = [
    path('api/v1/', include(router.urls)),
    path('silk/', include('silk.urls', namespace='silk')),
    path('', TemplateView.as_view(template_name='index.html')),
]
