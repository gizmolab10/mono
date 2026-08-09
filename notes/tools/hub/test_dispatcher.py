"""
The dispatcher's routes, asked of a running dispatcher.

Run it with: python3 notes/tools/hub/test_dispatcher.py

A route in the wrong half of the file — an ask written among the tells — is perfectly good
code that simply never runs. Nothing but asking the running server catches that, which is
what this does.
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

WHERE = 'http://localhost:5171'
REPO = os.path.realpath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))


def ask(route, **params):
    """Ask the dispatcher for something. Answers with the code and whatever it said."""
    url = f'{WHERE}{route}'
    if params:
        url += '?' + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=5) as answer:
            return answer.status, json.loads(answer.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or '{}')


passed, failed = [], []


def check(what, got, wanted):
    if got == wanted:
        passed.append(what)
    else:
        failed.append(f'{what}\n      wanted {wanted!r}\n      got    {got!r}')


# --- the dispatcher is up at all ---------------------------------------------

try:
    code, said = ask('/list-guides')
except Exception as e:
    print(f'the dispatcher is not answering on {WHERE} — start it and run this again ({e})')
    sys.exit(1)

check('listing the guides answers', code, 200)
check('listing the guides succeeds', said.get('success'), True)

# --- reading one guide's words -----------------------------------------------

ordinary = 'ov/notes/guides/design/organize.md'
code, said = ask('/read-guide', where=ordinary)
check('reading an ordinary guide answers', code, 200)
check('reading an ordinary guide succeeds', said.get('success'), True)
check('reading an ordinary guide hands back its words', said.get('text', '').startswith('---'), True)

# The whole reason this route exists: a name holding a question mark. The dev server refuses
# one however it is written, and hands back the app's own page instead of the file.
tricky = 'ov/notes/guides/design/worth it?.md'
if os.path.isfile(os.path.join(REPO, tricky)):
    code, said = ask('/read-guide', where=tricky)
    check('reading a name with a question mark answers', code, 200)
    check('reading a name with a question mark succeeds', said.get('success'), True)
else:
    passed.append('reading a name with a question mark (no such file here — skipped)')

# A full place on this machine works as well as a place counting from the top of the repo.
code, said = ask('/read-guide', where=os.path.join(REPO, ordinary))
check('reading by its full place on this machine', said.get('success'), True)

# --- what it refuses ---------------------------------------------------------

code, said = ask('/read-guide')
check('naming no file is refused', code, 400)

code, said = ask('/read-guide', where='ov/src/lib/main.css')
check('anything that is not a guide is refused', code, 409)

code, said = ask('/read-guide', where='ov/notes/work/handoff.md')
check('a work note is refused', code, 409)

code, said = ask('/read-guide', where='ov/notes/guides/design/no such guide.md')
check('a guide that is not there is refused', code, 404)

# --- say how it went ---------------------------------------------------------

for one in passed:
    print(f'  ok  {one}')
for one in failed:
    print(f'FAIL  {one}')
print(f'\n{len(passed)} passed, {len(failed)} failed')
sys.exit(1 if failed else 0)
