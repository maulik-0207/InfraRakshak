"""
feed.py — Seed script for dumping dummy data into accounts.
"""

import random
from faker import Faker
from django.db import transaction
from apps.accounts.models import (
    User, SchoolAccountProfile, DEOProfile, ContractorProfile, 
    AdminStaffProfile, StaffProfile
)

fake = Faker()
COMMON_PASSWORD = "Password@123"

def clear_db():
    print("Clearing existing non-superuser account data...")
    User.objects.filter(is_superuser=False).delete()

@transaction.atomic
def seed_deos(count=10):
    print(f"Seeding {count} DEOs...")
    districts = ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Kutch", "Mehsana"]
    for i in range(count):
        email = f"deo_{i+1}@example.com"
        user, created = User.objects.get_or_create(
            email=email, 
            defaults={"role": User.Role.DEO, "is_verified": True}
        )
        if created:
            user.set_password(COMMON_PASSWORD)
            user.save()
            
        DEOProfile.objects.get_or_create(
            user=user,
            defaults={
                "district": districts[i % len(districts)],
                "office_address": fake.address()
            }
        )

@transaction.atomic
def seed_schools(count=50):
    print(f"Seeding {count} Schools...")
    school_types = ["Primary", "Secondary", "Higher Secondary"]
    districts = ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Mehsana", "Bhavnagar"]
    for i in range(count):
        email = f"school_{i+1}@example.com"
        user, created = User.objects.get_or_create(
            email=email, 
            defaults={"role": User.Role.SCHOOL, "is_verified": True}
        )
        if created:
            user.set_password(COMMON_PASSWORD)
            user.save()
            
        SchoolAccountProfile.objects.get_or_create(
            user=user,
            defaults={
                "school_id": f"SCH-{1000 + i}",
                "school_name": f"{fake.company()} School",
                "phone_no": fake.phone_number()[:15],
                "district": random.choice(districts),
                "address": fake.address(),
                "school_type": random.choice(school_types)
            }
        )

@transaction.atomic
def seed_contractors(count=30):
    print(f"Seeding {count} Contractors...")
    for i in range(count):
        email = f"contractor_{i+1}@example.com"
        user, created = User.objects.get_or_create(
            email=email, 
            defaults={"role": User.Role.CONTRACTOR, "is_verified": True}
        )
        if created:
            user.set_password(COMMON_PASSWORD)
            user.save()
            
        ContractorProfile.objects.get_or_create(
            user=user,
            defaults={
                "company_name": fake.company(),
                "license_number": f"LIC-{2024}-{100+i}",
                "phone_no": fake.phone_number()[:15]
            }
        )

@transaction.atomic
def seed_admin_staff(count=50):
    print(f"Seeding {count} Admin Staff...")
    deos = list(DEOProfile.objects.all())
    if not deos: return
    for i in range(count):
        email = f"admin_staff_{i+1}@example.com"
        user, created = User.objects.get_or_create(
            email=email, 
            defaults={"role": User.Role.ADMIN_STAFF, "is_verified": True}
        )
        if created:
            user.set_password(COMMON_PASSWORD)
            user.save()
            
        AdminStaffProfile.objects.get_or_create(
            user=user,
            defaults={
                "parent_deo": random.choice(deos),
                "full_name": fake.name(),
                "phone_no": fake.phone_number()[:15]
            }
        )

@transaction.atomic
def seed_school_staff(count=100):
    print(f"Seeding {count} School Staff...")
    schools = list(SchoolAccountProfile.objects.all())
    if not schools: return
    for i in range(count):
        email = f"staff_{i+1}@example.com"
        user, created = User.objects.get_or_create(
            email=email, 
            defaults={"role": User.Role.STAFF, "is_verified": True}
        )
        if created:
            user.set_password(COMMON_PASSWORD)
            user.save()
            
        StaffProfile.objects.get_or_create(
            user=user,
            defaults={
                "parent_school": random.choice(schools),
                "full_name": fake.name(),
                "phone_no": fake.phone_number()[:15]
            }
        )

def seed_all(counts=None):
    """Orchestrator for account seeding."""
    if counts is None:
        counts = {
            "deos": 10,
            "schools": 50,
            "contractors": 30,
            "admin_staff": 50,
            "school_staff": 100
        }
    
    seed_deos(counts.get("deos", 10))
    seed_schools(counts.get("schools", 50))
    seed_contractors(counts.get("contractors", 30))
    seed_admin_staff(counts.get("admin_staff", 50))
    seed_school_staff(counts.get("school_staff", 100))
    print("Accounts seeding completed!")
