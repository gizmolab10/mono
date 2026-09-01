#!/bin/bash
# Stop hook: read-this-turn.
#
# Every file named in a reply must have been read, edited or searched by a tool call
# in that same turn. A read from earlier in the session counts for nothing — a read
# forty turns old and a read this minute are indistinguishable from the inside, which
# is why pitfalls #1 does not let recency stand for a look.
#
# Unlike diagnostic-citation-check, this carries no word list to evade. It compares
# two sets of paths: those the reply names, and those a tool touched this turn.
#
# A turn is everything after the last message from Jonathan.
#
# WARN-ONLY, like every other judgment hook here — rejecting regenerates the reply
# and shows it twice. The violation is logged and the reply stands.

LOG_FILE="$(dirname "$0")/log.jsonl"
log_event() {
  jq -nc \
    --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg hook "read-this-turn-check" \
    --arg stop_hook_active "${STOP_HOOK_ACTIVE:-unknown}" \
    --arg action "$1" \
    --arg violations "$2" \
    --arg text_tail "$3" \
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

# This turn is every line after the last one Jonathan sent. Every tool result is
# also written as a "user" line, so his own are told apart by their content: a plain
# string, or a text block. A tool result carries a tool_result block instead.
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

# The reply itself: the last thing said, as words.
TEXT=$(echo "$TURN" | jq -r 'select(.type == "assistant") | .message.content[]? | select(.type == "text") | .text' 2>/dev/null | tail -100)
if [ -z "$TEXT" ]; then
  log_event "exit-no-text" "" ""
  exit 0
fi
TEXT_TAIL=$(echo "$TEXT" | tail -c 400)

# What a tool touched this turn: every file_path, and every path inside a bash command.
TOUCHED=$(echo "$TURN" \
  | jq -r 'select(.type == "assistant") | .message.content[]? | select(.type == "tool_use")
           | (.input.file_path // empty), (.input.command // empty), (.input.pattern // empty), (.input.path // empty)' 2>/dev/null)

# Every file the reply names, by its own name. A bare name is enough — the reply may
# write a path, a markdown link, or backticks, and all three end in the same name.
# No spaces in the run: a name with a space in it (a few md files have one) would
# otherwise swallow the prose around it and report a sentence as a filename.
NAMED=$(echo "$TEXT" \
  | grep -oE '[A-Za-z0-9_][A-Za-z0-9_.-]*\.(ts|svelte|css|json|js|md|sh|py|html|toml|mts)' \
  | sed 's/.*\///' | sort -u)

MISSING=""
for one in $NAMED; do
  echo "$TOUCHED" | grep -qF "$one" || MISSING="$MISSING $one"
done
MISSING=$(echo "$MISSING" | sed 's/^ *//;s/ *$//')

if [ -z "$MISSING" ]; then
  log_event "exit-all-read" "" "$TEXT_TAIL"
  exit 0
fi

log_event "warn" "$MISSING" "$TEXT_TAIL"
cat <<JSON
{"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"NAMED BUT NOT READ THIS TURN: $MISSING — pitfalls #1 says a sentence naming a file carries a citation from a tool call in the same reply. Either read them and say what they actually hold, or mark each such sentence \"unread:\"."}}
JSON
exit 0
