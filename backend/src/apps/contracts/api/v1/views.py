"""
Contracts API v1 views.
"""

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)
from django.conf import settings
from rest_framework import parsers, viewsets, permissions
from rest_framework.decorators import action
from common.permissions import (
    IsSchool, IsDEO, IsAdminStaff, IsContractor,
    IsDEOOrAdminStaff, IsOwnerOrAdmin
)

from apps.contracts.api.v1.serializers import (
    ContractAssignmentSerializer,
    ContractBidSerializer,
    ContractDetailSerializer,
    ContractListSerializer,
    ContractPaymentSerializer,
    WorkProgressSerializer,
    WorkProofSerializer,
    WorkVerificationSerializer,
)
from apps.contracts.models import (
    Contract,
    ContractAssignment,
    ContractBid,
    ContractPayment,
    WorkProgress,
    WorkVerification,
    WorkProof,
)
from apps.contracts.services import ContractLifecycleService
from common.export import export_queryset_to_csv as export_queryset_to_excel
from rest_framework.response import Response

User = settings.AUTH_USER_MODEL


# ===========================================================================
# Contract
# ===========================================================================

@extend_schema_view(
    list=extend_schema(
        summary="List contracts",
        description="Paginated list of contracts. Filter by status, category, priority, or school.",
        tags=["Contracts"],
        parameters=[
            OpenApiParameter("school", type=int, description="Filter by School ID"),
            OpenApiParameter("status", type=str, description="Filter by status (OPEN, IN_BIDDING, etc.)"),
            OpenApiParameter("category", type=str, description="Filter by category (PLUMBING, etc.)"),
            OpenApiParameter("priority_level", type=str, description="Filter by priority (LOW, MEDIUM, HIGH)"),
        ]
    ),
    retrieve=extend_schema(
        summary="Get contract with full lifecycle",
        description=(
            "Returns the contract with all nested lifecycle data:\n"
            "bids, assignment, progress updates, work proofs, verifications, and payments."
        ),
        tags=["Contracts"],
        responses={200: ContractDetailSerializer},
    ),
    create=extend_schema(
        summary="Create a new contract",
        description=(
            "Create a new infrastructure contract for a school.\n\n"
            "**Validation rules:**\n"
            "- `estimated_cost` must be positive\n"
            "- `bid_end_date` must be >= `bid_start_date`\n"
            "- `category`: PLUMBING | ELECTRICAL | STRUCTURAL\n"
            "- `status`: OPEN | IN_BIDDING | AWARDED | IN_PROGRESS | COMPLETED | CANCELLED"
        ),
        tags=["Contracts"],
        examples=[
            OpenApiExample(
                "Create Contract",
                value={
                    "school": 1,
                    "title": "Boys Toilet Block Plumbing Repair",
                    "description": "Complete overhaul of plumbing in boys toilet block.",
                    "category": "PLUMBING",
                    "estimated_cost": "150000.00",
                    "priority_level": "HIGH",
                    "bid_start_date": "2025-04-25",
                    "bid_end_date": "2025-05-05",
                    "created_by": 1,
                },
                request_only=True,
            ),
        ],
    ),
    update=extend_schema(summary="Update contract", tags=["Contracts"]),
    partial_update=extend_schema(summary="Partially update contract", tags=["Contracts"]),
    destroy=extend_schema(summary="Delete contract", tags=["Contracts"]),
)
class ContractViewSet(viewsets.ModelViewSet):
    """
    Contract CRUD with full lifecycle nesting on detail view.

    **Lifecycle:** Open → In Bidding → Awarded → In Progress → Completed
    """

    queryset = Contract.objects.select_related(
        "school", "prediction_report", "created_by", "assignment",
    ).prefetch_related(
        "bids", "progress_updates", "proofs", "verifications", "payments",
    ).all()

    search_fields = ["title", "school__name"]
    filterset_fields = ["school", "category", "priority_level"]
    ordering_fields = ["created_at", "estimated_cost", "priority_level"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsContractor]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        # DEO/Admin Staff see everything
        if user.role in [user.Role.DEO, user.Role.ADMIN_STAFF]:
            return qs
            
        # Contractors see Open contracts OR those assigned to them
        if user.role == user.Role.CONTRACTOR:
            from django.db.models import Q
            qs = qs.filter(
                Q(status__in=["OPEN", "IN_BIDDING"]) |
                Q(assignment__contractor__user=user)
            ).distinct()
            
        # Optional: Handle multiple status parameters in query string
        statuses = self.request.query_params.getlist("status")
        if statuses:
            qs = qs.filter(status__in=statuses)
            
        # Schools see contracts for their school
        if user.role == user.Role.SCHOOL:
            if hasattr(user, 'school_profile'):
                qs = qs.filter(school__udise_code=user.school_profile.udise_code)
        
        return qs

    @extend_schema(summary="Export contracts to CSV", tags=["Contracts"])
    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        fields = ["title", "school__name", "category", "estimated_cost", "status", "priority_level"]
        return export_queryset_to_excel(queryset, fields, filename_prefix="contracts_registry")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ContractDetailSerializer
        return ContractListSerializer

    @extend_schema(summary="Delete contract forcefully", tags=["Contracts"])
    def destroy(self, request, *args, **kwargs):
        """
        Manually handle the cascaded deletion of protected relationships 
        like Assignments, preventing ProtectedError constraint blocks.
        """
        instance = self.get_object()
        
        # 1. Safely break protected links in assignments before main deletion
        try:
            if hasattr(instance, 'assignment') and instance.assignment:
                instance.assignment.delete()
        except Exception:
            pass
            
        # 2. Main Contract deletion (which cascades directly to remaining bids)
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ===========================================================================
# Contract Bid
# ===========================================================================

