"""
Notifications API v1 views.
"""

from drf_spectacular.utils import OpenApiExample, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.notifications.api.v1.serializers import NotificationSerializer
from apps.notifications.models import Notification


@extend_schema_view(
    list=extend_schema(
        summary="List notifications",
        description="Returns paginated notifications for the authenticated user. Filter by type or read status.",
        tags=["Notifications"],
        parameters=[
            OpenApiParameter("user", type=int, description="Filter by User ID"),
            OpenApiParameter("type", type=str, description="Filter by type (CONTRACT, SYSTEM, etc.)"),
            OpenApiParameter("is_read", type=bool, description="Filter by read status"),
        ]
    ),
    retrieve=extend_schema(summary="Get notification", tags=["Notifications"]),
    create=extend_schema(
        summary="Create notification",
        tags=["Notifications"],
        examples=[
            OpenApiExample(
                "Create Notification",
                value={
                    "user": 1,
                    "title": "New Contract Available",
                    "message": "A new plumbing contract has been posted for your district.",
                    "type": "CONTRACT",
                },
                request_only=True,
            ),
        ],
    ),
    update=extend_schema(summary="Update notification", tags=["Notifications"]),
    partial_update=extend_schema(summary="Partially update notification", tags=["Notifications"]),
    destroy=extend_schema(summary="Delete notification", tags=["Notifications"]),
)
class NotificationViewSet(viewsets.ModelViewSet):
    """
    CRUD for user notifications.

    Includes bulk actions to mark notifications as read.
    """

    queryset = Notification.objects.select_related("user").all()
    serializer_class = NotificationSerializer
    search_fields = ["title", "message"]
    filterset_fields = ["user", "type", "is_read"]
    ordering_fields = ["created_at", "is_read"]

    @extend_schema(
        summary="Mark all as read",
        description="Marks all unread notifications for the authenticated user as read.",
        tags=["Notifications"],
        request=None,
        responses={200: {"type": "object", "properties": {"marked": {"type": "integer"}}}},
    )
    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        """Mark all unread notifications for the current user as read."""
        count = Notification.objects.filter(
            user=request.user, is_read=False,
        ).update(is_read=True)
        return Response({"marked": count}, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Mark as read",
        description="Mark a single notification as read.",
        tags=["Notifications"],
        request=None,
        responses={200: NotificationSerializer},
    )
    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        """Mark a single notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read", "updated_at"])
        return Response(NotificationSerializer(notification).data)
