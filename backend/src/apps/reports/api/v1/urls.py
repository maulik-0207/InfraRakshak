"""
Reports API v1 URL configuration.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.reports.api.v1.views import (
    WeeklyElectricalReportViewSet,
    WeeklyIssuesViewSet,
    WeeklyPlumbingReportViewSet,
    WeeklyReportViewSet,
    WeeklyStructuralReportViewSet,
)

app_name = "reports"

router = DefaultRouter()
router.register("weekly-reports", WeeklyReportViewSet, basename="weekly-report")
router.register("plumbing-reports", WeeklyPlumbingReportViewSet, basename="plumbing-report")
router.register("electrical-reports", WeeklyElectricalReportViewSet, basename="electrical-report")
router.register("structural-reports", WeeklyStructuralReportViewSet, basename="structural-report")
router.register("issues", WeeklyIssuesViewSet, basename="weekly-issue")

urlpatterns = [
    path("", include(router.urls)),
]
