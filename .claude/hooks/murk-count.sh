#!/bin/bash
# Stop hook: counts the times Jonathan says a reply did not read.
#
# Every reply writes one "reply" row. When his last message begins with one of the
# words that mean say it again — t, translate, rewrite, plain, simplify, murky —
# it also writes a "complaint" row holding both sides: the reply he could not read
# and the one that replaced it. The pairs are the material a lexicon gets built
# from; the two counts divide into a rate.
#
# Never blocks and never prints. It only writes.
#
# Run .claude/hooks/murk-count.test.sh to prove the trigger and the pairing.
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MURK_FILE="$HOOK_DIR/murk.jsonl"
STATE_DIR="${TMPDIR:-/tmp}"

INPUT=$(cat)
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // ""')
if [ -z "$TRANSCRIPT" ] || [ ! -f "$TRANSCRIPT" ]; then exit 0; fi

# The words of one message, counted from the end: 1 is the last, 2 the one before.
# A reply is every piece of text it holds, run together.
message_at() {
	jq -rc "select(.type==\"$1\")" "$TRANSCRIPT" 2>/dev/null | tail -n "$2" | head -1 \
		| jq -r '[.message.content[]? | select(.type=="text") | .text] | join("\n")' 2>/dev/null
}

# One row of the record. Both tails are the last 400 characters, which is what the
# banned-word checker keeps and is long enough to hold the sentence that failed.
write_row() {
	jq -nc \
		--arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
		--arg action "$1" \
		--arg word "$2" \
		--arg murky "$3" \
		--arg plain "$4" \
		'{timestamp:$ts,action:$action,word:$word,murky:$murky,plain:$plain}' \
		>> "$MURK_FILE" 2>/dev/null
}

# The words that mean say it again. Five are already in shorthand.md; simplify is
# the sixth. Frozen — adding one later makes the rate jump with nothing having
# changed, so a change starts a new file.
SAYING_AGAIN="t translate rewrite plain simplify murky"

# His last message, first word only, lowercased and stripped of anything that is not
# a letter. Only the first word counts: a message that merely mentions murk is about
# it, not a complaint of it.
HIS=$(message_at user 1)
FIRST=$(printf '%s' "$HIS" | head -1 | awk '{print tolower($1)}' | tr -cd 'a-z')

# Stop can fire more than once for the same reply. The state file remembers the last
# reply counted, so nothing is counted twice.
KEY=$(printf '%s' "$TRANSCRIPT" | shasum | cut -c1-12)
STATE="$STATE_DIR/murk-count-$KEY"
NOW=$(message_at assistant 1)
STAMP=$(printf '%s' "$NOW" | shasum | cut -c1-12)
[ "$(cat "$STATE" 2>/dev/null)" = "$STAMP" ] && exit 0
printf '%s' "$STAMP" > "$STATE"

write_row reply "" "" ""

case " $SAYING_AGAIN " in
	*" $FIRST "*)
		# The reply before his word is the one he could not read; the reply just
		# written is what replaced it. Both are kept, so the pair can be read later.
		MURKY=$(message_at assistant 2 | tail -c 400)
		write_row complaint "$FIRST" "$MURKY" "$(printf '%s' "$NOW" | tail -c 400)"
		;;
esac

exit 0