from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, date
from ..models.schemas import (
    WelfareRequestCreate, WelfareStatusUpdate, WelfareDisburse, WelfareRequestResponse
)
from ..database.session import db

router = APIRouter(prefix="/welfare", tags=["Welfare & Assistance"])

@router.get("", response_model=List[WelfareRequestResponse])
def get_welfare_requests(
    search: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    urgency: Optional[str] = None,
    member_id: Optional[str] = None
):
    results = db.welfare_requests
    if member_id:
        results = [w for w in results if w["member_id"] == member_id]
    if search:
        s = search.lower()
        results = [
            w for w in results if
            s in w["member_name"].lower() or
            s in w["membership_number"].lower() or
            s in w["id"].lower() or
            s in w["description"].lower()
        ]
    if status and status != "all":
        results = [w for w in results if w["status"] == status]
    if category and category != "all":
        results = [w for w in results if w["category"] == category]
    if urgency and urgency != "all":
        results = [w for w in results if w.get("urgency") == urgency]
    return results

@router.get("/{req_id}", response_model=WelfareRequestResponse)
def get_welfare_request(req_id: str):
    for w in db.welfare_requests:
        if w["id"] == req_id:
            return w
    raise HTTPException(status_code=404, detail="Welfare request not found")

@router.post("", response_model=WelfareRequestResponse, status_code=201)
def create_welfare_request(data: WelfareRequestCreate):
    count = len(db.welfare_requests) + 1
    year = datetime.now().year
    req_id = f"WEL-{year}-{count:03d}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    new_req = {
        "id": req_id,
        "member_id": data.member_id,
        "member_name": data.member_name,
        "membership_number": data.membership_number,
        "category": data.category,
        "urgency": data.urgency,
        "amount_requested": data.amount_requested,
        "amount_approved": None,
        "description": data.description,
        "bank_or_mpesa_payout_details": data.bank_or_mpesa_payout_details,
        "status": "submitted",
        "submission_date": str(date.today()),
        "documents": [d.model_dump() for d in data.documents],
        "decisions": [
            {
                "id": f"DEC-{int(datetime.now().timestamp() * 1000)}",
                "status": "submitted",
                "officer_name": "System Intake",
                "officer_role": "system",
                "timestamp": now_str,
                "notes": "Application successfully submitted into review queue.",
                "amount_approved": None
            }
        ],
        "disbursement_id": None,
        "internal_notes": None
    }

    db.welfare_requests.insert(0, new_req)
    db.add_audit_log(
        user_name=data.member_name,
        user_role="member",
        action="SUBMIT_WELFARE_CLAIM",
        entity_type="welfare_request",
        entity_id=req_id,
        description=f"Submitted welfare claim of KES {data.amount_requested:,.2f} for {data.category.replace('_', ' ').title()}"
    )
    db.save()
    return new_req

@router.post("/{req_id}/status", response_model=WelfareRequestResponse)
def update_welfare_status(req_id: str, data: WelfareStatusUpdate):
    for idx, w in enumerate(db.welfare_requests):
        if w["id"] == req_id:
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
            prev_status = w["status"]

            w["status"] = data.status
            if data.amount_approved is not None:
                w["amount_approved"] = data.amount_approved

            decision = {
                "id": f"DEC-{int(datetime.now().timestamp() * 1000)}",
                "status": data.status,
                "officer_name": data.officer_name,
                "officer_role": data.officer_role,
                "timestamp": now_str,
                "notes": data.notes,
                "amount_approved": data.amount_approved
            }
            w["decisions"].append(decision)
            db.welfare_requests[idx] = w

            db.add_audit_log(
                user_name=data.officer_name,
                user_role=data.officer_role,
                action=f"WELFARE_{data.status.upper()}",
                entity_type="welfare_request",
                entity_id=req_id,
                description=f"Updated status to {data.status}. Notes: {data.notes}",
                prev_val=f"Status: {prev_status}",
                new_val=f"Status: {data.status}"
            )
            db.save()
            return w
    raise HTTPException(status_code=404, detail="Welfare request not found")

@router.post("/{req_id}/disburse", response_model=WelfareRequestResponse)
def disburse_welfare_request(req_id: str, data: WelfareDisburse):
    for idx, w in enumerate(db.welfare_requests):
        if w["id"] == req_id:
            if w["status"] not in ["approved", "disbursed"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot disburse claim in '{w['status']}' state. Claim must be 'approved' first."
                )

            disb_id = f"DISB-{int(datetime.now().timestamp() * 1000)}"
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
            payout_amount = w.get("amount_approved") or w.get("amount_requested")

            w["status"] = "disbursed"
            w["disbursement_id"] = disb_id

            w["decisions"].append({
                "id": f"DEC-{int(datetime.now().timestamp() * 1000)}",
                "status": "disbursed",
                "officer_name": data.officer_name,
                "officer_role": "finance_officer",
                "timestamp": now_str,
                "notes": f"Disbursed KES {payout_amount:,.2f} via {data.payment_mode.upper()} Ref: {data.reference_number}",
                "amount_approved": payout_amount
            })

            # Record in Finance Ledger
            txn_id = f"TXN-{int(datetime.now().timestamp() * 1000)}"
            db.transactions.insert(0, {
                "id": txn_id,
                "date": str(date.today()),
                "type": "expenditure",
                "category": f"Welfare Disbursement ({w['category'].replace('_', ' ').title()})",
                "amount": payout_amount,
                "description": f"Disbursement to {w['member_name']} for {w['id']} (Ref: {data.reference_number})",
                "reference": data.reference_number,
                "payment_mode": data.payment_mode,
                "linked_member_id": w["member_id"],
                "linked_welfare_request_id": w["id"],
                "recorded_by": data.officer_name,
                "is_reconciled": True,
                "reconciled_at": now_str
            })

            db.welfare_requests[idx] = w
            db.add_audit_log(
                user_name=data.officer_name,
                user_role="finance_officer",
                action="DISBURSE_WELFARE",
                entity_type="welfare_request",
                entity_id=req_id,
                description=f"Disbursed KES {payout_amount:,.2f} for claim {req_id} to {w['member_name']}",
                prev_val="Status: approved",
                new_val="Status: disbursed"
            )
            db.save()
            return w
    raise HTTPException(status_code=404, detail="Welfare request not found")
