#!/bin/bash
# Stop hook: refer-to-current-file.
#
# Enforces Jonathan's rule "discard all your versions; refer ONLY to current
# file content". Blocks if the assistant's last message names any project
# file (path ending in a known source/doc extension) without a Read, Edit,
# or Write tool call on that file in the current turn.
#
# Tool-result messages are also type=user in the transcript — they are
# filtered out so the "current turn" boundary uses real user prompts only.

LOG_FILE="$(dirname "$0")/log.jsonl"
log_event() {
  local action="$1"
  local violations="$2"
  local text_tail="$3"
  jq -nc \
    --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg hook "refer-to-current-file" \
    --arg stop_hook_active "${STOP_HOOK_ACTIVE:-unknown}" \
    --arg action "$action" \
    --arg violations "$violations" \
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

# Walk the transcript: emit "@USER@" for each REAL user prompt (text content,
# not tool_result), and the file_path for each Read/Edit/Write tool call.
# Then take the slice AFTER the last @USER@ marker — that's the current turn.
TOUCHED=$(jq -r '
  if .type == "user" and ((.message.content // []) | type == "array" and any(.type == "text")) then
    "@USER@"
  elif .type == "assistant" then
    .message.content[]? | select(.type == "tool_use" and (.name == "Read" or .name == "Edit" or .name == "Write")) | (.input.file_path // empty)
  else
    empty
  end
' "$TRANSCRIPT" 2>/dev/null | tac | awk 'BEGIN{p=1} /^@USER@$/{exit} p' | tac)

# Detect file path tokens in the assistant text. Match anything ending in
# a known project file extension.
TEXT_FILES=$(echo "$TEXT" | grep -oE '[A-Za-z0-9_./~-]+\.(ts|tsx|js|jsx|svelte|md|json|sh|css|html|yml|yaml)\b' | sort -u)

if [ -z "$TEXT_FILES" ]; then
  log_event "exit-no-file-refs" "" "$TEXT_TAIL"
  exit 0
fi

VIOLATORS=""
while IFS= read -r f; do
  [ -z "$f" ] && continue
  # Skip references that are not project files in a meaningful sense.
  case "$f" in
    node_modules*|*.lock|package.json|package-lock.json|tsconfig.json|*.test.ts) ;;
    *)
      # Is the mentioned filename a substring of any touched path? grep -F.
      if [ -z "$TOUCHED" ] || ! echo "$TOUCHED" | grep -qF -- "$f"; then
        VIOLATORS="$VIOLATORS $f"
      fi
      ;;
  esac
done <<< "$TEXT_FILES"

VIOLATORS=$(echo "$VIOLATORS" | xargs)
if [ -z "$VIOLATORS" ]; then
  log_event "exit-clean" "" "$TEXT_TAIL"
  exit 0
fi

REASON="FILE REFERENCE WITHOUT READ: your previous response names project file(s) [${VIOLATORS}] that you did NOT Read/Edit/Write in this turn. The rule: discard all your remembered versions of a file — refer ONLY to current file content. Either Read each named file in this turn before referring to it, or remove the reference. Do not start the next task — just rewrite that one response."

log_event "block" "$VIOLATORS" "$TEXT_TAIL"
jq -n --arg reason "$REASON" '{decision: "block", reason: $reason}'
