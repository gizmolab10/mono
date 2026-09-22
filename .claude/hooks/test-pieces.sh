#!/bin/bash
# Proves the seven pieces of inject-always.sh's part B: run the hook once per piece with a
# count file of its own, so the real turn count is untouched, and check that every non-blank
# line of the rest of conventions.md, agency.md and lexicon.md comes out in exactly one piece,
# and that no piece with Always passes the size the Claude harness was seen to save at.
#
# Run it with: bash .claude/hooks/test-pieces.sh
REPO="/Users/sand/GitHub/mono"
HOOK="$REPO/.claude/hooks/inject-always.sh"
export INJECT_COUNT_FILE="$(mktemp)"
echo 0 > "$INJECT_COUNT_FILE"
PIECES=$(grep -c '^  "[^"]*@' "$HOOK")
OUT="$(mktemp -d)"
for (( i = 0; i < PIECES; i++ )); do bash "$HOOK" > "$OUT/$i.txt"; done
rm -f "$INJECT_COUNT_FILE"

python3 - "$REPO" "$OUT" "$PIECES" <<'PY'
import re, sys
from collections import Counter
from pathlib import Path
repo, out, pieces = Path(sys.argv[1]), Path(sys.argv[2]), int(sys.argv[3])
truth = repo / 'memory/shared/truth'
failed = 0
def check(name, ok, detail=''):
    global failed
    print(f"  {'pass' if ok else 'FAIL'} — {name}{'' if ok else ': ' + detail}")
    failed |= not ok
got, biggest = Counter(), 0
for i in range(pieces):
    text = (out / f'{i}.txt').read_text()
    body = text.split('--- ONE PART IN TURN: ', 1)[1].split('\n', 1)[1]
    got.update(l for l in body.split('\n') if l.strip())
    biggest = max(biggest, len(text.encode()))
conv = (truth / 'conventions.md').read_text()
rest = re.sub(r'(?s)^# Conventions\n.*?(?=## Response\n)', '', conv)
want = Counter()
for text in (rest, (truth / 'agency.md').read_text(), (truth / 'lexicon.md').read_text()):
    want.update(l for l in text.split('\n') if l.strip())
print(f'1. {pieces} pieces, the largest output with Always {biggest / 1024:.1f}KB.')
check('every line of the three files comes out once', want == got,
      f'missing {sum((want - got).values())}, extra {sum((got - want).values())}: {list((want - got) + (got - want))[:3]}')
check('the largest output is under 8.4KB, the size seen shown whole on 19 September 2026', biggest <= 8.4 * 1024, f'{biggest} bytes')
sys.exit(1 if failed else 0)
PY
STATUS=$?
rm -rf "$OUT"
[ $STATUS -eq 0 ] && echo "Both hold." || echo "Something failed."
exit $STATUS
