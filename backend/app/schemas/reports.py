from pydantic import BaseModel
from typing import Optional, List
import datetime as dt
from decimal import Decimal

class MemberStatementItem(BaseModel):
    id: str
    date: dt.date
    type: str  # contribution or welfare_payout
    category: str
    reference: str
    amount: Decimal
    status: str

class MemberStatementResponse(BaseModel):
    member_id: str
    membership_number: str
    member_name: str
    phone: str
    date_joined: dt.date
    status: str
    total_contributions_verified: Decimal
    total_contributions_pending: Decimal
    total_welfare_benefits_received: Decimal
    net_welfare_standing: Decimal
    statement_period: str
    items: List[MemberStatementItem]

class SystemSummaryStats(BaseModel):
    total_members: int
    active_members: int
    pending_members: int
    opening_reserve_balance: Decimal
    total_verified_income: Decimal
    total_pending_contributions: Decimal
    total_expenditure: Decimal
    operational_balance: Decimal
    pending_requests_count: int
    approved_requests_count: int
    disbursed_requests_total: Decimal
