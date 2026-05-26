#!/bin/bash
# Pre-send check: pipe a draft response through this script before sending.
# Reads stdin. Reports any banned words, undisclosed hedges, or
# uncited diagnostic claims. Mirrors the actual stop-hook regexes so a
# clean exit here means the stop hooks will not fire on the response.
#
# Usage:   echo "draft text" | bash di/.claude/hooks/precheck.sh
#       or cat draft.txt    | bash di/.claude/hooks/precheck.sh
#
# Exit 0  = clean
# Exit 1  = violations found (printed to stderr)

TEXT=$(cat)

BANNED_RE='\b(land|landed|lands|landing|ship|shipped|shipping|absorb|absorbed|absorbs|absorbing|scaffold|scaffolded|scaffolding|scaffolds|eyeball|bigger lift|heavy lift|heavy lifting)\b'

TRIGGER_RE='\b(likely|probably|seems like|seems to|appears to|must be|might be|could be|should be|my (hypothesis|guess|theory)|I (think|believe|suspect)|the (likely|probable) (cause|reason|culprit)|the cause is|the reason is)\b'
DISCLAIMER_RE='I AM (GUESSING|HEDGING)'

DIAG_RE='\b(the (cause|reason|culprit|problem|issue|bug) (is|was)|this is caused by|that is caused by|caused by the|because of the|due to the|comes from the)\b'
CITE_RE='([A-Za-z0-9_./-]+\.[A-Za-z]+:[0-9]+)|(\[[^]]+\]\([^)]+\))|(measured[^.]*=\s*[-0-9])|(I AM (GUESSING|HEDGING))'

EXIT=0

BANNED=$(echo "$TEXT" | grep -oiE "$BANNED_RE" | tr '[:upper:]' '[:lower:]' | sort -u | tr '\n' ' ' | sed 's/ *$//')
if [ -n "$BANNED" ]; then
  echo "BANNED WORDS: $BANNED" >&2
  EXIT=1
fi

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

exit $EXIT
