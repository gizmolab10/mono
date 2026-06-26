#!/bin/bash
# Stop hook: conciseness. Blocks a reply that carries verbose filler or runs too
# long, so it gets tightened before it stands. The hedge, diagnostic-citation,
# and banned-word checks are their own Stop hooks; this one owns ONLY filler and
# length. These regexes used to live in precheck.sh (run by hand before each
# reply); moving them here means the model never has to run precheck itself.
#
# A per-chain counter (keyed by transcript) caps retries so a reply that cannot
# be shortened enough never loops forever.

HOOK_DIR="$(dirname "$0")"
LOG_FILE="$HOOK_DIR/log.jsonl"
CAP=3

INPUT=$(cat)
STOP_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // ""')
if [ -z "$TRANSCRIPT" ] || [ ! -f "$TRANSCRIPT" ]; then exit 0; fi

LAST=$(jq -c 'select(.type=="assistant")' "$TRANSCRIPT" 2>/dev/null | tail -1)
if [ -z "$LAST" ]; then exit 0; fi
TEXT=$(echo "$LAST" | jq -r '.message.content[]? | select(.type=="text") | .text' 2>/dev/null)
if [ -z "$TEXT" ]; then exit 0; fi

# --- the two checks ----------------------------------------------------------
FLUFF_RE='\b(i hope this helps|let me know if|feel free to|in summary|to summarize|in short|as i mentioned|as discussed|essentially|basically|going forward|just to clarify|just a quick note|to be clear|in conclusion|the bottom line|that said|with that said|that being said|moving on|moving forward|i want to pause|want me to|ok to go|net read|net cost|net win|two paths forward|three paths forward|few options|a couple of options|some options here)\b'
FLUFF=$(echo "$TEXT" | grep -oiE "$FLUFF_RE" | tr '[:upper:]' '[:lower:]' | sort -u | tr '\n' ',' | sed 's/,$//' | sed 's/,/, /g')

WORD_COUNT=$(echo "$TEXT" | wc -w | tr -d ' ')
HAS_LIST=$(echo "$TEXT" | grep -cE '^[[:space:]]*([-*][[:space:]]|[0-9]+\.|[A-Z]+\s*[:—-])')
SOFT_LIMIT=120
HARD_LIMIT=300

VIOL=""
[ -n "$FLUFF" ] && VIOL="verbose filler ($FLUFF)"
if [ "$WORD_COUNT" -gt "$HARD_LIMIT" ]; then
  VIOL="${VIOL:+$VIOL; }too long: $WORD_COUNT words (hard limit $HARD_LIMIT) — strip fluff or split"
elif [ "$WORD_COUNT" -gt "$SOFT_LIMIT" ] && [ "$HAS_LIST" -eq 0 ]; then
  VIOL="${VIOL:+$VIOL; }too long: $WORD_COUNT words (soft limit $SOFT_LIMIT for prose with no list) — strip fluff or use a list"
fi

# --- bounded loop guard ------------------------------------------------------
KEY=$(printf '%s' "$TRANSCRIPT" | shasum | cut -c1-12)
STATE="$HOOK_DIR/.cc-state-$KEY"
if [ "$STOP_ACTIVE" = "true" ]; then COUNT=$(cat "$STATE" 2>/dev/null || echo 0); else COUNT=0; fi
case "$COUNT" in *[!0-9]*|"") COUNT=0;; esac

# Clean -> let it stand and clear the counter.
if [ -z "$VIOL" ]; then rm -f "$STATE"; exit 0; fi
# Cap reached -> give up so the chain cannot spin.
if [ "$COUNT" -ge "$CAP" ]; then rm -f "$STATE"; exit 0; fi

echo $((COUNT+1)) > "$STATE"
REASON="CONCISENESS: your previous reply has $VIOL. Tighten that one reply — cut the filler, keep facts only, use a short list if it helps. Do not add anything new or start the next task."
jq -n --arg r "$REASON" '{decision:"block",reason:$r}'
exit 0