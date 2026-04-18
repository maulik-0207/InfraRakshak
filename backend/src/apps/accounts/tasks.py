"""
Celery tasks for the accounts app.
"""

from celery import shared_task
from django.conf import settings
from common.services import EmailService


@shared_task(name="send_verification_email")
def send_verification_email_task(email: str, username: str, token: str):
    """
    Sends a verification email with a secure link.
    """
    # In production, this would be a real URL pointing to the frontend or API
    verification_url = f"{settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else 'http://127.0.0.1:8000'}/api/v1/accounts/verify-email/?token={token}"
    
    context = {
        "username": username,
        "verification_url": verification_url,
    }
    
    EmailService.send_templated_email(
        subject="InfraRakshak - Verify Your Email",
        template_name="emails/verify_email.html",
        context=context,
        recipient_list=[email],
    )
