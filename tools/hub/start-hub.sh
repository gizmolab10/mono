#!/bin/bash

# start-hub.sh - Kill existing hub processes and start fresh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Read ports from ports.json
HUB_PORT=$(python3 -c "import json; print(json.load(open('$SCRIPT_DIR/ports.json'))['hub']['port'])")
DISPATCHER_PORT=$(python3 -c "import json; print(json.load(open('$SCRIPT_DIR/ports.json'))['dispatcher']['port'])")

# Kill existing processes on hub ports
lsof -ti:$HUB_PORT | xargs kill 2>/dev/null
lsof -ti:$DISPATCHER_PORT | xargs kill 2>/dev/null

sleep 1

# Start static server for hub UI
cd "$SCRIPT_DIR"
python3 -m http.server $HUB_PORT &

# Start dispatcher
python3 dispatcher.py &

echo "Hub started at http://localhost:$HUB_PORT"
