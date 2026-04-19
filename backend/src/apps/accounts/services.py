"""
Accounts app services — Refactored for New Onboarding Workflows.
"""

import logging
import random
import string
import pandas as pd
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError

from apps.accounts.models import (
    User, UserVerificationToken, 
    SchoolAccountProfile, DEOProfile, ContractorProfile, 
    AdminStaffProfile, StaffProfile
)
from apps.accounts.tasks import (
    send_verification_email_task,
    send_account_credentials_task
)

User = get_user_model()
logger = logging.getLogger(__name__)


class AuthService:
    """
    Handles authentication-related workflows: registration and verification.
    """

    @staticmethod
    @transaction.atomic
    def register_school(data: dict) -> User:
        """Self-registration for schools."""
        email = data.pop('email')
        password = data.pop('password')
        
        user = User.objects.create_user(
            email=email, password=password, role=User.Role.SCHOOL
        )
        
        # Create profile
        SchoolAccountProfile.objects.create(user=user, **data)
        
        # Fire off the internal workflow to create the unapproved School entity
        from apps.schools.services import SchoolWorkflowService
        school_data = {
            "udise_code": data.get("udise_code"),
            "name": data.get("school_name"),
            "district": data.get("district"),
            "address": data.get("address"),
            "school_type": data.get("school_type"),
        }
        SchoolWorkflowService.submit_registration(user, school_data)
        
        AuthService.trigger_verification_flow(user)
        logger.info(f"School account registered: {email}")
        return user

    @staticmethod
    @transaction.atomic
    def register_contractor(data: dict) -> User:
        """Self-registration for contractors."""
        email = data.pop('email')
        password = data.pop('password')
        
        user = User.objects.create_user(
            email=email, password=password, role=User.Role.CONTRACTOR
        )
        
        # Create profile
        ContractorProfile.objects.create(user=user, **data)
        
        AuthService.trigger_verification_flow(user)
        logger.info(f"Contractor account registered: {email}")
        return user

    @staticmethod
    def trigger_verification_flow(user: User):
        """Generates a token and sends the verification email."""
        expires_at = timezone.now() + timedelta(hours=24)
        token_obj = UserVerificationToken.objects.create(
            user=user,
            expires_at=expires_at
        )
        send_verification_email_task.delay(
            email=user.email,
            token=str(token_obj.token)
        )

    @staticmethod
    @transaction.atomic
    def verify_email(token_str: str) -> bool:
        try:
            token_obj = UserVerificationToken.objects.select_related('user').get(
                token=token_str, is_used=False
            )
            if token_obj.is_expired():
                return False
            
            user = token_obj.user
            user.is_verified = True
            user.save()
            
            token_obj.is_used = True
            token_obj.save()
            return True
        except UserVerificationToken.DoesNotExist:
            return False


class OnboardingService:
    """
    Handles bulk creation and parent-managed onboarding.
    """

    @staticmethod
    def generate_random_password(length=12):
        chars = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(random.choice(chars) for _ in range(length))

    @staticmethod
    @transaction.atomic
    def bulk_onboard_from_excel(file, role, creator_user=None):
        """
        Parses an Excel file and creates accounts with random passwords.
        """
        try:
            df = pd.read_excel(file)
        except Exception as e:
            raise ValidationError(f"Invalid Excel file: {e}")

        required_cols = ['email', 'full_name', 'phone_no']
        if role == User.Role.DEO:
            required_cols.append('district')
        elif role == User.Role.SCHOOL:
            required_cols.extend(['udise_code', 'school_name', 'district', 'address', 'school_type'])

        for col in required_cols:
            if col not in df.columns:
                raise ValidationError(f"Missing column in Excel: {col}")

        created_users = []
        for _, row in df.iterrows():
            email = str(row['email']).strip()
            password = OnboardingService.generate_random_password()
            
            if User.objects.filter(email=email).exists():
                logger.warning(f"User {email} already exists, skipping.")
                continue

            user = User.objects.create_user(
                email=email, password=password, role=role, is_verified=True # Bulk added are verified
            )
            
            # Create Role Profile
            if role == User.Role.DEO:
                DEOProfile.objects.create(
                    user=user, 
                    district=row['district'],
                    office_address=row.get('office_address', '')
                )
            elif role == User.Role.ADMIN_STAFF and creator_user:
                deo_profile = getattr(creator_user, 'deo_profile', None)
                if not deo_profile:
                    raise ValidationError("Creator must be a DEO to add Admin Staff.")
                AdminStaffProfile.objects.create(
                    user=user,
                    parent_deo=deo_profile,
                    full_name=row['full_name'],
                    phone_no=str(row['phone_no'])
                )
            elif role == User.Role.STAFF and creator_user:
                school_profile = getattr(creator_user, 'school_profile', None)
                if not school_profile:
                    raise ValidationError("Creator must be a School to add Staff.")
                StaffProfile.objects.create(
                    user=user,
                    parent_school=school_profile,
                    full_name=row['full_name'],
                    phone_no=str(row['phone_no'])
                )

            # Send Credentials Email
            send_account_credentials_task.delay(
                email=user.email,
                name=row.get('full_name', 'User'),
                password=password,
                role_display=user.get_role_display()
            )
            created_users.append(user)

        return len(created_users)
