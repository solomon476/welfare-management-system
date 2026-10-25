from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, date
from decimal import Decimal
from fastapi import HTTPException
from typing import Optional, List, Dict

from ..models.orm import Contribution, Member, FinancialLedgerEntry
from ..schemas.contribution import (
    ContributionCreate, ContributionVerify, ContributionReverse,
    BatchContributionImportRequest, BatchContributionImportResponse
)
from .audit_service import log_action
from .cache_service import cache

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
    cache.invalidate_prefix("treasury:")
    cache.invalidate_prefix("reports:")
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
    cache.invalidate_prefix("treasury:")
    cache.invalidate_prefix("reports:")
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
    cache.invalidate_prefix("treasury:")
    cache.invalidate_prefix("reports:")
    return contrib

def bulk_import_contributions(
    db: Session,
    data: BatchContributionImportRequest,
    user_id: str = "USR-003"
) -> BatchContributionImportResponse:
    """
    High-volume batch importer designed for 50,000–100,000 members.
    Processes M-Pesa Paybill / Bank statement batches of up to 5,000 records.
    Filters existing duplicates in a single indexed query.
    """
    if not data.items:
        raise HTTPException(status_code=400, detail="No contribution items provided in batch")

    # 1. Fetch all reference numbers to detect existing duplicates in 1 query
    raw_refs = [item.reference_number.strip().upper() for item in data.items]
    existing_records = db.query(Contribution.reference_number).filter(
        Contribution.reference_number.in_(raw_refs)
    ).all()
    existing_ref_set = {r[0] for r in existing_records}

    # 2. Extract member identifiers and resolve in 1 query
    identifiers = list({item.member_identifier.strip() for item in data.items})
    members = db.query(Member).filter(
        or_(
            Member.national_id.in_(identifiers),
            Member.phone.in_(identifiers),
            Member.membership_number.in_(identifiers),
            Member.id.in_(identifiers)
        )
    ).all()

    # Build multi-key index lookup
    member_lookup: Dict[str, Member] = {}
    for m in members:
        member_lookup[m.id] = m
        member_lookup[m.membership_number] = m
        member_lookup[m.national_id] = m
        member_lookup[m.phone] = m
        # Also index phone without spaces
        member_lookup[m.phone.replace(" ", "")] = m

    successfully_imported = 0
    duplicates_skipped = 0
    unmatched_identifiers = []
    total_amount_recorded = Decimal("0.00")
    
    seen_in_batch = set()
    current_count = db.query(Contribution).count()
    year = datetime.utcnow().year

    new_contributions = []
    new_ledger_entries = []

    for item in data.items:
        clean_ref = item.reference_number.strip().upper()
        
        # Check duplicate against DB or earlier item in current batch
        if clean_ref in existing_ref_set or clean_ref in seen_in_batch:
            duplicates_skipped += 1
            continue

        # Match member
        clean_id = item.member_identifier.strip()
        matched_member = member_lookup.get(clean_id) or member_lookup.get(clean_id.replace(" ", ""))
        if not matched_member:
            unmatched_identifiers.append(clean_id)
            continue

        seen_in_batch.add(clean_ref)
        current_count += 1
        receipt_id = f"REC-{year}-{current_count:05d}"
        amount_dec = Decimal(str(item.amount))

        contrib_status = "verified" if data.auto_verify else "recorded"

        contrib = Contribution(
            id=receipt_id,
            member_id=matched_member.id,
            member_name=matched_member.full_name,
            membership_number=matched_member.membership_number,
            amount=amount_dec,
            payment_date=item.payment_date,
            category=item.category,
            payment_method=item.payment_method,
            reference_number=clean_ref,
            status=contrib_status,
            notes=f"Batch import: {data.batch_reference}. {item.notes or ''}".strip(),
            recorded_by=data.recorded_by,
            recorded_at=datetime.utcnow(),
            verified_by=data.recorded_by if data.auto_verify else None,
            verified_at=datetime.utcnow() if data.auto_verify else None
        )
        new_contributions.append(contrib)

        if data.auto_verify:
            txn_id = f"TXN-BAT-{int(datetime.utcnow().timestamp() * 1000)}-{successfully_imported}"
            ledger_entry = FinancialLedgerEntry(
                id=txn_id,
                date=item.payment_date,
                type="income",
                category=f"Contribution ({item.category.replace('_', ' ').title()})",
                amount=amount_dec,
                description=f"Batch verified {receipt_id} from {matched_member.full_name} (Ref: {clean_ref})",
                reference=clean_ref,
                payment_mode=item.payment_method,
                linked_member_id=matched_member.id,
                linked_contribution_id=receipt_id,
                recorded_by=data.recorded_by,
                is_reconciled=True,
                reconciled_at=datetime.utcnow()
            )
            new_ledger_entries.append(ledger_entry)

        successfully_imported += 1
        total_amount_recorded += amount_dec

    # Bulk insert into database
    if new_contributions:
        db.add_all(new_contributions)
    if new_ledger_entries:
        db.add_all(new_ledger_entries)

    log_action(
        db,
        user_id=user_id,
        user_name=data.recorded_by,
        user_role="finance_officer",
        action="BATCH_IMPORT_CONTRIBUTIONS",
        entity_type="batch_import",
        entity_id=data.batch_reference,
        description=f"Batch imported {successfully_imported} contributions totaling KES {total_amount_recorded:,.2f} (Skipped {duplicates_skipped} duplicates)"
    )

    db.commit()
    cache.invalidate_prefix("treasury:")
    cache.invalidate_prefix("reports:")

    return BatchContributionImportResponse(
        batch_reference=data.batch_reference,
        total_submitted=len(data.items),
        successfully_imported=successfully_imported,
        duplicates_skipped=duplicates_skipped,
        unmatched_identifiers=unmatched_identifiers,
        total_amount_recorded=total_amount_recorded,
        status="COMPLETED"
    )
