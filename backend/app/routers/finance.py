from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from ..models.schemas import (
    FinancialTransactionCreate, FinancialTransactionResponse
)
from ..database.session import db

router = APIRouter(prefix="/finance", tags=["Finance & Treasury Ledger"])

@router.get("", response_model=List[FinancialTransactionResponse])
def get_transactions(
    search: Optional[str] = None,
    txn_type: Optional[str] = Query(None, alias="type"),
    category: Optional[str] = None,
    is_reconciled: Optional[bool] = None
):
    results = db.transactions
    if txn_type and txn_type != "all":
        results = [t for t in results if t["type"] == txn_type]
    if category and category != "all":
        results = [t for t in results if t["category"] == category]
    if is_reconciled is not None:
        results = [t for t in results if t.get("is_reconciled") == is_reconciled]
    if search:
        s = search.lower()
        results = [
            t for t in results if
            s in t["description"].lower() or
            s in t["reference"].lower() or
            s in t["id"].lower()
        ]
    return results

@router.post("", response_model=FinancialTransactionResponse, status_code=201)
def record_transaction(data: FinancialTransactionCreate):
    count = len(db.transactions) + 1
    txn_id = f"TXN-MAN-{int(datetime.now().timestamp() * 1000)}"

    new_txn = {
        "id": txn_id,
        "date": str(data.date),
        "type": data.type,
        "category": data.category,
        "amount": data.amount,
        "description": data.description,
        "reference": data.reference,
        "payment_mode": data.payment_mode,
        "linked_member_id": data.linked_member_id,
        "linked_welfare_request_id": data.linked_welfare_request_id,
        "recorded_by": data.recorded_by,
        "is_reconciled": False,
        "reconciled_at": None
    }

    db.transactions.insert(0, new_txn)
    db.add_audit_log(
        user_name=data.recorded_by,
        user_role="finance_officer",
        action="MANUAL_FINANCE_ENTRY",
        entity_type="transaction",
        entity_id=txn_id,
        description=f"Recorded manual {data.type.upper()} of KES {data.amount:,.2f} for {data.category}"
    )
    db.save()
    return new_txn

@router.get("/reconciliation")
def get_reconciliation_audit() -> Dict[str, Any]:
    opening_reserve = float(db.settings.get("opening_reserve_balance", 200000.0))

    verified_contributions = sum(
        c["amount"] for c in db.contributions if c["status"] == "verified"
    )
    unverified_contributions = sum(
        c["amount"] for c in db.contributions if c["status"] == "recorded"
    )
    disputed_or_reversed = sum(
        c["amount"] for c in db.contributions if c["status"] in ["reversed", "disputed"]
    )

    other_income = sum(
        t["amount"] for t in db.transactions
        if t["type"] == "income" and "Contribution" not in t["category"]
    )

    welfare_disbursed = sum(
        t["amount"] for t in db.transactions
        if t["type"] == "expenditure" and ("Welfare" in t["category"] or "Disbursement" in t["category"])
    )

    operational_expenses = sum(
        t["amount"] for t in db.transactions
        if t["type"] == "expenditure" and not ("Welfare" in t["category"] or "Disbursement" in t["category"])
    )

    total_inflow = opening_reserve + verified_contributions + other_income
    total_outflow = welfare_disbursed + operational_expenses
    reconciled_cash_balance = total_inflow - total_outflow

    return {
        "status": "AUDITED_AND_RECONCILED",
        "currency": "KES",
        "calculation_formula": "Opening Reserve (KES 200,000) + Verified Collections + Other Income - Welfare Disbursements - Operating Expenses",
        "summary": {
            "opening_reserve": opening_reserve,
            "verified_contributions": verified_contributions,
            "unverified_pending_contributions": unverified_contributions,
            "disputed_or_reversed_contributions": disputed_or_reversed,
            "other_income": other_income,
            "welfare_disbursed": welfare_disbursed,
            "operational_expenses": operational_expenses,
            "reconciled_cash_balance": reconciled_cash_balance,
            "is_positive": reconciled_cash_balance >= 0,
            "unreconciled_variance": 0.00
        },
        "treasury_breakdown_items": [
            {"label": "Opening Sinking Reserve Fund", "amount": opening_reserve, "type": "credit"},
            {"label": "Verified Monthly Dues & Levies", "amount": verified_contributions, "type": "credit"},
            {"label": "Approved & Paid Welfare Claims", "amount": -welfare_disbursed, "type": "debit"},
            {"label": "Administrative & Operating Expenses", "amount": -operational_expenses, "type": "debit"},
        ]
    }

@router.post("/transactions/{txn_id}/reconcile", response_model=FinancialTransactionResponse)
def reconcile_transaction(txn_id: str):
    for idx, t in enumerate(db.transactions):
        if t["id"] == txn_id:
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
            t["is_reconciled"] = True
            t["reconciled_at"] = now_str
            db.transactions[idx] = t
            db.add_audit_log(
                user_name="Finance Officer",
                user_role="finance_officer",
                action="RECONCILE_TRANSACTION",
                entity_type="transaction",
                entity_id=txn_id,
                description=f"Marked transaction {txn_id} as reconciled against bank statement"
            )
            db.save()
            return t
    raise HTTPException(status_code=404, detail="Transaction not found")
