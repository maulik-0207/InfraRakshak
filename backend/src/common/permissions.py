"""
Role-based permissions for the InfraRakshak API.
Enforces strict access control based on the User.Role choices.
"""

from rest_framework import permissions
from apps.accounts.models import User


class IsSchool(permissions.BasePermission):
    """Access for school account owners only."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.SCHOOL


class IsSchoolStaff(permissions.BasePermission):
    """Access for school staff members only."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.STAFF


class IsDEO(permissions.BasePermission):
    """Access for District Education Officers only."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.DEO


class IsAdminStaff(permissions.BasePermission):
    """Access for DEO Admin Staff only."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.ADMIN_STAFF


class IsContractor(permissions.BasePermission):
    """Access for registered Contractors only."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.CONTRACTOR


class IsDEOOrAdminStaff(permissions.BasePermission):
    """Combined permission for DEO and their Admin Staff."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [User.Role.DEO, User.Role.ADMIN_STAFF]


class IsSchoolOrStaff(permissions.BasePermission):
    """Combined permission for School and their Staff."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [User.Role.SCHOOL, User.Role.STAFF]


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model has a 'user' or 'submitted_by' or 'created_by' field.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or request.user.role == User.Role.DEO:
            return True
        
        # Check standard ownership fields
        owner_fields = ['user', 'submitted_by', 'created_by', 'updated_by']
        for field in owner_fields:
            if hasattr(obj, field) and getattr(obj, field) == request.user:
                return True
        
        return False