@extend_schema_view(
    list=extend_schema(summary="List bids", tags=["Contracts"]),
    retrieve=extend_schema(summary="Get bid details", tags=["Contracts"]),
    create=extend_schema(
        summary="Submit a bid",
        description=(
            "Submit a bid on a contract.\n\n"
            "**Constraints:**\n"
            "- One bid per contractor per contract (unique constraint)\n"
            "- `bid_amount` must be positive"
        ),
        tags=["Contracts"],
        examples=[
            OpenApiExample(
                "Submit Bid",
                value={
                    "contract": 1,
                    "contractor": 1,
                    "bid_amount": "125000.00",
                    "estimated_days": 30,
                    "proposal_text": "We can complete the plumbing repair within 30 days using quality materials.",
                },
                request_only=True,
            ),
        ],
    ),
    update=extend_schema(summary="Update bid", tags=["Contracts"]),
    partial_update=extend_schema(summary="Partially update bid", tags=["Contracts"]),
    destroy=extend_schema(summary="Withdraw bid", tags=["Contracts"]),
)
class ContractBidViewSet(viewsets.ModelViewSet):
    """CRUD for contract bids. Unique per (contract, contractor)."""

    queryset = ContractBid.objects.select_related("contract", "contractor").all()
    serializer_class = ContractBidSerializer
    ordering_fields = ["bid_amount", "submitted_at"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsContractor]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        if user.role in [user.Role.DEO, user.Role.ADMIN_STAFF]:
            return qs
            
        if user.role == user.Role.CONTRACTOR:
            return qs.filter(contractor__user=user)
            
        if user.role == user.Role.SCHOOL:
            # Schools see bids for their contracts
            if hasattr(user, 'school_profile'):
                return qs.filter(contract__school__udise_code=user.school_profile.udise_code)
        
        return qs.none()

    def perform_create(self, serializer):
        # We use the return value of the service to update the serializer instance
        # so DRF responds with the correct created object
        bid = ContractLifecycleService.submit_bid(
            user=self.request.user,
            contract_id=serializer.validated_data["contract"].id,
            quote=float(serializer.validated_data["bid_amount"]),
            estimated_days=serializer.validated_data.get("estimated_days", 30)
        )
        serializer.instance = bid

    @extend_schema(
        summary="Award contract to this bid",
        description="Selects this bid as the winner and updates the contract status to AWARDED.",
        tags=["Contracts Workflow"],
        request=None,
        responses={200: ContractBidSerializer},
    )
    @action(detail=True, methods=["post"], url_path="award")
    def award(self, request, pk=None):
        contract = ContractLifecycleService.award_contract(
            bid_id=pk,
            awarded_by=request.user
        )
        # Re-fetch the bid to show updated status
        from apps.contracts.models import ContractBid
        bid = ContractBid.objects.get(id=pk)
        serializer = self.get_serializer(bid)
        return Response(serializer.data)


