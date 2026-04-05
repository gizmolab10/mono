#!/bin/bash
# UserPromptSubmit hook: injects always.md content into every response context.
ALWAYS_FILE="/Users/sand/GitHub/mono/notes/guides/pre-flight/always.md"
if [ -f "$ALWAYS_FILE" ]; then
  CONTENT=$(cat "$ALWAYS_FILE")
  echo "$CONTENT"
fi
exit 0
