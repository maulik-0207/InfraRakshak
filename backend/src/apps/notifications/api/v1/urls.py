"""
Notifications API v1 URL configuration.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.notifications.api.v1.views import NotificationViewSet

app_name = "notifications"

router = DefaultRouter()
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("", include(router.urls)),
]
