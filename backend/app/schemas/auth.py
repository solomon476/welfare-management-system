from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    email: str
    role: str
    avatar: Optional[str] = None
    linked_member_id: Optional[str] = None

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "member"  # admin, welfare_officer, finance_officer, approver, member
    avatar: Optional[str] = None
    department: Optional[str] = None
    linked_member_id: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True
