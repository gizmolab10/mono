#!/bin/bash

# dev-servers.sh - Start/restart development servers
# Usage: ./dev-servers.sh [all|ws|ws-docs|di|shared] [--kill-only]

GITHUB_DIR="$HOME/GitHub"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$GITHUB_DIR/shared/notes/tools/logs"
PORTS_FILE="$SCRIPT_DIR/dev-ports.json"
mkdir -p "$LOG_DIR"

# Read port from JSON
get_port() {
  local key=$1
  grep "\"$key\"" "$PORTS_FILE" | sed 's/[^0-9]//g'
}

# Load ports
PORT_HUB=$(get_port hub)
PORT_API=$(get_port api)
PORT_WS=$(get_port ws)
PORT_DI=$(get_port di)
PORT_WS_DOCS=$(get_port ws-docs)
PORT_SHARED=$(get_port shared)
PORT_DI_DOCS=$(get_port di-docs)

# Site definitions: name|port|dir|command
SITES=(
  "api|$PORT_API|shared/notes/tools/sites|python3 dev-api.py"
  "hub|$PORT_HUB|shared/notes/tools/sites|python3 -m http.server $PORT_HUB"
  "ws|$PORT_WS|ws|yarn dev"
  "ws-docs|$PORT_WS_DOCS|ws|yarn docs:dev"
  "di|$PORT_DI|di|yarn dev"
  "di-docs|$PORT_DI_DOCS|di|yarn docs:dev"
  "shared|$PORT_SHARED|shared|yarn docs:dev"
)

kill_port() {
  local port=$1
  local pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "Killing process on port $port (PID: $pid)"
    kill -9 $pid 2>/dev/null
    sleep 0.5
  fi
}

start_site() {
  local name=$1
  local port=$2
  local dir=$3
  local cmd=$4
  
  local logfile="$LOG_DIR/$name.log"
  echo "Starting $name on port $port... (log: $logfile)"
  cd "$GITHUB_DIR/$dir"
  $cmd > "$logfile" 2>&1 &
  sleep 1
}

run_site() {
  local entry=$1
  IFS='|' read -r name port dir cmd <<< "$entry"
  
  kill_port $port
  
  if [ "$KILL_ONLY" != "true" ]; then
    start_site "$name" "$port" "$dir" "$cmd"
  fi
}

# Parse args
KILL_ONLY=false
TARGET="all"

for arg in "$@"; do
  case $arg in
    --kill-only) KILL_ONLY=true ;;
    all|ws|ws-docs|di|shared) TARGET=$arg ;;
  esac
done

# Run
if [ "$TARGET" = "all" ]; then
  for site in "${SITES[@]}"; do
    run_site "$site"
  done
else
  for site in "${SITES[@]}"; do
    IFS='|' read -r name port dir cmd <<< "$site"
    if [ "$name" = "$TARGET" ]; then
      run_site "$site"
      break
    fi
  done
fi

if [ "$KILL_ONLY" = "true" ]; then
  echo "Killed specified servers."
else
  echo ""
  echo "Running servers:"
  echo "  $PORT_HUB  hub       (H)"
  echo "  $PORT_API  api"
  echo "  $PORT_WS  ws        app   (W)"
  echo "  $PORT_DI  di        app   (D)"
  echo "  $PORT_WS_DOCS  ws        docs  (E)"
  echo "  $PORT_SHARED  shared    docs  (S)"
  echo "  $PORT_DI_DOCS  di        docs"
fi
