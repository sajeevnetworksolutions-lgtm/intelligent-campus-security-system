import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.user import User
from app.models.security import Alert, Incident, IncidentNote, AuditLog
from app.schemas.alert import AlertOut, AlertUpdate
from app.schemas.incident import IncidentOut

router = APIRouter(prefix="/alerts", tags=["Security Alerts"])

@router.get("", response_model=List[AlertOut])
def list_alerts(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity_filter: Optional[str] = Query(None, alias="severity"),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty"]))
):
    query = db.query(Alert)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    if severity_filter:
        query = query.filter(Alert.severity == severity_filter)

    alerts = query.order_by(Alert.timestamp.desc()).limit(limit).all()
    return alerts

@router.get("/{alert_id}", response_model=AlertOut)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty"]))
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.put("/{alert_id}", response_model=AlertOut)
def update_alert(
    alert_id: int,
    payload: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if payload.status:
        alert.status = payload.status
    if payload.resolution_notes:
        alert.resolution_notes = payload.resolution_notes
    if payload.incident_id:
        alert.incident_id = payload.incident_id

    alert.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)

    audit = AuditLog(
        username=current_user.username,
        user_role=current_user.role,
        action="UPDATE_ALERT_STATUS",
        resource=f"ALERT:{alert.alert_code}",
        details_json=f'{{"status": "{alert.status}"}}'
    )
    db.add(audit)
    db.commit()

    return alert

@router.post("/{alert_id}/create-incident", response_model=IncidentOut)
def promote_alert_to_incident(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    inc_num = f"INC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    incident = Incident(
        incident_number=inc_num,
        title=f"Incident: {alert.title}",
        description=f"Automated incident spawned from Alert {alert.alert_code}. {alert.description}",
        severity=alert.severity,
        status="OPEN",
        assigned_to=current_user.full_name
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Link alert
    alert.incident_id = incident.id
    alert.status = "INVESTIGATING"
    
    # Add initial note
    initial_note = IncidentNote(
        incident_id=incident.id,
        author_name=current_user.full_name,
        note_text=f"Incident established from security alert {alert.alert_code}. Initiating containment verification."
    )
    db.add(initial_note)
    db.commit()

    audit = AuditLog(
        username=current_user.username,
        user_role=current_user.role,
        action="PROMOTE_ALERT_TO_INCIDENT",
        resource=f"INCIDENT:{inc_num}"
    )
    db.add(audit)
    db.commit()

    return incident
