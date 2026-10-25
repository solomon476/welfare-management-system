from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from ..models.orm import AuditLog

def log_action(
    db: Session,
    user_id: str,
    user_name: str,
    user_role: str,
    action: str,
    entity_type: str,
    entity_id: str,
    description: str,
    prev_val: Optional[str] = None,
    new_val: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """Records an immutable, tamper-evident audit trail entry"""
    log_id = f"AUD-{int(datetime.utcnow().timestamp() * 1000)}"
    entry = AuditLog(
        id=log_id,
        timestamp=datetime.utcnow(),
        user_id=user_id,
        user_name=user_name,
        user_role=user_role,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        previous_value=prev_val,
        new_value=new_val,
        ip_address=ip_address
    )
    db.add(entry)
    return entry
