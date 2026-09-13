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
import sqlite3
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
# The hosts ports.json would name, set by hand: ov, whose db is PLACE, and mu, whose db sits beside it.
database.HOSTS = {'ov': 'ov.db', 'mu': 'mu.db'}

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

# That ask looked at the disk first, the real repo's listing, so the collections table now holds
# one row per project the listing names.
code, said = ask('/collections')
check('the look made a row per collection the listing names, ai its specialty, the repo its root',
      [(one['name'], one['specialty'], one['root']) for one in said.get('collections', [])],
      [(name, 'ai', REPO) for name in sorted({database.collection_of(one) for one in dispatcher.listed_files()[1]})])
check('each row has an id', all(isinstance(one.get('id'), int) for one in said.get('collections', [])), True)

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
check('a look with nothing changed says so', said, {'success': True, 'changed': 0, 'moved': 0, 'missing': 0, 'found': 0, 'collections': 0, 'ruled': 0})

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
check('a file with no row moves with nothing to keep and nothing said', said, {'success': True, 'changed': 0, 'moved': 0, 'missing': 0, 'found': 0, 'collections': 0, 'ruled': 0})

# --- the rules: labels a file gets from its name, its location or its content --

code, said = ask('/rules')
check('with no rules, none are listed', said.get('rules'), [])
RULED_FILE = 'memory/ov/truth/ruled.md'
with open(os.path.join(TEMP_REPO, RULED_FILE), 'w') as f:
    f.write('# Ruled\n\nA law of the land.\n')
code, said = ask('/labels', where=RULED_FILE)
check('a file no rule hits, with no row, has none', said.get('labels'), [])

code, said = tell('/add-rule', {'reads': 'location', 'pattern': '/truth/', 'name': 'kind', 'value': 'specify'})
check('a rule on the location is added', code, 200)
check('and every rule is run on every file', said.get('ruled', 0) > 0, True)
code, said = ask('/labels', where=RULED_FILE)
check('a file added to a truth folder gets its kind from the rule', said.get('labels'),
      [{'name': 'kind', 'value': 'specify', 'made_by': 'rule'}])
code, said = tell('/add-rule', {'reads': 'content', 'pattern': 'law of the land', 'name': 'tag', 'value': 'always'})
code, said = tell('/add-rule', {'reads': 'name', 'pattern': r'^ruled\.md$', 'name': 'tag', 'value': 'keep'})
code, said = ask('/labels', where=RULED_FILE)
check('rules on the content and the name give tags too', [one['value'] for one in said.get('labels', []) if one['name'] == 'tag'], ['always', 'keep'])
code, said = ask('/rules')
check('three rules are listed, oldest first', [one['pattern'] for one in said.get('rules', [])], ['/truth/', 'law of the land', r'^ruled\.md$'])
first_rule = said['rules'][0]['id']

code, said = tell('/add-label', {'name': 'kind', 'value': 'explain'}, where=RULED_FILE)
code, said = tell('/rescan', {})
code, said = ask('/labels', where=RULED_FILE)
check('a hand kind sits beside the rule kind, neither touching the other',
      sorted((one['value'], one['made_by']) for one in said.get('labels', []) if one['name'] == 'kind'),
      [('explain', 'hand'), ('specify', 'rule')])

with open(os.path.join(TEMP_REPO, RULED_FILE), 'w') as f:
    f.write('# Ruled\n\nNo law here.\n')
code, said = tell('/rescan', {})
check('a file changed has its rule labels computed again', said.get('ruled'), 1)
code, said = ask('/labels', where=RULED_FILE)
check('the tag the content gave is gone, the others stay', [one['value'] for one in said.get('labels', []) if one['name'] == 'tag'], ['keep'])

code, said = tell('/add-rule', {'reads': 'location', 'pattern': '(', 'name': 'kind', 'value': 'x'})
check('a pattern that is not a regex is refused', code, 400)
code, said = tell('/add-rule', {'reads': 'size', 'pattern': 'x', 'name': 'kind', 'value': 'x'})
check('a rule reading something else is refused', code, 400)

