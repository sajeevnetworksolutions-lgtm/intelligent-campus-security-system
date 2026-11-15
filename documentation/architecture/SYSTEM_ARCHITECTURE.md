# SYSTEM ARCHITECTURE & TECHNICAL SPECIFICATION

**PROJECT:** AN INTELLIGENT CAMPUS SECURITY SYSTEM FOR CYBERSECURITY APPLICATIONS  
**ACADEMIC DEGREE:** M.Tech in Computer Science and Engineering  
**INSTITUTION:** Sri Siddhartha Institute of Technology (SSIT), Tumakuru  
**UNIVERSITY:** Sri Siddhartha Academy of Higher Education (SSAHE)  
**CANDIDATE:** Nalina G (25CSE09)  
**GUIDE:** Dr. Nirmala G, Associate Professor  

---

## 1. High-Level Architecture Overview

The system is architected as an end-to-end, multi-tier, AI-driven Security Operations Center (SOC) framework specifically designed for campus digital networks. It integrates network packet flow ingestion, automated feature normalization, multi-algorithm machine learning classification, unsupervised zero-day anomaly detection, explainable AI, human-in-the-loop incident resolution, and role-based access control.

```
+-----------------------------------------------------------------------------------------+
|                                    CAMPUS DATA SOURCES                                  |
|   (Core Gateway, Wi-Fi Subnets, Lab LANs, Student/Faculty Portals, LMS, Auth Servers)   |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                 DATA COLLECTION MODULE                                  |
|         (Authorized Packet Capture Ingestion, Benchmark UNSW-NB15 / CIC-IDS2017)        |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                   DATA PREPROCESSING                                    |
|   (Deduplication, Median Imputation, Label Encoding, StandardScaler - No Data Leakage)   |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                    FEATURE EXTRACTION                                   |
| (Duration, Packet Counts, Byte Transfer, Flow Rates, TCP Timings, Connection Frequency) |
+-----------------------------------------------------------------------------------------+
                                             |
         +-----------------------------------+-----------------------------------+
         |                                   |                                   |
         v                                   v                                   v
+------------------+                +------------------+                +------------------+
|  SUPERVISED ML   |                |  UNSUPERVISED    |                |  USER BEHAVIOR   |
|  - Random Forest |                |  - Isolation     |                |  - Brute Force   |
|  - Decision Tree |                |    Forest        |                |  - Off-Hours     |
|  - SVM (RBF)     |                |    (Novelty/     |                |  - Geo/IP Hop    |
|  - XGBoost       |                |     Zero-Day)    |                |                  |
+------------------+                +------------------+                +------------------+
         |                                   |                                   |
         +-----------------------------------+-----------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                  RISK ANALYSIS ENGINE                                   |
|  Score = (Attack Base * 0.50) + (Model Confidence * 30.0) + (Contextual Heuristics * 20) |
|               Severity Bands: LOW (<35) | MEDIUM (35-65) | HIGH (65-85) | CRITICAL (>85) |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                EXPLAINABLE AI (XAI) ENGINE                              |
|           - SHAP (TreeExplainer / KernelExplainer): Local Feature Attributions         |
|           - LIME (LimeTabularExplainer): Local Linear Decision Boundary Surrogates      |
|           - Plain-English Cyber Security Analyst Interpretability Engine                |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                SECURITY EVENT MANAGEMENT                                |
|        (PostgreSQL / SQLite Event Storage, Audit Logging, State Machine Triage)         |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                 ALERT GENERATION ENGINE                                 |
|            (Automated Deduplication, Alert Codes, WebSocket Push Notifications)         |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                           CENTRALIZED SOC DASHBOARD (FRONTEND)                          |
|         (React, TypeScript, Tailwind CSS, Recharts, Live Telemetry Visualizer)          |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                        ADMINISTRATOR INVESTIGATION & INCIDENT RESPONSE                  |
|                 (Case Notes, Containment Workflows, False Positive Verification)        |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Core Functional Modules

### 2.1 Backend Core (FastAPI & SQLAlchemy)
- **Asynchronous REST Architecture:** Modular routers isolating Authentication, User Management, Datasets, ML Models, Threat Detection, Alerts, Incidents, Analytics, XAI, Simulation, and Reporting.
- **Persistence Engine:** Relational database abstraction using SQLAlchemy ORM. Configured with PostgreSQL for production and zero-configuration SQLite for local development.

### 2.2 Machine Learning Pipeline (Scikit-Learn, XGBoost, Joblib)
- **Trained Classifiers:**
  1. *Random Forest Classifier* (100 estimators, max depth 15)
  2. *Decision Tree Classifier* (CART with Gini impurity, max depth 12)
  3. *Support Vector Machine* (RBF kernel, scaled features)
  4. *Isolation Forest* (Unsupervised novelty detection on inlier normal baselines)
  5. *XGBoost Classifier* (Gradient boosted decision trees, multi-class logloss)
- **Zero Data Leakage:** Preprocessor parameters (means, standard deviations, categorical vocabularies) are calculated strictly on training partitions and frozen before evaluating test sets.

### 2.3 Transparent Risk Scoring Engine
Risk scores (0.0 to 100.0) are calculated independently of raw model probabilities using the documented formula:
$$\text{Risk Score} = (W_{\text{base}} \times 0.50) + (\text{Confidence} \times 30.0) + (\text{Heuristics} \times 20.0)$$

Where $W_{\text{base}}$ corresponds to inherent threat severities:
- `Normal`: 0.0
- `PortScan`: 45.0
- `BruteForce`: 65.0
- `WebAttack`: 70.0
- `DoS`: 80.0
- `Botnet`: 85.0
- `Infiltration`: 95.0

### 2.4 User Behaviour Analytics (UBA)
Monitors internal campus identity vectors:
- Failed login sequences ($\ge 3$ triggers medium alert, $\ge 5$ locks account and triggers high alert).
- Off-hours authentication (access between 01:00 AM and 05:00 AM UTC).
- IP divergence (sudden geographical/subnet hopping).

### 2.5 Explainable AI (XAI)
- **SHAP (SHapley Additive exPlanations):** Computes game-theoretic marginal contributions per feature, visualising whether a packet attribute pushes the prediction towards attack (red) or normal (green).
- **LIME (Local Interpretable Model-agnostic Explanations):** Constructs local linear surrogate decision boundaries explaining specific threshold triggers (e.g., `rate > 500.0` or `ct_srv_src > 15`).
- **Analyst Synthesis:** Generates human-readable security statements to assist SOC analysts during triage.
