import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, field_validator


# ---------- Auth ----------

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = ""


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    account_id: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Hosted Zones ----------

class HostedZoneCreate(BaseModel):
    name: str
    comment: Optional[str] = ""
    private_zone: Optional[bool] = False

    @field_validator("name")
    @classmethod
    def normalize_name(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("Domain name is required")
        if not v.endswith("."):
            v += "."
        return v


class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = None


class HostedZoneOut(BaseModel):
    id: str
    name: str
    comment: str
    private_zone: bool
    record_count: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class HostedZoneList(BaseModel):
    items: List[HostedZoneOut]
    total: int
    page: int
    page_size: int


# ---------- Records ----------

VALID_RECORD_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"]


class RecordCreate(BaseModel):
    name: str
    record_type: str
    ttl: Optional[int] = 300
    values: List[str]
    routing_policy: Optional[str] = "Simple"
    alias: Optional[bool] = False

    @field_validator("record_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        v = v.upper()
        if v not in VALID_RECORD_TYPES:
            raise ValueError(f"record_type must be one of {VALID_RECORD_TYPES}")
        return v

    @field_validator("values")
    @classmethod
    def validate_values(cls, v: List[str]) -> List[str]:
        cleaned = [x.strip() for x in v if x.strip()]
        if not cleaned:
            raise ValueError("At least one value is required")
        return cleaned


class RecordUpdate(BaseModel):
    ttl: Optional[int] = None
    values: Optional[List[str]] = None
    routing_policy: Optional[str] = None


class RecordOut(BaseModel):
    id: str
    hosted_zone_id: str
    name: str
    record_type: str
    ttl: int
    values: List[str]
    routing_policy: str
    alias: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class RecordList(BaseModel):
    items: List[RecordOut]
    total: int
    page: int
    page_size: int
