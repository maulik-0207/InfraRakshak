"""
Celery tasks for the predictions app.
"""

from celery import shared_task
from .prediction_service import PredictionService


@shared_task(name="run_prediction_for_report")
def run_prediction_for_report(report_id: int):
    """
    Task triggered after a weekly report is submitted.
    Runs ML inference and saves results.
    """
    pred = PredictionService.run_inference(report_id)
    return pred.id if pred else None


@shared_task(name="run_weekly_prediction_batch")
def run_weekly_prediction_batch():
    """
    Weekly batch task to process all SUBMITTED reports for the current week.
    Also sends notification emails to DEOs.
    """
    from apps.reports.models import WeeklyReport
    from .models import PredictionReport
    from datetime import date
    
    today = date.today()
    reports = WeeklyReport.objects.filter(
        status=WeeklyReport.Status.SUBMITTED,
        week_start_date__lte=today,
        week_end_date__gte=today
    ).exclude(prediction_reports__isnull=False)

    count = 0
    for report in reports:
        PredictionService.run_inference(report.id)
        count += 1
    
    logger.info(f"Weekly prediction batch completed: {count} reports processed.")
    
    # Send Summary Emails to DEOs
    if count > 0:
        from apps.accounts.models import User, DEOProfile
        from common.services import EmailService
        
        # Identify districts that had new predictions
        districts = set(r.school.district for r in reports)
        
        for district in districts:
            # Aggregate stats for the email
            district_reports = PredictionReport.objects.filter(
                school__district=district,
                weekly_report__week_start_date__lte=today,
                weekly_report__week_end_date__gte=today
            )
            
            total = district_reports.count()
            high_risk = district_reports.filter(overall_risk_level='HIGH').count()
            avg_score = sum(r.overall_score for r in district_reports) / total if total > 0 else 0
            
            # Find DEOs for this district
            deos = User.objects.filter(role=User.Role.DEO, deo_profile__district=district)
            recipient_list = [deo.email for deo in deos if deo.email]
            
            if recipient_list:
                EmailService.send_templated_email(
                    subject=f"Action Required: Weekly Infrastructure Risk Alert - {district}",
                    template_name="emails/prediction_alert.html",
                    context={
                        "district": district,
                        "week_start": today - timedelta(days=today.weekday()),
                        "total_schools": total,
                        "high_risk_count": high_risk,
                        "avg_score": round(avg_score, 1),
                        "dashboard_url": "https://infrarakshak.gov.in/dashboard/deo" # Build dynamically in prod
                    },
                    recipient_list=recipient_list
                )

    return count
