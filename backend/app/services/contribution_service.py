from sqlalchemy.orm import Session
from datetime import datetime, date
from decimal import Decimal
from fastapi import HTTPException
from typing import Optional

from ..models.orm import Contribution, Member, FinancialLedgerEntry
from ..schemas.contribution import ContributionCreate, ContributionVerify, ContributionReverse
from .audit_service import log_action

def record_contribution(
    db: Session,
    data: ContributionCreate,
    user_name: str = "Welfare Officer",
    user_id: str = "USR-002"
) -> Contribution:
    # 1. Enforce unique reference check to prevent duplicate payment processing
    clean_ref = data.reference_number.strip().upper()
    existing = db.query(Contribution).filter(
        Contribution.reference_number == clean_ref,
        Contribution.status != "reversed"
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Duplicate payment reference: '{clean_ref}' already recorded for {existing.member_name} on {existing.payment_date}"
        )

    # 2. Check member exists
    member = db.query(Member).filter(Member.id == data.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    count = db.query(Contribution).count() + 1
    year = datetime.utcnow().year
    receipt_id = f"REC-{year}-{count:03d}"

    contrib = Contribution(
        id=receipt_id,
        member_id=member.id,
        member_name=member.full_name,
        membership_number=member.membership_number,
        amount=Decimal(str(data.amount)),
        payment_date=data.payment_date,
        category=data.category,
        payment_method=data.payment_method,
        reference_number=clean_ref,
        idempotency_key=data.idempotency_key,
        status="recorded",  # strictly recorded until finance verification
        notes=data.notes,
        recorded_by=data.recorded_by or user_name,
        recorded_at=datetime.utcnow()
    )
    db.add(contrib)

    # 3. Tamper-evident audit log
    log_action(
        db,
        user_id=user_id,
        user_name=contrib.recorded_by,
        user_role="welfare_officer",
        action="RECORD_CONTRIBUTION",
        entity_type="contribution",
        entity_id=receipt_id,
        description=f"Recorded external payment of KES {contrib.amount:,.2f} from {member.full_name} (Ref: {clean_ref})"
    )

    db.commit()
    db.refresh(contrib)
    return contrib

def verify_contribution(
    db: Session,
    contrib_id: str,
    data: ContributionVerify,
    user_id: str = "USR-003"
) -> Contribution:
    contrib = db.query(Contribution).filter(Contribution.id == contrib_id).first()
    if not contrib:
        raise HTTPException(status_code=404, detail="Contribution record not found")

    if contrib.status == "reversed":
        raise HTTPException(status_code=400, detail="Cannot verify a reversed transaction")

    if contrib.status == "verified":
        return contrib

    contrib.status = "verified"
    contrib.verified_by = data.verified_by
    contrib.verified_at = datetime.utcnow()

    # Create posted income entry in the financial ledger
    txn_id = f"TXN-{int(datetime.utcnow().timestamp() * 1000)}"
    ledger_entry = FinancialLedgerEntry(
        id=txn_id,
        date=date.today(),
        type="income",
        category=f"Contribution ({contrib.category.replace('_', ' ').title()})",
        amount=contrib.amount,
        description=f"Verified contribution receipt {contrib.id} from {contrib.member_name} (Ref: {contrib.reference_number})",
        reference=contrib.reference_number,
        payment_mode=contrib.payment_method,
        linked_member_id=contrib.member_id,
        linked_contribution_id=contrib.id,
        recorded_by=data.verified_by,
        is_reconciled=True,
        reconciled_at=datetime.utcnow()
    )
    db.add(ledger_entry)

    log_action(
        db,
        user_id=user_id,
        user_name=data.verified_by,
        user_role="finance_officer",
        action="VERIFY_CONTRIBUTION",
        entity_type="contribution",
        entity_id=contrib_id,
        description=f"Verified contribution {contrib_id} of KES {contrib.amount:,.2f}",
        prev_val="Status: recorded",
        new_val="Status: verified"
    )

    db.commit()
    db.refresh(contrib)
    return contrib

def reverse_contribution(
    db: Session,
    contrib_id: str,
    data: ContributionReverse,
    user_name: str = "Finance Officer",
    user_id: str = "USR-003"
) -> Contribution:
    if not data.reason or len(data.reason.strip()) < 5:
        raise HTTPException(status_code=400, detail="A mandatory explanation of at least 5 characters is required to reverse a transaction")

    contrib = db.query(Contribution).filter(Contribution.id == contrib_id).first()
    if not contrib:
        raise HTTPException(status_code=404, detail="Contribution record not found")

    if contrib.status == "reversed":
        raise HTTPException(status_code=400, detail="Transaction is already reversed")

    prev_status = contrib.status
    contrib.status = "reversed"
    contrib.reversal_reason = data.reason.strip()

    # If it was verified, create a compensating reversing transaction in the financial ledger
    if prev_status == "verified":
        txn_id = f"TXN-REV-{int(datetime.utcnow().timestamp() * 1000)}"
        reversal_entry = FinancialLedgerEntry(
            id=txn_id,
            date=date.today(),
            type="expenditure",
            category="Reversal Adjustment",
            amount=contrib.amount,
            description=f"Compensating reversal of {contrib.id} ({contrib.reference_number}): {data.reason.strip()}",
            reference=f"REV-{contrib.reference_number}",
            payment_mode=contrib.payment_method,
            linked_member_id=contrib.member_id,
            linked_contribution_id=contrib.id,
            recorded_by=user_name,
            is_reconciled=True,
            reconciled_at=datetime.utcnow(),
            is_reversal=True,
            reversed_entry_id=contrib.id
        )
        db.add(reversal_entry)

    log_action(
        db,
        user_id=user_id,
        user_name=user_name,
        user_role="finance_officer",
        action="REVERSE_CONTRIBUTION",
        entity_type="contribution",
        entity_id=contrib_id,
        description=f"Reversed contribution {contrib_id}. Reason: {data.reason.strip()}",
        prev_val=f"Status: {prev_status}",
        new_val="Status: reversed"
    )

    db.commit()
    db.refresh(contrib)
    return contrib
