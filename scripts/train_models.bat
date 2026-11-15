@echo off
echo ======================================================================
echo Executing Machine Learning Training & Benchmark Experiments Suite
echo ======================================================================
set PYTHONPATH=%~dp0..\backend
set MPLCONFIGDIR=%~dp0..\results\.matplotlib_cache
python %~dp0run_experiments.py
pause
