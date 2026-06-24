#!/bin/bash
# Pre-send check: pipe a draft response through this script before sending.
# Reads stdin. Reports undisclosed hedges, uncited diagnostic claims, verbose
# filler, and over-length drafts. Banned words are NOT checked here — the Stop
# hook (banned-words-check.sh) owns those, reading banned words.md as the single
# source. A clean exit here does not guarantee the banned-words Stop hook passes.
#
# Usage:   echo "draft text" | bash di/.claude/hooks/precheck.sh
#       or cat draft.txt    | bash di/.claude/hooks/precheck.sh
#
# Exit 0  = clean
# Exit 1  = violations found (printed to stderr)

TEXT=$(cat)

TRIGGER_RE='\b(likely|probably|seems like|seems to|appears to|must be|might be|could be|should be|my (hypothesis|guess|theory)|I (think|believe|suspect)|the (likely|probable) (cause|reason|culprit)|the cause is|the reason is)\b'
DISCLAIMER_RE='I AM (GUESSING|HEDGING)'

DIAG_RE='\b(the (cause|reason|culprit|problem|issue|bug) (is|was)|this is caused by|that is caused by|caused by the|because of the|due to the|comes from the)\b'
CITE_RE='([A-Za-z0-9_./-]+\.[A-Za-z]+:[0-9]+)|(\[[^]]+\]\([^)]+\))|(measured[^.]*=\s*[-0-9])|(I AM (GUESSING|HEDGING))'

EXIT=0

HEDGE=$(echo "$TEXT" | grep -oiE "$TRIGGER_RE" | tr '[:upper:]' '[:lower:]' | sort -u | tr '\n' ' ' | sed 's/ *$//')
if [ -n "$HEDGE" ]; then
  if ! echo "$TEXT" | grep -qE "$DISCLAIMER_RE"; then
    echo "HEDGE WITHOUT DISCLAIMER: $HEDGE" >&2
    EXIT=1
  fi
fi

DIAG=$(echo "$TEXT" | grep -oiE "$DIAG_RE" | tr '[:upper:]' '[:lower:]' | sort -u | tr '\n' ' ' | sed 's/ *$//')
if [ -n "$DIAG" ]; then
  if ! echo "$TEXT" | grep -qE "$CITE_RE"; then
    echo "DIAGNOSTIC WITHOUT CITATION: $DIAG" >&2
    EXIT=1
  fi
fi

# Conciseness check — flag common verbose-filler phrases and overly long drafts.
FLUFF_RE='\b(i hope this helps|let me know if|feel free to|in summary|to summarize|in short|as i mentioned|as discussed|essentially|basically|going forward|just to clarify|just a quick note|to be clear|in conclusion|the bottom line|that said|with that said|that being said|moving on|moving forward|i want to pause|want me to|ok to go|net read|net cost|net win|two paths forward|three paths forward|few options|a couple of options|some options here)\b'
FLUFF=$(echo "$TEXT" | grep -oiE "$FLUFF_RE" | tr '[:upper:]' '[:lower:]' | sort -u | tr '\n' ',' | sed 's/,$//' | sed 's/,/, /g')
if [ -n "$FLUFF" ]; then
  echo "VERBOSE FLUFF: $FLUFF" >&2
  EXIT=1
fi

# Length check — drafts beyond N words are too long unless explicitly listing facts (numbered/bulleted).
WORD_COUNT=$(echo "$TEXT" | wc -w | tr -d ' ')
HAS_LIST=$(echo "$TEXT" | grep -cE '^[[:space:]]*([-*][[:space:]]|[0-9]+\.|[A-Z]+\s*[:—-])')
SOFT_LIMIT=120
HARD_LIMIT=300
if [ "$WORD_COUNT" -gt "$HARD_LIMIT" ]; then
  echo "TOO LONG: $WORD_COUNT words (hard limit $HARD_LIMIT). Strip fluff or split." >&2
  EXIT=1
elif [ "$WORD_COUNT" -gt "$SOFT_LIMIT" ] && [ "$HAS_LIST" -eq 0 ]; then
  echo "TOO LONG: $WORD_COUNT words (soft limit $SOFT_LIMIT for prose with no list). Strip fluff or use a list." >&2
  EXIT=1
fi

exit $EXIT
