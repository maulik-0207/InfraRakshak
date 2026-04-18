"""
Accounts API v1 views — Refactored for New Workflows.
"""

from rest_framework import permissions, status, viewsets, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import (
    extend_schema, 
    extend_schema_view, 
    OpenApiParameter, 
    OpenApiResponse, 
    OpenApiExample
)

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from common.permissions import (
    IsSchool, IsDEO, IsContractor, IsAdminStaff, IsSchoolStaff,
    IsDEOOrAdminStaff, IsSchoolOrStaff
)

from apps.accounts.models import (
    User, SchoolAccountProfile, DEOProfile, ContractorProfile, 
    AdminStaffProfile, StaffProfile
)
from apps.accounts.api.v1.serializers import (
    UserListSerializer, UserDetailSerializer,
    SchoolAccountProfileSerializer, DEOProfileSerializer, ContractorProfileSerializer,
    AdminStaffProfileSerializer, StaffProfileSerializer,
    SchoolSelfRegistrationSerializer, ContractorRegistrationSerializer,
    BulkOnboardingSerializer,
    LogoutRequestSerializer, DashboardSerializer,
    CustomTokenObtainPairSerializer
)
from apps.accounts.services import AuthService, OnboardingService


# ===========================================================================
# User & Auth
# ===========================================================================

@extend_schema(
    summary="User Login (JWT)",
    description=(
        "Authenticates a user by email and returns access/refresh tokens. "
        "Also includes the user's role and a specialized dashboard redirect URL."
    ),
    tags=["Auth"],
    responses={
        200: OpenApiResponse(
            description="Login successful. Returns JWT tokens and user metadata.",
        ),
        401: OpenApiResponse(description="Invalid credentials or unverified email."),
    }
)
class LoginView(TokenObtainPairView):
    """
    Custom Login View using Email.
    Returns access, refresh, role, and redirect_url.
    """
    serializer_class = CustomTokenObtainPairSerializer


@extend_schema(
    summary="User Logout",
    description="Blacklists the provided refresh token to securely end the session.",
    tags=["Auth"],
    request=LogoutRequestSerializer,
    responses={205: OpenApiResponse(description="Token blacklisted successfully.")}
)
class LogoutView(APIView):
    serializer_class = LogoutRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)


@extend_schema_view(
    list=extend_schema(
        summary="Get Dashboard Statistics",
        description="Returns role-specific statistics and overview data for the authenticated user.",
        tags=["Dashboard"],
        responses={200: DashboardSerializer}
    )
)
class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DashboardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        user = request.user
        role = user.role
        data = {"role": role, "email": user.email, "stats": {}}

        if role == User.Role.DEO:
            from apps.schools.models import School
            from apps.contracts.models import Contract
            data["stats"] = {
                "total_schools": School.objects.filter(district=user.deo_profile.district).count(),
                "active_contracts": Contract.objects.filter(status="IN_PROGRESS").count(),
                "pending_bids": 0, # Placeholder
            }
        elif role == User.Role.SCHOOL:
            from apps.reports.models import WeeklyReport
            data["stats"] = {
                "total_staff": user.school_profile.staff_members.count(),
                "pending_reports": WeeklyReport.objects.filter(school__school_profile=user.school_profile, status="DRAFT").count(),
                "submitted_reports": WeeklyReport.objects.filter(school__school_profile=user.school_profile, status="SUBMITTED").count(),
            }
        elif role == User.Role.CONTRACTOR:
            from apps.contracts.models import Contract
            data["stats"] = {
                "assigned_contracts": Contract.objects.filter(assigned_contractor=user).count(),
                "active_bids": 0, # Placeholder
            }
        
        return Response(data)


