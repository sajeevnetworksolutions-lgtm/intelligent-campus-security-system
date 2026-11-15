import json
import pandas as pd
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.user import User
from app.models.security import SecurityEvent
from app.schemas.detection import NetworkRecordInput, DetectionResultOut, BatchDetectionResult
from app.detection.engine import IntrusionDetectionEngine

router = APIRouter(prefix="/detection", tags=["Intrusion Detection"])

@router.post("/analyze", response_model=DetectionResultOut)
def analyze_network_record(
    payload: NetworkRecordInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty", "Student"]))
):
    engine = IntrusionDetectionEngine(db)
    try:
        result = engine.analyze_record(payload.dict(), trigger_alert=True)
        return DetectionResultOut(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failure: {str(e)}")

@router.post("/analyze-batch", response_model=BatchDetectionResult)
async def analyze_batch_traffic(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files can be ingested for batch detection")

    try:
        df = pd.read_csv(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {str(e)}")

    engine = IntrusionDetectionEngine(db)
    results = []
    normal_cnt = 0
    malicious_cnt = 0
    threat_breakdown = {}
    risk_distribution = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    alerts_created = 0

    # Limit batch to first 200 records for fast interactive web responsiveness
    records = df.head(200).to_dict(orient="records")
    
    for r in records:
        try:
            res = engine.analyze_record(r, trigger_alert=True)
            results.append(DetectionResultOut(**res))
            
            if res["is_malicious"]:
                malicious_cnt += 1
                t_cat = res["threat_category"]
                threat_breakdown[t_cat] = threat_breakdown.get(t_cat, 0) + 1
            else:
                normal_cnt += 1

            sev = res["severity"]
            risk_distribution[sev] = risk_distribution.get(sev, 0) + 1
            
            if res["alert_generated"]:
                alerts_created += 1
        except Exception:
            continue

    total = len(results)
    avg_latency = sum(r.detection_latency_ms for r in results) / max(1, total)

    return BatchDetectionResult(
        total_records=total,
        normal_count=normal_cnt,
        malicious_count=malicious_cnt,
        threat_breakdown=threat_breakdown,
        risk_distribution=risk_distribution,
        alerts_created=alerts_created,
        avg_latency_ms=round(avg_latency, 3),
        results=results[:50] # return top 50 in preview
    )

@router.get("/events")
def list_security_events(
    limit: int = Query(50, ge=1, le=200),
    severity: Optional[str] = None,
    is_simulation: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty"]))
):
    query = db.query(SecurityEvent)
    if severity:
        query = query.filter(SecurityEvent.severity == severity)
    if is_simulation is not None:
        query = query.filter(SecurityEvent.is_simulation == is_simulation)

    events = query.order_by(SecurityEvent.timestamp.desc()).limit(limit).all()
    results = []
    for ev in events:
        results.append({
            "id": ev.id,
            "timestamp": ev.timestamp,
            "source_ip": ev.source_ip,
            "destination_ip": ev.destination_ip,
            "protocol": ev.protocol,
            "service": ev.service,
            "attack_category": ev.attack_category,
            "predicted_class": ev.predicted_class,
            "confidence": ev.confidence,
            "risk_score": ev.risk_score,
            "severity": ev.severity,
            "is_simulation": ev.is_simulation
        })
    return results
