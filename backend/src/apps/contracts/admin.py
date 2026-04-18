"""
Contracts app admin configuration.
"""

from django.contrib import admin

from apps.contracts.models import (
    Contract,
    ContractAssignment,
    ContractBid,
    ContractPayment,
    WorkProgress,
    WorkProof,
    WorkVerification,
)


class ContractBidInline(admin.TabularInline):
    model = ContractBid
    extra = 0
    raw_id_fields = ("contractor",)


class ContractAssignmentInline(admin.StackedInline):
    model = ContractAssignment
    extra = 0
    max_num = 1
    raw_id_fields = ("contractor", "bid")


class WorkProgressInline(admin.TabularInline):
    model = WorkProgress
    extra = 0
    raw_id_fields = ("updated_by",)


class WorkProofInline(admin.TabularInline):
    model = WorkProof
    extra = 0
    raw_id_fields = ("uploaded_by",)


class WorkVerificationInline(admin.StackedInline):
    model = WorkVerification
    extra = 0
    raw_id_fields = ("verified_by",)


class ContractPaymentInline(admin.TabularInline):
    model = ContractPayment
    extra = 0


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "school",
        "category",
        "estimated_cost",
        "priority_level",
        "status",
        "created_by",
        "created_at",
    )
    search_fields = ("title", "school__name", "school__udise_code")
    list_filter = ("status", "category", "priority_level")
    raw_id_fields = ("school", "prediction_report", "created_by")
    date_hierarchy = "created_at"
    inlines = [
        ContractBidInline,
        ContractAssignmentInline,
        WorkProgressInline,
        WorkProofInline,
        WorkVerificationInline,
        ContractPaymentInline,
    ]


@admin.register(ContractBid)
class ContractBidAdmin(admin.ModelAdmin):
    list_display = (
        "contract",
        "contractor",
        "bid_amount",
        "estimated_days",
        "status",
        "submitted_at",
    )
    search_fields = ("contract__title", "contractor__company_name")
    list_filter = ("status",)
    raw_id_fields = ("contract", "contractor")


@admin.register(ContractAssignment)
class ContractAssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "contract",
        "contractor",
        "final_amount",
        "final_deadline",
        "assigned_at",
    )
    search_fields = ("contract__title", "contractor__company_name")
    raw_id_fields = ("contract", "contractor", "bid")


@admin.register(WorkProgress)
class WorkProgressAdmin(admin.ModelAdmin):
    list_display = (
        "contract",
        "progress_percentage",
        "status",
        "updated_by",
        "updated_at",
    )
    search_fields = ("contract__title",)
    list_filter = ("status",)
    raw_id_fields = ("contract", "updated_by")


@admin.register(WorkProof)
class WorkProofAdmin(admin.ModelAdmin):
    list_display = (
        "contract",
        "file_type",
        "uploaded_by",
        "uploaded_at",
    )
    search_fields = ("contract__title", "description")
    list_filter = ("file_type",)
    raw_id_fields = ("contract", "uploaded_by")


@admin.register(WorkVerification)
class WorkVerificationAdmin(admin.ModelAdmin):
    list_display = (
        "contract",
        "verified_by",
        "verification_status",
        "verified_at",
    )
    search_fields = ("contract__title",)
    list_filter = ("verification_status",)
    raw_id_fields = ("contract", "verified_by")


@admin.register(ContractPayment)
class ContractPaymentAdmin(admin.ModelAdmin):
    list_display = (
        "contract",
        "amount",
        "payment_status",
        "transaction_reference",
        "paid_at",
    )
    search_fields = ("contract__title", "transaction_reference")
    list_filter = ("payment_status",)
    raw_id_fields = ("contract",)
