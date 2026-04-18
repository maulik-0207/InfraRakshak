"""
Celery tasks for the notifications app.
"""

from celery import shared_task
from common.services import EmailService


@shared_task(name="send_school_status_email")
def send_school_status_email_task(email: str, username: str, school_name: str, status: str, reason: str = ""):
    """
    Sends an email notification when a school registration is approved or rejected.
    """
    subject = f"InfraRakshak - School Registration {status.capitalize()}"
    template = "emails/school_status.html"
    
    context = {
        "username": username,
        "school_name": school_name,
        "status": status,
        "reason": reason,
    }
    
    EmailService.send_templated_email(
        subject=subject,
        template_name=template,
        context=context,
        recipient_list=[email],
    )
