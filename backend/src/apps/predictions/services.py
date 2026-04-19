"""
Predictions business-logic service layer.

Heavy logic (e.g., generating predictions, computing district aggregates)
should live here — NOT inside models or views.
"""

import logging
from datetime import date, timedelta
from typing import Any

from django.db import transaction

from .models import PredictionReport, DistrictReport

logger = logging.getLogger("django")


class PredictionAggregationService:
    """
    Handles district-level aggregation of prediction data.
    Used by the Monday 6:30 PM batch job.
    """

    @staticmethod
    @transaction.atomic
    def generate_district_report(district: str, week_start_date: date, week_end_date: date) -> dict[str, Any]:
        """
        Aggregate prediction data for a district over a given week.

        Steps:
            1. Query all PredictionReports for schools in the district.
            2. Compute counts by risk level.
            3. Create or update DistrictReport.

        Returns:
            dict with district_report_id and summary.
        """
        results = []
        for proj_days in [0, 30, 60]:
            district_predictions = PredictionReport.objects.filter(
                school__district=district,
                weekly_report__week_start_date=week_start_date,
                weekly_report__week_end_date=week_end_date,
                projection_days=proj_days,
            )

            total = district_predictions.count()
            if total == 0:
                logger.info(f"No projections ({proj_days}d) found for {district} ({week_start_date} – {week_end_date})")
                continue

            high_risk = district_predictions.filter(overall_risk_level='HIGH').count()
            medium_risk = district_predictions.filter(overall_risk_level='MEDIUM').count()
            low_risk = district_predictions.filter(overall_risk_level='LOW').count()
            avg_score = sum(p.overall_score for p in district_predictions) / total

            district_report, created = DistrictReport.objects.update_or_create(
                district=district,
                week_start_date=week_start_date,
                week_end_date=week_end_date,
                projection_days=proj_days,
                defaults={
                    "total_schools": total,
                    "high_risk_schools": high_risk,
                    "medium_risk_schools": medium_risk,
                    "low_risk_schools": low_risk,
                    "avg_score": round(avg_score, 2),
                }
            )

            action = "Created" if created else "Updated"
            logger.info(
                f"{action} DistrictReport {district_report.id} ({proj_days}d) for {district}: "
                f"{total} schools, {high_risk} high-risk, avg={round(avg_score, 1)}"
            )

            results.append({
                "district_report_id": district_report.id,
                "projection_days": proj_days,
                "total_schools": total,
                "high_risk": high_risk,
                "medium_risk": medium_risk,
                "low_risk": low_risk,
                "avg_score": round(avg_score, 2),
            })
            
        return results if results else {"status": "no_data"}
