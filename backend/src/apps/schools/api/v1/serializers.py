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

    # Proxied fields from the associated School model
    name = serializers.CharField(source="school.name", required=False)
    udise_code = serializers.CharField(source="school.udise_code", required=False)
    address = serializers.CharField(source="school.address", required=False)
    district = serializers.CharField(source="school.district", required=False)
    block = serializers.CharField(source="school.block", required=False)
    cluster = serializers.CharField(source="school.cluster", required=False)
    pincode = serializers.CharField(source="school.pincode", required=False)
    latitude = serializers.DecimalField(source="school.latitude", max_digits=10, decimal_places=7, required=False)
    longitude = serializers.DecimalField(source="school.longitude", max_digits=10, decimal_places=7, required=False)
    
    school_type = serializers.CharField(source="school.school_type", required=False)
    weather_zone = serializers.CharField(source="school.weather_zone", required=False)
    material_type = serializers.CharField(source="school.material_type", required=False)
    building_age = serializers.IntegerField(source="school.building_age", required=False)
    is_girls_school = serializers.BooleanField(source="school.is_girls_school", required=False)
    flood_prone_area = serializers.BooleanField(source="school.flood_prone_area", required=False)

    class Meta:
        model = SchoolProfile
        fields = [
            "id", "school", "total_students", "total_boys", "total_girls",
            "teachers_count", "non_teaching_staff_count",
            "classrooms_count", "functional_classrooms",
            "area_type", "area_type_display",
            "electricity_available", "internet_available", "drinking_water_available",
            "academic_year", "created_at", "updated_at",
            "name", "udise_code", "address", "district", "block", "cluster",
            "pincode", "latitude", "longitude",
            "school_type", "weather_zone", "material_type",
            "building_age", "is_girls_school", "flood_prone_area"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def update(self, instance, validated_data):
        # Extract fields belong to the related School model
        school_data = validated_data.pop('school', {})
        
        # Update the related School instance if any data provided
        if school_data:
            school = instance.school
            for attr, value in school_data.items():
                setattr(school, attr, value)
            school.save()
            
        return super().update(instance, validated_data)

    def create(self, validated_data):
        # Extract fields belong to the related School model
        school_data = validated_data.pop('school', {})
        
        # In perform_create, school_obj is already passed in. 
        # But if it's not, we might need to handle it.
        # Usually, for this specific flow, School exists already.
        
        school = validated_data.get('school')
        if school and school_data:
            for attr, value in school_data.items():
                setattr(school, attr, value)
            school.save()
            
        return super().create(validated_data)

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
