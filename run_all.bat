@echo off
echo ======================================================================
echo INTELLIGENT CAMPUS SECURITY SYSTEM FOR CYBERSECURITY APPLICATIONS
echo Sri Siddhartha Institute of Technology (SSIT), Tumakuru
echo Candidate: Nalina G (25CSE09) | Guide: Dr. Nirmala G
echo ======================================================================

echo [1/2] Launching Backend Server on http://127.0.0.1:8000 ...
start "SOC Backend Server" cmd /k "scripts\start_backend.bat"

timeout /t 3 /nobreak >nul

echo [2/2] Launching SOC Dashboard on http://localhost:5173 ...
start "SOC Frontend Dashboard" cmd /k "scripts\start_frontend.bat"

echo.
echo Application successfully launched!
echo Backend Docs: http://127.0.0.1:8000/docs
echo Frontend SOC: http://localhost:5173
echo.
pause
