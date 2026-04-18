"""
Accounts app models.

Contains the custom User model, Role model, and all role-specific
profile models (Principal, SchoolStaff, Contractor, DEO, AdminStaff).
"""

import uuid
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.db import models

from common.models import TimeStampedModel


# ===========================================================================
# Role
# ===========================================================================

class Role(TimeStampedModel):
    """
    Lookup table for user roles.

    Replaces a hard-coded ENUM so new roles can be added at runtime
    without requiring a migration.
    """

    name = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True, default="")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Role"
        verbose_name_plural = "Roles"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


# ===========================================================================
# Custom User
# ===========================================================================

class User(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.

    Adds phone_no, role FK, and is_verified flag.
    email and username are indexed by default via AbstractUser;
    we add explicit db_index on email for safety.
    """

    email = models.EmailField(unique=True, db_index=True)
    phone_no = models.CharField(max_length=15, blank=True, default="")
    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        related_name="users",
        null=True,
        blank=True,
    )
    is_verified = models.BooleanField(default=False)

    # Timestamps — AbstractUser already has date_joined / last_login;
    # we add created_at / updated_at for consistency with other models.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta(AbstractUser.Meta):
        verbose_name = "User"
        verbose_name_plural = "Users"
        indexes = [
            models.Index(fields=["email"], name="idx_user_email"),
            models.Index(fields=["username"], name="idx_user_username"),
        ]

    def __str__(self) -> str:
        return f"{self.username} ({self.get_full_name() or self.email})"


# ===========================================================================
# Verification Token
# ===========================================================================

class UserVerificationToken(TimeStampedModel):
    """
    Secure token for email verification.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="verification_tokens",
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Verification Token"
        verbose_name_plural = "Verification Tokens"

    def __str__(self) -> str:
        return f"Token for {self.user.email} (Used: {self.is_used})"

    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at


# ===========================================================================
# Profile Models
# ===========================================================================

class Principal(TimeStampedModel):
    """Profile for users with the PRINCIPAL role."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="principal_profile",
    )
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.PROTECT,
        related_name="principals",
    )
    joining_date = models.DateField(null=True, blank=True)
    qualification = models.CharField(max_length=255, blank=True, default="")
    experience_years = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
    )

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Principal"
        verbose_name_plural = "Principals"

    def __str__(self) -> str:
        return f"Principal: {self.user.get_full_name()} @ {self.school}"


class SchoolStaff(TimeStampedModel):
    """Profile for users with the SCHOOL_STAFF role."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="school_staff_profile",
    )
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.PROTECT,
        related_name="staff_members",
    )
    designation = models.CharField(
        max_length=100,
        help_text="e.g., Clerk, Supervisor, Technician",
    )

    class Meta(TimeStampedModel.Meta):
        verbose_name = "School Staff"
        verbose_name_plural = "School Staff"

    def __str__(self) -> str:
        return f"{self.designation}: {self.user.get_full_name()}"


class Contractor(TimeStampedModel):
    """Profile for users with the CONTRACTOR role."""

    class Specialization(models.TextChoices):
        PLUMBING = "PLUMBING", "Plumbing"
        ELECTRICAL = "ELECTRICAL", "Electrical"
        STRUCTURAL = "STRUCTURAL", "Structural"
        MULTI = "MULTI", "Multi-Discipline"

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="contractor_profile",
    )
    company_name = models.CharField(max_length=255)
    license_number = models.CharField(max_length=100, unique=True, db_index=True)
    specialization = models.CharField(
        max_length=20,
        choices=Specialization.choices,
        default=Specialization.MULTI,
    )
    experience_years = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
    )
    rating = models.FloatField(null=True, blank=True)
    is_available = models.BooleanField(default=True)

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Contractor"
        verbose_name_plural = "Contractors"

    def __str__(self) -> str:
        return f"{self.company_name} ({self.user.get_full_name()})"


class DEO(TimeStampedModel):
    """Profile for users with the DEO (District Education Officer) role."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="deo_profile",
    )
    district = models.CharField(max_length=100, db_index=True)
    office_address = models.TextField(blank=True, default="")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "DEO"
        verbose_name_plural = "DEOs"

    def __str__(self) -> str:
        return f"DEO: {self.user.get_full_name()} ({self.district})"


class AdminStaff(TimeStampedModel):
    """Profile for users with the ADMIN_STAFF role."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="admin_staff_profile",
    )
    office_name = models.CharField(max_length=255)
    designation = models.CharField(max_length=100)
    district = models.CharField(max_length=100, db_index=True)

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Admin Staff"
        verbose_name_plural = "Admin Staff"

    def __str__(self) -> str:
        return f"{self.designation}: {self.user.get_full_name()} ({self.district})"
