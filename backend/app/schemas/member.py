from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

class NextOfKinSchema(BaseModel):
    name: str
    relationship: str
    phone: str
    email: Optional[str] = None

class MemberBase(BaseModel):
    full_name: str
    national_id: str
    phone: str
    email: Optional[str] = None
    category: str = "full_member"  # full_member, associate, senior, youth
    status: str = "active"          # active, inactive, suspended, pending
    date_joined: date
    # Store monetary values as fixed-precision Decimal, never float
    monthly_commitment: Decimal = Field(default=Decimal("1500.00"), ge=Decimal("0.00"))
    next_of_kin: NextOfKinSchema
    notes: Optional[str] = None
    avatar_url: Optional[str] = None

class MemberCreate(MemberBase):
    pass

class MemberUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    monthly_commitment: Optional[Decimal] = None
    next_of_kin: Optional[NextOfKinSchema] = None
    notes: Optional[str] = None

class MemberResponse(BaseModel):
    id: str
    membership_number: str
    full_name: str
    national_id: str
    phone: str
    email: Optional[str] = None
    category: str
    status: str
    date_joined: date
    monthly_commitment: Decimal
    next_of_kin_name: str
    next_of_kin_relationship: str
    next_of_kin_phone: str
    next_of_kin_email: Optional[str] = None
    notes: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
