"""
feed.py — Seed script for dumping dummy data into accounts.
Usage: Run from src directory: python manage.py shell < apps/accounts/utils/feed.py
Or just copy-paste into shell.
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
    print("Clearing existing account data...")
    User.objects.filter(is_superuser=False).delete()

@transaction.atomic
def seed_deos(count=5):
    print(f"Seeding {count} DEOs...")
    districts = ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar"]
    for i in range(count):
        email = f"deo_{i+1}@example.com"
        user = User.objects.create_user(
            email=email, password=COMMON_PASSWORD, role=User.Role.DEO, is_verified=True
        )
        DEOProfile.objects.create(
            user=user,
            district=districts[i % len(districts)],
            office_address=fake.address()
        )

@transaction.atomic
def seed_schools(count=20):
    print(f"Seeding {count} Schools...")
    school_types = ["Primary", "Secondary", "Higher Secondary"]
    districts = ["Ahmedabad", "Surat", "Vadodara", "Rajkot"]
    for i in range(count):
        email = f"school_{i+1}@example.com"
        user = User.objects.create_user(
            email=email, password=COMMON_PASSWORD, role=User.Role.SCHOOL, is_verified=True
        )
        SchoolAccountProfile.objects.create(
            user=user,
            school_id=f"SCH-{1000 + i}",
            school_name=f"{fake.company()} School",
            phone_no=fake.phone_number()[:15],
            district=random.choice(districts),
            address=fake.address(),
            school_type=random.choice(school_types)
        )

@transaction.atomic
def seed_contractors(count=15):
    print(f"Seeding {count} Contractors...")
    for i in range(count):
        email = f"contractor_{i+1}@example.com"
        user = User.objects.create_user(
            email=email, password=COMMON_PASSWORD, role=User.Role.CONTRACTOR, is_verified=True
        )
        ContractorProfile.objects.create(
            user=user,
            company_name=fake.company(),
            license_number=f"LIC-{2024}-{100+i}",
            phone_no=fake.phone_number()[:15]
        )

@transaction.atomic
def seed_admin_staff(count=25):
    print(f"Seeding {count} Admin Staff...")
    deos = list(DEOProfile.objects.all())
    if not deos: return
    for i in range(count):
        email = f"admin_staff_{i+1}@example.com"
        user = User.objects.create_user(
            email=email, password=COMMON_PASSWORD, role=User.Role.ADMIN_STAFF, is_verified=True
        )
        AdminStaffProfile.objects.create(
            user=user,
            parent_deo=random.choice(deos),
            full_name=fake.name(),
            phone_no=fake.phone_number()[:15]
        )

@transaction.atomic
def seed_school_staff(count=50):
    print(f"Seeding {count} School Staff...")
    schools = list(SchoolAccountProfile.objects.all())
    if not schools: return
    for i in range(count):
        email = f"staff_{i+1}@example.com"
        user = User.objects.create_user(
            email=email, password=COMMON_PASSWORD, role=User.Role.STAFF, is_verified=True
        )
        StaffProfile.objects.create(
            user=user,
            parent_school=random.choice(schools),
            full_name=fake.name(),
            phone_no=fake.phone_number()[:15]
        )

def run():
    clear_db()
    seed_deos()
    seed_schools()
    seed_contractors()
    seed_admin_staff()
    seed_school_staff()
    print("\n" + "="*30)
    print("Database seeding completed!")
    print(f"Default login: Password@123")
    print("="*30)

if __name__ == "__main__":
    run()
