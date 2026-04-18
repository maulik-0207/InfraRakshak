"""
Shared constants for the InfraRakshak project.

Keep all magic numbers and reusable literals here to avoid duplication.
"""

# ---------------------------------------------------------------------------
# File upload settings
# ---------------------------------------------------------------------------

MAX_FILE_SIZE_MB: int = 10

ALLOWED_FILE_EXTENSIONS: list[str] = [
    # Images
    "jpg", "jpeg", "png", "gif", "webp",
    # Videos
    "mp4", "avi", "mov", "mkv",
    # Documents
    "pdf", "doc", "docx",
]

# ---------------------------------------------------------------------------
# Default seed roles (used in data migrations)
# ---------------------------------------------------------------------------

DEFAULT_ROLES: list[dict[str, str]] = [
    {"name": "DEO", "description": "District Education Officer"},
    {"name": "ADMIN_STAFF", "description": "Administrative Staff"},
    {"name": "PRINCIPAL", "description": "School Principal"},
    {"name": "SCHOOL_STAFF", "description": "School Staff Member"},
    {"name": "CONTRACTOR", "description": "Infrastructure Contractor"},
]
