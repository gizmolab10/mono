#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE '\.(ts|svelte)$'; then
  cd /Users/sand/GitHub/mono/di && yarn svelte-check --output human 2>&1 | tail -20
fi
exit 0
