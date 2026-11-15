from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AlertOut(BaseModel):
    id: int
    alert_code: str
    timestamp: datetime
    title: str
    description: str
    threat_category: str
    severity: str
    risk_score: float
    source: str
    source_ip: Optional[str] = None
    model_name: Optional[str] = None
    explanation: Optional[str] = None
    status: str
    resolution_notes: Optional[str] = None
    incident_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    status: Optional[str] = None # NEW, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    resolution_notes: Optional[str] = None
    incident_id: Optional[int] = None
