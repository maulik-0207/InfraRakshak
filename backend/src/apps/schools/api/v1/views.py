"""
Schools API v1 views.
"""

from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import viewsets

from apps.schools.api.v1.serializers import (
    SchoolInfrastructureSerializer,
    SchoolProfileSerializer,
    SchoolSerializer,
    SchoolRegistrationRequestSerializer,
)
from apps.schools.models import School, SchoolInfrastructure, SchoolProfile, SchoolRegistrationRequest
from apps.schools.services import SchoolWorkflowService


@extend_schema_view(
    list=extend_schema(
        summary="List all schools",
        description="Returns a paginated list of schools. Filter by district, block, or type.",
        tags=["Schools"],
        parameters=[
            OpenApiParameter("district", type=str, description="Filter by district name"),
            OpenApiParameter("block", type=str, description="Filter by block/tehsil"),
            OpenApiParameter("school_type", type=str, description="Filter by type (PRIMARY, SECONDARY, etc.)"),
        ]
    ),
    retrieve=extend_schema(summary="Get school details", tags=["Schools"]),
    create=extend_schema(
        summary="Register a new school",
        tags=["Schools"],
        examples=[
            OpenApiExample(
                "Create School",
                value={
                    "udise_code": "24010100301",
                    "name": "Government Primary School, Gandhinagar",
                    "address": "Sector 12, Gandhinagar",
                    "district": "Gandhinagar",
                    "block": "Gandhinagar City",
                    "pincode": "382012",
                    "latitude": "23.2156",
                    "longitude": "72.6369",
                    "school_type": "PRIMARY",
                },
                request_only=True,
            ),
        ],
    ),
    update=extend_schema(summary="Update school", tags=["Schools"]),
    partial_update=extend_schema(summary="Partially update school", tags=["Schools"]),
    destroy=extend_schema(summary="Delete school", tags=["Schools"]),
)
class SchoolViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for schools.

    Schools are uniquely identified by their UDISE code.
    """

    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    search_fields = ["name", "udise_code", "district"]
    filterset_fields = ["district", "block", "school_type"]
    ordering_fields = ["name", "district", "created_at"]
    def perform_create(self, serializer):
        """Overrides create to use the workflow service."""
        SchoolWorkflowService.submit_registration(
            user=self.request.user,
            school_data=serializer.validated_data
        )


@extend_schema_view(
    list=extend_schema(summary="List school profiles", tags=["Schools"]),
    retrieve=extend_schema(summary="Get school profile", tags=["Schools"]),
    create=extend_schema(
        summary="Create school profile",
        description=(
            "Create a demographic profile for a school.\n\n"
            "**Validation rules:**\n"
            "- `total_boys + total_girls` <= `total_students`\n"
            "- `functional_classrooms` <= `classrooms_count`"
        ),
        tags=["Schools"],
    ),
    update=extend_schema(summary="Update school profile", tags=["Schools"]),
    partial_update=extend_schema(summary="Partially update school profile", tags=["Schools"]),
    destroy=extend_schema(summary="Delete school profile", tags=["Schools"]),
)
class SchoolProfileViewSet(viewsets.ModelViewSet):
    """CRUD for school demographic profiles (one-to-one with School)."""

    queryset = SchoolProfile.objects.select_related("school").all()
    serializer_class = SchoolProfileSerializer
    search_fields = ["school__name", "school__udise_code"]
    filterset_fields = ["area_type", "academic_year"]


@extend_schema_view(
    list=extend_schema(
        summary="List infrastructure surveys",
        description="Returns all infrastructure survey records. Filter by school or date.",
        tags=["Schools"],
    ),
    retrieve=extend_schema(summary="Get infrastructure survey details", tags=["Schools"]),
    create=extend_schema(
        summary="Submit infrastructure survey",
        description=(
            "Submit a new infrastructure survey for a school.\n\n"
            "**Validation rules:**\n"
            "- `boys_toilets_functional` <= `boys_toilets_total`\n"
            "- `girls_toilets_functional` <= `girls_toilets_total`\n"
            "- `toilet_cleanliness` and `campus_cleanliness`: 1–5 rating"
        ),
        tags=["Schools"],
    ),
    update=extend_schema(summary="Update infrastructure survey", tags=["Schools"]),
    partial_update=extend_schema(summary="Partially update survey", tags=["Schools"]),
    destroy=extend_schema(summary="Delete infrastructure survey", tags=["Schools"]),
)
class SchoolInfrastructureViewSet(viewsets.ModelViewSet):
    """CRUD for infrastructure survey records."""

    queryset = SchoolInfrastructure.objects.select_related("school", "submitted_by").all()
    serializer_class = SchoolInfrastructureSerializer
    search_fields = ["school__name", "school__udise_code"]
    filterset_fields = ["school", "building_condition", "wiring_condition", "survey_date"]
    ordering_fields = ["survey_date", "inspection_score"]

# ===========================================================================
# Registration Request ViewSet
# ===========================================================================

from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status


@extend_schema_view(
    list=extend_schema(
        summary="List registration requests", 
        tags=["Schools Workflow"],
        parameters=[
            OpenApiParameter("status", type=str, description="Filter by status (PENDING, APPROVED, REJECTED)"),
        ]
    ),
    retrieve=extend_schema(summary="Get registration request details", tags=["Schools Workflow"]),
)
class SchoolRegistrationRequestViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for tracking school registration requests.
    DEOs and Admins can approve or reject these requests.
    """

    queryset = SchoolRegistrationRequest.objects.select_related("school", "submitted_by").all()
    serializer_class = SchoolRegistrationRequestSerializer

    @extend_schema(
        summary="Approve or Reject registration",
        description="Process a pending school registration request.",
        tags=["Schools Workflow"],
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "status": {"type": "string", "enum": ["APPROVED", "REJECTED"]},
                    "reason": {"type": "string"}
                },
                "required": ["status"]
            }
        },
        responses={200: SchoolRegistrationRequestSerializer},
    )
    @action(detail=True, methods=["post"], url_path="process")
    def process(self, request, pk=None):
        status_val = request.data.get("status")
        reason = request.data.get("reason", "")
        
        if status_val not in ["APPROVED", "REJECTED"]:
            return Response(
                {"error": "Invalid status. Must be APPROVED or REJECTED."},
                status=status.HTTP_400_BAD_REQUEST
            )

        processed_req = SchoolWorkflowService.process_request(
            request_id=pk,
            processed_by=request.user,
            status=status_val,
            reason=reason
        )
        
        serializer = self.get_serializer(processed_req)
        return Response(serializer.data)
