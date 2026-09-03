#!/bin/bash
# Tests for hook-answer-check.sh. Builds small transcripts and checks which warn.

HOOK="$(dirname "$0")/hook-answer-check.sh"
DIR=$(mktemp -d)
PASS=0
FAIL=0

run_case() {
  local name="$1" opener="$2" reply="$3" expect="$4"
  local t="$DIR/$name.jsonl"
  jq -nc --arg o "$opener" '{type:"user",message:{content:$o}}' > "$t"
  jq -nc --arg r "$reply" '{type:"assistant",message:{content:[{type:"text",text:$r}]}}' >> "$t"
  jq -nc --arg t "$t" '{transcript_path:$t,stop_hook_active:false}' | bash "$HOOK" > /dev/null
  local got="clean"
  [ "$(tail -1 "$(dirname "$HOOK")/log.jsonl" | jq -r .action)" = "warn" ] && got="warn"
  if [ "$got" = "$expect" ]; then
    PASS=$((PASS+1))
  else
    FAIL=$((FAIL+1))
    echo "FAIL: $name — expected $expect, got $got"
  fi
}

run_case "a-verifies" \
  "<system-reminder>Stop hook additional context: NAMED BUT NOT READ THIS TURN: learn.md</system-reminder>" \
  "Verified — both hold what the reply said." \
  "warn"

run_case "a-mentions-hook" \
  "<system-reminder>Stop hook additional context: NAMED BUT NOT READ THIS TURN: learn.md</system-reminder>" \
  "Did what the hook wanted." \
  "warn"

run_case "a-fault-report" \
  "<system-reminder>Stop hook additional context: NAMED BUT NOT READ THIS TURN: learn.md</system-reminder>" \
  "btw: pitfalls.md line 3 names a rule that no longer exists." \
  "clean"

run_case "b-clean-hook-work" \
  "go 1" \
  "The new hook script is written and wired into settings." \
  "clean"

run_case "b-verifies-unasked" \
  "i rewrote 8. chime" \
  "Verified the file as the hook asked." \
  "warn"

run_case "b-verify-asked" \
  "verify the log please" \
  "Verified — the log holds three warn rows." \
  "clean"

echo "pass=$PASS fail=$FAIL"
rm -rf "$DIR"
[ "$FAIL" = "0" ]
