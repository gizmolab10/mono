#!/bin/bash
# Stop hook: diagnostic-citation (Option #5).
#
# Blocks if the last assistant message contains a diagnostic claim
# ("the cause is X", "the bug is X", "this is caused by X", etc.) without
# either an adjacent evidence citation (file:line pattern, markdown
# file-link, or a tool-output reference) OR the explicit "I AM GUESSING"
# disclaimer somewhere in the message.
#
# Mirrors banned-words-check.sh in structure.

LOG_FILE="$(dirname "$0")/log.jsonl"
log_event() {
  local action="$1"
  local violations_str="$2"
  local text_tail="$3"
  jq -nc \
    --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg hook "diagnostic-citation-check" \
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

# Diagnostic-claim patterns. Each names a cause as a confident fact.
DIAG_RE='\b(the (cause|reason|culprit|problem|issue|bug) (is|was)|this is caused by|that is caused by|caused by the|because of the|due to the|comes from the)\b'

# Citation patterns. Any of these in the same message satisfies the rule.
#   file:line                          → R_Dimensions.ts:512
#   markdown file link                 → [name.ext](path/to/file.ts) or [file:lineN](...)
#   measured value w/ explicit unit    → "measured X = 12 px", "drawn count = 5"
#   explicit guess disclaimer          → I AM GUESSING / I AM HEDGING
CITE_RE='([A-Za-z0-9_./-]+\.[A-Za-z]+:[0-9]+)|(\[[^]]+\]\([^)]+\))|(measured[^.]*=\s*[-0-9])|(I AM (GUESSING|HEDGING))'

# If no diagnostic claim, we are clean.
if ! echo "$TEXT" | grep -qiE "$DIAG_RE"; then
  log_event "exit-no-diagnostic" "" "$TEXT_TAIL"
  exit 0
fi

# Diagnostic present — require a citation somewhere in the message.
if echo "$TEXT" | grep -qE "$CITE_RE"; then
  log_event "exit-cited" "" "$TEXT_TAIL"
  exit 0
fi

FOUND=$(echo "$TEXT" | grep -oiE "$DIAG_RE" | tr '[:upper:]' '[:lower:]' | sort -u | tr '\n' ' ' | sed 's/ *$//')

# WARN-ONLY: rejecting here regenerates the reply, so the user sees it twice.
# We log the uncited diagnostic and let the reply stand — no reject, no double.
log_event "warn" "$FOUND" "$TEXT_TAIL"
exit 0