@extend_schema_view(
    list=extend_schema(
        summary="List all users", 
        description="Returns a paginated list of all users. Can be filtered by role, status, and verification state.",
        tags=["Accounts"],
        parameters=[
            OpenApiParameter("role", type=str, description="Filter by user role (SCHOOL, DEO, etc.)"),
            OpenApiParameter("is_active", type=bool, description="Filter by active status"),
            OpenApiParameter("is_verified", type=bool, description="Filter by email verification status"),
        ]
    ),
    retrieve=extend_schema(summary="Get user details", tags=["Accounts"]),
    update=extend_schema(summary="Update user", tags=["Accounts"]),
    partial_update=extend_schema(summary="Partially update user", tags=["Accounts"]),
    destroy=extend_schema(summary="Delete user", tags=["Accounts"]),
)
class UserViewSet(viewsets.ModelViewSet):
    """
    Standard user management.
    """
    queryset = User.objects.all()
    search_fields = ["email"]
    filterset_fields = ["role", "is_active", "is_verified"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff]

    def get_serializer_class(self):
        if self.action in ("retrieve", "update", "partial_update"):
            return UserDetailSerializer
        return UserListSerializer

    @extend_schema(summary="Get current user info", tags=["Auth"])
    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

    @extend_schema(
        summary="Verify email address",
        tags=["Auth"],
        parameters=[{"name": "token", "in": "query", "type": "string", "required": True}],
    )
    @action(detail=False, methods=["get"], url_path="verify-email", permission_classes=[permissions.AllowAny])
    def verify_email(self, request):
        token = request.query_params.get("token")
        if not token:
            return Response({"error": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if AuthService.verify_email(token):
            return Response({"message": "Email verified successfully."}, status=status.HTTP_200_OK)
        return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)


class SchoolRegistrationView(APIView):
    """API for self-registration of schools."""
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="School Self-Registration",
        description="Public endpoint for schools to register their own account. Password must be at least 8 characters.",
        request=SchoolSelfRegistrationSerializer,
        responses={201: UserListSerializer},
        tags=["Auth"],
        examples=[
            OpenApiExample(
                "School Registration",
                value={
                    "email": "principal@mg_highschool.edu",
                    "password": "SecurePassword123",
                    "school_id": "SCH-00123",
                    "school_name": "Mahatma Gandhi High School",
                    "phone_no": "9876543210",
                    "district": "Ahmedabad",
                    "address": "123 Education Square, Main St",
                    "school_type": "Secondary"
                }
            )
        ]
    )
    def post(self, request):
        serializer = SchoolSelfRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthService.register_school(serializer.validated_data)
        return Response(UserListSerializer(user).data, status=status.HTTP_201_CREATED)


class ContractorRegistrationView(APIView):
    """API for self-registration of contractors."""
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Contractor Self-Registration",
        description="Public endpoint for contractors to register their own account and company profile.",
        request=ContractorRegistrationSerializer,
        responses={201: UserListSerializer},
        tags=["Auth"],
        examples=[
            OpenApiExample(
                "Contractor Registration",
                value={
                    "email": "contact@buildwell_infra.com",
                    "password": "SecurePassword123",
                    "company_name": "BuildWell Infra Pvt Ltd",
                    "license_number": "LIC-2024-001",
                    "phone_no": "9988776655"
                }
            )
        ]
    )
    def post(self, request):
        serializer = ContractorRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthService.register_contractor(serializer.validated_data)
        return Response(UserListSerializer(user).data, status=status.HTTP_201_CREATED)


class BulkOnboardingView(APIView):
    """API for bulk creating accounts (DEOs, Admin Staff, School Staff)."""
    parser_classes = [parsers.MultiPartParser]
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Bulk Onboarding (Excel)",
        description=(
            "Upload an Excel file to bulk-create accounts. "
            "DEOs can add Admin Staff, Schools can add Staff, and Superusers can add DEOs."
        ),
        request=BulkOnboardingSerializer,
        responses={201: OpenApiResponse(description="Accounts created successfully")},
        tags=["Onboarding"]
    )
    def post(self, request):
        serializer = BulkOnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        file = serializer.validated_data['file']
        role = serializer.validated_data['role']
        
        # Permission logic
        if role == User.Role.ADMIN_STAFF and request.user.role != User.Role.DEO:
            return Response({"error": "Only DEOs can add Admin Staff."}, status=status.HTTP_403_FORBIDDEN)
        if role == User.Role.STAFF and request.user.role != User.Role.SCHOOL:
            return Response({"error": "Only School accounts can add staff."}, status=status.HTTP_403_FORBIDDEN)
        if role == User.Role.DEO and not request.user.is_superuser:
            return Response({"error": "Only Superusers can add DEOs."}, status=status.HTTP_403_FORBIDDEN)

        count = OnboardingService.bulk_onboard_from_excel(file, role, creator_user=request.user)
        return Response({"message": f"Successfully created {count} accounts."}, status=status.HTTP_201_CREATED)


# ===========================================================================
# Profile ViewSets
# ===========================================================================

