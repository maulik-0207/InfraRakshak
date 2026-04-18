"""
Accounts API v1 URL configuration.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.api.v1.views import (
    AdminStaffViewSet,
    ContractorViewSet,
    DEOViewSet,
    PrincipalViewSet,
    RoleViewSet,
    SchoolStaffViewSet,
    UserViewSet,
)

app_name = "accounts"

router = DefaultRouter()
router.register("roles", RoleViewSet, basename="role")
router.register("users", UserViewSet, basename="user")
router.register("principals", PrincipalViewSet, basename="principal")
router.register("school-staff", SchoolStaffViewSet, basename="school-staff")
router.register("contractors", ContractorViewSet, basename="contractor")
router.register("deos", DEOViewSet, basename="deo")
router.register("admin-staff", AdminStaffViewSet, basename="admin-staff")

urlpatterns = [
    path("", include(router.urls)),
]
