"""
Celery tasks for the reports app.
"""

from celery import shared_task
from .services import ReportCycleService


@shared_task(name="initiate_weekly_report_cycle")
def initiate_weekly_report_cycle_task():
    """
    Scheduled task to identify all active schools and create their weekly draft reports.
    """
    return ReportCycleService.init_weekly_cycle()


@shared_task(name="send_report_reminders")
def send_report_reminders_task():
    """
    Iterates through all DRAFT reports for the current week and sends reminders.
    """
    from .models import WeeklyReport
    from common.services import EmailService
    from datetime import date
    
    today = date.today()
    pending_reports = WeeklyReport.objects.filter(
        status=WeeklyReport.Status.DRAFT,
        week_start_date__lte=today,
        week_end_date__gte=today
    ).select_related('school', 'school__principal')

    for report in pending_reports:
        # We assume the principal or designated staff needs the reminder
        user = report.school.principal if hasattr(report.school, 'principal') else None
        if user and user.email:
            EmailService.send_templated_email(
                subject=f"Reminder: Weekly Infrastructure Report for {report.school.name}",
                template_name="emails/report_reminder.html",
                context={
                    "username": user.username,
                    "school_name": report.school.name,
                    "deadline": report.week_end_date
                },
                recipient_list=[user.email]
            )
