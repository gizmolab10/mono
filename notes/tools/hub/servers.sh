#!/bin/bash

# dev-servers.sh - Start/restart development servers
# Usage: ./dev-servers.sh [ws|ws-docs|di|di-docs|mono-docs|hub] [--kill-only] [--no-verify] [--verify-only]

GITHUB_DIR="$HOME/GitHub/mono"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$GITHUB_DIR/logs"
PORTS_FILE="$SCRIPT_DIR/ports.json"
STATUS_FILE="$GITHUB_DIR/logs/restart-status.txt"
mkdir -p "$LOG_DIR"
mkdir -p "$GITHUB_DIR/logs"

# Progress display
CURRENT_STEP=0
TOTAL_STEPS=7
VERIFY_STEPS=0  # Will be set based on sites to verify

progress() {
  printf "\r\033[KStep %d/%d: %s" "$1" "$TOTAL_STEPS" "${2:0:50}"
  echo "Step $1/$TOTAL_STEPS: $2" > "$STATUS_FILE"
}

progress_done() {
  printf "\r\033[K✓ All servers restarted\n"
  echo "✓ All $TOTAL_STEPS sites are up" > "$STATUS_FILE"
}

progress_fail() {
  printf "\r\033[K❌ Failed: %s\n" "$1"
  echo "❌ Failed: $1" > "$STATUS_FILE"
}

# Read port from nested JSON using python
get_port() {
  python3 -c "import json; d=json.load(open('$PORTS_FILE')); print(d$1)"
}

# Load ports
PORT_DISPATCH=$(get_port "['hub']['port']")
PORT_DISPATCHER=$(get_port "['dispatcher']['port']")
PORT_WS=$(get_port "['ws']['port']")
PORT_DI=$(get_port "['di']['port']")
PORT_WS_DOCS=$(get_port "['ws']['docs']")
PORT_MONO_DOCS=$(get_port "['mono']['docs']")
PORT_DI_DOCS=$(get_port "['di']['docs']")

# Site definitions: name|port|dir|command
SITES=(
  "hub|$PORT_DISPATCH|notes/tools/hub|python3 -m http.server $PORT_DISPATCH"
  "ws|$PORT_WS|ws|yarn dev"
  "ws-docs|$PORT_WS_DOCS|ws|VITE_PORT=$PORT_WS_DOCS yarn docs:dev"
  "di|$PORT_DI|di|yarn dev"
  "di-docs|$PORT_DI_DOCS|di|VITE_PORT=$PORT_DI_DOCS yarn docs:dev"
  "mono-docs|$PORT_MONO_DOCS|.|yarn docs:dev"
)

kill_port() {
  local port=$1
  local pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    kill -9 $pid 2>/dev/null
    sleep 0.3
  fi
}

verify_port() {
  local port=$1
  local timeout=$2
  local elapsed=0
  while [ $elapsed -lt $timeout ]; do
    if lsof -ti :$port >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
    elapsed=$((elapsed + 1))
  done
  return 1
}

verify_url() {
  local port=$1
  local timeout=$2
  local elapsed=0
  while [ $elapsed -lt $timeout ]; do
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port" 2>/dev/null | grep -q "200"; then
      return 0
    fi
    sleep 0.5
    elapsed=$((elapsed + 1))
  done
  return 1
}

start_site() {
  local name=$1
  local port=$2
  local dir=$3
  local cmd=$4
  
  local logfile="$LOG_DIR/$name.log"
  cd "$GITHUB_DIR/$dir"
  eval $cmd > "$logfile" 2>&1 &
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
NO_VERIFY=false
VERIFY_ONLY=false
TARGET=""

for arg in "$@"; do
  case $arg in
    --kill-only) KILL_ONLY=true ;;
    --no-verify) NO_VERIFY=true ;;
    --verify-only) VERIFY_ONLY=true ;;
    ws|ws-docs|di|di-docs|mono-docs|hub) TARGET=$arg ;;
  esac
done

# Run
if [ -z "$TARGET" ]; then
  # Count sites for progress
  TOTAL_STEPS=${#SITES[@]}
  
  # Start all sites (unless verify-only)
  if [ "$VERIFY_ONLY" != "true" ]; then
    CURRENT_STEP=0
    STARTED_SITES=()
    for site in "${SITES[@]}"; do
      CURRENT_STEP=$((CURRENT_STEP + 1))
      IFS='|' read -r name port dir cmd <<< "$site"
      progress $CURRENT_STEP "Restarting $name"
      run_site "$site"
      STARTED_SITES+=("$name|$port")
    done
  else
    # For verify-only, build STARTED_SITES from SITES
    for site in "${SITES[@]}"; do
      IFS='|' read -r name port dir cmd <<< "$site"
      STARTED_SITES+=("$name|$port")
    done
  fi
  
  # Verify if not suppressed
  if [ "$KILL_ONLY" != "true" ] && [ "$NO_VERIFY" != "true" ]; then
    FAILED=""
    
    # Verify ports
    CURRENT_STEP=0
    for entry in "${STARTED_SITES[@]}"; do
      CURRENT_STEP=$((CURRENT_STEP + 1))
      IFS='|' read -r name port <<< "$entry"
      progress $CURRENT_STEP "Verifying port $CURRENT_STEP/$TOTAL_STEPS: $name"
      if ! verify_port $port 10; then
        FAILED="$FAILED $name"
      fi
    done
    
    # Verify HTTP responses (only if ports succeeded)
    if [ -z "$FAILED" ]; then
      CURRENT_STEP=0
      for entry in "${STARTED_SITES[@]}"; do
        CURRENT_STEP=$((CURRENT_STEP + 1))
        IFS='|' read -r name port <<< "$entry"
        progress $CURRENT_STEP "Verifying response $CURRENT_STEP/$TOTAL_STEPS: $name"
        if ! verify_url $port 20; then
          FAILED="$FAILED $name"
        fi
      done
    fi
    
    if [ -n "$FAILED" ]; then
      progress_fail "Failed to start:$FAILED"
      exit 1
    fi
  fi
  
  progress_done
else
  for site in "${SITES[@]}"; do
    IFS='|' read -r name port dir cmd <<< "$site"
    if [ "$name" = "$TARGET" ]; then
      TOTAL_STEPS=1
      
      # Start site (unless verify-only)
      if [ "$VERIFY_ONLY" != "true" ]; then
        progress 1 "Restarting $name"
        run_site "$site"
      fi
      
      # Verify single site if not suppressed
      if [ "$KILL_ONLY" != "true" ] && [ "$NO_VERIFY" != "true" ]; then
        progress 1 "Verifying port: $name"
        if ! verify_port $port 10; then
          progress_fail "Failed to start: $name"
          exit 1
        fi
        progress 1 "Verifying response: $name"
        if ! verify_url $port 20; then
          progress_fail "Failed to start: $name"
          exit 1
        fi
      fi
      
      progress_done
      break
    fi
  done
fi

if [ "$KILL_ONLY" = "true" ]; then
  printf "\r\033[KKilled specified servers.\n"
fi
