from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from ...db.session import get_db
from ...models.orm import Disbursement, WelfareRequest, User
from ...core.dependencies import require_roles, require_admin_portal
from ...schemas.welfare import WelfareDisburse, WelfareRequestResponse
from ...services.welfare_service import disburse_welfare

router = APIRouter(prefix="/disbursements", tags=["Disbursements & Payouts"])

@router.post("/{req_id}", response_model=WelfareRequestResponse)
def execute_disbursement(
    req_id: str,
    data: WelfareDisburse,
    current_user: Optional[User] = Depends(require_roles("finance_officer", "admin")),
    db: Session = Depends(get_db)
):
    """
    Executes financial disbursement for an approved claim.
    Validates treasury balance sufficiency and posts transaction to the financial ledger.
    """
    user_id = current_user.id if current_user else "USR-003"
    if current_user and not data.officer_name:
        data.officer_name = current_user.name
    return disburse_welfare(db, req_id, data, user_id=user_id)

@router.get("")
def list_disbursements(
    current_user: Optional[User] = Depends(require_admin_portal()),
    db: Session = Depends(get_db)
):
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
