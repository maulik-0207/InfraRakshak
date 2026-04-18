"""
Contracts API v1 URL configuration.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.contracts.api.v1.views import (
    ContractAssignmentViewSet,
    ContractBidViewSet,
    ContractPaymentViewSet,
    ContractViewSet,
    WorkProgressViewSet,
    WorkProofViewSet,
    WorkVerificationViewSet,
)

app_name = "contracts"

router = DefaultRouter()
router.register("contracts", ContractViewSet, basename="contract")
router.register("bids", ContractBidViewSet, basename="contract-bid")
router.register("assignments", ContractAssignmentViewSet, basename="contract-assignment")
router.register("progress", WorkProgressViewSet, basename="work-progress")
router.register("proofs", WorkProofViewSet, basename="work-proof")
router.register("verifications", WorkVerificationViewSet, basename="work-verification")
router.register("payments", ContractPaymentViewSet, basename="contract-payment")

urlpatterns = [
    path("", include(router.urls)),
]
