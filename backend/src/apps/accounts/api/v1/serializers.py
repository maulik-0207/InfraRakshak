"""
Accounts API v1 serializers.

Provides serializers for User, Role, and all profile models,
along with authentication (register / login) serializers.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.models import AdminStaff, Contractor, DEO, Principal, Role, SchoolStaff

User = get_user_model()


# ===========================================================================
# Role
# ===========================================================================

class RoleSerializer(serializers.ModelSerializer):
    """Read/write serializer for the Role lookup table."""

    class Meta:
        model = Role
        fields = ["id", "name", "description", "created_at"]
        read_only_fields = ["id", "created_at"]


# ===========================================================================
# User
# ===========================================================================

class UserListSerializer(serializers.ModelSerializer):
    """Lightweight user representation for list views and nested FK fields."""

    role_name = serializers.CharField(source="role.name", read_only=True, default=None)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "phone_no", "role", "role_name", "is_verified", "is_active",
            "date_joined",
        ]
        read_only_fields = ["id", "date_joined"]


class UserDetailSerializer(serializers.ModelSerializer):
    """Full user representation for detail / update views."""

    role_name = serializers.CharField(source="role.name", read_only=True, default=None)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "phone_no", "role", "role_name", "is_verified", "is_active",
            "is_staff", "date_joined", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "date_joined", "created_at", "updated_at"]


class UserRegisterSerializer(serializers.ModelSerializer):
    """
    Registration serializer.

    Accepts password + password_confirm; creates user with hashed password.
    """

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
        help_text="Minimum 8 characters.",
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
        help_text="Must match password.",
    )

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "phone_no", "role", "password", "password_confirm",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data: dict) -> User:
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ===========================================================================
# Profile Serializers
# ===========================================================================

class PrincipalSerializer(serializers.ModelSerializer):
    """Serializer for Principal profile — linked to a User and School."""

    user_detail = UserListSerializer(source="user", read_only=True)

    class Meta:
        model = Principal
        fields = [
            "id", "user", "user_detail", "school",
            "joining_date", "qualification", "experience_years",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SchoolStaffSerializer(serializers.ModelSerializer):
    """Serializer for SchoolStaff profile."""

    user_detail = UserListSerializer(source="user", read_only=True)

    class Meta:
        model = SchoolStaff
        fields = [
            "id", "user", "user_detail", "school", "designation",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ContractorSerializer(serializers.ModelSerializer):
    """Serializer for Contractor profile."""

    user_detail = UserListSerializer(source="user", read_only=True)
    specialization_display = serializers.CharField(
        source="get_specialization_display", read_only=True,
    )

    class Meta:
        model = Contractor
        fields = [
            "id", "user", "user_detail", "company_name", "license_number",
            "specialization", "specialization_display", "experience_years",
            "rating", "is_available", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DEOSerializer(serializers.ModelSerializer):
    """Serializer for DEO profile."""

    user_detail = UserListSerializer(source="user", read_only=True)

    class Meta:
        model = DEO
        fields = [
            "id", "user", "user_detail", "district", "office_address",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AdminStaffSerializer(serializers.ModelSerializer):
    """Serializer for AdminStaff profile."""

    user_detail = UserListSerializer(source="user", read_only=True)

    class Meta:
        model = AdminStaff
        fields = [
            "id", "user", "user_detail", "office_name", "designation",
            "district", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
