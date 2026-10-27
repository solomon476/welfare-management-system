import bcrypt
import hmac
import hashlib
import json
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from .config import settings

import secrets

def generate_secure_token(nbytes: int = 32) -> str:
    """Generates an unguessable cryptographic token suitable for invitations and password resets."""
    return secrets.token_urlsafe(nbytes)

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validates that password satisfies enterprise security criteria:
    - At least 8 characters
    - Contains letters and numbers
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    has_letter = any(c.isalpha() for c in password)
    has_digit = any(c.isdigit() for c in password)
    if not (has_letter and has_digit):
        return False, "Password must contain both letters and digits."
    return True, ""

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash"""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT-compatible token using HMAC-SHA256"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": int(expire.timestamp())})
    
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(to_encode).encode()).decode().rstrip("=")
    
    signature_input = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(settings.SECRET_KEY.encode(), signature_input, hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and verifies a signed token"""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        
        signature_input = f"{header_b64}.{payload_b64}".encode()
        expected_sig = hmac.new(settings.SECRET_KEY.encode(), signature_input, hashlib.sha256).digest()
        
        # Add padding back if necessary
        sig_padding = "=" * ((4 - len(sig_b64) % 4) % 4)
        actual_sig = base64.urlsafe_b64decode(f"{sig_b64}{sig_padding}")
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        
        payload_padding = "=" * ((4 - len(payload_b64) % 4) % 4)
        payload_json = base64.urlsafe_b64decode(f"{payload_b64}{payload_padding}").decode()
        payload = json.loads(payload_json)
        
        # Check expiration
        exp = payload.get("exp")
        if exp and datetime.now(timezone.utc).timestamp() > exp:
            return None
            
        return payload
    except Exception:
        return None
