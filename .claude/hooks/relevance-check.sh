#!/bin/bash
# Stop hook: relevance-check.
#
# The one hook with judgment. Every other hook greps; this one hands the recent
# conversation and the newest reply to a small model (haiku) and asks two questions:
#   1. Which sentences do not help answer Jonathan's last message? (always #1)
#   2. Which load-bearing words is Jonathan left to guess at? (response #6)
# Cost per reply: a fraction of a cent.
#
# The call runs DETACHED: the hook logs a start row, kicks the call into a
# backgrounded subshell, and exits at once — the turn never waits on haiku.
# Every start row gets an ending row (clean, warn, no-judgment, or killed):
#   - a watcher kills the call after 90 seconds and logs "killed";
#   - on each run, the hook first flags any earlier start row that never got its
#     ending ("stale") — so every reply polices the one before.
#
# Log-only since 2 September 2026: no wake-up, no turn opened, nothing on
# Jonathan's screen. The rows are read on "check" and after corrections.
#
# The inner claude runs from $TMPDIR so this project's hooks and guides stay out
# of it, and RELEVANCE_JUDGE guards against co calling co calling co.

[ -n "$RELEVANCE_JUDGE" ] && exit 0

LOG_FILE="$(dirname "$0")/log.jsonl"
log_event() {
  jq -nc \
    --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg hook "relevance-check" \
    --arg action "$1" \
    --arg run "$2" \
    --arg findings "$3" \
    --arg text_tail "$4" \
    '{timestamp: $ts, hook: $hook, action: $action, run: $run, findings: $findings, text_tail: $text_tail}' \
    >> "$LOG_FILE" 2>/dev/null
}

INPUT=$(cat)

STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  log_event "exit-loop-guard" "" "" ""
  exit 0
fi

