#!/bin/bash
echo "Starting Intelligent Campus Security System..."
bash ./scripts/start_backend.sh &
sleep 3
bash ./scripts/start_frontend.sh &
wait
