from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from ...db.session import get_db
from ...models.orm import Disbursement, WelfareRequest
from ...schemas.welfare import WelfareDisburse, WelfareRequestResponse
from ...services.welfare_service import disburse_welfare

router = APIRouter(prefix="/disbursements", tags=["Disbursements & Payouts"])

@router.post("/{req_id}", response_model=WelfareRequestResponse)
def execute_disbursement(req_id: str, data: WelfareDisburse, db: Session = Depends(get_db)):
    """
    Executes financial disbursement for an approved claim.
    Validates treasury balance sufficiency and posts transaction to the financial ledger.
    """
    return disburse_welfare(db, req_id, data, user_id="USR-003")

@router.get("")
def list_disbursements(db: Session = Depends(get_db)):
    disbursements = db.query(Disbursement).order_by(Disbursement.disbursed_at.desc()).all()
    return [
        {
            "id": d.id,
            "request_id": d.request_id,
            "amount": d.amount,
            "payment_mode": d.payment_mode,
            "reference_number": d.reference_number,
            "officer_name": d.officer_name,
            "disbursed_at": d.disbursed_at,
            "status": d.status
        }
        for d in disbursements
    ]
