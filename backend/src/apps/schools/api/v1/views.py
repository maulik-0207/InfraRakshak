"""
Schools API v1 views.
"""

from drf_spectacular.utils import OpenApiExample, OpenApiParameter, OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from common.permissions import (
    IsSchool, IsDEO, IsAdminStaff, IsSchoolStaff,
    IsDEOOrAdminStaff, IsSchoolOrStaff
)

from apps.schools.api.v1.serializers import (
    SchoolInfrastructureSerializer,
    SchoolProfileSerializer,
    SchoolSerializer,
    SchoolRegistrationRequestSerializer,
)
from apps.schools.models import School, SchoolInfrastructure, SchoolProfile, SchoolRegistrationRequest
from apps.schools.services import SchoolWorkflowService
from common.export import export_queryset_to_csv as export_queryset_to_excel


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
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsSchoolOrStaff]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        # DEO/Admin Staff can see schools in their district
        if user.role in [user.Role.DEO, user.Role.ADMIN_STAFF]:
            if hasattr(user, 'deo_profile'):
                return qs.filter(district=user.deo_profile.district)
            return qs.none()
            
        # School/Staff can only see their own school
        elif user.role in [user.Role.SCHOOL, user.Role.STAFF]:
            udise = None
            if hasattr(user, 'school_profile'):
                udise = user.school_profile.udise_code
            elif hasattr(user, 'staff_profile') and user.staff_profile.parent_school:
                udise = user.staff_profile.parent_school.udise_code
            
            if udise:
                return qs.filter(udise_code=udise)
            return qs.none()
            
        return qs.none()

    def perform_create(self, serializer):
        """Overrides create to use the workflow service."""
        SchoolWorkflowService.submit_registration(
            user=self.request.user,
            school_data=serializer.validated_data
        )

    @extend_schema(summary="Export schools to CSV", tags=["Schools"])
    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        fields = ["udise_code", "name", "district", "block", "school_type", "is_active"]
        return export_queryset_to_excel(queryset, fields, filename_prefix="schools_registry")

    @extend_schema(summary="Get my school details", tags=["Schools"])
    @action(detail=False, methods=["get"])
    def me(self, request):
        """Returns the current user's associated school details."""
        school = self.get_queryset().first()
        if not school:
            return Response({"detail": "No school found for this user."}, status=404)
        serializer = self.get_serializer(school)
        return Response(serializer.data)


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
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsSchoolOrStaff]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        if user.role in [user.Role.DEO, user.Role.ADMIN_STAFF]:
            if hasattr(user, 'deo_profile'):
                return qs.filter(school__district=user.deo_profile.district)
            return qs.none()
            
        elif user.role in [user.Role.SCHOOL, user.Role.STAFF]:
            udise = None
            if hasattr(user, 'school_profile'):
                udise = user.school_profile.udise_code
            elif hasattr(user, 'staff_profile') and user.staff_profile.parent_school:
                udise = user.staff_profile.parent_school.udise_code
                
            if udise:
                return qs.filter(school__udise_code=udise)
            return qs.none()
            
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role in [user.Role.SCHOOL, user.Role.STAFF]:
            from apps.schools.models import School
            udise = user.school_profile.udise_code if hasattr(user, 'school_profile') else user.staff_profile.parent_school.udise_code
            school_obj = School.objects.get(udise_code=udise)
            serializer.save(school=school_obj)
        else:
            serializer.save()


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
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsSchoolOrStaff]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        if user.role in [user.Role.DEO, user.Role.ADMIN_STAFF]:
            if hasattr(user, 'deo_profile'):
                return qs.filter(school__district=user.deo_profile.district)
            return qs.none()
            
        elif user.role in [user.Role.SCHOOL, user.Role.STAFF]:
            udise = None
            if hasattr(user, 'school_profile'):
                udise = user.school_profile.udise_code
            elif hasattr(user, 'staff_profile') and user.staff_profile.parent_school:
                udise = user.staff_profile.parent_school.udise_code
                
            if udise:
                return qs.filter(school__udise_code=udise)
            return qs.none()
            
        return qs.none()

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
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff]

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
