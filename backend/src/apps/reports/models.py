"""
Reports app models.

Contains WeeklyReport (parent) and its sub-reports: Plumbing, Electrical,
Structural, plus a generic WeeklyIssues model.
"""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from common.models import TimeStampedModel


# ===========================================================================
# Weekly Report (Parent)
# ===========================================================================

class WeeklyReport(TimeStampedModel):
    """
    Top-level weekly infrastructure report for a school.

    Each school can have at most one report per (week_start_date, week_end_date).
    Sub-reports (plumbing, electrical, structural) link back via OneToOne.
    """

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        REVIEWED = "REVIEWED", "Reviewed"

    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="weekly_reports",
    )
    week_start_date = models.DateField(db_index=True)
    week_end_date = models.DateField(db_index=True)

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )

    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="submitted_reports",
        null=True,
        blank=True,
    )
    submitted_at = models.DateTimeField(null=True, blank=True)

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="reviewed_reports",
        null=True,
        blank=True,
        help_text="Admin or DEO who reviewed this report.",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    remarks = models.TextField(blank=True, default="")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Weekly Report"
        verbose_name_plural = "Weekly Reports"
        constraints = [
            models.UniqueConstraint(
                fields=["school", "week_start_date", "week_end_date"],
                name="uq_weekly_report_school_week",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"Weekly Report: {self.school.name} "
            f"({self.week_start_date} – {self.week_end_date})"
        )

    def clean(self) -> None:
        super().clean()
        if self.week_start_date and self.week_end_date:
            if self.week_end_date < self.week_start_date:
                raise ValidationError({
                    "week_end_date": "End date cannot be before start date.",
                })


# ===========================================================================
# Weekly Plumbing Report
# ===========================================================================

class WeeklyPlumbingReport(TimeStampedModel):
    """Plumbing sub-report linked one-to-one to a WeeklyReport."""

    weekly_report = models.OneToOneField(
        WeeklyReport,
        on_delete=models.CASCADE,
        related_name="plumbing_report",
    )

    total_taps = models.PositiveIntegerField(default=0)
    functional_taps = models.PositiveIntegerField(default=0)
    leakage_points_count = models.PositiveIntegerField(default=0)
    drainage_blockage = models.BooleanField(default=False)

    water_availability = models.BooleanField(default=True)
    water_shortage_days = models.PositiveIntegerField(default=0)

    toilet_water_issue = models.BooleanField(default=False)

    remarks = models.TextField(blank=True, default="")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Weekly Plumbing Report"
        verbose_name_plural = "Weekly Plumbing Reports"

    def __str__(self) -> str:
        return f"Plumbing: {self.weekly_report}"

    def clean(self) -> None:
        super().clean()
        if self.functional_taps > self.total_taps:
            raise ValidationError({
                "functional_taps": "Functional taps cannot exceed total taps.",
            })


# ===========================================================================
# Weekly Electrical Report
# ===========================================================================

class WeeklyElectricalReport(TimeStampedModel):
    """Electrical sub-report linked one-to-one to a WeeklyReport."""

    weekly_report = models.OneToOneField(
        WeeklyReport,
        on_delete=models.CASCADE,
        related_name="electrical_report",
    )

    total_fans = models.PositiveIntegerField(default=0)
    functional_fans = models.PositiveIntegerField(default=0)

    total_lights = models.PositiveIntegerField(default=0)
    functional_lights = models.PositiveIntegerField(default=0)

    power_outage_hours = models.FloatField(
        default=0,
        help_text="Total hours of power outage during the week.",
    )
    backup_available = models.BooleanField(default=False)

    wiring_issues = models.BooleanField(default=False)
    switchboard_issues = models.BooleanField(default=False)

    remarks = models.TextField(blank=True, default="")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Weekly Electrical Report"
        verbose_name_plural = "Weekly Electrical Reports"

    def __str__(self) -> str:
        return f"Electrical: {self.weekly_report}"

    def clean(self) -> None:
        super().clean()
        errors: dict[str, list[str]] = {}

        if self.functional_fans > self.total_fans:
            errors["functional_fans"] = [
                "Functional fans cannot exceed total fans."
            ]
        if self.functional_lights > self.total_lights:
            errors["functional_lights"] = [
                "Functional lights cannot exceed total lights."
            ]

        if errors:
            raise ValidationError(errors)


# ===========================================================================
# Weekly Structural Report
# ===========================================================================

class WeeklyStructuralReport(TimeStampedModel):
    """Structural sub-report linked one-to-one to a WeeklyReport."""

    class BuildingSafety(models.TextChoices):
        SAFE = "SAFE", "Safe"
        MINOR_RISK = "MINOR_RISK", "Minor Risk"
        UNSAFE = "UNSAFE", "Unsafe"

    weekly_report = models.OneToOneField(
        WeeklyReport,
        on_delete=models.CASCADE,
        related_name="structural_report",
    )

    classrooms_total = models.PositiveIntegerField(default=0)
    classrooms_usable = models.PositiveIntegerField(default=0)

    roof_leakage = models.BooleanField(default=False)
    wall_cracks = models.BooleanField(default=False)
    plaster_damage = models.BooleanField(default=False)

    building_safety = models.CharField(
        max_length=15,
        choices=BuildingSafety.choices,
        default=BuildingSafety.SAFE,
        db_index=True,
    )

    repair_required = models.BooleanField(default=False)

    remarks = models.TextField(blank=True, default="")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Weekly Structural Report"
        verbose_name_plural = "Weekly Structural Reports"

    def __str__(self) -> str:
        return f"Structural: {self.weekly_report}"

    def clean(self) -> None:
        super().clean()
        if self.classrooms_usable > self.classrooms_total:
            raise ValidationError({
                "classrooms_usable": "Usable classrooms cannot exceed total classrooms.",
            })


# ===========================================================================
# Weekly Issues
# ===========================================================================

class WeeklyIssues(TimeStampedModel):
    """
    Individual issues reported within a weekly report.
    A single report can have many issues.
    """

    class IssueType(models.TextChoices):
        PLUMBING = "PLUMBING", "Plumbing"
        ELECTRICAL = "ELECTRICAL", "Electrical"
        STRUCTURAL = "STRUCTURAL", "Structural"

    class Severity(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"

    weekly_report = models.ForeignKey(
        WeeklyReport,
        on_delete=models.CASCADE,
        related_name="issues",
    )
    issue_type = models.CharField(
        max_length=15,
        choices=IssueType.choices,
        db_index=True,
    )
    severity = models.CharField(
        max_length=10,
        choices=Severity.choices,
        default=Severity.LOW,
        db_index=True,
    )
    description = models.TextField()
    is_resolved = models.BooleanField(default=False, db_index=True)

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Weekly Issue"
        verbose_name_plural = "Weekly Issues"

    def __str__(self) -> str:
        return f"{self.issue_type} ({self.severity}): {self.description[:50]}"
