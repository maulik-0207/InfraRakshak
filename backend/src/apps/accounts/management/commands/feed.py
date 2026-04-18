import importlib
from django.core.management.base import BaseCommand
from django.conf import settings

class Command(BaseCommand):
    help = "Discovers and runs feed.py scripts in all project apps to populate dummy data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--app", 
            type=str, 
            help="Specify a single app to feed (e.g. apps.accounts)"
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Attempt to clear existing data before seeding (if supported by feed script)"
        )

    def handle(self, *args, **options):
        apps_to_check = []
        
        if options["app"]:
            apps_to_check = [options["app"]]
        else:
            # Only check local project apps (starting with apps.)
            apps_to_check = [app for app in settings.INSTALLED_APPS if app.startswith("apps.")]

        self.stdout.write(self.style.MIGRATE_HEADING(f"Starting data feeding for {len(apps_to_check)} apps..."))

        success_count = 0
        for app_path in apps_to_check:
            module_path = f"{app_path}.utils.feed"
            try:
                feed_module = importlib.import_module(module_path)
                
                if hasattr(feed_module, "run"):
                    self.stdout.write(f"Feeding data from: {module_path}")
                    
                    # Run the feed logic
                    # If the feed script supports a 'run' that takes arguments, 
                    # we could pass options["clear"] here. 
                    # For now, we'll just call run() as most scripts handle their own clearing.
                    feed_module.run()
                    
                    self.stdout.write(self.style.SUCCESS(f"Successfully finished feeding {app_path}"))
                    success_count += 1
                else:
                    self.stdout.write(self.style.WARNING(f"Skipping {app_path}: No 'run()' function found in {module_path}"))
            
            except ImportError:
                # App doesn't have a feed.py, skip silently or with debug
                self.stdout.write(f"Skipping {app_path}: No feed utility found at {module_path}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error feeding {app_path}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS(f"\nFeed complete! Successfully ran {success_count} scripts."))
