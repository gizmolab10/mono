#!/bin/bash
# Stop hook: required-disclaimer (Option #4).
#
# Blocks if the last assistant message contains plausibility-mode trigger
# words ("likely", "probably", "I believe", etc.) AND does not also contain
# the explicit disclaimer "I AM GUESSING". The disclaimer pattern is the
# project's existing guess-rule marker.
#
# Mirrors banned-words-check.sh in structure.

LOG_FILE="$(dirname "$0")/log.jsonl"
log_event() {
  local action="$1"
  local violations_str="$2"
  local text_tail="$3"
  jq -nc \
    --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg hook "required-disclaimer-check" \
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

TEXT_TAIL=$(echo "$TEXT" | tail -c 400)

# Trigger phrases that signal plausibility-mode (hedged claims).
# Each is a word-boundary regex; "I think" / "I believe" / "my hypothesis"
# / "the cause is" / "the reason is" are multi-word and matched as such.
TRIGGER_RE='\b(likely|probably|seems like|seems to|appears to|must be|might be|could be|should be|my (hypothesis|guess|theory)|I (think|believe|suspect)|the (likely|probable) (cause|reason|culprit)|the cause is|the reason is)\b'

# Allow if the explicit guess disclaimer is present anywhere in the message.
DISCLAIMER_RE='I AM (GUESSING|HEDGING)'

if echo "$TEXT" | grep -qE "$DISCLAIMER_RE"; then
  log_event "exit-has-disclaimer" "" "$TEXT_TAIL"
  exit 0
fi

FOUND=$(echo "$TEXT" | grep -oiE "$TRIGGER_RE" | tr '[:upper:]' '[:lower:]' | sort -u | tr '\n' ' ' | sed 's/ *$//')
if [ -z "$FOUND" ]; then
  log_event "exit-clean" "" "$TEXT_TAIL"
  exit 0
fi

REASON="PLAUSIBILITY-MODE VIOLATION: your previous response contains hedging word(s) [${FOUND}] without the required disclaimer. Either cite the evidence (file:line, measured value, tool output) and remove the hedging language, or prefix the relevant statement(s) with 'I AM GUESSING' so the uncertainty is explicit. Do not start the next task — just rewrite that one response."

log_event "block" "$FOUND" "$TEXT_TAIL"
jq -n --arg reason "$REASON" '{decision: "block", reason: $reason}'
