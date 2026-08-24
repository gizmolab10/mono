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


def tell(route, body, **params):
    """Tell the dispatcher to do something, with a JSON body. Answers the same way."""
    url = f'{WHERE}{route}'
    if params:
        url += '?' + urllib.parse.urlencode(params)
    sending = urllib.request.Request(url, data=json.dumps(body).encode(),
                                     headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(sending, timeout=5) as answer:
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
    code, said = ask('/list-files')
except Exception as e:
    print(f'the dispatcher is not answering on {WHERE} — start it and run this again ({e})')
    sys.exit(1)

check('listing the guides answers', code, 200)
check('listing the guides succeeds', said.get('success'), True)

# --- the work notes sitting at the top of each project's work folder ----------
#
# Those are the ones guides link to: the handoff, the debt, the journal. Anything deeper —
# milestones, dated notes — stays out, so the list grows by a tenth and not by three times.

listed = said.get('paths', [])
check('the top of a work folder is listed', 'ov/notes/work/handoff.md' in listed, True)
check('the shared collection\'s work is listed too', 'notes/work/learn.md' in listed, True)
deeper = [one for one in listed if '/notes/work/' in f'/{one}' and one.count('/') > 3]
check('nothing deeper than the top of a work folder is listed', deeper, [])

# --- the CLAUDE files ---------------------------------------------------------
#
# Each collection's entry point sits at its very top, spelled CLAUDE.MD or CLAUDE.md.

check('the repo\'s own CLAUDE file is listed', 'CLAUDE.md' in listed, True)
check('lv\'s CLAUDE file is listed', 'lv/CLAUDE.md' in listed, True)
check('ov\'s lowercase CLAUDE.md is listed', 'ov/CLAUDE.md' in listed, True)

code, said = ask('/read-guide?where=lv/CLAUDE.md')
check('a CLAUDE file can be read', code, 200)
code, said = ask('/read-guide?where=CLAUDE.md')
check('the repo\'s own CLAUDE file can be read', code, 200)
code, said = ask('/read-guide?where=lv/notes/CLAUDE.md')
check('no CLAUDE file below a collection\'s top is readable', code, 409)

# --- the memory system --------------------------------------------------------
#
# It sits at the top of the repo beside notes, belongs to no collection, and every file in
# it is listed however deep it sits.

check('the memory system is listed', 'memory/index.md' in listed, True)
check('a memory file three folders down is listed', 'memory/shared/truth/protocol.md' in listed, True)

code, said = ask('/read-guide', where='memory/shared/truth/protocol.md')
check('a memory file is read', code, 200)
check('a memory file hands back its words', said.get('text', '') != '', True)

code, said = ask('/read-guide', where=os.path.join(REPO, 'memory/index.md'))
check('a memory file is read by its full place too', code, 200)

# --- reading one guide's words -----------------------------------------------

ordinary = 'notes/guides/collaborate/organize.md'
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
check('a work note at the top of a work folder is read', said.get('success'), True)

code, said = ask('/read-guide', where='di/notes/work/now/learn.md')
check('a work note sitting deeper is refused', code, 409)

code, said = ask('/read-guide', where='ov/notes/guides/design/no such guide.md')
check('a guide that is not there is refused', code, 404)

# --- writing a work note ------------------------------------------------------
#
# Labels are assigned in the app, which writes the whole file back. Nothing is written here:
# the words said to have been opened are deliberately wrong, so the write stops one step past
# the guard. "the file changed since it was opened" proves the guard let a work note through.

code, said = tell('/save-guide', {'text': 'x', 'as_opened': 'not what is on disk'},
                  where='ov/notes/work/handoff.md')
check('a work note passes the writing guard', said.get('error'), 'the file changed since it was opened')

code, said = tell('/save-guide', {'text': 'x', 'as_opened': ''}, where='ov/src/lib/main.css')
check('anything that is not a note is refused a write', code, 409)

# --- renaming and throwing away a work note -----------------------------------
#
# Nothing is moved or thrown away here: each names a work note that isn't there, so it stops one
# step past the guard. "no such file" proves the guard let a work note through.

code, said = tell('/move-guide', {}, **{'from': 'ov/notes/work/no such note.md', 'to': 'ov/notes/work/nor this.md'})
check('a work note passes the renaming guard', said.get('error'), 'no such file')

code, said = tell('/delete-guide', {}, where='ov/notes/work/no such note.md')
check('a work note passes the throwing-away guard', said.get('error'), 'no such file')

code, said = tell('/delete-guide', {}, where='di/notes/work/now/learn.md')
check('a work note sitting deeper is refused a throwing-away', code, 409)

# --- say how it went ---------------------------------------------------------

for one in passed:
    print(f'  ok  {one}')
for one in failed:
    print(f'FAIL  {one}')
print(f'\n{len(passed)} passed, {len(failed)} failed')
sys.exit(1 if failed else 0)
