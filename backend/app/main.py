import os
# Configure Matplotlib cache directory upfront to prevent slow cache regeneration
os.environ["MPLCONFIGDIR"] = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "results", ".matplotlib_cache"))
os.makedirs(os.environ["MPLCONFIGDIR"], exist_ok=True)

import json
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, Role
from app.models.dataset import DatasetRecord
from app.models.security import SecurityEvent, Alert, Incident, LoginEvent, SystemSetting

# Import all API routers
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.datasets import router as datasets_router
from app.api.routes.models import router as models_router
from app.api.routes.detection import router as detection_router
from app.api.routes.alerts import router as alerts_router
from app.api.routes.incidents import router as incidents_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.explainability import router as explainability_router
from app.api.routes.simulation import router as simulation_router
from app.api.routes.reports import router as reports_router
from app.api.routes.audit import router as audit_router
from app.api.routes.ws import router as ws_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        f"M.Tech Computer Science & Engineering Research Project.<br/>"
        f"<b>Candidate:</b> {settings.STUDENT_NAME} ({settings.STUDENT_USN}) | "
        f"<b>Supervisor:</b> {settings.GUIDE_NAME}<br/>"
        f"<b>Institution:</b> {settings.INSTITUTION}, {settings.UNIVERSITY}"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(datasets_router, prefix=settings.API_V1_STR)
