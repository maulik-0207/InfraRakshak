"""
Schools API v1 serializers.
"""

from rest_framework import serializers

from apps.schools.models import School, SchoolInfrastructure, SchoolProfile


class SchoolSerializer(serializers.ModelSerializer):
    """Read/write serializer for schools."""

    school_type_display = serializers.CharField(
        source="get_school_type_display", read_only=True,
    )

    class Meta:
        model = School
        fields = [
            "id", "udise_code", "name", "address", "district", "block",
            "cluster", "pincode", "latitude", "longitude",
            "school_type", "school_type_display",
            "weather_zone", "material_type", "building_age",
            "is_girls_school", "flood_prone_area", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "is_active", "created_at", "updated_at"]


class SchoolProfileSerializer(serializers.ModelSerializer):
    """Serializer for school demographic profiles with cross-field validation."""

    area_type_display = serializers.CharField(
        source="get_area_type_display", read_only=True,
    )

    class Meta:
        model = SchoolProfile
        fields = [
            "id", "school", "total_students", "total_boys", "total_girls",
            "teachers_count", "non_teaching_staff_count",
            "classrooms_count", "functional_classrooms",
            "area_type", "area_type_display",
            "electricity_available", "internet_available", "drinking_water_available",
            "academic_year", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs: dict) -> dict:
        boys = attrs.get("total_boys", 0)
        girls = attrs.get("total_girls", 0)
        total = attrs.get("total_students", 0)
        if boys + girls > total:
            raise serializers.ValidationError({
                "total_students": "Total boys + girls cannot exceed total students.",
            })

        functional = attrs.get("functional_classrooms", 0)
        total_cls = attrs.get("classrooms_count", 0)
        if functional > total_cls:
            raise serializers.ValidationError({
                "functional_classrooms": "Functional classrooms cannot exceed total.",
            })
        return attrs


class SchoolInfrastructureSerializer(serializers.ModelSerializer):
    """Serializer for infrastructure surveys with condition display fields."""

    wiring_condition_display = serializers.CharField(
        source="get_wiring_condition_display", read_only=True,
    )
    building_condition_display = serializers.CharField(
        source="get_building_condition_display", read_only=True,
    )

    class Meta:
        model = SchoolInfrastructure
        fields = [
            "id", "school", "survey_date",
            "boys_toilets_total", "boys_toilets_functional",
            "girls_toilets_total", "girls_toilets_functional",
            "water_source_available", "water_quality_ok",
            "electricity_connection", "power_backup",
            "leakage_present", "drainage_issue",
            "wiring_condition", "wiring_condition_display",
            "fan_condition", "lighting_condition",
            "building_condition", "building_condition_display",
            "roof_leakage", "wall_cracks", "crack_width_mm",
            "toilet_cleanliness", "campus_cleanliness",
            "inspection_score", "submitted_by", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs: dict) -> dict:
        if attrs.get("boys_toilets_functional", 0) > attrs.get("boys_toilets_total", 0):
            raise serializers.ValidationError({
                "boys_toilets_functional": "Cannot exceed total boys toilets.",
            })
        if attrs.get("girls_toilets_functional", 0) > attrs.get("girls_toilets_total", 0):
            raise serializers.ValidationError({
                "girls_toilets_functional": "Cannot exceed total girls toilets.",
            })
        return attrs

# ===========================================================================
# Registration Request
# ===========================================================================

from apps.schools.models import SchoolRegistrationRequest


class SchoolRegistrationRequestSerializer(serializers.ModelSerializer):
    """Serializer for tracking the school registration workflow."""

    school_name = serializers.CharField(source="school.name", read_only=True)
    submitted_by_name = serializers.CharField(
        source="submitted_by.get_full_name", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = SchoolRegistrationRequest
        fields = [
            "id", "school", "school_name", "status", "status_display",
            "submitted_by", "submitted_by_name", "rejection_reason",
            "processed_at", "processed_by", "created_at",
        ]
        read_only_fields = [
            "id", "status", "submitted_by", "processed_at",
            "processed_by", "created_at"
        ]
