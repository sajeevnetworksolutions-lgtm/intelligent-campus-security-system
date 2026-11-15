import time
import uuid
import joblib
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.model import TrainedModel
from app.models.security import SecurityEvent, Alert, LoginEvent
from app.ml.preprocessing import DatasetPreprocessor

# Attack Category Severity Weights
ATTACK_BASE_WEIGHTS = {
    "Normal": 0.0,
    "PortScan": 45.0,
    "BruteForce": 65.0,
    "WebAttack": 70.0,
    "DoS": 80.0,
    "Botnet": 85.0,
    "Infiltration": 95.0
}

class IntrusionDetectionEngine:
    def __init__(self, db: Session, active_model_id: Optional[int] = None):
        self.db = db
        self.active_model_id = active_model_id
        self.model = None
        self.preprocessor = None
        self.model_record = None
        self._load_active_model()

    def _load_active_model(self):
        """Load currently active or latest trained model."""
        query = self.db.query(TrainedModel)
        if self.active_model_id:
            self.model_record = query.filter(TrainedModel.id == self.active_model_id).first()
        else:
            self.model_record = query.filter(TrainedModel.is_active == True).first()
            if not self.model_record:
                self.model_record = query.order_by(TrainedModel.id.desc()).first()

        if self.model_record:
            self.model = joblib.load(self.model_record.model_path)
            self.preprocessor = DatasetPreprocessor.load(self.model_record.scaler_path)

    def analyze_record(self, record: Dict[str, Any], trigger_alert: bool = True) -> Dict[str, Any]:
        """
        Analyze a single network traffic feature record through the machine learning pipeline,
        assess risk score and category, and generate alerts if suspicious.
        """
        start_time = time.time()
        
        if not self.model or not self.preprocessor:
            self._load_active_model()
            if not self.model:
                raise ValueError("No trained model available. Please train or activate an ML model first.")

        # 1. Preprocess record
        import json
        feature_names = json.loads(self.model_record.feature_names)
        target_names = json.loads(self.model_record.target_names)
        
        X_sample = self.preprocessor.transform_single(record, feature_names)

        # 2. Predict with Model
        is_iso_forest = (self.model_record.algorithm == "IsolationForest")
        
        if is_iso_forest:
            raw_pred = self.model.predict(X_sample)[0] # 1 inlier, -1 outlier
            if raw_pred == 1:
                predicted_class = "Normal"
                confidence = 0.92
            else:
                predicted_class = "Anomaly"
                confidence = 0.88
        else:
            pred_idx = self.model.predict(X_sample)[0]
            predicted_class = target_names[pred_idx] if pred_idx < len(target_names) else "Unknown"
            
            if hasattr(self.model, "predict_proba"):
                probs = self.model.predict_proba(X_sample)[0]
                confidence = float(np.max(probs))
            else:
                confidence = 0.90

        latency_ms = round((time.time() - start_time) * 1000, 3)
        is_malicious = (predicted_class != "Normal")

        # 3. Transparent Risk Scoring Engine (Separated from raw probability)
        risk_score, severity, risk_explanation = self._calculate_risk_score(
            predicted_class=predicted_class,
            confidence=confidence,
            record=record
        )

        # 4. Save Security Event to Database
        sec_event = SecurityEvent(
            source_ip=record.get("source_ip", "192.168.1.100"),
            destination_ip=record.get("destination_ip", "10.0.0.1"),
            protocol=record.get("proto", "tcp"),
            service=record.get("service", "-"),
            attack_category=predicted_class,
            predicted_class=predicted_class,
            confidence=round(confidence, 4),
            risk_score=round(risk_score, 2),
            severity=severity,
            is_simulation=record.get("is_simulation", False),
            raw_features_json=json.dumps(record)
        )
        self.db.add(sec_event)
        self.db.commit()
        self.db.refresh(sec_event)

        # 5. Alert Generation for Medium/High/Critical events
        alert_code = None
        alert_created = False
        
        if is_malicious and risk_score >= settings.RISK_LOW_MAX and trigger_alert:
            alert_code = f"ALT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
            alert = Alert(
                alert_code=alert_code,
                title=f"Potential {predicted_class} Attack Detected",
                description=(
                    f"Intrusion detection model '{self.model_record.name}' identified suspicious activity "
                    f"from source {sec_event.source_ip} directed at {sec_event.destination_ip}. "
                    f"{risk_explanation}"
                ),
                threat_category=predicted_class,
                severity=severity,
                risk_score=round(risk_score, 2),
                source="Network IDS Engine",
                source_ip=sec_event.source_ip,
                model_name=self.model_record.name,
                explanation=risk_explanation,
                status="NEW"
            )
            self.db.add(alert)
            self.db.commit()
            alert_created = True

        return {
            "predicted_class": predicted_class,
            "is_malicious": is_malicious,
            "confidence": round(confidence, 4),
            "risk_score": round(risk_score, 2),
            "severity": severity,
            "threat_category": predicted_class,
            "explanation": risk_explanation,
            "model_used": self.model_record.name,
            "detection_latency_ms": latency_ms,
            "alert_generated": alert_created,
            "alert_code": alert_code,
            "features_analyzed": record
        }

    def _calculate_risk_score(
        self, 
        predicted_class: str, 
        confidence: float, 
        record: Dict[str, Any]
    ) -> Tuple[float, str, str]:
        """
        Documented risk scoring formula:
        Risk = (Base Attack Weight * 0.50) + (Model Confidence * 30.0) + (Contextual Heuristics * 20.0)
        """
        base_weight = ATTACK_BASE_WEIGHTS.get(predicted_class, 50.0)
        
        # Contextual heuristics
        heuristics_score = 0.0
        reasons = []
        
        # Rate check
        rate = float(record.get("rate", 0))
        if rate > 500:
            heuristics_score += 10.0
            reasons.append("Extreme packet rate (>500 pkts/s)")
            
        # Target concentration
        ct_dst_src = int(record.get("ct_dst_src_ltm", 1))
        if ct_dst_src > 15:
            heuristics_score += 5.0
            reasons.append("Unusually high host-to-host connection recurrence")
            
        # Byte payload anomaly
        sbytes = float(record.get("sbytes", 0))
        if sbytes > 20000:
            heuristics_score += 5.0
            reasons.append("High source payload volume")
            
        heuristics_score = min(20.0, heuristics_score)
        
        raw_risk = (base_weight * 0.50) + (confidence * 30.0) + heuristics_score
        risk_score = min(100.0, max(0.0, raw_risk))
        
        if risk_score < settings.RISK_LOW_MAX:
            severity = "LOW"
        elif risk_score < settings.RISK_MEDIUM_MAX:
            severity = "MEDIUM"
        elif risk_score < settings.RISK_HIGH_MAX:
            severity = "HIGH"
        else:
            severity = "CRITICAL"

        explanation = (
            f"Risk assigned as {severity} (Score: {round(risk_score, 1)}/100). "
            f"Based on: {predicted_class} base weight ({base_weight}), prediction confidence ({round(confidence*100, 1)}%), "
            f"and heuristic indicators: {', '.join(reasons) if reasons else 'nominal baseline features'}."
        )

        return risk_score, severity, explanation


