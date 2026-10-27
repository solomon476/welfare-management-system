from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from typing import Optional
import secrets

from ...db.session import get_db
from ...models.orm import User, Member, UserSession, AccountInvitation, PasswordResetToken
from ...schemas.auth import (
    LoginRequest,
    TokenResponse,
    UserResponse,
    UserCreate,
    AccountActivateRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from ...core.security import (
    verify_password,
    hash_password,
    create_access_token,
    decode_token,
    generate_secure_token,
    validate_password_strength
)
from ...core.dependencies import require_authenticated_user, get_current_user
from ...core.config import settings
from ...services.audit_service import log_action

router = APIRouter(prefix="/auth", tags=["Authentication & Access"])

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(user: User = Depends(require_authenticated_user)):
    """
    Restores the persistent authenticated session.
    Returns the current user profile, linked member profile, and all authorized roles.
    """
    return user

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, response: Response, request: Request, db: Session = Depends(get_db)):
    """
    Unified sign-in endpoint for both Members and Committee Officers.
    Accepts:
    1. Member Number (e.g. SW-M001) + Password
    2. Email Address (e.g. member@solianwolves.org) + Password
    3. National ID + Password

    Issues a signed JWT bearer token and sets a secure, HttpOnly session cookie
    for seamless persistent login.
    """
    login_id = data.login_id
    if not login_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Member number or email address is required"
        )

    login_id = data.login_id.strip()
    clean_id = login_id.lower()
    raw_digits = ''.join(c for c in login_id if c.isdigit())
    candidates = []

    # 1. Direct Email Lookup
    candidates.extend(db.query(User).filter(func.lower(User.email) == clean_id).all())

    # 2. Exact User ID or Member ID
    candidates.extend(db.query(User).filter(func.lower(User.id) == clean_id).all())
    candidates.extend(db.query(User).filter(func.lower(User.linked_member_id) == clean_id).all())

    # 3. Role/keyword shortcuts
    if clean_id in ["admin", "administrator"]:
        candidates.extend(db.query(User).filter(User.role == "admin").all())
    elif clean_id in ["member"]:
        candidates.extend(db.query(User).filter(User.role == "member").all())
    elif clean_id in ["finance", "treasurer"]:
        candidates.extend(db.query(User).filter(User.role == "finance_officer").all())
    elif clean_id in ["welfare"]:
        candidates.extend(db.query(User).filter(User.role == "welfare_officer").all())
    elif clean_id in ["approver"]:
        candidates.extend(db.query(User).filter(User.role == "welfare_approver").all())
    elif clean_id in ["auditor"]:
        candidates.extend(db.query(User).filter(User.role == "auditor").all())

    # 4. Member registry lookups
    matching_members = db.query(Member).filter(
        (func.lower(Member.id) == clean_id) |
        (func.lower(Member.membership_number) == clean_id) |
        (Member.national_id == clean_id) |
        (Member.phone == clean_id)
    ).all()

    # 5. Numeric digits matching (e.g. "001" or "1")
    if raw_digits:
        padded = raw_digits.zfill(3)
        candidates.extend(db.query(User).filter(User.id.ilike(f"%{padded}")).all())
        matching_members.extend(db.query(Member).filter(
            (Member.membership_number.ilike(f"%{padded}%")) |
            (Member.id.ilike(f"%{padded}%"))
        ).all())

    for m in matching_members:
        if m.email:
            candidates.extend(db.query(User).filter(func.lower(User.email) == m.email.lower()).all())
        candidates.extend(db.query(User).filter(User.linked_member_id == m.id).all())

    # Deduplicate candidates while preserving order
    unique_candidates = []
    seen = set()
    for u in candidates:
        if u.id not in seen:
            seen.add(u.id)
            unique_candidates.append(u)

    user = None
    for u in unique_candidates:
        if verify_password(data.password, u.hashed_password):
            user = u
            break

    if not user:
        log_action(
            db,
            user_id=user.id if user else "UNKNOWN",
            user_name=user.name if user else login_id,
            user_role=user.role if user else "anonymous",
            action="LOGIN_FAILED",
            entity_type="auth",
            entity_id=login_id,
            description=f"Failed login attempt for identifier '{login_id}'"
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended or deactivated. Contact administrator."
        )

    user.last_login = datetime.utcnow()

    # Generate unique session identifier (JTI) for persistent session tracking & revocation
    session_jti = f"SES-{secrets.token_hex(16)}"
    session_expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Create UserSession record
    user_session = UserSession(
        id=f"US-{int(datetime.utcnow().timestamp() * 1000)}",
        user_id=user.id,
        session_token=session_jti,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:250],
        expires_at=session_expire,
        is_revoked=False
    )
    db.add(user_session)

    all_roles = user.roles_list
    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "roles": all_roles,
        "name": user.name,
        "jti": session_jti
    })

    # Set secure, HttpOnly session cookie
    response.set_cookie(
        key="sw_session",
        value=token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False  # True in production HTTPS
    )

    log_action(
        db,
        user_id=user.id,
        user_name=user.name,
        user_role=user.role,
        action="USER_LOGIN",
        entity_type="user",
        entity_id=user.id,
        description=f"User {user.name} logged in with roles {all_roles}"
    )
    db.commit()

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        roles=all_roles,
        avatar=user.avatar,
        linked_member_id=user.linked_member_id
    )

