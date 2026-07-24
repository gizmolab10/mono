#!/bin/bash
# PostToolUse hook: when an Edit or Write touches a .ts or .svelte file, record
# which project that file belongs to, so the Stop hook type-checks the project
# actually edited (and only those). Fast (~10ms) — just a path match.
MARKER="${TMPDIR}ts-check-pending"
REPO="/Users/sand/GitHub/mono"

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -n "$FILE_PATH" ] || exit 0
echo "$FILE_PATH" | grep -qE '\.(ts|svelte)$' || exit 0

# The project is the first folder under the repo root, and only counts when that
# folder is a real project — it has its own package.json. Edits elsewhere (notes,
# hooks) have nothing to type-check.
PROJECT=$(printf '%s' "$FILE_PATH" | sed -nE "s|^$REPO/([^/]+)/.*|\1|p")
[ -n "$PROJECT" ] || exit 0
[ -f "$REPO/$PROJECT/package.json" ] || exit 0

# Record it once per turn; the Stop hook reads and clears the list.
grep -qxF "$PROJECT" "$MARKER" 2>/dev/null || echo "$PROJECT" >> "$MARKER"
exit 0