from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal

from ...db.session import get_db
from ...models.orm import Member, Contribution, WelfareRequest, FinancialLedgerEntry, OrganizationSettings
from ...schemas.reports import MemberStatementResponse, MemberStatementItem, SystemSummaryStats
from ...services.treasury_service import get_reconciliation

router = APIRouter(prefix="/reports", tags=["Reports & Statements"])

@router.get("/summary", response_model=SystemSummaryStats)
def get_system_summary(db: Session = Depends(get_db)):
    reconciliation = get_reconciliation(db)

    total_members = db.query(Member).count()
    active_members = db.query(Member).filter(Member.status == "active").count()
    pending_members = db.query(Member).filter(Member.status == "pending").count()

    pending_requests_count = db.query(WelfareRequest).filter(
        WelfareRequest.status.in_(["submitted", "under_review", "documents_requested"])
    ).count()

    approved_requests_count = db.query(WelfareRequest).filter(
        WelfareRequest.status == "approved"
    ).count()

    disbursed_total_sum = db.query(func.coalesce(func.sum(WelfareRequest.amount_approved), 0))\
        .filter(WelfareRequest.status == "disbursed")\
        .scalar()

    total_expenditure_sum = db.query(func.coalesce(func.sum(FinancialLedgerEntry.amount), 0))\
        .filter(FinancialLedgerEntry.type == "expenditure")\
        .scalar()

    total_verified_income = reconciliation.verified_contributions + reconciliation.other_income

    return SystemSummaryStats(
        total_members=total_members,
        active_members=active_members,
        pending_members=pending_members,
        opening_reserve_balance=reconciliation.opening_reserve,
        total_verified_income=total_verified_income,
        total_pending_contributions=reconciliation.unverified_pending_contributions,
        total_expenditure=Decimal(str(total_expenditure_sum)),
        operational_balance=reconciliation.reconciled_cash_balance,
        pending_requests_count=pending_requests_count,
        approved_requests_count=approved_requests_count,
        disbursed_requests_total=Decimal(str(disbursed_total_sum))
    )

@router.get("/member-statement/{member_id}", response_model=MemberStatementResponse)
def get_member_statement(member_id: str, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    contributions = db.query(Contribution).filter(Contribution.member_id == member_id).all()
    welfare_claims = db.query(WelfareRequest).filter(WelfareRequest.member_id == member_id).all()

    total_verified = sum((c.amount for c in contributions if c.status == "verified"), Decimal("0.00"))
    total_pending = sum((c.amount for c in contributions if c.status == "recorded"), Decimal("0.00"))
    total_benefits = sum((w.amount_approved or w.amount_requested for w in welfare_claims if w.status == "disbursed"), Decimal("0.00"))

    items = []
    for c in contributions:
        items.append(MemberStatementItem(
            id=c.id,
            date=c.payment_date,
            type="contribution",
            category=c.category.replace("_", " ").title(),
            reference=c.reference_number,
            amount=c.amount,
            status=c.status
        ))

    for w in welfare_claims:
        if w.status == "disbursed":
            items.append(MemberStatementItem(
                id=w.id,
                date=w.submission_date,
                type="welfare_benefit",
                category=w.category.replace("_", " ").title(),
                reference=w.disbursement_id or "DISBURSED",
                amount=-(w.amount_approved or w.amount_requested),
                status=w.status
            ))

    # Sort chronologically descending
    items.sort(key=lambda x: x.date, reverse=True)

    return MemberStatementResponse(
        member_id=member.id,
        membership_number=member.membership_number,
        member_name=member.full_name,
        phone=member.phone,
        date_joined=member.date_joined,
        status=member.status,
        total_contributions_verified=total_verified,
        total_contributions_pending=total_pending,
        total_welfare_benefits_received=total_benefits,
        net_welfare_standing=total_verified - total_benefits,
        statement_period="All Time",
        items=items
    )
