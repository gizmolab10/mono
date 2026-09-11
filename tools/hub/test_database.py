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

database.set_fields(NOTE, FULL, title='T', use_when=['a', 'b'])
check('the fields handed in go on the row, use_when as a list again', database.all_fields()[NOTE],
      {'title': 'T', 'description': '', 'use_when': ['a', 'b'], 'date': '', 'missing': False})
database.record_file(NOTE, FULL, None, None, description='D', date='1')
check('a field not handed in is left as it is', database.all_fields()[NOTE],
      {'title': 'T', 'description': 'D', 'use_when': ['a', 'b'], 'date': '1', 'missing': False})
database.set_fields(NOTE, FULL, title='', description='', use_when=[], date='')

# --- what a file's own block says ---------------------------------------------

SIX = ('kind', 'tags', 'title', 'description', 'use_when', 'date')
said = dispatcher.labels_in_text('---\nkind: explain\ntitle: "x"\ndescription: "d"\ntags: [now, soon]\ndate: 1\n---\n# x\n')
check('a block on one line says its kind and tags', (said['kind'], said['tags']), ('explain', ['now', 'soon']))
check('a block says its title, description and date, the quote marks taken off',
      (said['title'], said['description'], said['date']), ('x', 'd', '1'))
check('a block with no use_when line says none', said['use_when'], None)
said = dispatcher.labels_in_text('---\nkind: explain\ntags:\n  - now\n  - soon\nuse_when:\n  - every session\n  - settling\ndate: 1\n---\n')
check('tags one to a line, as Obsidian writes them, are read', said['tags'], ['now', 'soon'])
check('use_when one to a line is read', said['use_when'], ['every session', 'settling'])
check('a block with no tags line says no tags', dispatcher.labels_in_text('---\nkind: explain\n---\n')['tags'], None)
check('a block with no kind line says no kind', dispatcher.labels_in_text('---\ntags: []\n---\n')['kind'], None)
said = dispatcher.labels_in_text('# x\nwords\n')
check('a file with no block says nothing', [said[key] for key in SIX], [None] * 6)
said = dispatcher.labels_in_text('---\ntype: reference\nupdated: 29 August 2026\nokf_version: 1\n---\n')
check('type and updated are read as the kind and the date', (said['kind'], said['date']), ('reference', '29 August 2026'))
check('a line the db has no place for is named', said['unknown'], ['okf_version'])
check('a block with nothing unknown names nothing', dispatcher.labels_in_text('---\ntitle: "x"\n---\n')['unknown'], [])

check('the whole block comes off, and the blank line after it',
      dispatcher.without_block('---\nkind: explain\ntitle: "x"\ntags: [now, soon]\ndate: 1\n---\n\n# x\n'), '# x\n')
check('a heading right under the block keeps its place', dispatcher.without_block('---\ntitle: "x"\n---\n# x\n'), '# x\n')
check('a file with no block is untouched', dispatcher.without_block('# x\nwords\n'), '# x\nwords\n')

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
# whose block says a kind, tags, a title and a date, one with no block, and one whose block
# carries a line the db has no place for. No real file is read or written.

TEMP_REPO = os.path.join(FOLDER, 'repo')
os.makedirs(os.path.join(TEMP_REPO, 'memory', 'ov', 'truth'))
SAYS = 'memory/ov/truth/says.md'
QUIET = 'memory/ov/truth/quiet.md'
ODD = 'memory/ov/truth/odd.md'
with open(os.path.join(TEMP_REPO, SAYS), 'w') as f:
    f.write('---\nkind: explain\ntitle: "Says"\ntags: [now, always]\ndate: 1\n---\n\n# Says\n')
with open(os.path.join(TEMP_REPO, QUIET), 'w') as f:
    f.write('# Quiet\n')
with open(os.path.join(TEMP_REPO, ODD), 'w') as f:
    f.write('---\ntitle: "Odd"\nokf_version: 1\n---\n# Odd\n')
dispatcher.GITHUB_DIR = TEMP_REPO

code, said = tell('/scan', {})
check('the scan answers', code, 200)
check('the scan reads every listed file', said.get('files'), 3)
check('the scan finds the one kind', said.get('kinds'), 1)
check('the scan finds the two tags', said.get('tags'), 2)
check('the scan finds the three fields', said.get('fields'), 3)
check('the scan counts the file with no block', said.get('said_nothing'), 1)
code, said = ask('/labels', where=SAYS)
check('the scanned file wears what its block says', said.get('labels'),
      [{'name': 'kind', 'value': 'explain', 'made_by': 'hand'},
       {'name': 'tag', 'value': 'now', 'made_by': 'hand'},
       {'name': 'tag', 'value': 'always', 'made_by': 'hand'}])
