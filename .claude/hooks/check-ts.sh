#!/bin/bash
# Stop hook: type-check each project whose .ts or .svelte files were edited this
# turn (the list is recorded by mark-ts-check-pending.sh). Errors are emitted as
# non-blocking additionalContext, never as exit-2 blocks — the prior
# aggressive-block design was creating cascade failures that required VSCode
# reloads to recover.

MARKER="${TMPDIR}ts-check-pending"
REPO="/Users/sand/GitHub/mono"

# Nothing to do if no .ts/.svelte was edited this turn.
[ -f "$MARKER" ] || exit 0
PROJECTS=$(cat "$MARKER")
rm -f "$MARKER"

INPUT=$(cat)
# Loop-guard: don't re-fire when re-entered by a blocking Stop hook upstream.
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
[ "$STOP_HOOK_ACTIVE" = "true" ] && exit 0

REPORT=""
for PROJECT in $PROJECTS; do
	[ -d "$REPO/$PROJECT" ] || continue
	OUTPUT=$(cd "$REPO/$PROJECT" && yarn svelte-check --output human 2>&1)
	echo "$OUTPUT" | grep -q 'found 0 errors' && continue
	REPORT="$REPORT
svelte-check failed in $PROJECT. Output:
$(echo "$OUTPUT" | tail -40)"
done

[ -z "$REPORT" ] && exit 0
jq -n --arg reason "$REPORT" '{hookSpecificOutput: {hookEventName: "Stop", additionalContext: $reason}}'
exit 0