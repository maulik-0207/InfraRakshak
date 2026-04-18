"""
Predictions API v1 URL configuration.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.predictions.api.v1.views import (
    DistrictReportViewSet,
    PredictionIssuesViewSet,
    PredictionReportViewSet,
)

app_name = "predictions"

router = DefaultRouter()
router.register("reports", PredictionReportViewSet, basename="prediction-report")
router.register("issues", PredictionIssuesViewSet, basename="prediction-issue")
router.register("district-reports", DistrictReportViewSet, basename="district-report")

urlpatterns = [
    path("", include(router.urls)),
]
