"""
Schools API v1 URL configuration.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.schools.api.v1.views import (
    SchoolInfrastructureViewSet,
    SchoolProfileViewSet,
    SchoolViewSet,
)

app_name = "schools"

router = DefaultRouter()
router.register("schools", SchoolViewSet, basename="school")
router.register("profiles", SchoolProfileViewSet, basename="school-profile")
router.register("infrastructure", SchoolInfrastructureViewSet, basename="school-infrastructure")

urlpatterns = [
    path("", include(router.urls)),
]
