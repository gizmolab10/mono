#!/usr/bin/env python3
"""
The db: one SQLite file beside the dispatcher, holding what ov knows about its files that the
files themselves do not say. Only the dispatcher reads and writes it, through the calls here.

Four tables, as memory/ov/zone/knowledge bases.md lays them out:
  files   -- one row per file: its collection, its path from the top of the repo, its size,
             when it was last changed, its fingerprint, a short code computed from its bytes
             (same bytes, same code), and the four fields the file's label block used to
             carry: title, description, use_when (several, kept as one csv field) and date
  labels  -- one row per kind or tag on a file: the file, the name (kind or tag), the value,
             and who made it: hand, rule or ai
  sources -- one row per author or origin of a file: the file, the author, where it came from
             (a url or a person), and the date
  rules   -- one row per rule that gives a label: what it reads (name, location or content),
             the pattern it matches, and the label it gives (name and value)

Labels and fields are written and read here. The other two tables wait for their phases. A
file's row is made the first time anything is written on it, from what is on disk then, and
brought up to date with the disk on every write after.
"""

import hashlib
import os
import sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Where the db sits. A test points this at a file of its own before asking anything.
PLACE = os.path.join(SCRIPT_DIR, 'ov.db')

MADE_BY = ('hand', 'rule', 'ai')
# The four fields on a file's row, the ones its label block used to carry.
FIELDS = ('title', 'description', 'use_when', 'date')

TABLES = """
CREATE TABLE IF NOT EXISTS files (
    id          INTEGER PRIMARY KEY,
    collection  TEXT NOT NULL,
    path        TEXT NOT NULL UNIQUE,
    size        INTEGER NOT NULL,
    modified    REAL NOT NULL,
    fingerprint TEXT NOT NULL,
    title       TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    use_when    TEXT NOT NULL DEFAULT '',
    date        TEXT NOT NULL DEFAULT '',
    missing     INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS labels (
    id      INTEGER PRIMARY KEY,
    file    INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    name    TEXT NOT NULL,
    value   TEXT NOT NULL,
    made_by TEXT NOT NULL CHECK (made_by IN ('hand', 'rule', 'ai')),
    UNIQUE (file, name, value, made_by)
);
CREATE TABLE IF NOT EXISTS sources (
    id        INTEGER PRIMARY KEY,
    file      INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    author    TEXT NOT NULL,
    came_from TEXT NOT NULL,
    date      TEXT
);
CREATE TABLE IF NOT EXISTS rules (
    id      INTEGER PRIMARY KEY,
    reads   TEXT NOT NULL CHECK (reads IN ('name', 'location', 'content')),
    pattern TEXT NOT NULL,
    name    TEXT NOT NULL,
    value   TEXT NOT NULL
);
"""


def open_db():
    """Open the db, making the file and its tables the first time. A files table made before the
    four fields and the missing mark were columns is given them. A row pointing at a file goes
    when the file's row goes, which sqlite only honors when asked on every open. Two threads
    open it, the dispatcher's and the watcher's, so an open waits its turn for a few seconds
    rather than refusing."""
    db = sqlite3.connect(PLACE, timeout=5)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys = ON')
    db.executescript(TABLES)
    have = {row['name'] for row in db.execute('PRAGMA table_info(files)')}
    for name in FIELDS:
        if name not in have:
            db.execute(f"ALTER TABLE files ADD COLUMN {name} TEXT NOT NULL DEFAULT ''")
    if 'missing' not in have:
        db.execute('ALTER TABLE files ADD COLUMN missing INTEGER NOT NULL DEFAULT 0')
    db.commit()
    return db


