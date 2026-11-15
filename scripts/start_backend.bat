@echo off
echo ======================================================================
echo Starting Campus Cybersecurity Intelligent Backend (FastAPI + Uvicorn)
echo ======================================================================
set PYTHONPATH=%~dp0..\backend
set MPLCONFIGDIR=%~dp0..\results\.matplotlib_cache
cd /d %~dp0..\backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
