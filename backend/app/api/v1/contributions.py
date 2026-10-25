from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from ...db.session import get_db
from ...models.orm import Contribution
from ...schemas.contribution import (
    ContributionCreate, ContributionVerify, ContributionReverse, ContributionResponse,
    BatchContributionImportRequest, BatchContributionImportResponse
)
from ...schemas.common import PaginatedResponse
from ...services.contribution_service import (
    record_contribution, verify_contribution, reverse_contribution, bulk_import_contributions
)

router = APIRouter(prefix="/contributions", tags=["Contributions Ledger"])

@router.get("", response_model=PaginatedResponse[ContributionResponse])
def get_contributions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    member_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Contribution)

    if member_id:
        query = query.filter(Contribution.member_id == member_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Contribution.member_name.ilike(s),
                Contribution.membership_number.ilike(s),
                Contribution.reference_number.ilike(s),
                Contribution.id.ilike(s)
            )
        )

    if status and status != "all":
        query = query.filter(Contribution.status == status)

    if category and category != "all":
        query = query.filter(Contribution.category == category)

    total = query.count()
    items = query.order_by(Contribution.payment_date.desc(), Contribution.recorded_at.desc())\
        .offset(skip).limit(limit).all()

    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + limit) < total
    )

@router.get("/{contrib_id}", response_model=ContributionResponse)
def get_contribution(contrib_id: str, db: Session = Depends(get_db)):
    c = db.query(Contribution).filter(Contribution.id == contrib_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contribution record not found")
    return c

@router.post("", response_model=ContributionResponse, status_code=201)
def create_contribution(data: ContributionCreate, db: Session = Depends(get_db)):
    return record_contribution(db, data)

@router.post("/bulk-import", response_model=BatchContributionImportResponse, status_code=201)
def import_bulk_contributions(data: BatchContributionImportRequest, db: Session = Depends(get_db)):
    """
    High-volume Paybill / Bank statement batch importer for 50,000–100,000 members.
    Ingests up to 5,000 contribution transactions per batch with automated duplicate rejection.
    """
    return bulk_import_contributions(db, data)

@router.post("/{contrib_id}/verify", response_model=ContributionResponse)
def verify_payment(contrib_id: str, data: ContributionVerify, db: Session = Depends(get_db)):
    return verify_contribution(db, contrib_id, data)

@router.post("/{contrib_id}/reverse", response_model=ContributionResponse)
def reverse_payment(contrib_id: str, data: ContributionReverse, db: Session = Depends(get_db)):
    return reverse_contribution(db, contrib_id, data)
