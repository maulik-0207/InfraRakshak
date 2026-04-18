"""
Accounts API v1 views.

ViewSets for User, Role, and profile models with full
drf-spectacular documentation.
"""

from django.contrib.auth import get_user_model
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.api.v1.serializers import (
    AdminStaffSerializer,
    ContractorSerializer,
    DEOSerializer,
    PrincipalSerializer,
    RoleSerializer,
    SchoolStaffSerializer,
    UserDetailSerializer,
    UserListSerializer,
    UserRegisterSerializer,
    CustomTokenObtainPairSerializer,
)
from apps.accounts.models import AdminStaff, Contractor, DEO, Principal, Role, SchoolStaff
from apps.accounts.services import AuthService

User = get_user_model()


# ===========================================================================
# Role ViewSet
# ===========================================================================

@extend_schema_view(
    list=extend_schema(
        summary="List all roles",
        description="Returns all available user roles. No authentication required for listing.",
        tags=["Accounts"],
    ),
    retrieve=extend_schema(
        summary="Get role details",
        description="Retrieve a single role by its ID.",
        tags=["Accounts"],
    ),
    create=extend_schema(
        summary="Create a new role",
        description="Create a new role entry. Admin-only.",
        tags=["Accounts"],
        examples=[
            OpenApiExample(
                "Create Role",
                value={"name": "INSPECTOR", "description": "School infrastructure inspector"},
                request_only=True,
            ),
        ],
    ),
    update=extend_schema(summary="Update a role", tags=["Accounts"]),
    partial_update=extend_schema(summary="Partially update a role", tags=["Accounts"]),
    destroy=extend_schema(summary="Delete a role", tags=["Accounts"]),
)
class RoleViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for user roles.

    Roles are used to control access across the platform.
    Default roles: DEO, ADMIN_STAFF, PRINCIPAL, SCHOOL_STAFF, CONTRACTOR.
    """

    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]


# ===========================================================================
# User ViewSet
# ===========================================================================

@extend_schema_view(
    list=extend_schema(
        summary="List all users",
        description="Paginated list of all users. Filterable by role and status.",
        tags=["Accounts"],
    ),
    retrieve=extend_schema(
        summary="Get user details",
        description="Retrieve full details for a single user.",
        tags=["Accounts"],
        responses={200: UserDetailSerializer},
    ),
    create=extend_schema(
        summary="Register a new user",
        description=(
            "Create a new user account with email verification pending.\n\n"
            "**Validation rules:**\n"
            "- `username` must be unique\n"
            "- `email` must be unique and valid\n"
            "- `password` minimum 8 characters\n"
            "- `password_confirm` must match `password`"
        ),
        tags=["Auth"],
        request=UserRegisterSerializer,
        responses={
            201: OpenApiResponse(
                response=UserListSerializer,
                description="User created successfully.",
            ),
            400: OpenApiResponse(description="Validation error."),
        },
        examples=[
            OpenApiExample(
                "Register User",
                value={
                    "username": "rajesh_kumar",
                    "email": "rajesh@example.com",
                    "first_name": "Rajesh",
                    "last_name": "Kumar",
                    "phone_no": "+919876543210",
                    "role": 1,
                    "password": "SecureP@ss123",
                    "password_confirm": "SecureP@ss123",
                },
                request_only=True,
            ),
        ],
    ),
    update=extend_schema(summary="Update user", tags=["Accounts"]),
    partial_update=extend_schema(summary="Partially update user", tags=["Accounts"]),
    destroy=extend_schema(summary="Deactivate user", tags=["Accounts"]),
)
class UserViewSet(viewsets.ModelViewSet):
    """
    User management endpoints.

    - **POST** (create) is used for registration (no auth required).
    - All other actions require authentication.
    """

    queryset = User.objects.select_related("role").all()
    search_fields = ["username", "email", "first_name", "last_name"]
    filterset_fields = ["role", "is_active", "is_verified"]
    ordering_fields = ["date_joined", "username"]

    def get_permissions(self):
        if self.action in ["create", "verify_email"]:
            return [permissions.AllowAny()]
        return super().get_permissions()

    @extend_schema(
        summary="Verify email address",
        description="Verify a user's email address using a UUID token sent via email.",
        tags=["Auth"],
        parameters=[
            {"name": "token", "in": "query", "type": "string", "required": True}
        ],
        responses={
            200: OpenApiResponse(description="Email verified successfully."),
            400: OpenApiResponse(description="Invalid or expired token."),
        },
    )
    @action(detail=False, methods=["get"], url_path="verify-email")
    def verify_email(self, request):
        token = request.query_params.get("token")
        if not token:
            return Response(
                {"error": "Token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = AuthService.verify_email(token)
        if success:
            return Response(
                {"message": "Email verified successfully. You can now log in."},
                status=status.HTTP_200_OK
            )
        return Response(
            {"error": "Invalid or expired token."},
            status=status.HTTP_400_BAD_REQUEST
        )

    def get_serializer_class(self):
        if self.action == "create":
            return UserRegisterSerializer
        if self.action in ("retrieve", "update", "partial_update"):
            return UserDetailSerializer
        return UserListSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @extend_schema(
        summary="Get current user profile",
        description="Returns the authenticated user's own profile.",
        tags=["Auth"],
        responses={200: UserDetailSerializer},
    )
    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        """Return the current authenticated user's profile."""
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)


