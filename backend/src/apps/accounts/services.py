"""
Accounts app services for business logic.
"""

import logging
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from django.db.models import QuerySet
from rest_framework.exceptions import ValidationError

from .models import User, UserVerificationToken
from .tasks import send_verification_email_task

logger = logging.getLogger(__name__)


class AuthService:
    """
    Handles authentication-related workflows: registration, verification, and login logic.
    """

    @staticmethod
    @transaction.atomic
    def register_user(validated_data: dict) -> User:
        """
        Creates a new user and triggers the verification process.
        """
        # Remove profile data if present to handle separately in view/serializer
        profile_data = validated_data.pop('profile_data', {})
        
        user = User.objects.create_user(**validated_data)
        user.is_active = True  # User can log in but is_verified stays False
        user.is_verified = False
        user.save()
        
        # Track registration
        logger.info(f"New user registered: {user.username} ({user.email})")
        
        # Trigger verification
        AuthService.trigger_verification_flow(user)
        
        return user

    @staticmethod
    def trigger_verification_flow(user: User):
        """
        Generates a token and sends the verification email.
        """
        # Expire old tokens
        user.verification_tokens.filter(is_used=False).update(is_used=True)
        
        # Create new token (expires in 24 hours)
        expires_at = timezone.now() + timedelta(hours=24)
        token_obj = UserVerificationToken.objects.create(
            user=user,
            expires_at=expires_at
        )
        
        # Send async email
        send_verification_email_task.delay(
            email=user.email,
            username=user.username,
            token=str(token_obj.token)
        )
        
        logger.info(f"Verification flow triggered for {user.email}")

    @staticmethod
    @transaction.atomic
    def verify_email(token_str: str) -> bool:
        """
        Validates token and marks user as verified.
        """
        try:
            token_obj = UserVerificationToken.objects.select_related('user').get(
                token=token_str,
                is_used=False
            )
            
            if token_obj.is_expired():
                logger.warning(f"Expired token attempt for {token_obj.user.email}")
                token_obj.is_used = True
                token_obj.save()
                return False
            
            # Success
            user = token_obj.user
            user.is_verified = True
            user.save()
            
            token_obj.is_used = True
            token_obj.save()
            
            logger.info(f"Email verified successfully for {user.email}")
            return True
            
        except UserVerificationToken.DoesNotExist:
            logger.error(f"Invalid verification token: {token_str}")
            return False
