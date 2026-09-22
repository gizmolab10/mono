#!/bin/bash
# UserPromptSubmit hook. Two parts, because what arrives is cut off at about 2000
# characters and everything past that is lost without a word.
#
#   A — the Always section of conventions.md, every single turn. It holds the four
#       rules that must never be out of sight, and it is short enough to survive the
#       cut whole.
#   B — everything else, cut into seven pieces since 22 September 2026: the rest of
#       conventions.md (how a reply is written, the conduct rules, the banned words), how
#       the work is done, the shared lexicon, and the project's own banned words when it
#       has one. One piece per turn, in rotation. A piece is one or more ranges of one
#       file, from a heading up to another heading, sized so that with Always it stays
#       under the size the Claude harness saves to a file: agency with Always, 6.5KB, was
#       shown whole and the lexicon with Always, 14.4KB, was saved, measured 22 September
#       2026 in saves.jsonl. The largest piece with Always is 7.4KB.
#
# Which piece B sends is decided by a count kept in a file, since a hook remembers
# nothing between turns.
#
# Run .claude/hooks/test-always-tag.sh to prove the labels and the sending agree.
REPO="/Users/sand/GitHub/mono"
TRUTH="$REPO/memory/shared/truth"
CONVENTIONS="$TRUTH/conventions.md"
AGENCY="$TRUTH/agency.md"
LEXICON="$TRUTH/lexicon.md"
PROJECT=$(cat "$REPO/.working_project" 2>/dev/null | tr -d '[:space:]')
BANNED_PROJECT="$REPO/memory/$PROJECT/truth/banned words.md"
COUNT_FILE="${INJECT_COUNT_FILE:-$REPO/.claude/hooks/.turn-count}"   # a test sets its own, so the real count stands

# The Always section runs from its "## Always" heading to the next heading of the same
# depth. A range of a file runs from the line that starts with FROM up to the line that
# starts with TO; an empty FROM starts at the top, an empty TO runs to the end.
always_part() { awk '/^## Always/{on=1} on && /^## / && !/^## Always/{exit} on' "$CONVENTIONS"; }
cut_range()   { awk -v from="$2" -v to="$3" 'from == "" {on=1} from != "" && index($0, from) == 1 {on=1} on && to != "" && index($0, to) == 1 {exit} on' "$1"; }

# What goes round in part B, in order. A project with no list of its own simply
# contributes nothing and the rotation is one shorter that day.
#
# The shared lexicon holds the slot the shared banned-word table used to. Both say
# the same thing about the same words — one as a wall, one as a word to reach for —
# and only the second is any use while a sentence is being written. The table, now
# inside conventions.md, is still read by the two scripts that detect faults in a finished reply.
IN_TURN=("$CONVENTIONS" "$AGENCY")
[ -f "$LEXICON" ] && IN_TURN+=("$LEXICON")
[ -n "$PROJECT" ] && [ -f "$BANNED_PROJECT" ] && IN_TURN+=("$BANNED_PROJECT")

# The pieces, in order. Each is a name with no spaces, which saved-output-count.sh reads
# off the ONE PART IN TURN line, then "@" and its ranges, each "file|from|to", "@" between.
# Sizes in bytes, measured 22 September 2026: 4172, 5676, 6095, 6151, 5315, 4869, 6307.
PIECES=(
  "conventions.md:Response-1-7@$CONVENTIONS|## Response|### 8. "
  "conventions.md:Response-8-14+lexicon.md:Who+A-turn@$CONVENTIONS|### 8. |## Conduct@$LEXICON|## Who|## What we keep@$LEXICON|## A turn|## Saying what is true"
  "conventions.md:Conduct+need-translation+lexicon.md:Saying-what-is-true@$CONVENTIONS|## Conduct|## Banned words@$LEXICON|## Saying what is true|## Verbs to use carefully"
  "conventions.md:Banned-words@$CONVENTIONS|## Banned words|"
  "agency.md@$AGENCY||"
  "lexicon.md:opening+What-we-keep@$LEXICON||## The memory system@$LEXICON|## What we keep|## A turn"
  "lexicon.md:The-memory-system+Verbs-to-use-carefully@$LEXICON|## The memory system|## Who@$LEXICON|## Verbs to use carefully|"
)
[ -n "$PROJECT" ] && [ -f "$BANNED_PROJECT" ] && PIECES+=("$PROJECT:banned-words@$BANNED_PROJECT||")

