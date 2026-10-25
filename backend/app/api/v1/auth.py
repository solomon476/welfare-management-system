from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from ...db.session import get_db
from ...models.orm import User
from ...schemas.auth import LoginRequest, TokenResponse, UserResponse, UserCreate
from ...core.security import verify_password, hash_password, create_access_token
from ...services.audit_service import log_action

router = APIRouter(prefix="/auth", tags=["Authentication & Access"])

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user or not verify_password(data.password, user.hashed_password):
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
    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.name
    })

    log_action(
        db,
        user_id=user.id,
        user_name=user.name,
        user_role=user.role,
        action="USER_LOGIN",
        entity_type="user",
        entity_id=user.id,
        description=f"User {user.name} logged into {user.role} session"
    )
    db.commit()

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        avatar=user.avatar,
        linked_member_id=user.linked_member_id
    )

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
