#!/bin/bash

# Project-specific configuration for shared tools
# This file is sourced by scripts in ~/GitHub/shared/tools/

# === PATHS ===
NOTES_DIR="notes"
DOCS_SOURCE_DIR="notes/designs"
DOCS_OUTPUT="src/lib/ts/files/Docs.ts"
DOCS_LOG_FILE="notes/tools/docs/reset-docs-log.txt"

# === NETLIFY ===
NETLIFY_SITE_ID="0770f16d-e009-48e8-a548-38a5bb2c18f5"
# NETLIFY_ACCESS_TOKEN should be set in environment, not here

# === SYNC INDEX ===
# Extra folders to exclude (in addition to defaults)
# EXCLUDE_FOLDERS_EXTRA="custom1 custom2"
