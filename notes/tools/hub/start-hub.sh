#!/bin/bash

# start-hub.sh - Kill existing hub processes and start fresh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Kill existing processes on hub ports
lsof -ti:5170 | xargs kill 2>/dev/null
lsof -ti:5171 | xargs kill 2>/dev/null

sleep 1

# Start static server for hub UI
cd "$SCRIPT_DIR"
python3 -m http.server 5170 &

# Start dispatcher
python3 dispatcher.py &

echo "Hub started at http://localhost:5170"
