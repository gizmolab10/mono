#!/bin/bash

# Update Docs Workflow (quiet mode)
# Single-line progress display, errors logged to file
#
# Usage: update.sh [project-root]
#        update.sh all           # updates all projects
#        update.sh --verbose     # full output (old behavior)
#        update.sh --force       # rebuild even if no changes
#        update.sh [project] --verbose

# Compute SCRIPT_DIR immediately before any cd commands
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GITHUB_DIR="$HOME/GitHub"
ALL_PROJECTS=("mono" "mono/ws" "mono/di" "mono/ma")
ERROR_LOG=""
VERBOSE=false
CURRENT_STEP=0
TOTAL_STEPS=7

# Parse arguments
PROJECT_ARG=""
FORCE=false
for arg in "$@"; do
  case "$arg" in
    --verbose|-v)
      VERBOSE=true
      ;;
    --force|-f)
      FORCE=true
      ;;
    *)
      PROJECT_ARG="$arg"
      ;;
  esac
done

# Progress display
# Writes compact status to file for hub polling
# Format: "{project} {step}/{total} {step-name}" with optional sub-progress
STATUS_FILE=""
PROJECT_NAME=""

if [ -n "$REBUILD_STATUS_FILE" ]; then
  STATUS_FILE="$REBUILD_STATUS_FILE"
  PROJECT_NAME="$REBUILD_PROJECT"
fi

# Translate VitePress output to simple status
translate_vp_line() {
  local line="$1"
  case "$line" in
    *"building client + server bundles..."*)
      if [[ "$line" == *"✓"* ]]; then
        echo "bundled"
      else
        echo "bundling"
      fi
      ;;
    *"rendering pages..."*)
      if [[ "$line" == *"✓"* ]]; then
        echo "rendered"
      else
        echo "rendering"
      fi
      ;;
    *"generating sitemap..."*)
      echo "sitemap"
      ;;
    *"build error:"*)
      echo "error"
      ;;
    *"Build failed"*)
      echo "failed"
      ;;
    *"built in"*)
      echo "done"
      ;;
    *"dead links:"*)
      # Pass through our own count message
      echo "$line"
      ;;
    *"Found dead link"*|*"dead link"*)
      echo "dead link"
      ;;
    *"Fixed:"*)
      echo "fixed"
      ;;
    *"Unfixable:"*)
      echo "unfixable"
      ;;
    *"npx"*|*"tsc"*)
      echo "compiling"
      ;;
    *"The language"*|*"(!)"*|*"yarn run"*|*"vitepress v"*|*"info Visit"*|*"error Command"*|*"$ vitepress"*|*"> vitepress"*)
      # Skip noise
      echo ""
      ;;
    *)
      # Unknown - show truncated
      echo "${line:0:20}"
      ;;
  esac
}

progress() {
  local step="$1"
  local name="$2"
  local sub="$3"
  
  if [ "$VERBOSE" = true ]; then
    echo "$name"
  else
    if [ -n "$sub" ]; then
      printf "\r\033[K%s %d/%d %s → %s" "$PROJECT_NAME" "$step" "$TOTAL_STEPS" "$name" "$sub"
    else
      printf "\r\033[K%s %d/%d %s" "$PROJECT_NAME" "$step" "$TOTAL_STEPS" "$name"
    fi
  fi
  
  # Write to status file if set
  if [ -n "$STATUS_FILE" ]; then
    if [ -n "$sub" ]; then
      echo "$PROJECT_NAME $step/$TOTAL_STEPS $name → $sub" > "$STATUS_FILE"
    else
      echo "$PROJECT_NAME $step/$TOTAL_STEPS $name" > "$STATUS_FILE"
    fi
  fi
}

