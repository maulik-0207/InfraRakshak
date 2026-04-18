"""
Predictions API v1 serializers.
"""

from rest_framework import serializers

from apps.predictions.models import DistrictReport, PredictionIssues, PredictionReport


class PredictionIssuesSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    severity_display = serializers.CharField(source="get_severity_display", read_only=True)

    class Meta:
        model = PredictionIssues
        fields = [
            "id", "prediction_report", "category", "category_display",
            "issue_name", "severity", "severity_display", "score",
            "recommended_action", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PredictionReportListSerializer(serializers.ModelSerializer):
    overall_risk_display = serializers.CharField(
        source="get_overall_risk_level_display", read_only=True,
    )

    class Meta:
        model = PredictionReport
        fields = [
            "id", "school", "weekly_report",
            "overall_risk_level", "overall_risk_display", "overall_score",
            "plumbing_risk_level", "plumbing_score",
            "electrical_risk_level", "electrical_score",
            "structural_risk_level", "structural_score",
            "priority_rank", "model_version", "generated_at",
        ]
        read_only_fields = ["id", "generated_at"]


class PredictionReportDetailSerializer(serializers.ModelSerializer):
    """Detail view with nested prediction issues."""

    overall_risk_display = serializers.CharField(
        source="get_overall_risk_level_display", read_only=True,
    )
    issues = PredictionIssuesSerializer(many=True, read_only=True)

    class Meta:
        model = PredictionReport
        fields = [
            "id", "school", "weekly_report",
            "overall_risk_level", "overall_risk_display", "overall_score",
            "plumbing_risk_level", "plumbing_score",
            "electrical_risk_level", "electrical_score",
            "structural_risk_level", "structural_score",
            "priority_rank", "model_version", "generated_at",
            "issues", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "generated_at", "created_at", "updated_at"]


class DistrictReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = DistrictReport
        fields = [
            "id", "district", "week_start_date", "week_end_date",
            "total_schools", "high_risk_schools", "medium_risk_schools",
            "low_risk_schools", "avg_score", "generated_at",
        ]
        read_only_fields = ["id", "generated_at"]