app.include_router(models_router, prefix=settings.API_V1_STR)
app.include_router(detection_router, prefix=settings.API_V1_STR)
app.include_router(alerts_router, prefix=settings.API_V1_STR)
app.include_router(incidents_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(explainability_router, prefix=settings.API_V1_STR)
app.include_router(simulation_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(ws_router)

# Mount static files for results graphs and confusion matrices
static_dir = os.path.join(settings.BASE_DIR, "results")
if os.path.exists(static_dir):
    app.mount("/static/results", StaticFiles(directory=static_dir), name="results")

def startup_db_seed():
    """Create tables and initialize baseline seed data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Seed Roles
        roles_data = [
            ("Super Administrator", "Full system access, ML configuration, and user governance"),
            ("Security Administrator", "Threat triage, SOC monitoring, and incident response"),
            ("Faculty", "Campus departmental access and activity monitoring"),
            ("Student", "Personal access and authentication dashboard")
        ]
        for r_name, r_desc in roles_data:
            if not db.query(Role).filter(Role.name == r_name).first():
                db.add(Role(name=r_name, description=r_desc, permissions='["ALL"]'))
        db.commit()

        # 2. Seed Default Users
        users_seed = [
            ("admin", "admin@ssit.edu.in", "Super Administrator", "AdminPassword123!", "Super Administrator", "Cybersecurity Cell"),
            ("soc_analyst", "analyst@ssit.edu.in", "Security SOC Analyst", "AnalystPassword123!", "Security Administrator", "Network Operations"),
            ("faculty_user", "faculty@ssit.edu.in", "Prof. K. Ramesh", "FacultyPassword123!", "Faculty", "Computer Science & Engineering"),
            ("student_user", "student@ssit.edu.in", "Nalina G (25CSE09)", "StudentPassword123!", "Student", "Computer Science & Engineering")
        ]
        for uname, email, fname, pwd, role, dept in users_seed:
            if not db.query(User).filter(User.username == uname).first():
                db.add(User(
                    username=uname,
                    email=email,
                    full_name=fname,
                    hashed_password=get_password_hash(pwd),
                    role=role,
                    department=dept,
                    is_active=True
                ))
        db.commit()

        # 3. Register Benchmark Dataset if file exists
        benchmark_csv = os.path.join(settings.RAW_DATASETS_DIR, "campus_cybersecurity_benchmark.csv")
        if os.path.exists(benchmark_csv) and not db.query(DatasetRecord).filter(DatasetRecord.name == "CIC/UNSW Campus Benchmark").first():
            import pandas as pd
            df = pd.read_csv(benchmark_csv)
            dist = df["attack_cat"].value_counts().to_dict()
            db.add(DatasetRecord(
                name="CIC/UNSW Campus Benchmark",
                filename="campus_cybersecurity_benchmark.csv",
                file_path=benchmark_csv,
                file_size_bytes=os.path.getsize(benchmark_csv),
                row_count=len(df),
                col_count=len(df.columns),
                target_column="attack_cat",
                features_json=json.dumps(list(df.columns)),
                class_distribution=json.dumps({str(k): int(v) for k, v in dist.items()}),
                missing_values_count=0,
                duplicate_rows_count=0,
                is_validated=True,
                is_benchmark=True,
                description="Standardized benchmark dataset conforming to UNSW-NB15 and CIC-IDS2017 feature schemas."
            ))
            db.commit()

        # 4. Seed Baseline Security Events if empty
        if db.query(SecurityEvent).count() == 0:
            now = datetime.now(timezone.utc)
            sample_events = [
                ("172.16.10.15", "10.10.1.25", "tcp", "http", "Normal", "Normal", 0.99, 12.5, "LOW", False),
                ("172.16.10.18", "10.10.1.25", "tcp", "https", "Normal", "Normal", 0.98, 14.0, "LOW", False),
                ("198.51.100.88", "10.10.1.10", "tcp", "http", "DoS", "DoS", 0.97, 88.5, "CRITICAL", False),
                ("203.0.113.44", "10.10.2.100", "tcp", "-", "PortScan", "PortScan", 0.96, 62.0, "MEDIUM", False),
                ("198.51.100.12", "10.10.1.5", "tcp", "ssh", "BruteForce", "BruteForce", 0.94, 76.0, "HIGH", False),
                ("192.0.2.77", "10.10.1.20", "tcp", "http", "WebAttack", "WebAttack", 0.93, 72.0, "HIGH", False),
                ("10.10.5.112", "203.0.113.99", "tcp", "http", "Botnet", "Botnet", 0.95, 84.0, "HIGH", False),
                ("172.16.12.30", "10.10.1.8", "udp", "dns", "Normal", "Normal", 0.99, 10.0, "LOW", False),
                ("172.16.14.22", "10.10.1.25", "tcp", "https", "Normal", "Normal", 0.97, 15.0, "LOW", False)
            ]
            for s_ip, d_ip, proto, srv, cat, pred, conf, r_score, sev, sim in sample_events:
                db.add(SecurityEvent(
                    timestamp=now - timedelta(minutes=int(conf*30)),
                    source_ip=s_ip,
                    destination_ip=d_ip,
                    protocol=proto,
                    service=srv,
                    attack_category=cat,
                    predicted_class=pred,
                    confidence=conf,
                    risk_score=r_score,
                    severity=sev,
                    is_simulation=sim
                ))
            db.commit()

        # 5. Seed Baseline Alerts if empty
        if db.query(Alert).count() == 0:
            now = datetime.now(timezone.utc)
            db.add(Alert(
                alert_code="ALT-20261115-DOS01",
                timestamp=now - timedelta(minutes=25),
                title="Potential DoS Attack Detected",
                description="High volume SYN packets targeting institutional web portal from 198.51.100.88.",
                threat_category="DoS",
                severity="CRITICAL",
                risk_score=88.5,
                source="Network IDS Engine",
                source_ip="198.51.100.88",
                model_name="Random Forest IDS",
                explanation="Exceeded 500 pkts/s with zero TCP ACK replies.",
                status="NEW"
            ))
            db.add(Alert(
                alert_code="ALT-20261115-PS02",
                timestamp=now - timedelta(minutes=45),
                title="Suspicious Port Scanning Detected",
                description="Sequential connection probing across ports 20-1024 from 203.0.113.44.",
                threat_category="PortScan",
                severity="MEDIUM",
                risk_score=62.0,
                source="Network IDS Engine",
                source_ip="203.0.113.44",
                model_name="Random Forest IDS",
                explanation="High destination port entropy with zero data exchange.",
                status="INVESTIGATING"
            ))
            db.commit()

        # 6. Seed Baseline Incident
        if db.query(Incident).count() == 0:
            db.add(Incident(
                incident_number="INC-20261115-001",
                title="Mitigation of DoS SYN Flood on Campus Portal",
                description="Investigating distributed syn flood targeting core gateway 10.10.1.10.",
                severity="HIGH",
                status="INVESTIGATING",
                assigned_to="Security SOC Analyst",
                root_cause="External unauthorized botnet node conducting SYN flood.",
                mitigation_steps="Temporary rate-limiting applied at upstream edge switch."
            ))
            db.commit()

    finally:
        db.close()

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "academic_affiliation": f"{settings.INSTITUTION}, {settings.UNIVERSITY}",
        "student": f"{settings.STUDENT_NAME} ({settings.STUDENT_USN})",
        "guide": settings.GUIDE_NAME,
        "status": "OPERATIONAL",
        "docs_url": "/docs",
        "api_version": "v1"
    }
