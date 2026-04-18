"""
Reports app admin configuration.
"""

from django.contrib import admin

from apps.reports.models import (
    WeeklyElectricalReport,
    WeeklyIssues,
    WeeklyPlumbingReport,
    WeeklyReport,
    WeeklyStructuralReport,
)


class WeeklyPlumbingInline(admin.StackedInline):
    model = WeeklyPlumbingReport
    extra = 0
    max_num = 1


class WeeklyElectricalInline(admin.StackedInline):
    model = WeeklyElectricalReport
    extra = 0
    max_num = 1


class WeeklyStructuralInline(admin.StackedInline):
    model = WeeklyStructuralReport
    extra = 0
    max_num = 1


class WeeklyIssuesInline(admin.TabularInline):
    model = WeeklyIssues
    extra = 0


@admin.register(WeeklyReport)
class WeeklyReportAdmin(admin.ModelAdmin):
    list_display = (
        "school",
        "week_start_date",
        "week_end_date",
        "status",
        "submitted_by",
        "reviewed_by",
    )
    search_fields = ("school__name", "school__udise_code")
    list_filter = ("status", "week_start_date")
    raw_id_fields = ("school", "submitted_by", "reviewed_by")
    date_hierarchy = "week_start_date"
    inlines = [
        WeeklyPlumbingInline,
        WeeklyElectricalInline,
        WeeklyStructuralInline,
        WeeklyIssuesInline,
    ]


@admin.register(WeeklyPlumbingReport)
class WeeklyPlumbingReportAdmin(admin.ModelAdmin):
    list_display = (
        "weekly_report",
        "total_taps",
        "functional_taps",
        "leakage_points_count",
        "drainage_blockage",
        "water_availability",
    )
    search_fields = ("weekly_report__school__name",)
    list_filter = ("drainage_blockage", "water_availability", "toilet_water_issue")
    raw_id_fields = ("weekly_report",)


@admin.register(WeeklyElectricalReport)
class WeeklyElectricalReportAdmin(admin.ModelAdmin):
    list_display = (
        "weekly_report",
        "total_fans",
        "functional_fans",
        "total_lights",
        "functional_lights",
        "wiring_issues",
    )
    search_fields = ("weekly_report__school__name",)
    list_filter = ("wiring_issues", "switchboard_issues", "backup_available")
    raw_id_fields = ("weekly_report",)


@admin.register(WeeklyStructuralReport)
class WeeklyStructuralReportAdmin(admin.ModelAdmin):
    list_display = (
        "weekly_report",
        "classrooms_total",
        "classrooms_usable",
        "building_safety",
        "repair_required",
    )
    search_fields = ("weekly_report__school__name",)
    list_filter = ("building_safety", "repair_required", "roof_leakage", "wall_cracks")
    raw_id_fields = ("weekly_report",)


@admin.register(WeeklyIssues)
class WeeklyIssuesAdmin(admin.ModelAdmin):
    list_display = ("weekly_report", "issue_type", "severity", "is_resolved")
    search_fields = ("weekly_report__school__name", "description")
    list_filter = ("issue_type", "severity", "is_resolved")
    raw_id_fields = ("weekly_report",)
