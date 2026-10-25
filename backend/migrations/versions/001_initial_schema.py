"""Initial schema with decimal fixed precision, indexes, and audit tables

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-26 02:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Organization Settings
    op.create_table(
        'organization_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('org_name', sa.String(length=150), nullable=False),
        sa.Column('tagline', sa.String(length=255), nullable=False),
        sa.Column('registration_number', sa.String(length=100), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=False),
        sa.Column('monthly_dues_amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('welfare_registration_fee', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('opening_reserve_balance', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('max_bereavement_benefit', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('max_medical_benefit', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('max_education_benefit', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('approval_quorum', sa.Integer(), nullable=False),
        sa.Column('contact_email', sa.String(length=150), nullable=False),
        sa.Column('contact_phone', sa.String(length=50), nullable=False),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('is_demo_mode', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Members
    op.create_table(
        'members',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('membership_number', sa.String(length=50), nullable=False),
        sa.Column('full_name', sa.String(length=150), nullable=False),
        sa.Column('national_id', sa.String(length=50), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=150), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('date_joined', sa.Date(), nullable=False),
        sa.Column('monthly_commitment', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('next_of_kin_name', sa.String(length=150), nullable=False),
        sa.Column('next_of_kin_relationship', sa.String(length=50), nullable=False),
        sa.Column('next_of_kin_phone', sa.String(length=50), nullable=False),
        sa.Column('next_of_kin_email', sa.String(length=150), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('avatar_url', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('membership_number'),
        sa.UniqueConstraint('national_id'),
        sa.UniqueConstraint('phone')
    )
    op.create_index('idx_member_search', 'members', ['full_name', 'national_id', 'phone'])

    # 3. Users
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=150), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('avatar', sa.String(length=255), nullable=True),
        sa.Column('linked_member_id', sa.String(length=50), nullable=True),
        sa.Column('department', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['linked_member_id'], ['members.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # 4. Contributions
    op.create_table(
        'contributions',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('member_id', sa.String(length=50), nullable=False),
        sa.Column('member_name', sa.String(length=150), nullable=False),
        sa.Column('membership_number', sa.String(length=50), nullable=False),
        sa.Column('amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('payment_date', sa.Date(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=False),
        sa.Column('reference_number', sa.String(length=100), nullable=False),
        sa.Column('idempotency_key', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('recorded_by', sa.String(length=100), nullable=False),
        sa.Column('recorded_at', sa.DateTime(), nullable=False),
        sa.Column('verified_by', sa.String(length=100), nullable=True),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('reversal_reason', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['member_id'], ['members.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('reference_number'),
        sa.UniqueConstraint('idempotency_key')
    )
    op.create_index('idx_contrib_date_status', 'contributions', ['payment_date', 'status'])

    # 5. Welfare Requests
    op.create_table(
        'welfare_requests',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('member_id', sa.String(length=50), nullable=False),
        sa.Column('member_name', sa.String(length=150), nullable=False),
        sa.Column('membership_number', sa.String(length=50), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('urgency', sa.String(length=50), nullable=False),
        sa.Column('amount_requested', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('amount_approved', sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('bank_or_mpesa_payout_details', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('submission_date', sa.Date(), nullable=False),
        sa.Column('disbursement_id', sa.String(length=50), nullable=True),
        sa.Column('internal_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['member_id'], ['members.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('disbursement_id')
    )

    # 6. Welfare Decisions
    op.create_table(
        'welfare_decisions',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('request_id', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('officer_name', sa.String(length=100), nullable=False),
        sa.Column('officer_role', sa.String(length=50), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=False),
        sa.Column('amount_approved', sa.Numeric(precision=14, scale=2), nullable=True),
        sa.ForeignKeyConstraint(['request_id'], ['welfare_requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 7. Disbursements
    op.create_table(
        'disbursements',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('request_id', sa.String(length=50), nullable=False),
        sa.Column('amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('payment_mode', sa.String(length=50), nullable=False),
        sa.Column('reference_number', sa.String(length=100), nullable=False),
        sa.Column('officer_name', sa.String(length=100), nullable=False),
        sa.Column('disbursed_at', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(['request_id'], ['welfare_requests.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('reference_number'),
        sa.UniqueConstraint('request_id')
    )

    # 8. Financial Ledger Entries
    op.create_table(
        'financial_ledger_entries',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('reference', sa.String(length=100), nullable=False),
        sa.Column('payment_mode', sa.String(length=50), nullable=False),
        sa.Column('linked_member_id', sa.String(length=50), nullable=True),
        sa.Column('linked_welfare_request_id', sa.String(length=50), nullable=True),
        sa.Column('linked_contribution_id', sa.String(length=50), nullable=True),
        sa.Column('recorded_by', sa.String(length=100), nullable=False),
        sa.Column('is_reconciled', sa.Boolean(), nullable=False),
        sa.Column('reconciled_at', sa.DateTime(), nullable=True),
        sa.Column('is_reversal', sa.Boolean(), nullable=False),
        sa.Column('reversed_entry_id', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_ledger_date_type', 'financial_ledger_entries', ['date', 'type'])

    # 9. Audit Logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('user_id', sa.String(length=50), nullable=False),
        sa.Column('user_name', sa.String(length=100), nullable=False),
        sa.Column('user_role', sa.String(length=50), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('previous_value', sa.Text(), nullable=True),
        sa.Column('new_value', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('financial_ledger_entries')
    op.drop_table('disbursements')
    op.drop_table('welfare_decisions')
    op.drop_table('welfare_requests')
    op.drop_table('contributions')
    op.drop_table('users')
    op.drop_table('members')
    op.drop_table('organization_settings')
