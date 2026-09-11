#!/bin/bash
# Proves that the guides arriving with every message, and the guides wearing the
# "always" tag, are the same set — by breaking each half in turn and putting it back.
#
# The hook itself does the judging. This only takes the tag off a file that should
# have one, and puts one on a file that should not, then asks the hook whether it
# noticed. A hook that says nothing either time is a hook that is not looking.
#
# The tag lives in the db beside the dispatcher, not in the file, so it is taken off and
# put on there, through the dispatcher's own module. The file itself is never touched.
#
# Run it with: bash .claude/hooks/test-always-tag.sh
REPO="/Users/sand/GitHub/mono"
HOOK="$REPO/.claude/hooks/inject-always.sh"
ARRIVES="memory/shared/truth/agency.md"        # arrives with every message
STAYS_HOME="memory/shared/truth/gates.md"      # never does
FAILED=0

say_pass() { echo "  pass — $1"; }
say_fail() { echo "  FAIL — $1"; FAILED=1; }

# Put the "always" tag on a file in the db, or take it off: tag on|off <path from the top of the repo>
tag() { python3 - "$1" "$2" <<'PY'
import sys
sys.path.insert(0, '/Users/sand/GitHub/mono/tools/hub')
import database
what, where = sys.argv[1], sys.argv[2]
if what == 'off':
    database.remove_label(where, 'tag', 'always')
else:
    database.add_label(where, f'/Users/sand/GitHub/mono/{where}', 'tag', 'always')
PY
}

# Does the hook complain right now, before anything is touched?
echo "1. With nothing touched, the hook should say nothing about labels."
if bash "$HOOK" | grep -q 'LABELS ARE WRONG'; then
	say_fail "it is complaining already — read what it says and put that right first"
else
	say_pass "quiet"
fi

# Half one: a file that arrives, without the tag.
echo "2. Take the tag off a file that arrives. The hook should name it."
tag off "$ARRIVES"
if bash "$HOOK" | grep -q "$(basename "$ARRIVES")"; then
	say_pass "named it"
else
	say_fail "said nothing — a file could arrive unlabeled and nobody would know"
fi
tag on "$ARRIVES"

# Half two: a file with the tag, that never arrives.
echo "3. Put the tag on a file that never arrives. The hook should name it too."
tag on "$STAYS_HOME"
if bash "$HOOK" | grep -q "$(basename "$STAYS_HOME")"; then
	say_pass "named it"
else
	say_fail "said nothing — a file could claim to arrive and never do so"
fi
tag off "$STAYS_HOME"

# Everything back the way it was?
echo "4. With both put back, the hook should be quiet again."
if bash "$HOOK" | grep -q 'LABELS ARE WRONG'; then
	say_fail "still complaining — this test left something behind"
else
	say_pass "quiet"
fi

echo ""
[ $FAILED -eq 0 ] && echo "All four hold." || echo "Something is wrong — see the FAIL lines above."
exit $FAILED