code, said = ask('/all-labels')
check('the scanned file\'s fields come with every label', said.get('fields', {}).get(SAYS),
      {'title': 'Says', 'description': '', 'use_when': [], 'date': '1', 'missing': False})

code, said = tell('/strip-block', {})
check('the strip does nothing without the word', code, 400)
check('the file still carries its block', open(os.path.join(TEMP_REPO, SAYS)).read().startswith('---'), True)

code, said = tell('/strip-block', {'confirm': 'strip'})
check('the strip answers', code, 200)
check('the strip rewrites the file that carried a block', said.get('changed'), 1)
check('the strip passes over the file the db holds nothing for', said.get('unscanned'), 1)
check('the strip keeps the file with a line the db has no place for, and names it', said.get('kept'), [f'{ODD}: okf_version'])
check('the block is off and the words stay', open(os.path.join(TEMP_REPO, SAYS)).read(), '# Says\n')
check('the kept file is untouched', open(os.path.join(TEMP_REPO, ODD)).read(), '---\ntitle: "Odd"\nokf_version: 1\n---\n# Odd\n')
code, said = ask('/labels', where=SAYS)
check('the db still holds what the file said', len(said.get('labels', [])), 3)

code, said = tell('/scan', {})
check('a scan after the strip finds the stripped file saying nothing', said.get('said_nothing'), 2)
code, said = ask('/labels', where=SAYS)
check('and takes nothing off', len(said.get('labels', [])), 3)

code, said = tell('/set-fields', {'title': 'Renamed', 'use_when': ['x', 'y']}, where=SAYS)
check('fields are written through the dispatcher', said.get('fields'), ['title', 'use_when'])
code, said = ask('/all-labels')
check('the fields written are read back, the rest as they were', said.get('fields', {}).get(SAYS),
      {'title': 'Renamed', 'description': '', 'use_when': ['x', 'y'], 'date': '1', 'missing': False})
code, said = tell('/set-fields', {'use_when': 'not a list'}, where=SAYS)
check('a field of the wrong shape is refused', code, 400)
code, said = tell('/set-fields', {}, where=SAYS)
check('no field at all is refused', code, 400)

MOVED = 'memory/ov/truth/moved.md'
code, said = tell('/move-guide', {}, **{'from': SAYS, 'to': MOVED})
check('a file moves', code, 200)
code, said = ask('/labels', where=MOVED)
check('its labels follow it in the db', len(said.get('labels', [])), 3)
code, said = ask('/labels', where=SAYS)
check('and nothing is left under the old path', said.get('labels'), [])
code, said = tell('/delete-guide', {}, where=MOVED)
check('a file is thrown away', code, 200)
code, said = ask('/all-labels')
check('its row goes with it', MOVED in said.get('fields', {}), False)

# --- a file's sources: its authors and where it came from ---------------------

SOURCED = 'memory/ov/truth/sourced.md'
with open(os.path.join(TEMP_REPO, SOURCED), 'w') as f:
    f.write('# Sourced\n')
check('a file with no row has no sources', database.sources_of(SOURCED), [])
database.set_sources(SOURCED, os.path.join(TEMP_REPO, SOURCED), ['Jonathan', 'co'], 'a chat', '2026-09-10')
check('one row per author, each saying where the file came from', database.sources_of(SOURCED),
      [{'author': 'Jonathan', 'came_from': 'a chat', 'date': '2026-09-10'},
       {'author': 'co', 'came_from': 'a chat', 'date': '2026-09-10'}])
database.set_sources(SOURCED, os.path.join(TEMP_REPO, SOURCED), [], 'https://example.org', '2026-09-10')
check('nowhere but a place makes one row with no author', database.sources_of(SOURCED),
      [{'author': '', 'came_from': 'https://example.org', 'date': '2026-09-10'}])
database.set_sources(SOURCED, os.path.join(TEMP_REPO, SOURCED), [], '', '2026-09-10')
check('no author and nowhere leaves none', database.sources_of(SOURCED), [])

