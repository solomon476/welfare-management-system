from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from ...db.session import get_db
from ...models.orm import WelfareRequest
from ...schemas.welfare import (
    WelfareRequestCreate, WelfareStatusUpdate, WelfareRequestResponse
)
from ...schemas.common import PaginatedResponse
from ...services.welfare_service import (
    create_welfare_request, update_welfare_status
)

router = APIRouter(prefix="/welfare", tags=["Welfare Applications & Approvals"])

@router.get("", response_model=PaginatedResponse[WelfareRequestResponse])
def get_welfare_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    urgency: Optional[str] = None,
    member_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(WelfareRequest)

    if member_id:
        query = query.filter(WelfareRequest.member_id == member_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                WelfareRequest.member_name.ilike(s),
                WelfareRequest.membership_number.ilike(s),
                WelfareRequest.id.ilike(s),
                WelfareRequest.description.ilike(s)
            )
        )

    if status and status != "all":
        query = query.filter(WelfareRequest.status == status)

    if category and category != "all":
        query = query.filter(WelfareRequest.category == category)

    if urgency and urgency != "all":
        query = query.filter(WelfareRequest.urgency == urgency)

    total = query.count()
    items = query.order_by(WelfareRequest.submission_date.desc(), WelfareRequest.created_at.desc())\
        .offset(skip).limit(limit).all()

    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
        has_more=(skip + limit) < total
    )

@router.get("/{req_id}", response_model=WelfareRequestResponse)
def get_welfare_request(req_id: str, db: Session = Depends(get_db)):
    req = db.query(WelfareRequest).filter(WelfareRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Welfare request not found")
    return req

@router.post("", response_model=WelfareRequestResponse, status_code=201)
def submit_welfare_claim(data: WelfareRequestCreate, db: Session = Depends(get_db)):
    return create_welfare_request(db, data, user_name="Member", user_id="USR-005")

@router.post("/{req_id}/status", response_model=WelfareRequestResponse)
def review_welfare_claim(req_id: str, data: WelfareStatusUpdate, db: Session = Depends(get_db)):
    return update_welfare_status(db, req_id, data, user_id="SYS")
