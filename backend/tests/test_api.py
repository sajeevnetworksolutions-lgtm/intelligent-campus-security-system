import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from app.main import app, startup_db_seed

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    startup_db_seed()

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert "Nalina G" in data["student"]

def test_auth_login_success():
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "AdminPassword123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "Super Administrator"

def test_auth_login_invalid_password():
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "WrongPassword999!"
    })
    assert response.status_code == 401

def test_rbac_student_forbidden_admin_endpoint():
    # Login as student
    login_resp = client.post("/api/auth/login", json={
        "username": "student_user",
        "password": "StudentPassword123!"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Student tries to list all user accounts (allowed only for Admins)
    resp = client.get("/api/users", headers=headers)
    assert resp.status_code == 403

def test_analytics_overview():
    login_resp = client.post("/api/auth/login", json={
        "username": "soc_analyst",
        "password": "AnalystPassword123!"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/analytics/overview", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_events"] >= 0
    assert "active_model_accuracy" in data

def test_models_list_and_comparison():
    login_resp = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "AdminPassword123!"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # List models
    resp = client.get("/api/models", headers=headers)
    assert resp.status_code == 200
    models = resp.json()
    assert len(models) >= 4

    # Compare models
    comp_resp = client.get("/api/models/compare", headers=headers)
    assert comp_resp.status_code == 200
    comparisons = comp_resp.json()
    assert len(comparisons) >= 4
    # Check that at least one is recommended
    assert any(c["is_recommended"] for c in comparisons)

def test_detection_analyze_record():
    login_resp = client.post("/api/auth/login", json={
        "username": "soc_analyst",
        "password": "AnalystPassword123!"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    sample_record = {
        "source_ip": "198.51.100.88",
        "destination_ip": "10.10.1.10",
        "dur": 0.002,
        "proto": "tcp",
        "service": "http",
        "spkts": 240,
        "dpkts": 2,
        "sbytes": 12000,
        "dbytes": 80,
        "rate": 121000.0,
        "sttl": 64,
        "dttl": 0,
        "sload": 48000000.0,
        "dload": 320000.0,
        "sloss": 80,
        "dloss": 0,
        "sjit": 0.1,
        "djit": 0.0,
        "swin": 0,
        "dwin": 0,
        "tcprtt": 0.45,
        "synack": 0.40,
        "ackdat": 0.0,
        "smean": 50.0,
        "dmean": 40.0,
        "ct_srv_src": 55,
        "ct_state_ttl": 2,
        "ct_dst_ltm": 48,
        "ct_src_dport_ltm": 42,
        "ct_dst_sport_ltm": 1,
        "ct_dst_src_ltm": 52
    }
    resp = client.post("/api/detection/analyze", json=sample_record, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "predicted_class" in data
    assert "risk_score" in data
    assert "severity" in data

def test_explainability_shap():
    login_resp = client.post("/api/auth/login", json={
        "username": "soc_analyst",
        "password": "AnalystPassword123!"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    sample_record = {
        "dur": 0.05,
        "proto": "tcp",
        "service": "http",
        "spkts": 10,
        "dpkts": 8,
        "sbytes": 1200,
        "dbytes": 2400
    }
    resp = client.post("/api/explainability/shap", json=sample_record, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "feature_contributions" in data
    assert "summary_text" in data

def test_alerts_and_incident_flow():
    login_resp = client.post("/api/auth/login", json={
        "username": "soc_analyst",
        "password": "AnalystPassword123!"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch alerts
    resp = client.get("/api/alerts", headers=headers)
    assert resp.status_code == 200
    alerts = resp.json()
    assert len(alerts) > 0
    first_alert = alerts[0]

    # Promote to incident
    inc_resp = client.post(f"/api/alerts/{first_alert['id']}/create-incident", headers=headers)
    assert inc_resp.status_code == 200
    inc_data = inc_resp.json()
    assert "incident_number" in inc_data

    # Add note to incident
    note_resp = client.post(f"/api/incidents/{inc_data['id']}/notes?note_text=Automated+containment+verification+passed", headers=headers)
    assert note_resp.status_code == 200
