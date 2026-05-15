#!/bin/bash
# Stop hook: checks the last assistant message for three banned habit patterns:
#   3) asking permission to stop or save progress
#   4) asking permission to read
#   5) hollow reassurances ("won't happen again" and friends)
# Each pattern has its own rule in memory. If any pattern fires, returns a
# block decision so Claude is re-invoked and must rewrite the response.

LOG_FILE="$(dirname "$0")/log.jsonl"
log_event() {
  local action="$1"
  local violations_str="$2"
  local text_tail="$3"
  jq -nc \
    --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg hook "phrase-check" \
    --arg stop_hook_active "${STOP_HOOK_ACTIVE:-unknown}" \
    --arg action "$action" \
    --arg violations "$violations_str" \
    --arg text_tail "$text_tail" \
    '{timestamp: $ts, hook: $hook, stop_hook_active: $stop_hook_active, action: $action, violations: $violations, text_tail: $text_tail}' \
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

LAST_ASSISTANT_LINE=$(jq -c 'select(.type == "assistant")' "$TRANSCRIPT" 2>/dev/null | tail -1)
if [ -z "$LAST_ASSISTANT_LINE" ]; then
  log_event "exit-no-assistant-line" "" ""
  exit 0
fi

TEXT=$(echo "$LAST_ASSISTANT_LINE" | jq -r '.message.content[]? | select(.type == "text") | .text' 2>/dev/null)
if [ -z "$TEXT" ]; then
  log_event "exit-no-text" "" ""
  exit 0
fi

# Tail of the text for logging (last 400 chars).
TEXT_TAIL=$(echo "$TEXT" | tail -c 400)

VIOLATIONS=""

# 3) Asking permission to stop or save progress
if echo "$TEXT" | grep -qiE '(save progress|stop here\??|should I stop|shall I stop|want me to stop|do you want me to stop)'; then
  VIOLATIONS="${VIOLATIONS}
- asking permission to stop or save progress — never ask; just keep working"
fi

# 4) Asking permission to read
if echo "$TEXT" | grep -qiE '(may I read|should I read|can I read|want me to read|shall I read|do you want me to read)'; then
  VIOLATIONS="${VIOLATIONS}
- asking permission to read — never ask; read to verify claims instead"
fi

# 5) Hollow reassurances
if echo "$TEXT" | grep -qiE "(won'?t happen again|will not happen again|i'?ll be more careful|i promise|you can count on me|i'?ll do better|i will do better)"; then
  VIOLATIONS="${VIOLATIONS}
- hollow reassurance — do not promise to do better; just change the behavior"
fi

if [ -z "$VIOLATIONS" ]; then
  log_event "exit-clean" "" "$TEXT_TAIL"
  exit 0
fi

REASON="HABIT VIOLATION: your previous response contained the following pattern(s):${VIOLATIONS}

Rewrite the response to remove these patterns. Do not start the next task or add anything new — just rewrite that one response."

log_event "block" "$VIOLATIONS" "$TEXT_TAIL"
jq -n --arg reason "$REASON" '{decision: "block", reason: $reason}'
