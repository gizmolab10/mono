#!/bin/bash
# PostToolUse hook: when an Edit or Write touches a .ts or .svelte file,
# touch a marker file so the Stop hook knows to run svelte-check at end
# of turn. Fast (~10ms) — just enough to record that a type check is needed.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE '\.(ts|svelte)$'; then
  touch "${TMPDIR}di-ts-check-pending"
fi
exit 0
