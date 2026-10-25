from pydantic import BaseModel, Field
from typing import Optional, List
import datetime as dt
from decimal import Decimal

class ContributionBase(BaseModel):
    member_id: str
    amount: Decimal = Field(..., gt=Decimal("0.00"), description="Monetary amount in KES (fixed precision)")
    payment_date: dt.date
    category: str = "monthly_dues"  # monthly_dues, benevolent_levy, emergency_fund, registration_fee
    payment_method: str = "mpesa"   # mpesa, bank_transfer, cash, cheque
    reference_number: str = Field(..., min_length=4, max_length=100, description="Unique reference code (e.g. M-Pesa code)")
    notes: Optional[str] = None
    idempotency_key: Optional[str] = None

class ContributionCreate(ContributionBase):
    recorded_by: Optional[str] = "Welfare Officer"

class ContributionVerify(BaseModel):
    verified_by: str = "Finance Officer"

class ContributionReverse(BaseModel):
    reason: str = Field(..., min_length=5, description="Mandatory audit explanation for reversal")

class ContributionResponse(BaseModel):
    id: str
    member_id: str
    member_name: str
    membership_number: str
    amount: Decimal
    payment_date: dt.date
    category: str
    payment_method: str
    reference_number: str
    status: str
    notes: Optional[str] = None
    recorded_by: str
    recorded_at: dt.datetime
    verified_by: Optional[str] = None
    verified_at: Optional[dt.datetime] = None
    reversal_reason: Optional[str] = None

    class Config:
        from_attributes = True

# High-Volume Batch Import Schemas for 50,000–100,000 members
class BatchContributionItem(BaseModel):
    member_identifier: str = Field(..., description="National ID, Phone (+254...), or Membership Number")
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    payment_date: dt.date = Field(default_factory=dt.date.today)
    category: str = "monthly_dues"
    payment_method: str = "mpesa"
    reference_number: str = Field(..., min_length=4, max_length=100)
    notes: Optional[str] = None

class BatchContributionImportRequest(BaseModel):
    batch_reference: str = Field(..., description="Statement file batch label (e.g. MPESA_PAYBILL_OCT2026)")
    items: List[BatchContributionItem] = Field(..., max_length=5000)
    auto_verify: bool = False
    recorded_by: str = "Finance Officer"

class BatchContributionImportResponse(BaseModel):
    batch_reference: str
    total_submitted: int
    successfully_imported: int
    duplicates_skipped: int
    unmatched_identifiers: List[str]
    total_amount_recorded: Decimal
    status: str
