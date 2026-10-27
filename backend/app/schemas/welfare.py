from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

class WelfareDecisionResponse(BaseModel):
    id: str
    status: str
    officer_name: str
    officer_role: str
    timestamp: datetime
    notes: str
    amount_approved: Optional[Decimal] = None

    class Config:
        from_attributes = True

class WelfareRequestBase(BaseModel):
    member_id: str
    category: str  # bereavement, medical, education_emergency, disaster_relief, general_assistance
    urgency: str = "normal"  # normal, urgent, emergency
    amount_requested: Decimal = Field(..., gt=Decimal("0.00"), description="Claim amount requested in KES")
    description: str = Field(..., min_length=10)
    bank_or_mpesa_payout_details: Optional[str] = None

class WelfareRequestCreate(WelfareRequestBase):
    pass

class WelfareStatusUpdate(BaseModel):
    status: str = Field(..., description="under_review, approved, rejected, documents_requested")
    notes: Optional[str] = "Status update recorded"
    officer_name: Optional[str] = None
    officer_role: Optional[str] = None
    amount_approved: Optional[Decimal] = Field(None, ge=Decimal("0.00"))

class WelfareDisburse(BaseModel):
    payment_mode: str = "mpesa"  # mpesa, bank_transfer, cheque, cash
    reference_number: str = Field(..., min_length=4)
    officer_name: str = "Finance Officer"

class WelfareRequestResponse(BaseModel):
    id: str
    member_id: str
    member_name: str
    membership_number: str
    category: str
    urgency: str
    amount_requested: Decimal
    amount_approved: Optional[Decimal] = None
    description: str
    bank_or_mpesa_payout_details: Optional[str] = None
    status: str
    submission_date: date
    disbursement_id: Optional[str] = None
    internal_notes: Optional[str] = None
    created_at: datetime
    decisions: List[WelfareDecisionResponse] = []

    class Config:
        from_attributes = True
