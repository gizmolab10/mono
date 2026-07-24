#!/bin/bash
# UserPromptSubmit hook: injects always.md content into every response context,
# then the banned-words tables — so the pre-send self-scan (always rule 25) can
# check each draft against the real lists in front of it, not from memory.
#
# Two word lists go in: the shared every-project one, plus the list belonging to
# whichever project is being worked on (named by .working_project). Every project
# keeps its list at the same relative spot, exactly like the always files, so no
# project is named here — a project that has no list simply contributes nothing.
REPO="/Users/sand/GitHub/mono"
ALWAYS_FILE="$REPO/notes/guides/pre-flight/always.md"
BANNED_SHARED="$REPO/notes/guides/pre-flight/banned words.md"
PROJECT=$(cat "$REPO/.working_project" 2>/dev/null | tr -d '[:space:]')
BANNED_PROJECT="$REPO/$PROJECT/notes/guides/pre-flight/banned words.md"

if [ -f "$ALWAYS_FILE" ]; then
  cat "$ALWAYS_FILE"
fi

BANNED_FILES=()
[ -f "$BANNED_SHARED" ] && BANNED_FILES+=("$BANNED_SHARED")
[ -n "$PROJECT" ] && [ -f "$BANNED_PROJECT" ] && BANNED_FILES+=("$BANNED_PROJECT")

if [ ${#BANNED_FILES[@]} -gt 0 ]; then
  echo ""
  echo "--- BANNED WORDS (scan every draft against this before sending; swap each Never word for its Use word) ---"
  cat "${BANNED_FILES[@]}"
fi
exit 0