"""
Predictions API v1 views.
"""

from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from common.export import export_queryset_to_csv as export_queryset_to_excel
from common.permissions import (
    IsSchool, IsDEO, IsAdminStaff, IsSchoolStaff,
    IsDEOOrAdminStaff, IsSchoolOrStaff
)

from apps.predictions.api.v1.serializers import (
    DistrictReportSerializer,
    PredictionIssuesSerializer,
    PredictionReportDetailSerializer,
    PredictionReportListSerializer,
)
from apps.predictions.models import DistrictReport, PredictionIssues, PredictionReport


@extend_schema_view(
    list=extend_schema(
        summary="List prediction reports",
        description="Paginated list of ML-generated risk predictions. Filter by school, risk level, or priority.",
        tags=["Predictions"],
        parameters=[
            OpenApiParameter("school", type=int, description="Filter by School ID"),
            OpenApiParameter("overall_risk_level", type=str, description="Filter by risk (LOW, MEDIUM, HIGH, CRITICAL)"),
            OpenApiParameter("weekly_report", type=int, description="Filter by source Weekly Report ID"),
        ]
    ),
    retrieve=extend_schema(
        summary="Get prediction report with issues",
        description="Returns the full prediction report including all predicted issues and recommended actions.",
        tags=["Predictions"],
        responses={200: PredictionReportDetailSerializer},
    ),
    create=extend_schema(
        summary="Create prediction report",
        description="Typically created by the ML pipeline. Contains per-category risk scores and priority ranking.",
        tags=["Predictions"],
    ),
    update=extend_schema(summary="Update prediction report", tags=["Predictions"]),
    partial_update=extend_schema(summary="Partially update prediction report", tags=["Predictions"]),
    destroy=extend_schema(summary="Delete prediction report", tags=["Predictions"]),
)
class PredictionReportViewSet(viewsets.ModelViewSet):
    """
    CRUD for ML-generated prediction reports.

    Detail view includes nested prediction issues with severity scores
    and recommended actions.
    """

    queryset = PredictionReport.objects.select_related(
        "school", "weekly_report",
    ).prefetch_related("issues").all()

    search_fields = ["school__name", "school__udise_code"]
    filterset_fields = ["school", "overall_risk_level", "weekly_report", "projection_days"]
    ordering_fields = ["priority_rank", "overall_score", "generated_at"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsSchoolOrStaff]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return qs.none()
            
        if hasattr(user, 'role') and user.role in ["DEO", "ADMIN_STAFF"]:
            if hasattr(user, 'deo_profile'):
                return qs.filter(school__district=user.deo_profile.district)
        elif hasattr(user, 'role') and user.role == "SCHOOL":
            if hasattr(user, 'school_profile'):
                return qs.filter(school=user.school_profile)
        elif hasattr(user, 'role') and user.role == "STAFF":
            if hasattr(user, 'staff_profile') and user.staff_profile.parent_school:
                return qs.filter(school=user.staff_profile.parent_school)
                
        return qs

    @extend_schema(summary="Export predictions to CSV", tags=["Predictions"])
    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        fields = ["school__name", "overall_score", "overall_risk_level", "priority_rank", "generated_at"]
        return export_queryset_to_excel(queryset, fields, filename_prefix="prediction_reports")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PredictionReportDetailSerializer
        return PredictionReportListSerializer


@extend_schema_view(
    list=extend_schema(
        summary="List prediction issues",
        description="All predicted issues across reports. Filter by category or severity.",
        tags=["Predictions"],
    ),
    retrieve=extend_schema(summary="Get prediction issue", tags=["Predictions"]),
    create=extend_schema(summary="Create prediction issue", tags=["Predictions"]),
    update=extend_schema(summary="Update prediction issue", tags=["Predictions"]),
    partial_update=extend_schema(summary="Partially update prediction issue", tags=["Predictions"]),
    destroy=extend_schema(summary="Delete prediction issue", tags=["Predictions"]),
)
class PredictionIssuesViewSet(viewsets.ModelViewSet):
    """CRUD for individual predicted issues."""

    queryset = PredictionIssues.objects.select_related("prediction_report").all()
    serializer_class = PredictionIssuesSerializer
    search_fields = ["issue_name", "recommended_action"]
    filterset_fields = ["prediction_report", "category", "severity"]
    ordering_fields = ["score", "severity"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff | IsSchoolOrStaff]


@extend_schema_view(
    list=extend_schema(
        summary="List district reports",
        description="Aggregated risk summaries per district per week. Filter by district or date.",
        tags=["Predictions"],
        parameters=[
            OpenApiParameter("district", type=str, description="Filter by District name"),
            OpenApiParameter("week_start_date", type=str, description="Filter by start date"),
        ]
    ),
    retrieve=extend_schema(summary="Get district report", tags=["Predictions"]),
    create=extend_schema(
        summary="Create district report",
        description="Typically auto-generated after prediction reports are processed.",
        tags=["Predictions"],
    ),
    update=extend_schema(summary="Update district report", tags=["Predictions"]),
    partial_update=extend_schema(summary="Partially update district report", tags=["Predictions"]),
    destroy=extend_schema(summary="Delete district report", tags=["Predictions"]),
)
class DistrictReportViewSet(viewsets.ModelViewSet):
    """CRUD for district-level aggregated risk reports."""

    queryset = DistrictReport.objects.all()
    serializer_class = DistrictReportSerializer
    search_fields = ["district"]
    filterset_fields = ["district", "week_start_date", "projection_days"]
    ordering_fields = ["week_start_date", "avg_score", "high_risk_schools"]
    permission_classes = [permissions.IsAuthenticated, IsDEOOrAdminStaff]

    @extend_schema(summary="Export district reports to CSV", tags=["Predictions"])
    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        fields = ["district", "week_start_date", "avg_score", "high_risk_schools", "total_schools"]
        return export_queryset_to_excel(queryset, fields, filename_prefix="district_predictions")

    @extend_schema(summary="Get schools by risk level for a district report", tags=["Predictions"])
    @action(detail=True, methods=["get"], url_path="schools")
    def schools(self, request, pk=None):
        from rest_framework.response import Response
        
        district_report = self.get_object()
        risk_level = request.query_params.get("risk_level")
        
        preds = PredictionReport.objects.filter(
            school__district=district_report.district,
            weekly_report__week_start_date=district_report.week_start_date,
        ).select_related("school").order_by("priority_rank", "-overall_score")
        
        if risk_level:
            preds = preds.filter(overall_risk_level=risk_level.upper())
            
        data = []
        for p in preds:
            data.append({
                "id": p.id,
                "school_id": p.school.id,
                "school_name": p.school.name,
                "district": p.school.district,
                "udise_code": p.school.udise_code,
                "overall_score": p.overall_score,
                "overall_risk_level": p.overall_risk_level,
                "priority_rank": p.priority_rank,
                "generated_at": p.generated_at,
            })
        return Response(data)
