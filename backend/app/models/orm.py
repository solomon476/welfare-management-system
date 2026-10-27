from sqlalchemy import (
    Column, String, Integer, Numeric, Boolean, Date, DateTime, Text, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from datetime import datetime, date
from decimal import Decimal

from ..db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # admin, welfare_officer, finance_officer, approver, member
    avatar = Column(String(255), nullable=True)
    linked_member_id = Column(String(50), ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    member = relationship("Member", back_populates="user_account")
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")

    @property
    def roles_list(self) -> list:
        roles = {self.role} if self.role else set()
        if hasattr(self, "user_roles") and self.user_roles:
            for ur in self.user_roles:
                roles.add(ur.role_id)
        return sorted(list(roles))

class Member(Base):
    __tablename__ = "members"

    id = Column(String(50), primary_key=True, index=True)
    membership_number = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(150), index=True, nullable=False)
    national_id = Column(String(50), unique=True, index=True, nullable=False)
    phone = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(150), index=True, nullable=True)
    category = Column(String(50), default="full_member", nullable=False)  # full_member, associate, senior, youth
    status = Column(String(50), default="active", index=True, nullable=False)  # active, inactive, suspended, pending
    date_joined = Column(Date, default=date.today, nullable=False)
    
    # Financial commitment stored as fixed-precision DECIMAL (never float)
    monthly_commitment = Column(Numeric(14, 2), default=Decimal("1500.00"), nullable=False)
    
    # Next of Kin Details
    next_of_kin_name = Column(String(150), nullable=False)
    next_of_kin_relationship = Column(String(50), nullable=False)
    next_of_kin_phone = Column(String(50), nullable=False)
    next_of_kin_email = Column(String(150), nullable=True)
    
    notes = Column(Text, nullable=True)
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user_account = relationship("User", back_populates="member", uselist=False)
    contributions = relationship("Contribution", back_populates="member", cascade="all, delete-orphan")
    welfare_requests = relationship("WelfareRequest", back_populates="member", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_member_search", "full_name", "national_id", "phone"),
    )

class Contribution(Base):
    __tablename__ = "contributions"

    id = Column(String(50), primary_key=True, index=True)
    member_id = Column(String(50), ForeignKey("members.id", ondelete="CASCADE"), index=True, nullable=False)
    member_name = Column(String(150), nullable=False)
    membership_number = Column(String(50), nullable=False)
    
    # Monetary value stored as Numeric(14, 2)
    amount = Column(Numeric(14, 2), nullable=False)
    payment_date = Column(Date, index=True, nullable=False)
    category = Column(String(50), nullable=False)  # monthly_dues, benevolent_levy, emergency_fund, registration_fee
    payment_method = Column(String(50), nullable=False)  # mpesa, bank_transfer, cash, cheque
    
    # Unique reference enforcement prevents duplicate external receipts (e.g. M-Pesa code)
    reference_number = Column(String(100), unique=True, index=True, nullable=False)
    idempotency_key = Column(String(100), unique=True, index=True, nullable=True)
    
    status = Column(String(50), default="recorded", index=True, nullable=False)  # recorded, verified, disputed, reversed
    notes = Column(Text, nullable=True)
    
    recorded_by = Column(String(100), nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    # Non-destructive reversal mandatory explanation
    reversal_reason = Column(Text, nullable=True)

    member = relationship("Member", back_populates="contributions")

    __table_args__ = (
        Index("idx_contrib_date_status", "payment_date", "status"),
    )

class WelfareRequest(Base):
    __tablename__ = "welfare_requests"

    id = Column(String(50), primary_key=True, index=True)
    member_id = Column(String(50), ForeignKey("members.id", ondelete="CASCADE"), index=True, nullable=False)
    member_name = Column(String(150), nullable=False)
    membership_number = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False)  # bereavement, medical, education_emergency, disaster_relief
    urgency = Column(String(50), default="normal", index=True, nullable=False)  # normal, urgent, emergency
    
    # Amounts in fixed-precision DECIMAL
    amount_requested = Column(Numeric(14, 2), nullable=False)
    amount_approved = Column(Numeric(14, 2), nullable=True)
    
    description = Column(Text, nullable=False)
    bank_or_mpesa_payout_details = Column(Text, nullable=True)
    status = Column(String(50), default="submitted", index=True, nullable=False)
    submission_date = Column(Date, default=date.today, index=True, nullable=False)
    
    disbursement_id = Column(String(50), unique=True, index=True, nullable=True)
    internal_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    member = relationship("Member", back_populates="welfare_requests")
    decisions = relationship("WelfareDecision", back_populates="request", cascade="all, delete-orphan")
    disbursement = relationship("Disbursement", back_populates="request", uselist=False)

