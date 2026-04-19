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
    Runs ML inference and saves results.
    """
    pred = PredictionService.run_inference(report_id)
    if pred:
        logger.info(f"[CELERY] Prediction {pred.id} generated for report {report_id}")
    return pred.id if pred else None
