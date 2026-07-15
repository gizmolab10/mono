#!/bin/bash
# UserPromptSubmit hook: injects always.md content into every response context,
# then the banned-words table — so the pre-send self-scan (always rule 25) can
# check each draft against the real list in front of it, not from memory.
ALWAYS_FILE="/Users/sand/GitHub/mono/notes/guides/pre-flight/always.md"
BANNED_FILE="/Users/sand/GitHub/mono/di/notes/guides/pre-flight/banned words.md"
if [ -f "$ALWAYS_FILE" ]; then
  cat "$ALWAYS_FILE"
fi
if [ -f "$BANNED_FILE" ]; then
  echo ""
  echo "--- BANNED WORDS (scan every draft against this before sending; swap each Never word for its Use word) ---"
  cat "$BANNED_FILE"
fi
exit 0
