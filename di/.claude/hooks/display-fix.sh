#!/bin/bash
# MessageDisplay hook. Rewrites the SHOWN assistant text so that hard-banned
# words from banned words.md appear as their approved replacement. Display-only:
# the transcript keeps the original, so this never touches what the model sees.
#
# Why: the Stop banned-words hook can only reject (which regenerates the reply,
# so the user sees the original AND the redo — a doubled reply). This hook fixes
# hard words on screen before they are shown, so no reject is needed and there is
# no double. Only the deterministic hard rows are handled here; sense-sensitive
# rows still go through the Stop hook (they need a judgment this hook can't make).
#
# Input (stdin JSON): .delta holds the newly rendered lines. Output (stdout):
#   {"hookSpecificOutput":{"hookEventName":"MessageDisplay","displayContent":"..."}}
# Omitting displayContent shows the original delta.

HOOK_DIR="$(dirname "$0")"
BANNED_FILE="$HOOK_DIR/../../notes/guides/pre-flight/banned words.md"

INPUT=$(cat)
DELTA=$(printf '%s' "$INPUT" | jq -r '.delta // ""')
[ -z "$DELTA" ] && exit 0
[ ! -f "$BANNED_FILE" ] && exit 0

# --- inflect one bare word: print the word and its plausible endings ---------
inflect_word() {
  local w="$1" last
  printf '%s\n%ss\n%ses\n%sed\n%sd\n%sing\n' "$w" "$w" "$w" "$w" "$w" "$w"
  case "$w" in
    *e) printf '%sing\n%sed\n%ses\n' "${w%e}" "${w%e}" "${w%e}" ;;
  esac
  case "$w" in
    *[bcdfghjklmnpqrstvwxz]y) printf '%sies\n%sied\n' "${w%y}" "${w%y}" ;;
  esac
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

# Hard rows only (hooked col "y" AND blank meaning). Emit "use<TAB>never".
PAIRS=$(awk -F'|' '{
  u=$2; h=$3; n=$4; m=$5;
  gsub(/^[ \t]+|[ \t]+$/,"",u); gsub(/^[ \t]+|[ \t]+$/,"",h);
  gsub(/^[ \t]+|[ \t]+$/,"",n); gsub(/^[ \t]+|[ \t]+$/,"",m);
  if(n==""||n=="Never")next; if(n ~ /^-+$/)next;
  if(!((h=="y")&&(m=="")))next;
  split(u,ua,","); use=ua[1]; gsub(/^[ \t]+|[ \t]+$/,"",use);
  if(use=="")next;
  print use "\t" n
}' "$BANNED_FILE")

# Build the "neverform<TAB>useword" map, expanding each never word to its forms.
MAP=""
while IFS=$'\t' read -r use never; do
  [ -z "$never" ] && continue
  never="$(printf '%s' "$never" | sed 's/([^)]*)//g')"   # drop parentheticals
  IFS=',' read -ra parts <<< "$never"
  for p in "${parts[@]}"; do
    term="$(printf '%s' "$p" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr '[:upper:]' '[:lower:]')"
    [ -z "$term" ] && continue
    while IFS= read -r f; do
      [ -z "$f" ] && continue
      MAP+="$f	$use"$'\n'
    done < <(inflect_term "$term")
  done
done <<< "$PAIRS"

# Substitute: whole-word, case-insensitive, first-letter case preserved.
NEW=$(DELTA="$DELTA" MAP="$MAP" perl -e '
  my $delta = $ENV{DELTA};
  my %map;
  for my $line (split /\n/, $ENV{MAP}) {
    my ($from,$to) = split /\t/, $line, 2;
    next unless defined $from && length $from && defined $to && length $to;
    $map{lc $from} = $to unless exists $map{lc $from};
  }
  for my $k (sort { length($b) <=> length($a) } keys %map) {
    my $to = $map{$k};
    my $re = quotemeta($k);
    $delta =~ s/\b($re)\b/ my $m=$1; ($m =~ \/^[A-Z]\/) ? ucfirst($to) : $to /gie;
  }
  print $delta;
')

if [ -n "$NEW" ] && [ "$NEW" != "$DELTA" ]; then
  jq -nc --arg d "$NEW" '{hookSpecificOutput:{hookEventName:"MessageDisplay",displayContent:$d}}'
fi
exit 0