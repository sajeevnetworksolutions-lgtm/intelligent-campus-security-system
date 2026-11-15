import random
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.user import User
from app.detection.engine import IntrusionDetectionEngine, UserBehaviorAnalyticsEngine

router = APIRouter(prefix="/simulation", tags=["Security Simulation"])

SIMULATION_SCENARIOS = {
    "normal_web_browse": {
        "title": "Normal Campus Web Browsing (HTTPS/HTTP)",
        "type": "network",
        "record": {
            "source_ip": "172.16.20.45",
            "destination_ip": "10.10.1.20",
            "dur": 1.25,
            "proto": "tcp",
            "service": "https",
            "spkts": 22,
            "dpkts": 28,
            "sbytes": 3500,
            "dbytes": 18200,
            "rate": 40.0,
            "sttl": 64,
            "dttl": 64,
            "sload": 22400.0,
            "dload": 116480.0,
            "sloss": 0,
            "dloss": 0,
            "sjit": 1.2,
            "djit": 1.1,
            "swin": 255,
            "dwin": 255,
            "tcprtt": 0.025,
            "synack": 0.010,
            "ackdat": 0.015,
            "smean": 159.0,
            "dmean": 650.0,
            "ct_srv_src": 2,
            "ct_state_ttl": 0,
            "ct_dst_ltm": 2,
            "ct_src_dport_ltm": 2,
            "ct_dst_sport_ltm": 1,
            "ct_dst_src_ltm": 2,
            "is_simulation": True
        }
    },
    "dos_syn_flood": {
        "title": "Denial-of-Service (TCP SYN Flood)",
        "type": "network",
        "record": {
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
            "ct_dst_src_ltm": 52,
            "is_simulation": True
        }
    },
    "nmap_port_scan": {
        "title": "Reconnaissance (Nmap Aggressive Port Scan)",
        "type": "network",
        "record": {
            "source_ip": "203.0.113.44",
            "destination_ip": "10.10.2.100",
            "dur": 0.001,
            "proto": "tcp",
            "service": "-",
            "spkts": 2,
            "dpkts": 0,
            "sbytes": 88,
            "dbytes": 0,
            "rate": 2000.0,
            "sttl": 255,
            "dttl": 0,
            "sload": 704000.0,
            "dload": 0.0,
            "sloss": 0,
            "dloss": 0,
            "sjit": 0.0,
            "djit": 0.0,
            "swin": 1024,
            "dwin": 0,
            "tcprtt": 0.0,
            "synack": 0.0,
            "ackdat": 0.0,
            "smean": 44.0,
            "dmean": 0.0,
            "ct_srv_src": 35,
            "ct_state_ttl": 2,
            "ct_dst_ltm": 35,
            "ct_src_dport_ltm": 38,
            "ct_dst_sport_ltm": 1,
            "ct_dst_src_ltm": 35,
            "is_simulation": True
        }
    },
    "ssh_brute_force": {
        "title": "Credential Brute Force (SSH Port 22 Password Guessing)",
        "type": "network",
        "record": {
            "source_ip": "198.51.100.12",
            "destination_ip": "10.10.1.5",
            "dur": 3.8,
            "proto": "tcp",
            "service": "ssh",
            "spkts": 28,
            "dpkts": 26,
            "sbytes": 3800,
            "dbytes": 3200,
            "rate": 14.2,
            "sttl": 64,
            "dttl": 64,
            "sload": 8000.0,
            "dload": 6736.0,
            "sloss": 2,
            "dloss": 1,
            "sjit": 1.4,
            "djit": 1.2,
            "swin": 255,
            "dwin": 255,
            "tcprtt": 0.045,
            "synack": 0.018,
            "ackdat": 0.027,
            "smean": 135.0,
            "dmean": 123.0,
            "ct_srv_src": 18,
            "ct_state_ttl": 1,
            "ct_dst_ltm": 14,
            "ct_src_dport_ltm": 14,
            "ct_dst_sport_ltm": 1,
            "ct_dst_src_ltm": 18,
            "is_simulation": True
        }
    },
    "sql_injection_web": {
        "title": "Web Application Attack (SQL Injection / XSS)",
        "type": "network",
        "record": {
            "source_ip": "192.0.2.77",
            "destination_ip": "10.10.1.20",
            "dur": 0.45,
            "proto": "tcp",
            "service": "http",
            "spkts": 18,
            "dpkts": 14,
            "sbytes": 9400,
            "dbytes": 4200,
            "rate": 71.1,
            "sttl": 64,
            "dttl": 64,
            "sload": 167111.0,
            "dload": 74666.0,
            "sloss": 0,
            "dloss": 0,
            "sjit": 0.8,
            "djit": 0.6,
            "swin": 255,
            "dwin": 255,
            "tcprtt": 0.032,
            "synack": 0.014,
            "ackdat": 0.018,
            "smean": 522.0,
            "dmean": 300.0,
            "ct_srv_src": 6,
            "ct_state_ttl": 1,
            "ct_dst_ltm": 5,
            "ct_src_dport_ltm": 4,
            "ct_dst_sport_ltm": 1,
            "ct_dst_src_ltm": 6,
            "is_simulation": True
        }
    },
    "botnet_c2_beacon": {
        "title": "Botnet Command & Control (Periodic Beaconing)",
        "type": "network",
        "record": {
            "source_ip": "10.10.5.112",
            "destination_ip": "203.0.113.99",
            "dur": 18.5,
            "proto": "tcp",
            "service": "http",
            "spkts": 10,
            "dpkts": 8,
            "sbytes": 1200,
            "dbytes": 1800,
            "rate": 0.97,
            "sttl": 128,
            "dttl": 128,
            "sload": 518.0,
            "dload": 778.0,
            "sloss": 0,
            "dloss": 0,
            "sjit": 32.0,
            "djit": 28.0,
            "swin": 255,
            "dwin": 255,
            "tcprtt": 0.11,
            "synack": 0.05,
            "ackdat": 0.06,
            "smean": 120.0,
            "dmean": 225.0,
            "ct_srv_src": 4,
            "ct_state_ttl": 1,
            "ct_dst_ltm": 3,
            "ct_src_dport_ltm": 2,
            "ct_dst_sport_ltm": 1,
            "ct_dst_src_ltm": 3,
            "is_simulation": True
        }
    },
    "lateral_infiltration": {
        "title": "Privilege Infiltration / Unauthorized Lateral Movement",
        "type": "network",
        "record": {
            "source_ip": "10.10.3.50",
            "destination_ip": "10.10.1.2",
            "dur": 9.2,
            "proto": "tcp",
            "service": "ssh",
            "spkts": 45,
            "dpkts": 40,
            "sbytes": 14000,
            "dbytes": 18500,
            "rate": 9.24,
            "sttl": 64,
            "dttl": 64,
            "sload": 12173.0,
            "dload": 16086.0,
            "sloss": 0,
            "dloss": 0,
            "sjit": 2.5,
            "djit": 2.2,
            "swin": 255,
            "dwin": 255,
            "tcprtt": 0.05,
            "synack": 0.02,
            "ackdat": 0.03,
            "smean": 311.0,
            "dmean": 462.0,
            "ct_srv_src": 8,
            "ct_state_ttl": 1,
            "ct_dst_ltm": 6,
            "ct_src_dport_ltm": 5,
            "ct_dst_sport_ltm": 1,
            "ct_dst_src_ltm": 7,
            "is_simulation": True
        }
    }
}