code, said = tell('/set-sources', {'authors': ['Jonathan'], 'came_from': 'a chat', 'date': '2026-09-10'}, where=SOURCED)
check('sources are written through the dispatcher and read back', said.get('sources'),
      [{'author': 'Jonathan', 'came_from': 'a chat', 'date': '2026-09-10'}])
code, said = ask('/sources', where=SOURCED)
check('a file\'s sources are asked for on their own', said.get('sources'),
      [{'author': 'Jonathan', 'came_from': 'a chat', 'date': '2026-09-10'}])
code, said = ask('/all-labels')
check('every file\'s sources come with every label', said.get('sources', {}).get(SOURCED),
      [{'author': 'Jonathan', 'came_from': 'a chat', 'date': '2026-09-10'}])
code, said = tell('/set-sources', {'authors': 'Jonathan'}, where=SOURCED)
check('authors not a list are refused', code, 400)
code, said = tell('/delete-guide', {}, where=SOURCED)
check('a file thrown away takes its sources with it', database.sources_of(SOURCED), [])

# --- the disk watched: a file moved, changed or gone in the Finder -------------
#
# The watcher's look at the disk is asked for by hand here, through /rescan.

WATCH = 'memory/ov/truth/watch.md'
WATCHED = 'memory/ov/truth/watched.md'
with open(os.path.join(TEMP_REPO, WATCH), 'w') as f:
    f.write('# Watch\n\nwords\n')
code, said = tell('/add-label', {'name': 'tag', 'value': 'now'}, where=WATCH)
code, said = tell('/rescan', {})
check('a look with nothing changed says so', said, {'success': True, 'changed': 0, 'moved': 0, 'missing': 0, 'found': 0})

os.rename(os.path.join(TEMP_REPO, WATCH), os.path.join(TEMP_REPO, WATCHED))
code, said = tell('/rescan', {})
check('a file moved in the Finder is noticed by its bytes', said.get('moved'), 1)
code, said = ask('/labels', where=WATCHED)
check('and keeps its labels under its new path', said.get('labels'), [{'name': 'tag', 'value': 'now', 'made_by': 'hand'}])
code, said = ask('/labels', where=WATCH)
check('with nothing left under the old one', said.get('labels'), [])

with open(os.path.join(TEMP_REPO, WATCHED), 'a') as f:
    f.write('more words\n')
code, said = tell('/rescan', {})
check('a file changed in the Finder is noticed', said.get('changed'), 1)
db = database.open_db()
row = db.execute('SELECT fingerprint, size FROM files WHERE path = ?', (WATCHED,)).fetchone()
db.close()
check('and its row carries the new fingerprint and size', (row['fingerprint'], row['size']),
      (database.fingerprint_of(os.path.join(TEMP_REPO, WATCHED)), os.path.getsize(os.path.join(TEMP_REPO, WATCHED))))

os.remove(os.path.join(TEMP_REPO, WATCHED))
code, said = tell('/rescan', {})
check('a file gone from the disk is marked missing', said.get('missing'), 1)
code, said = ask('/all-labels')
check('and its row says so, labels kept', (said['fields'][WATCHED]['missing'], len(said['labels'].get(WATCHED, []))), (True, 1))
code, said = tell('/rescan', {})
check('a second look marks nothing twice', said.get('missing'), 0)

with open(os.path.join(TEMP_REPO, WATCHED), 'w') as f:
    f.write('# Watch\n\nwords\nmore words\n')
code, said = tell('/rescan', {})
check('a missing file back at its path is found', said.get('found'), 1)
code, said = ask('/all-labels')
check('and the mark comes off', said['fields'][WATCHED]['missing'], False)

with open(os.path.join(TEMP_REPO, 'memory/ov/truth/loose.md'), 'w') as f:
    f.write('# Loose\n')
os.rename(os.path.join(TEMP_REPO, 'memory/ov/truth/loose.md'), os.path.join(TEMP_REPO, 'memory/ov/truth/loosed.md'))
code, said = tell('/rescan', {})
check('a file with no row moves with nothing to keep and nothing said', said, {'success': True, 'changed': 0, 'moved': 0, 'missing': 0, 'found': 0})

# --- say how it went ---------------------------------------------------------

server.shutdown()
shutil.rmtree(FOLDER)

for one in passed:
    print(f'  ok  {one}')
for one in failed:
    print(f'FAIL  {one}')
print(f'\n{len(passed)} passed, {len(failed)} failed')
sys.exit(1 if failed else 0)
