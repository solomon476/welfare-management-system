from pydantic import BaseModel, Field
from typing import Generic, TypeVar, List, Optional

T = TypeVar("T")

class PaginationParams(BaseModel):
    skip: int = Field(0, ge=0, description="Records to skip for offset pagination")
    limit: int = Field(50, ge=1, le=200, description="Max records to return per page")
    cursor: Optional[str] = Field(None, description="Keyset cursor for ultra-fast 100k scale pagination (O(1) seek)")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    skip: int
    limit: int
    has_more: bool
    next_cursor: Optional[str] = None
