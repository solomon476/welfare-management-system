from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

class ContributionBase(BaseModel):
    member_id: str
    amount: Decimal = Field(..., gt=Decimal("0.00"), description="Monetary amount in KES (fixed precision)")
    payment_date: date
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
    payment_date: date
    category: str
    payment_method: str
    reference_number: str
    status: str
    notes: Optional[str] = None
    recorded_by: str
    recorded_at: datetime
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    reversal_reason: Optional[str] = None

    class Config:
        from_attributes = True
