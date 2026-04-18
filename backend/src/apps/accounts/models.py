"""
Accounts app models — Refactored for Email-based Authentication.
"""

import uuid
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.core.validators import MinValueValidator

from common.models import TimeStampedModel


# ===========================================================================
# User Manager
# ===========================================================================

class UserManager(BaseUserManager):
    """
    Custom manager for Users where email is the unique identifier.
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


# ===========================================================================
# Custom User
# ===========================================================================

class User(AbstractBaseUser, PermissionsMixin):
    """
    Core User model using Email instead of Username.
    """

    class Role(models.TextChoices):
        SCHOOL = "SCHOOL", "School"
        DEO = "DEO", "District Education Officer"
        CONTRACTOR = "CONTRACTOR", "Contractor"
        ADMIN_STAFF = "ADMIN_STAFF", "Admin Staff"
        STAFF = "STAFF", "School Staff"

    email = models.EmailField(unique=True, db_index=True)
    role = models.CharField(
        max_length=15,
        choices=Role.choices,
        db_index=True
    )
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    date_joined = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self) -> str:
        return f"{self.email} ({self.role})"


# ===========================================================================
# Verification Token
# ===========================================================================

class UserVerificationToken(TimeStampedModel):
    """Secure token for email verification."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="verification_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at


# ===========================================================================
# Role Profiles
# ===========================================================================

class SchoolAccountProfile(TimeStampedModel):
    """
    Profile for the School Account holder.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="school_profile")
    school_id = models.CharField(max_length=50, unique=True, db_index=True)
    school_name = models.CharField(max_length=255)
    phone_no = models.CharField(max_length=15)
    district = models.CharField(max_length=100)
    address = models.TextField()
    school_type = models.CharField(max_length=50)

    def __str__(self) -> str:
        return f"{self.school_name} ({self.school_id})"


class DEOProfile(TimeStampedModel):
    """
    Profile for the District Education Officer.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="deo_profile")
    district = models.CharField(max_length=100, unique=True)
    office_address = models.TextField()

    def __str__(self) -> str:
        return f"DEO: {self.district}"


class ContractorProfile(TimeStampedModel):
    """
    Profile for the Contractor (Registered by email).
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="contractor_profile")
    company_name = models.CharField(max_length=255)
    license_number = models.CharField(max_length=100, unique=True)
    phone_no = models.CharField(max_length=15)

    def __str__(self) -> str:
        return self.company_name


class AdminStaffProfile(TimeStampedModel):
    """
    Staff added by a DEO.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="admin_staff_profile")
    parent_deo = models.ForeignKey(DEOProfile, on_delete=models.CASCADE, related_name="staff_members")
    full_name = models.CharField(max_length=255)
    phone_no = models.CharField(max_length=15)

    def __str__(self) -> str:
        return self.full_name


class StaffProfile(TimeStampedModel):
    """
    Staff added by a School Account.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="staff_profile")
    parent_school = models.ForeignKey(SchoolAccountProfile, on_delete=models.CASCADE, related_name="staff_members")
    full_name = models.CharField(max_length=255)
    phone_no = models.CharField(max_length=15)

    def __str__(self) -> str:
        return self.full_name
