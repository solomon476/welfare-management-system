from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: str
    timestamp: datetime
    user_id: str
    user_name: str
    user_role: str
    action: str
    entity_type: str
    entity_id: str
    description: str
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    ip_address: Optional[str] = None

    class Config:
        from_attributes = True
