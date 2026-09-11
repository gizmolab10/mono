"""
The db, and the dispatcher reading and writing it: a tag written and read back.

Run it with: python3 tools/hub/test_database.py

Nothing here touches the real db. The db is pointed at a file in a folder made for the run,
and the dispatcher's routes are asked of a server started here on a port of its own, so the
running dispatcher is left alone and need not be up.
"""

import json
import os
import shutil
import sys
import tempfile
import threading
import urllib.error
import urllib.parse
import urllib.request
from http.server import HTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import database   # noqa: E402
import dispatcher # noqa: E402

REPO = os.path.realpath(os.path.join(os.path.dirname(__file__), '..', '..'))
FOLDER = tempfile.mkdtemp(prefix='ov-db-')
database.PLACE = os.path.join(FOLDER, 'ov.db')

NOTE = 'memory/ov/zone/work/current context.md'
FULL = os.path.join(REPO, NOTE)

passed, failed = [], []


def check(what, got, wanted):
    if got == wanted:
        passed.append(what)
    else:
        failed.append(f'{what}\n      wanted {wanted!r}\n      got    {got!r}')


# --- the db on its own --------------------------------------------------------

check('a file the db has no row for has no labels', database.labels_of(NOTE), [])

database.add_label(NOTE, FULL, 'tag', 'now')
check('a tag written is read back', database.labels_of(NOTE),
      [{'name': 'tag', 'value': 'now', 'made_by': 'hand'}])

database.add_label(NOTE, FULL, 'tag', 'now')
check('the same tag written twice leaves one row', len(database.labels_of(NOTE)), 1)

database.add_label(NOTE, FULL, 'kind', 'explain', 'rule')
check('a kind written by a rule sits beside the tag', database.labels_of(NOTE),
      [{'name': 'tag', 'value': 'now', 'made_by': 'hand'},
       {'name': 'kind', 'value': 'explain', 'made_by': 'rule'}])

check('a tag taken off answers one row gone', database.remove_label(NOTE, 'tag', 'now'), 1)
check('a tag taken off is gone', database.labels_of(NOTE),
      [{'name': 'kind', 'value': 'explain', 'made_by': 'rule'}])
check('a tag not there answers nothing gone', database.remove_label(NOTE, 'tag', 'now'), 0)

try:
    database.add_label(NOTE, FULL, 'tag', 'now', 'guess')
    check('a label made by nobody known is refused', 'written', 'refused')
except ValueError:
    check('a label made by nobody known is refused', 'refused', 'refused')

db = database.open_db()
row = db.execute('SELECT collection, size, fingerprint FROM files WHERE path = ?', (NOTE,)).fetchone()
db.close()
check('the file row holds the collection', row['collection'], 'ov')
check('the file row holds the size on disk', row['size'], os.path.getsize(FULL))
check('the file row holds the fingerprint of the bytes', row['fingerprint'], database.fingerprint_of(FULL))

check('a memory file belongs to its memory folder', database.collection_of('memory/lv/truth/lexicon.md'), 'lv')
check('a CLAUDE file belongs to its project', database.collection_of('lv/CLAUDE.md'), 'lv')
check('the repo\'s own CLAUDE file is shared', database.collection_of('CLAUDE.md'), 'shared')

# --- one name's labels made exactly these -------------------------------------

database.replace_labels(NOTE, FULL, 'tag', ['now', 'soon'])
check('the tags are made exactly the two named', [one['value'] for one in database.labels_of(NOTE) if one['name'] == 'tag'], ['now', 'soon'])
database.replace_labels(NOTE, FULL, 'tag', ['later'])
check('the tags made again are only the one named', [one['value'] for one in database.labels_of(NOTE) if one['name'] == 'tag'], ['later'])
check('the kind is untouched by the tags being made', [one['value'] for one in database.labels_of(NOTE) if one['name'] == 'kind'], ['explain'])
database.replace_labels(NOTE, FULL, 'tag', ['ai-said'], 'ai')
check('a maker\'s rows stay when another maker\'s are made', [one['value'] for one in database.labels_of(NOTE) if one['name'] == 'tag'], ['later', 'ai-said'])
database.replace_labels(NOTE, FULL, 'tag', [])
check('none at all takes a maker\'s tags off, and no other\'s', [one['value'] for one in database.labels_of(NOTE) if one['name'] == 'tag'], ['ai-said'])
database.replace_labels(NOTE, FULL, 'tag', [], 'ai')
database.remove_label(NOTE, 'kind', 'explain')

