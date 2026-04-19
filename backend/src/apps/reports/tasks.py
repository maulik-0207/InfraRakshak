"""
Celery tasks for the reports app.

Two scheduled Monday tasks:
1. 6:00 AM  – initiate_weekly_report_cycle_task
2. 6:30 PM  – auto_close_and_predict_task
"""

import logging
from celery import shared_task
from .services import ReportCycleService

logger = logging.getLogger(__name__)


@shared_task(name="initiate_weekly_report_cycle")
def initiate_weekly_report_cycle_task():
    """
    Monday 6:00 AM IST — Create DRAFT reports for all verified schools.
    Sends email + in-app notifications to principal and staff.
    """
    count = ReportCycleService.init_weekly_cycle()
    logger.info(f"[CELERY] Weekly report cycle initiated: {count} reports created.")
    return {"reports_created": count}


@shared_task(name="auto_close_and_predict_weekly")
def auto_close_and_predict_task():
    """
    Monday 6:30 PM IST — The complete evening pipeline:
    
    Step 1: Auto-submit all remaining DRAFT reports
    Step 2: Run ML predictions for all SUBMITTED reports this week
    Step 3: Generate district-level aggregate reports
    Step 4: Send DEO district emails + Principal results emails
    """
    from datetime import date, timedelta
    from apps.predictions.prediction_service import PredictionService
    from apps.predictions.models import PredictionReport, DistrictReport
    from apps.reports.models import WeeklyReport
    from apps.accounts.models import User
    from common.services import EmailService
    from apps.notifications.models import Notification

    # ── Step 1: Auto-close remaining DRAFTs ──
    auto_submitted_ids = ReportCycleService.auto_close_drafts()
    logger.info(f"[CELERY] Auto-submitted {len(auto_submitted_ids)} DRAFT reports.")

    # ── Step 2: Run predictions for all submitted reports this week ──
    today = date.today()
    start_date = today - timedelta(days=today.weekday())
    end_date = start_date + timedelta(days=6)

    submitted_reports = WeeklyReport.objects.filter(
        status=WeeklyReport.Status.SUBMITTED,
        week_start_date=start_date,
        week_end_date=end_date,
    ).select_related('school')

    # Only process reports that don't already have predictions
    prediction_count = 0
    processed_predictions = []

    for report in submitted_reports:
        if PredictionReport.objects.filter(weekly_report=report).exists():
            # Already predicted (e.g., manually submitted earlier)
            existing = PredictionReport.objects.filter(weekly_report=report).first()
            processed_predictions.append(existing)
            continue

        pred = PredictionService.run_inference(report.id)
        if pred:
            processed_predictions.append(pred)
            prediction_count += 1

    logger.info(f"[CELERY] Generated {prediction_count} new predictions.")

    # ── Step 3: Generate district reports ──
    districts_processed = set()
    for report in submitted_reports:
        district = report.school.district
        if district in districts_processed:
            continue
        districts_processed.add(district)

        # Aggregate all predictions in this district for this week
        district_predictions = PredictionReport.objects.filter(
            school__district=district,
            weekly_report__week_start_date=start_date,
            weekly_report__week_end_date=end_date,
        )

        total = district_predictions.count()
        if total == 0:
            continue

        high_risk = district_predictions.filter(overall_risk_level='HIGH').count()
        medium_risk = district_predictions.filter(overall_risk_level='MEDIUM').count()
        low_risk = district_predictions.filter(overall_risk_level='LOW').count()
        avg_score = sum(p.overall_score for p in district_predictions) / total

        # Create or update DistrictReport
        DistrictReport.objects.update_or_create(
            district=district,
            week_start_date=start_date,
            week_end_date=end_date,
            defaults={
                "total_schools": total,
                "high_risk_schools": high_risk,
                "medium_risk_schools": medium_risk,
                "low_risk_schools": low_risk,
                "avg_score": round(avg_score, 2),
            }
        )

    logger.info(f"[CELERY] Generated district reports for {len(districts_processed)} districts.")

    # ── Step 4: Send DEO district summary emails ──
    for district in districts_processed:
        district_report = DistrictReport.objects.filter(
            district=district,
            week_start_date=start_date,
            week_end_date=end_date,
        ).first()

        if not district_report:
            continue

        # Find DEOs for this district
        deos = User.objects.filter(
            role=User.Role.DEO,
            deo_profile__district=district
        )
        recipient_list = [deo.email for deo in deos if deo.email]

        if recipient_list:
            try:
                EmailService.send_templated_email(
                    subject=f"InfraRakshak – Weekly Infrastructure Risk Alert: {district}",
                    template_name="emails/prediction_alert.html",
                    context={
                        "district": district,
                        "week_start": start_date.strftime("%d %b %Y"),
                        "total_schools": district_report.total_schools,
                        "high_risk_count": district_report.high_risk_schools,
                        "avg_score": round(district_report.avg_score, 1),
                        "dashboard_url": "http://localhost:3000/deo/dashboard",
                    },
                    recipient_list=recipient_list,
                )
            except Exception as e:
                logger.error(f"Failed to send DEO email for {district}: {e}")

            # In-app notifications for DEOs
            for deo in deos:
                Notification.objects.create(
                    user=deo,
                    title=f"District Report Ready: {district}",
                    message=(
                        f"Weekly analysis for {district} is complete. "
                        f"{district_report.high_risk_schools} high-risk schools identified. "
                        f"Average score: {round(district_report.avg_score, 1)}%."
                    ),
                    type=Notification.NotificationType.REPORT,
                )

    # ── Step 5: Send school-specific results emails to principals ──
    for pred in processed_predictions:
        try:
            ReportCycleService.send_school_results_email(pred.school, pred)
        except Exception as e:
            logger.error(f"Failed to send school results for {pred.school.name}: {e}")

    logger.info("[CELERY] auto_close_and_predict_task completed successfully.")
    return {
        "auto_submitted": len(auto_submitted_ids),
        "predictions_generated": prediction_count,
        "districts_processed": len(districts_processed),
    }
