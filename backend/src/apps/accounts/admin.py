"""
Accounts app admin configuration.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.accounts.models import (
    AdminStaff,
    Contractor,
    DEO,
    Principal,
    Role,
    SchoolStaff,
    User,
)


# ===========================================================================
# User Admin
# ===========================================================================

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for the User model."""

    list_display = (
        "username",
        "email",
        "phone_no",
        "role",
        "is_verified",
        "is_active",
        "is_staff",
        "date_joined",
    )
    list_filter = ("role", "is_verified", "is_active", "is_staff")
    search_fields = ("username", "email", "first_name", "last_name", "phone_no")
    ordering = ("-date_joined",)

    # Extend the default fieldsets with our custom fields
    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Extended Info",
            {
                "fields": ("phone_no", "role", "is_verified"),
            },
        ),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (
            "Extended Info",
            {
                "fields": ("email", "phone_no", "role", "is_verified"),
            },
        ),
    )


# ===========================================================================
# Role Admin
# ===========================================================================

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "description", "created_at")
    search_fields = ("name",)
    ordering = ("name",)


# ===========================================================================
# Profile Admins
# ===========================================================================

@admin.register(Principal)
class PrincipalAdmin(admin.ModelAdmin):
    list_display = ("user", "school", "joining_date", "qualification", "experience_years")
    search_fields = ("user__username", "user__email", "school__name")
    list_filter = ("experience_years",)
    raw_id_fields = ("user", "school")


@admin.register(SchoolStaff)
class SchoolStaffAdmin(admin.ModelAdmin):
    list_display = ("user", "school", "designation")
    search_fields = ("user__username", "user__email", "designation")
    list_filter = ("designation",)
    raw_id_fields = ("user", "school")


@admin.register(Contractor)
class ContractorAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "company_name",
        "license_number",
        "specialization",
        "experience_years",
        "rating",
        "is_available",
    )
    search_fields = ("user__username", "company_name", "license_number")
    list_filter = ("specialization", "is_available")
    raw_id_fields = ("user",)


@admin.register(DEO)
class DEOAdmin(admin.ModelAdmin):
    list_display = ("user", "district", "office_address")
    search_fields = ("user__username", "user__email", "district")
    list_filter = ("district",)
    raw_id_fields = ("user",)


@admin.register(AdminStaff)
class AdminStaffAdmin(admin.ModelAdmin):
    list_display = ("user", "office_name", "designation", "district")
    search_fields = ("user__username", "user__email", "office_name", "designation")
    list_filter = ("district", "designation")
    raw_id_fields = ("user",)
