"""
Predictions app models.

Contains PredictionReport, PredictionIssues, and DistrictReport
for ML-driven infrastructure risk analytics.
"""

from django.db import models

from common.models import TimeStampedModel


# ===========================================================================
# Shared Choices
# ===========================================================================

class RiskLevel(models.TextChoices):
    """Reused across prediction models."""
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"


class InfraCategory(models.TextChoices):
    """Infrastructure domain categories."""
    PLUMBING = "PLUMBING", "Plumbing"
    ELECTRICAL = "ELECTRICAL", "Electrical"
    STRUCTURAL = "STRUCTURAL", "Structural"


# ===========================================================================
# Prediction Report
# ===========================================================================

class PredictionReport(TimeStampedModel):
    """
    ML-generated risk prediction for a school based on a weekly report.

    Contains overall and per-category risk scores.
    `priority_rank` is used to sort schools on the DEO dashboard.
    """

    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="prediction_reports",
    )
    weekly_report = models.ForeignKey(
        "reports.WeeklyReport",
        on_delete=models.CASCADE,
        related_name="prediction_reports",
    )

    # -- Overall --
    overall_risk_level = models.CharField(
        max_length=10,
        choices=RiskLevel.choices,
        default=RiskLevel.LOW,
        db_index=True,
    )
    projection_days = models.PositiveIntegerField(
        default=0, 
        db_index=True,
        help_text="0 for current report, 30/60 for simulated projections."
    )
    overall_score = models.FloatField(default=0.0)

    # -- Plumbing --
    plumbing_risk_level = models.CharField(
        max_length=10,
        choices=RiskLevel.choices,
        default=RiskLevel.LOW,
    )
    plumbing_score = models.FloatField(default=0.0)

    # -- Electrical --
    electrical_risk_level = models.CharField(
        max_length=10,
        choices=RiskLevel.choices,
        default=RiskLevel.LOW,
    )
    electrical_score = models.FloatField(default=0.0)

    # -- Structural --
    structural_risk_level = models.CharField(
        max_length=10,
        choices=RiskLevel.choices,
        default=RiskLevel.LOW,
    )
    structural_score = models.FloatField(default=0.0)

    priority_rank = models.PositiveIntegerField(
        default=0,
        db_index=True,
        help_text="Lower number = higher priority on the DEO dashboard.",
    )

    model_version = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Version identifier of the ML model used.",
    )
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Prediction Report"
        verbose_name_plural = "Prediction Reports"
        ordering = ["priority_rank", "-generated_at"]
        indexes = [
            models.Index(
                fields=["overall_risk_level", "priority_rank"],
                name="idx_pred_risk_priority",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"Prediction: {self.school.name} "
            f"(Risk: {self.overall_risk_level}, Rank: {self.priority_rank})"
        )


# ===========================================================================
# Prediction Issues
# ===========================================================================

class PredictionIssues(TimeStampedModel):
    """
    Individual predicted issues within a PredictionReport.
    """

    prediction_report = models.ForeignKey(
        PredictionReport,
        on_delete=models.CASCADE,
        related_name="issues",
    )

    category = models.CharField(
        max_length=15,
        choices=InfraCategory.choices,
        db_index=True,
    )
    issue_name = models.CharField(
        max_length=255,
        help_text='e.g., "Toilet Failure", "Wiring Damage"',
    )

    severity = models.CharField(
        max_length=10,
        choices=RiskLevel.choices,
        default=RiskLevel.LOW,
        db_index=True,
    )
    score = models.FloatField(default=0.0)

    recommended_action = models.TextField(blank=True, default="")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Prediction Issue"
        verbose_name_plural = "Prediction Issues"

    def __str__(self) -> str:
        return f"{self.category} – {self.issue_name} ({self.severity})"


# ===========================================================================
# District Report
# ===========================================================================

class DistrictReport(TimeStampedModel):
    """
    Aggregated weekly risk summary at the district level.
    Generated automatically after prediction reports are processed.
    """

    district = models.CharField(max_length=100, db_index=True)

    week_start_date = models.DateField(db_index=True)
    week_end_date = models.DateField()
    
    projection_days = models.PositiveIntegerField(
        default=0, 
        db_index=True,
        help_text="0 for current report, 30/60 for simulated projections."
    )

    total_schools = models.PositiveIntegerField(default=0)
    high_risk_schools = models.PositiveIntegerField(default=0)
    medium_risk_schools = models.PositiveIntegerField(default=0)
    low_risk_schools = models.PositiveIntegerField(default=0)

    avg_score = models.FloatField(default=0.0)

    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta(TimeStampedModel.Meta):
        verbose_name = "District Report"
        verbose_name_plural = "District Reports"
        ordering = ["-week_start_date", "district"]
        constraints = [
            models.UniqueConstraint(
                fields=["district", "week_start_date", "week_end_date", "projection_days"],
                name="uq_district_report_week",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"District: {self.district} "
            f"({self.week_start_date} – {self.week_end_date})"
        )
