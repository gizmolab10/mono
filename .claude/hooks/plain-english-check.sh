#!/bin/bash
# PostToolUse hook: reads every edit as it is written, and says when a banned word,
# a word the lexicon settles, or a name that names nothing just went into a file.
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
# And one check that reads no list at all — names in code style, .md files only:
#   4. Every span in backticks names a thing in the code, a term in a lexicon, or a
#      path on disk. One that names none of those is a coinage, and every name must
#      already exist in the code or a lexicon. Each span is looked up, case-sensitive,
#      since Frame and frame were two different things; the misses are reported.
#
# The two word files themselves are passed over — quoting banned words is their job.
# Warn-only: the edit is already written; this says so as next-turn context.
#
# The flag: PLAIN_ENGLISH_CHECK. false, the hook does nothing at all, an experiment begun
# 19 September 2026; true, every check runs. The test sets it true.
ENABLED="${PLAIN_ENGLISH_CHECK:-false}"
[ "$ENABLED" != "true" ] && exit 0

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

BANNED_SHARED="$REPO/memory/shared/truth/conventions.md"
PROJECT=$(cat "$REPO/.working_project" 2>/dev/null | tr -d '[:space:]')
BANNED_PROJECT="$REPO/memory/$PROJECT/truth/banned words.md"
LEXICON="$REPO/memory/shared/truth/lexicon.md"

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
  | grep -viE '^(copy|mark|marked|place|room|words|move|step|i|me|you)$' | sort -u)

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

# --- names in code style -----------------------------------------------------
#
# Where a name may be found: the code (every project's src and the tools — not the hooks,
# whose scripts and tests quote names on purpose), a lexicon (as a bold term — in this very
# edit first, since a term may be defined in the write that first uses it), or the disk (as
# a file or folder).
# Spans that are not one name — a phrase with spaces, a command, a quoted or bracketed
# thing — are left alone. Word-boundary, case-sensitive.

NAMELESS=""
if [[ "$FILE" == *.md ]]; then
  SPANS=$(echo "$NEW" | grep -oE '`[^`]+`' | sed 's/^`//; s/`$//' | sort -u)
  while IFS= read -r span; do
    [ -z "$span" ] && continue
    case "$span" in *" "*|*"*"*|*"("*|*"'"*|*'"'*|*"<"*|*"["*|*"{"*|*"="*|*"#"*) continue ;; esac
    clean=${span%/}
    token=$(basename "$clean")
    token=${token#--}
    token=${token#\$}
    token=${token%%.*}
    [[ "$token" =~ ^[A-Za-z_][A-Za-z0-9_-]*$ ]] || continue
    # 1. The code.
    if grep -rqwF --include='*.ts' --include='*.svelte' --include='*.py' --include='*.sh' \
         --include='*.json' --include='*.css' --include='*.html' --include='*.js' \
         -- "$token" "$REPO"/*/src "$REPO/tools" 2>/dev/null; then continue; fi
    # 2. A lexicon, this edit first.
    if echo "$NEW" | grep -qF -- "**$token**"; then continue; fi
    if grep -qF -- "**$token**" "$REPO"/memory/*/truth/lexicon.md 2>/dev/null; then continue; fi
    # 3. The disk: a path as written, or a file or folder of that name anywhere.
    if [ -e "$REPO/$clean" ]; then continue; fi
    if [[ "$clean" == */* ]]; then
      hit=$(find "$REPO" -path '*/node_modules' -prune -o -path '*/.git' -prune -o -path "*/$clean" -print -quit 2>/dev/null)
    else
      hit=$(find "$REPO" -path '*/node_modules' -prune -o -path '*/.git' -prune -o -name "$clean" -print -quit 2>/dev/null)
    fi
    [ -n "$hit" ] && continue
    NAMELESS="${NAMELESS}\`${span}\`, "
  done <<< "$SPANS"
fi

# --- the report --------------------------------------------------------------

[ -z "$FOUND" ] && [ -z "$NAMELESS" ] && exit 0
MESSAGE=""
if [ -n "$FOUND" ]; then
  FOUND=${FOUND%, }
  MESSAGE="BANNED WORD WRITTEN INTO A FILE: ${FOUND} — the banned-words table and the lexicon govern files as well as replies. Redo the edit using the word the table's Use column or the lexicon names."
fi
if [ -n "$NAMELESS" ]; then
  NAMELESS=${NAMELESS%, }
  [ -n "$MESSAGE" ] && MESSAGE="${MESSAGE} "
  MESSAGE="${MESSAGE}NAME THAT NAMES NOTHING: ${NAMELESS} — in no code, no lexicon, and not on disk. Every name must already exist in the code or in a lexicon. Define it there in this write, or say the thing in everyday words."
fi
jq -cn --arg m "$MESSAGE" '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$m}}'