database.record_file(NOTE, FULL, 'specify', ['now'])
check('a file\'s block is recorded, kind and tags', database.labels_of(NOTE),
      [{'name': 'kind', 'value': 'specify', 'made_by': 'hand'}, {'name': 'tag', 'value': 'now', 'made_by': 'hand'}])
database.record_file(NOTE, FULL, None, None)
check('a file saying nothing keeps what the db holds', len(database.labels_of(NOTE)), 2)
database.record_file(NOTE, FULL, '', None)
check('a file saying an empty kind has none', [one['value'] for one in database.labels_of(NOTE) if one['name'] == 'kind'], [])

check('every label on every file comes keyed by path', database.all_labels(),
      {NOTE: [{'name': 'tag', 'value': 'now', 'made_by': 'hand'}]})
database.replace_labels(NOTE, FULL, 'tag', [])
check('a file with a row and no labels is left out', database.all_labels(), {})

# --- what a file's own block says ---------------------------------------------

check('a block on one line says its kind and tags',
      dispatcher.labels_in_text('---\nkind: explain\ntitle: "x"\ntags: [now, soon]\ndate: 1\n---\n# x\n'),
      ('explain', ['now', 'soon']))
check('tags one to a line, as Obsidian writes them, are read',
      dispatcher.labels_in_text('---\nkind: explain\ntags:\n  - now\n  - soon\ndate: 1\n---\n'),
      ('explain', ['now', 'soon']))
check('a block with no tags line says no tags', dispatcher.labels_in_text('---\nkind: explain\n---\n'), ('explain', None))
check('a block with no kind line says no kind', dispatcher.labels_in_text('---\ntags: []\n---\n'), (None, []))
check('a file with no block says neither', dispatcher.labels_in_text('# x\nwords\n'), (None, None))

check('the kind and tags lines come out, the rest stays',
      dispatcher.without_kind_and_tags('---\nkind: explain\ntitle: "x"\ntags: [now, soon]\ndate: 1\n---\n# x\n'),
      '---\ntitle: "x"\ndate: 1\n---\n# x\n')
check('tags one to a line come out with their names',
      dispatcher.without_kind_and_tags('---\nkind: explain\ntags:\n  - now\n  - soon\ndate: 1\n---\n# x\n'),
      '---\ndate: 1\n---\n# x\n')
check('a file with no block is untouched', dispatcher.without_kind_and_tags('# x\nwords\n'), '# x\nwords\n')
check('a block already without them is untouched',
      dispatcher.without_kind_and_tags('---\ntitle: "x"\n---\n'), '---\ntitle: "x"\n---\n')

# --- the dispatcher's routes --------------------------------------------------

server = HTTPServer(('localhost', 0), dispatcher.APIHandler)
threading.Thread(target=server.serve_forever, daemon=True).start()
WHERE = f'http://localhost:{server.server_address[1]}'


def ask(route, **params):
    url = f'{WHERE}{route}'
    if params:
        url += '?' + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=5) as answer:
            return answer.status, json.loads(answer.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or '{}')


def tell(route, body, **params):
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


database.remove_label(NOTE, 'kind', 'explain')

code, said = tell('/add-label', {'name': 'tag', 'value': 'soon'}, where=NOTE)
check('a tag is written through the dispatcher', code, 200)

code, said = ask('/labels', where=NOTE)
check('the tag is read back through the dispatcher', said.get('labels'),
      [{'name': 'tag', 'value': 'soon', 'made_by': 'hand'}])

code, said = tell('/remove-label', {'name': 'tag', 'value': 'soon'}, where=NOTE)
check('the tag is taken off through the dispatcher', said.get('removed'), 1)

code, said = ask('/labels', where=NOTE)
check('nothing is left on the file', said.get('labels'), [])

