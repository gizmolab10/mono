#!/bin/bash
# Proves saved-output-count.sh: a saved attachment makes a saved row with the harness's size and
# the division, a shown one makes a shown row with its own size, the same attachment is never
# counted twice, and the report mode says nothing until ten saves, then tallies them once.
#
# Nothing here touches the real record: the hook is copied with its folder pointed at a temp
# folder, and a made-up transcript is handed to it the way the harness hands one over.
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$HOOK_DIR/saved-output-count.sh"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
SCRIPT="$WORK/saved-output-count.sh"
sed "s#^HOOK_DIR=.*#HOOK_DIR=\"$WORK\"#" "$HOOK" > "$SCRIPT"
chmod +x "$SCRIPT"
rm -f "${TMPDIR:-/tmp}"/saved-output-count-*

PASS=0
FAIL=0
check() {
	if [ "$2" = "$3" ]; then PASS=$((PASS + 1)); else FAIL=$((FAIL + 1)); echo "FAIL: $1"; echo "  want: $3"; echo "  got:  $2"; fi
}

# One attachment entry, as the transcript keeps inject-always's output. The stdout is the
# whole text; the content is the same text when shown, or the harness's notice when saved.
attachment() {
	local id="$1" division="$2" saved="$3" body
	body="## Always

rules

--- ONE PART IN TURN: $division (turn 7 of 3; the others arrive on the turns after this) ---
words words words"
	if [ "$saved" = "yes" ]; then
		jq -nc --arg id "$id" --arg out "$body" \
			'{type:"attachment",attachment:{type:"hook_success",hookName:"UserPromptSubmit",toolUseID:$id,command:".claude/hooks/inject-always.sh",stdout:$out,content:("<persisted-output>\nOutput too large (16.2KB). Full output saved to: /nowhere/hook-1-stdout.txt\n\nPreview (first 2KB):\n## Always")}}'
	else
		jq -nc --arg id "$id" --arg out "$body" \
			'{type:"attachment",attachment:{type:"hook_success",hookName:"UserPromptSubmit",toolUseID:$id,command:".claude/hooks/inject-always.sh",stdout:$out,content:$out}}'
	fi
}

run_stop() {
	jq -nc --arg p "$WORK/chat.jsonl" '{transcript_path:$p}' | "$SCRIPT" > /dev/null
}

# --- a saved attachment ------------------------------------------------------
: > "$WORK/chat.jsonl"
attachment one memory/shared/truth/lexicon.md yes >> "$WORK/chat.jsonl"
run_stop
check "a saved attachment makes one row" "$(wc -l < "$WORK/saves.jsonl" | tr -d ' ')" "1"
check "the row says saved, the harness's size and the division" \
	"$(jq -c '{division,kb,saved}' "$WORK/saves.jsonl")" '{"division":"memory/shared/truth/lexicon.md","kb":"16.2","saved":true}'

# --- the same attachment again, as Stop firing twice -------------------------
run_stop
check "the same attachment is never counted twice" "$(wc -l < "$WORK/saves.jsonl" | tr -d ' ')" "1"

# --- a shown attachment ------------------------------------------------------
attachment two memory/shared/truth/agency.md no >> "$WORK/chat.jsonl"
run_stop
check "a shown attachment makes a shown row" "$(tail -1 "$WORK/saves.jsonl" | jq -c '{division,saved}')" '{"division":"memory/shared/truth/agency.md","saved":false}'
check "a shown row's size is the text's own, in KB" "$(tail -1 "$WORK/saves.jsonl" | jq -r '.kb')" "0.1"

# --- the report: nothing until ten saves, then once ---------------------------
REPORT=$(echo '{}' | "$SCRIPT" report)
check "no report under ten saves" "$REPORT" ""
for n in 3 4 5 6 7 8 9 10 11; do
	attachment "n$n" memory/shared/truth/conventions.md yes >> "$WORK/chat.jsonl"
	run_stop
done
check "ten saves counted" "$(grep -c '"saved":true' "$WORK/saves.jsonl")" "10"
REPORT=$(echo '{}' | "$SCRIPT" report | jq -r '.hookSpecificOutput.additionalContext')
check "the report tallies by division" "$(printf '%s' "$REPORT" | grep -o 'memory/shared/truth/conventions.md 9, memory/shared/truth/lexicon.md 1')" "memory/shared/truth/conventions.md 9, memory/shared/truth/lexicon.md 1"
check "the report bounds the limit" "$(printf '%s' "$REPORT" | grep -o 'smallest saved was 16.2KB and the largest shown whole was 0.1KB')" "smallest saved was 16.2KB and the largest shown whole was 0.1KB"
REPORT=$(echo '{}' | "$SCRIPT" report)
check "the report is given once" "$REPORT" ""

echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
