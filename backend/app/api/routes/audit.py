from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.user import User
from app.models.security import AuditLog

router = APIRouter(prefix="/audit", tags=["Audit Logging"])

@router.get("/logs")
def list_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "timestamp": l.timestamp,
            "username": l.username,
            "user_role": l.user_role,
            "action": l.action,
            "resource": l.resource,
            "details": l.details_json,
            "ip_address": l.ip_address
        })
    return results
