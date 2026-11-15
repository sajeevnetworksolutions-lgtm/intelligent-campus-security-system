from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class IncidentNoteOut(BaseModel):
    id: int
    author_name: str
    note_text: str
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentCreate(BaseModel):
    title: str
    description: str
    severity: Optional[str] = "HIGH"
    assigned_to: Optional[str] = "Security Admin"
    alert_ids: Optional[List[int]] = []

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None # OPEN, INVESTIGATING, CONTAINED, RESOLVED, CLOSED
    assigned_to: Optional[str] = None
    root_cause: Optional[str] = None
    mitigation_steps: Optional[str] = None

class IncidentOut(BaseModel):
    id: int
    incident_number: str
    title: str
    description: str
    severity: str
    status: str
    assigned_to: str
    root_cause: Optional[str] = None
    mitigation_steps: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    notes: List[IncidentNoteOut] = []

    class Config:
        from_attributes = True
