"""
Utility functions for exporting data to Excel.
Uses pandas and openpyxl.
"""

import pandas as pd
from django.http import HttpResponse
from django.utils import timezone


def export_queryset_to_excel(queryset, fields, filename_prefix="export"):
    """
    Exports a Django QuerySet to an Excel HttpResponse.
    
    Args:
        queryset: The QuerySet to export.
        fields: List of field names or display names to include.
        filename_prefix: Prefix for the downloaded file.
    """
    # Convert QuerySet to list of dicts
    # We can either use values() or manually extract to handle properties/methods
    data = list(queryset.values(*fields))
    
    df = pd.DataFrame(data)
    
    # Capitalize column names for better presentation
    df.columns = [col.replace('_', ' ').title() for col in df.columns]
    
    timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{filename_prefix}_{timestamp}.xlsx"
    
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    with pd.ExcelWriter(response, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Data')
        
    return response
