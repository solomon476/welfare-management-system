from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import uuid

from ...db.session import get_db
from ...models.orm import Member, User, Role, UserRole, AccountInvitation
from ...schemas.member import MemberCreate, MemberResponse
from ...schemas.auth import RoleGrantRequest, RoleResponse, InvitationResponse
from ...core.dependencies import require_roles, require_authenticated_user
from ...core.security import generate_secure_token
from ...services.audit_service import log_action

router = APIRouter(prefix="/admin", tags=["Administration & Officer Governance"])

@router.post("/members", status_code=201)
def create_member_with_invitation(
    data: MemberCreate,
    current_user: Optional[User] = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """
    PRD 3 & 4: Administrator registers a new welfare member and automatically
    issues a single-use expiring activation invitation token.
    """
    # Check national ID & phone uniqueness
    existing_nat = db.query(Member).filter(Member.national_id == data.national_id).first()
    if existing_nat:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Member with National ID {data.national_id} already registered."
        )

    existing_phone = db.query(Member).filter(Member.phone == data.phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Member with Phone {data.phone} already registered."
        )

    # Generate next membership number: SW-M00X
    member_count = db.query(Member).count() + 1
    new_id = f"SW-M{member_count:03d}"
    membership_num = f"SW/{datetime.utcnow().year}/{member_count:04d}"

    new_member = Member(
        id=new_id,
        membership_number=membership_num,
        full_name=data.full_name,
        national_id=data.national_id,
        phone=data.phone,
        email=data.email,
        category=data.category,
        status=data.status,
        date_joined=data.date_joined,
        monthly_commitment=data.monthly_commitment,
        next_of_kin_name=data.next_of_kin.name,
        next_of_kin_relationship=data.next_of_kin.relationship,
        next_of_kin_phone=data.next_of_kin.phone,
        next_of_kin_email=data.next_of_kin.email,
        notes=data.notes,
        avatar_url=data.avatar_url
    )
    db.add(new_member)

    # Issue single-use, 72-hour expiring activation invitation
    invitation_token = generate_secure_token(32)
    invitation = AccountInvitation(
        id=f"INV-{int(datetime.utcnow().timestamp() * 1000)}",
        token=invitation_token,
        email=data.email or f"{data.phone}@members.solianwolves.org",
        membership_number=membership_num,
        member_name=data.full_name,
        role="member",
        created_by=current_user.name if current_user else "Administrator",
        expires_at=datetime.utcnow() + timedelta(hours=72),
        is_used=False
    )
    db.add(invitation)

    log_action(
        db,
        user_id=current_user.id if current_user else "SYSTEM",
        user_name=current_user.name if current_user else "Administrator",
        user_role=current_user.role if current_user else "admin",
        action="MEMBER_REGISTERED_WITH_INVITATION",
        entity_type="member",
        entity_id=new_id,
        description=f"Admin registered {data.full_name} ({membership_num}) and issued activation token."
    )
    db.commit()
    db.refresh(new_member)

    return {
        "member": MemberResponse.from_orm(new_member),
        "invitation_id": invitation.id,
        "invitation_token": invitation_token,
        "activation_url": f"/activate?token={invitation_token}",
        "expires_at": invitation.expires_at.isoformat()
    }

@router.post("/users/{user_id}/roles", response_model=RoleResponse)
def grant_user_role(
    user_id: str,
    data: RoleGrantRequest,
    current_user: Optional[User] = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """
    PRD 3 & 4: Administrator assigns officer roles (Finance Officer, Welfare Officer,
    Welfare Approver, Auditor) to a user account.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")

    target_role = data.role.strip().lower()
    valid_roles = {"admin", "secretary", "finance_officer", "welfare_officer", "welfare_approver", "approver", "member", "auditor"}
    if target_role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{target_role}'. Valid roles: {sorted(list(valid_roles))}"
        )

    # Ensure role exists in roles table
    role_record = db.query(Role).filter(Role.id == target_role).first()
    if not role_record:
        role_record = Role(id=target_role, name=target_role.replace("_", " ").title())
        db.add(role_record)
        db.flush()

    # Check if user already possesses this role
    existing = db.query(UserRole).filter(
        UserRole.user_id == user.id,
        UserRole.role_id == target_role
    ).first()

    if not existing and user.role != target_role:
        new_user_role = UserRole(
            id=f"UR-{int(datetime.utcnow().timestamp() * 1000)}",
            user_id=user.id,
            role_id=target_role,
            granted_by=current_user.name if current_user else "Administrator"
        )
        db.add(new_user_role)

    log_action(
        db,
        user_id=current_user.id if current_user else "SYSTEM",
        user_name=current_user.name if current_user else "Administrator",
        user_role=current_user.role if current_user else "admin",
        action="ROLE_GRANTED",
        entity_type="user",
        entity_id=user.id,
        description=f"Granted role '{target_role}' to {user.name} ({user.email})"
    )
    db.commit()
    db.refresh(user)

    return RoleResponse(user_id=user.id, roles=user.roles_list)

@router.delete("/users/{user_id}/roles/{role_id}", response_model=RoleResponse)
def revoke_user_role(
    user_id: str,
    role_id: str,
    current_user: Optional[User] = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """
    PRD 3 & 4: Administrator revokes an officer role from a user account.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")

    target_role = role_id.strip().lower()

    # If it is the primary role, downgrade to member if other roles exist or set to member
    if user.role == target_role:
        remaining_roles = [r for r in user.roles_list if r != target_role]
        user.role = remaining_roles[0] if remaining_roles else "member"

    # Remove from UserRole mappings
    db.query(UserRole).filter(
        UserRole.user_id == user.id,
        UserRole.role_id == target_role
    ).delete()

    log_action(
        db,
        user_id=current_user.id if current_user else "SYSTEM",
        user_name=current_user.name if current_user else "Administrator",
        user_role=current_user.role if current_user else "admin",
        action="ROLE_REVOKED",
        entity_type="user",
        entity_id=user.id,
        description=f"Revoked role '{target_role}' from {user.name} ({user.email})"
    )
    db.commit()
    db.refresh(user)

    return RoleResponse(user_id=user.id, roles=user.roles_list)

@router.get("/invitations", response_model=List[InvitationResponse])
def get_invitations(
    current_user: Optional[User] = Depends(require_roles("admin", "auditor")),
    db: Session = Depends(get_db)
):
    """Lists all member activation invitations with expiration and redemption statuses."""
    return db.query(AccountInvitation).order_by(AccountInvitation.created_at.desc()).all()
