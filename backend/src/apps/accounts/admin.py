"""
Accounts app admin configuration — Refactored.
"""

from django.contrib import admin
from django.contrib.auth import get_user_model
from apps.accounts.models import (
    SchoolAccountProfile, DEOProfile, ContractorProfile, 
    AdminStaffProfile, StaffProfile
)

User = get_user_model()


# ===========================================================================
# User Admin
# ===========================================================================

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    """Custom admin for the refactored User model."""

    list_display = (
        "email",
        "role",
        "is_verified",
        "is_active",
        "is_staff",
        "date_joined",
    )
    list_filter = ("role", "is_verified", "is_active", "is_staff")
    search_fields = ("email",)
    ordering = ("-date_joined",)
    
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Permissions", {"fields": ("role", "is_verified", "is_active", "is_staff", "is_superuser")}),
        ("Dates", {"fields": ("date_joined",)}),
    )
    readonly_fields = ("date_joined",)


# ===========================================================================
# Profile Admins
# ===========================================================================

@admin.register(SchoolAccountProfile)
class SchoolAccountProfileAdmin(admin.ModelAdmin):
    list_display = ("school_name", "udise_code", "user", "district", "school_type")
    search_fields = ("school_name", "udise_code", "user__email", "district")
    list_filter = ("school_type", "district")
    raw_id_fields = ("user",)


@admin.register(DEOProfile)
class DEOProfileAdmin(admin.ModelAdmin):
    list_display = ("district", "user", "office_address")
    search_fields = ("district", "user__email")
    raw_id_fields = ("user",)


@admin.register(ContractorProfile)
class ContractorProfileAdmin(admin.ModelAdmin):
    list_display = ("company_name", "license_number", "user", "phone_no")
    search_fields = ("company_name", "license_number", "user__email")
    raw_id_fields = ("user",)


@admin.register(AdminStaffProfile)
class AdminStaffProfileAdmin(admin.ModelAdmin):
    list_display = ("full_name", "user", "parent_deo", "phone_no")
    search_fields = ("full_name", "user__email", "parent_deo__district")
    raw_id_fields = ("user", "parent_deo")


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ("full_name", "user", "parent_school", "phone_no")
    search_fields = ("full_name", "user__email", "parent_school__school_name")
    raw_id_fields = ("user", "parent_school")
