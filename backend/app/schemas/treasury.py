from pydantic import BaseModel, Field
from typing import Optional, List
import datetime as dt
from decimal import Decimal

class FinancialLedgerEntryCreate(BaseModel):
    date: dt.date = Field(default_factory=dt.date.today)
    type: str = Field(..., description="income or expenditure")
    category: str
    amount: Decimal = Field(..., gt=Decimal("0.00"), description="Amount in KES (fixed precision)")
    description: str
    reference: str
    payment_mode: str = "mpesa"
    linked_member_id: Optional[str] = None
    linked_welfare_request_id: Optional[str] = None
    recorded_by: str = "Finance Officer"

class FinancialLedgerEntryResponse(BaseModel):
    id: str
    date: dt.date
    type: str
    category: str
    amount: Decimal
    description: str
    reference: str
    payment_mode: str
    linked_member_id: Optional[str] = None
    linked_welfare_request_id: Optional[str] = None
    recorded_by: str
    is_reconciled: bool
    reconciled_at: Optional[dt.datetime] = None
    is_reversal: bool
    created_at: dt.datetime

    class Config:
        from_attributes = True

class TreasuryItem(BaseModel):
    label: str
    amount: Decimal
    type: str  # credit or debit

class TreasuryReconciliationAuditResponse(BaseModel):
    status: str
    currency: str = "KES"
    calculation_formula: str
    opening_reserve: Decimal
    verified_contributions: Decimal
    unverified_pending_contributions: Decimal
    disputed_or_reversed_contributions: Decimal
    other_income: Decimal
    welfare_disbursed: Decimal
    operational_expenses: Decimal
    reconciled_cash_balance: Decimal
    is_positive: bool
    flag_negative_balance: bool
    audit_warning: Optional[str] = None
    breakdown_items: List[TreasuryItem]