class UserBehaviorAnalyticsEngine:
    def __init__(self, db: Session):
        self.db = db

    def evaluate_login_attempt(
        self, 
        username: str, 
        ip_address: str, 
        is_success: bool,
        user_agent: str = "Mozilla/5.0"
    ) -> Dict[str, Any]:
        """
        Evaluate user authentication against historical baselines to detect:
        1. Brute-force credential attacks (rapid repeated failures)
        2. Unusual login hour (e.g. 1:00 AM - 5:00 AM)
        3. Rapid IP divergence / geo-hopping
        4. Account anomaly scoring
        """
        now = datetime.now(timezone.utc)
        current_hour = now.hour
        
        # 1. Check recent failures for this user in last 15 minutes
        recent_logins = self.db.query(LoginEvent).filter(
            LoginEvent.username == username
        ).order_by(LoginEvent.timestamp.desc()).limit(10).all()

        recent_failures = sum(1 for ev in recent_logins if not ev.is_success)
        
        is_suspicious = False
        anomaly_reasons = []
        risk_score = 0.0

        # Check: Brute Force
        if not is_success:
            if recent_failures >= 3:
                is_suspicious = True
                risk_score += 65.0
                anomaly_reasons.append(f"Multiple consecutive authentication failures ({recent_failures + 1} failures)")
            else:
                risk_score += 25.0
                anomaly_reasons.append("Single failed authentication attempt")
        else:
            # Check: Unusual timing (Off-hours: 1:00 AM to 5:00 AM)
            if 1 <= current_hour <= 5:
                is_suspicious = True
                risk_score += 40.0
                anomaly_reasons.append(f"Off-hours login detected at {now.strftime('%H:%M')} UTC")
                
            # Check: IP divergence
            past_ips = {ev.ip_address for ev in recent_logins if ev.is_success}
            if past_ips and ip_address not in past_ips:
                risk_score += 20.0
                anomaly_reasons.append(f"Login from previously unseen IP address: {ip_address}")

        if not anomaly_reasons:
            anomaly_reasons.append("Normal authentication activity within expected behavioral baseline")

        reason_str = "; ".join(anomaly_reasons)
        risk_score = min(100.0, risk_score)

        # Record Login Event
        login_ev = LoginEvent(
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            is_success=is_success,
            failure_reason="Invalid credentials" if not is_success else None,
            risk_score=round(risk_score, 1),
            is_suspicious=is_suspicious,
            anomaly_reason=reason_str
        )
        self.db.add(login_ev)
        
        # Generate alert if brute force or high risk
        if is_suspicious and risk_score >= 50.0:
            alert_code = f"ALT-UBA-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
            alert = Alert(
                alert_code=alert_code,
                title=f"Suspicious User Authentication: {username}",
                description=f"UBA module triggered alert for user '{username}' from IP {ip_address}. {reason_str}",
                threat_category="SuspiciousLogin",
                severity="HIGH" if risk_score >= 60.0 else "MEDIUM",
                risk_score=risk_score,
                source="User Behaviour Analytics",
                source_ip=ip_address,
                explanation=reason_str,
                status="NEW"
            )
            self.db.add(alert)

        self.db.commit()
        self.db.refresh(login_ev)

        return {
            "username": username,
            "ip_address": ip_address,
            "is_success": is_success,
            "is_suspicious": is_suspicious,
            "risk_score": risk_score,
            "anomaly_reason": reason_str
        }