# ===========================================================================
# Contract Assignment
# ===========================================================================

@extend_schema_view(
    list=extend_schema(summary="List assignments", tags=["Contracts"]),
    retrieve=extend_schema(summary="Get assignment details", tags=["Contracts"]),
    create=extend_schema(
        summary="Assign contract to contractor",
        description="Award a contract to the winning bidder. One assignment per contract.",
        tags=["Contracts"],
    ),
    update=extend_schema(summary="Update assignment", tags=["Contracts"]),
    partial_update=extend_schema(summary="Partially update assignment", tags=["Contracts"]),
    destroy=extend_schema(summary="Remove assignment", tags=["Contracts"]),
)
class ContractAssignmentViewSet(viewsets.ModelViewSet):
    """CRUD for contract assignments (one-to-one per contract)."""

    queryset = ContractAssignment.objects.select_related("contract", "contractor", "bid").all()
    serializer_class = ContractAssignmentSerializer
    filterset_fields = ["contract", "contractor"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff]


# ===========================================================================
# Work Progress
# ===========================================================================

@extend_schema_view(
    list=extend_schema(summary="List progress updates", tags=["Contracts"]),
    retrieve=extend_schema(summary="Get progress update", tags=["Contracts"]),
    create=extend_schema(
        summary="Submit progress update",
        description="`progress_percentage` must be 0–100.",
        tags=["Contracts"],
        examples=[
            OpenApiExample(
                "Progress Update",
                value={
                    "contract": 1,
                    "progress_percentage": 45,
                    "status": "IN_PROGRESS",
                    "update_note": "Pipe replacement 45% complete. New fixtures installed.",
                    "updated_by": 1,
                },
                request_only=True,
            ),
        ],
    ),
    update=extend_schema(summary="Update progress", tags=["Contracts"]),
    partial_update=extend_schema(summary="Partially update progress", tags=["Contracts"]),
    destroy=extend_schema(summary="Delete progress update", tags=["Contracts"]),
)
class WorkProgressViewSet(viewsets.ModelViewSet):
    """CRUD for work progress updates on contracts."""

    queryset = WorkProgress.objects.select_related("contract", "updated_by").all()
    serializer_class = WorkProgressSerializer
    filterset_fields = ["contract", "status"]
    ordering_fields = ["progress_percentage", "updated_at"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsContractor]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        if user.role in [user.Role.DEO, user.Role.ADMIN_STAFF]:
            return qs
            
        if user.role == user.Role.CONTRACTOR:
            return qs.filter(contract__assignment__contractor__user=user)
            
        if user.role == user.Role.SCHOOL:
            if hasattr(user, 'school_profile'):
                return qs.filter(contract__school__udise_code=user.school_profile.udise_code)
                
        return qs.none()

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)


# ===========================================================================
# Work Proof (File Upload)
# ===========================================================================

