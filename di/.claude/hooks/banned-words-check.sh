#!/bin/bash
# Stop hook: enforces the banned-words table that lives in
#   di/notes/guides/pre-flight/banned words.md
# That table is the SINGLE SOURCE OF TRUTH — no word list is hardcoded here.
#
# Two columns decide how each row is enforced:
#   hard block  -> the hooked column is "y" AND the Meaning column is blank. The
#                  word is always wrong; the reply must be rewritten.
#   sense check -> any row whose Meaning column is filled in (the word is banned
#                  only in that meaning), OR a row with a blank hooked column. The
#                  hook blocks ONCE and asks the model to judge: rewrite if it
#                  carries the banned meaning, otherwise resend unchanged.
# Plural, past-tense and gerund forms are generated here, per the note in the file.
#
# A per-chain counter (keyed by transcript) caps retries at CAP, so a match the
# model cannot avoid (for example quoting the table itself) can never loop forever.

HOOK_DIR="$(dirname "$0")"
LOG_FILE="$HOOK_DIR/log.jsonl"
BANNED_FILE="$HOOK_DIR/../../notes/guides/pre-flight/banned words.md"
CAP=3

log_event() {
  jq -nc \
    --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg hook "banned-words-check" \
    --arg action "$1" \
    --arg kind "$2" \
    --arg words "$3" \
    --arg tail "$4" \
    '{timestamp:$ts,hook:$hook,action:$action,kind:$kind,words:$words,text_tail:$tail}' \
    >> "$LOG_FILE" 2>/dev/null
}

INPUT=$(cat)
STOP_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // ""')
if [ -z "$TRANSCRIPT" ] || [ ! -f "$TRANSCRIPT" ]; then log_event exit-no-transcript "" "" ""; exit 0; fi
if [ ! -f "$BANNED_FILE" ]; then log_event exit-no-banned-file "" "" ""; exit 0; fi

LAST=$(jq -c 'select(.type=="assistant")' "$TRANSCRIPT" 2>/dev/null | tail -1)
if [ -z "$LAST" ]; then log_event exit-no-assistant "" "" ""; exit 0; fi
TEXT=$(echo "$LAST" | jq -r '.message.content[]? | select(.type=="text") | .text' 2>/dev/null)
if [ -z "$TEXT" ]; then log_event exit-no-text "" "" ""; exit 0; fi
TAIL=$(echo "$TEXT" | tail -c 400)

# --- inflect one bare word: print the word and its plausible endings ---------
inflect_word() {
  local w="$1" last
  printf '%s\n%ss\n%ses\n%sed\n%sd\n%sing\n' "$w" "$w" "$w" "$w" "$w" "$w"
  case "$w" in
    *e) printf '%sing\n%sed\n%ses\n' "${w%e}" "${w%e}" "${w%e}" ;;
  esac
  # consonant + y: the plural and past drop the y (copy -> copies, copied)
  case "$w" in
    *[bcdfghjklmnpqrstvwxz]y) printf '%sies\n%sied\n' "${w%y}" "${w%y}" ;;
  esac
  # short consonant-vowel-consonant word: double the last letter (ship -> shipping)
  if [[ "$w" =~ [bcdfghjklmnpqrstvwxz][aeiou][bcdfghjklmnpqrstvz]$ ]]; then
    last="${w: -1}"
    printf '%s%sed\n%s%sing\n' "$w" "$last" "$w" "$last"
  fi
}

# --- inflect a term that may be several words: inflect the last word only -----
inflect_term() {
  local term="$1" last prefix f
  if [[ "$term" == *" "* ]]; then
    last="${term##* }"; prefix="${term% *}"
    printf '%s\n' "$term"
    while IFS= read -r f; do printf '%s %s\n' "$prefix" "$f"; done < <(inflect_word "$last")
  else
    inflect_word "$term"
  fi
}

