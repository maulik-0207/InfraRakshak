"""
Schools API v1 views.
"""

from drf_spectacular.utils import OpenApiExample, extend_schema, extend_schema_view
from rest_framework import viewsets

from apps.schools.api.v1.serializers import (
    SchoolInfrastructureSerializer,
    SchoolProfileSerializer,
    SchoolSerializer,
)
from apps.schools.models import School, SchoolInfrastructure, SchoolProfile


@extend_schema_view(
    list=extend_schema(
        summary="List all schools",
        description="Returns a paginated list of schools. Filter by district, block, or type.",
        tags=["Schools"],
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
