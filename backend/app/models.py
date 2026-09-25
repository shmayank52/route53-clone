import uuid
import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from .database import Base


def gen_uuid():
    return str(uuid.uuid4())


def gen_zone_id():
    # mimic Route53 style hosted zone ids e.g. /hostedzone/Z0123456789ABCDEFGHIJ
    return "Z" + uuid.uuid4().hex[:20].upper()


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, default="")
    account_id = Column(String, default=lambda: "".join(str(uuid.uuid4().int)[:12]))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(String, primary_key=True, default=gen_zone_id)
    name = Column(String, index=True, nullable=False)  # e.g. example.com.
    comment = Column(String, default="")
    private_zone = Column(Boolean, default=False)
    record_count = Column(Integer, default=2)  # starts with NS + SOA
    owner_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    records = relationship("Record", back_populates="hosted_zone", cascade="all, delete-orphan")


class Record(Base):
    __tablename__ = "records"

    id = Column(String, primary_key=True, default=gen_uuid)
    hosted_zone_id = Column(String, ForeignKey("hosted_zones.id"), nullable=False)
    name = Column(String, nullable=False, index=True)
    record_type = Column(String, nullable=False, index=True)  # A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA
    ttl = Column(Integer, default=300)
    values = Column(Text, nullable=False)  # newline separated values, JSON-encoded list stored as text
    routing_policy = Column(String, default="Simple")
    alias = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    hosted_zone = relationship("HostedZone", back_populates="records")
