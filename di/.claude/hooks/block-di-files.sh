#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE '\.di$'; then
  echo "Blocked: do not edit .di data files unless explicitly asked" >&2
  exit 2
fi
exit 0
