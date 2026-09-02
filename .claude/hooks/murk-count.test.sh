#!/bin/bash
# Proves murk-count.sh: what counts as a complaint, what does not, that the pair of
# replies is kept, and that the same reply is never counted twice.
#
# Nothing here touches the real record. A made-up conversation is written to a temp
# file and handed to the hook the way the tool hands it over.
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$HOOK_DIR/murk-count.sh"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

PASS=0
FAIL=0

# A conversation of three turns: a reply, then his word, then the reply that answered
# it. Every run gets its own record, so counts start from nothing.
conversation() {
	local his="$1" out="$2"
	: > "$out"
	printf '%s\n' "$(jq -nc --arg t "the fill stopped 13px short of the left edge" \
		'{type:"assistant",message:{content:[{type:"text",text:$t}]}}')" >> "$out"
	printf '%s\n' "$(jq -nc --arg t "$his" \
		'{type:"user",message:{content:[{type:"text",text:$t}]}}')" >> "$out"
	printf '%s\n' "$(jq -nc --arg t "the title left a gap on its left where rows showed through" \
		'{type:"assistant",message:{content:[{type:"text",text:$t}]}}')" >> "$out"
}

# Run the hook once against a made-up conversation and hand back the record it wrote.
run_once() {
	local his="$1" record="$WORK/murk.jsonl" script="$WORK/murk-count.sh"
	rm -f "$record" "${TMPDIR:-/tmp}"/murk-count-*
	sed "s#^HOOK_DIR=.*#HOOK_DIR=\"$WORK\"#" "$HOOK" > "$script"
	chmod +x "$script"
	conversation "$his" "$WORK/chat.jsonl"
	jq -nc --arg p "$WORK/chat.jsonl" '{transcript_path:$p}' | "$script" > /dev/null
	cat "$record" 2>/dev/null
}

check() {
	if [ "$2" = "$3" ]; then
		PASS=$((PASS + 1))
	else
		FAIL=$((FAIL + 1))
		echo "FAIL: $1"
		echo "  wanted: $3"
		echo "  got:    $2"
	fi
}

# 1. Every reply is counted, whatever he said.
OUT=$(run_once "make the numbers line up")
check "a reply is always counted" \
	"$(printf '%s' "$OUT" | jq -rc 'select(.action=="reply") | .action' | wc -l | tr -d ' ')" "1"

# 2. An ordinary message is no complaint.
check "an ordinary message writes no complaint" \
	"$(printf '%s' "$OUT" | jq -rc 'select(.action=="complaint")' | wc -l | tr -d ' ')" "0"

# 3. Each of the six words counts, wherever the message goes after it.
for WORD in t translate rewrite plain simplify murky; do
	OUT=$(run_once "$WORD the last bit please")
	check "\"$WORD\" first counts as a complaint" \
		"$(printf '%s' "$OUT" | jq -rc 'select(.action=="complaint") | .word')" "$WORD"
done

# 4. The word must lead. A message that merely names murk is about it, not a complaint.
OUT=$(run_once "add this answer to a work file murk.md")
check "the word buried mid-sentence is no complaint" \
	"$(printf '%s' "$OUT" | jq -rc 'select(.action=="complaint")' | wc -l | tr -d ' ')" "0"

# 5. Both sides are kept: the reply he could not read, and the one that replaced it.
OUT=$(run_once "t")
check "the reply he could not read is kept" \
	"$(printf '%s' "$OUT" | jq -rc 'select(.action=="complaint") | .murky')" \
	"the fill stopped 13px short of the left edge"
check "the reply that replaced it is kept" \
	"$(printf '%s' "$OUT" | jq -rc 'select(.action=="complaint") | .plain')" \
	"the title left a gap on its left where rows showed through"

# 6. Punctuation and capitals do not hide the word.
OUT=$(run_once "T. now the other one")
check "capitals and a full stop still count" \
	"$(printf '%s' "$OUT" | jq -rc 'select(.action=="complaint") | .word')" "t"

# 6b. A word that follows a number leads its line, so it counts. This is the firing the
# first-word rule lost — about one in seven.
OUT=$(run_once "$(printf '1. fix the fill\n2. t "the last bit"')")
check "a t after a number counts" \
	"$(printf '%s' "$OUT" | jq -rc 'select(.action=="complaint") | .word')" "t"

