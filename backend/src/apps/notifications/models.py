"""
Notifications app models.

Contains the Notification model for in-app user notifications.
"""

from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class Notification(TimeStampedModel):
    """
    In-app notification sent to a user.

    Types cover Report, Contract, and Alert categories.
    """

    class NotificationType(models.TextChoices):
        REPORT = "REPORT", "Report"
        CONTRACT = "CONTRACT", "Contract"
        ALERT = "ALERT", "Alert"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    title = models.CharField(max_length=255)
    message = models.TextField()

    type = models.CharField(
        max_length=10,
        choices=NotificationType.choices,
        db_index=True,
    )

    is_read = models.BooleanField(default=False, db_index=True)

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["user", "is_read"],
                name="idx_notification_user_read",
            ),
        ]

    def __str__(self) -> str:
        status = "Read" if self.is_read else "Unread"
        return f"[{status}] {self.title} → {self.user.username}"
