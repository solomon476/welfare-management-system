from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

# Member Models
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
    monthly_commitment: float = 1500.0
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
    monthly_commitment: Optional[float] = None
    next_of_kin: Optional[NextOfKinSchema] = None
    notes: Optional[str] = None

class MemberResponse(MemberBase):
    id: str
    membership_number: str

    class Config:
        from_attributes = True

# Contribution Models
class ContributionBase(BaseModel):
    member_id: str
    member_name: str
    membership_number: str
    amount: float
    payment_date: date
    category: str  # monthly_dues, benevolent_levy, emergency_fund, registration_fee
    payment_method: str  # mpesa, bank_transfer, cash, cheque
    reference_number: str
    notes: Optional[str] = None

class ContributionCreate(ContributionBase):
    recorded_by: Optional[str] = "Welfare Officer"

class ContributionVerify(BaseModel):
    verified_by: str = "Finance Officer"

class ContributionReverse(BaseModel):
    reason: str

class ContributionResponse(ContributionBase):
    id: str
    status: str  # recorded, verified, disputed, reversed
    recorded_by: str
    recorded_at: str
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    reversal_reason: Optional[str] = None

    class Config:
        from_attributes = True

# Welfare Models
class WelfareDocumentSchema(BaseModel):
    id: str
    name: str
    size: str
    uploaded_at: str
    url: Optional[str] = None

class RequestDecisionSchema(BaseModel):
    id: str
    status: str
    officer_name: str
    officer_role: str
    timestamp: str
    notes: str
    amount_approved: Optional[float] = None

class WelfareRequestBase(BaseModel):
    member_id: str
    member_name: str
    membership_number: str
    category: str  # bereavement, medical, education_emergency, disaster_relief, general_assistance
    urgency: str = "normal"  # normal, urgent, emergency
    amount_requested: float
    description: str
    bank_or_mpesa_payout_details: Optional[str] = None

class WelfareRequestCreate(WelfareRequestBase):
    documents: List[WelfareDocumentSchema] = []

class WelfareStatusUpdate(BaseModel):
    status: str
    notes: str
    officer_name: str
    officer_role: str
    amount_approved: Optional[float] = None

class WelfareDisburse(BaseModel):
    payment_mode: str  # mpesa, bank_transfer, cheque, cash
    reference_number: str
    officer_name: str = "Finance Officer"

class WelfareRequestResponse(WelfareRequestBase):
    id: str
    amount_approved: Optional[float] = None
    status: str
    submission_date: date
    documents: List[WelfareDocumentSchema] = []
    decisions: List[RequestDecisionSchema] = []
    disbursement_id: Optional[str] = None
    internal_notes: Optional[str] = None

    class Config:
        from_attributes = True

# Financial Transaction Models
class FinancialTransactionBase(BaseModel):
    date: date
    type: str  # income, expenditure
    category: str
    amount: float
    description: str
    reference: str
    payment_mode: str
    linked_member_id: Optional[str] = None
    linked_welfare_request_id: Optional[str] = None

class FinancialTransactionCreate(FinancialTransactionBase):
    recorded_by: str = "Finance Officer"

class FinancialTransactionResponse(FinancialTransactionBase):
    id: str
    recorded_by: str
    is_reconciled: bool = False
    reconciled_at: Optional[str] = None

    class Config:
        from_attributes = True

# User Account & Auth
class UserAccountSchema(BaseModel):
    id: str
    name: str
    email: str
    role: str  # admin, welfare_officer, finance_officer, approver, member
    avatar: str
    linked_member_id: Optional[str] = None
    department: Optional[str] = None
    is_active: bool = True
    last_login: Optional[str] = None

# Audit Log Models
class AuditLogSchema(BaseModel):
    id: str
    timestamp: str
    user_id: str
    user_name: str
    user_role: str
    action: str
    entity_type: str
    entity_id: str
    description: str
    previous_value: Optional[str] = None
    new_value: Optional[str] = None

# Settings & System Stats
class OrgSettingsSchema(BaseModel):
    org_name: str
    tagline: str
    registration_number: str
    currency: str = "KES"
    monthly_dues_amount: float = 1500.0
    welfare_registration_fee: float = 2000.0
    fiscal_year_start: str = "01-01"
    opening_reserve_balance: float = 200000.0
    max_bereavement_benefit: float = 50000.0
    max_medical_benefit: float = 35000.0
    max_education_benefit: float = 25000.0
    approval_quorum: int = 2
    contact_email: str
    contact_phone: str
    address: str
    is_demo_mode: bool = True

class SystemStatsSchema(BaseModel):
    total_members: int
    active_members: int
    pending_members: int
    opening_reserve_balance: float
    total_verified_income: float
    total_pending_contributions: float
    total_expenditure: float
    operational_balance: float
    pending_requests_count: int
    approved_requests_count: int
    disbursed_requests_total: float
