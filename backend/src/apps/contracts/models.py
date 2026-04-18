"""
Contracts app models.

Covers the full contract lifecycle: creation → bidding → assignment →
work progress tracking → proof uploads → verification → payment.
"""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from common.models import TimeStampedModel
from common.validators import (
    FileExtensionValidator,
    FileSizeValidator,
    validate_percentage,
    validate_positive,
)


# ===========================================================================
# Upload-path helpers
# ===========================================================================

def work_proof_upload_to(instance: "WorkProof", filename: str) -> str:
    """
    Dynamic upload path for WorkProof files.

    Files are stored at: media/contracts/<contract_id>/<filename>
    """
    return f"contracts/{instance.contract_id}/{filename}"


# ===========================================================================
# Shared Choices
# ===========================================================================

class InfraCategory(models.TextChoices):
    PLUMBING = "PLUMBING", "Plumbing"
    ELECTRICAL = "ELECTRICAL", "Electrical"
    STRUCTURAL = "STRUCTURAL", "Structural"


class PriorityLevel(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"


# ===========================================================================
# Contract
# ===========================================================================

class Contract(TimeStampedModel):
    """
    Infrastructure repair/maintenance contract for a school.
    """

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        IN_BIDDING = "IN_BIDDING", "In Bidding"
        AWARDED = "AWARDED", "Awarded"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    school = models.ForeignKey(
        "schools.School",
        on_delete=models.PROTECT,
        related_name="contracts",
    )
    prediction_report = models.ForeignKey(
        "predictions.PredictionReport",
        on_delete=models.SET_NULL,
        related_name="contracts",
        null=True,
        blank=True,
        help_text="The prediction report that triggered this contract.",
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")

    category = models.CharField(
        max_length=15,
        choices=InfraCategory.choices,
        db_index=True,
    )
    estimated_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[validate_positive],
    )
    priority_level = models.CharField(
        max_length=10,
        choices=PriorityLevel.choices,
        default=PriorityLevel.MEDIUM,
        db_index=True,
    )
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.OPEN,
        db_index=True,
    )

    bid_start_date = models.DateField(null=True, blank=True)
    bid_end_date = models.DateField(null=True, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_contracts",
        help_text="Admin or DEO who created this contract.",
    )

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Contract"
        verbose_name_plural = "Contracts"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.status})"

    @property
    def current_progress(self) -> int:
        """Returns the latest progress percentage from WorkProgress history."""
        latest = self.progress_updates.order_by("-updated_at").first()
        return latest.progress_percentage if latest else 0

    def clean(self) -> None:
        super().clean()
        if self.bid_start_date and self.bid_end_date:
            if self.bid_end_date < self.bid_start_date:
                raise ValidationError({
                    "bid_end_date": "Bid end date cannot be before bid start date.",
                })


# ===========================================================================
# Contract Bid
# ===========================================================================

class ContractBid(TimeStampedModel):
    """
    A contractor's bid on a contract.

    UniqueConstraint ensures one bid per contractor per contract.
    """

    class BidStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"
        WITHDRAWN = "WITHDRAWN", "Withdrawn"

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="bids",
    )
    contractor = models.ForeignKey(
        "accounts.ContractorProfile",
        on_delete=models.CASCADE,
        related_name="bids",
    )

    bid_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[validate_positive],
    )
    estimated_days = models.PositiveIntegerField(
        help_text="Estimated number of days to complete the work.",
    )
    proposal_text = models.TextField(blank=True, default="")

    status = models.CharField(
        max_length=10,
        choices=BidStatus.choices,
        default=BidStatus.PENDING,
        db_index=True,
    )
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Contract Bid"
        verbose_name_plural = "Contract Bids"
        constraints = [
            models.UniqueConstraint(
                fields=["contract", "contractor"],
                name="uq_contract_bid_contractor",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"Bid by {self.contractor} on {self.contract.title} "
            f"(₹{self.bid_amount})"
        )


# ===========================================================================
# Contract Assignment
# ===========================================================================

class ContractAssignment(TimeStampedModel):
    """
    Records which contractor was awarded a contract.

    OneToOneField on contract ensures one assignment per contract.
    """

    contract = models.OneToOneField(
        Contract,
        on_delete=models.CASCADE,
        related_name="assignment",
    )
    contractor = models.ForeignKey(
        "accounts.ContractorProfile",
        on_delete=models.PROTECT,
        related_name="assignments",
    )
    bid = models.ForeignKey(
        ContractBid,
        on_delete=models.PROTECT,
        related_name="assignment",
    )

    final_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[validate_positive],
    )
    final_deadline = models.DateField()
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Contract Assignment"
        verbose_name_plural = "Contract Assignments"

    def __str__(self) -> str:
        return f"Assignment: {self.contract.title} → {self.contractor}"


