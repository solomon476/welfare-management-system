from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from ..models.schemas import (
    SystemStatsSchema, OrgSettingsSchema, AuditLogSchema, UserAccountSchema
)
from ..database.session import db

router = APIRouter(tags=["System Administration & Statistics"])

@router.get("/stats", response_model=SystemStatsSchema)
def get_system_stats():
    total_members = len(db.members)
    active_members = len([m for m in db.members if m.get("status") == "active"])
    pending_members = len([m for m in db.members if m.get("status") == "pending"])

    opening_reserve = float(db.settings.get("opening_reserve_balance", 200000.0))

    verified_income = sum(
        c["amount"] for c in db.contributions if c["status"] == "verified"
    ) + sum(
        t["amount"] for t in db.transactions
        if t["type"] == "income" and "Contribution" not in t["category"]
    )

    pending_contributions = sum(
        c["amount"] for c in db.contributions if c["status"] == "recorded"
    )

    total_expenditure = sum(
        t["amount"] for t in db.transactions if t["type"] == "expenditure"
    )

    operational_balance = opening_reserve + verified_income - total_expenditure

    pending_requests = [w for w in db.welfare_requests if w["status"] in ["submitted", "under_review", "documents_requested"]]
    approved_requests = [w for w in db.welfare_requests if w["status"] == "approved"]
    disbursed_total = sum(
        (w.get("amount_approved") or w.get("amount_requested", 0))
        for w in db.welfare_requests if w["status"] == "disbursed"
    )

    return {
        "total_members": total_members,
        "active_members": active_members,
        "pending_members": pending_members,
        "opening_reserve_balance": opening_reserve,
        "total_verified_income": verified_income,
        "total_pending_contributions": pending_contributions,
        "total_expenditure": total_expenditure,
        "operational_balance": operational_balance,
        "pending_requests_count": len(pending_requests),
        "approved_requests_count": len(approved_requests),
        "disbursed_requests_total": disbursed_total
    }

@router.get("/settings", response_model=OrgSettingsSchema)
def get_settings():
    return db.settings

@router.put("/settings", response_model=OrgSettingsSchema)
def update_settings(data: OrgSettingsSchema):
    db.settings = data.model_dump()
    db.add_audit_log(
        user_name="Administrator",
        user_role="admin",
        action="UPDATE_SETTINGS",
        entity_type="settings",
        entity_id="ORG_CFG",
        description="Updated organizational financial and operational policies"
    )
    db.save()
    return db.settings

@router.get("/audit-logs", response_model=List[AuditLogSchema])
def get_audit_logs(limit: int = 100):
    return db.audit_logs[:limit]

@router.get("/users", response_model=List[UserAccountSchema])
def get_users():
    return db.users

@router.post("/clean-slate")
def reset_to_clean_slate():
    """Resets demo data for clean production launch while maintaining administrative users and base organization config."""
    db.members = []
    db.contributions = []
    db.welfare_requests = []
    db.transactions = [
        {
            "id": "TXN-INIT-001",
            "date": "2026-10-01",
            "type": "income",
            "category": "Opening Reserve Fund",
            "amount": float(db.settings.get("opening_reserve_balance", 200000.0)),
            "description": "Board-authorized capital reserve allocation",
            "reference": "RES-2026-ALLOC",
            "payment_mode": "bank_transfer",
            "linked_member_id": None,
            "linked_welfare_request_id": None,
            "recorded_by": "Administrator",
            "is_reconciled": True,
            "reconciled_at": "2026-10-01 08:00"
        }
    ]
    db.settings["is_demo_mode"] = False
    db.add_audit_log(
        user_name="Administrator",
        user_role="admin",
        action="INITIALIZE_PRODUCTION_SLATE",
        entity_type="system",
        entity_id="ALL",
        description="Purged demo records and initialized production state with Opening Reserve Fund"
    )
    db.save()
    return {"message": "System successfully initialized to clean production slate.", "demo_mode": False}