@router.get("/scenarios")
def list_scenarios(
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator", "Faculty"]))
):
    items = []
    for code, sc in SIMULATION_SCENARIOS.items():
        items.append({
            "scenario_code": code,
            "title": sc["title"],
            "type": sc["type"]
        })
    return items

@router.post("/trigger/{scenario_code}")
def trigger_simulation(
    scenario_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    if scenario_code not in SIMULATION_SCENARIOS:
        raise HTTPException(status_code=404, detail="Simulation scenario not found")

    sc = SIMULATION_SCENARIOS[scenario_code]
    engine = IntrusionDetectionEngine(db)
    
    result = engine.analyze_record(sc["record"], trigger_alert=True)
    return {
        "status": "SIMULATION_EXECUTED",
        "scenario": sc["title"],
        "detection_outcome": result
    }

@router.post("/trigger-uba-attack")
def trigger_uba_simulation(
    username: str = "student_test_user",
    attack_type: str = "brute_force", # brute_force or off_hours
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    uba = UserBehaviorAnalyticsEngine(db)
    results = []
    
    if attack_type == "brute_force":
        for i in range(5):
            res = uba.evaluate_login_attempt(
                username=username,
                ip_address=f"198.51.100.{20+i}",
                is_success=False,
                user_agent="Automated Script / Hydra v9.1"
            )
            results.append(res)
    else: # off_hours
        res = uba.evaluate_login_attempt(
            username=username,
            ip_address="203.0.113.10",
            is_success=True,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64)"
        )
        results.append(res)

    return {
        "status": "UBA_SIMULATION_EXECUTED",
        "attack_type": attack_type,
        "target_user": username,
        "results": results
    }
