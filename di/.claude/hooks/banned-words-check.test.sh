#!/bin/bash
# Self-contained tests for banned-words-check.sh.
#   Run:  bash "di/.claude/hooks/banned-words-check.test.sh"
# Exits 0 when every check passes, 1 when any fails. No setup needed — it
# builds a throwaway transcript, fires the hook at it, and reads the verdict.

DIR="$(dirname "$0")"
HOOK="$DIR/banned-words-check.sh"
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
fire() { printf '{"stop_hook_active":%s,"transcript_path":"%s"}' "${1:-false}" "$TX" | bash "$HOOK"; }

# check NAME TEXT EXPECT(HARD|SENSE|CLEAN)
check() {
  local name="$1" text="$2" expect="$3" reason got
  set_text "$text"
  reason="$(fire false | jq -r '.reason // ""' 2>/dev/null)"
  got="CLEAN"
  case "$reason" in
    *"BANNED WORD"*) got="HARD" ;;
    *"SENSE CHECK"*) got="SENSE" ;;
  esac
  if [ "$got" = "$expect" ]; then
    echo "PASS: $name ($got)"; PASS=$((PASS+1))
  else
    echo "FAIL: $name — wanted $expect, got $got"; FAIL=$((FAIL+1))
  fi
}

check "hard base word"       "the feature shipped today"       HARD
check "sense-only word"      "i did a search of the files"     SENSE
check "clean text"           "everything reads fine on screen" CLEAN
check "hard doubled -ing"    "we are shipping it"              HARD
check "hard two-word phrase" "that is the heavy lifting part"  HARD
check "y to ies plural"      "the tool copies the file"        HARD
check "y to ied past"        "it copied the data"              HARD

# Loop cap: pretend we are mid-chain already at the cap; the hook must give up.
set_text "still shipped"
echo 3 > "$DIR/.bw-state-$(printf '%s' "$TX" | shasum | cut -c1-12)"
if [ -z "$(fire true)" ]; then
  echo "PASS: loop cap gives up (no block)"; PASS=$((PASS+1))
else
  echo "FAIL: loop cap — expected no block"; FAIL=$((FAIL+1))
fi

echo "----"
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
