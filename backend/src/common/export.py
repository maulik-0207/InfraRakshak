"""
Utility functions for exporting data to CSV.
Uses Python's built-in csv module — no third-party dependencies required.
"""

import csv
import io

from django.http import HttpResponse
from django.utils import timezone


def export_queryset_to_csv(queryset, fields, filename_prefix="export"):
    """
    Exports a Django QuerySet to a CSV HttpResponse.

    Args:
        queryset: The QuerySet to export.
        fields: List of field names (supports double-underscore traversal, e.g. 'school__name').
        filename_prefix: Prefix for the downloaded file name.
    """
    timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{filename_prefix}_{timestamp}.csv"

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    # Build human-readable header row
    headers = [field.split("__")[-1].replace("_", " ").title() for field in fields]

    writer = csv.writer(response)
    writer.writerow(headers)

    for row in queryset.values(*fields):
        writer.writerow([row[field] for field in fields])

    return response


# ---------------------------------------------------------------------------
# Backward-compatibility alias so existing imports keep working without change.
# All callers that used export_queryset_to_excel will now get CSV output.
# ---------------------------------------------------------------------------
export_queryset_to_excel = export_queryset_to_csv
