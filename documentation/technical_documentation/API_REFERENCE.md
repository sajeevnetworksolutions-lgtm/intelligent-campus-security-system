# BACKEND API REFERENCE & REST SPECIFICATION

**BASE URL:** `http://127.0.0.1:8000/api`  
**INTERACTIVE DOCS:** `http://127.0.0.1:8000/docs`  

---

## 1. Authentication Endpoints

### `POST /auth/login`
Authenticates a user and issues a signed JWT access token.
- **Request Body:**
  ```json
  {
    "username": "admin",
    "password": "AdminPassword123!",
    "ip_address": "127.0.0.1",
    "user_agent": "Mozilla/5.0"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user_id": 1,
    "username": "admin",
    "role": "Super Administrator",
    "full_name": "Super Administrator",
    "department": "Cybersecurity Cell"
  }
  ```

### `GET /auth/me`
Retrieves current authenticated profile. Requires `Authorization: Bearer <token>`.

---

## 2. Dataset Management Endpoints

### `GET /datasets`
Lists all registered datasets, row counts, feature counts, and class distributions.

### `POST /datasets/upload`
Uploads and validates a CSV dataset file (Multipart Form).

### `GET /datasets/{id}/validation`
Returns deep validation metrics, column data types, missing value counts, and a 10-row preview.

---

## 3. Machine Learning Endpoints

### `POST /models/train`
Trains a selected algorithm on a dataset and evaluates against a held-out test split.
- **Request Body:**
  ```json
  {
    "name": "Random Forest IDS",
    "algorithm": "RandomForest",
    "dataset_id": 1,
    "test_size": 0.25,
    "random_state": 42,
    "hyperparameters": { "n_estimators": 100, "max_depth": 15 }
  }
  ```
- **Response:** Summary metrics including accuracy, precision, recall, f1_score, false_positive_rate, and latency.

### `GET /models/compare`
Returns comparative benchmark ranking across all trained models.

### `POST /models/{id}/activate`
Sets model as active primary classifier for live detection pipeline.

---

## 4. Intrusion Detection & Analysis Endpoints

### `POST /detection/analyze`
Submits a single network flow record for real-time inference and risk evaluation.
- **Request Body:** Flow parameters (`dur`, `proto`, `service`, `spkts`, `sbytes`, `rate`, `sttl`, etc.)
- **Response:**
  ```json
  {
    "predicted_class": "DoS",
    "is_malicious": true,
    "confidence": 0.985,
    "risk_score": 88.5,
    "severity": "CRITICAL",
    "explanation": "Risk assigned as CRITICAL (Score: 88.5/100)...",
    "alert_generated": true,
    "alert_code": "ALT-20261115-DOS01"
  }
  ```

---

## 5. Explainable AI (XAI) Endpoints

### `POST /explainability/shap`
Calculates SHAP feature attributions and returns base64 bar plot and security rationale.

### `POST /explainability/lime`
Calculates LIME tabular decision boundaries and returns rule weights and plain-English interpretation.

---

## 6. Reports & PDF Downloads

### `GET /reports/experiments/{id}/pdf`
Streams publication-grade PDF Research Report formatted for academic dissertation submission.

### `GET /reports/experiments/{id}/csv`
Exports comprehensive experimental metrics in standard CSV format.
