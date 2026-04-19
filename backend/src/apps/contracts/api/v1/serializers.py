"""
Contracts API v1 serializers.

Covers the full contract lifecycle: Contract → Bid → Assignment →
WorkProgress → WorkProof (file upload) → WorkVerification → Payment.
"""

from rest_framework import serializers

from apps.contracts.models import (
    Contract,
    ContractAssignment,
    ContractBid,
    ContractPayment,
    WorkProgress,
    WorkProof,
    WorkVerification,
)


class ContractListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_level_display", read_only=True)
    school_name = serializers.CharField(source="school.name", read_only=True)
    district = serializers.CharField(source="school.district", read_only=True)

    class Meta:
        model = Contract
        fields = [
            "id", "school", "prediction_report", "title", "description",
            "category", "category_display", "estimated_cost",
            "priority_level", "priority_display", "school_name", "district",
            "status", "status_display", "current_progress",
            "bid_start_date", "bid_end_date",
            "created_by", "created_at",
        ]
        read_only_fields = ["id", "created_at", "created_by"]


class ContractBidSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ContractBid
        fields = [
            "id", "contract", "contractor",
            "bid_amount", "estimated_days", "proposal_text",
            "status", "status_display", "submitted_at", "created_at",
        ]
        read_only_fields = ["id", "contractor", "submitted_at", "created_at"]

    def validate_bid_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Bid amount must be a positive number.")
        return value


class ContractAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractAssignment
        fields = [
            "id", "contract", "contractor", "bid",
            "final_amount", "final_deadline", "assigned_at", "created_at",
        ]
        read_only_fields = ["id", "assigned_at", "created_at"]

    def validate_final_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Final amount must be positive.")
        return value


class WorkProgressSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = WorkProgress
        fields = [
            "id", "contract", "progress_percentage",
            "status", "status_display",
            "update_note", "updated_by", "updated_at", "created_at",
        ]
        read_only_fields = ["id", "updated_by", "updated_at", "created_at"]

    def validate_progress_percentage(self, value):
        if not (0 <= value <= 100):
            raise serializers.ValidationError("Progress must be between 0 and 100.")
        return value


class WorkProofSerializer(serializers.ModelSerializer):
    """
    Serializer for work proof file uploads.

    Accepts multipart/form-data with file upload.
    File constraints: max 10MB, allowed types: jpg, png, gif, mp4, pdf, doc, docx.
    """

    file_type_display = serializers.CharField(source="get_file_type_display", read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = WorkProof
        fields = [
            "id", "contract", "file", "file_url", "file_type", "file_type_display",
            "description", "uploaded_by", "uploaded_at", "created_at",
        ]
        read_only_fields = ["id", "uploaded_by", "uploaded_at", "created_at"]

    def get_file_url(self, obj) -> str | None:
        """Return the absolute URL for the uploaded file."""
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class WorkVerificationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(
        source="get_verification_status_display", read_only=True,
    )

    class Meta:
        model = WorkVerification
        fields = [
            "id", "contract", "verified_by",
            "verification_status", "status_display",
            "remarks", "verified_at", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ContractPaymentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(
        source="get_payment_status_display", read_only=True,
    )

    class Meta:
        model = ContractPayment
        fields = [
            "id", "contract", "amount",
            "payment_status", "status_display",
            "transaction_reference", "paid_at", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Payment amount must be positive.")
        return value


class ContractDetailSerializer(serializers.ModelSerializer):
    """Full contract with nested lifecycle data for detail view."""

    status_display = serializers.CharField(source="get_status_display", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_level_display", read_only=True)
    bids = ContractBidSerializer(many=True, read_only=True)
    assignment = ContractAssignmentSerializer(read_only=True)
    progress_updates = WorkProgressSerializer(many=True, read_only=True)
    proofs = WorkProofSerializer(many=True, read_only=True)
    verifications = WorkVerificationSerializer(many=True, read_only=True)
    payments = ContractPaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Contract
        fields = [
            "id", "school", "prediction_report", "title", "description",
            "category", "category_display", "estimated_cost",
            "priority_level", "priority_display", "current_progress",
            "status", "status_display",
            "bid_start_date", "bid_end_date",
            "created_by", "created_at", "updated_at",
            "bids", "assignment", "progress_updates",
            "proofs", "verifications", "payments",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