# Helper for Profile ViewSet Docs
PROFILE_KWARGS = {
    "list": {"summary": "List profiles", "tags": ["Profiles"]},
    "retrieve": {"summary": "Get profile details", "tags": ["Profiles"]},
    "update": {"summary": "Update profile", "tags": ["Profiles"]},
    "partial_update": {"summary": "Partially update profile", "tags": ["Profiles"]},
    "destroy": {"summary": "Delete profile", "tags": ["Profiles"]},
}

@extend_schema_view(
    list=extend_schema(**{**PROFILE_KWARGS["list"], "summary": "List school profiles"}),
    retrieve=extend_schema(**{**PROFILE_KWARGS["retrieve"], "summary": "Get school profile details"}),
    update=extend_schema(**{**PROFILE_KWARGS["update"], "summary": "Update school profile"}),
    partial_update=extend_schema(**{**PROFILE_KWARGS["partial_update"], "summary": "Partially update school profile"}),
    destroy=extend_schema(**{**PROFILE_KWARGS["destroy"], "summary": "Delete school profile"}),
)
class SchoolAccountProfileViewSet(viewsets.ModelViewSet):
    queryset = SchoolAccountProfile.objects.all()
    serializer_class = SchoolAccountProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsSchool]

@extend_schema_view(
    list=extend_schema(**{**PROFILE_KWARGS["list"], "summary": "List DEO profiles"}),
    retrieve=extend_schema(**{**PROFILE_KWARGS["retrieve"], "summary": "Get DEO profile details"}),
    update=extend_schema(**{**PROFILE_KWARGS["update"], "summary": "Update DEO profile"}),
    partial_update=extend_schema(**{**PROFILE_KWARGS["partial_update"], "summary": "Partially update DEO profile"}),
    destroy=extend_schema(**{**PROFILE_KWARGS["destroy"], "summary": "Delete DEO profile"}),
)
class DEOProfileViewSet(viewsets.ModelViewSet):
    queryset = DEOProfile.objects.all()
    serializer_class = DEOProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff]

@extend_schema_view(
    list=extend_schema(**{**PROFILE_KWARGS["list"], "summary": "List contractor profiles"}),
    retrieve=extend_schema(**{**PROFILE_KWARGS["retrieve"], "summary": "Get contractor profile details"}),
    update=extend_schema(**{**PROFILE_KWARGS["update"], "summary": "Update contractor profile"}),
    partial_update=extend_schema(**{**PROFILE_KWARGS["partial_update"], "summary": "Partially update contractor profile"}),
    destroy=extend_schema(**{**PROFILE_KWARGS["destroy"], "summary": "Delete contractor profile"}),
)
class ContractorProfileViewSet(viewsets.ModelViewSet):
    queryset = ContractorProfile.objects.all()
    serializer_class = ContractorProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsContractor]

@extend_schema_view(
    list=extend_schema(**{**PROFILE_KWARGS["list"], "summary": "List admin staff profiles"}),
    retrieve=extend_schema(**{**PROFILE_KWARGS["retrieve"], "summary": "Get admin staff profile details"}),
    update=extend_schema(**{**PROFILE_KWARGS["update"], "summary": "Update admin staff profile"}),
    partial_update=extend_schema(**{**PROFILE_KWARGS["partial_update"], "summary": "Partially update admin staff profile"}),
    destroy=extend_schema(**{**PROFILE_KWARGS["destroy"], "summary": "Delete admin staff profile"}),
)
class AdminStaffProfileViewSet(viewsets.ModelViewSet):
    queryset = AdminStaffProfile.objects.all()
    serializer_class = AdminStaffProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff]

@extend_schema_view(
    list=extend_schema(**{**PROFILE_KWARGS["list"], "summary": "List school staff profiles"}),
    retrieve=extend_schema(**{**PROFILE_KWARGS["retrieve"], "summary": "Get school staff profile details"}),
    update=extend_schema(**{**PROFILE_KWARGS["update"], "summary": "Update school staff profile"}),
    partial_update=extend_schema(**{**PROFILE_KWARGS["partial_update"], "summary": "Partially update school staff profile"}),
    destroy=extend_schema(**{**PROFILE_KWARGS["destroy"], "summary": "Delete school staff profile"}),
)
class StaffProfileViewSet(viewsets.ModelViewSet):
    queryset = StaffProfile.objects.all()
    serializer_class = StaffProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsSchoolOrStaff]
