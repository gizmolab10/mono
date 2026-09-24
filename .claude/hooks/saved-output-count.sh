#!/bin/bash
# Counts each time the Claude harness saves inject-always.sh's output to a file instead of
# showing it whole, and which division of the rotation caused it. Decided 21 September 2026,
# the measurement before the rotation is cut into seven pieces.
#
# Two modes, told apart by the first argument:
#
#   (none)   Stop hook. The transcript keeps every hook's output as an attachment entry: its
#            stdout whole, and its content as co read it — the whole text when shown, or the
#            harness's notice, "Output too large (N KB). Full output saved to: ...", when saved.
#            The last inject-always attachment is read and one row goes to saves.jsonl: the
#            date, the size in KB, the division named on its ONE PART IN TURN line, and
#            saved or shown. Never counts the same attachment twice.
#
#   report   UserPromptSubmit hook. When the saves counted since the last report reach ten,
#            prints the tally as context for co to report in the chat: which division and how
#            often, and the sizes that bound the harness's limit. Otherwise prints nothing.
#
# Never blocks. Run .claude/hooks/saved-output-count.test.sh to prove both modes.
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAVES_FILE="$HOOK_DIR/saves.jsonl"
REPORT_STATE="$HOOK_DIR/.saves-reported"
STATE_DIR="${TMPDIR:-/tmp}"
EVERY=10

INPUT=$(cat)

if [ "$1" = "report" ]; then
	[ -f "$SAVES_FILE" ] || exit 0
	SAVED=$(grep -c '"saved":true' "$SAVES_FILE" 2>/dev/null || echo 0)
	REPORTED=$(cat "$REPORT_STATE" 2>/dev/null || echo 0)
	case "$REPORTED" in *[!0-9]*|"") REPORTED=0;; esac
	[ $((SAVED - REPORTED)) -ge "$EVERY" ] || exit 0
	printf '%s' "$SAVED" > "$REPORT_STATE"
	TALLY=$(jq -rs '
		def kb: (.kb | tonumber);
		(map(select(.saved)) | group_by(.division) | map("\(.[0].division) \(length)") | join(", ")) as $by
		| (map(select(.saved)) | map(kb) | min) as $smallest_saved
		| (map(select(.saved | not)) | map(kb) | max) as $largest_shown
		| (map(select(.saved)) | length) as $saves
		| (length) as $turns
		| "Saved-output count: \($saves) saves in \($turns) turns counted, by division: \($by). The smallest saved was \($smallest_saved)KB and the largest shown whole was \($largest_shown // 0)KB, so the harness saves somewhere between. Report this to Jonathan in this reply, in one or two sentences: which division and how often."
	' "$SAVES_FILE" 2>/dev/null)
	[ -n "$TALLY" ] || exit 0
	printf '%s' "$TALLY" | jq -Rs '{hookSpecificOutput: {hookEventName: "UserPromptSubmit", additionalContext: .}}'
	exit 0
fi

TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // ""')
if [ -z "$TRANSCRIPT" ] || [ ! -f "$TRANSCRIPT" ]; then exit 0; fi

# The last attachment inject-always wrote, whole: its id, whether the harness saved it, the
# size it announced or the size of the whole text, and the division on its ONE PART line.
ROW=$(jq -c '
	select(.type=="attachment")
	| select(.attachment.hookName=="UserPromptSubmit")
	| select((.attachment.stdout // "") | test("ONE PART IN TURN"))
	| {
		id: .attachment.toolUseID,
		saved: ((.attachment.content // "") | startswith("<persisted-output>")),
		kb: (
			((.attachment.content // "") | capture("Output too large \\((?<n>[0-9.]+)KB\\)") | .n)
			// (((.attachment.stdout // "") | length) / 1024 * 10 | round / 10 | tostring)
		),
		division: ((.attachment.stdout // "") | capture("ONE PART IN TURN: (?<f>[^ ]+)") | .f)
	}' "$TRANSCRIPT" 2>/dev/null | tail -1)
[ -n "$ROW" ] || exit 0

# Stop can fire more than once for one reply, and a reply's attachment is the same each time.
KEY=$(printf '%s' "$TRANSCRIPT" | shasum | cut -c1-12)
STATE="$STATE_DIR/saved-output-count-$KEY"
ID=$(printf '%s' "$ROW" | jq -r '.id')
[ "$(cat "$STATE" 2>/dev/null)" = "$ID" ] && exit 0
printf '%s' "$ID" > "$STATE"

printf '%s' "$ROW" | jq -c --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '{timestamp: $ts, kb: .kb, division: .division, saved: .saved}' >> "$SAVES_FILE" 2>/dev/null
exit 0
