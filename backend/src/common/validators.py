"""
Reusable field-level validators for the InfraRakshak project.

Import and attach these to model fields or use them in clean() methods.
"""

import os

from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible

from common.constants import ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE_MB


# ---------------------------------------------------------------------------
# Numeric validators
# ---------------------------------------------------------------------------

def validate_percentage(value: int | float) -> None:
    """Ensure value is between 0 and 100 (inclusive)."""
    if not (0 <= value <= 100):
        raise ValidationError(
            "%(value)s is not a valid percentage. Must be between 0 and 100.",
            params={"value": value},
        )


def validate_rating(value: int) -> None:
    """Ensure value is between 1 and 5 (inclusive)."""
    if not (1 <= value <= 5):
        raise ValidationError(
            "%(value)s is not a valid rating. Must be between 1 and 5.",
            params={"value": value},
        )


def validate_positive(value: int | float) -> None:
    """Ensure value is strictly positive (> 0)."""
    if value <= 0:
        raise ValidationError(
            "%(value)s must be a positive number.",
            params={"value": value},
        )


def validate_non_negative(value: int | float) -> None:
    """Ensure value is non-negative (>= 0)."""
    if value < 0:
        raise ValidationError(
            "%(value)s must be zero or a positive number.",
            params={"value": value},
        )


# ---------------------------------------------------------------------------
# File validators
# ---------------------------------------------------------------------------

@deconstructible
class FileSizeValidator:
    """
    Validates that a file does not exceed a given size in megabytes.

    Usage:
        file = models.FileField(validators=[FileSizeValidator(max_mb=10)])
    """

    def __init__(self, max_mb: int = MAX_FILE_SIZE_MB) -> None:
        self.max_mb = max_mb

    def __call__(self, file) -> None:
        max_bytes = self.max_mb * 1024 * 1024
        if file.size > max_bytes:
            raise ValidationError(
                f"File size exceeds the maximum allowed size of {self.max_mb} MB. "
                f"Current size: {file.size / (1024 * 1024):.2f} MB."
            )

    def __eq__(self, other) -> bool:
        return isinstance(other, FileSizeValidator) and self.max_mb == other.max_mb


@deconstructible
class FileExtensionValidator:
    """
    Validates that a file has an allowed extension.

    Usage:
        file = models.FileField(validators=[FileExtensionValidator()])
    """

    def __init__(self, allowed_extensions: list[str] | None = None) -> None:
        self.allowed_extensions = allowed_extensions or ALLOWED_FILE_EXTENSIONS

    def __call__(self, file) -> None:
        ext = os.path.splitext(file.name)[1].lower().lstrip(".")
        if ext not in self.allowed_extensions:
            raise ValidationError(
                f"File type '.{ext}' is not allowed. "
                f"Allowed types: {', '.join(self.allowed_extensions)}."
            )

    def __eq__(self, other) -> bool:
        return (
            isinstance(other, FileExtensionValidator)
            and self.allowed_extensions == other.allowed_extensions
        )