@extend_schema_view(
    list=extend_schema(summary="List work proofs", tags=["Contracts"]),
    retrieve=extend_schema(summary="Get work proof", tags=["Contracts"]),
    create=extend_schema(
        summary="Upload work proof",
        description=(
            "Upload evidence files for a contract.\n\n"
            "**Request format:** `multipart/form-data`\n\n"
            "**File constraints:**\n"
            "- Maximum size: 10 MB\n"
            "- Allowed types: jpg, jpeg, png, gif, webp, mp4, avi, mov, mkv, pdf, doc, docx\n"
            "- `file_type`: IMAGE | VIDEO | DOCUMENT"
        ),
        tags=["Contracts"],
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "contract": {"type": "integer", "description": "Contract ID"},
                    "file": {"type": "string", "format": "binary", "description": "File to upload (max 10MB)"},
                    "file_type": {"type": "string", "enum": ["IMAGE", "VIDEO", "DOCUMENT"]},
                    "description": {"type": "string"},
                    "uploaded_by": {"type": "integer", "description": "User ID"},
                },
                "required": ["contract", "file", "file_type", "uploaded_by"],
            },
        },
    ),
    update=extend_schema(summary="Update work proof", tags=["Contracts"]),
    partial_update=extend_schema(summary="Partially update work proof", tags=["Contracts"]),
    destroy=extend_schema(summary="Delete work proof", tags=["Contracts"]),
)
class WorkProofViewSet(viewsets.ModelViewSet):
    """
    CRUD for work proof file uploads.

    Accepts multipart/form-data for file uploads.
    Files are stored at: `media/contracts/<contract_id>/<filename>`
    """

    queryset = WorkProof.objects.select_related("contract", "uploaded_by").all()
    serializer_class = WorkProofSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    ordering_fields = ["uploaded_at"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsContractor]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        if user.role in [user.Role.DEO, user.Role.ADMIN_STAFF]:
            return qs
            
        if user.role == user.Role.CONTRACTOR:
            return qs.filter(contract__assignment__contractor__user=user)
            
        if user.role == user.Role.SCHOOL:
            if hasattr(user, 'school_profile'):
                return qs.filter(contract__school__udise_code=user.school_profile.udise_code)
                
        return qs.none()

    def perform_create(self, serializer):
        # Extract progress percentage from request data if available, default to 100 if final proof
        progress = self.request.data.get("progress_percentage", 100)
        
        ContractLifecycleService.upload_work_proof(
            contract_id=serializer.validated_data["contract"].id,
            user=self.request.user,
            file=serializer.validated_data["file"],
            progress_percent=int(progress),
            comment=serializer.validated_data.get("description", "")
        )


# ===========================================================================
# Work Verification
# ===========================================================================

@extend_schema_view(
    list=extend_schema(summary="List verifications", tags=["Contracts"]),
    retrieve=extend_schema(summary="Get verification details", tags=["Contracts"]),
    create=extend_schema(
        summary="Submit verification",
        description="DEO or official verifies the completed work.",
        tags=["Contracts"],
    ),
    update=extend_schema(summary="Update verification", tags=["Contracts"]),
    partial_update=extend_schema(summary="Partially update verification", tags=["Contracts"]),
    destroy=extend_schema(summary="Delete verification", tags=["Contracts"]),
)
class WorkVerificationViewSet(viewsets.ModelViewSet):
    """CRUD for work verification records."""

    queryset = WorkVerification.objects.select_related("contract", "verified_by").all()
    serializer_class = WorkVerificationSerializer
    filterset_fields = ["contract", "verification_status"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff]


# ===========================================================================
# Contract Payment
# ===========================================================================

@extend_schema_view(
    list=extend_schema(summary="List payments", tags=["Contracts"]),
    retrieve=extend_schema(summary="Get payment details", tags=["Contracts"]),
    create=extend_schema(
        summary="Record payment",
        description="`amount` must be positive. Status: PENDING | PARTIAL | PAID.",
        tags=["Contracts"],
        examples=[
            OpenApiExample(
                "Record Payment",
                value={
                    "contract": 1,
                    "amount": "75000.00",
                    "payment_status": "PARTIAL",
                    "transaction_reference": "UPI-REF-20250418-001",
                    "paid_at": "2025-04-18T10:30:00Z",
                },
                request_only=True,
            ),
        ],
    ),
    update=extend_schema(summary="Update payment", tags=["Contracts"]),
    partial_update=extend_schema(summary="Partially update payment", tags=["Contracts"]),
    destroy=extend_schema(summary="Delete payment", tags=["Contracts"]),
)
class ContractPaymentViewSet(viewsets.ModelViewSet):
    """CRUD for contract payment records."""

    queryset = ContractPayment.objects.select_related("contract").all()
    serializer_class = ContractPaymentSerializer
    filterset_fields = ["contract", "payment_status"]
    ordering_fields = ["paid_at", "amount"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff]
    """CRUD for contract payment records."""

    queryset = ContractPayment.objects.select_related("contract").all()
    serializer_class = ContractPaymentSerializer
    filterset_fields = ["contract", "payment_status"]
    ordering_fields = ["paid_at", "amount"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff]
