#!/bin/bash

# Update Docs Workflow (quiet mode)
# Single-line progress display, errors logged to file
#
# Usage: update.sh [project-root]
#        update.sh all           # updates all projects
#        update.sh --verbose     # full output (old behavior)
#        update.sh [project] --verbose

GITHUB_DIR="$HOME/GitHub"
ALL_PROJECTS=("mono" "mono/projects/ws" "mono/projects/di")
ERROR_LOG=""
VERBOSE=false
CURRENT_STEP=0
TOTAL_STEPS=7

# Parse arguments
PROJECT_ARG=""
for arg in "$@"; do
  case "$arg" in
    --verbose|-v)
      VERBOSE=true
      ;;
    *)
      PROJECT_ARG="$arg"
      ;;
  esac
done

# Progress display (single line, overwriting)
# Also writes to status file for hub polling
STATUS_FILE=""

progress() {
  if [ "$VERBOSE" = true ]; then
    echo "$2"
  else
    printf "\r\033[KStep %d/%d: %s" "$1" "$TOTAL_STEPS" "${2:0:30}"
  fi
  # Write to status file if set
  if [ -n "$STATUS_FILE" ]; then
    echo "Step $1/$TOTAL_STEPS: $2" > "$STATUS_FILE"
  fi
}

# Progress with sub-item (for streaming output)
progress_item() {
  if [ "$VERBOSE" = true ]; then
    echo "  $1"
  else
    printf "\r\033[KStep %d/%d: %s... %s" "$CURRENT_STEP" "$TOTAL_STEPS" "$STEP_NAME" "${1:0:30}"
  fi
  # Write to status file if set
  if [ -n "$STATUS_FILE" ]; then
    echo "Step $CURRENT_STEP/$TOTAL_STEPS: $STEP_NAME... ${1:0:30}" > "$STATUS_FILE"
  fi
}

# Clear progress line
clear_progress() {
  if [ "$VERBOSE" = false ]; then
    printf "\r\033[K"
  fi
}

# Run a command, streaming output to progress display
# On error: append to error log, return non-zero
run_cmd() {
  if [ "$VERBOSE" = true ]; then
    "$@"
    return $?
  fi
  
  local tmp_out=$(mktemp)
  
  # Run command, capture output
  "$@" > "$tmp_out" 2>&1 &
  local pid=$!
  
  # Display output lines as they appear
  while kill -0 $pid 2>/dev/null; do
    if [ -s "$tmp_out" ]; then
      local last_line=$(tail -1 "$tmp_out")
      [ -n "$last_line" ] && progress_item "$last_line"
    fi
    sleep 0.1
  done
  
  # Get exit code
  wait $pid
  local exit_code=$?
  
  # Show final line
  if [ -s "$tmp_out" ]; then
    local last_line=$(tail -1 "$tmp_out")
    [ -n "$last_line" ] && progress_item "$last_line"
  fi
  
  # On error, append output to error log
  if [ $exit_code -ne 0 ]; then
    echo "" >> "$ERROR_LOG"
    echo "=== Step $CURRENT_STEP: $STEP_NAME ===" >> "$ERROR_LOG"
    cat "$tmp_out" >> "$ERROR_LOG"
  fi
  
  rm -f "$tmp_out"
  return $exit_code
}

# Start a step
start_step() {
  CURRENT_STEP=$1
  STEP_NAME="$2"
  progress "$CURRENT_STEP" "$STEP_NAME"
}

# Fail and exit
fail() {
  clear_progress
  echo "❌ Failed at step $CURRENT_STEP: $STEP_NAME"
  echo "❌ Failed at step $CURRENT_STEP: $STEP_NAME" > "$STATUS_FILE"
  echo ""
  cat "$ERROR_LOG"
  exit 1
}

# Handle "all" option
if [ "$PROJECT_ARG" = "all" ]; then
  clear_progress
  echo "Updating all projects..."
  echo ""
  
  for proj in "${ALL_PROJECTS[@]}"; do
    echo ">>> $proj"
    if [ "$VERBOSE" = true ]; then
      bash "$0" "$GITHUB_DIR/$proj" --verbose
    else
      bash "$0" "$GITHUB_DIR/$proj"
    fi
    if [ $? -ne 0 ]; then
      exit 1
    fi
    echo ""
  done
  
  echo "✓ All projects updated"
  exit 0
fi

# Single project update
PROJECT_ROOT="${PROJECT_ARG:-$(pwd)}"
cd "$PROJECT_ROOT" || exit 1
PROJECT_ROOT=$(pwd)  # Convert to absolute path

# Set up logs directory
LOGS_DIR="$PROJECT_ROOT/../logs"
mkdir -p "$LOGS_DIR"

# Set up status file for hub polling
STATUS_FILE="$LOGS_DIR/rebuild-status.txt"
echo "Starting..." > "$STATUS_FILE"

# Set up error log
ERROR_LOG="$LOGS_DIR/update-docs.error.log"
rm -f "$ERROR_LOG"
touch "$ERROR_LOG"

# Source project-specific config if it exists
CONFIG_FILE="notes/tools/config.sh"
[ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE"

# Find shared tools directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_TOOLS="${SHARED_TOOLS:-$SCRIPT_DIR}"

# Defaults (can be overridden by config.sh)
NOTES_DIR="${NOTES_DIR:-notes}"
TOOLS_DIST="${TOOLS_DIST:-$SHARED_TOOLS/dist}"

# Determine build output location
BUILD_OUTPUT="$LOGS_DIR/vitepress.build.log"

# Step 1: Compile TypeScript tools
start_step 1 "Compiling TypeScript"
cd "$SHARED_TOOLS"
run_cmd npx tsc || fail
cd "$PROJECT_ROOT"

# Step 2: Sync index.md files
start_step 2 "Syncing index files"
run_cmd bash "$SHARED_TOOLS/sync-index-files.sh" "$PROJECT_ROOT" || fail

# Step 3: Build VitePress (may fail with broken links)
start_step 3 "Building docs (first pass)"
run_cmd yarn docs:build
BUILD_EXIT=$?
# Don't fail here - broken links are expected, step 4 will fix them

# Step 4: Fix broken links
start_step 4 "Fixing links"
run_cmd node "$TOOLS_DIST/fix-links.js"
FIX_EXIT=$?
if [ $FIX_EXIT -ne 0 ] && [ $FIX_EXIT -ne 2 ]; then
  fail
fi

# Step 5: Generate docs database structure (if configured)
start_step 5 "Generating docs database"
if [ -n "$DOCS_OUTPUT" ]; then
  run_cmd bash "$SHARED_TOOLS/create-docs-db-data.sh" "$PROJECT_ROOT" || fail
fi

# Step 6: Rebuild VitePress
start_step 6 "Rebuilding docs"
run_cmd yarn docs:build || fail

# Step 7: Sync all sidebars
start_step 7 "Syncing sidebars"
MONO_ROOT="$GITHUB_DIR/mono"
for proj_dir in "$MONO_ROOT/projects/ws" "$MONO_ROOT/projects/di" "$MONO_ROOT/sites/docs"; do
  if [ -d "$proj_dir/.vitepress" ]; then
    cd "$proj_dir"
    run_cmd node "$TOOLS_DIST/sync-sidebar.js" || fail
  fi
done
cd "$PROJECT_ROOT"

# Done
clear_progress
echo "✓ All $TOTAL_STEPS doc update steps succeeded"
echo "✓ All $TOTAL_STEPS doc update steps succeeded" > "$STATUS_FILE"

# Clean up error log if empty
if [ ! -s "$ERROR_LOG" ]; then
  rm -f "$ERROR_LOG"
fi