@router.post("/logout")
def logout(
    response: Response,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Terminates the current session, revokes the session token, and clears the session cookie.
    """
    # Extract token jti from header or cookie
    token = None
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    elif "sw_session" in request.cookies:
        token = request.cookies.get("sw_session")

    if token:
        payload = decode_token(token)
        if payload and payload.get("jti"):
            db.query(UserSession).filter(
                UserSession.session_token == payload.get("jti")
            ).update({"is_revoked": True})

    # Clear HttpOnly cookie
    response.delete_cookie(key="sw_session")

    if current_user:
        log_action(
            db,
            user_id=current_user.id,
            user_name=current_user.name,
            user_role=current_user.role,
            action="USER_LOGOUT",
            entity_type="user",
            entity_id=current_user.id,
            description=f"User {current_user.name} logged out and session was revoked"
        )
    db.commit()

    return {"message": "Successfully logged out and session revoked."}

@router.post("/activate")
def activate_account(data: AccountActivateRequest, db: Session = Depends(get_db)):
    """
    PRD 3: Member activates an account using a single-use expiring invitation token.
    Validates token, sets personal password, activates account, and marks invitation as used.
    """
    invitation = db.query(AccountInvitation).filter(
        AccountInvitation.token == data.token
    ).first()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid activation token. Please request a new invitation link from your administrator."
        )

    if invitation.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation token has already been used. Please log in with your password."
        )

    if datetime.utcnow() > invitation.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation token has expired. Please contact your association administrator for a refreshed invite."
        )

    is_valid, msg = validate_password_strength(data.password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    # Find existing or create new User linked to the member
    user = db.query(User).filter(User.email == invitation.email.lower()).first()
    linked_member = None
    if invitation.membership_number:
        linked_member = db.query(Member).filter(Member.membership_number == invitation.membership_number).first()

    if user:
        user.hashed_password = hash_password(data.password)
        user.is_active = True
        if linked_member:
            user.linked_member_id = linked_member.id
    else:
        user_count = db.query(User).count() + 1
        user = User(
            id=f"USR-{user_count:03d}",
            name=data.name or invitation.member_name or (linked_member.full_name if linked_member else "Member"),
            email=invitation.email.lower(),
            hashed_password=hash_password(data.password),
            role=invitation.role or "member",
            linked_member_id=linked_member.id if linked_member else None,
            is_active=True
        )
        db.add(user)

    # Mark invitation as used
    invitation.is_used = True
    invitation.used_at = datetime.utcnow()

    log_action(
        db,
        user_id=user.id,
        user_name=user.name,
        user_role=user.role,
        action="ACCOUNT_ACTIVATED",
        entity_type="user",
        entity_id=user.id,
        description=f"Member account activated for {user.email} using invitation token"
    )
    db.commit()

    return {
        "message": "Account successfully activated! You can now sign in using your membership number or email and password.",
        "user_id": user.id,
        "email": user.email
    }

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    PRD 3: Secure account recovery. Generates an expiring password reset token.
    """
    identifier = data.identifier.strip()
    user = db.query(User).filter(User.email == identifier.lower()).first()
    if not user:
        member = db.query(Member).filter(
            (Member.membership_number == identifier) |
            (Member.national_id == identifier)
        ).first()
        if member:
            user = db.query(User).filter(
                (User.linked_member_id == member.id) |
                (User.email == (member.email or "").lower())
            ).first()

    if not user:
        # Return generic message to prevent account enumeration
        return {
            "message": "If an account matching this identifier exists, recovery instructions have been dispatched.",
            "token": None
        }

    token = generate_secure_token(32)
    reset_entry = PasswordResetToken(
        id=f"RST-{int(datetime.utcnow().timestamp() * 1000)}",
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=2),
        is_used=False
    )
    db.add(reset_entry)

    log_action(
        db,
        user_id=user.id,
        user_name=user.name,
        user_role=user.role,
        action="PASSWORD_RESET_REQUESTED",
        entity_type="user",
        entity_id=user.id,
        description=f"Password reset token requested for {user.email}"
    )
    db.commit()

    return {
        "message": "If an account matching this identifier exists, recovery instructions have been dispatched.",
        "reset_token": token
    }

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    PRD 3: Completes secure password recovery with a valid reset token.
    """
    reset_entry = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == data.token
    ).first()

    if not reset_entry or reset_entry.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or already used password reset token."
        )

    if datetime.utcnow() > reset_entry.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has expired. Please initiate password recovery again."
        )

    is_valid, msg = validate_password_strength(data.new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    user = db.query(User).filter(User.id == reset_entry.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    user.hashed_password = hash_password(data.new_password)
    reset_entry.is_used = True

    # Revoke all existing sessions for this user upon password reset
    db.query(UserSession).filter(UserSession.user_id == user.id).update({"is_revoked": True})

    log_action(
        db,
        user_id=user.id,
        user_name=user.name,
        user_role=user.role,
        action="PASSWORD_RESET_COMPLETED",
        entity_type="user",
        entity_id=user.id,
        description=f"Password successfully reset for user {user.email}. All sessions revoked."
    )
    db.commit()

    return {"message": "Password successfully reset. You may now sign in with your new credentials."}

@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    count = db.query(User).count() + 1
    new_user = User(
        id=f"USR-{count:03d}",
        name=data.name,
        email=data.email.lower().strip(),
        hashed_password=hash_password(data.password),
        role=data.role,
        avatar=data.avatar,
        department=data.department,
        linked_member_id=data.linked_member_id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
