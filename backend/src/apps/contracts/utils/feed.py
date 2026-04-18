"""
feed.py — Seeder for contracts app.
"""

import random
from datetime import timedelta
from django.utils import timezone
from faker import Faker
from django.db import transaction
from apps.contracts.models import (
    Contract, ContractBid, ContractAssignment, WorkProgress, 
    WorkProof, WorkVerification, ContractPayment, PriorityLevel, InfraCategory
)
from apps.schools.models import School
from apps.accounts.models import User, ContractorProfile, DEOProfile
from apps.predictions.models import PredictionReport

fake = Faker()

@transaction.atomic
def seed_contracts(count=50):
    """Seed contracts with lifecycle stages."""
    schools = list(School.objects.all())
    contractors = list(ContractorProfile.objects.all())
    deos = list(DEOProfile.objects.all())
    predictions = list(PredictionReport.objects.filter(overall_risk_level__in=["HIGH", "CRITICAL"]))
    
    if not schools or not contractors or not deos: return
    
    print(f"Feeding {count} contracts...")
    
    for i in range(count):
        # Pick a high-risk prediction if available
        pred = random.choice(predictions) if predictions and random.random() < 0.7 else None
        school = pred.school if pred else random.choice(schools)
        
        title = f"Repair of {random.choice(['Toilets', 'Roof', 'Wiring', 'Walls'])} at {school.name}"
        status = random.choice(["OPEN", "IN_BIDDING", "AWARDED", "IN_PROGRESS", "COMPLETED"])
        
        # Use get_or_create to make it idempotent
        contract, created = Contract.objects.get_or_create(
            school=school,
            title=title,
            defaults={
                "prediction_report": pred,
                "description": fake.paragraph(),
                "category": random.choice(InfraCategory.values),
                "estimated_cost": random.uniform(50000, 500000),
                "priority_level": random.choice(PriorityLevel.values),
                "status": status,
                "bid_start_date": timezone.now().date() - timedelta(days=30),
                "bid_end_date": timezone.now().date() + timedelta(days=10),
                "created_by": random.choice(deos).user
            }
        )
        
        if created:
            # Bids
            num_bids = random.randint(2, 6)
            bidders = random.sample(contractors, min(num_bids, len(contractors)))
            winning_bid = None
            
            for bidder in bidders:
                bid_status = "PENDING"
                if status != "OPEN" and status != "IN_BIDDING":
                    bid_status = "REJECTED"
                    
                bid = ContractBid.objects.create(
                    contract=contract,
                    contractor=bidder,
                    bid_amount=contract.estimated_cost * random.uniform(0.8, 1.2),
                    estimated_days=random.randint(20, 90),
                    proposal_text=fake.text(),
                    status=bid_status
                )
                if not winning_bid: winning_bid = bid # Candidate
                
            # Assignment
            if status in ["AWARDED", "IN_PROGRESS", "COMPLETED"]:
                winning_bid.status = "ACCEPTED"
                winning_bid.save()
                
                ContractAssignment.objects.create(
                    contract=contract,
                    contractor=winning_bid.contractor,
                    bid=winning_bid,
                    final_amount=winning_bid.bid_amount,
                    final_deadline=timezone.now().date() + timedelta(days=60)
                )
                
                # Progress updates
                num_updates = 0
                if status == "IN_PROGRESS": num_updates = random.randint(1, 4)
                if status == "COMPLETED": num_updates = 5
                
                for j in range(num_updates):
                    WorkProgress.objects.create(
                        contract=contract,
                        progress_percentage=min(100, (j+1) * 20),
                        status="IN_PROGRESS" if j < 4 else "COMPLETED",
                        update_note=fake.sentence(),
                        updated_by=winning_bid.contractor.user
                    )
                    
                # Proofs
                if num_updates > 0:
                    WorkProof.objects.create(
                        contract=contract,
                        file_type="IMAGE",
                        description="Work site photo",
                        uploaded_by=winning_bid.contractor.user
                    )
                    
            # Verification & Payment
            if status == "COMPLETED":
                WorkVerification.objects.create(
                    contract=contract,
                    verified_by=random.choice(deos).user,
                    verification_status="APPROVED",
                    remarks=fake.sentence(),
                    verified_at=timezone.now()
                )
                
                ContractPayment.objects.create(
                    contract=contract,
                    amount=winning_bid.bid_amount,
                    payment_status="PAID",
                    transaction_reference=fake.uuid4(),
                    paid_at=timezone.now()
                )

def seed_all():
    seed_contracts()
    print("Contracts seeding completed!")
