"""
feed.py — Seeder for schools app.
"""

import random
from faker import Faker
from django.db import transaction
from apps.schools.models import School, SchoolProfile, SchoolInfrastructure, SchoolRegistrationRequest
from apps.accounts.models import SchoolAccountProfile, User

fake = Faker()

@transaction.atomic
def seed_schools_from_profiles():
    """Create School models from existing SchoolAccountProfiles."""
    profiles = SchoolAccountProfile.objects.all()
    print(f"Feeding {profiles.count()} schools based on account profiles...")
    
    for profile in profiles:
        school, created = School.objects.get_or_create(
            udise_code=profile.school_id, 
            defaults={
                "name": profile.school_name,
                "address": profile.address,
                "district": profile.district,
                "pincode": f"{random.randint(380000, 399999)}",
                "school_type": random.choice(["PRIMARY", "SECONDARY", "HIGHER_SECONDARY"]),
                "weather_zone": random.choice(["Coastal", "Dry", "Heavy Rain", "Tribal"]),
                "material_type": random.choice(["Brick", "Mixed", "RCC"]),
                "building_age": random.randint(5, 40)
            }
        )
        
        # Create Profile
        SchoolProfile.objects.get_or_create(
            school=school,
            defaults={
                "total_students": 500,
                "total_boys": 250,
                "total_girls": 250,
                "teachers_count": random.randint(10, 30),
                "non_teaching_staff_count": random.randint(2, 10),
                "classrooms_count": 20,
                "functional_classrooms": 18,
                "academic_year": "2024-25",
                "area_type": random.choice(["RURAL", "URBAN", "SEMI_URBAN"]),
                "electricity_available": True,
                "internet_available": random.choice([True, False]),
                "drinking_water_available": True
            }
        )
        
        # Create 1-2 Infrastructure surveys if none exist
        if not SchoolInfrastructure.objects.filter(school=school).exists():
            for _ in range(random.randint(1, 2)):
                SchoolInfrastructure.objects.create(
                    school=school,
                    survey_date=fake.date_this_year(),
                    submitted_by=profile.user,
                    boys_toilets_total=10,
                    boys_toilets_functional=8,
                    girls_toilets_total=10,
                    girls_toilets_functional=9,
                    water_source_available=True,
                    water_quality_ok=True,
                    electricity_connection=True,
                    power_backup=random.choice([True, False]),
                    leakage_present=random.choice([True, False, False]),
                    drainage_issue=random.choice([True, False, False]),
                    wiring_condition=random.choice(["GOOD", "AVERAGE", "POOR"]),
                    fan_condition=random.choice(["GOOD", "AVERAGE", "POOR"]),
                    lighting_condition=random.choice(["GOOD", "AVERAGE", "POOR"]),
                    building_condition=random.choice(["GOOD", "MINOR_DAMAGE", "MAJOR_DAMAGE"]),
                    toilet_cleanliness=random.randint(1, 5),
                    campus_cleanliness=random.randint(1, 5),
                    inspection_score=random.randint(40, 95)
                )

@transaction.atomic
def seed_registration_requests(count=20):
    """Seed registration requests for existing schools."""
    print(f"Seeding {count} registration requests...")
    schools = list(School.objects.all())
    staff_users = list(User.objects.filter(role=User.Role.STAFF))
    
    if not schools or not staff_users: return
    
    # Pick schools that don't have a request yet
    random.shuffle(schools)
    created_count = 0
    for school in schools:
        if created_count >= count: break
        if not hasattr(school, 'registration_request'):
            SchoolRegistrationRequest.objects.create(
                school=school,
                submitted_by=random.choice(staff_users),
                status=random.choice(["PENDING", "APPROVED", "REJECTED"])
            )
            created_count += 1

def seed_all():
    seed_schools_from_profiles()
    seed_registration_requests()
    print("Schools seeding completed!")