# Progress with sub-item (for streaming output)
progress_item() {
  local raw="$1"
  local translated=$(translate_vp_line "$raw")
  
  # Skip empty translations (noise)
  [ -z "$translated" ] && return
  
  if [ "$VERBOSE" = true ]; then
    echo "  $raw"
  else
    printf "\r\033[K%s %d/%d %s → %s" "$PROJECT_NAME" "$CURRENT_STEP" "$TOTAL_STEPS" "$STEP_NAME" "$translated"
  fi
  
  # Write to status file if set
  if [ -n "$STATUS_FILE" ]; then
    echo "$PROJECT_NAME $CURRENT_STEP/$TOTAL_STEPS $STEP_NAME → $translated" > "$STATUS_FILE"
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

# Run vitepress build, streaming progress from its output file
run_vp_build() {
  local output_file="$PROJECT_ROOT/vitepress.build.txt"
  
  # Clear previous output
  > "$output_file"
  
  # Start build in background
  if [ "$VERBOSE" = true ]; then
    yarn docs:build
    return $?
  fi
  
  local build_log=$(mktemp)
  yarn docs:build > "$build_log" 2>&1 &
  local pid=$!

  local last_line=""
  local dead_link_count=0

  # Poll the output file while build runs
  while kill -0 $pid 2>/dev/null; do
    if [ -s "$output_file" ]; then
      local current_line=$(tail -1 "$output_file")
      if [ "$current_line" != "$last_line" ]; then
        last_line="$current_line"

        # Count dead links
        if [[ "$current_line" == *"Found dead link"* ]] || [[ "$current_line" == *"dead link"* ]]; then
          dead_link_count=$((dead_link_count + 1))
          progress_item "dead links: $dead_link_count"
        else
          progress_item "$current_line"
        fi
      fi
    fi
    sleep 0.2
  done

  # Get exit code
  wait $pid
  local exit_code=$?

  # Show final status
  if [ -s "$output_file" ]; then
    local final_line=$(tail -1 "$output_file")
    if [[ "$final_line" == *"Found dead link"* ]] || [[ "$final_line" == *"dead link"* ]]; then
      dead_link_count=$((dead_link_count + 1))
      progress_item "dead links: $dead_link_count"
    else
      progress_item "$final_line"
    fi
  fi

  # On error, append both vitepress output and build log to error log
  if [ $exit_code -ne 0 ]; then
    echo "" >> "$ERROR_LOG"
    echo "=== Step $CURRENT_STEP: $STEP_NAME ===" >> "$ERROR_LOG"
    # Append vitepress progress file (dead links, etc.)
    if [ -s "$output_file" ]; then
      cat "$output_file" >> "$ERROR_LOG"
    fi
    # Append yarn/node stderr+stdout (actual error messages)
    if [ -s "$build_log" ]; then
      echo "--- build output ---" >> "$ERROR_LOG"
      cat "$build_log" >> "$ERROR_LOG"
    fi
  fi

  rm -f "$build_log"
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
  echo "❌ $PROJECT_NAME $CURRENT_STEP/$TOTAL_STEPS $STEP_NAME failed"
  if [ -n "$STATUS_FILE" ]; then
    echo "$PROJECT_NAME $CURRENT_STEP/$TOTAL_STEPS $STEP_NAME → failed" > "$STATUS_FILE"
  fi
  echo ""
  cat "$ERROR_LOG"
  exit 1
}

# Handle "all" option
if [ "$PROJECT_ARG" = "all" ]; then
  # Single status file for all projects
  STATUS_FILE="$GITHUB_DIR/mono/logs/rebuild-status.txt"
  mkdir -p "$GITHUB_DIR/mono/logs"
  
  clear_progress
  echo "Updating all projects..."
  echo "all 0/3 starting" > "$STATUS_FILE"
  echo ""
  
  PROJ_COUNT=${#ALL_PROJECTS[@]}
  PROJ_NUM=0
  
  for proj in "${ALL_PROJECTS[@]}"; do
    PROJ_NUM=$((PROJ_NUM + 1))
    PROJ_NAME=$(basename "$proj")
    echo ">>> $proj"
    
    # Run sub-build, passing status file and project name via env
    sub_args="$GITHUB_DIR/$proj"
    [ "$VERBOSE" = true ] && sub_args="$sub_args --verbose"
    [ "$FORCE" = true ] && sub_args="$sub_args --force"
    
    REBUILD_STATUS_FILE="$STATUS_FILE" REBUILD_PROJECT="$PROJ_NAME" bash "$0" $sub_args
    
    if [ $? -ne 0 ]; then
      echo "$PROJ_NAME failed" > "$STATUS_FILE"
      exit 1
    fi
    echo ""
  done
  
  echo "✓ mono, ws, di"
  echo "✓ mono, ws, di" > "$STATUS_FILE"
  exit 0
fi

# Single project update
PROJECT_ROOT="${PROJECT_ARG:-$(pwd)}"
cd "$PROJECT_ROOT" || exit 1
PROJECT_ROOT=$(pwd)  # Convert to absolute path

# Set PROJECT_NAME if not already set (single project run)
if [ -z "$PROJECT_NAME" ]; then
  PROJECT_NAME=$(basename "$PROJECT_ROOT")
fi

# Set up logs directory
# For mono root, use mono/logs; for subprojects, use projects/logs
if [ "$(basename "$PROJECT_ROOT")" = "mono" ]; then
  LOGS_DIR="$PROJECT_ROOT/logs"
else
  LOGS_DIR="$PROJECT_ROOT/../logs"
fi
mkdir -p "$LOGS_DIR"

# Set up status file for hub polling (only if not already set by parent)
if [ -z "$STATUS_FILE" ]; then
  STATUS_FILE="$LOGS_DIR/rebuild-status.txt"
  echo "Starting..." > "$STATUS_FILE"
fi

# Set up error log (per-project so they don't clobber each other)
ERROR_LOG="$LOGS_DIR/update-docs.error.$PROJECT_NAME.log"
rm -f "$ERROR_LOG"
touch "$ERROR_LOG"

# Source project-specific config if it exists
CONFIG_FILE="notes/tools/config.sh"
[ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE"

# Find shared tools directory (SCRIPT_DIR already set at top)
SHARED_TOOLS="${SHARED_TOOLS:-$SCRIPT_DIR}"

# Defaults (can be overridden by config.sh)
NOTES_DIR="${NOTES_DIR:-notes}"
TOOLS_DIST="${TOOLS_DIST:-$SHARED_TOOLS/dist}"

# Determine build output location
BUILD_OUTPUT="$LOGS_DIR/vitepress.build.log"

# Marker file for tracking last successful build
MARKER_FILE="$PROJECT_ROOT/.vitepress/.last-build"

# Check if rebuild is needed (skip if sources unchanged)
check_needs_rebuild() {
  # Always rebuild if marker doesn't exist or --force
  if [ "$FORCE" = true ]; then
    [ "$VERBOSE" = true ] && echo "  [debug] --force specified"
    return 0  # needs rebuild
  fi
  
  if [ ! -f "$MARKER_FILE" ]; then
    [ "$VERBOSE" = true ] && echo "  [debug] no marker file: $MARKER_FILE"
    return 0  # needs rebuild
  fi
  
  # Find newest source file (md files in notes/, config files)
  local newest_source
  newest_source=$(find "$PROJECT_ROOT/$NOTES_DIR" -name "*.md" -type f -newer "$MARKER_FILE" 2>/dev/null | head -1)
  
  if [ -n "$newest_source" ]; then
    [ "$VERBOSE" = true ] && echo "  [debug] newer md: $newest_source"
    return 0
  fi
  
  # Check config.mts
  if [ -f "$PROJECT_ROOT/.vitepress/config.mts" ]; then
    if [ "$PROJECT_ROOT/.vitepress/config.mts" -nt "$MARKER_FILE" ]; then
      [ "$VERBOSE" = true ] && echo "  [debug] config.mts is newer"
      return 0
    fi
  fi
  
  # Check shared tools (if they changed, rebuild all)
  newest_source=$(find "$SHARED_TOOLS" -name "*.ts" -type f -newer "$MARKER_FILE" 2>/dev/null | head -1)
  if [ -n "$newest_source" ]; then
    [ "$VERBOSE" = true ] && echo "  [debug] newer ts: $newest_source"
    return 0
  fi
  
  return 1  # no rebuild needed
}

# Check if we can skip this project
if ! check_needs_rebuild; then
  clear_progress
  echo "○ $PROJECT_NAME up to date"
  if [ -n "$STATUS_FILE" ]; then
    echo "$PROJECT_NAME up to date" > "$STATUS_FILE"
  fi
  exit 0
fi

# Step 1: Compile TypeScript tools
start_step 1 "compiling"
cd "$SHARED_TOOLS"
run_cmd npx tsc || fail
cd "$PROJECT_ROOT"

# Step 2: Sync index.md files
start_step 2 "syncing index"
run_cmd bash "$SHARED_TOOLS/sync-index-files.sh" "$PROJECT_ROOT" || fail

# Step 3: Build VitePress (may fail with broken links)
start_step 3 "building"
run_vp_build
BUILD_EXIT=$?
# Don't fail here - broken links are expected, step 4 will fix them

# Step 4: Fix broken links
start_step 4 "fixing links"
run_cmd node "$TOOLS_DIST/fix-links.js"
FIX_EXIT=$?
if [ $FIX_EXIT -ne 0 ] && [ $FIX_EXIT -ne 2 ]; then
  fail
fi

# Step 5: Generate docs database structure (if configured)
start_step 5 "generating docs db"
if [ -n "$DOCS_OUTPUT" ]; then
  run_cmd bash "$SHARED_TOOLS/create-docs-db-data.sh" "$PROJECT_ROOT" || fail
fi

# Step 6: Rebuild VitePress
start_step 6 "rebuilding"
run_vp_build || fail

# Step 7: Sync all sidebars
start_step 7 "syncing sidebars"
MONO_ROOT="$GITHUB_DIR/mono"
for proj_dir in "$MONO_ROOT/ws" "$MONO_ROOT/di"; do
  if [ -d "$proj_dir/.vitepress" ]; then
    cd "$proj_dir"
    run_cmd node "$TOOLS_DIST/sync-sidebar.js" || fail
  fi
done
cd "$PROJECT_ROOT"

# Done
clear_progress
echo "✓ $PROJECT_NAME done"
if [ -n "$STATUS_FILE" ]; then
  echo "$PROJECT_NAME 7/7 done" > "$STATUS_FILE"
fi

# Touch marker file to track successful build time
touch "$MARKER_FILE"

# Clean up error log if empty
if [ ! -s "$ERROR_LOG" ]; then
  rm -f "$ERROR_LOG"
fi
