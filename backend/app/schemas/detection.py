from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class NetworkRecordInput(BaseModel):
    source_ip: Optional[str] = "192.168.1.105"
    destination_ip: Optional[str] = "10.0.0.1"
    dur: float = 0.05
    proto: str = "tcp"
    service: str = "http"
    spkts: int = 10
    dpkts: int = 8
    sbytes: int = 1200
    dbytes: int = 2400
    rate: float = 360.0
    sttl: int = 64
    dttl: int = 64
    sload: float = 192000.0
    dload: float = 384000.0
    sloss: int = 0
    dloss: int = 0
    sjit: float = 0.5
    djit: float = 0.4
    swin: int = 255
    dwin: int = 255
    tcprtt: float = 0.02
    synack: float = 0.008
    ackdat: float = 0.012
    smean: float = 120.0
    dmean: float = 300.0
    ct_srv_src: int = 2
    ct_state_ttl: int = 1
    ct_dst_ltm: int = 2
    ct_src_dport_ltm: int = 2
    ct_dst_sport_ltm: int = 1
    ct_dst_src_ltm: int = 2
    is_simulation: Optional[bool] = False

class DetectionResultOut(BaseModel):
    predicted_class: str
    is_malicious: bool
    confidence: float
    risk_score: float
    severity: str
    threat_category: str
    explanation: str
    model_used: str
    detection_latency_ms: float
    alert_generated: bool
    alert_code: Optional[str] = None
    features_analyzed: Dict[str, Any]

class BatchDetectionResult(BaseModel):
    total_records: int
    normal_count: int
    malicious_count: int
    threat_breakdown: Dict[str, int]
    risk_distribution: Dict[str, int]
    alerts_created: int
    avg_latency_ms: float
    results: List[DetectionResultOut]
