#!/bin/bash
# Self-contained tests for plain-english-check.sh.
#   Run:  bash ".claude/hooks/plain-english-check.test.sh"
# Exits 0 when every check passes, 1 when any fails. No setup needed — it feeds the
# hook the JSON a Write of a memory file would carry, and reads what the hook says.
#
# The hook is warn-only: it prints one JSON line naming what it found, or nothing.
# So these tests read that line.

DIR="$(dirname "$0")"
HOOK="$DIR/plain-english-check.sh"
PASS=0; FAIL=0

# fire FILE CONTENT -> the hook's additionalContext, or an empty string.
fire() {
	jq -cn --arg f "$1" --arg c "$2" '{tool_input:{file_path:$f,content:$c}}' \
		| bash "$HOOK" 2>/dev/null | jq -r '.hookSpecificOutput.additionalContext // ""' 2>/dev/null
}

# check NAME CONTENT EXPECT
#   EXPECT is text the hook's message should hold, or CLEAN when it should say nothing.
check() {
	local name="$1" content="$2" expect="$3" said
	said="$(fire "memory/shared/zone/test.md" "$content")"
	if [ "$expect" = "CLEAN" ]; then
		if [ -z "$said" ]; then
			echo "PASS: $name (nothing said)"; PASS=$((PASS+1))
		else
			echo "FAIL: $name — wanted nothing said, hook said: $said"; FAIL=$((FAIL+1))
		fi
		return
	fi
	case "$said" in
		*"$expect"*) echo "PASS: $name (caught $expect)"; PASS=$((PASS+1)) ;;
		*)           echo "FAIL: $name — wanted $expect, hook said: ${said:-nothing}"; FAIL=$((FAIL+1)) ;;
	esac
}

# --- names in code style -----------------------------------------------------

check "a name in no code, lexicon or disk"   'cut one `Zorp` component'                          'NAME THAT NAMES NOTHING: `Zorp`'
check "a name the code has"                  'core draws the `Hamburger`'                        CLEAN
check "a name defined in the same write"     'cut one `Zorp` — **Zorp** — the shell as one piece' CLEAN
check "a folder on disk"                     'under `svelte/support/` beside the others'         CLEAN
check "a page variable the code sets"        'reads `--z-controls` off the page'                 CLEAN
check "a file on disk"                       'named in `ports.json`'                             CLEAN
check "a phrase, not a name"                 'run `yarn run check` first'                        CLEAN
check "a store the code has"                 'the `$w_tip` store'                                CLEAN

# --- banned words, as before -------------------------------------------------
# Only a mechanical row fires here — hooked, with a blank Meaning. A row with a Meaning
# (ship, land) is a sense check, left to the reply hook.

check "a banned word"                        'keep a copy of the file'                           'BANNED WORD WRITTEN INTO A FILE: copy'
check "both at once"                         'keep a copy of one `Zorp`'                         'NAME THAT NAMES NOTHING: `Zorp`'

# A .ts file: only comment lines are read, and no name check runs there.
said="$(fire "ov/src/lib/ts/x.ts" 'const a = `Zorp`; // fine')"
if [ -z "$said" ]; then echo "PASS: no name check in code files"; PASS=$((PASS+1))
else echo "FAIL: no name check in code files — hook said: $said"; FAIL=$((FAIL+1)); fi

echo "----"
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