# Flag any earlier run that started and never ended — the fingerprint of a crash
# the watcher could not catch. Two minutes of grace covers the slowest real call.
NOW=$(date +%s)
STALE=$(grep '"hook":"relevance-check"' "$LOG_FILE" 2>/dev/null | jq -rs --argjson now "$NOW" '
  map(select(.run != null and .run != ""))
  | (map(select(.action != "start")) | map(.run)) as $ended
  | map(select(.action == "start"))
  | map(select((.run | inside($ended | join(" "))) | not))
  | map(select((.run | split("-")[0] | tonumber? // $now) < ($now - 120)))
  | map(.run) | join(" ")' 2>/dev/null)
if [ -n "$STALE" ]; then
  for RUN in $STALE; do
    log_event "stale" "$RUN" "started, never ended — the call or its shell died unlogged" ""
  done
fi

TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // ""')
if [ -z "$TRANSCRIPT" ] || [ ! -f "$TRANSCRIPT" ]; then
  log_event "exit-no-transcript" "" "" ""
  exit 0
fi

# This turn is every line from the last user line on (tool results are also user
# lines; the opener is the one whose content is a plain string or a text block).
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

OPENER=$(echo "$TURN" | head -1 | jq -r '
  .message.content as $c
  | if ($c | type) == "string" then $c
    else ([$c[]? | select(.type == "text") | .text] | join(" ")) end' 2>/dev/null)

# A hook-opened turn belongs to hook-answer-check; nothing here to judge.
if [ -z "$OPENER" ] || echo "$OPENER" | grep -q "Stop hook additional context"; then
  log_event "exit-hook-turn" "" "" ""
  exit 0
fi

# The recent conversation, so a short message like "3" or "go" keeps its meaning.
# Every spoken line, Jonathan's and co's, oldest first — all but the reply being
# judged, capped to the last 8 lines of 800 characters each.
CONVERSATION=$(jq -n --rawfile t "$TRANSCRIPT" '
  [$t | split("\n")[] | select(length > 0) | (fromjson? // empty)
   | if .type == "user"
        and ((.message.content | type) == "string"
             or (.message.content[0].type? // "") == "text")
     then {who: "Jonathan", text: (if (.message.content | type) == "string"
                                   then .message.content
                                   else ([.message.content[]? | select(.type == "text") | .text] | join(" ")) end)}
     elif .type == "assistant"
     then {who: "co", text: ([.message.content[]? | select(.type == "text") | .text] | join(" "))}
     else empty end
   | select(.text != "")]
  | .[0:-1] | .[-8:]
  | map(.who + ": " + (.text | .[0:800]))
  | join("\n\n")' 2>/dev/null)

TEXT=$(echo "$TURN" | jq -r 'select(.type == "assistant") | .message.content[]? | select(.type == "text") | .text' 2>/dev/null | tail -100)
TEXT_TAIL=$(echo "$TEXT" | tail -c 400)

# A reply too short to hide anything is not worth a model call.
if [ "${#TEXT}" -lt 120 ]; then
  log_event "exit-short" "" "" "$TEXT_TAIL"
  exit 0
fi

CLAUDE_BIN=$(command -v claude)
if [ -z "$CLAUDE_BIN" ]; then
  log_event "exit-no-claude" "" "" ""
  exit 0
fi

PROMPT="Below is the recent conversation between Jonathan and his collaborator co, then co's newest reply. Judge only the newest reply, by two rules, and answer with JSON only, no fences, no prose.
Rule A: every sentence must help answer Jonathan's last message, read in the light of the conversation. List the sentences that do not.
Rule B: every word the reply's meaning leans on must be everyday English, defined in the reply, or already used in the conversation. List the words Jonathan would have to ask about.
Empty lists are the right answer when the reply is clean. JSON shape: {\"irrelevant\":[],\"undefined\":[]}

CONVERSATION:
$CONVERSATION

NEWEST REPLY (judge this):
$TEXT"

RUN_ID="$(date +%s)-$$"
log_event "start" "$RUN_ID" "" "$TEXT_TAIL"

# The detached part. Its stdout and stderr must not hold the hook's pipes open,
# or the turn waits on it anyway.
(
  cd "${TMPDIR:-/tmp}" 2>/dev/null || cd /tmp
  OUT=$(mktemp)
  printf '%s' "$PROMPT" | RELEVANCE_JUDGE=1 "$CLAUDE_BIN" -p --model haiku --output-format text > "$OUT" 2>/dev/null &
  CPID=$!
  ( sleep 90; kill "$CPID" 2>/dev/null ) &
  WPID=$!
  wait "$CPID"
  RC=$?
  kill "$WPID" 2>/dev/null

  JUDGMENT=$(cat "$OUT")
  rm -f "$OUT"

  if [ "$RC" -ge 128 ] && [ -z "$JUDGMENT" ]; then
    log_event "killed" "$RUN_ID" "the call outlived 90 seconds and was killed" "$TEXT_TAIL"
    exit 0
  fi

  CLEANED=$(printf '%s' "$JUDGMENT" | sed -n '/{/,/}/p')
  IRRELEVANT=$(printf '%s' "$CLEANED" | jq -r '.irrelevant // [] | join(" | ")' 2>/dev/null)
  UNDEFINED=$(printf '%s' "$CLEANED" | jq -r '.undefined // [] | join(", ")' 2>/dev/null)

  if [ -z "$CLEANED" ]; then
    log_event "no-judgment" "$RUN_ID" "" "$TEXT_TAIL"
    exit 0
  fi
  if [ -z "$IRRELEVANT" ] && [ -z "$UNDEFINED" ]; then
    log_event "clean" "$RUN_ID" "" "$TEXT_TAIL"
    exit 0
  fi
  FINDINGS=""
  [ -n "$IRRELEVANT" ] && FINDINGS="sentences answering nothing: $IRRELEVANT"
  [ -n "$UNDEFINED" ] && FINDINGS="$FINDINGS${FINDINGS:+ — }words Jonathan would have to ask about: $UNDEFINED"
  log_event "warn" "$RUN_ID" "$FINDINGS" "$TEXT_TAIL"
) > /dev/null 2>&1 &

exit 0
