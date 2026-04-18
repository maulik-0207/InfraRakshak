"""
Accounts API v1 serializers — Refactored for Email login & New Profiles.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.accounts.models import (
    SchoolAccountProfile, DEOProfile, ContractorProfile, 
    AdminStaffProfile, StaffProfile
)

User = get_user_model()


# ===========================================================================
# User Serializers (Email-based)
# ===========================================================================

class UserListSerializer(serializers.ModelSerializer):
    """Lightweight user representation."""

    class Meta:
        model = User
        fields = [
            "id", "email", "role", "is_verified", "is_active", "date_joined",
        ]
        read_only_fields = ["id", "date_joined"]


class UserDetailSerializer(serializers.ModelSerializer):
    """Full user representation."""

    class Meta:
        model = User
        fields = [
            "id", "email", "role", "is_verified", "is_active", 
            "is_staff", "date_joined", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "date_joined", "created_at", "updated_at"]


# ===========================================================================
# Profile Serializers
# ===========================================================================

class SchoolAccountProfileSerializer(serializers.ModelSerializer):
    """Serializer for School Account profile."""
    
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = SchoolAccountProfile
        fields = [
            "id", "user", "email", "udise_code", "school_name", 
            "phone_no", "district", "address", "school_type",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class DEOProfileSerializer(serializers.ModelSerializer):
    """Serializer for DEO profile."""

    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = DEOProfile
        fields = [
            "id", "user", "email", "district", "office_address",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class ContractorProfileSerializer(serializers.ModelSerializer):
    """Serializer for Contractor profile."""

    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = ContractorProfile
        fields = [
            "id", "user", "email", "company_name", "license_number", 
            "phone_no", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class AdminStaffProfileSerializer(serializers.ModelSerializer):
    """Serializer for Admin Staff profile."""

    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = AdminStaffProfile
        fields = [
            "id", "user", "email", "parent_deo", "full_name", 
            "phone_no", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class StaffProfileSerializer(serializers.ModelSerializer):
    """Serializer for School Staff profile."""

    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = StaffProfile
        fields = [
            "id", "user", "email", "parent_school", "full_name", 
            "phone_no", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


# ===========================================================================
# Onboarding Serializers
# ===========================================================================

class SchoolSelfRegistrationSerializer(serializers.Serializer):
    """Serializer for School self-registration."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    udise_code = serializers.CharField()
    school_name = serializers.CharField()
    phone_no = serializers.CharField()
    district = serializers.CharField()
    address = serializers.CharField()
    school_type = serializers.CharField()

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value


class LogoutRequestSerializer(serializers.Serializer):
    """Serializer for blacklisting a refresh token."""
    refresh = serializers.CharField(help_text="The refresh token to blacklist.")


class DashboardSerializer(serializers.Serializer):
    """Serializer for dashboard summary response."""
    role = serializers.CharField()
    email = serializers.EmailField()
    stats = serializers.DictField(child=serializers.IntegerField())


class ContractorRegistrationSerializer(serializers.Serializer):
    """Serializer for Contractor self-registration."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    company_name = serializers.CharField()
    license_number = serializers.CharField()
    phone_no = serializers.CharField()

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value


class BulkOnboardingSerializer(serializers.Serializer):
    """Serializer for Excel file upload."""
    
    file = serializers.FileField()
    role = serializers.ChoiceField(choices=[
        User.Role.ADMIN_STAFF, 
        User.Role.STAFF, 
        User.Role.DEO
    ])


# ===========================================================================
# Auth (JWT Customization)
# ===========================================================================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Overridden JWT serializer to include role and dashboard redirects.
    """

    def validate(self, attrs):
        # Base validation (handles email/password check)
        data = super().validate(attrs)
        
        user = self.user
        
        if not user.is_verified:
            raise serializers.ValidationError(
                {"detail": "Your email address is not verified."}
            )
        
        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "Your account is inactive."}
            )

        # Add custom data
        data['role'] = user.role
        data['email'] = user.email
        
        # Dashboard Redirect Logic
        redirects = {
            User.Role.SCHOOL: "/school/dashboard",
            User.Role.DEO: "/deo/dashboard",
            User.Role.CONTRACTOR: "/contractor/dashboard",
            User.Role.ADMIN_STAFF: "/deo/dashboard",
            User.Role.STAFF: "/staff/dashboard",
        }
        data['redirect_url'] = redirects.get(user.role, "/dashboard")
            
        return data
