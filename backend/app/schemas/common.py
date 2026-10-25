from pydantic import BaseModel, Field
from typing import Generic, TypeVar, List

T = TypeVar("T")

class PaginationParams(BaseModel):
    skip: int = Field(0, ge=0, description="Records to skip for pagination")
    limit: int = Field(50, ge=1, le=200, description="Max records to return")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    skip: int
    limit: int
    has_more: bool
