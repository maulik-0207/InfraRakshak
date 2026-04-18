"""
Reports API v1 views.
"""

from drf_spectacular.utils import OpenApiExample, OpenApiParameter, OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import viewsets, permissions
from common.permissions import (
    IsSchool, IsDEO, IsAdminStaff, IsSchoolStaff,
    IsDEOOrAdminStaff, IsSchoolOrStaff
)
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.reports.api.v1.serializers import (
    WeeklyElectricalReportSerializer,
    WeeklyIssuesSerializer,
    WeeklyPlumbingReportSerializer,
    WeeklyReportDetailSerializer,
    WeeklyReportListSerializer,
    WeeklyStructuralReportSerializer,
)
from apps.reports.services import ReportCycleService
from common.export import export_queryset_to_csv as export_queryset_to_excel
from apps.reports.models import (
    WeeklyElectricalReport,
    WeeklyIssues,
    WeeklyPlumbingReport,
    WeeklyReport,
    WeeklyStructuralReport,
)


@extend_schema_view(
    list=extend_schema(
        summary="List weekly reports",
        description="Paginated list of weekly reports. Filter by school, status, or date range.",
        tags=["Reports"],
        parameters=[
            OpenApiParameter("school", type=int, description="Filter by School ID"),
            OpenApiParameter("status", type=str, description="Filter by status (DRAFT, SUBMITTED, REVIEWED)"),
            OpenApiParameter("week_start_date", type=str, description="Filter by start date (YYYY-MM-DD)"),
        ]
    ),
    retrieve=extend_schema(
        summary="Get weekly report with sub-reports",
        description="Returns the full weekly report including nested plumbing, electrical, structural sub-reports and issues.",
        tags=["Reports"],
        responses={200: WeeklyReportDetailSerializer},
    ),
    create=extend_schema(
        summary="Create weekly report",
        description=(
            "Create a new weekly report for a school.\n\n"
            "**Constraints:**\n"
            "- Unique per `(school, week_start_date, week_end_date)`\n"
            "- `week_end_date` must be >= `week_start_date`"
        ),
        tags=["Reports"],
        examples=[
            OpenApiExample(
                "Create Weekly Report",
                value={
                    "school": 1,
                    "week_start_date": "2025-04-14",
                    "week_end_date": "2025-04-20",
                    "status": "DRAFT",
                    "remarks": "First inspection of the month.",
                },
                request_only=True,
            ),
        ],
    ),
    update=extend_schema(summary="Update weekly report", tags=["Reports"]),
    partial_update=extend_schema(summary="Partially update weekly report", tags=["Reports"]),
    destroy=extend_schema(summary="Delete weekly report", tags=["Reports"]),
)
class WeeklyReportViewSet(viewsets.ModelViewSet):
    """
    CRUD for weekly infrastructure reports.

    The detail view includes nested sub-reports (plumbing, electrical,
    structural) and all associated issues.

    **Recommended query optimization:**
    Use `?expand=true` for nested data (detail view auto-expands).
    """

    queryset = WeeklyReport.objects.select_related(
        "school", "submitted_by", "reviewed_by",
        "plumbing_report", "electrical_report", "structural_report",
    ).prefetch_related("issues").all()

    search_fields = ["school__name", "school__udise_code"]
    filterset_fields = ["school", "status", "week_start_date"]
    ordering_fields = ["week_start_date", "created_at", "status"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsSchoolOrStaff]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        if user.role in [user.Role.DEO, user.Role.ADMIN_STAFF]:
            if hasattr(user, 'deo_profile'):
                return qs.filter(school__district=user.deo_profile.district)
            return qs.none()
            
        elif user.role in [user.Role.SCHOOL, user.Role.STAFF]:
            udise = None
            if hasattr(user, 'school_profile'):
                udise = user.school_profile.udise_code
            elif hasattr(user, 'staff_profile') and user.staff_profile.parent_school:
                udise = user.staff_profile.parent_school.udise_code
                
            if udise:
                return qs.filter(school__udise_code=udise)
            return qs.none()
            
        return qs.none()

    @extend_schema(summary="Export reports to CSV", tags=["Reports"])
    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        fields = ["school__name", "week_start_date", "week_end_date", "status", "submitted_at"]
        return export_queryset_to_excel(queryset, fields, filename_prefix="weekly_reports")

    @extend_schema(
        summary="Submit and lock weekly report",
        description="Transitions a DRAFT report to SUBMITTED and locks it. Triggers ML prediction.",
        tags=["Reports Workflow"],
        request=None,
        responses={
            200: WeeklyReportDetailSerializer,
            400: OpenApiResponse(description="Report not in DRAFT status or other error."),
        },
    )
    @action(detail=True, methods=["post"], url_path="submit")
    def submit(self, request, pk=None):
        report = ReportCycleService.submit_report(pk, request.user)
        serializer = WeeklyReportDetailSerializer(report)
        return Response(serializer.data)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return WeeklyReportDetailSerializer
        return WeeklyReportListSerializer


