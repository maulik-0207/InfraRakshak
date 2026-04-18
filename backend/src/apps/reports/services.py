"""
Reports app services for business logic.
"""

import logging
from datetime import date, timedelta
from django.utils import timezone
from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import WeeklyReport, WeeklyPlumbingReport, WeeklyElectricalReport, WeeklyStructuralReport
from apps.schools.models import School

logger = logging.getLogger(__name__)


class ReportCycleService:
    """
    Manages the lifecycle of weekly infrastructure reports.
    """

    @staticmethod
    @transaction.atomic
    def init_weekly_cycle():
        """
        Celery task entry point to create DRAFT reports for all active schools.
        Typically runs every Monday morning.
        """
        today = date.today()
        # Week range: Monday to Sunday
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)

        active_schools = School.objects.filter(is_active=True)
        created_count = 0

        for school in active_schools:
            # Check if report already exists for this week
            if not WeeklyReport.objects.filter(
                school=school,
                week_start_date=start_date,
                week_end_date=end_date
            ).exists():
                # Attempt to assign to the first available staff member
                from apps.accounts.models import StaffProfile
                assigned_staff = StaffProfile.objects.filter(school_account__school_profile__school=school).first()
                assigned_user = assigned_staff.user if assigned_staff else None

                report = WeeklyReport.objects.create(
                    school=school,
                    week_start_date=start_date,
                    week_end_date=end_date,
                    status=WeeklyReport.Status.DRAFT,
                    assigned_to=assigned_user
                )
                # Initialize sub-reports
                WeeklyPlumbingReport.objects.create(weekly_report=report)
                WeeklyElectricalReport.objects.create(weekly_report=report)
                WeeklyStructuralReport.objects.create(weekly_report=report)
                created_count += 1

        logger.info(f"Initialized {created_count} weekly reports for cycle {start_date} to {end_date}")
        return created_count

    @staticmethod
    @transaction.atomic
    def submit_report(report_id: int, user) -> WeeklyReport:
        """
        Finalizes and locks a weekly report.
        """
        try:
            report = WeeklyReport.objects.get(id=report_id)
        except WeeklyReport.DoesNotExist:
            raise ValidationError("Report not found.")

        if report.status != WeeklyReport.Status.DRAFT:
            raise ValidationError(f"Cannot submit report in {report.status} status.")

        # In a real app, we'd validate that sub-reports are filled here
        
        report.status = WeeklyReport.Status.SUBMITTED
        report.submitted_by = user
        report.submitted_at = timezone.now()
        report.save()

        logger.info(f"Weekly report {report_id} submitted by {user.email}")
        
        # Trigger ML Prediction (Async)
        from apps.predictions.tasks import run_prediction_for_report
        run_prediction_for_report.delay(report.id)
        
        return report
