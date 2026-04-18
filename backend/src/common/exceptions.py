"""
Standardized exception handling for the InfraRakshak REST API.

All API errors follow a consistent structure:
{
    "error": "Human-readable error summary",
    "details": { ... }  // field-level or extra details
}
"""

import logging
from typing import Any

from django.core.exceptions import PermissionDenied, ValidationError
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("django")


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    """
    DRF-compatible exception handler that normalises every error
    into ``{"error": ..., "details": ...}`` format.
    """

    # Let DRF handle its own exceptions first
    response = exception_handler(exc, context)

    if response is not None:
        # ── DRF-recognised exception ──────────────────────────────
        error_data = _normalise_drf_error(response)
        response.data = error_data
        return response

    # ── Django ValidationError (from model .clean()) ──────────────
    if isinstance(exc, ValidationError):
        details = exc.message_dict if hasattr(exc, "message_dict") else {"non_field_errors": exc.messages}
        return Response(
            {"error": "Validation error", "details": details},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ── Django 404 ────────────────────────────────────────────────
    if isinstance(exc, Http404):
        return Response(
            {"error": "Not found", "details": {}},
            status=status.HTTP_404_NOT_FOUND,
        )

    # ── Django PermissionDenied ───────────────────────────────────
    if isinstance(exc, PermissionDenied):
        return Response(
            {"error": "Permission denied", "details": {}},
            status=status.HTTP_403_FORBIDDEN,
        )

    # ── Unhandled — log and return 500 ────────────────────────────
    logger.exception("Unhandled exception in API view: %s", exc)
    return Response(
        {"error": "Internal server error", "details": {}},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _normalise_drf_error(response: Response) -> dict[str, Any]:
    """Convert DRF's default error payload into our standard structure."""

    data = response.data

    # DRF sometimes returns {"detail": "..."} for auth / throttle errors
    if isinstance(data, dict) and "detail" in data:
        return {
            "error": str(data["detail"]),
            "details": {k: v for k, v in data.items() if k != "detail"},
        }

    # DRF validation errors: {"field": ["msg", ...], ...}
    if isinstance(data, dict):
        return {"error": "Validation error", "details": data}

    # List of errors (rare)
    if isinstance(data, list):
        return {"error": "Validation error", "details": {"non_field_errors": data}}

    return {"error": str(data), "details": {}}
