"""
Reports app services for business logic.

Manages the full weekly report lifecycle:
1. Monday 6 AM  → init_weekly_cycle(): Create DRAFTs + notify school
2. Monday 6 PM  → Deadline for staff to fill reports
3. Monday 6:30 PM → auto_close_drafts(): Force-submit remaining DRAFTs
"""

import logging
from datetime import date, timedelta
from django.utils import timezone
from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import WeeklyReport, WeeklyPlumbingReport, WeeklyElectricalReport, WeeklyStructuralReport
from apps.schools.models import School
from apps.notifications.models import Notification

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
        Runs every Monday at 6:00 AM IST.

        For each verified (is_active=True) school:
        1. Creates a WeeklyReport in DRAFT status
        2. Initializes empty sub-reports (plumbing, electrical, structural)
        3. Sends email notification to principal + staff
        4. Creates in-app notifications
        """
        today = date.today()
        # Week range: Monday to Sunday
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)

        active_schools = School.objects.filter(is_active=True)
        created_count = 0

        for school in active_schools:
            # Check if report already exists for this week
            if WeeklyReport.objects.filter(
                school=school,
                week_start_date=start_date,
                week_end_date=end_date
            ).exists():
                continue

            # Find the principal (SCHOOL role user linked to this school) 
            from apps.accounts.models import User, StaffProfile
            principal_user = None
            try:
                from apps.accounts.models import SchoolAccountProfile
                school_profile = SchoolAccountProfile.objects.filter(
                    udise_code=school.udise_code
                ).first()
                if school_profile:
                    principal_user = school_profile.user
            except Exception:
                pass

            # Find assigned staff member
            assigned_staff = StaffProfile.objects.filter(
                parent_school__udise_code=school.udise_code
            ).first()
            assigned_user = assigned_staff.user if assigned_staff else principal_user

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

            # ── Collect all users to notify (principal + all staff) ──
            users_to_notify = []
            if principal_user:
                users_to_notify.append(principal_user)

            # All staff members of this school
            staff_profiles = StaffProfile.objects.filter(
                parent_school__udise_code=school.udise_code
            ).select_related('user')
            for sp in staff_profiles:
                if sp.user and sp.user not in users_to_notify:
                    users_to_notify.append(sp.user)

            # ── Send email notifications ──
            ReportCycleService._send_report_created_emails(
                school=school,
                users=users_to_notify,
                week_start=start_date,
                week_end=end_date,
            )

            # ── Create in-app notifications ──
            for user in users_to_notify:
                Notification.objects.create(
                    user=user,
                    title="Weekly Report Created",
                    message=(
                        f"A new weekly infrastructure report for {school.name} "
                        f"has been created for the week of {start_date.strftime('%d %b %Y')}. "
                        f"Please fill it before 6:00 PM today."
                    ),
                    type=Notification.NotificationType.REPORT,
                )

        logger.info(f"Initialized {created_count} weekly reports for cycle {start_date} to {end_date}")
        return created_count

    @staticmethod
    def _send_report_created_emails(school, users, week_start, week_end):
        """Send 'Report Created' emails to all relevant school users."""
        from common.services import EmailService

        for user in users:
            if not user.email:
                continue
            try:
                EmailService.send_templated_email(
                    subject=f"InfraRakshak – Weekly Report Created for {school.name}",
                    template_name="emails/report_created.html",
                    context={
                        "username": user.email,
                        "school_name": school.name,
                        "week_start": week_start.strftime("%d %b %Y"),
                        "week_end": week_end.strftime("%d %b %Y"),
                        "dashboard_url": "http://localhost:3000/staff/dashboard",
                    },
                    recipient_list=[user.email],
                )
            except Exception as e:
                logger.error(f"Failed to send report-created email to {user.email}: {e}")

    @staticmethod
    @transaction.atomic
    def auto_close_drafts():
        """
        Force-submit all DRAFT reports for the current week.
        Runs every Monday at 6:30 PM IST.

        Returns the list of auto-submitted report IDs.
        """
        today = date.today()
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)

        draft_reports = WeeklyReport.objects.filter(
            status=WeeklyReport.Status.DRAFT,
            week_start_date=start_date,
            week_end_date=end_date,
        )

        auto_submitted_ids = []
        now = timezone.now()

        for report in draft_reports:
            report.status = WeeklyReport.Status.SUBMITTED
            report.submitted_at = now
            report.submitted_by = None  # System auto-submit
            report.save(update_fields=["status", "submitted_at", "submitted_by", "updated_at"])
            auto_submitted_ids.append(report.id)

        logger.info(
            f"Auto-closed {len(auto_submitted_ids)} DRAFT reports for week {start_date} → {end_date}"
        )
        return auto_submitted_ids

    @staticmethod
    @transaction.atomic
    def submit_report(report_id: int, user) -> WeeklyReport:
        """
        Finalizes and locks a weekly report (manual submission by staff).
        """
        try:
            report = WeeklyReport.objects.get(id=report_id)
        except WeeklyReport.DoesNotExist:
            raise ValidationError("Report not found.")

        if report.status != WeeklyReport.Status.DRAFT:
            raise ValidationError(f"Cannot submit report in {report.status} status.")

        report.status = WeeklyReport.Status.SUBMITTED
        report.submitted_by = user
        report.submitted_at = timezone.now()
        report.save()

        logger.info(f"Weekly report {report_id} submitted by {user.email}")

        # Trigger ML Prediction (Async)
        from apps.predictions.tasks import run_prediction_for_report
        run_prediction_for_report.delay(report.id)

        return report

    @staticmethod
    def send_school_results_email(school, prediction_report):
        """
        Send prediction results email to the school's principal.
        """
        from common.services import EmailService
        from apps.accounts.models import SchoolAccountProfile

        # Find the principal
        try:
            school_profile = SchoolAccountProfile.objects.filter(
                udise_code=school.udise_code
            ).first()
            if not school_profile or not school_profile.user.email:
                return
        except Exception:
            return

        user = school_profile.user

        try:
            EmailService.send_templated_email(
                subject=f"InfraRakshak – Weekly Prediction Results for {school.name}",
                template_name="emails/school_results.html",
                context={
                    "username": user.email,
                    "school_name": school.name,
                    "overall_score": round(prediction_report.overall_score, 1),
                    "overall_risk": prediction_report.overall_risk_level,
                    "plumbing_score": round(prediction_report.plumbing_score, 1),
                    "plumbing_risk": prediction_report.plumbing_risk_level,
                    "electrical_score": round(prediction_report.electrical_score, 1),
                    "electrical_risk": prediction_report.electrical_risk_level,
                    "structural_score": round(prediction_report.structural_score, 1),
                    "structural_risk": prediction_report.structural_risk_level,
                    "dashboard_url": "http://localhost:3000/school/dashboard",
                },
                recipient_list=[user.email],
            )
        except Exception as e:
            logger.error(f"Failed to send results email to {user.email}: {e}")

        # In-app notification
        Notification.objects.create(
            user=user,
            title="Prediction Results Ready",
            message=(
                f"Your weekly infrastructure analysis for {school.name} is complete. "
                f"Overall Risk: {prediction_report.overall_risk_level} "
                f"(Score: {round(prediction_report.overall_score, 1)}%). "
                f"Log in to view detailed results."
            ),
            type=Notification.NotificationType.REPORT,
        )
