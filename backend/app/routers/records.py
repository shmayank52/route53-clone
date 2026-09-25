import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/hosted-zones/{zone_id}/records", tags=["records"])


def _get_owned_zone(db: Session, zone_id: str, user_id: str) -> models.HostedZone:
    zone = (
        db.query(models.HostedZone)
        .filter(models.HostedZone.id == zone_id, models.HostedZone.owner_id == user_id)
        .first()
    )
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


def _serialize(rec: models.Record) -> schemas.RecordOut:
    return schemas.RecordOut(
        id=rec.id,
        hosted_zone_id=rec.hosted_zone_id,
        name=rec.name,
        record_type=rec.record_type,
        ttl=rec.ttl,
        values=json.loads(rec.values),
        routing_policy=rec.routing_policy,
        alias=rec.alias,
        created_at=rec.created_at,
        updated_at=rec.updated_at,
    )


@router.get("", response_model=schemas.RecordList)
def list_records(
    zone_id: str,
    search: Optional[str] = Query(None),
    record_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    _get_owned_zone(db, zone_id, current_user.id)

    q = db.query(models.Record).filter(models.Record.hosted_zone_id == zone_id)
    if search:
        q = q.filter(or_(models.Record.name.ilike(f"%{search}%"), models.Record.values.ilike(f"%{search}%")))
    if record_type:
        q = q.filter(models.Record.record_type == record_type.upper())

    total = q.count()
    rows = (
        q.order_by(models.Record.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    items = [_serialize(r) for r in rows]
    return schemas.RecordList(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=schemas.RecordOut, status_code=201)
def create_record(
    zone_id: str,
    payload: schemas.RecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    zone = _get_owned_zone(db, zone_id, current_user.id)

    name = payload.name.strip().lower()
    if not name.endswith("."):
        name += "."
    # Allow bare "@"/blank to mean the zone apex
    if name in (".", "@."):
        name = zone.name

    duplicate = (
        db.query(models.Record)
        .filter(
            models.Record.hosted_zone_id == zone_id,
            models.Record.name == name,
            models.Record.record_type == payload.record_type,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=400,
            detail=f"A record with name '{name}' and type '{payload.record_type}' already exists",
        )

    rec = models.Record(
        hosted_zone_id=zone_id,
        name=name,
        record_type=payload.record_type,
        ttl=payload.ttl or 300,
        values=json.dumps(payload.values),
        routing_policy=payload.routing_policy or "Simple",
        alias=payload.alias or False,
    )
    db.add(rec)

    zone.record_count = (zone.record_count or 0) + 1

    db.commit()
    db.refresh(rec)
    return _serialize(rec)


@router.put("/{record_id}", response_model=schemas.RecordOut)
def update_record(
    zone_id: str,
    record_id: str,
    payload: schemas.RecordUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    _get_owned_zone(db, zone_id, current_user.id)

    rec = (
        db.query(models.Record)
        .filter(models.Record.id == record_id, models.Record.hosted_zone_id == zone_id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")

    if rec.record_type in ("NS", "SOA") and rec.name == rec.hosted_zone.name:
        raise HTTPException(status_code=400, detail="The default apex NS/SOA records cannot be edited")

    if payload.ttl is not None:
        rec.ttl = payload.ttl
    if payload.values is not None:
        cleaned = [v.strip() for v in payload.values if v.strip()]
        if not cleaned:
            raise HTTPException(status_code=400, detail="At least one value is required")
        rec.values = json.dumps(cleaned)
    if payload.routing_policy is not None:
        rec.routing_policy = payload.routing_policy

    db.commit()
    db.refresh(rec)
    return _serialize(rec)


@router.delete("/{record_id}", status_code=204)
def delete_record(
    zone_id: str,
    record_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    zone = _get_owned_zone(db, zone_id, current_user.id)

    rec = (
        db.query(models.Record)
        .filter(models.Record.id == record_id, models.Record.hosted_zone_id == zone_id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")

    if rec.record_type in ("NS", "SOA") and rec.name == zone.name:
        raise HTTPException(status_code=400, detail="The default apex NS/SOA records cannot be deleted")

    db.delete(rec)
    zone.record_count = max(0, (zone.record_count or 1) - 1)
    db.commit()
    return None
