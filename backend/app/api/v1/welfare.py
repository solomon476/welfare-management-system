from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from ...db.session import get_db
from ...models.orm import WelfareRequest, User
from ...core.dependencies import get_current_user, require_roles
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
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(WelfareRequest)

    # Privacy control: Ordinary member accounts can only ever read their own personal claims
    if current_user and current_user.role == "member":
        if not current_user.linked_member_id:
            raise HTTPException(status_code=403, detail="No registered welfare member profile linked to this account.")
        query = query.filter(WelfareRequest.member_id == current_user.linked_member_id)
    elif member_id:
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
def get_welfare_request(
    req_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(WelfareRequest).filter(WelfareRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Welfare request not found")

    # Member privacy restriction
    if current_user and current_user.role == "member":
        if req.member_id != current_user.linked_member_id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You are not authorized to view another member's welfare application."
            )
    return req

@router.post("", response_model=WelfareRequestResponse, status_code=201)
def submit_welfare_claim(
    data: WelfareRequestCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else "USR-005"
    user_name = current_user.name if current_user else "Member"

    # Enforce that members cannot submit claims on behalf of others
    if current_user and current_user.role == "member":
        if current_user.linked_member_id and data.member_id != current_user.linked_member_id:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: You can only submit welfare applications for your own member profile."
            )

    return create_welfare_request(db, data, user_name=user_name, user_id=user_id)

@router.post("/{req_id}/status", response_model=WelfareRequestResponse)
def review_welfare_claim(
    req_id: str,
    data: WelfareStatusUpdate,
    current_user: Optional[User] = Depends(require_roles("welfare_officer", "welfare_approver", "admin")),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else "SYS"
    if current_user:
        if not data.officer_name:
            data.officer_name = current_user.name
        if not data.officer_role:
            data.officer_role = current_user.role
    else:
        if not data.officer_name:
            data.officer_name = "Welfare Approver"
        if not data.officer_role:
            data.officer_role = "approver"
    return update_welfare_status(db, req_id, data, user_id=user_id)
