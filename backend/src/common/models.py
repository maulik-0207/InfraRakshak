"""
Common abstract base models for the InfraRakshak project.

All app models should inherit from TimeStampedModel to get
consistent id, timestamps, and soft-delete behavior.
"""

from django.db import models


class SoftDeleteManager(models.Manager):
    """
    Default manager that filters out soft-deleted records.

    Usage:
        Model.objects.all()          → excludes is_deleted=True
        Model.all_objects.all()      → includes everything
    """

    def get_queryset(self) -> models.QuerySet:
        return super().get_queryset().filter(is_deleted=False)


class TimeStampedModel(models.Model):
    """
    Abstract base model providing:
    - id: BigAutoField primary key
    - created_at / updated_at: automatic timestamps
    - is_deleted: soft-delete flag

    All project models MUST inherit from this.
    """

    id = models.BigAutoField(primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False, db_index=True)

    # Default manager excludes soft-deleted rows
    objects = SoftDeleteManager()
    # Escape-hatch manager for admin / auditing
    all_objects = models.Manager()

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def soft_delete(self) -> None:
        """Mark the record as deleted without removing it from the database."""
        self.is_deleted = True
        self.save(update_fields=["is_deleted", "updated_at"])

    def restore(self) -> None:
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.save(update_fields=["is_deleted", "updated_at"])