OUT=$(run_once "$(printf 'do the rename\n- translate the second line')")
check "a t after a dash counts" \
	"$(printf '%s' "$OUT" | jq -rc 'select(.action=="complaint") | .word')" "translate"

# 6c. Mid-line is still no complaint, on any line.
OUT=$(run_once "$(printf 'fix the fill\nand then translate nothing at all')")
check "the word mid-line on a later line is no complaint" \
	"$(printf '%s' "$OUT" | jq -rc 'select(.action=="complaint")' | wc -l | tr -d ' ')" "0"

# 6d. Every row says which rule counted it.
OUT=$(run_once "t")
check "a row says its rule" \
	"$(printf '%s' "$OUT" | jq -rc 'select(.action=="complaint") | .rule')" "any-line"

# 6e. Every row carries the length of the reply it is about. The two replies in the
# made-up conversation run nine words and twelve.
OUT=$(run_once "make the numbers line up")
check "a reply row counts the reply just sent" \
	"$(printf '%s' "$OUT" | jq -rc 'select(.action=="reply") | .words')" "12"

OUT=$(run_once "t")
check "a complaint counts the reply he could not read" \
	"$(printf '%s' "$OUT" | jq -rc 'select(.action=="complaint") | .words')" "9"
check "a complaint counts the reply that replaced it" \
	"$(printf '%s' "$OUT" | jq -rc 'select(.action=="complaint") | .plain_words')" "12"

# 7. Stop can fire twice for one reply. The second firing must add nothing.
rm -f "$WORK/murk.jsonl" "${TMPDIR:-/tmp}"/murk-count-*
sed "s#^HOOK_DIR=.*#HOOK_DIR=\"$WORK\"#" "$HOOK" > "$WORK/murk-count.sh"
chmod +x "$WORK/murk-count.sh"
conversation "t" "$WORK/chat.jsonl"
for _ in 1 2; do
	jq -nc --arg p "$WORK/chat.jsonl" '{transcript_path:$p}' | "$WORK/murk-count.sh" > /dev/null
done
check "firing twice for one reply counts once" \
	"$(wc -l < "$WORK/murk.jsonl" | tr -d ' ')" "2"

# 8. A reply that looked a file up first is several entries, and all but one of them hold no
# words. The reply he could not read has to be found past those, never counted as one of them.
rm -f "$WORK/murk.jsonl" "${TMPDIR:-/tmp}"/murk-count-*
sed "s#^HOOK_DIR=.*#HOOK_DIR=\"$WORK\"#" "$HOOK" > "$WORK/murk-count.sh"
chmod +x "$WORK/murk-count.sh"
CHAT="$WORK/tools.jsonl"
: > "$CHAT"
jq -nc --arg t "the fill stopped 13px short of the left edge" \
	'{type:"assistant",message:{content:[{type:"text",text:$t}]}}' >> "$CHAT"
jq -nc --arg t "t" '{type:"user",message:{content:[{type:"text",text:$t}]}}' >> "$CHAT"
jq -nc '{type:"assistant",message:{content:[{type:"thinking",thinking:"which file holds it"}]}}' >> "$CHAT"
jq -nc '{type:"assistant",message:{content:[{type:"tool_use",name:"Bash",input:{command:"grep fill"}}]}}' >> "$CHAT"
jq -nc '{type:"assistant",message:{content:[{type:"tool_use",name:"Read",input:{file_path:"Title.svelte"}}]}}' >> "$CHAT"
jq -nc --arg t "the title left a gap on its left where rows showed through" \
	'{type:"assistant",message:{content:[{type:"text",text:$t}]}}' >> "$CHAT"
jq -nc --arg p "$CHAT" '{transcript_path:$p}' | "$WORK/murk-count.sh" > /dev/null
OUT=$(cat "$WORK/murk.jsonl")
check "tool calls between the two replies are passed over" \
	"$(printf '%s' "$OUT" | jq -rc 'select(.action=="complaint") | .murky')" \
	"the fill stopped 13px short of the left edge"
check "the reply that replaced it is still the last one with words" \
	"$(printf '%s' "$OUT" | jq -rc 'select(.action=="complaint") | .plain')" \
	"the title left a gap on its left where rows showed through"

# 9. It never blocks and never prints — a hook that speaks would double the reply.
SAID=$(jq -nc --arg p "$WORK/chat.jsonl" '{transcript_path:$p}' | "$WORK/murk-count.sh")
check "it says nothing" "$SAID" ""

echo
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]