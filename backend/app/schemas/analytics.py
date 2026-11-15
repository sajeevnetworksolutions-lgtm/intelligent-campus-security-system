from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class SOCSummaryKPI(BaseModel):
    total_events: int
    total_threats: int
    critical_alerts: int
    high_risk_incidents: int
    normal_traffic_pct: float
    suspicious_login_attempts: int
    active_model_accuracy: float
    active_users: int
    active_model_name: str
    active_model_algorithm: str

class ThreatDistributionItem(BaseModel):
    category: str
    count: int
    percentage: float
    risk_level: str

class TrafficTimelineItem(BaseModel):
    time_label: str
    normal_count: int
    malicious_count: int
    alert_count: int

class UBAProfileOut(BaseModel):
    username: str
    total_logins: int
    failed_logins: int
    success_rate_pct: float
    suspicious_events_count: int
    risk_rating: str
    last_known_ip: str
    last_activity: str
    anomalies_detected: List[str]
