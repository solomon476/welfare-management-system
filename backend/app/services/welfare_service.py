from sqlalchemy.orm import Session
from datetime import datetime, date
from decimal import Decimal
from fastapi import HTTPException
from typing import Optional

from ..models.orm import WelfareRequest, WelfareDecision, Disbursement, FinancialLedgerEntry, Member, OrganizationSettings
from ..schemas.welfare import WelfareRequestCreate, WelfareStatusUpdate, WelfareDisburse
from .audit_service import log_action
from .treasury_service import assert_sufficient_funds

def create_welfare_request(
    db: Session,
    data: WelfareRequestCreate,
    user_name: str,
    user_id: str
) -> WelfareRequest:
    member = db.query(Member).filter(Member.id == data.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    count = db.query(WelfareRequest).count() + 1
    year = datetime.utcnow().year
    req_id = f"WEL-{year}-{count:03d}"

    req = WelfareRequest(
        id=req_id,
        member_id=member.id,
        member_name=member.full_name,
        membership_number=member.membership_number,
        category=data.category,
        urgency=data.urgency,
        amount_requested=Decimal(str(data.amount_requested)),
        amount_approved=None,
        description=data.description,
        bank_or_mpesa_payout_details=data.bank_or_mpesa_payout_details,
        status="submitted",
        submission_date=date.today()
    )
    db.add(req)

    # Initial system intake decision
    decision = WelfareDecision(
        id=f"DEC-{int(datetime.utcnow().timestamp() * 1000)}",
        request_id=req_id,
        status="submitted",
        officer_name=user_name,
        officer_role="member",
        timestamp=datetime.utcnow(),
        notes="Claim application received and queued for review.",
        amount_approved=None
    )
    db.add(decision)

    log_action(
        db,
        user_id=user_id,
        user_name=user_name,
        user_role="member",
        action="SUBMIT_WELFARE_CLAIM",
        entity_type="welfare_request",
        entity_id=req_id,
        description=f"Submitted welfare claim of KES {req.amount_requested:,.2f} for {data.category.replace('_', ' ').title()}"
    )

    db.commit()
    db.refresh(req)
    return req

def update_welfare_status(
    db: Session,
    req_id: str,
    data: WelfareStatusUpdate,
    user_id: str
) -> WelfareRequest:
    req = db.query(WelfareRequest).filter(WelfareRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Welfare request not found")

    prev_status = req.status
    req.status = data.status
    if data.amount_approved is not None:
        req.amount_approved = Decimal(str(data.amount_approved))

    decision = WelfareDecision(
        id=f"DEC-{int(datetime.utcnow().timestamp() * 1000)}",
        request_id=req_id,
        status=data.status,
        officer_name=data.officer_name,
        officer_role=data.officer_role,
        timestamp=datetime.utcnow(),
        notes=data.notes,
        amount_approved=req.amount_approved
    )
    db.add(decision)

    log_action(
        db,
        user_id=user_id,
        user_name=data.officer_name,
        user_role=data.officer_role,
        action=f"WELFARE_{data.status.upper()}",
        entity_type="welfare_request",
        entity_id=req_id,
        description=f"Updated status to {data.status}. Notes: {data.notes}",
        prev_val=f"Status: {prev_status}",
        new_val=f"Status: {data.status}"
    )

    db.commit()
    db.refresh(req)
    return req

def disburse_welfare(
    db: Session,
    req_id: str,
    data: WelfareDisburse,
    user_id: str
) -> WelfareRequest:
    req = db.query(WelfareRequest).filter(WelfareRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Welfare request not found")

    if req.status not in ["approved", "disbursed"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot disburse claim in '{req.status}' state. Claim must be approved first."
        )

    payout_amount = req.amount_approved or req.amount_requested

    # Concurrency & Double-Spend Guard:
    # Verifies the treasury has sufficient verified cash on hand before proceeding
    try:
        assert_sufficient_funds(db, payout_amount)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    disb_id = f"DISB-{int(datetime.utcnow().timestamp() * 1000)}"

    # 1. Record Disbursement entity
    disbursement = Disbursement(
        id=disb_id,
        request_id=req.id,
        amount=payout_amount,
        payment_mode=data.payment_mode,
        reference_number=data.reference_number.strip().upper(),
        officer_name=data.officer_name,
        disbursed_at=datetime.utcnow(),
        status="completed"
    )
    db.add(disbursement)

    # 2. Post Expenditure in Financial Ledger
    txn_id = f"TXN-{int(datetime.utcnow().timestamp() * 1000)}"
    ledger_entry = FinancialLedgerEntry(
        id=txn_id,
        date=date.today(),
        type="expenditure",
        category=f"Welfare Disbursement ({req.category.replace('_', ' ').title()})",
        amount=payout_amount,
        description=f"Welfare payout to {req.member_name} for claim {req.id} (Ref: {data.reference_number})",
        reference=data.reference_number.strip().upper(),
        payment_mode=data.payment_mode,
        linked_member_id=req.member_id,
        linked_welfare_request_id=req.id,
        recorded_by=data.officer_name,
        is_reconciled=True,
        reconciled_at=datetime.utcnow()
    )
    db.add(ledger_entry)

    # 3. Update WelfareRequest record
    req.status = "disbursed"
    req.disbursement_id = disb_id

    decision = WelfareDecision(
        id=f"DEC-{int(datetime.utcnow().timestamp() * 1000)}",
        request_id=req_id,
        status="disbursed",
        officer_name=data.officer_name,
        officer_role="finance_officer",
        timestamp=datetime.utcnow(),
        notes=f"Disbursed KES {payout_amount:,.2f} via {data.payment_mode.upper()} Ref: {data.reference_number}",
        amount_approved=payout_amount
    )
    db.add(decision)

    log_action(
        db,
        user_id=user_id,
        user_name=data.officer_name,
        user_role="finance_officer",
        action="DISBURSE_WELFARE",
        entity_type="welfare_request",
        entity_id=req_id,
        description=f"Disbursed KES {payout_amount:,.2f} for claim {req_id} to {req.member_name} (Ref: {data.reference_number})",
        prev_val="Status: approved",
        new_val="Status: disbursed"
    )

    db.commit()
    db.refresh(req)
    return req
