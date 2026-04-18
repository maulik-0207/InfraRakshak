"""
Common services for cross-app functionality.
"""

import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


class EmailService:
    """
    Central service for sending templated HTML emails.
    Integrated with Celery for async execution.
    """

    @staticmethod
    def send_templated_email(
        subject: str,
        template_name: str,
        context: dict,
        recipient_list: list[str],
        from_email: str = None,
    ) -> bool:
        """
        Synthesizes and sends an HTML email from a template.
        """
        if not from_email:
            from_email = settings.EMAIL_HOST_USER

        try:
            html_content = render_to_string(template_name, context)
            text_content = strip_tags(html_content)

            msg = EmailMultiAlternatives(
                subject, text_content, from_email, recipient_list
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            
            logger.info(f"Email '{subject}' sent successfully to {recipient_list}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email '{subject}' to {recipient_list}: {e}")
            return False
