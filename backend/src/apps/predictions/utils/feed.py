"""
feed.py — Seeder for predictions app.
"""

import random
from datetime import timedelta
from django.utils import timezone
from faker import Faker
from django.db import transaction
from apps.predictions.models import PredictionReport, PredictionIssues, DistrictReport
from apps.reports.models import WeeklyReport

fake = Faker()

@transaction.atomic
def seed_prediction_reports():
    """Seed prediction reports for submitted/reviewed weekly reports."""
    reports = WeeklyReport.objects.filter(status__in=["SUBMITTED", "REVIEWED"])
    print(f"Feeding predictions for {reports.count()} reports...")
    
    for report in reports:
        overall_score = random.uniform(20.0, 95.0)
        risk_level = "LOW"
        if overall_score > 80: risk_level = "HIGH"
        elif overall_score > 60: risk_level = "HIGH"
        elif overall_score > 40: risk_level = "MEDIUM"
        
        prediction, created = PredictionReport.objects.update_or_create(
            school=report.school,
            weekly_report=report,
            defaults={
                "overall_score": overall_score,
                "overall_risk_level": risk_level,
                "plumbing_score": random.uniform(30, 90),
                "plumbing_risk_level": random.choice(["LOW", "MEDIUM", "HIGH"]),
                "electrical_score": random.uniform(30, 90),
                "electrical_risk_level": random.choice(["LOW", "MEDIUM", "HIGH"]),
                "structural_score": random.uniform(30, 90),
                "structural_risk_level": random.choice(["LOW", "MEDIUM", "HIGH"]),
                "priority_rank": random.randint(1, 100)
            }
        )
        
        # Seed issues if new
        if created:
            for category in ["PLUMBING", "ELECTRICAL", "STRUCTURAL"]:
                if random.random() < 0.7:
                    PredictionIssues.objects.create(
                        prediction_report=prediction,
                        category=category,
                        issue_name=f"Predicted {category} Failure",
                        severity=random.choice(["LOW", "MEDIUM", "HIGH"]),
                        score=random.uniform(40, 95),
                        recommended_action=f"Inspect and repair {category.lower()} systems immediately."
                    )

@transaction.atomic
def seed_district_reports():
    """Seed district reports for major regions."""
    districts = ["Ahmedabad", "Surat", "Vadodara", "Rajkot"]
    print(f"Feeding district reports for {len(districts)} regions...")
    
    today = timezone.now().date()
    for district in districts:
        for i in range(4): # Last 4 weeks
            week_start = today - timedelta(weeks=i+1)
            week_end = week_start + timedelta(days=6)
            DistrictReport.objects.update_or_create(
                district=district,
                week_start_date=week_start,
                week_end_date=week_end,
                defaults={
                    "total_schools": random.randint(50, 200),
                    "high_risk_schools": random.randint(5, 15),
                    "medium_risk_schools": random.randint(10, 20),
                    "low_risk_schools": random.randint(20, 50),
                    "avg_score": random.uniform(30, 70)
                }
            )

def seed_all():
    seed_prediction_reports()
    seed_district_reports()
    print("Predictions seeding completed!")