code, said = tell('/remove-rule', {'id': first_rule})
check('a rule is taken away', said.get('removed'), 1)
code, said = ask('/labels', where=RULED_FILE)
check('what it gave goes, the hand kind stays', [(one['value'], one['made_by']) for one in said.get('labels', []) if one['name'] == 'kind'], [('explain', 'hand')])
for rule in ask('/rules')[1]['rules']:
    tell('/remove-rule', {'id': rule['id']})
code, said = ask('/labels', where=RULED_FILE)
check('with every rule gone, every label a rule gave is gone', [one['made_by'] for one in said.get('labels', [])], ['hand'])

# --- one db per host, and the collections -------------------------------------
#
# Every call opens the db of the host it is told, ov's when told none, and a request names its
# host with a host parameter. The collections table holds one row per collection: for ai one
# per project, made by the look, the repo its root.

check('a call told no host opens PLACE', database.place_of(), database.PLACE)
check('a call told mu opens mu\'s db beside it', database.place_of('mu'), os.path.join(FOLDER, 'mu.db'))
try:
    database.place_of('nope')
    check('a host with no db is refused', 'opened', 'refused')
except ValueError:
    check('a host with no db is refused', 'refused', 'refused')

database.add_label(NOTE, FULL, 'tag', 'mine', host='mu')
check('a label written under mu is read back under mu', database.labels_of(NOTE, host='mu'),
      [{'name': 'tag', 'value': 'mine', 'made_by': 'hand'}])
check('and ov\'s db never sees it', [one for one in database.labels_of(NOTE) if one['value'] == 'mine'], [])
check('every label under mu is that one', database.all_labels(host='mu'), {NOTE: [{'name': 'tag', 'value': 'mine', 'made_by': 'hand'}]})
check('mu\'s db sits beside ov\'s', os.path.isfile(os.path.join(FOLDER, 'mu.db')), True)
database.remove_label(NOTE, 'tag', 'mine', host='mu')

os.makedirs(os.path.join(TEMP_REPO, 'memory', 'nowhere', 'truth'))
with open(os.path.join(TEMP_REPO, 'memory/nowhere/truth/new.md'), 'w') as f:
    f.write('# New\n')
code, said = tell('/rescan', {})
check('a collection the listing names for the first time gets its row at the look', said.get('collections'), 1)
code, said = ask('/collections')
check('the row is named for it, ai its specialty, the repo looked at its root',
      [(one['name'], one['specialty'], one['root']) for one in said.get('collections', []) if one['name'] == 'nowhere'],
      [('nowhere', 'ai', os.path.realpath(TEMP_REPO))])
check('a collection seen again keeps its row', [one['root'] for one in said.get('collections', []) if one['name'] == 'ov'], [REPO])
code, said = tell('/rescan', {})
check('a second look makes no row', said.get('collections'), 0)
code, said = ask('/collections', host='mu')
check('mu has no collection yet', said.get('collections'), [])
code, said = tell('/add-collection', {'name': 'live', 'specialty': 'music', 'root': FOLDER}, host='mu')
check('a collection added under mu answers its id', said.get('id'), 1)
code, said = ask('/collections', host='mu')
check('and is listed under mu', [(one['name'], one['specialty'], one['root']) for one in said.get('collections', [])], [('live', 'music', FOLDER)])
code, said = ask('/collections')
check('and not under ov', 'live' in [one['name'] for one in said.get('collections', [])], False)
code, said = tell('/add-collection', {'name': 'live', 'specialty': 'music', 'root': FOLDER}, host='mu')
check('the same name added twice leaves one row, and answers its id', said.get('id'), 1)
code, said = tell('/add-collection', {'name': 'lost', 'specialty': 'music', 'root': os.path.join(FOLDER, 'nowhere')}, host='mu')
check('a root that is not a folder is refused', code, 400)
code, said = tell('/add-collection', {'name': 'live'}, host='mu')
check('a collection missing its specialty or root is refused', code, 400)
code, said = ask('/labels', where=NOTE, host='nope')
check('a host with no db is refused by the dispatcher', code, 400)
check('and the refusal names the hosts', "['mu', 'ov']" in said.get('error', ''), True)
code, said = ask('/rules', host='mu')
check('mu\'s rules are its own, none yet', said.get('rules'), [])
code, said = tell('/add-rule', {'reads': 'name', 'pattern': r'\.flac$', 'name': 'kind', 'value': 'music'}, host='mu')
check('a rule added under mu is run on nothing, mu having no look yet', (code, said.get('ruled')), (200, 0))
code, said = ask('/rules', host='mu')
check('and is listed under mu', [one['pattern'] for one in said.get('rules', [])], [r'\.flac$'])
code, said = ask('/rules')
check('and not under ov', said.get('rules'), [])

