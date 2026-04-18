"""
Notifications app admin configuration.
"""

from django.contrib import admin

from apps.notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "type", "is_read", "created_at")
    search_fields = ("title", "message", "user__username", "user__email")
    list_filter = ("type", "is_read", "created_at")
    raw_id_fields = ("user",)
    date_hierarchy = "created_at"
    ordering = ("-created_at",)

    actions = ["mark_as_read", "mark_as_unread"]

    @admin.action(description="Mark selected notifications as read")
    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)

    @admin.action(description="Mark selected notifications as unread")
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False)
