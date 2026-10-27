from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from ...db.session import get_db
from ...models.orm import Member, User
from ...core.dependencies import get_current_user, require_roles
from ...schemas.member import MemberCreate, MemberUpdate, MemberResponse
from ...schemas.common import PaginatedResponse
from ...services.audit_service import log_action

router = APIRouter(prefix="/members", tags=["Members Register"])

@router.get("", response_model=PaginatedResponse[MemberResponse])
def get_members(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    cursor: Optional[str] = Query(None, description="Keyset cursor for ultra-fast 100k member seek"),
    search: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Member)

    # Privacy control: Ordinary member accounts can only ever read their own profile
    if current_user and current_user.role == "member":
        if not current_user.linked_member_id:
            raise HTTPException(status_code=403, detail="No registered welfare member profile linked to this account.")
        query = query.filter(Member.id == current_user.linked_member_id)

    if cursor:
        query = query.filter(Member.id < cursor)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Member.full_name.ilike(s),
                Member.membership_number.ilike(s),
                Member.national_id.ilike(s),
                Member.phone.ilike(s)
            )
        )

    if status and status != "all":
        query = query.filter(Member.status == status)

    if category and category != "all":
        query = query.filter(Member.category == category)

    total = query.count()
    items = query.order_by(Member.id.desc()).offset(0 if cursor else skip).limit(limit).all()
    has_more = (skip + limit) < total if not cursor else len(items) == limit
    next_cursor = items[-1].id if items and len(items) == limit else None

    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
        has_more=has_more,
        next_cursor=next_cursor
    )

@router.get("/check-duplicate")
def check_duplicate(
    national_id: str = "",
    phone: str = "",
    email: str = "",
    db: Session = Depends(get_db)
):
    if national_id:
        m = db.query(Member).filter(Member.national_id == national_id.strip()).first()
        if m:
            return {"is_duplicate": True, "field": "National ID", "matched_name": m.full_name}

    if phone:
        clean_p = phone.replace(" ", "")
        m = db.query(Member).filter(Member.phone.like(f"%{clean_p[-9:]}%")).first()
        if m:
            return {"is_duplicate": True, "field": "Phone", "matched_name": m.full_name}

    if email:
        m = db.query(Member).filter(Member.email.ilike(email.strip())).first()
        if m:
            return {"is_duplicate": True, "field": "Email", "matched_name": m.full_name}

    return {"is_duplicate": False}

@router.get("/{member_id}", response_model=MemberResponse)
def get_member(
    member_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    m = db.query(Member).filter(or_(Member.id == member_id, Member.membership_number == member_id)).first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")

    # Member privacy restriction
    if current_user and current_user.role == "member":
        if m.id != current_user.linked_member_id and m.membership_number != current_user.linked_member_id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: Ordinary members can only view their own membership profile."
            )
    return m

@router.post("", response_model=MemberResponse, status_code=201)
def create_member(
    data: MemberCreate,
    current_user: Optional[User] = Depends(require_roles("welfare_officer", "admin")),
    db: Session = Depends(get_db)
):
    # Check duplicates
    dup = check_duplicate(data.national_id, data.phone, data.email or "", db)
    if dup.get("is_duplicate"):
        raise HTTPException(
            status_code=400,
            detail=f"Duplicate member detected: matches {dup.get('matched_name')} on {dup.get('field')}"
        )

    count = db.query(Member).count() + 1
    year = datetime.utcnow().year
    member_id = f"SW-M{count:03d}"
    membership_number = f"SW-{year}-{count:03d}"

    member = Member(
        id=member_id,
        membership_number=membership_number,
        full_name=data.full_name,
        national_id=data.national_id,
        phone=data.phone,
        email=data.email,
        category=data.category,
        status=data.status,
        date_joined=data.date_joined,
        monthly_commitment=Decimal(str(data.monthly_commitment)),
        next_of_kin_name=data.next_of_kin.name,
        next_of_kin_relationship=data.next_of_kin.relationship,
        next_of_kin_phone=data.next_of_kin.phone,
        next_of_kin_email=data.next_of_kin.email,
        notes=data.notes,
        avatar_url=data.avatar_url
    )
    db.add(member)

    user_id = current_user.id if current_user else "SYS"
    user_name = current_user.name if current_user else "Welfare Officer"
    user_role = current_user.role if current_user else "welfare_officer"

    log_action(
        db,
        user_id=user_id,
        user_name=user_name,
        user_role=user_role,
        action="REGISTER_MEMBER",
        entity_type="member",
        entity_id=member_id,
        description=f"Enrolled member {member.full_name} ({membership_number})"
    )

    db.commit()
    db.refresh(member)
    return member

@router.put("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: str,
    data: MemberUpdate,
    current_user: Optional[User] = Depends(require_roles("welfare_officer", "admin")),
    db: Session = Depends(get_db)
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if data.full_name: member.full_name = data.full_name
    if data.phone: member.phone = data.phone
    if data.email: member.email = data.email
    if data.category: member.category = data.category
    if data.status: member.status = data.status
    if data.monthly_commitment is not None:
        member.monthly_commitment = Decimal(str(data.monthly_commitment))
    if data.next_of_kin:
        member.next_of_kin_name = data.next_of_kin.name
        member.next_of_kin_relationship = data.next_of_kin.relationship
        member.next_of_kin_phone = data.next_of_kin.phone
        member.next_of_kin_email = data.next_of_kin.email
    if data.notes is not None:
        member.notes = data.notes

    user_id = current_user.id if current_user else "SYS"
    user_name = current_user.name if current_user else "Administrator"
    user_role = current_user.role if current_user else "admin"

    log_action(
        db,
        user_id=user_id,
        user_name=user_name,
        user_role=user_role,
        action="UPDATE_MEMBER",
        entity_type="member",
        entity_id=member_id,
        description=f"Updated profile for {member.full_name} ({member.membership_number})"
    )

    db.commit()
    db.refresh(member)
    return member
