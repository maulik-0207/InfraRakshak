"""
Schools app models.

Contains School, SchoolProfile, and SchoolInfrastructure models.
"""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from common.models import TimeStampedModel
from common.validators import validate_rating


# ===========================================================================
# School
# ===========================================================================

class School(TimeStampedModel):
    """
    Core school entity identified by its government-issued UDISE code.
    """

    class SchoolType(models.TextChoices):
        PRIMARY = "PRIMARY", "Primary"
        SECONDARY = "SECONDARY", "Secondary"
        HIGHER_SECONDARY = "HIGHER_SECONDARY", "Higher Secondary"

    udise_code = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name="UDISE Code",
        help_text="Government-issued unique school identifier.",
    )
    name = models.CharField(max_length=255, db_index=True)
    address = models.TextField()
    district = models.CharField(max_length=100, db_index=True)
    block = models.CharField(max_length=100, blank=True, default="")
    cluster = models.CharField(max_length=100, blank=True, default="")
    pincode = models.CharField(max_length=10)
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
    )
    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
    )
    school_type = models.CharField(
        max_length=20,
        choices=SchoolType.choices,
        default=SchoolType.PRIMARY,
        db_index=True,
    )

    class Meta(TimeStampedModel.Meta):
        verbose_name = "School"
        verbose_name_plural = "Schools"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.udise_code})"


# ===========================================================================
# School Profile
# ===========================================================================

class SchoolProfile(TimeStampedModel):
    """
    Annual demographic and facility snapshot for a school.
    """

    class AreaType(models.TextChoices):
        RURAL = "RURAL", "Rural"
        URBAN = "URBAN", "Urban"
        SEMI_URBAN = "SEMI_URBAN", "Semi-Urban"

    school = models.OneToOneField(
        School,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    # Student counts
    total_students = models.PositiveIntegerField(default=0)
    total_boys = models.PositiveIntegerField(default=0)
    total_girls = models.PositiveIntegerField(default=0)

    # Staff counts
    teachers_count = models.PositiveIntegerField(default=0)
    non_teaching_staff_count = models.PositiveIntegerField(default=0)

    # Classroom counts
    classrooms_count = models.PositiveIntegerField(default=0)
    functional_classrooms = models.PositiveIntegerField(default=0)

    area_type = models.CharField(
        max_length=15,
        choices=AreaType.choices,
        default=AreaType.RURAL,
    )

    # Utility availability
    electricity_available = models.BooleanField(default=False)
    internet_available = models.BooleanField(default=False)
    drinking_water_available = models.BooleanField(default=False)

    academic_year = models.CharField(
        max_length=9,
        help_text="Format: 2025-2026",
    )

    class Meta(TimeStampedModel.Meta):
        verbose_name = "School Profile"
        verbose_name_plural = "School Profiles"

    def __str__(self) -> str:
        return f"Profile: {self.school.name} ({self.academic_year})"

    def clean(self) -> None:
        """Cross-field validation for student and classroom counts."""
        super().clean()
        errors: dict[str, list[str]] = {}

        if self.total_boys + self.total_girls > self.total_students:
            errors["total_students"] = [
                "Total boys + total girls cannot exceed total students."
            ]

        if self.functional_classrooms > self.classrooms_count:
            errors["functional_classrooms"] = [
                "Functional classrooms cannot exceed total classrooms."
            ]

        if errors:
            raise ValidationError(errors)


# ===========================================================================
# School Infrastructure
# ===========================================================================

class SchoolInfrastructure(TimeStampedModel):
    """
    Infrastructure survey record for a school.
    Multiple surveys may exist for different dates.
    """

    class ConditionChoice(models.TextChoices):
        GOOD = "GOOD", "Good"
        AVERAGE = "AVERAGE", "Average"
        POOR = "POOR", "Poor"

    class BuildingCondition(models.TextChoices):
        GOOD = "GOOD", "Good"
        MINOR_DAMAGE = "MINOR_DAMAGE", "Minor Damage"
        MAJOR_DAMAGE = "MAJOR_DAMAGE", "Major Damage"

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="infrastructure_surveys",
    )
    survey_date = models.DateField(db_index=True)

    # -- Toilets --
    boys_toilets_total = models.PositiveIntegerField(default=0)
    boys_toilets_functional = models.PositiveIntegerField(default=0)
    girls_toilets_total = models.PositiveIntegerField(default=0)
    girls_toilets_functional = models.PositiveIntegerField(default=0)

    # -- Water --
    water_source_available = models.BooleanField(default=False)
    water_quality_ok = models.BooleanField(default=False)

    # -- Electricity --
    electricity_connection = models.BooleanField(default=False)
    power_backup = models.BooleanField(default=False)

    # -- Plumbing Issues --
    leakage_present = models.BooleanField(default=False)
    drainage_issue = models.BooleanField(default=False)

    # -- Electrical Issues --
    wiring_condition = models.CharField(
        max_length=10,
        choices=ConditionChoice.choices,
        default=ConditionChoice.GOOD,
    )
    fan_condition = models.CharField(
        max_length=10,
        choices=ConditionChoice.choices,
        default=ConditionChoice.GOOD,
    )
    lighting_condition = models.CharField(
        max_length=10,
        choices=ConditionChoice.choices,
        default=ConditionChoice.GOOD,
    )

    # -- Structural Issues --
    building_condition = models.CharField(
        max_length=15,
        choices=BuildingCondition.choices,
        default=BuildingCondition.GOOD,
    )
    roof_leakage = models.BooleanField(default=False)
    wall_cracks = models.BooleanField(default=False)

    # -- Cleanliness --
    toilet_cleanliness = models.PositiveSmallIntegerField(
        default=3,
        validators=[validate_rating],
        help_text="Rating 1 (worst) to 5 (best).",
    )
    campus_cleanliness = models.PositiveSmallIntegerField(
        default=3,
        validators=[validate_rating],
        help_text="Rating 1 (worst) to 5 (best).",
    )

    # -- Derived --
    inspection_score = models.FloatField(
        null=True,
        blank=True,
        help_text="Auto-computed or manually entered overall score.",
    )

    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="infrastructure_submissions",
    )

    class Meta(TimeStampedModel.Meta):
        verbose_name = "School Infrastructure"
        verbose_name_plural = "School Infrastructure Records"

    def __str__(self) -> str:
        return f"Infra Survey: {self.school.name} ({self.survey_date})"

    def clean(self) -> None:
        """Ensure functional counts don't exceed totals."""
        super().clean()
        errors: dict[str, list[str]] = {}

        if self.boys_toilets_functional > self.boys_toilets_total:
            errors["boys_toilets_functional"] = [
                "Functional boys toilets cannot exceed total boys toilets."
            ]
        if self.girls_toilets_functional > self.girls_toilets_total:
            errors["girls_toilets_functional"] = [
                "Functional girls toilets cannot exceed total girls toilets."
            ]

        if errors:
            raise ValidationError(errors)
