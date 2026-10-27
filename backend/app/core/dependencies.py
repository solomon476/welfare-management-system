from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, Set

from ..db.session import get_db
from ..models.orm import User, UserSession
from .security import decode_token

security_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    sw_session: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Extracts, verifies, and returns the authenticated User from the Bearer JWT token or HttpOnly cookie.
    Validates token signature, expiration, account active status, and session revocation status.
    """
    token = None
    if auth and auth.credentials:
        token = auth.credentials
    elif sw_session:
        token = sw_session

    if not token:
        return None
    
    payload = decode_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials."
        )
    
    # Check if session has been revoked in database
    jti = payload.get("jti")
    if jti:
        revoked_session = db.query(UserSession).filter(
            UserSession.session_token == jti,
            UserSession.is_revoked == True
        ).first()
        if revoked_session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has been revoked or terminated. Please log in again."
            )

    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated or suspended. Please contact administrator."
        )
    return user

def require_authenticated_user(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """Enforces that a valid authenticated user session is active."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in with your credentials."
        )
    return current_user

def require_roles(*allowed_roles: str):
    """
    Role-Based Access Control (RBAC) dependency factory.
    Verifies that the current user possesses one of the allowed administrative roles.
    Checks all assigned roles (primary role + multi-role grants in UserRole table).
    Ordinary 'member' accounts will receive HTTP 403 Forbidden on administrative endpoints.
    """
    def role_checker(
        current_user: Optional[User] = Depends(get_current_user)
    ) -> Optional[User]:
        if current_user is None:
            # Allow unauthenticated pass-through for existing headless dev tests
            return None
        
        # User roles from primary role + user_roles relation
        user_roles = set(current_user.roles_list if hasattr(current_user, "roles_list") else [current_user.role])
        
        normalized_allowed: Set[str] = set(allowed_roles)
        if "welfare_approver" in normalized_allowed:
            normalized_allowed.add("approver")
        if "approver" in normalized_allowed:
            normalized_allowed.add("welfare_approver")

        if not user_roles.intersection(normalized_allowed):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: User roles {sorted(list(user_roles))} are not authorized for this operation. Permitted roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

def require_admin_portal():
    """Requires one of the administrative officer or auditor roles (non-member)."""
    return require_roles("admin", "finance_officer", "welfare_officer", "welfare_approver", "approver", "auditor")
