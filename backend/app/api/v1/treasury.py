from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import datetime
from decimal import Decimal

from ...db.session import get_db
from ...models.orm import FinancialLedgerEntry, User
from ...core.dependencies import require_roles, require_admin_portal
from ...schemas.treasury import (
    FinancialLedgerEntryCreate, FinancialLedgerEntryResponse,
    TreasuryReconciliationAuditResponse
)
from ...schemas.common import PaginatedResponse
from ...services.treasury_service import get_reconciliation
from ...services.audit_service import log_action

router = APIRouter(prefix="/treasury", tags=["Treasury & Financial Ledger"])

@router.get("/reconciliation", response_model=TreasuryReconciliationAuditResponse)
def get_treasury_reconciliation(
    current_user: Optional[User] = Depends(require_admin_portal()),
    db: Session = Depends(get_db)
):
    """
    Returns verified, reconciled treasury balance strictly calculated from posted ledger entries.
    Flags unexpected negative balances for executive audit review.
    """
    return get_reconciliation(db)

@router.get("/ledger", response_model=PaginatedResponse[FinancialLedgerEntryResponse])
def get_ledger_entries(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    txn_type: Optional[str] = Query(None, alias="type"),
    category: Optional[str] = None,
    is_reconciled: Optional[bool] = None,
    current_user: Optional[User] = Depends(require_admin_portal()),
    db: Session = Depends(get_db)
):
    query = db.query(FinancialLedgerEntry)

    if txn_type and txn_type != "all":
        query = query.filter(FinancialLedgerEntry.type == txn_type)

    if category and category != "all":
        query = query.filter(FinancialLedgerEntry.category == category)

    if is_reconciled is not None:
        query = query.filter(FinancialLedgerEntry.is_reconciled == is_reconciled)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                FinancialLedgerEntry.description.ilike(s),
                FinancialLedgerEntry.reference.ilike(s),
                FinancialLedgerEntry.id.ilike(s)
            )
        )

    total = query.count()
    items = query.order_by(FinancialLedgerEntry.date.desc(), FinancialLedgerEntry.created_at.desc())\
        .offset(skip).limit(limit).all()

    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + limit) < total
    )

@router.post("/ledger", response_model=FinancialLedgerEntryResponse, status_code=201)
def record_manual_transaction(
    data: FinancialLedgerEntryCreate,
    current_user: Optional[User] = Depends(require_roles("finance_officer", "admin")),
    db: Session = Depends(get_db)
):
    txn_id = f"TXN-MAN-{int(datetime.utcnow().timestamp() * 1000)}"

    entry = FinancialLedgerEntry(
        id=txn_id,
        date=data.date,
        type=data.type,
        category=data.category,
        amount=Decimal(str(data.amount)),
        description=data.description,
        reference=data.reference.strip().upper(),
        payment_mode=data.payment_mode,
        linked_member_id=data.linked_member_id,
        linked_welfare_request_id=data.linked_welfare_request_id,
        recorded_by=data.recorded_by,
        is_reconciled=False
    )
    db.add(entry)

    user_id = current_user.id if current_user else "USR-003"
    user_name = current_user.name if current_user else data.recorded_by
    user_role = current_user.role if current_user else "finance_officer"

    log_action(
        db,
        user_id=user_id,
        user_name=user_name,
        user_role=user_role,
        action="RECORD_MANUAL_TXN",
        entity_type="transaction",
        entity_id=txn_id,
        description=f"Recorded manual {data.type} of KES {entry.amount:,.2f} for {data.category}"
    )

    db.commit()
    db.refresh(entry)
    return entry

@router.post("/ledger/{txn_id}/reconcile", response_model=FinancialLedgerEntryResponse)
def reconcile_ledger_entry(
    txn_id: str,
    current_user: Optional[User] = Depends(require_roles("finance_officer", "admin")),
    db: Session = Depends(get_db)
):
    entry = db.query(FinancialLedgerEntry).filter(FinancialLedgerEntry.id == txn_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Transaction not found")

    entry.is_reconciled = True
    entry.reconciled_at = datetime.utcnow()

    user_id = current_user.id if current_user else "USR-003"
    user_name = current_user.name if current_user else "Finance Officer"
    user_role = current_user.role if current_user else "finance_officer"

    log_action(
        db,
        user_id=user_id,
        user_name=user_name,
        user_role=user_role,
        action="RECONCILE_TXN",
        entity_type="transaction",
        entity_id=txn_id,
        description=f"Reconciled transaction {txn_id} against bank statement"
    )

    db.commit()
    db.refresh(entry)
    return entry
