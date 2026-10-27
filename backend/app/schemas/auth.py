from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional, List
from datetime import datetime

class LoginRequest(BaseModel):
    # Accepts email, membership number (e.g. SW-M001), or phone
    identifier: Optional[str] = None
    email: Optional[str] = None
    password: str

    @model_validator(mode="before")
    @classmethod
    def resolve_identifier(cls, data):
        if isinstance(data, dict):
            # If email is passed but identifier isn't, use email as identifier
            if not data.get("identifier") and data.get("email"):
                data["identifier"] = data.get("email")
            elif not data.get("email") and data.get("identifier"):
                data["email"] = data.get("identifier")
        return data

    @property
    def login_id(self) -> str:
        return (self.identifier or self.email or "").strip()

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    email: str
    role: str
    roles: List[str] = []
    avatar: Optional[str] = None
    linked_member_id: Optional[str] = None

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "member"  # admin, welfare_officer, finance_officer, approver, member, auditor
    avatar: Optional[str] = None
    department: Optional[str] = None
    linked_member_id: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: str
    roles: List[str] = []
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

    @model_validator(mode="before")
    @classmethod
    def populate_roles(cls, data):
        if hasattr(data, "roles_list"):
            # Set roles list from ORM helper
            roles = data.roles_list
            if isinstance(data, dict):
                data["roles"] = roles
            else:
                setattr(data, "roles", roles)
        return data

class AccountActivateRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=8)
    name: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    identifier: str = Field(..., description="Email address or Membership Number")

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

class InvitationCreateRequest(BaseModel):
    email: EmailStr
    membership_number: Optional[str] = None
    member_name: Optional[str] = None
    role: str = "member"

class InvitationResponse(BaseModel):
    id: str
    token: str
    email: str
    membership_number: Optional[str] = None
    member_name: Optional[str] = None
    role: str
    expires_at: datetime
    is_used: bool
    activation_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RoleGrantRequest(BaseModel):
    role: str

class RoleResponse(BaseModel):
    user_id: str
    roles: List[str]
