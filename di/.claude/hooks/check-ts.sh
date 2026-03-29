#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE '\.(ts|svelte)$'; then
  cd /Users/sand/GitHub/mono/di
  OUTPUT=$(yarn svelte-check --output human 2>&1)
  echo "$OUTPUT" | tail -20
  if echo "$OUTPUT" | grep -q 'found 0 errors'; then
    exit 0
  else
    exit 2
  fi
fi
exit 0