"""
Contracts app services for business logic.
Refactored to match production models: Contract, ContractBid, ContractAssignment, WorkProgress, WorkProof.
"""

import logging
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from rest_framework.exceptions import ValidationError

from .models import (
    Contract, ContractBid, ContractAssignment, 
    WorkProgress, WorkProof, PriorityLevel,
    WorkVerification
)
from apps.notifications.models import Notification
from apps.accounts.models import User

logger = logging.getLogger(__name__)


class ContractLifecycleService:
    """
    Manages the full contract lifecycle from creation to completion.
    """

    @staticmethod
    @transaction.atomic
    def create_contract_from_prediction(prediction_id: int, creator_user=None):
        """
        Triggered when a prediction identifies high/medium risk.
        Creates an OPEN contract for bidding.
        """
        from apps.predictions.models import PredictionReport
        try:
            pred = PredictionReport.objects.select_related('school').get(id=prediction_id)
        except PredictionReport.DoesNotExist:
            return None

        # Determine categories needing repair based on high scores
        categories = []
        if pred.plumbing_score >= 70: categories.append("PLUMBING")
        if pred.electrical_score >= 70: categories.append("ELECTRICAL")
        if pred.structural_score >= 70: categories.append("STRUCTURAL")

        if not categories:
            return None

        created_contracts = []
        for cat in categories:
            # Check if an open contract for same school/category already exists
            if not Contract.objects.filter(
                school=pred.school,
                category=cat,
                status__in=[Contract.Status.OPEN, Contract.Status.IN_BIDDING, Contract.Status.AWARDED]
            ).exists():
                # Use pred.school_account.user if creator_user is None as a fallback
                # but better to have an Admin/System user.
                effective_creator = creator_user
                if not effective_creator:
                    from apps.accounts.models import User
                    effective_creator = User.objects.filter(is_superuser=True).first()

                if not effective_creator:
                    logger.error("Cannot create contract: No superuser found for assignment.")
                    return None

                contract = Contract.objects.create(
                    school=pred.school,
                    prediction_report=pred,
                    title=f"Repair: {cat} Issues at {pred.school.name}",
                    category=cat,
                    estimated_cost=50000.0,
                    priority_level=pred.overall_risk_level if pred.overall_risk_level in PriorityLevel.values else PriorityLevel.MEDIUM,
                    status=Contract.Status.OPEN,
                    created_by=effective_creator
                )
                created_contracts.append(contract)
                logger.info(f"Auto-created contract {contract.id} for {pred.school.name} ({cat})")
        
        return created_contracts

    @staticmethod
    @transaction.atomic
    def submit_bid(user, contract_id: int, quote: float, estimated_days: int) -> ContractBid:
        """
        Allows a contractor to submit a bid for an OPEN contract.
        """
        if not hasattr(user, 'contractor_profile'):
            raise ValidationError("Only users with a contractor profile can submit bids.")

        try:
            contract = Contract.objects.get(id=contract_id)
        except Contract.DoesNotExist:
            raise ValidationError("Contract not found.")

        if contract.status not in [Contract.Status.OPEN, Contract.Status.IN_BIDDING]:
            raise ValidationError("Bidding is closed for this contract.")

        # Update status to IN_BIDDING if first bid
        if contract.status == Contract.Status.OPEN:
            contract.status = Contract.Status.IN_BIDDING
            contract.save()

        bid, created = ContractBid.objects.update_or_create(
            contract=contract,
            contractor=user.contractor_profile,
            defaults={
                "bid_amount": quote,
                "estimated_days": estimated_days,
                "status": ContractBid.BidStatus.PENDING
            }
        )
        
        logger.info(f"Bid by {user.email} for Contract {contract_id}")
        return bid

    @staticmethod
    @transaction.atomic
    def award_contract(bid_id: int, awarded_by) -> Contract:
        """
        DEO/Admin awards the contract to a specific bid.
        """
        try:
            bid = ContractBid.objects.select_related('contract', 'contractor__user').get(id=bid_id)
        except ContractBid.DoesNotExist:
            raise ValidationError("Bid not found.")

        contract = bid.contract
        if contract.status != Contract.Status.IN_BIDDING:
            raise ValidationError("Contract is not in bidding stage.")

        # Reject all other bids
        contract.bids.exclude(id=bid_id).update(status=ContractBid.BidStatus.REJECTED)
        
        # Award this bid
        bid.status = ContractBid.BidStatus.ACCEPTED
        bid.save()

        # Create Assignment record
        ContractAssignment.objects.create(
            contract=contract,
            contractor=bid.contractor,
            bid=bid,
            final_amount=bid.bid_amount,
            final_deadline=timezone.now().date() + timezone.timedelta(days=bid.estimated_days)
        )

        # Update contract status
        contract.status = Contract.Status.AWARDED
        contract.save()

        # Notify contractor
        Notification.objects.create(
            user=bid.contractor.user,
            title="Contract Awarded",
            message=f"Congratulations! You have been awarded the contract: {contract.title}.",
            type="CONTRACT"
        )

        logger.info(f"Contract {contract.id} awarded to {bid.contractor.user.email}")
        return contract

    @staticmethod
    @transaction.atomic
    def upload_work_proof(contract_id: int, user, file, progress_percent: int, comment: str) -> WorkProof:
        """
        Contractor uploads proof of work.
        """
        try:
            # Must be assigned to this contractor
            contract = Contract.objects.select_related('assignment__contractor__user').get(
                id=contract_id, 
                assignment__contractor__user=user
            )
        except Contract.DoesNotExist:
            raise ValidationError("Contract not found or not assigned to you.")

        proof = WorkProof.objects.create(
            contract=contract,
            file=file,
            description=comment,
            uploaded_by=user
        )

        # Log work progress
        WorkProgress.objects.create(
            contract=contract,
            progress_percentage=progress_percent,
            update_note=comment,
            updated_by=user,
            status=WorkProgress.ProgressStatus.IN_PROGRESS
        )

        if contract.status == Contract.Status.AWARDED:
            contract.status = Contract.Status.IN_PROGRESS
            contract.save()

        # Handle 100% Completion
        if progress_percent >= 100:
            contract.status = Contract.Status.COMPLETED
            contract.save()

            # Create Verification request for DEO
            WorkVerification.objects.get_or_create(
                contract=contract,
                defaults={'verification_status': WorkVerification.VerificationStatus.PENDING}
            )

            # Notify DEO(s) in the school's district
            deo_users = User.objects.filter(
                role=User.Role.DEO, 
                deo_profile__district=contract.school.district
            )
            for deo in deo_users:
                Notification.objects.create(
                    user=deo,
                    title="Payment Approval Required",
                    message=f"Contractor has completed '{contract.title}'. Please verify work proof and approve payment.",
                    type="CONTRACT"
                )
            logger.info(f"Contract {contract_id} submitted for DEO approval.")

        logger.info(f"Work proof uploaded for Contract {contract_id} (Progress: {progress_percent}%)")
        return proof
