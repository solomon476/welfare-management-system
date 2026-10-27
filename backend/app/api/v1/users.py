from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from ...db.session import get_db
from ...models.orm import User
from ...core.dependencies import require_roles
from ...schemas.auth import UserResponse

router = APIRouter(prefix="/users", tags=["User Accounts & RBAC"])

@router.get("", response_model=List[UserResponse])
def get_users(
    current_user: Optional[User] = Depends(require_roles("admin", "auditor")),
    db: Session = Depends(get_db)
):
    return db.query(User).order_by(User.id.asc()).all()

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    current_user: Optional[User] = Depends(require_roles("admin", "auditor")),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    return user
