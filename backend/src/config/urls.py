"""
URL configuration for InfraRakshak project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0.4/topics/http/urls/
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    # ── Admin ──────────────────────────────────────────────────────
    path("admin/", admin.site.urls),

    # ── API Documentation ─────────────────────────────────────────
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # ── JWT Authentication ────────────────────────────────────────
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),

    # ── App APIs (v1) ─────────────────────────────────────────────
    path("api/v1/accounts/", include("apps.accounts.api.v1.urls")),
    path("api/v1/schools/", include("apps.schools.api.v1.urls")),
    path("api/v1/reports/", include("apps.reports.api.v1.urls")),
    path("api/v1/predictions/", include("apps.predictions.api.v1.urls")),
    path("api/v1/contracts/", include("apps.contracts.api.v1.urls")),
    path("api/v1/notifications/", include("apps.notifications.api.v1.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    urlpatterns += [
        path("__debug__/", include("debug_toolbar.urls")),
    ]