# One piece, printed: each of its ranges in order, a blank line after each.
send_piece() {
  local ranges="${1#*@}" range file from to
  while [ -n "$ranges" ]; do
    range="${ranges%%@*}"
    [ "$range" = "$ranges" ] && ranges="" || ranges="${ranges#*@}"
    IFS='|' read -r file from to <<< "$range"
    cut_range "$file" "$from" "$to"
    echo ""
  done
}

# Which files wear the "always" tag, read from the db beside the dispatcher through the
# dispatcher's own module — since 10 September 2026 a file's kind and tags live there, not
# in the file. One line per file wearing the tag: its path from the top of the repo, a tab,
# then "explain" for a file of that kind and nothing otherwise. A db that is not there
# leaves the tag unreadable, which is said rather than mistaken for every label lying.
WEARING=$(python3 - <<'PY' 2>/dev/null
import os, sys
sys.path.insert(0, '/Users/sand/GitHub/mono/tools/hub')
import database
if not os.path.isfile(database.PLACE):
    sys.exit(3)
for path, rows in sorted(database.all_labels().items()):
    tags = [one['value'] for one in rows if one['name'] == 'tag']
    kinds = [one['value'] for one in rows if one['name'] == 'kind']
    if 'always' in tags:
        print(f"{path}\t{'explain' if 'explain' in kinds else ''}")
PY
)
DB_READ=$?

if [ $DB_READ -ne 0 ]; then
  echo "--- THE DB IS NOT THERE: which files wear the \"always\" tag could not be read ---"
  echo ""
else
  # Every file named here arrives with every message or in its turn, so every one of
  # them wears the "always" tag. A file that does not is a file whose labels lie, and
  # nothing else would ever notice — so it is said first, before the rules themselves.
  # First matters: what follows is cut off, and a complaint at the end is never read.
  MISSING=()
  for FILE in "${IN_TURN[@]}"; do
    [ -f "$FILE" ] || continue
    printf '%s\n' "$WEARING" | cut -f1 | grep -qxF "${FILE#$REPO/}" || MISSING+=("${FILE#$REPO/}")
  done

  if [ ${#MISSING[@]} -gt 0 ]; then
    echo "--- LABELS ARE WRONG ---"
    echo "These arrive with every message, or in their turn, but do not wear the \"always\" tag. Tell Jonathan, and offer to add it:"
    for ONE in "${MISSING[@]}"; do echo "  $ONE"; done
    echo ""
  fi

  # The other half of the same promise: a file under a truth folder wearing the tag but
  # never arriving is a file whose labels lie the other way round. Two sorts are let off:
  #   - every project's own list of banned words, since only one arrives on any given day;
  #   - a guide of the "explain" kind, which is about this machinery and is never sent.
  SENT=$(printf '%s\n' "${IN_TURN[@]}" "$REPO"/memory/*/truth/"banned words.md")
  STRAY=()
  while IFS=$'\t' read -r IN_REPO KIND; do
    [ -z "$IN_REPO" ] && continue
    case "$IN_REPO" in memory/*/truth/*) ;; *) continue ;; esac
    [ "$KIND" = "explain" ] && continue
    printf '%s\n' "$SENT" | grep -qxF "$REPO/$IN_REPO" || STRAY+=("$IN_REPO")
  done <<< "$WEARING"

  if [ ${#STRAY[@]} -gt 0 ]; then
    echo "--- LABELS ARE WRONG ---"
    echo "These wear the \"always\" tag but never arrive. Tell Jonathan, and offer to take it off:"
    for ONE in "${STRAY[@]}"; do echo "  $ONE"; done
    echo ""
  fi
fi

# Part A, whole, every turn.
[ -f "$CONVENTIONS" ] && always_part && echo ""

# Part B: one piece, whichever the count lands on. The count only ever grows, so the
# remainder walks the list evenly. Conventions' Always section is in no piece, since part
# A has just sent it.
if [ ${#PIECES[@]} -gt 0 ]; then
  TURN=$(cat "$COUNT_FILE" 2>/dev/null | tr -cd '0-9')
  [ -z "$TURN" ] && TURN=0
  echo $(( TURN + 1 )) > "$COUNT_FILE"
  PICKED="${PIECES[$(( TURN % ${#PIECES[@]} ))]}"
  echo "--- ONE PART IN TURN: ${PICKED%%@*} (turn $TURN of ${#PIECES[@]}; the others arrive on the turns after this) ---"
  send_piece "$PICKED"
fi
exit 0
