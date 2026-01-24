#!/bin/bash
#
# after.sh
# Run after each migration operation to verify nothing broke
#

cd ~/GitHub/mono

FULL=0
if [[ "$1" == "--full" ]]; then
  FULL=1
fi

LOG_FILE="$HOME/GitHub/mono/logs/health.log"
mkdir -p "$(dirname "$LOG_FILE")"
> "$LOG_FILE"

FAILED_STEPS=()
START_TIME=$(date +%s)

run_step() {
  local name="$1"
  local cmd="$2"
  local step_start=$(date +%s)
  local lines=0
  
  echo "=== $name ===" >> "$LOG_FILE"
  
  # Run command, count lines, update display
  eval "$cmd" 2>&1 | while IFS= read -r line; do
    echo "$line" >> "$LOG_FILE"
    lines=$((lines + 1))
    local preview="${line:0:20}"
    printf "\r\033[KRunning: %s > line %d: %s" "$name" "$lines" "$preview"
  done
  
  local result=${PIPESTATUS[0]}
  
  local step_end=$(date +%s)
  local step_elapsed=$((step_end - step_start))
  
  if [[ $result -eq 0 ]]; then
    echo "(${step_elapsed}s)" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    return 0
  else
    echo "FAILED (${step_elapsed}s)" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    return 1
  fi
}

run_step "Path Validator" "npx tsx notes/tools/validate-paths.ts" || FAILED_STEPS+=("Path Validator")
run_step "Workspace Integrity" "yarn workspaces info" || FAILED_STEPS+=("Workspace Integrity")
run_step "Build (ws)" "cd ~/GitHub/mono/ws && yarn build" || FAILED_STEPS+=("Build (ws)")
run_step "Build (di)" "cd ~/GitHub/mono/di && yarn build" || FAILED_STEPS+=("Build (di)")

if [[ $FULL -eq 1 ]]; then
  run_step "Docs Build" "cd ~/GitHub/mono && yarn docs:build" || FAILED_STEPS+=("Docs Build")
  run_step "Tests (ws)" "cd ~/GitHub/mono/ws && yarn test:run" || FAILED_STEPS+=("Tests (ws)")
  run_step "Tests (di)" "cd ~/GitHub/mono/di && yarn test:run" || FAILED_STEPS+=("Tests (di)")
fi

echo ""

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
MINS=$((ELAPSED / 60))
SECS=$((ELAPSED % 60))

echo "Log: $LOG_FILE"
printf "Time: %02d:%02d\n" "$MINS" "$SECS"

if [[ ${#FAILED_STEPS[@]} -gt 0 ]]; then
  echo "RESULT: ${#FAILED_STEPS[@]} failed — ${FAILED_STEPS[*]}"
  exit 1
else
  echo "RESULT: All checks passed"
  exit 0
fi
