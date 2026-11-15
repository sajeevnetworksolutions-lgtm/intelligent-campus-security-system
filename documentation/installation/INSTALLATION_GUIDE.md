# INSTALLATION & EXECUTION GUIDE

**PROJECT:** AN INTELLIGENT CAMPUS SECURITY SYSTEM FOR CYBERSECURITY APPLICATIONS  
**CANDIDATE:** Nalina G (25CSE09) | **INSTITUTION:** SSIT Tumakuru  

---

## 1. System Requirements

### Hardware
- **Processor:** Multi-core Intel Core i5/i7 or AMD Ryzen 5/7 (4+ cores recommended)
- **RAM:** Minimum 8 GB (16 GB recommended for SHAP and XGBoost training)
- **Storage:** 5 GB free disk space

### Software Environment
- **Operating System:** Windows 10/11 or Ubuntu Linux 22.04 LTS / Debian
- **Python:** Python 3.10 or 3.11
- **Node.js:** Node.js v18+ or v20+ with `npm`

---

## 2. Quick-Start (Windows)

The simplest way to run the entire project on Windows is using the provided batch scripts:

```powershell
# Navigate to project directory
cd C:\Users\91990\.gemini\antigravity\scratch\intelligent-campus-security

# Launch complete application (Backend + Frontend)
.\run_all.bat
```

Alternatively, run components in separate terminals:

```powershell
# Terminal 1: Backend
.\scripts\start_backend.bat

# Terminal 2: Frontend
.\scripts\start_frontend.bat

# Terminal 3: Re-execute ML Experiments Suite (Optional)
.\scripts\train_models.bat
```

---

## 3. Quick-Start (Linux / macOS)

```bash
# Make scripts executable
chmod +x scripts/*.sh run_all.sh

# Run complete application
./run_all.sh
```

---

## 4. Manual Installation Step-by-Step

### 4.1 Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database setup & training experiments
python ../scripts/run_experiments.py

# Start Backend Server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- **Backend API:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **ReDoc Documentation:** `http://127.0.0.1:8000/redoc`

### 4.2 Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
- **SOC Web Dashboard:** `http://localhost:5173`

---

## 5. Docker Deployment

Deploy the entire platform using Docker Compose:

```bash
docker-compose up --build -d
```
- The backend will start on port `8000`.
- The frontend will be served via Nginx on port `5173`.