# --- the backup and the dump --------------------------------------------------
#
# The dump is written beside the db, and a new db made from it answers every label the same.


def labels_in(place):
    """Every label in one db file, as rows a test can compare."""
    db = sqlite3.connect(place)
    rows = db.execute('SELECT files.path, labels.name, labels.value, labels.made_by FROM labels '
                      'JOIN files ON files.id = labels.file ORDER BY files.path, labels.name, labels.value').fetchall()
    db.close()
    return rows


code, said = tell('/dump', {})
check('a dump is written beside the db', os.path.isfile(database.dump_place()), True)
check('the dump says how many labels it holds', said.get('labels'), len(labels_in(database.PLACE)))
with open(database.dump_place()) as f:
    dumped = f.read()
check('the dump makes each table and inserts each row',
      'CREATE TABLE' in dumped and 'INSERT INTO "labels"' in dumped and 'INSERT INTO "files"' in dumped, True)

code, said = tell('/restore', {'into': 'ov.db'})
check('the live db is never written over', code, 400)
code, said = tell('/restore', {'into': 'mu.db'})
check('nor is another host\'s live db', code, 400)
code, said = tell('/restore', {'into': '../elsewhere.db'})
check('a name carrying a folder is refused', code, 400)
code, said = tell('/restore', {'into': 'notes.txt'})
check('a name that is not a .db is refused', code, 400)
code, said = tell('/restore', {})
check('a restore with nothing named is refused', code, 400)

code, said = tell('/restore', {'into': 'ov.restored.db'})
check('a dump read back into a new db answers', code, 200)
restored = os.path.join(FOLDER, 'ov.restored.db')
check('the new db sits beside the db', said.get('restored'), restored)
check('the new db answers every label the same as the db', labels_in(restored), labels_in(database.PLACE))
check('the new db holds the same tables',
      sorted(row[0] for row in sqlite3.connect(restored).execute("SELECT name FROM sqlite_master WHERE type = 'table'")),
      sorted(row[0] for row in sqlite3.connect(database.PLACE).execute("SELECT name FROM sqlite_master WHERE type = 'table'")))
check('the collections table is among them', 'collections' in dumped, True)

code, said = tell('/dump', {}, host='mu')
check('mu\'s dump is written beside its db, mu.sql', said.get('dump'), os.path.join(FOLDER, 'mu.sql'))
with open(os.path.join(FOLDER, 'mu.sql')) as f:
    check('and holds mu\'s collection', "INSERT INTO \"collections\"" in f.read(), True)
code, said = tell('/restore', {'into': 'mu.restored.db'}, host='mu')
check('mu\'s dump read back answers mu\'s rows', code, 200)
check('the new db holds mu\'s collection', [row[0] for row in sqlite3.connect(os.path.join(FOLDER, 'mu.restored.db')).execute('SELECT name FROM collections')], ['live'])

# --- say how it went ---------------------------------------------------------

server.shutdown()
shutil.rmtree(FOLDER)

for one in passed:
    print(f'  ok  {one}')
for one in failed:
    print(f'FAIL  {one}')
print(f'\n{len(passed)} passed, {len(failed)} failed')
sys.exit(1 if failed else 0)
