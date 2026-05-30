#!/bin/bash
# Stop hook: checks the last assistant message for banned words listed in
# di/notes/guides/development/learn/lexicon.md. If any are found,
# returns a block decision so Claude is re-invoked with the violation as
# context and must rewrite the response before stopping.

LOG_FILE="$(dirname "$0")/log.jsonl"
log_event() {
  local action="$1"
  local violations_str="$2"
  local text_tail="$3"
  jq -nc \
    --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg hook "banned-words-check" \
    --arg stop_hook_active "${STOP_HOOK_ACTIVE:-unknown}" \
    --arg action "$action" \
    --arg violations "$violations_str" \
    --arg text_tail "$text_tail" \
    '{timestamp: $ts, hook: $hook, stop_hook_active: $stop_hook_active, action: $action, violations: $violations, text_tail: $text_tail}' \
    >> "$LOG_FILE" 2>/dev/null
}

INPUT=$(cat)

# Avoid infinite loop — only run once per stop event.
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

# Pull the last assistant message line and concatenate its text blocks.
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

# Banned words. Sourced from the "Banned substitutions" table in
# di/notes/guides/development/learn/lexicon.md. Only the unambiguous
# ones are listed here — words like "block", "cell", "value", "padding",
# "bar" have many legitimate uses outside the banned sense and would
# generate noisy false positives.
BANNED_RE='\b(land|landed|lands|landing|ship|shipped|shipping|absorb|absorbed|absorbs|absorbing|scaffold|scaffolded|scaffolding|scaffolds|eyeball|bigger lift|heavy lift|heavy lifting)\b'

FOUND=$(echo "$TEXT" | grep -oiE "$BANNED_RE" | tr '[:upper:]' '[:lower:]' | sort -u | tr '\n' ' ' | sed 's/ *$//')
if [ -z "$FOUND" ]; then
  log_event "exit-clean" "" "$TEXT_TAIL"
  exit 0
fi

REASON="LEXICON VIOLATION: your previous response contains banned word(s): ${FOUND}. Rewrite that response using the approved synonyms from di/notes/guides/development/learn/lexicon.md (e.g., land/landed -> add, insert, write, update, done, applied; ship/shipped -> done, complete, write code; absorb -> place, include, inserted; scaffold -> stub out; eyeball -> needs visual confirmation). Do not start the next task or add anything new — just rewrite that one response."

log_event "block" "$FOUND" "$TEXT_TAIL"
# Block the stop so Claude is re-invoked with the reason as additional prompt.
jq -n --arg reason "$REASON" '{decision: "block", reason: $reason}'
