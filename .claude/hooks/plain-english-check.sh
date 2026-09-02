#!/bin/bash
# PostToolUse hook: reads every edit as it is written, and says when a banned word
# or a word the lexicon settles just went into a file.
#
# What is checked:
#   .md files            -> the whole edit
#   .ts / .svelte files  -> only comment lines and log lines (// and <!-- and console.log)
#
# Where the words come from — no word list is hardcoded here, except di's jargon:
#   1. The banned-words tables: the shared one, plus the working project's own.
#      Only rows the table itself marks mechanical are used — hooked "y" with a
#      blank Meaning. A row with a Meaning is banned only in that sense, and a
#      machine cannot judge a sense; those stay with the reply hook and the sweep.
#   2. The mono lexicon's "Never *word*" entries, minus the words the lexicon
#      itself gives a sense to keep (copy, mark, place, words, move, step), and
#      minus i, me and you — those name co only when co is the subject, which a
#      machine cannot tell. The same line as above, drawn by hand because the
#      lexicon has no hooked column.
#   3. di's twenty identifiers, kept from the first version of this hook.
#
# The two word files themselves are passed over — quoting banned words is their job.
# Warn-only: the edit is already written; this says so as next-turn context.
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_response.filePath // ""')
NEW=$(echo "$INPUT" | jq -r '.tool_input.new_string // .tool_input.content // ""')

HOOK_DIR="$(dirname "$0")"
REPO="$HOOK_DIR/../.."

# The files whose job is to hold the banned words.
BASE=$(basename "$FILE" | tr '[:upper:]' '[:lower:]')
case "$BASE" in
  "banned words.md"|"lexicon.md") exit 0 ;;
esac

# Only .md files, and comment/log lines of .ts and .svelte files.
if [[ "$FILE" == *.md ]]; then
  CHECK="$NEW"
elif [[ "$FILE" == *.ts || "$FILE" == *.svelte ]]; then
  CHECK=$(echo "$NEW" | grep -E '(console\.log|debug\.log|^[[:space:]]*//|^[[:space:]]*\*|<!--)' || true)
else
  exit 0
fi
[ -z "$CHECK" ] && exit 0

# --- the words ---------------------------------------------------------------

BANNED_SHARED="$REPO/notes/guides/pre-flight/banned words.md"
PROJECT=$(cat "$REPO/.working_project" 2>/dev/null | tr -d '[:space:]')
BANNED_PROJECT="$REPO/$PROJECT/notes/guides/pre-flight/banned words.md"
LEXICON="$REPO/notes/guides/pre-flight/lexicon.md"

BANNED_FILES=("$BANNED_SHARED")
[ -n "$PROJECT" ] && [ -f "$BANNED_PROJECT" ] && BANNED_FILES+=("$BANNED_PROJECT")

# The mechanical rows: hooked "y", Meaning blank. The Never cell may hold several
# words split by commas; each comes out as its own line.
TABLE_WORDS=$(awk -F'|' '{
    h=$3; n=$5; m=$6
    gsub(/^[ \t]+|[ \t]+$/, "", h); gsub(/^[ \t]+|[ \t]+$/, "", n); gsub(/^[ \t]+|[ \t]+$/, "", m)
    if (n == "" || n == "Never" || n ~ /^-+$/) next
    if (h != "y" || m != "") next
    count = split(n, words, ",")
    for (i = 1; i <= count; i++) {
        gsub(/^[ \t]+|[ \t]+$/, "", words[i])
        if (words[i] != "") print words[i]
    }
}' "${BANNED_FILES[@]}" 2>/dev/null)

# The lexicon's own never-words, minus the ones it gives a kept sense.
LEXICON_WORDS=$(grep -oiE 'never \*[^*]+\*' "$LEXICON" 2>/dev/null \
  | sed -E 's/^[Nn]ever \*//; s/\*$//' \
  | grep -viE '^(copy|mark|marked|place|words|move|step|i|me|you)$' | sort -u)

WORDS=$(printf '%s\n%s\n' "$TABLE_WORDS" "$LEXICON_WORDS" | sort -u | grep -v '^$')

# --- the search --------------------------------------------------------------

FOUND=""
while IFS= read -r word; do
  [ -z "$word" ] && continue
  # The word itself, or its plural, past-tense or gerund form, standing on its own.
  if echo "$CHECK" | grep -qiE "\b${word}(s|es|ed|ing)?\b"; then
    FOUND="${FOUND}${word}, "
  fi
done <<< "$WORDS"

# di's identifiers, kept as they were.
if echo "$CHECK" | grep -qiE '(fi_key|occ_face|ep_key|clip_identity|edge_points|prev_clip_end|used_fi_keys|OccFaceRef|ClipInterval|EndpointID|ComputedEdgeSeg|TopologyInput|TopologyOutput|OccludingFace|VisibleClip|matched_by_face|fi_on_edge|fi_matched_edges|poly_edge_idx|occ_face_key|edge_full)'; then
  JARGON=$(echo "$CHECK" | grep -oiE '(fi_key|occ_face|ep_key|clip_identity|edge_points|prev_clip_end|used_fi_keys|OccFaceRef|ClipInterval|EndpointID|ComputedEdgeSeg|TopologyInput|TopologyOutput|OccludingFace|VisibleClip|matched_by_face|fi_on_edge|fi_matched_edges|poly_edge_idx|occ_face_key|edge_full)' | head -3 | tr '\n' ', ')
  FOUND="${FOUND}${JARGON}"
fi

[ -z "$FOUND" ] && exit 0
FOUND=${FOUND%, }

echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"BANNED WORD WRITTEN INTO A FILE: ${FOUND} — the banned-words table and the lexicon govern files as well as replies. Redo the edit using the word the table's Use column or the lexicon names.\"}}"
