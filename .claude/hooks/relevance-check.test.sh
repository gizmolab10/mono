#!/bin/bash
# Tests for relevance-check.sh. A fake claude on PATH answers with canned JSON,
# so the plumbing is proved without a model call. One real call is a manual act:
#   bash relevance-check.test.sh real

HOOK="$(cd "$(dirname "$0")" && pwd)/relevance-check.sh"
DIR=$(mktemp -d)
PASS=0
FAIL=0

make_transcript() {
  local t="$DIR/$1.jsonl" opener="$2" reply="$3"
  jq -nc --arg o "$opener" '{type:"user",message:{content:$o}}' > "$t"
  jq -nc --arg r "$reply" '{type:"assistant",message:{content:[{type:"text",text:$r}]}}' >> "$t"
  echo "$t"
}

fake_claude() {
  mkdir -p "$DIR/bin"
  printf '#!/bin/bash\ncat > /dev/null\nprintf %%s "$FAKE_JUDGMENT"\n' > "$DIR/bin/claude"
  chmod +x "$DIR/bin/claude"
}

run_case() {
  local name="$1" opener="$2" reply="$3" judgment="$4" expect="$5"
  local t out got
  t=$(make_transcript "$name" "$opener" "$reply")
  local LOG="$(dirname "$HOOK")/log.jsonl"
  local before=$(grep -c '"hook":"relevance-check"' "$LOG")
  jq -nc --arg t "$t" '{transcript_path:$t,stop_hook_active:false}' \
    | PATH="$DIR/bin:$PATH" FAKE_JUDGMENT="$judgment" bash "$HOOK" > /dev/null
  # The verdict row arrives from the detached part; poll until the newest row is
  # not "start" (foreground exits land at once, endings a moment later).
  local i last
  for i in $(seq 1 50); do
    last=$(grep '"hook":"relevance-check"' "$LOG" | tail -1 | jq -r .action)
    [ "$(grep -c '"hook":"relevance-check"' "$LOG")" -gt "$before" ] && [ "$last" != "start" ] && break
    sleep 0.1
  done
  got="clean"
  [ "$last" = "warn" ] && got="warn"
  if [ "$got" = "$expect" ]; then
    PASS=$((PASS+1))
  else
    FAIL=$((FAIL+1))
    echo "FAIL: $name — expected $expect, got $got"
  fi
}

LONG_REPLY="The dispatcher reads every request and forwards each to its handler. The handler validates the payload before saving. Also, unrelatedly, the weather module is elegant."

fake_claude

run_case "warn-on-findings" "how does saving work?" "$LONG_REPLY" \
  '{"irrelevant":["Also, unrelatedly, the weather module is elegant."],"undefined":["dispatcher"]}' \
  "warn"

run_case "clean-when-empty" "how does saving work?" "$LONG_REPLY" \
  '{"irrelevant":[],"undefined":[]}' \
  "clean"

run_case "clean-on-garbage" "how does saving work?" "$LONG_REPLY" \
  'not json at all' \
  "clean"

run_case "skip-short-reply" "how does saving work?" "yes" \
  '{"irrelevant":["yes"],"undefined":[]}' \
  "clean"

run_case "skip-hook-turn" "<system-reminder>Stop hook additional context: blah</system-reminder>" "$LONG_REPLY" \
  '{"irrelevant":["x"],"undefined":[]}' \
  "clean"

echo "pass=$PASS fail=$FAIL"

if [ "$1" = "real" ]; then
  t="$DIR/real.jsonl"
  jq -nc '{type:"user",message:{content:"the fan noise: 1. replace the fan 2. slow it in settings 3. leave it alone. which?"}}' > "$t"
  jq -nc '{type:"assistant",message:{content:[{type:"text",text:"2 is cheapest and quietest today; 1 lasts longest. Pick a number."}]}}' >> "$t"
  jq -nc '{type:"user",message:{content:"3"}}' >> "$t"
  jq -nc '{type:"assistant",message:{content:[{type:"text",text:"Done — the fan is untouched and the settings file was not opened. The noise level will still spike under heavy load, as before."}]}}' >> "$t"
  jq -nc --arg t "$t" '{transcript_path:$t,stop_hook_active:false}' | bash "$HOOK"
  echo "(real call above — empty output means clean; read log.jsonl for the row)"
fi

rm -rf "$DIR"
[ "$FAIL" = "0" ]
