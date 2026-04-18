"""
Accounts API v1 URL configuration — Refactored.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.api.v1.views import (
    UserViewSet,
    SchoolRegistrationView,
    ContractorRegistrationView,
    BulkOnboardingView,
    SchoolAccountProfileViewSet,
    DEOProfileViewSet,
    ContractorProfileViewSet,
    AdminStaffProfileViewSet,
    StaffProfileViewSet,
    LogoutView,
    DashboardViewSet
)

app_name = "accounts"

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("profiles/schools", SchoolAccountProfileViewSet, basename="school-profile")
router.register("profiles/deos", DEOProfileViewSet, basename="deo-profile")
router.register("profiles/contractors", ContractorProfileViewSet, basename="contractor-profile")
router.register("profiles/admin-staff", AdminStaffProfileViewSet, basename="admin-staff-profile")
router.register("profiles/staff", StaffProfileViewSet, basename="staff-profile")
router.register("dashboard", DashboardViewSet, basename="dashboard")

urlpatterns = [
    # Auth & Registration
    path("register/school/", SchoolRegistrationView.as_view(), name="register-school"),
    path("register/contractor/", ContractorRegistrationView.as_view(), name="register-contractor"),
    path("onboard/bulk/", BulkOnboardingView.as_view(), name="onboard-bulk"),
    
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    
    # ViewSets
    path("", include(router.urls)),
]
