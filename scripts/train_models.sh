#!/bin/bash
export PYTHONPATH="$(cd "$(dirname "$0")/../backend" && pwd)"
export MPLCONFIGDIR="$(cd "$(dirname "$0")/../results" && pwd)/.matplotlib_cache"
python3 "$(dirname "$0")/run_experiments.py"
