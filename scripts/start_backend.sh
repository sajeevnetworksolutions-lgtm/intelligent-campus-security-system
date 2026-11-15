#!/bin/bash
export PYTHONPATH="$(cd "$(dirname "$0")/../backend" && pwd)"
export MPLCONFIGDIR="$(cd "$(dirname "$0")/../results" && pwd)/.matplotlib_cache"
cd "$(dirname "$0")/../backend"
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