# ===========================================================================
# Work Progress
# ===========================================================================

class WorkProgress(TimeStampedModel):
    """
    Progress update on a contract.
    Multiple updates are expected over the lifetime of a contract.
    """

    class ProgressStatus(models.TextChoices):
        NOT_STARTED = "NOT_STARTED", "Not Started"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        ON_HOLD = "ON_HOLD", "On Hold"
        COMPLETED = "COMPLETED", "Completed"

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="progress_updates",
    )

    progress_percentage = models.PositiveSmallIntegerField(
        default=0,
        validators=[validate_percentage],
        help_text="Percentage of work completed (0–100).",
    )

    status = models.CharField(
        max_length=15,
        choices=ProgressStatus.choices,
        default=ProgressStatus.NOT_STARTED,
        db_index=True,
    )

    update_note = models.TextField(blank=True, default="")

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="progress_updates",
    )

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Work Progress"
        verbose_name_plural = "Work Progress Updates"
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"Progress: {self.contract.title} – {self.progress_percentage}%"


# ===========================================================================
# Work Proof
# ===========================================================================

class WorkProof(TimeStampedModel):
    """
    Evidence files (images, videos, documents) uploaded for a contract.
    """

    class FileType(models.TextChoices):
        IMAGE = "IMAGE", "Image"
        VIDEO = "VIDEO", "Video"
        DOCUMENT = "DOCUMENT", "Document"

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="proofs",
    )

    file = models.FileField(
        upload_to=work_proof_upload_to,
        validators=[
            FileSizeValidator(max_mb=10),
            FileExtensionValidator(),
        ],
        help_text="Upload image, video, or document as proof of work.",
    )
    file_type = models.CharField(
        max_length=10,
        choices=FileType.choices,
        db_index=True,
    )

    description = models.TextField(blank=True, default="")

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="uploaded_proofs",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Work Proof"
        verbose_name_plural = "Work Proofs"

    def __str__(self) -> str:
        return f"Proof ({self.file_type}): {self.contract.title}"


# ===========================================================================
# Work Verification
# ===========================================================================

class WorkVerification(TimeStampedModel):
    """
    Verification record from a DEO or official for a contract.
    """

    class VerificationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="verifications",
    )

    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="work_verifications",
        help_text="DEO or official who verified the work.",
    )
    verification_status = models.CharField(
        max_length=10,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
        db_index=True,
    )
    remarks = models.TextField(blank=True, default="")
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Work Verification"
        verbose_name_plural = "Work Verifications"

    def __str__(self) -> str:
        return (
            f"Verification: {self.contract.title} – "
            f"{self.verification_status}"
        )


# ===========================================================================
# Contract Payment
# ===========================================================================

class ContractPayment(TimeStampedModel):
    """
    Payment record for a contract.
    """

    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PARTIAL = "PARTIAL", "Partial"
        PAID = "PAID", "Paid"

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="payments",
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[validate_positive],
    )

    payment_status = models.CharField(
        max_length=10,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True,
    )

    transaction_reference = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Bank or UPI transaction reference number.",
    )

    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta(TimeStampedModel.Meta):
        verbose_name = "Contract Payment"
        verbose_name_plural = "Contract Payments"

    def __str__(self) -> str:
        return (
            f"Payment: {self.contract.title} – ₹{self.amount} "
            f"({self.payment_status})"
        )
