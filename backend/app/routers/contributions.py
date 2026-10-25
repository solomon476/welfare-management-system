from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, date
from ..models.schemas import (
    ContributionCreate, ContributionVerify, ContributionReverse, ContributionResponse
)
from ..database.session import db

router = APIRouter(prefix="/contributions", tags=["Contributions Ledger"])

@router.get("", response_model=List[ContributionResponse])
def get_contributions(
    search: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    member_id: Optional[str] = None
):
    results = db.contributions
    if member_id:
        results = [c for c in results if c["member_id"] == member_id]
    if search:
        s = search.lower()
        results = [
            c for c in results if
            s in c["member_name"].lower() or
            s in c["membership_number"].lower() or
            s in c["reference_number"].lower() or
            s in c["id"].lower()
        ]
    if status and status != "all":
        results = [c for c in results if c["status"] == status]
    if category and category != "all":
        results = [c for c in results if c["category"] == category]
    return results

@router.get("/{contrib_id}", response_model=ContributionResponse)
def get_contribution(contrib_id: str):
    for c in db.contributions:
        if c["id"] == contrib_id:
            return c
    raise HTTPException(status_code=404, detail="Contribution record not found")

@router.post("", response_model=ContributionResponse, status_code=201)
def record_contribution(data: ContributionCreate):
    # Check duplicate reference number
    ref = data.reference_number.strip().upper()
    for c in db.contributions:
        if c["reference_number"].strip().upper() == ref and c["status"] != "reversed":
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate payment reference: '{ref}' already recorded for {c['member_name']} on {c['payment_date']}"
            )

    count = len(db.contributions) + 1
    year = datetime.now().year
    receipt_id = f"REC-{year}-{count:03d}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    new_contrib = {
        "id": receipt_id,
        "member_id": data.member_id,
        "member_name": data.member_name,
        "membership_number": data.membership_number,
        "amount": data.amount,
        "payment_date": str(data.payment_date),
        "category": data.category,
        "payment_method": data.payment_method,
        "reference_number": ref,
        "notes": data.notes,
        "status": "recorded",
        "recorded_by": data.recorded_by or "Welfare Officer",
        "recorded_at": now_str,
        "verified_by": None,
        "verified_at": None,
        "reversal_reason": None
    }

    db.contributions.insert(0, new_contrib)
    db.add_audit_log(
        user_name=new_contrib["recorded_by"],
        user_role="welfare_officer",
        action="RECORD_PAYMENT",
        entity_type="contribution",
        entity_id=receipt_id,
        description=f"Recorded external payment of KES {data.amount:,.2f} from {data.member_name} (Ref: {ref})"
    )
    db.save()
    return new_contrib

@router.post("/{contrib_id}/verify", response_model=ContributionResponse)
def verify_contribution(contrib_id: str, data: ContributionVerify):
    for idx, c in enumerate(db.contributions):
        if c["id"] == contrib_id:
            if c["status"] == "reversed":
                raise HTTPException(status_code=400, detail="Cannot verify a reversed transaction")
            if c["status"] == "verified":
                return c

            now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
            c["status"] = "verified"
            c["verified_by"] = data.verified_by
            c["verified_at"] = now_str
            db.contributions[idx] = c

            # Also create or ensure entry in financial transactions ledger
            txn_id = f"TXN-{int(datetime.now().timestamp() * 1000)}"
            db.transactions.insert(0, {
                "id": txn_id,
                "date": str(date.today()),
                "type": "income",
                "category": f"Contribution ({c['category'].replace('_', ' ').title()})",
                "amount": c["amount"],
                "description": f"Verified contribution {c['id']} from {c['member_name']} (Ref: {c['reference_number']})",
                "reference": c["reference_number"],
                "payment_mode": c["payment_method"],
                "linked_member_id": c["member_id"],
                "linked_welfare_request_id": None,
                "recorded_by": data.verified_by,
                "is_reconciled": True,
                "reconciled_at": now_str
            })

            db.add_audit_log(
                user_name=data.verified_by,
                user_role="finance_officer",
                action="VERIFY_PAYMENT",
                entity_type="contribution",
                entity_id=contrib_id,
                description=f"Verified contribution receipt {contrib_id} of KES {c['amount']:,.2f}",
                prev_val="Status: recorded",
                new_val="Status: verified"
            )
            db.save()
            return c
    raise HTTPException(status_code=404, detail="Contribution record not found")

@router.post("/{contrib_id}/reverse", response_model=ContributionResponse)
def reverse_contribution(contrib_id: str, data: ContributionReverse):
    if not data.reason or len(data.reason.strip()) < 5:
        raise HTTPException(status_code=400, detail="A mandatory, clear reason of at least 5 characters is required to reverse a transaction")

    for idx, c in enumerate(db.contributions):
        if c["id"] == contrib_id:
            if c["status"] == "reversed":
                raise HTTPException(status_code=400, detail="Transaction is already reversed")

            prev_status = c["status"]
            c["status"] = "reversed"
            c["reversal_reason"] = data.reason.strip()
            db.contributions[idx] = c

            # If it was verified, create a compensating reversing transaction in finance ledger
            if prev_status == "verified":
                txn_id = f"TXN-REV-{int(datetime.now().timestamp() * 1000)}"
                db.transactions.insert(0, {
                    "id": txn_id,
                    "date": str(date.today()),
                    "type": "expenditure",
                    "category": "Reversal Adjustment",
                    "amount": c["amount"],
                    "description": f"Compensating reversal of {c['id']} ({c['reference_number']}): {data.reason.strip()}",
                    "reference": f"REV-{c['reference_number']}",
                    "payment_mode": c["payment_method"],
                    "linked_member_id": c["member_id"],
                    "linked_welfare_request_id": None,
                    "recorded_by": "Finance Officer",
                    "is_reconciled": True,
                    "reconciled_at": datetime.now().strftime("%Y-%m-%d %H:%M")
                })

            db.add_audit_log(
                user_name="Finance Officer",
                user_role="finance_officer",
                action="REVERSE_PAYMENT",
                entity_type="contribution",
                entity_id=contrib_id,
                description=f"Reversed contribution {contrib_id}. Reason: {data.reason.strip()}",
                prev_val=f"Status: {prev_status}",
                new_val="Status: reversed"
            )
            db.save()
            return c
    raise HTTPException(status_code=404, detail="Contribution record not found")
