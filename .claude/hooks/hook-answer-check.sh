#!/bin/bash
# Stop hook: hook-answer-check.
#
# response #8: never answer a hook on screen. A hook's complaint occurs in co's
# context; the fix runs silently, and only a real fault is reported. This check
# warns when the reply is answering a hook instead of Jonathan.
#
# Two cases, told apart by what opened the turn:
#   A. A Stop-hook system-reminder opened it — no message from Jonathan exists.
#      A reply that talks about the hook or uses verification language is
#      answering the hook.
#   B. Jonathan's own message opened it. Verification language warns only when
#      his message asked for no verifying (verify, confirm, prove, check, test).
#
# WARN-ONLY, like every other judgment hook here — rejecting regenerates the
# reply and shows it twice. The violation is logged and the reply is kept.

LOG_FILE="$(dirname "$0")/log.jsonl"
log_event() {
  jq -nc \
    --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg hook "hook-answer-check" \
    --arg action "$1" \
    --arg case "$2" \
    --arg text_tail "$3" \
    '{timestamp: $ts, hook: $hook, action: $action, case: $case, text_tail: $text_tail}' \
    >> "$LOG_FILE" 2>/dev/null
}

INPUT=$(cat)

STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  log_event "exit-loop-guard" "" ""
  exit 0
fi

TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // ""')
if [ -z "$TRANSCRIPT" ] || [ ! -f "$TRANSCRIPT" ]; then
  log_event "exit-no-transcript" "" ""
  exit 0
fi

# This turn is every line from the last user line on. Every tool result is also
# written as a user line; the opener is told apart by its content: a plain
# string, or a text block.
LAST_USER=$(jq -n --rawfile t "$TRANSCRIPT" '
  ($t | split("\n") | map(select(length > 0)))
  | to_entries
  | map(select(
      (.value | fromjson? // empty) as $line
      | $line.type == "user"
      and (($line.message.content | type) == "string"
           or ($line.message.content[0].type? // "") == "text")))
  | (last.key // -1) + 1' 2>/dev/null)
[ -z "$LAST_USER" ] || [ "$LAST_USER" = "0" ] && LAST_USER=1
TURN=$(tail -n +"$LAST_USER" "$TRANSCRIPT")

# The opener: the words of the turn's first line, whoever wrote them.
OPENER=$(echo "$TURN" | head -1 | jq -r '
  .message.content as $c
  | if ($c | type) == "string" then $c
    else ([$c[]? | select(.type == "text") | .text] | join(" ")) end' 2>/dev/null)

# The reply itself: the last thing said, as words.
TEXT=$(echo "$TURN" | jq -r 'select(.type == "assistant") | .message.content[]? | select(.type == "text") | .text' 2>/dev/null | tail -100)
if [ -z "$TEXT" ]; then
  log_event "exit-no-text" "" ""
  exit 0
fi
TEXT_TAIL=$(echo "$TEXT" | tail -c 400)

VERIFYING='(verified|verification|confirmed|as (the )?hook (asked|requested)|the hook asked|hook complaint)'

if echo "$OPENER" | grep -q "Stop hook additional context"; then
  # Case A: no message from Jonathan opened this turn.
  # Log-only since 2 September 2026: a wake-up opened a turn that had to end
  # visibly on Jonathan's screen. The rows are read on "check" and after corrections.
  if echo "$TEXT" | grep -qiE "$VERIFYING|\bhooks?\b"; then
    log_event "warn" "A" "$TEXT_TAIL"
    exit 0
  fi
  log_event "exit-clean" "A" "$TEXT_TAIL"
  exit 0
fi

# Case B: Jonathan opened the turn. If he asked for verifying, it belongs.
if echo "$OPENER" | grep -qiE '(verif|confirm|prove|check|test)'; then
  log_event "exit-asked" "B" "$TEXT_TAIL"
  exit 0
fi
if echo "$TEXT" | grep -qiE "$VERIFYING"; then
  log_event "warn" "B" "$TEXT_TAIL"
  exit 0
fi
log_event "exit-clean" "B" "$TEXT_TAIL"
exit 0
