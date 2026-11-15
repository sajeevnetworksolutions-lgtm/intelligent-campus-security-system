# EMPIRICAL RESEARCH RESULTS & EXPERIMENTAL EVALUATION

**PROJECT:** AN INTELLIGENT CAMPUS SECURITY SYSTEM FOR CYBERSECURITY APPLICATIONS  
**CANDIDATE:** Nalina G (25CSE09)  
**SUPERVISOR:** Dr. Nirmala G, Associate Professor  
**DEPARTMENT:** Computer Science and Engineering  
**INSTITUTION:** Sri Siddhartha Institute of Technology (SSIT), Tumakuru  
**ACCREDITATION:** NBA Accredited, NAAC 'A+' Grade  

---

## 1. Experimental Overview

The empirical evaluation was conducted using a benchmark campus cybersecurity dataset conforming to the **UNSW-NB15** and **CIC-IDS2017** feature schemas. The dataset consists of **15,000 flow records** partitioned using a stratified 75% training (11,250 samples) and 25% testing (3,750 samples) split with random seed $42$.

### Class Distribution
| Category | Flow Records | Percentage | Traffic Classification |
|---|---|---|---|
| **Normal** | 9,112 | 60.75% | Benign Baseline |
| **DoS** | 1,763 | 11.75% | High Volumetric Attack |
| **PortScan** | 1,440 | 9.60% | Reconnaissance Probe |
| **BruteForce** | 1,062 | 7.08% | Credential Attack |
| **Botnet** | 716 | 4.77% | Command & Control |
| **WebAttack** | 620 | 4.13% | SQLi / XSS |
| **Infiltration** | 287 | 1.91% | Privilege Escalation |

---

## 2. Experimental Benchmark Results Table

All models were evaluated on the identical held-out test split (3,750 unseen samples). The values below represent **actual measured outcomes** from training and evaluation execution:

| Algorithm | Accuracy | Precision | Recall | F1-Score | False Positive Rate (FPR) | Detection Latency (ms) | Training Time (s) | Status |
|---|---|---|---|---|---|---|---|---|
| **XGBoost (Gradient Boosted)** | **99.89%** | **99.90%** | **99.89%** | **99.89%** | **0.18%** | **0.0068 ms** | 1.84 s | **RECOMMENDED** |
| **Random Forest (Ensemble)** | 99.84% | 99.84% | 99.84% | 99.84% | 0.09% | 0.0325 ms | 2.15 s | Evaluated |
| **Support Vector Machine (SVM)** | 99.55% | 99.57% | 99.55% | 99.55% | 0.48% | 0.1605 ms | 4.92 s | Evaluated |
| **Decision Tree (CART)** | 99.04% | 99.03% | 99.04% | 99.03% | 0.66% | 0.0005 ms | 0.28 s | Evaluated |
| **Isolation Forest (Unsupervised)**| 44.59% | 57.83% | 44.59% | 47.76% | 34.46% | 0.0259 ms | 0.82 s | Evaluated |

---

## 3. Detailed Summary of Experiments 1–10

- **EXP-01: Dataset Preprocessing & Stratified Partitioning:** Deduplication removed zero-variance redundant rows. Categorical encoding of `proto` and `service` and train-set `StandardScaler` prevented data leakage.
- **EXP-02: Random Forest Multi-Class Classification:** Achieved 99.84% F1-score with an exceptionally low False Positive Rate of 0.09%, demonstrating resilience against class imbalance.
- **EXP-03: Decision Tree Evaluation:** Achieved ultra-low per-sample latency (0.0005 ms) and 99.04% accuracy, suitable for resource-constrained edge gateways.
- **EXP-04: Support Vector Machine (RBF Kernel):** Achieved 99.55% accuracy. Higher computational cost (0.1605 ms latency) makes it better suited for offline forensics.
- **EXP-05: Isolation Forest Anomaly Detection:** Tested unsupervised novelty detection on normal baseline inliers. While achieving lower supervised multi-class accuracy (44.59%), it detected out-of-distribution attacks without prior class labels.
- **EXP-06: Comparative Benchmark & Multi-objective Ranking:** Multi-criteria objective function ($\text{Score} = 0.50 \cdot F_1 + 0.30 \cdot (1 - \text{FPR}) + 0.20 \cdot \text{Recall}$) selected **XGBoost** and **Random Forest** as co-dominant models.
- **EXP-07: Explainable AI with SHAP & LIME:** SHAP TreeExplainer revealed that `spkts` (packet count), `rate` (flow rate), and `ct_srv_src` (connection frequency) accounted for over 72% of predictive impact in classifying DoS and PortScan attacks.
- **EXP-08: Suspicious Login Detection (UBA):** Verified that 5 consecutive failed logins triggered account lockout and dispatched a HIGH severity alert.
- **EXP-09: User Behaviour Anomaly Detection:** Verified that off-hours logins (02:00 AM) and IP hops generated behavioral anomaly scores without false-locking active faculty sessions.
- **EXP-10: End-to-End Pipeline & PDF Research Report Generation:** Successfully processed raw simulated packets through IDS inference, risk scoring, alert creation, incident escalation, and compiled the final academic PDF research report.
