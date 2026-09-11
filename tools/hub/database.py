#!/usr/bin/env python3
"""
The db: one SQLite file beside the dispatcher, holding what ov knows about its files that the
files themselves do not say. Only the dispatcher reads and writes it, through the calls here.

Four tables, as memory/ov/zone/knowledge bases.md lays them out:
  files   -- one row per file: its collection, its path from the top of the repo, its size,
             when it was last changed, and its fingerprint, a short code computed from its
             bytes (same bytes, same code)
  labels  -- one row per kind or tag on a file: the file, the name (kind or tag), the value,
             and who made it: hand, rule or ai
  sources -- one row per author or origin of a file: the file, the author, where it came from
             (a url or a person), and the date
  rules   -- one row per rule that gives a label: what it reads (name, location or content),
             the pattern it matches, and the label it gives (name and value)

Labels are written and read here. The other two tables wait for their phases. A file's row is
made the first time a label is written on it, from what is on disk then, and brought up to date
with the disk on every write after.
"""

import hashlib
import os
import sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Where the db sits. A test points this at a file of its own before asking anything.
PLACE = os.path.join(SCRIPT_DIR, 'ov.db')

MADE_BY = ('hand', 'rule', 'ai')

TABLES = """
CREATE TABLE IF NOT EXISTS files (
    id          INTEGER PRIMARY KEY,
    collection  TEXT NOT NULL,
    path        TEXT NOT NULL UNIQUE,
    size        INTEGER NOT NULL,
    modified    REAL NOT NULL,
    fingerprint TEXT NOT NULL
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
    """Open the db, making the file and its tables the first time. A row pointing at a file
    goes when the file's row goes, which sqlite only honors when asked on every open."""
    db = sqlite3.connect(PLACE)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys = ON')
    db.executescript(TABLES)
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
    date with the disk when there is."""
    db.execute(
        'INSERT INTO files (collection, path, size, modified, fingerprint) VALUES (?, ?, ?, ?, ?) '
        'ON CONFLICT(path) DO UPDATE SET size = excluded.size, modified = excluded.modified, '
        'fingerprint = excluded.fingerprint',
        (collection_of(where), where, os.path.getsize(full), os.path.getmtime(full), fingerprint_of(full)))
    return db.execute('SELECT id FROM files WHERE path = ?', (where,)).fetchone()['id']


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


def _replace(db, file, name, values, made_by):
    """Every row of one name and one maker on a file goes, and one row per value comes."""
    db.execute('DELETE FROM labels WHERE file = ? AND name = ? AND made_by = ?', (file, name, made_by))
    db.executemany('INSERT OR IGNORE INTO labels (file, name, value, made_by) VALUES (?, ?, ?, ?)',
                   [(file, name, value, made_by) for value in values])


def replace_labels(where, full, name, values, made_by='hand'):
    """Make one name's labels on a file, by one maker, exactly these values. The kind is one
    value, the tags are many, and none at all takes them all off. Other makers' rows stay."""
    if made_by not in MADE_BY:
        raise ValueError(f'made_by must be one of {MADE_BY}, not {made_by!r}')
    db = open_db()
    with db:
        _replace(db, file_row(db, where, full), name, values, made_by)
    db.close()


def record_file(where, full, kind, tags):
    """What a file's own label block says, written on one open of the db: its hand kind made the
    one named, its hand tags made those named. None for either leaves that name's rows as they
    are, so a file that says nothing keeps what the db holds."""
    db = open_db()
    with db:
        file = file_row(db, where, full)
        if kind is not None:
            _replace(db, file, 'kind', [kind] if kind else [], 'hand')
        if tags is not None:
            _replace(db, file, 'tag', tags, 'hand')
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
