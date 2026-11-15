import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.user import User
from app.models.security import Incident, IncidentNote, Alert, AuditLog
from app.schemas.incident import IncidentOut, IncidentCreate, IncidentUpdate, IncidentNoteOut

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

@router.get("", response_model=List[IncidentOut])
def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity_filter: Optional[str] = Query(None, alias="severity"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty"]))
):
    query = db.query(Incident)
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    if severity_filter:
        query = query.filter(Incident.severity == severity_filter)

    incidents = query.order_by(Incident.created_at.desc()).limit(limit).all()
    return incidents

@router.post("", response_model=IncidentOut)
def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    inc_num = f"INC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    incident = Incident(
        incident_number=inc_num,
        title=payload.title,
        description=payload.description,
        severity=payload.severity or "HIGH",
        status="OPEN",
        assigned_to=payload.assigned_to or current_user.full_name
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    if payload.alert_ids:
        db.query(Alert).filter(Alert.id.in_(payload.alert_ids)).update({
            Alert.incident_id: incident.id,
            Alert.status: "INVESTIGATING"
        }, synchronize_session=False)
        db.commit()

    note = IncidentNote(
        incident_id=incident.id,
        author_name=current_user.full_name,
        note_text="Incident created manually in SOC dashboard."
    )
    db.add(note)
    db.commit()

    audit = AuditLog(
        username=current_user.username,
        user_role=current_user.role,
        action="CREATE_INCIDENT",
        resource=f"INCIDENT:{inc_num}"
    )
    db.add(audit)
    db.commit()

    return incident

@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty"]))
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.put("/{incident_id}", response_model=IncidentOut)
def update_incident(
    incident_id: int,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if payload.title:
        incident.title = payload.title
    if payload.description:
        incident.description = payload.description
    if payload.severity:
        incident.severity = payload.severity
    if payload.status:
        incident.status = payload.status
    if payload.assigned_to:
        incident.assigned_to = payload.assigned_to
    if payload.root_cause:
        incident.root_cause = payload.root_cause
    if payload.mitigation_steps:
        incident.mitigation_steps = payload.mitigation_steps

    incident.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(incident)

    audit = AuditLog(
        username=current_user.username,
        user_role=current_user.role,
        action="UPDATE_INCIDENT",
        resource=f"INCIDENT:{incident.incident_number}",
        details_json=f'{{"status": "{incident.status}"}}'
    )
    db.add(audit)
    db.commit()

    return incident

@router.post("/{incident_id}/notes", response_model=IncidentNoteOut)
def add_incident_note(
    incident_id: int,
    note_text: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    note = IncidentNote(
        incident_id=incident.id,
        author_name=current_user.full_name,
        note_text=note_text
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return note
