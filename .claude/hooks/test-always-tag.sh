#!/bin/bash
# Proves that the guides arriving with every message, and the guides wearing the
# "always" tag, are the same set — by breaking each half in turn and putting it back.
#
# The hook itself does the judging. This only takes the tag off a file that should
# have one, and puts one on a file that should not, then asks the hook whether it
# noticed. A hook that says nothing either time is a hook that is not looking.
#
# Run it with: bash .claude/hooks/test-always-tag.sh
REPO="/Users/sand/GitHub/mono"
HOOK="$REPO/.claude/hooks/inject-always.sh"
ARRIVES="$REPO/notes/guides/pre-flight/agency.md"        # arrives with every message
STAYS_HOME="$REPO/notes/guides/pre-flight/gates.md"      # never does
FAILED=0

say_pass() { echo "  pass — $1"; }
say_fail() { echo "  FAIL — $1"; FAILED=1; }

# Does the hook complain right now, before anything is touched?
echo "1. With nothing touched, the hook should say nothing about labels."
if bash "$HOOK" | grep -q 'LABELS ARE WRONG'; then
	say_fail "it is complaining already — read what it says and put that right first"
else
	say_pass "quiet"
fi

# Half one: a file that arrives, without the tag.
echo "2. Take the tag off a file that arrives. The hook should name it."
cp "$ARRIVES" "$ARRIVES.held"
perl -i -pe 's/^tags: \[always, /tags: [/' "$ARRIVES"
if bash "$HOOK" | grep -q "$(basename "$ARRIVES")"; then
	say_pass "named it"
else
	say_fail "said nothing — a file could arrive unlabeled and nobody would know"
fi
mv "$ARRIVES.held" "$ARRIVES"

# Half two: a file with the tag, that never arrives.
echo "3. Put the tag on a file that never arrives. The hook should name it too."
cp "$STAYS_HOME" "$STAYS_HOME.held"
perl -i -pe 's/^tags: \[/tags: [always, / if /^tags: \[/ && !/always/' "$STAYS_HOME"
if bash "$HOOK" | grep -q "$(basename "$STAYS_HOME")"; then
	say_pass "named it"
else
	say_fail "said nothing — a file could claim to arrive and never do so"
fi
mv "$STAYS_HOME.held" "$STAYS_HOME"

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