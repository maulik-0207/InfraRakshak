"""
feed.py — Centralized management command to seed logical data across all apps.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

# Import seeders from all apps
from apps.accounts.utils.feed import seed_all as seed_accounts, clear_db as clear_accounts
from apps.schools.utils.feed import seed_all as seed_schools
from apps.reports.utils.feed import seed_all as seed_reports
from apps.predictions.utils.feed import seed_all as seed_predictions
from apps.contracts.utils.feed import seed_all as seed_contracts
from apps.notifications.utils.feed import seed_all as seed_notifications

class Command(BaseCommand):
    help = "Seeds the database with logical, large-scale dummy data for all apps."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing non-superuser data before seeding.",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("--- InfraRakshak Database Seeder ---"))
        
        if options["clear"]:
            self.stdout.write(self.style.WARNING("Clearing existing data..."))
            # We clear accounts first; cascades will handle most others, 
            # but we explicitly clear accounts to be safe.
            clear_accounts()
            self.stdout.write(self.style.SUCCESS("Database cleared successfully."))

        try:
            with transaction.atomic():
                self.stdout.write(self.style.MIGRATE_LABEL("Step 1: Seeding Accounts..."))
                seed_accounts()
                
                self.stdout.write(self.style.MIGRATE_LABEL("Step 2: Seeding Schools..."))
                seed_schools()
                
                self.stdout.write(self.style.MIGRATE_LABEL("Step 3: Seeding Reports..."))
                seed_reports()
                
                self.stdout.write(self.style.MIGRATE_LABEL("Step 4: Seeding Predictions..."))
                seed_predictions()
                
                self.stdout.write(self.style.MIGRATE_LABEL("Step 5: Seeding Contracts..."))
                seed_contracts()
                
                self.stdout.write(self.style.MIGRATE_LABEL("Step 6: Seeding Notifications..."))
                seed_notifications()

            self.stdout.write(self.style.SUCCESS("\n" + "="*40))
            self.stdout.write(self.style.SUCCESS(" DATABASE SEEDING COMPLETED SUCCESSFULLY! "))
            self.stdout.write(self.style.SUCCESS(" Dashboard is now populated with logical data. "))
            self.stdout.write(self.style.SUCCESS("="*40))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\nSeeding failed: {str(e)}"))
            raise e
