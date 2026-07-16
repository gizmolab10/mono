#!/bin/bash
# Self-contained tests for banned-words-check.sh.
#   Run:  bash ".claude/hooks/banned-words-check.test.sh"
# Exits 0 when every check passes, 1 when any fails. No setup needed — it
# builds a throwaway transcript, fires the hook at it, and reads the verdict.
#
# The hook does NOT reject a reply (rejecting regenerates it, so the user sees
# it twice). It warns and records what it found in log.jsonl. So these tests
# read that log line — the hook's own account of what it caught.
#
# Only words from the shared every-project list are used here, so the result
# does not depend on which project is being worked on.

DIR="$(dirname "$0")"
HOOK="$DIR/banned-words-check.sh"
LOG="$DIR/log.jsonl"
TX="$(mktemp -t bwtx.XXXXXX)"
PASS=0; FAIL=0

cleanup() {
	rm -f "$TX"
	rm -f "$DIR/.bw-state-$(printf '%s' "$TX" | shasum | cut -c1-12)"
}
trap cleanup EXIT

set_text() {
	printf '{"type":"assistant","message":{"content":[{"type":"text","text":%s}]}}\n' \
		"$(jq -Rn --arg t "$1" '$t')" > "$TX"
}

fire() { printf '{"stop_hook_active":%s,"transcript_path":"%s"}' "${1:-false}" "$TX" | bash "$HOOK" >/dev/null 2>&1; }

last_action() { tail -1 "$LOG" 2>/dev/null | jq -r '.action // ""' 2>/dev/null; }
last_kind()   { tail -1 "$LOG" 2>/dev/null | jq -r '.kind // ""'   2>/dev/null; }

# check NAME TEXT EXPECT
#   EXPECT is a word the hook should have caught, or CLEAN when it should catch none.
check() {
	local name="$1" text="$2" expect="$3" action kind
	set_text "$text"
	fire false
	action="$(last_action)"
	kind="$(last_kind)"
	if [ "$expect" = "CLEAN" ]; then
		if [ "$action" = "exit-clean" ]; then
			echo "PASS: $name (nothing caught)"; PASS=$((PASS+1))
		else
			echo "FAIL: $name — wanted nothing caught, hook caught: ${kind:-?}"; FAIL=$((FAIL+1))
		fi
		return
	fi
	case "$kind" in
		*"$expect"*) echo "PASS: $name (caught $expect)"; PASS=$((PASS+1)) ;;
		*)           echo "FAIL: $name — wanted $expect, hook logged: ${kind:-nothing}"; FAIL=$((FAIL+1)) ;;
	esac
}

check "base word"        "the feature shipped today"      shipped
check "doubled -ing"     "we are shipping it"             shipping
check "two-word phrase"  "that is the heavy lifting part" "heavy lifting"
check "y to ies plural"  "the tool copies the file"       copies
check "y to ied past"    "it copied the data"             copied
check "sense-only word"  "i will land the change"         land
check "clean text"       "everything reads well"          CLEAN

# Loop cap: pretend we are mid-chain already at the cap; the hook must give up.
set_text "still shipped"
echo 3 > "$DIR/.bw-state-$(printf '%s' "$TX" | shasum | cut -c1-12)"
fire true
if [ "$(last_action)" = "exit-cap" ]; then
	echo "PASS: loop cap gives up"; PASS=$((PASS+1))
else
	echo "FAIL: loop cap — wanted exit-cap, got $(last_action)"; FAIL=$((FAIL+1))
fi

echo "----"
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]