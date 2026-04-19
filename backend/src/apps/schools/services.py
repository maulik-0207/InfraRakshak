"""
Schools app services for business logic.
"""

import logging
from django.utils import timezone
from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import School, SchoolRegistrationRequest
from apps.notifications.models import Notification

logger = logging.getLogger(__name__)


class SchoolWorkflowService:
    """
    Handles the school registration lifecycle: Submission -> Approval/Rejection.
    """

    @staticmethod
    @transaction.atomic
    def submit_registration(user, school_data: dict) -> SchoolRegistrationRequest:
        """
        Creates a school and a corresponding registration request.
        """
        # Ensure user doesn't already have a pending/approved request for same UDISE
        udise_code = school_data.get('udise_code')
        if School.objects.filter(udise_code=udise_code).exists():
            raise ValidationError({"udise_code": "A school with this UDISE code already exists."})

        # Create inactive school
        school = School.objects.create(**school_data, is_active=False)
        
        # Create request
        request = SchoolRegistrationRequest.objects.create(
            school=school,
            submitted_by=user,
            status=SchoolRegistrationRequest.RegistrationStatus.PENDING
        )
        
        # System Notification for admins/DEOs
        # In a real scenario, we'd find the relevant DEO for the district
        logger.info(f"School registration submitted for {school.name} by {user.email}")
        
        return request

    @staticmethod
    @transaction.atomic
    def process_request(request_id: int, processed_by, status: str, reason: str = "") -> SchoolRegistrationRequest:
        """
        Approves or Rejects a school registration request.
        """
        try:
            req = SchoolRegistrationRequest.objects.select_related('school', 'submitted_by').get(id=request_id)
        except SchoolRegistrationRequest.DoesNotExist:
            raise ValidationError("Registration request not found.")

        if req.status != SchoolRegistrationRequest.RegistrationStatus.PENDING:
            raise ValidationError(f"Request is already {req.status}.")

        req.status = status
        req.rejection_reason = reason if status == SchoolRegistrationRequest.RegistrationStatus.REJECTED else ""
        req.processed_by = processed_by
        req.processed_at = timezone.now()
        req.save()

        # Update school status
        school = req.school
        if status == SchoolRegistrationRequest.RegistrationStatus.APPROVED:
            school.is_active = True
            school.save()
            logger.info(f"School {school.name} APPROVED by {processed_by.email}")
        else:
            logger.info(f"School {school.name} REJECTED by {processed_by.email}. Reason: {reason}")

        # Send Notifications
        SchoolWorkflowService._notify_status_change(req)
        
        return req

    @staticmethod
    def _notify_status_change(request: SchoolRegistrationRequest):
        """
        Triggers system and email notifications for approval/rejection.
        """
        from apps.notifications.tasks import send_school_status_email_task
        
        user = request.submitted_by
        status = request.status
        school_name = request.school.name
        
        msg = f"Your registration request for {school_name} has been {status.lower()}."
        if status == SchoolRegistrationRequest.RegistrationStatus.REJECTED:
            msg += f" Reason: {request.rejection_reason}"
            
        # 1. System Notification
        Notification.objects.create(
            user=user,
            title=f"School Registration {status.capitalize()}",
            message=msg,
            type="ALERT"
        )
        
        # 2. Email Notification (Async)
        send_school_status_email_task.delay(
            email=user.email,
            username=user.email,
            school_name=school_name,
            status=status,
            reason=request.rejection_reason
        )
        
        logger.info(f"Notifications sent for school request {request.id}")
