"""
Predictions app admin configuration.
"""

from django.contrib import admin

from apps.predictions.models import DistrictReport, PredictionIssues, PredictionReport


class PredictionIssuesInline(admin.TabularInline):
    model = PredictionIssues
    extra = 0


@admin.register(PredictionReport)
class PredictionReportAdmin(admin.ModelAdmin):
    list_display = (
        "school",
        "overall_risk_level",
        "overall_score",
        "priority_rank",
        "model_version",
        "generated_at",
    )
    search_fields = ("school__name", "school__udise_code")
    list_filter = (
        "overall_risk_level",
        "plumbing_risk_level",
        "electrical_risk_level",
        "structural_risk_level",
        "model_version",
    )
    raw_id_fields = ("school", "weekly_report")
    ordering = ("priority_rank",)
    inlines = [PredictionIssuesInline]


@admin.register(PredictionIssues)
class PredictionIssuesAdmin(admin.ModelAdmin):
    list_display = (
        "prediction_report",
        "category",
        "issue_name",
        "severity",
        "score",
    )
    search_fields = ("issue_name", "prediction_report__school__name")
    list_filter = ("category", "severity")
    raw_id_fields = ("prediction_report",)


@admin.register(DistrictReport)
class DistrictReportAdmin(admin.ModelAdmin):
    list_display = (
        "district",
        "week_start_date",
        "week_end_date",
        "total_schools",
        "high_risk_schools",
        "medium_risk_schools",
        "low_risk_schools",
        "avg_score",
    )
    search_fields = ("district",)
    list_filter = ("district", "week_start_date")
    date_hierarchy = "week_start_date"