code, said = tell('/add-label', {'name': 'tag', 'value': 'soon'}, where=NOTE)
code, said = ask('/all-labels')
check('every label comes in one answer, keyed by path', said.get('labels'),
      {NOTE: [{'name': 'tag', 'value': 'soon', 'made_by': 'hand'}]})
database.replace_labels(NOTE, FULL, 'tag', [])

# --- what the routes refuse ---------------------------------------------------

code, said = ask('/labels')
check('reading labels of no file is refused', code, 400)

code, said = ask('/labels', where='ov/src/lib/main.css')
check('reading labels of anything that is not a note is refused', code, 409)

code, said = tell('/add-label', {'name': 'tag', 'value': 'now'}, where='memory/ov/zone/work/no such note.md')
check('writing a label on a note that is not there is refused', code, 404)

code, said = tell('/add-label', {'name': 'tag'}, where=NOTE)
check('writing a label with no value is refused', code, 400)

code, said = tell('/add-label', {'name': 'tag', 'value': 'now', 'made_by': 'guess'}, where=NOTE)
check('writing a label made by nobody known is refused', code, 400)

# --- the scan and the strip, on a repo made for the run -----------------------
#
# The dispatcher walks whatever GITHUB_DIR names, so a small repo is made here: one memory file
# whose block says a kind and tags, one whose block says neither. No real file is read or written.

TEMP_REPO = os.path.join(FOLDER, 'repo')
os.makedirs(os.path.join(TEMP_REPO, 'memory', 'ov', 'truth'))
SAYS = 'memory/ov/truth/says.md'
QUIET = 'memory/ov/truth/quiet.md'
with open(os.path.join(TEMP_REPO, SAYS), 'w') as f:
    f.write('---\nkind: explain\ntitle: "Says"\ntags: [now, always]\ndate: 1\n---\n# Says\n')
with open(os.path.join(TEMP_REPO, QUIET), 'w') as f:
    f.write('---\ntitle: "Quiet"\ndate: 1\n---\n# Quiet\n')
dispatcher.GITHUB_DIR = TEMP_REPO

code, said = tell('/scan', {})
check('the scan answers', code, 200)
check('the scan reads every listed file', said.get('files'), 2)
check('the scan finds the one kind', said.get('kinds'), 1)
check('the scan finds the two tags', said.get('tags'), 2)
check('the scan counts the file whose block says nothing', said.get('said_nothing'), 1)
code, said = ask('/labels', where=SAYS)
check('the scanned file wears what its block says', said.get('labels'),
      [{'name': 'kind', 'value': 'explain', 'made_by': 'hand'},
       {'name': 'tag', 'value': 'now', 'made_by': 'hand'},
       {'name': 'tag', 'value': 'always', 'made_by': 'hand'}])

code, said = tell('/strip-labels', {})
check('the strip does nothing without the word', code, 400)
check('the file still carries its lines', 'kind: explain' in open(os.path.join(TEMP_REPO, SAYS)).read(), True)

code, said = tell('/strip-labels', {'confirm': 'strip'})
check('the strip answers', code, 200)
check('the strip rewrites the file that carried the lines', said.get('changed'), 1)
check('the strip passes over the file the db holds nothing for', said.get('unscanned'), 1)
check('the two lines are out and the rest stays', open(os.path.join(TEMP_REPO, SAYS)).read(),
      '---\ntitle: "Says"\ndate: 1\n---\n# Says\n')
code, said = ask('/labels', where=SAYS)
check('the db still holds what the file said', len(said.get('labels', [])), 3)

code, said = tell('/scan', {})
check('a scan after the strip finds every block saying nothing', said.get('said_nothing'), 2)
code, said = ask('/labels', where=SAYS)
check('and takes nothing off', len(said.get('labels', [])), 3)

# --- say how it went ---------------------------------------------------------

server.shutdown()
shutil.rmtree(FOLDER)

for one in passed:
    print(f'  ok  {one}')
for one in failed:
    print(f'FAIL  {one}')
print(f'\n{len(passed)} passed, {len(failed)} failed')
sys.exit(1 if failed else 0)