@extend_schema_view(
    list=extend_schema(summary="List plumbing reports", tags=["Reports"]),
    retrieve=extend_schema(summary="Get plumbing report", tags=["Reports"]),
    create=extend_schema(
        summary="Create plumbing report",
        description="Create a plumbing sub-report for a weekly report. `functional_taps` <= `total_taps`.",
        tags=["Reports"],
    ),
    update=extend_schema(summary="Update plumbing report", tags=["Reports"]),
    partial_update=extend_schema(summary="Partially update plumbing report", tags=["Reports"]),
    destroy=extend_schema(summary="Delete plumbing report", tags=["Reports"]),
)
class WeeklyPlumbingReportViewSet(viewsets.ModelViewSet):
    """CRUD for weekly plumbing sub-reports (one-to-one with WeeklyReport)."""

    queryset = WeeklyPlumbingReport.objects.select_related("weekly_report").all()
    serializer_class = WeeklyPlumbingReportSerializer
    filterset_fields = ["weekly_report", "drainage_blockage", "water_availability"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsSchoolOrStaff]


@extend_schema_view(
    list=extend_schema(summary="List electrical reports", tags=["Reports"]),
    retrieve=extend_schema(summary="Get electrical report", tags=["Reports"]),
    create=extend_schema(
        summary="Create electrical report",
        description="Create an electrical sub-report. `functional_fans` <= `total_fans`, `functional_lights` <= `total_lights`.",
        tags=["Reports"],
    ),
    update=extend_schema(summary="Update electrical report", tags=["Reports"]),
    partial_update=extend_schema(summary="Partially update electrical report", tags=["Reports"]),
    destroy=extend_schema(summary="Delete electrical report", tags=["Reports"]),
)
class WeeklyElectricalReportViewSet(viewsets.ModelViewSet):
    """CRUD for weekly electrical sub-reports."""

    queryset = WeeklyElectricalReport.objects.select_related("weekly_report").all()
    serializer_class = WeeklyElectricalReportSerializer
    filterset_fields = ["weekly_report", "wiring_issues", "backup_available"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsSchoolOrStaff]


@extend_schema_view(
    list=extend_schema(summary="List structural reports", tags=["Reports"]),
    retrieve=extend_schema(summary="Get structural report", tags=["Reports"]),
    create=extend_schema(
        summary="Create structural report",
        description="Create a structural sub-report. `classrooms_usable` <= `classrooms_total`.",
        tags=["Reports"],
    ),
    update=extend_schema(summary="Update structural report", tags=["Reports"]),
    partial_update=extend_schema(summary="Partially update structural report", tags=["Reports"]),
    destroy=extend_schema(summary="Delete structural report", tags=["Reports"]),
)
class WeeklyStructuralReportViewSet(viewsets.ModelViewSet):
    """CRUD for weekly structural sub-reports."""

    queryset = WeeklyStructuralReport.objects.select_related("weekly_report").all()
    serializer_class = WeeklyStructuralReportSerializer
    filterset_fields = ["weekly_report", "building_safety", "repair_required"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsSchoolOrStaff]


@extend_schema_view(
    list=extend_schema(
        summary="List weekly issues",
        description="List all issues. Filter by type, severity, or resolution status.",
        tags=["Reports"],
    ),
    retrieve=extend_schema(summary="Get issue details", tags=["Reports"]),
    create=extend_schema(
        summary="Report a new issue",
        tags=["Reports"],
        examples=[
            OpenApiExample(
                "Create Issue",
                value={
                    "weekly_report": 1,
                    "issue_type": "PLUMBING",
                    "severity": "HIGH",
                    "description": "Main water pipe burst near boys toilet block.",
                    "is_resolved": False,
                },
                request_only=True,
            ),
        ],
    ),
    update=extend_schema(summary="Update issue", tags=["Reports"]),
    partial_update=extend_schema(summary="Partially update issue", tags=["Reports"]),
    destroy=extend_schema(summary="Delete issue", tags=["Reports"]),
)
class WeeklyIssuesViewSet(viewsets.ModelViewSet):
    """CRUD for individual issues within weekly reports."""

    queryset = WeeklyIssues.objects.select_related("weekly_report").all()
    serializer_class = WeeklyIssuesSerializer
    search_fields = ["description"]
    filterset_fields = ["weekly_report", "issue_type", "severity", "is_resolved"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsSchoolOrStaff]
    ordering_fields = ["severity", "created_at"]
