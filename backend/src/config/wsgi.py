"""
WSGI config for InfraRakshak project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0.4/howto/deployment/wsgi/
"""

import os
from pathlib import Path
import environ

BASE_DIR = Path(__file__).resolve().parent

env = environ.Env()
environ.Env.read_env(env_file=BASE_DIR / '.env')


from django.core.wsgi import get_wsgi_application

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    os.getenv("DJANGO_SETTINGS_MODULE", "config.settings.development")
)
application = get_wsgi_application()