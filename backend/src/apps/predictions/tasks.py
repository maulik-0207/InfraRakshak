"""
Celery tasks for the predictions app.

Individual report predictions are triggered on-demand (after manual submission).
Batch processing is handled by the reports app's auto_close_and_predict_task.
"""

import logging
from celery import shared_task
from .prediction_service import PredictionService

logger = logging.getLogger(__name__)


@shared_task(name="run_prediction_for_report")
def run_prediction_for_report(report_id: int):
    """
    Task triggered after a weekly report is manually submitted by staff.
    Runs ML inference and saves results for current, 30-day, and 60-day projections.
    """
    pred_0 = PredictionService.run_inference(report_id, projection_days=0)
    PredictionService.run_inference(report_id, projection_days=30)
    PredictionService.run_inference(report_id, projection_days=60)
    
    if pred_0:
        logger.info(f"[CELERY] Projections generated for report {report_id}")
    return pred_0.id if pred_0 else None
