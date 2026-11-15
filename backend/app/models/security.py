from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class SecurityEvent(Base):
    __tablename__ = "security_events"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    source_ip = Column(String(50), nullable=False)
    destination_ip = Column(String(50), nullable=False)
    protocol = Column(String(20), default="tcp")
    service = Column(String(30), default="-")
    attack_category = Column(String(50), default="Normal")
    predicted_class = Column(String(50), default="Normal")
    confidence = Column(Float, default=1.0)
    risk_score = Column(Float, default=0.0)
    severity = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    is_simulation = Column(Boolean, default=False)
    raw_features_json = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class LoginEvent(Base):
    __tablename__ = "login_events"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    username = Column(String(50), nullable=False, index=True)
    ip_address = Column(String(50), nullable=False)
    user_agent = Column(String(255))
    is_success = Column(Boolean, default=True)
    failure_reason = Column(String(100), nullable=True)
    location = Column(String(100), default="Campus Wi-Fi / Internal Subnet")
    risk_score = Column(Float, default=0.0)
    is_suspicious = Column(Boolean, default=False)
    anomaly_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String(50), unique=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    threat_category = Column(String(50), nullable=False) # DoS, PortScan, BruteForce, Botnet, WebAttack, Infiltration, SuspiciousLogin
    severity = Column(String(20), nullable=False)        # LOW, MEDIUM, HIGH, CRITICAL
    risk_score = Column(Float, default=0.0)
    source = Column(String(100), default="Network IDS")
    source_ip = Column(String(50), nullable=True)
    model_name = Column(String(50), nullable=True)
    explanation = Column(Text, nullable=True)
    status = Column(String(20), default="NEW")           # NEW, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    resolution_notes = Column(Text, nullable=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    incident = relationship("Incident", back_populates="alerts")

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_number = Column(String(50), unique=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="HIGH")        # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(20), default="OPEN")          # OPEN, INVESTIGATING, CONTAINED, RESOLVED, CLOSED
    assigned_to = Column(String(100), default="Security Admin")
    root_cause = Column(Text, nullable=True)
    mitigation_steps = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    alerts = relationship("Alert", back_populates="incident")
    notes = relationship("IncidentNote", back_populates="incident", cascade="all, delete-orphan")

class IncidentNote(Base):
    __tablename__ = "incident_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    author_name = Column(String(100), nullable=False)
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    incident = relationship("Incident", back_populates="notes")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    username = Column(String(50), nullable=False)
    user_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False) # LOGIN, UPLOAD_DATASET, TRAIN_MODEL, CHANGE_STATUS, etc.
    resource = Column(String(100), nullable=False)
    details_json = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")

class SystemSetting(Base):
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(255))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