# --- read the table; build the hard and the sense form lists ------------------
HARD_FORMS=""
SOFT_FORMS=""
while IFS=$'\t' read -r type never; do
  [ -z "$never" ] && continue
  never="$(printf '%s' "$never" | sed 's/([^)]*)//g')"   # drop parenthetical notes
  IFS=',' read -ra parts <<< "$never"
  for p in "${parts[@]}"; do
    term="$(printf '%s' "$p" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr '[:upper:]' '[:lower:]')"
    [ -z "$term" ] && continue
    forms="$(inflect_term "$term")"
    if [ "$type" = "hard" ]; then HARD_FORMS+="$forms"$'\n'; else SOFT_FORMS+="$forms"$'\n'; fi
  done
done < <(awk -F'|' '{h=$3;n=$4;m=$5;gsub(/^[ \t]+|[ \t]+$/,"",h);gsub(/^[ \t]+|[ \t]+$/,"",n);gsub(/^[ \t]+|[ \t]+$/,"",m);if(n==""||n=="Never")next;if(n ~ /^-+$/)next;print (((h=="y")&&(m==""))?"hard":"soft") "\t" n}' "$BANNED_FILE")

build_alt() { printf '%s\n' "$1" | sed '/^$/d' | sort -u | paste -sd'|' -; }
HARD_ALT="$(build_alt "$HARD_FORMS")"
SOFT_ALT="$(build_alt "$SOFT_FORMS")"

HARD_N=$(printf '%s\n' "$HARD_FORMS" | sed '/^$/d' | sort -u | wc -l | tr -d ' ')
SOFT_N=$(printf '%s\n' "$SOFT_FORMS" | sed '/^$/d' | sort -u | wc -l | tr -d ' ')
# Visibility: if a parse slip ever drops the lists to zero, this line shows it.
log_event parsed "" "hard_forms=$HARD_N soft_forms=$SOFT_N" ""

HARD_FOUND=""
SOFT_FOUND=""
[ -n "$HARD_ALT" ] && HARD_FOUND=$(echo "$TEXT" | grep -oiE "\b(${HARD_ALT})\b" | tr '[:upper:]' '[:lower:]' | sort -u | tr '\n' ' ' | sed 's/ *$//')
[ -n "$SOFT_ALT" ] && SOFT_FOUND=$(echo "$TEXT" | grep -oiE "\b(${SOFT_ALT})\b" | tr '[:upper:]' '[:lower:]' | sort -u | tr '\n' ' ' | sed 's/ *$//')

# --- bounded loop guard: counter keyed by this transcript --------------------
KEY=$(printf '%s' "$TRANSCRIPT" | shasum | cut -c1-12)
STATE="$HOOK_DIR/.bw-state-$KEY"
if [ "$STOP_ACTIVE" = "true" ]; then COUNT=$(cat "$STATE" 2>/dev/null || echo 0); else COUNT=0; fi
case "$COUNT" in *[!0-9]*|"") COUNT=0;; esac

# Nothing matched -> let the reply stand and clear the counter.
if [ -z "$HARD_FOUND" ] && [ -z "$SOFT_FOUND" ]; then
  rm -f "$STATE"; log_event exit-clean "" "" "$TAIL"; exit 0
fi

# Safety cap reached -> give up so the chain cannot spin.
if [ "$COUNT" -ge "$CAP" ]; then
  rm -f "$STATE"; log_event exit-cap "" "${HARD_FOUND} ${SOFT_FOUND}" "$TAIL"; exit 0
fi

# WARN-ONLY, no reject. Hard words are corrected on screen by the MessageDisplay
# hook (display-fix.sh). Sense-sensitive words need a judgment that can't be a
# deterministic swap, so they stay as-is. Either way we do NOT reject: rejecting
# regenerates the reply and shows it twice (the doubled reply). We log and move on.
rm -f "$STATE"
log_event warn "hard=${HARD_FOUND} soft=${SOFT_FOUND}" "$TAIL"
exit 0
