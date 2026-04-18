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
    return PredictionService.run_inference(report_id)


@shared_task(name="run_district_prediction_batch")
def run_district_prediction_batch_task(district: str):
    """
    Batch task to process all pending reports for a district.
    Could be used for manual re-processing.
    """
    from apps.reports.models import WeeklyReport
    from .models import PredictionReport
    
    # Find reports without predictions
    reports = WeeklyReport.objects.filter(
        school__district=district,
        status=WeeklyReport.Status.SUBMITTED
    ).exclude(
        prediction_reports__isnull=False
    )
    
    count = 0
    for report in reports:
        PredictionService.run_inference(report.id)
        count += 1
        
    return count
