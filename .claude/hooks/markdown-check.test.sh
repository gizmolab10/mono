#!/bin/bash
# Self-contained tests for markdown-check.sh.
#   Run:  bash ".claude/hooks/markdown-check.test.sh"
# Exits 0 when every check passes, 1 when any fails. It feeds the hook the JSON a Write of a
# memory file would carry, and reads what the hook says: one JSON line, or nothing.

DIR="$(dirname "$0")"
HOOK="$DIR/markdown-check.sh"
PASS=0; FAIL=0

# fire FILE CONTENT -> the hook's additionalContext, or an empty string.
fire() {
	jq -cn --arg f "$1" --arg c "$2" '{tool_input:{file_path:$f,content:$c}}' \
		| bash "$HOOK" 2>/dev/null | jq -r '.hookSpecificOutput.additionalContext // ""' 2>/dev/null
}

# check NAME FILE CONTENT EXPECT
#   EXPECT is text the hook's message should hold, or CLEAN when it should say nothing.
check() {
	local name="$1" file="$2" content="$3" expect="$4" said
	said="$(fire "$file" "$content")"
	if [ "$expect" = "CLEAN" ]; then
		if [ -z "$said" ]; then echo "PASS: $name (nothing said)"; PASS=$((PASS+1))
		else echo "FAIL: $name — wanted nothing said, hook said: $said"; FAIL=$((FAIL+1)); fi
		return
	fi
	case "$said" in
		*"$expect"*) echo "PASS: $name (caught $expect)"; PASS=$((PASS+1)) ;;
		*)           echo "FAIL: $name — wanted $expect, hook said: ${said:-nothing}"; FAIL=$((FAIL+1)) ;;
	esac
}

MD="memory/shared/zone/test.md"
check "a bare placeholder"                 "$MD" 'the file at memory/<X>/logs/log.md'         'BARE PLACEHOLDER: <X>'
check "two bare placeholders"              "$MD" 'memory/<project>/zone/<name>.md'            'BARE PLACEHOLDER: <name> <project>'
check "a placeholder in backticks"         "$MD" 'the file at `memory/<X>/logs/log.md`'       CLEAN
check "a placeholder in fenced code"       "$MD" $'words\n```\nmemory/<X>/logs\n```\nmore'      CLEAN
check "an html tag is not a placeholder"   "$MD" 'a <br> in the html, and a <svg width="1">'  CLEAN
check "a code file is not read"            "ov/src/lib/ts/x.ts" 'const a = "<X>"; // a placeholder' CLEAN

echo "----"
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
