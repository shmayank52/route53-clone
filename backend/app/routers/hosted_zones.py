from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/hosted-zones", tags=["hosted-zones"])


def _default_records_for_zone(zone: models.HostedZone):
    """Route53 auto-creates an NS and SOA record for every new hosted zone."""
    ns_values = [
        f"ns-1.awsdns-clone.com.",
        f"ns-2.awsdns-clone.net.",
        f"ns-3.awsdns-clone.org.",
        f"ns-4.awsdns-clone.co.uk.",
    ]
    soa_values = [
        f"ns-1.awsdns-clone.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
    ]
    import json

    ns = models.Record(
        hosted_zone_id=zone.id,
        name=zone.name,
        record_type="NS",
        ttl=172800,
        values=json.dumps(ns_values),
        routing_policy="Simple",
    )
    soa = models.Record(
        hosted_zone_id=zone.id,
        name=zone.name,
        record_type="SOA",
        ttl=900,
        values=json.dumps(soa_values),
        routing_policy="Simple",
    )
    return [ns, soa]


@router.get("", response_model=schemas.HostedZoneList)
def list_hosted_zones(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.HostedZone).filter(models.HostedZone.owner_id == current_user.id)
    if search:
        q = q.filter(or_(models.HostedZone.name.ilike(f"%{search}%"), models.HostedZone.id.ilike(f"%{search}%")))
    total = q.count()
    items = (
        q.order_by(models.HostedZone.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return schemas.HostedZoneList(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=schemas.HostedZoneOut, status_code=201)
def create_hosted_zone(
    payload: schemas.HostedZoneCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    existing = (
        db.query(models.HostedZone)
        .filter(models.HostedZone.name == payload.name, models.HostedZone.owner_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="A hosted zone with this domain name already exists")

    zone = models.HostedZone(
        name=payload.name,
        comment=payload.comment or "",
        private_zone=payload.private_zone or False,
        owner_id=current_user.id,
        record_count=2,
    )
    db.add(zone)
    db.flush()

    for rec in _default_records_for_zone(zone):
        db.add(rec)

    db.commit()
    db.refresh(zone)
    return zone


@router.get("/{zone_id}", response_model=schemas.HostedZoneOut)
def get_hosted_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    zone = (
        db.query(models.HostedZone)
        .filter(models.HostedZone.id == zone_id, models.HostedZone.owner_id == current_user.id)
        .first()
    )
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


@router.put("/{zone_id}", response_model=schemas.HostedZoneOut)
def update_hosted_zone(
    zone_id: str,
    payload: schemas.HostedZoneUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    zone = (
        db.query(models.HostedZone)
        .filter(models.HostedZone.id == zone_id, models.HostedZone.owner_id == current_user.id)
        .first()
    )
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    if payload.comment is not None:
        zone.comment = payload.comment

    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/{zone_id}", status_code=204)
def delete_hosted_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    zone = (
        db.query(models.HostedZone)
        .filter(models.HostedZone.id == zone_id, models.HostedZone.owner_id == current_user.id)
        .first()
    )
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    db.delete(zone)
    db.commit()
    return None
