#!/bin/bash
# Stop hook: counts the times Jonathan says a reply did not read.
#
# Every reply writes one "reply" row. When any LINE of his last message begins with
# one of the words that mean say it again — t, translate, rewrite, plain, simplify,
# murky — it also writes a "complaint" row holding both sides: the reply he could not
# read and the one that replaced it. The pairs are the material a lexicon gets built
# from; the two counts divide into a rate.
#
# Every row says which rule counted it. Until 1 September 2026 only the first word of
# the first line could fire, so a t that followed a number — "1. fix / 2. t 'x'" —
# was never counted, about one firing in seven. Widening it makes the rate rise with
# nothing having changed, so a rate is only ever read within one rule.
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
# A message is every piece of text it holds, run together.
message_at() {
	jq -rc "select(.type==\"$1\")" "$TRANSCRIPT" 2>/dev/null | tail -n "$2" | head -1 \
		| jq -r '[.message.content[]? | select(.type=="text") | .text] | join("\n")' 2>/dev/null
}

# One of my replies, counted from the end: 1 is the last, 2 the one before.
#
# Every tool call is an entry of its own, and so is every stretch of thinking. One reply that
# looked a file up first is five or six entries, only one of which holds words. Counting entries
# would call a tool call the reply before this one and read out nothing — which is what it did,
# so every complaint about a reply that needed a file read lost the half that mattered.
#
# So the ones holding no words are passed over, and only the ones with words are counted.
reply_at() {
	jq -rc 'select(.type=="assistant") | select([.message.content[]? | select(.type=="text")] | length > 0)' "$TRANSCRIPT" 2>/dev/null \
		| tail -n "$1" | head -1 \
		| jq -r '[.message.content[]? | select(.type=="text") | .text] | join("\n")' 2>/dev/null
}

# How many words a reply held. The record keeps only the last 400 characters of a
# reply, so length cannot be read back off the text — it has to be counted here, while
# the whole reply is in hand.
count_words() {
	printf '%s' "$1" | wc -w | tr -d ' '
}

# One row of the record. Both tails are the last 400 characters, which is what the
# banned-word checker keeps and is long enough to hold the sentence that failed.
#
# `words` is the length of the reply the row is about: on a reply row the one just
# sent, on a complaint row the one he could not read. `plain_words` is the length of
# the reply that replaced it, and is empty on a reply row. Rows written before
# 1 September 2026 carry neither.
write_row() {
	jq -nc \
		--arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
		--arg action "$1" \
		--arg word "$2" \
		--arg murky "$3" \
		--arg plain "$4" \
		--arg rule "$RULE" \
		--arg words "$5" \
		--arg plain_words "$6" \
		'{timestamp:$ts,action:$action,word:$word,murky:$murky,plain:$plain,rule:$rule,words:$words,plain_words:$plain_words}' \
		>> "$MURK_FILE" 2>/dev/null
}

# The words that mean say it again. Five are already in shorthand.md; simplify is
# the sixth. Frozen — adding one later makes the rate jump with nothing having
# changed, so a change starts a new file.
SAYING_AGAIN="t translate rewrite plain simplify murky"

# Which rule counted a row. Rows written before 1 September 2026 carry none, and were
# all counted under first-word.
RULE="any-line"

# His last message, read a line at a time. A leading list marker — "2.", "3)", "-", "*"
# — is taken off first, so a word that follows a number leads its line just as much as
# one at the top of the message. The first word of each line is lowercased and stripped
# to letters, and the first line whose word is on the list decides.
#
# Leading the line is the whole test: a message that merely mentions murk mid-sentence
# is about it, not a complaint of it.
HIS=$(message_at user 1)
FIRST=$(printf '%s\n' "$HIS" \
	| sed -E 's/^[[:space:]]*([0-9]+[.)]|[-*])[[:space:]]+//' \
	| awk -v list=" $SAYING_AGAIN " '{
		w = tolower($1); gsub(/[^a-z]/, "", w);
		if (w != "" && index(list, " " w " ")) { print w; exit }
	}')

# Stop can fire more than once for the same reply. The state file remembers the last
# reply counted, so nothing is counted twice.
KEY=$(printf '%s' "$TRANSCRIPT" | shasum | cut -c1-12)
STATE="$STATE_DIR/murk-count-$KEY"
NOW=$(reply_at 1)
STAMP=$(printf '%s' "$NOW" | shasum | cut -c1-12)
[ "$(cat "$STATE" 2>/dev/null)" = "$STAMP" ] && exit 0
printf '%s' "$STAMP" > "$STATE"

write_row reply "" "" "" "$(count_words "$NOW")" ""

case " $SAYING_AGAIN " in
	*" $FIRST "*)
		# The reply before his word is the one he could not read; the reply just
		# written is what replaced it. Both are kept, so the pair can be read later.
		WHOLE=$(reply_at 2)
		MURKY=$(printf '%s' "$WHOLE" | tail -c 400)
		write_row complaint "$FIRST" "$MURKY" "$(printf '%s' "$NOW" | tail -c 400)" \
			"$(count_words "$WHOLE")" "$(count_words "$NOW")"
		;;
esac

exit 0