# ===========================================================================
# Profile ViewSets
# ===========================================================================

@extend_schema_view(
    list=extend_schema(summary="List principals", tags=["Accounts"]),
    retrieve=extend_schema(summary="Get principal details", tags=["Accounts"]),
    create=extend_schema(
        summary="Create principal profile",
        tags=["Accounts"],
        examples=[
            OpenApiExample(
                "Create Principal",
                value={
                    "user": 1,
                    "school": 1,
                    "joining_date": "2023-06-15",
                    "qualification": "M.Ed",
                    "experience_years": 12,
                },
                request_only=True,
            ),
        ],
    ),
    update=extend_schema(summary="Update principal", tags=["Accounts"]),
    partial_update=extend_schema(summary="Partially update principal", tags=["Accounts"]),
    destroy=extend_schema(summary="Delete principal profile", tags=["Accounts"]),
)
class PrincipalViewSet(viewsets.ModelViewSet):
    """CRUD for Principal profiles. Each principal is linked to a User and School."""

    queryset = Principal.objects.select_related("user", "school").all()
    serializer_class = PrincipalSerializer
    search_fields = ["user__username", "user__email", "school__name"]
    filterset_fields = ["school"]


@extend_schema_view(
    list=extend_schema(summary="List school staff", tags=["Accounts"]),
    retrieve=extend_schema(summary="Get school staff details", tags=["Accounts"]),
    create=extend_schema(summary="Create school staff profile", tags=["Accounts"]),
    update=extend_schema(summary="Update school staff", tags=["Accounts"]),
    partial_update=extend_schema(summary="Partially update school staff", tags=["Accounts"]),
    destroy=extend_schema(summary="Delete school staff profile", tags=["Accounts"]),
)
class SchoolStaffViewSet(viewsets.ModelViewSet):
    """CRUD for SchoolStaff profiles."""

    queryset = SchoolStaff.objects.select_related("user", "school").all()
    serializer_class = SchoolStaffSerializer
    search_fields = ["user__username", "designation"]
    filterset_fields = ["school", "designation"]


@extend_schema_view(
    list=extend_schema(summary="List contractors", tags=["Accounts"]),
    retrieve=extend_schema(summary="Get contractor details", tags=["Accounts"]),
    create=extend_schema(
        summary="Create contractor profile",
        tags=["Accounts"],
        examples=[
            OpenApiExample(
                "Create Contractor",
                value={
                    "user": 2,
                    "company_name": "BuildRight Infra Pvt Ltd",
                    "license_number": "GJ-CON-2024-00123",
                    "specialization": "PLUMBING",
                    "experience_years": 8,
                    "is_available": True,
                },
                request_only=True,
            ),
        ],
    ),
    update=extend_schema(summary="Update contractor", tags=["Accounts"]),
    partial_update=extend_schema(summary="Partially update contractor", tags=["Accounts"]),
    destroy=extend_schema(summary="Delete contractor profile", tags=["Accounts"]),
)
class ContractorViewSet(viewsets.ModelViewSet):
    """CRUD for Contractor profiles."""

    queryset = Contractor.objects.select_related("user").all()
    serializer_class = ContractorSerializer
    search_fields = ["company_name", "license_number", "user__username"]
    filterset_fields = ["specialization", "is_available"]


@extend_schema_view(
    list=extend_schema(summary="List DEOs", tags=["Accounts"]),
    retrieve=extend_schema(summary="Get DEO details", tags=["Accounts"]),
    create=extend_schema(summary="Create DEO profile", tags=["Accounts"]),
    update=extend_schema(summary="Update DEO", tags=["Accounts"]),
    partial_update=extend_schema(summary="Partially update DEO", tags=["Accounts"]),
    destroy=extend_schema(summary="Delete DEO profile", tags=["Accounts"]),
)
class DEOViewSet(viewsets.ModelViewSet):
    """CRUD for DEO (District Education Officer) profiles."""

    queryset = DEO.objects.select_related("user").all()
    serializer_class = DEOSerializer
    search_fields = ["user__username", "district"]
    filterset_fields = ["district"]


@extend_schema_view(
    list=extend_schema(summary="List admin staff", tags=["Accounts"]),
    retrieve=extend_schema(summary="Get admin staff details", tags=["Accounts"]),
    create=extend_schema(summary="Create admin staff profile", tags=["Accounts"]),
    update=extend_schema(summary="Update admin staff", tags=["Accounts"]),
    partial_update=extend_schema(summary="Partially update admin staff", tags=["Accounts"]),
    destroy=extend_schema(summary="Delete admin staff profile", tags=["Accounts"]),
)
class AdminStaffViewSet(viewsets.ModelViewSet):
    """CRUD for AdminStaff profiles."""

    queryset = AdminStaff.objects.select_related("user").all()
    serializer_class = AdminStaffSerializer
    search_fields = ["user__username", "office_name", "designation"]
    filterset_fields = ["district"]
