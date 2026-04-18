"""
feed.py — Seeder for reports app.
"""

import random
from datetime import timedelta
from django.utils import timezone
from faker import Faker
from django.db import transaction
from apps.reports.models import (
    WeeklyReport, WeeklyPlumbingReport, WeeklyElectricalReport, 
    WeeklyStructuralReport, WeeklyIssues
)
from apps.schools.models import School
from apps.accounts.models import User

fake = Faker()

@transaction.atomic
def seed_weekly_reports(count_per_school=5):
    """Seed weekly reports for every school."""
    schools = School.objects.all()
    print(f"Feeding ~{schools.count() * count_per_school} reports...")
    
    staff_users = list(User.objects.filter(role=User.Role.STAFF))
    admin_users = list(User.objects.filter(role__in=[User.Role.DEO, User.Role.ADMIN_STAFF]))
    
    if not staff_users: return
    
    start_date = timezone.now().date() - timedelta(weeks=count_per_school + 1)
    
    for school in schools:
        for i in range(count_per_school):
            week_start = start_date + timedelta(weeks=i)
            week_end = week_start + timedelta(days=6)
            
            # Use update_or_create to prevent IntegrityError
            status_dice = random.random()
            if status_dice < 0.2:
                status = "DRAFT"
            elif status_dice < 0.8:
                status = "SUBMITTED"
            else:
                status = "REVIEWED"
                
            report, created = WeeklyReport.objects.update_or_create(
                school=school,
                week_start_date=week_start,
                week_end_date=week_end,
                defaults={
                    "status": status,
                    "assigned_to": random.choice(staff_users),
                    "submitted_by": random.choice(staff_users) if status != "DRAFT" else None,
                    "submitted_at": timezone.now() if status != "DRAFT" else None,
                    "reviewed_by": random.choice(admin_users) if status == "REVIEWED" else None,
                    "reviewed_at": timezone.now() if status == "REVIEWED" else None,
                    "remarks": fake.sentence() if status == "REVIEWED" else ""
                }
            )
            
            # Plumbing
            WeeklyPlumbingReport.objects.update_or_create(
                weekly_report=report,
                defaults={
                    "total_taps": random.randint(10, 50),
                    "functional_taps": random.randint(5, 50),
                    "leakage_points_count": random.randint(0, 10),
                    "drainage_blockage": random.choice([True, False, False, False]),
                    "water_availability": random.choice([True, True, True, False])
                }
            )
            
            # Electrical
            WeeklyElectricalReport.objects.update_or_create(
                weekly_report=report,
                defaults={
                    "total_fans": random.randint(20, 100),
                    "functional_fans": random.randint(15, 100),
                    "total_lights": random.randint(20, 150),
                    "functional_lights": random.randint(15, 150),
                    "backup_available": random.choice([True, False]),
                    "wiring_issues": random.choice([True, False, False, False])
                }
            )
            
            # Structural
            WeeklyStructuralReport.objects.update_or_create(
                weekly_report=report,
                defaults={
                    "classrooms_total": random.randint(5, 20),
                    "classrooms_usable": random.randint(3, 20),
                    "building_safety": random.choice(["SAFE", "SAFE", "MINOR_RISK", "UNSAFE"]),
                    "repair_required": random.choice([True, False, False])
                }
            )
            
            # Random Issues (only if new)
            if created and random.random() < 0.6:
                for _ in range(random.randint(1, 3)):
                    WeeklyIssues.objects.create(
                        weekly_report=report,
                        issue_type=random.choice(["PLUMBING", "ELECTRICAL", "STRUCTURAL"]),
                        severity=random.choice(["LOW", "MEDIUM", "HIGH"]),
                        description=fake.text(max_nb_chars=200),
                        is_resolved=random.choice([True, False])
                    )

def seed_all():
    seed_weekly_reports()
    print("Reports seeding completed!")
