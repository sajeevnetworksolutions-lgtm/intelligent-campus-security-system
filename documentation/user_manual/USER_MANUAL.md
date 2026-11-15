# CAMPUS SOC PLATFORM USER MANUAL

**PROJECT:** AN INTELLIGENT CAMPUS SECURITY SYSTEM FOR CYBERSECURITY APPLICATIONS  
**SSIT TUMAKURU** — Department of Computer Science and Engineering  

---

## 1. Authentication & Role-Based Access Control

The application implements four distinct user tiers:

| Role | Username | Default Password | Permissions |
|---|---|---|---|
| **Super Administrator** | `admin` | `AdminPassword123!` | Full governance, dataset management, ML retraining, user deletion, audit reviews. |
| **Security Administrator** | `soc_analyst` | `AnalystPassword123!` | Threat triage, alert response, incident case management, live monitoring. |
| **Faculty** | `faculty_user` | `FacultyPassword123!` | Campus asset monitoring, departmental event viewing, report generation. |
| **Student** | `student_user` | `StudentPassword123!` | Personal account authentication and access telemetry. |

---

## 2. Navigating the 14 SOC Pages

### 2.1 Overview (`/`)
Displays key performance indicators: total monitored events, total threats detected, critical alert counts, active model accuracy, real-time area chart of traffic volume over the past 6 hours, threat category breakdown pie chart, and recent security events.

### 2.2 Live Threat Monitoring (`/live-threats`)
Real-time streaming table capturing network flow records. Features pause/resume controls, severity filters (Critical, High, Medium, Low), and a packet inspector modal revealing all flow attributes.

### 2.3 Network Intrusion Detection (`/detection`)
Provides two operational modes:
1. **Single Record Analysis:** Enter flow parameters (`dur`, `proto`, `service`, `spkts`, `sbytes`, `rate`, `sttl`, `tcprtt`, etc.) and click *Run IDS Prediction* to receive the predicted class, confidence percentage, risk score, and plain-English risk rationale.
2. **Batch CSV Traffic Ingestion:** Upload an authorized campus network traffic capture file (`.csv`) to process up to 200 records in batch with aggregated threat counts.

### 2.4 User Behaviour Analytics (`/uba`)
Tracks user authentication trends, highlighting brute-force patterns (repeated failed logins), off-hour logins (access between 1:00 AM and 5:00 AM), and sudden IP address hopping.

### 2.5 Alerts & Notifications (`/alerts`)
Triage center for security alerts. Analysts can filter by severity and status (`NEW`, `INVESTIGATING`, `RESOLVED`, `FALSE_POSITIVE`), record investigation notes, and escalate any alert to an Incident Case with a single click.

### 2.6 Incident Management (`/incidents`)
Case management workspace for major security incidents. Allows assigning investigators, updating status (`OPEN`, `INVESTIGATING`, `CONTAINED`, `RESOLVED`, `CLOSED`), recording root cause findings, and appending chronological investigation notes.

### 2.7 Dataset Management (`/datasets`)
Upload new CSV datasets, validate schema columns, examine class distribution ratios, analyze missing values, and inspect data previews before training.

### 2.8 ML Model Training (`/training`)
Train or retrain any supported algorithm (*Random Forest*, *Decision Tree*, *SVM*, *Isolation Forest*, *XGBoost*). Configure hyperparameters (estimators, max depth, contamination), observe execution duration, and activate the best model for live operational inference.

### 2.9 Model Comparison (`/comparison`)
Displays the empirical research comparison table comparing all 5 algorithms across Accuracy, Precision, Recall, F1-Score, False Positive Rate (FPR), per-sample Detection Latency, and training duration, highlighting the objectively recommended best model.

### 2.10 Explainable AI (`/xai`)
Select test scenarios (DoS, Port Scan, Normal) to generate local **SHAP** feature attribution bar plots and **LIME** local surrogate rules, demonstrating why a model classified traffic as malicious.

### 2.11 Live Simulation (`/simulation`)
A safe sandbox environment allowing administrators to trigger realistic simulated attack traffic (SYN flood, Nmap port scan, SSH brute force, SQL injection, Botnet C2, lateral infiltration) and verify end-to-end alert dispatch without generating destructive real-world traffic.

### 2.12 User Management (`/users`)
Super Administrator interface to provision accounts, assign RBAC roles, and lock/unlock compromised accounts.

### 2.13 Audit Logs (`/audit`)
Tamper-evident chronological log of every administrative event, login, retraining action, and policy modification.

### 2.14 Reports & Analytics (`/reports`)
Download publication-grade **PDF Research Evaluation Reports** and **CSV experiment data** containing genuine results for academic submission.
