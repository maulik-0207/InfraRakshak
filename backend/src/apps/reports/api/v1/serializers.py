"""
Reports API v1 serializers.
"""

from rest_framework import serializers

from apps.reports.models import (
    WeeklyElectricalReport,
    WeeklyIssues,
    WeeklyPlumbingReport,
    WeeklyReport,
    WeeklyStructuralReport,
)


class WeeklyPlumbingReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyPlumbingReport
        fields = [
            "id", "weekly_report", "total_taps", "functional_taps",
            "leakage_points_count", "drainage_blockage",
            "water_availability", "water_shortage_days",
            "toilet_water_issue", "remarks", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs: dict) -> dict:
        if attrs.get("functional_taps", 0) > attrs.get("total_taps", 0):
            raise serializers.ValidationError({
                "functional_taps": "Functional taps cannot exceed total taps.",
            })
        return attrs


class WeeklyElectricalReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyElectricalReport
        fields = [
            "id", "weekly_report",
            "total_fans", "functional_fans",
            "total_lights", "functional_lights",
            "power_outage_hours", "backup_available",
            "wiring_issues", "switchboard_issues", "remarks", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs: dict) -> dict:
        if attrs.get("functional_fans", 0) > attrs.get("total_fans", 0):
            raise serializers.ValidationError({
                "functional_fans": "Functional fans cannot exceed total fans.",
            })
        if attrs.get("functional_lights", 0) > attrs.get("total_lights", 0):
            raise serializers.ValidationError({
                "functional_lights": "Functional lights cannot exceed total lights.",
            })
        return attrs


class WeeklyStructuralReportSerializer(serializers.ModelSerializer):
    building_safety_display = serializers.CharField(
        source="get_building_safety_display", read_only=True,
    )

    class Meta:
        model = WeeklyStructuralReport
        fields = [
            "id", "weekly_report",
            "classrooms_total", "classrooms_usable",
            "roof_leakage", "wall_cracks", "plaster_damage",
            "building_safety", "building_safety_display",
            "repair_required", "remarks", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs: dict) -> dict:
        if attrs.get("classrooms_usable", 0) > attrs.get("classrooms_total", 0):
            raise serializers.ValidationError({
                "classrooms_usable": "Usable classrooms cannot exceed total.",
            })
        return attrs


class WeeklyIssuesSerializer(serializers.ModelSerializer):
    issue_type_display = serializers.CharField(
        source="get_issue_type_display", read_only=True,
    )
    severity_display = serializers.CharField(
        source="get_severity_display", read_only=True,
    )

    class Meta:
        model = WeeklyIssues
        fields = [
            "id", "weekly_report", "issue_type", "issue_type_display",
            "severity", "severity_display", "description",
            "is_resolved", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class WeeklyReportListSerializer(serializers.ModelSerializer):
    """Lightweight weekly report for list views."""

    status_display = serializers.CharField(
        source="get_status_display", read_only=True,
    )

    class Meta:
        model = WeeklyReport
        fields = [
            "id", "school", "week_start_date", "week_end_date",
            "status", "status_display", "submitted_by", "submitted_at",
            "reviewed_by", "reviewed_at", "remarks", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class WeeklyReportDetailSerializer(serializers.ModelSerializer):
    """Full weekly report with nested sub-reports for detail view."""

    status_display = serializers.CharField(
        source="get_status_display", read_only=True,
    )
    plumbing_report = WeeklyPlumbingReportSerializer(read_only=True)
    electrical_report = WeeklyElectricalReportSerializer(read_only=True)
    structural_report = WeeklyStructuralReportSerializer(read_only=True)
    issues = WeeklyIssuesSerializer(many=True, read_only=True)

    class Meta:
        model = WeeklyReport
        fields = [
            "id", "school", "week_start_date", "week_end_date",
            "status", "status_display", "submitted_by", "submitted_at",
            "reviewed_by", "reviewed_at", "remarks",
            "plumbing_report", "electrical_report", "structural_report",
            "issues", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs: dict) -> dict:
        start = attrs.get("week_start_date")
        end = attrs.get("week_end_date")
        if start and end and end < start:
            raise serializers.ValidationError({
                "week_end_date": "End date cannot be before start date.",
            })
        return attrs
