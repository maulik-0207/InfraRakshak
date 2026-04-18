"""
Schools app admin configuration.
"""

from django.contrib import admin

from apps.schools.models import School, SchoolInfrastructure, SchoolProfile


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ("udise_code", "name", "district", "block", "school_type", "pincode")
    search_fields = ("udise_code", "name", "district", "block")
    list_filter = ("school_type", "district")
    ordering = ("name",)


@admin.register(SchoolProfile)
class SchoolProfileAdmin(admin.ModelAdmin):
    list_display = (
        "school",
        "total_students",
        "teachers_count",
        "classrooms_count",
        "functional_classrooms",
        "area_type",
        "academic_year",
    )
    search_fields = ("school__name", "school__udise_code")
    list_filter = ("area_type", "academic_year", "electricity_available", "internet_available")
    raw_id_fields = ("school",)


@admin.register(SchoolInfrastructure)
class SchoolInfrastructureAdmin(admin.ModelAdmin):
    list_display = (
        "school",
        "survey_date",
        "building_condition",
        "wiring_condition",
        "inspection_score",
        "submitted_by",
    )
    search_fields = ("school__name", "school__udise_code")
    list_filter = (
        "building_condition",
        "wiring_condition",
        "fan_condition",
        "lighting_condition",
        "survey_date",
    )
    raw_id_fields = ("school", "submitted_by")
    date_hierarchy = "survey_date"
