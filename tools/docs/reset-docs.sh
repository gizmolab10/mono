#!/bin/bash

# Reset Docs
# Quick rebuild and dev server for VitePress docs
#
# Usage: reset-docs.sh [project-root]

PROJECT_ROOT="${1:-$(pwd)}"
cd "$PROJECT_ROOT" || exit 1

# Source project-specific config if it exists
CONFIG_FILE="tools/config.sh"
[ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE"

# Defaults
LOG_FILE="${DOCS_LOG_FILE:-tools/reset-docs-log.txt}"

yarn docs:build && yarn docs:dev > "$LOG_FILE" 2>&1
