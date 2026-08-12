#!/bin/bash
# UserPromptSubmit hook. Two parts, because what arrives is cut off at about 2000
# characters and everything past that is lost without a word.
#
#   A — the always file, every single turn. It holds the five rules that must never
#       be out of sight, and it is short enough to survive the cut whole.
#   B — everything else: the rest of the reply rules, how the work is done, and the
#       two lists of banned words. One of them per turn, in rotation, so each gets
#       the leftover room to itself rather than being crowded out.
#
# Which one B sends is decided by a count kept in a file, since a hook remembers
# nothing between turns.
#
# Run .claude/hooks/test-always-tag.sh to prove the labels and the sending agree.
REPO="/Users/sand/GitHub/mono"
PRE_FLIGHT="$REPO/notes/guides/pre-flight"
ALWAYS_FILE="$PRE_FLIGHT/always.md"
LEXICON="$PRE_FLIGHT/lexicon.md"
PROJECT=$(cat "$REPO/.working_project" 2>/dev/null | tr -d '[:space:]')
BANNED_PROJECT="$REPO/$PROJECT/notes/guides/pre-flight/banned words.md"
COUNT_FILE="$REPO/.claude/hooks/.turn-count"

# What goes round in part B, in order. A project with no list of its own simply
# contributes nothing and the rotation is one shorter that day.
#
# The shared lexicon holds the slot the shared banned-word table used to. Both say
# the same thing about the same words — one as a wall, one as a word to reach for —
# and only the second is any use while a sentence is being written. The table is
# still read by the two scripts that check a finished reply.
IN_TURN=("$PRE_FLIGHT/response.md" "$PRE_FLIGHT/agency.md")
[ -f "$LEXICON" ] && IN_TURN+=("$LEXICON")
[ -n "$PROJECT" ] && [ -f "$BANNED_PROJECT" ] && IN_TURN+=("$BANNED_PROJECT")

# Every file named here arrives with every message or in its turn, so every one of
# them wears the "always" tag. A file that does not is a file whose labels lie, and
# nothing else would ever notice — so it is said first, before the rules themselves.
# First matters: what follows is cut off, and a complaint at the end is never read.
MISSING=()
for FILE in "$ALWAYS_FILE" "${IN_TURN[@]}"; do
  [ -f "$FILE" ] || continue
  grep -q '^tags:.*\balways\b' "$FILE" || MISSING+=("${FILE#$REPO/}")
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "--- LABELS ARE WRONG ---"
  echo "These arrive with every message, or in their turn, but do not wear the \"always\" tag. Tell Jonathan, and offer to add it:"
  for ONE in "${MISSING[@]}"; do echo "  $ONE"; done
  echo ""
fi

# The other half of the same promise: a guide wearing the tag but never arriving is a
# guide whose labels lie the other way round. Two sorts are let off:
#   - every project's own list of banned words, since only one arrives on any given day;
#   - a guide of the "explain" kind, which is about this machinery and is never sent.
SENT=$(printf '%s\n' "$ALWAYS_FILE" "${IN_TURN[@]}" "$REPO"/*/notes/guides/pre-flight/"banned words.md")
STRAY=()
while IFS= read -r FILE; do
  grep -q '^kind: *explain *$' "$FILE" && continue
  printf '%s\n' "$SENT" | grep -qxF "$FILE" || STRAY+=("${FILE#$REPO/}")
done < <(grep -rl '^tags:.*\balways\b' "$REPO"/notes/guides "$REPO"/*/notes/guides 2>/dev/null)

if [ ${#STRAY[@]} -gt 0 ]; then
  echo "--- LABELS ARE WRONG ---"
  echo "These wear the \"always\" tag but never arrive. Tell Jonathan, and offer to take it off:"
  for ONE in "${STRAY[@]}"; do echo "  $ONE"; done
  echo ""
fi

# Part A, whole, every turn.
[ -f "$ALWAYS_FILE" ] && cat "$ALWAYS_FILE" && echo ""

# Part B: one file, whichever the count lands on. The count only ever grows, so the
# remainder walks the list evenly.
if [ ${#IN_TURN[@]} -gt 0 ]; then
  TURN=$(cat "$COUNT_FILE" 2>/dev/null | tr -cd '0-9')
  [ -z "$TURN" ] && TURN=0
  echo $(( TURN + 1 )) > "$COUNT_FILE"
  PICKED="${IN_TURN[$(( TURN % ${#IN_TURN[@]} ))]}"
  echo "--- ONE PART IN TURN: ${PICKED#$REPO/} (turn $TURN of ${#IN_TURN[@]}; the others arrive on the turns after this) ---"
  cat "$PICKED"
fi
exit 0