#!/bin/bash
# Stop hook: when at least one .ts or .svelte file was edited this turn
# (marker touched by mark-ts-check-pending.sh), run svelte-check at the
# end of the turn. Errors are emitted as non-blocking additionalContext,
# never as exit-2 blocks — the prior aggressive-block design was creating
# cascade failures that required VSCode reloads to recover.

MARKER="${TMPDIR}di-ts-check-pending"

# Nothing to do if no .ts/.svelte was edited this turn.
[ -f "$MARKER" ] || exit 0
rm -f "$MARKER"

INPUT=$(cat)
# Loop-guard: don't re-fire when re-entered by a blocking Stop hook upstream.
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
[ "$STOP_HOOK_ACTIVE" = "true" ] && exit 0

cd /Users/sand/GitHub/mono/di || exit 0
OUTPUT=$(yarn svelte-check --output human 2>&1)

if echo "$OUTPUT" | grep -q 'found 0 errors'; then
  exit 0
fi

# Errors present — emit them as additionalContext so Claude sees them
# next turn without blocking the current turn.
TAIL=$(echo "$OUTPUT" | tail -40)
REASON="svelte-check failed at end of turn. Output:
$TAIL"
jq -n --arg reason "$REASON" '{hookSpecificOutput: {hookEventName: "Stop", additionalContext: $reason}}'
exit 0
