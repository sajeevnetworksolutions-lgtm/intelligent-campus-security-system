from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, require_roles
from app.models.user import User
from app.models.model import TrainedModel
from app.models.security import SecurityEvent, Alert, Incident, LoginEvent
from app.schemas.analytics import SOCSummaryKPI, ThreatDistributionItem, TrafficTimelineItem, UBAProfileOut

router = APIRouter(prefix="/analytics", tags=["SOC Analytics"])

@router.get("/overview", response_model=SOCSummaryKPI)
def get_soc_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty", "Student"]))
):
    total_events = db.query(SecurityEvent).count()
    malicious_events = db.query(SecurityEvent).filter(SecurityEvent.attack_category != "Normal").count()
    critical_alerts = db.query(Alert).filter(Alert.severity == "CRITICAL", Alert.status != "RESOLVED").count()
    high_incidents = db.query(Incident).filter(Incident.severity.in_(["HIGH", "CRITICAL"]), Incident.status != "CLOSED").count()
    
    suspicious_logins = db.query(LoginEvent).filter(LoginEvent.is_suspicious == True).count()
    active_users = db.query(User).filter(User.is_active == True).count()

    normal_pct = 100.0
    if total_events > 0:
        normal_pct = round(((total_events - malicious_events) / total_events) * 100, 2)

    active_model = db.query(TrainedModel).filter(TrainedModel.is_active == True).first()
    if not active_model:
        active_model = db.query(TrainedModel).order_by(TrainedModel.id.desc()).first()

    accuracy = active_model.accuracy if active_model else 0.985
    m_name = active_model.name if active_model else "Random Forest IDS"
    m_algo = active_model.algorithm if active_model else "RandomForest"

    return SOCSummaryKPI(
        total_events=total_events,
        total_threats=malicious_events,
        critical_alerts=critical_alerts,
        high_risk_incidents=high_incidents,
        normal_traffic_pct=normal_pct,
        suspicious_login_attempts=suspicious_logins,
        active_model_accuracy=round(accuracy * 100, 2),
        active_users=active_users,
        active_model_name=m_name,
        active_model_algorithm=m_algo
    )

@router.get("/threat-distribution", response_model=List[ThreatDistributionItem])
def get_threat_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty"]))
):
    counts = db.query(
        SecurityEvent.attack_category, 
        func.count(SecurityEvent.id)
    ).group_by(SecurityEvent.attack_category).all()
    
    total = sum(c[1] for c in counts) if counts else 1
    results = []
    
    for cat, cnt in counts:
        pct = round((cnt / total) * 100, 2)
        risk = "Benign" if cat == "Normal" else ("High" if cat in ["DoS", "Botnet", "Infiltration"] else "Medium")
        results.append(ThreatDistributionItem(
            category=cat,
            count=cnt,
            percentage=pct,
            risk_level=risk
        ))
        
    return results

@router.get("/timeline", response_model=List[TrafficTimelineItem])
def get_traffic_timeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty"]))
):
    # Group recent events into time intervals (hourly slices)
    now = datetime.now(timezone.utc)
    results = []
    
    for i in range(6, -1, -1):
        window_start = now - timedelta(hours=i+1)
        window_end = now - timedelta(hours=i)
        
        events = db.query(SecurityEvent).filter(
            SecurityEvent.timestamp >= window_start,
            SecurityEvent.timestamp < window_end
        ).all()
        
        norm_cnt = sum(1 for e in events if e.attack_category == "Normal")
        mal_cnt = sum(1 for e in events if e.attack_category != "Normal")
        alert_cnt = sum(1 for e in events if e.risk_score >= 50.0)
        
        results.append(TrafficTimelineItem(
            time_label=window_end.strftime("%H:%M"),
            normal_count=norm_cnt,
            malicious_count=mal_cnt,
            alert_count=alert_cnt
        ))
        
    return results

@router.get("/uba-profiles", response_model=List[UBAProfileOut])
def get_uba_profiles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    users = db.query(User).all()
    profiles = []
    
    for u in users:
        logins = db.query(LoginEvent).filter(LoginEvent.username == u.username).all()
        total_l = len(logins)
        failed_l = sum(1 for l in logins if not l.is_success)
        suspicious_l = sum(1 for l in logins if l.is_suspicious)
        succ_rate = round(((total_l - failed_l) / max(1, total_l)) * 100, 1) if total_l > 0 else 100.0
        
        risk = "Low"
        if suspicious_l > 0 or failed_l >= 3:
            risk = "High" if failed_l >= 5 else "Medium"
            
        anomalies = []
        for l in logins:
            if l.is_suspicious and l.anomaly_reason:
                for r in l.anomaly_reason.split("; "):
                    if r not in anomalies and r != "Normal authentication activity within expected behavioral baseline":
                        anomalies.append(r)
                        
        last_ip = logins[-1].ip_address if logins else "10.0.1.15"
        last_act = logins[-1].timestamp.strftime("%Y-%m-%d %H:%M") if logins else "No recent login"
        
        profiles.append(UBAProfileOut(
            username=u.username,
            total_logins=total_l,
            failed_logins=failed_l,
            success_rate_pct=succ_rate,
            suspicious_events_count=suspicious_l,
            risk_rating=risk,
            last_known_ip=last_ip,
            last_activity=last_act,
            anomalies_detected=anomalies[:4]
        ))
        
    return profiles