def fingerprint_of(full):
    """A short code computed from a file's bytes: same bytes, same code."""
    with open(full, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()[:16]


def collection_of(where):
    """Which collection a path from the top of the repo belongs to: the memory folder it sits
    in, or the project whose CLAUDE file it is. shared for anything at the repo's own top."""
    parts = where.split('/')
    if parts[0] == 'memory' and len(parts) > 2:
        return parts[1]
    if len(parts) == 2 and parts[1].lower() == 'claude.md':
        return parts[0]
    return 'shared'


def file_row(db, where, full):
    """The id of a file's row, made from what is on disk when there is none, and brought up to
    date with the disk when there is. The four fields are left as they are."""
    db.execute(
        'INSERT INTO files (collection, path, size, modified, fingerprint) VALUES (?, ?, ?, ?, ?) '
        'ON CONFLICT(path) DO UPDATE SET size = excluded.size, modified = excluded.modified, '
        'fingerprint = excluded.fingerprint',
        (collection_of(where), where, os.path.getsize(full), os.path.getmtime(full), fingerprint_of(full)))
    return db.execute('SELECT id FROM files WHERE path = ?', (where,)).fetchone()['id']


def _replace(db, file, name, values, made_by):
    """Every row of one name and one maker on a file goes, and one row per value comes."""
    db.execute('DELETE FROM labels WHERE file = ? AND name = ? AND made_by = ?', (file, name, made_by))
    db.executemany('INSERT OR IGNORE INTO labels (file, name, value, made_by) VALUES (?, ?, ?, ?)',
                   [(file, name, value, made_by) for value in values])


def _set_fields(db, file, fields):
    """The fields handed in go on the row. use_when arrives as a list and is kept as one csv
    field. A field handed in as None is left as it is."""
    for name, value in fields.items():
        if name not in FIELDS:
            raise ValueError(f'a field must be one of {FIELDS}, not {name!r}')
        if value is None:
            continue
        if name == 'use_when':
            value = ', '.join(value)
        db.execute(f'UPDATE files SET {name} = ? WHERE id = ?', (value, file))


def add_label(where, full, name, value, made_by='hand'):
    """Write one label on a file: where is its path from the top of the repo, full its place on
    this machine. Writing the same label twice leaves one row."""
    if made_by not in MADE_BY:
        raise ValueError(f'made_by must be one of {MADE_BY}, not {made_by!r}')
    db = open_db()
    with db:
        file = file_row(db, where, full)
        db.execute('INSERT OR IGNORE INTO labels (file, name, value, made_by) VALUES (?, ?, ?, ?)',
                   (file, name, value, made_by))
    db.close()


def replace_labels(where, full, name, values, made_by='hand'):
    """Make one name's labels on a file, by one maker, exactly these values. The kind is one
    value, the tags are many, and none at all takes them all off. Other makers' rows stay."""
    if made_by not in MADE_BY:
        raise ValueError(f'made_by must be one of {MADE_BY}, not {made_by!r}')
    db = open_db()
    with db:
        _replace(db, file_row(db, where, full), name, values, made_by)
    db.close()


def record_file(where, full, kind, tags, **fields):
    """What a file's own label block says, written on one open of the db: its hand kind made the
    one named, its hand tags made those named, and each field handed in made what it says. None
    for any of them leaves that one as it is, so a file that says nothing keeps what the db
    holds."""
    db = open_db()
    with db:
        file = file_row(db, where, full)
        if kind is not None:
            _replace(db, file, 'kind', [kind] if kind else [], 'hand')
        if tags is not None:
            _replace(db, file, 'tag', tags, 'hand')
        _set_fields(db, file, fields)
    db.close()


def set_fields(where, full, **fields):
    """The four fields on a file's row: title, description, use_when and date. Only the ones
    handed in change."""
    db = open_db()
    with db:
        _set_fields(db, file_row(db, where, full), fields)
    db.close()


def remove_label(where, name, value):
    """Take one label off a file, whoever made it. Answers how many rows went."""
    db = open_db()
    with db:
        gone = db.execute(
            'DELETE FROM labels WHERE name = ? AND value = ? '
            'AND file IN (SELECT id FROM files WHERE path = ?)',
            (name, value, where)).rowcount
    db.close()
    return gone


def set_sources(where, full, authors, came_from, date):
    """Make a file's sources exactly these: one row per author, each saying where the file came
    from, or one row with no author where only that is said. Every row the file had goes. No
    author and nowhere leaves it with none."""
    db = open_db()
    with db:
        file = file_row(db, where, full)
        db.execute('DELETE FROM sources WHERE file = ?', (file,))
        rows = [(file, author, came_from, date) for author in authors if author] or ([(file, '', came_from, date)] if came_from else [])
        db.executemany('INSERT INTO sources (file, author, came_from, date) VALUES (?, ?, ?, ?)', rows)
    db.close()


def sources_of(where):
    """A file's sources, oldest first: author, where it came from, and date. Nothing for a file
    the db has no row for."""
    db = open_db()
    rows = db.execute(
        'SELECT sources.author, sources.came_from, sources.date FROM sources '
        'JOIN files ON files.id = sources.file WHERE files.path = ? ORDER BY sources.id',
        (where,)).fetchall()
    db.close()
    return [{'author': row['author'], 'came_from': row['came_from'], 'date': row['date']} for row in rows]


def all_sources():
    """Every source on every file, keyed by the file's path from the top of the repo. A file with
    none is left out."""
    db = open_db()
    rows = db.execute(
        'SELECT files.path, sources.author, sources.came_from, sources.date FROM sources '
        'JOIN files ON files.id = sources.file ORDER BY files.path, sources.id').fetchall()
    db.close()
    by_path = {}
    for row in rows:
        by_path.setdefault(row['path'], []).append(
            {'author': row['author'], 'came_from': row['came_from'], 'date': row['date']})
    return by_path


# What a rule can read: the file's name, its location (its path from the top of the repo), or its
# content. And what it can give: a kind or a tag.
READS = ('name', 'location', 'content')
GIVES = ('kind', 'tag')


def add_rule(reads, pattern, name, value):
    """One more rule: what it reads, the regex it matches, and the label it gives. Answers the
    rule's id."""
    if reads not in READS:
        raise ValueError(f'a rule reads one of {READS}, not {reads!r}')
    if name not in GIVES:
        raise ValueError(f'a rule gives one of {GIVES}, not {name!r}')
    db = open_db()
    with db:
        made = db.execute('INSERT INTO rules (reads, pattern, name, value) VALUES (?, ?, ?, ?)',
                          (reads, pattern, name, value)).lastrowid
    db.close()
    return made


def remove_rule(rule_id):
    """One rule gone. Answers how many went."""
    db = open_db()
    with db:
        gone = db.execute('DELETE FROM rules WHERE id = ?', (rule_id,)).rowcount
    db.close()
    return gone


def rules():
    """Every rule, oldest first: its id, what it reads, the regex it matches, and the label it
    gives, name and value."""
    db = open_db()
    rows = db.execute('SELECT id, reads, pattern, name, value FROM rules ORDER BY id').fetchall()
    db.close()
    return [{'id': row['id'], 'reads': row['reads'], 'pattern': row['pattern'], 'name': row['name'], 'value': row['value']} for row in rows]


def set_rule_labels(where, full, kinds, tags):
    """The labels the rules give one file, made exactly these, by rule: every rule row on it goes
    and one row per value comes. Hand rows are never touched. A file with no row gets one only
    when the rules give it something. Answers whether the file has a row."""
    db = open_db()
    with db:
        has_row = db.execute('SELECT id FROM files WHERE path = ?', (where,)).fetchone() is not None
        if has_row or kinds or tags:
            file = file_row(db, where, full)
            _replace(db, file, 'kind', kinds, 'rule')
            _replace(db, file, 'tag', tags, 'rule')
            has_row = True
    db.close()
    return has_row


def clear_rule_labels():
    """Every label a rule gave, on every file, gone. Answers how many rows went."""
    db = open_db()
    with db:
        gone = db.execute("DELETE FROM labels WHERE made_by = 'rule'").rowcount
    db.close()
    return gone


def move_path(where_from, where_to):
    """A file now sits somewhere else, so its row is keyed by the new path and its collection is
    read off it again. Its labels and fields go with it. Answers how many rows moved."""
    db = open_db()
    with db:
        moved = db.execute('UPDATE files SET path = ?, collection = ? WHERE path = ?',
                           (where_to, collection_of(where_to), where_from)).rowcount
    db.close()
    return moved


def delete_path(where):
    """A file is gone from disk, so its row goes, and every label and source on it with it.
    Answers how many rows went."""
    db = open_db()
    with db:
        gone = db.execute('DELETE FROM files WHERE path = ?', (where,)).rowcount
    db.close()
    return gone


def labels_of(where):
    """Every label on a file, oldest first: name, value and who made it. Nothing for a file the
    db has no row for."""
    db = open_db()
    rows = db.execute(
        'SELECT labels.name, labels.value, labels.made_by FROM labels '
        'JOIN files ON files.id = labels.file WHERE files.path = ? ORDER BY labels.id',
        (where,)).fetchall()
    db.close()
    return [{'name': row['name'], 'value': row['value'], 'made_by': row['made_by']} for row in rows]


def all_labels():
    """Every label on every file, in one answer: each file's path from the top of the repo, and
    its labels oldest first. A file with a row and no labels is left out."""
    db = open_db()
    rows = db.execute(
        'SELECT files.path, labels.name, labels.value, labels.made_by FROM labels '
        'JOIN files ON files.id = labels.file ORDER BY files.path, labels.id').fetchall()
    db.close()
    by_path = {}
    for row in rows:
        by_path.setdefault(row['path'], []).append(
            {'name': row['name'], 'value': row['value'], 'made_by': row['made_by']})
    return by_path


def all_fields():
    """Every file's four fields, keyed by its path from the top of the repo: title, description,
    use_when as a list again, and date, with whether the file is missing from the disk. Every
    row, whether or not anything is written on it, so a path here is a file the db holds."""
    db = open_db()
    rows = db.execute('SELECT path, title, description, use_when, date, missing FROM files ORDER BY path').fetchall()
    db.close()
    return {row['path']: {
        'title': row['title'],
        'description': row['description'],
        'use_when': [one.strip() for one in row['use_when'].split(',') if one.strip()],
        'date': row['date'],
        'missing': bool(row['missing']),
    } for row in rows}


def reconcile(root, paths):
    """Bring every row into line with the disk. paths is every listed file on disk right now,
    counting from the top of the repo, and root where the repo sits on this machine.
      same path, new size or time      -> the fingerprint is computed again and the row brought
                                          up to date: changed
      path gone, a file at a path with no row whose bytes give the same fingerprint
                                       -> the row moves to that path, labels and fields with
                                          it: moved
      path gone, no such file          -> the row is marked missing, and kept: missing
      a missing row whose path is back -> the mark comes off: found
    A file at a path with no row and no gone row to match is left alone: it gets a row when
    something is first written on it. Answers the counts."""
    on_disk = set(paths)
    changed = moved = missing = found = 0
    db = open_db()
    with db:
        rows = db.execute('SELECT id, path, size, modified, fingerprint, missing FROM files').fetchall()
        with_rows = {row['path'] for row in rows}
        gone = []
        for row in rows:
            if row['path'] not in on_disk:
                gone.append(row)
                continue
            full = os.path.join(root, row['path'])
            size, modified = os.path.getsize(full), os.path.getmtime(full)
            if size != row['size'] or modified != row['modified']:
                db.execute('UPDATE files SET size = ?, modified = ?, fingerprint = ? WHERE id = ?',
                           (size, modified, fingerprint_of(full), row['id']))
                changed += 1
            if row['missing']:
                db.execute('UPDATE files SET missing = 0 WHERE id = ?', (row['id'],))
                found += 1
        if gone:
            waiting = {}
            for row in gone:
                waiting.setdefault(row['fingerprint'], []).append(row['id'])
            matched = set()
            for where in paths:
                if where in with_rows:
                    continue
                full = os.path.join(root, where)
                same = waiting.get(fingerprint_of(full))
                if not same:
                    continue
                file = same.pop(0)
                db.execute('UPDATE files SET path = ?, collection = ?, size = ?, modified = ?, missing = 0 WHERE id = ?',
                           (where, collection_of(where), os.path.getsize(full), os.path.getmtime(full), file))
                matched.add(file)
                moved += 1
            for row in gone:
                if row['id'] in matched or row['missing']:
                    continue
                db.execute('UPDATE files SET missing = 1 WHERE id = ?', (row['id'],))
                missing += 1
    db.close()
    return {'changed': changed, 'moved': moved, 'missing': missing, 'found': found}


def dump_place():
    """Where the dump sits: beside the db, with the db's name and .sql on the end. The dump
    enters git, the db never does, so the labels live in git through it."""
    return os.path.splitext(PLACE)[0] + '.sql'


def write_dump():
    """Write every table as plain text to the dump's place: the statements that make each
    table and insert each row, sqlite's own words. Answers where it went and how many labels
    it holds."""
    db = open_db()
    lines = list(db.iterdump())
    labels = db.execute('SELECT count(*) FROM labels').fetchone()[0]
    db.close()
    with open(dump_place(), 'w') as f:
        f.write('\n'.join(lines) + '\n')
    return {'dump': dump_place(), 'statements': len(lines), 'labels': labels}


def restore(into):
    """A new db made from the dump: the file named is made beside the db and nowhere else, a
    name carrying a folder is refused, and so is the live db's own name, whatever the ask says.
    The dump's statements are run on the empty file, so it holds every table and row the live
    db held when the dump was written. Answers where it went and how many labels it holds."""
    if not into.endswith('.db') or os.path.basename(into) != into:
        raise ValueError('name a .db file with no folder in the name')
    target = os.path.join(os.path.dirname(PLACE), into)
    if os.path.abspath(target) == os.path.abspath(PLACE):
        raise ValueError('the live db is never written over')
    if not os.path.isfile(dump_place()):
        raise ValueError('no dump to read: ask /dump first')
    with open(dump_place()) as f:
        text = f.read()
    if os.path.exists(target):
        os.remove(target)
    new = sqlite3.connect(target)
    new.executescript(text)
    new.commit()
    labels = new.execute('SELECT count(*) FROM labels').fetchone()[0]
    new.close()
    return {'restored': target, 'labels': labels}
