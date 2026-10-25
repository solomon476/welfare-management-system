from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from ..models.schemas import MemberCreate, MemberUpdate, MemberResponse
from ..database.session import db

router = APIRouter(prefix="/members", tags=["Members Register"])

@router.get("", response_model=List[MemberResponse])
def get_members(
    search: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None
):
    results = db.members
    if search:
        s = search.lower()
        results = [
            m for m in results if
            s in m["full_name"].lower() or
            s in m["membership_number"].lower() or
            s in m["national_id"] or
            s in m["phone"]
        ]
    if status and status != "all":
        results = [m for m in results if m["status"] == status]
    if category and category != "all":
        results = [m for m in results if m["category"] == category]
    return results

@router.get("/check-duplicate")
def check_duplicate(national_id: str = "", phone: str = "", email: str = ""):
    for m in db.members:
        if national_id and m["national_id"] == national_id:
            return {"is_duplicate": True, "field": "National ID", "matched_name": m["full_name"]}
        if phone and m["phone"].replace(" ", "") == phone.replace(" ", ""):
            return {"is_duplicate": True, "field": "Phone", "matched_name": m["full_name"]}
        if email and m.get("email") and m["email"].lower() == email.lower():
            return {"is_duplicate": True, "field": "Email", "matched_name": m["full_name"]}
    return {"is_duplicate": False}

@router.get("/{member_id}", response_model=MemberResponse)
def get_member(member_id: str):
    for m in db.members:
        if m["id"] == member_id or m["membership_number"] == member_id:
            return m
    raise HTTPException(status_code=404, detail="Member not found")

@router.post("", response_model=MemberResponse, status_code=201)
def create_member(data: MemberCreate):
    # Check duplicate
    dup = check_duplicate(data.national_id, data.phone, data.email or "")
    if dup.get("is_duplicate"):
        raise HTTPException(status_code=400, detail=f"Duplicate member detected: matches {dup.get('matched_name')} on {dup.get('field')}")

    count = len(db.members) + 1
    year = datetime.now().year
    member_id = f"SW-M{count:03d}"
    membership_number = f"SW-{year}-{count:03d}"

    new_member = {
        "id": member_id,
        "membership_number": membership_number,
        "full_name": data.full_name,
        "national_id": data.national_id,
        "phone": data.phone,
        "email": data.email,
        "category": data.category,
        "status": data.status,
        "date_joined": str(data.date_joined),
        "monthly_commitment": data.monthly_commitment,
        "next_of_kin": data.next_of_kin.model_dump(),
        "notes": data.notes,
        "avatar_url": data.avatar_url
    }

    db.members.insert(0, new_member)
    db.add_audit_log(
        user_name="Welfare Officer",
        user_role="welfare_officer",
        action="CREATE_MEMBER",
        entity_type="member",
        entity_id=member_id,
        description=f"Registered new member {data.full_name} ({membership_number})"
    )
    db.save()
    return new_member

@router.put("/{member_id}", response_model=MemberResponse)
def update_member(member_id: str, data: MemberUpdate):
    for idx, m in enumerate(db.members):
        if m["id"] == member_id:
            update_data = data.model_dump(exclude_unset=True)
            if "next_of_kin" in update_data and update_data["next_of_kin"]:
                update_data["next_of_kin"] = update_data["next_of_kin"].model_dump()
            m.update(update_data)
            db.members[idx] = m
            db.add_audit_log(
                user_name="Administrator",
                user_role="admin",
                action="UPDATE_MEMBER",
                entity_type="member",
                entity_id=member_id,
                description=f"Updated profile for {m['full_name']} ({m['membership_number']})"
            )
            db.save()
            return m
    raise HTTPException(status_code=404, detail="Member not found")
