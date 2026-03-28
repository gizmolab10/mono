#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path')
SNAPSHOT_DIR="$TMPDIR/claude-snapshots"
mkdir -p "$SNAPSHOT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ENCODED=$(echo "$FILE_PATH" | sed 's/^\///' | sed 's/\//__/g')
if [ -f "$FILE_PATH" ]; then
  cp "$FILE_PATH" "$SNAPSHOT_DIR/${TIMESTAMP}__${ENCODED}"
fi
exit 0