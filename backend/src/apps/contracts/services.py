"""
Contracts app services for business logic.
"""

import logging
from django.utils import timezone
from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import Contract, Bid, WorkProgress, WorkProof
from apps.notifications.models import Notification

logger = logging.getLogger(__name__)


class ContractLifecycleService:
    """
    Manages the full contract lifecycle from creation to completion.
    """

    @staticmethod
    @transaction.atomic
    def create_contract_from_prediction(prediction_id: int):
        """
        Triggered when a prediction identifies high/medium risk.
        Creates an OPEN contract for bidding.
        """
        from apps.predictions.models import PredictionReport
        try:
            pred = PredictionReport.objects.select_related('school').get(id=prediction_id)
        except PredictionReport.DoesNotExist:
            return None

        # Logic to decide if a contract is needed
        # Create a combined title based on categories
        categories = []
        if pred.plumbing_score >= 70: categories.append("PLUMBING")
        if pred.electrical_score >= 70: categories.append("ELECTRICAL")
        if pred.structural_score >= 70: categories.append("STRUCTURAL")

        if not categories:
            return None # No high risk detected

        for cat in categories:
            # Check if an open contract for same school/category already exists
            if not Contract.objects.filter(
                school=pred.school,
                category=cat,
                status__in=[Contract.Status.OPEN, Contract.Status.IN_BIDDING, Contract.Status.AWARDED]
            ).exists():
                contract = Contract.objects.create(
                    school=pred.school,
                    prediction_report=pred,
                    title=f"Repair: {cat} Issues at {pred.school.name}",
                    category=cat,
                    estimated_cost=50000.0, # Placeholder, in reality would use a rate-card
                    priority_level=pred.overall_risk_level,
                    status=Contract.Status.OPEN
                )
                logger.info(f"Auto-created contract {contract.id} for {pred.school.name} ({cat})")

    @staticmethod
    @transaction.atomic
    def submit_bid(user, contract_id: int, quote: float, timeline_weeks: int) -> Bid:
        """
        Allows a contractor to submit a bid for an OPEN contract.
        """
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

        bid, created = Bid.objects.update_or_create(
            contract=contract,
            contractor_user=user,
            defaults={
                "bid_amount": quote,
                "proposed_timeline_days": timeline_weeks * 7,
                "status": Bid.Status.PENDING
            }
        )
        
        logger.info(f"Bid submitted by {user.username} for Contract {contract_id}")
        return bid

    @staticmethod
    @transaction.atomic
    def award_contract(bid_id: int, awarded_by) -> Contract:
        """
        DEO/Admin awards the contract to a specific bid.
        """
        try:
            bid = Bid.objects.select_related('contract', 'contractor_user').get(id=bid_id)
        except Bid.DoesNotExist:
            raise ValidationError("Bid not found.")

        contract = bid.contract
        if contract.status != Contract.Status.IN_BIDDING:
            raise ValidationError("Contract is not in bidding stage.")

        # Reject all other bids
        contract.bids.exclude(id=bid_id).update(status=Bid.Status.REJECTED)
        
        # Award this bid
        bid.status = Bid.Status.AWARDED
        bid.save()

        # Update contract
        contract.status = Contract.Status.AWARDED
        contract.assigned_contractor = bid.contractor_user
        contract.final_cost = bid.bid_amount
        contract.awarded_at = timezone.now()
        contract.save()

        # Notify contractor
        Notification.objects.create(
            user=bid.contractor_user,
            title="Contract Awarded",
            message=f"Congratulations! You have been awarded the contract: {contract.title}.",
            notification_type="CONTRACT"
        )

        logger.info(f"Contract {contract.id} awarded to {bid.contractor_user.username}")
        return contract

    @staticmethod
    @transaction.atomic
    def upload_work_proof(contract_id: int, user, file, progress_percent: int, comment: str) -> WorkProof:
        """
        Contractor uploads proof of work.
        """
        try:
            contract = Contract.objects.get(id=contract_id, assigned_contractor=user)
        except Contract.DoesNotExist:
            raise ValidationError("Contract not found or not assigned to you.")

        proof = WorkProof.objects.create(
            contract=contract,
            file=file,
            description=comment,
            uploaded_by=user
        )

        # Update overall contract progress if needed or create separate log
        WorkProgress.objects.create(
            contract=contract,
            percentage_complete=progress_percent,
            remarks=comment,
            updated_by=user
        )

        if contract.status == Contract.Status.AWARDED:
            contract.status = Contract.Status.IN_PROGRESS
            contract.save()

        logger.info(f"Work proof uploaded for Contract {contract_id} (Progress: {progress_percent}%)")
        return proof