class WelfareDecision(Base):
    __tablename__ = "welfare_decisions"

    id = Column(String(50), primary_key=True, index=True)
    request_id = Column(String(50), ForeignKey("welfare_requests.id", ondelete="CASCADE"), index=True, nullable=False)
    status = Column(String(50), nullable=False)
    officer_name = Column(String(100), nullable=False)
    officer_role = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=False)
    amount_approved = Column(Numeric(14, 2), nullable=True)

    request = relationship("WelfareRequest", back_populates="decisions")

class Disbursement(Base):
    __tablename__ = "disbursements"

    id = Column(String(50), primary_key=True, index=True)
    request_id = Column(String(50), ForeignKey("welfare_requests.id", ondelete="RESTRICT"), unique=True, index=True, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    payment_mode = Column(String(50), nullable=False)  # mpesa, bank_transfer, cheque
    reference_number = Column(String(100), unique=True, index=True, nullable=False)
    officer_name = Column(String(100), nullable=False)
    disbursed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(50), default="completed", nullable=False)

    request = relationship("WelfareRequest", back_populates="disbursement")

class FinancialLedgerEntry(Base):
    __tablename__ = "financial_ledger_entries"

    id = Column(String(50), primary_key=True, index=True)
    date = Column(Date, default=date.today, index=True, nullable=False)
    type = Column(String(50), index=True, nullable=False)  # income, expenditure
    category = Column(String(100), index=True, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    description = Column(Text, nullable=False)
    reference = Column(String(100), index=True, nullable=False)
    payment_mode = Column(String(50), nullable=False)
    
    linked_member_id = Column(String(50), nullable=True, index=True)
    linked_welfare_request_id = Column(String(50), nullable=True, index=True)
    linked_contribution_id = Column(String(50), nullable=True, index=True)
    
    recorded_by = Column(String(100), nullable=False)
    is_reconciled = Column(Boolean, default=False, index=True, nullable=False)
    reconciled_at = Column(DateTime, nullable=True)
    
    # Audit & Reversal tracking
    is_reversal = Column(Boolean, default=False, nullable=False)
    reversed_entry_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_ledger_date_type", "date", "type"),
    )

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    user_id = Column(String(50), index=True, nullable=False)
    user_name = Column(String(100), nullable=False)
    user_role = Column(String(50), nullable=False)
    action = Column(String(100), index=True, nullable=False)
    entity_type = Column(String(50), index=True, nullable=False)
    entity_id = Column(String(50), index=True, nullable=False)
    description = Column(Text, nullable=False)
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)

class OrganizationSettings(Base):
    __tablename__ = "organization_settings"

    id = Column(Integer, primary_key=True, default=1)
    org_name = Column(String(150), default="Solian Wolves Welfare Association", nullable=False)
    tagline = Column(String(255), default="Empowering Members Through Solidarity", nullable=False)
    registration_number = Column(String(100), default="WLF/2026/0892", nullable=False)
    currency = Column(String(10), default="KES", nullable=False)
    
    monthly_dues_amount = Column(Numeric(14, 2), default=Decimal("1500.00"), nullable=False)
    welfare_registration_fee = Column(Numeric(14, 2), default=Decimal("2000.00"), nullable=False)
    opening_reserve_balance = Column(Numeric(14, 2), default=Decimal("200000.00"), nullable=False)
    max_bereavement_benefit = Column(Numeric(14, 2), default=Decimal("50000.00"), nullable=False)
    max_medical_benefit = Column(Numeric(14, 2), default=Decimal("35000.00"), nullable=False)
    max_education_benefit = Column(Numeric(14, 2), default=Decimal("25000.00"), nullable=False)
    
    approval_quorum = Column(Integer, default=2, nullable=False)
    contact_email = Column(String(150), default="info@solianwolves.org", nullable=False)
    contact_phone = Column(String(50), default="+254 700 000 000", nullable=False)
    address = Column(Text, default="Nairobi, Kenya", nullable=False)
    is_demo_mode = Column(Boolean, default=True, nullable=False)

class Role(Base):
    __tablename__ = "roles"

    id = Column(String(50), primary_key=True)  # admin, finance_officer, welfare_officer, approver, member, auditor
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    role_id = Column(String(50), ForeignKey("roles.id", ondelete="CASCADE"), index=True, nullable=False)
    granted_by = Column(String(100), nullable=False)
    granted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="user_roles")
    role = relationship("Role")

    __table_args__ = (
        Index("idx_user_role_unique", "user_id", "role_id", unique=True),
    )

class AccountInvitation(Base):
    __tablename__ = "account_invitations"

    id = Column(String(50), primary_key=True, index=True)
    token = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(150), index=True, nullable=False)
    membership_number = Column(String(50), index=True, nullable=True)
    member_name = Column(String(150), nullable=True)
    role = Column(String(50), default="member", nullable=False)
    created_by = Column(String(100), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    session_token = Column(String(255), unique=True, index=True, nullable=False)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    last_activity = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="sessions")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token = Column(String(100), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

