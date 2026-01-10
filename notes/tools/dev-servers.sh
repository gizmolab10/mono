#!/bin/bash

# dev-servers.sh - Start/restart development servers
# Usage: ./dev-servers.sh [all|ws|ws-docs|di|shared] [--kill-only]

GITHUB_DIR="$HOME/GitHub"
LOG_DIR="$GITHUB_DIR/shared/logs"
mkdir -p "$LOG_DIR"

# Site definitions: name|port|dir|command
SITES=(
  "hub|5170|shared/tools|python3 -m http.server 5170"
  "ws|5173|ws|yarn dev"
  "ws-docs|5176|ws|yarn docs:dev"
  "di|5174|di|yarn dev"
  "shared|5177|shared|yarn docs:dev"
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
  echo "  5170  hub       (H)"
  echo "  5173  ws        app   (W)"
  echo "  5174  di        app   (D)"
  echo "  5176  ws        docs  (E)"
  echo "  5177  shared    docs  (S)"
fi
