"""
feed.py — Seeder for notifications app.
"""

import random
from faker import Faker
from django.db import transaction
from apps.notifications.models import Notification
from apps.accounts.models import User

fake = Faker()

@transaction.atomic
def seed_notifications(count_per_user=10):
    """Seed notifications for every user."""
    users = User.objects.all()
    print(f"Feeding ~{users.count() * count_per_user} notifications...")
    
    types = ["CONTRACT", "SYSTEM", "REPORT", "ALERT"]
    
    for user in users:
        for _ in range(random.randint(2, count_per_user)):
            Notification.objects.create(
                user=user,
                title=f"New {random.choice(types).capitalize()} Notification",
                message=fake.sentence(),
                type=random.choice(types),
                is_read=random.choice([True, False, False])
            )

def seed_all():
    seed_notifications()
    print("Notifications seeding completed!")
