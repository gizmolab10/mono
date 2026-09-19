"""
ai's plugin: the code the dispatcher imports and runs for the ai host, and for ov, which shares
ov's db with ai until ov is retired. The specialty's name, three of the four functions every
plugin has, and ai's own four, read, save, scan and strip, the plugin api table in
memory/ov/zone/music and ai.md saying what each takes and answers. The listing rule is ov's,
moved here whole from the dispatcher at step 6 of the plan, and the reading and writing of a
file and of its label block at step 8.
"""
import os
import re

# The specialty's name, written on the collections rows the look makes.
SPECIALTY = 'ai'

# The folders inside a work folder whose notes are listed, beside the notes standing at that
# folder's own top. Every other folder there holds work of a kind nothing links to.
WORK_FOLDERS = ('next', 'milestones', 'now', 'soon', 'done', 'proposals')

# Every project whose CLAUDE file and work notes are listed: the memory folder under memory, and
# the folder at the repo's top, of each. The empty name is the repo's own top, whose CLAUDE file
# and work notes are shared's.
PROJECTS = ('', 'core', 'memory', 'panel', 'gallery', 'ai', 'di', 'ji', 'kb', 'lv', 'me', 'mj', 'mu', 'ov', 'ws')

# The endings a listed file may have: markdown, and svg since 18 September 2026, a drawing the
# page shows as it is and labels howto and journal when it is opened.
LISTED_ENDINGS = ('.md', '.svg')


def listed_files(root):
    """Every file the ai host lists under the root, the repo: each file's path counting from the
    root, sorted. Index files are left in, since the page decides what to skip. A project's work
    folder gives up what sits at its very top and what sits one folder down inside WORK_FOLDERS,
    the notes a guide links to. A project's CLAUDE file sits at its top, spelled CLAUDE.MD or
    CLAUDE.md. Every markdown and svg file in the memory system is listed, however deep, except a
    project's zone/work, which the work walk has already listed, depth-limited."""
    found = []
    for project in PROJECTS:
        work = os.path.join(root, 'memory', project or 'shared', 'zone', 'work')
        if os.path.isdir(work):
            for one in sorted(os.listdir(work)):
                whole = os.path.join(work, one)
                if one.lower().endswith(LISTED_ENDINGS) and os.path.isfile(whole):
                    found.append(os.path.relpath(whole, root))
                elif os.path.isdir(whole) and one.lower() in WORK_FOLDERS:
                    for deeper in sorted(os.listdir(whole)):
                        inside_one = os.path.join(whole, deeper)
                        if deeper.lower().endswith(LISTED_ENDINGS) and os.path.isfile(inside_one):
                            found.append(os.path.relpath(inside_one, root))
        top_dir = os.path.join(root, project) if project else root
        if os.path.isdir(top_dir):
            for one in sorted(os.listdir(top_dir)):
                if one.lower() == 'claude.md' and os.path.isfile(os.path.join(top_dir, one)):
                    found.append(os.path.relpath(os.path.join(top_dir, one), root))
    memory = os.path.join(root, 'memory')
    if os.path.isdir(memory):
        for here, folders, files in os.walk(memory):
            folders[:] = [f for f in folders if not f.startswith('.')]
            if os.path.basename(here) == 'zone' and os.path.dirname(os.path.dirname(here)) == memory:
                folders[:] = [f for f in folders if f != 'work']
            for one in files:
                if one.lower().endswith(LISTED_ENDINGS):
                    found.append(os.path.relpath(os.path.join(here, one), root))
    found.sort()
    return found


def is_listed(root, where):
    """Whether the ai host lists this path, counting from the root, so the dispatcher may read the
    file's words and write them back: the listing rule said of one path. A project's CLAUDE file
    at the repo's top or a project's; a work note at the very top of a zone/work folder or one
    folder down inside WORK_FOLDERS; every other markdown or svg file in the memory system at any
    depth."""
    if not where.lower().endswith(LISTED_ENDINGS):
        return False
    parts = where.split('/')
    if parts[-1].lower() == 'claude.md':
        return len(parts) == 1 or (len(parts) == 2 and parts[0] in PROJECTS)
    if not where.startswith('memory/'):
        return False
    at = where.find('/zone/work/')
    if at < 0:
        return True
    tail = where[at + len('/zone/work/'):].split('/')
    if len(tail) == 1:
        return True
    return len(tail) == 2 and tail[0].lower() in WORK_FOLDERS


def labels(root, where):
    """The labels ai's plugin gives a file, each a name and a value, written as rule rows: none
    until step 14 of the plan, when the links a file holds come here."""
    return []


# --- ai's own four: a markdown file's words, and its label block -----------------------------------

def label_block(text):
    """The lines between the first row of three dashes and the next, and which line the closing
    dashes stand on. Nothing, and -1, for a file with no block."""
    lines = text.split('\n')
    if not lines or lines[0].strip() != '---':
        return [], -1
    for at in range(1, len(lines)):
        if lines[at].strip() == '---':
            return lines[1:at], at
    return [], -1

# The lines a label block can carry and the db has a place for. type and updated are the older
# spellings of kind and date, read as those where the newer line is not there.
KNOWN_KEYS = ('kind', 'title', 'description', 'tags', 'use_when', 'date', 'type', 'updated')

def _names_below(block, at):
    """The names written one to a line under a bare label, each beginning with a dash."""
    named = []
    for below in block[at + 1:]:
        if not re.match(r'^\s+-\s', below):
            break
        name = re.sub(r'^\s+-\s*', '', below).strip()
        if name:
            named.append(name)
    return named

def _list_after(block, at, line, key):
    """A list label's values, in either shape: `[a, b]` on the one line, which the overview app
    wrote, or one name to a line under the bare label, which Obsidian writes."""
    inside = line[len(key) + 1:].strip()
    if inside.startswith('['):
        return [one.strip() for one in inside.strip('[]').split(',') if one.strip()]
    return _names_below(block, at)

def _value_after(line, key):
    """One label's value, the surrounding quote marks taken off."""
    value = line[len(key) + 1:].strip()
    if len(value) > 1 and value[0] == value[-1] and value[0] in '"\'':
        value = value[1:-1]
    return value

def labels_in_text(text):
    """What a file's own label block says: kind, tags, title, description, use_when and date,
    each None where the block has no such line, and unknown, the keys the block carries that the
    db has no place for. A `type` line is read as the kind and an `updated` line as the date
    where the newer line is missing."""
    block, _ = label_block(text)
    said = {'kind': None, 'tags': None, 'title': None, 'description': None, 'use_when': None, 'date': None, 'unknown': []}
    older = {'type': None, 'updated': None}
    for at, line in enumerate(block):
        key = line.split(':', 1)[0] if ':' in line and not line.startswith((' ', '\t')) else ''
        if key in ('kind', 'title', 'description', 'date'):
            said[key] = _value_after(line, key)
        elif key in ('tags', 'use_when'):
            said[key] = _list_after(block, at, line, key)
        elif key in older:
            older[key] = _value_after(line, key)
        elif key and key not in KNOWN_KEYS:
            said['unknown'].append(key)
    if said['kind'] is None and older['type'] is not None:
        said['kind'] = older['type']
    if said['date'] is None and older['updated'] is not None:
        said['date'] = older['updated']
    return said

def without_block(text):
    """The file's text with its whole label block taken off the top, and the one blank line after
    it, where there is one. Every other line stays exactly as it is, and a file with no block
    comes back untouched."""
    block, ends_at = label_block(text)
    if ends_at < 0:
        return text
    rest = text.split('\n')[ends_at + 1:]
    if rest and rest[0].strip() == '':
        rest = rest[1:]
    return '\n'.join(rest)


def read(root, where):
    """One file's words, the file named by its path counting from the root. The dispatcher has
    already refused a path the listing rule does not list, one outside the root, and one with no
    file at it."""
    with open(os.path.join(root, where), 'r') as f:
        return f.read()


def save(root, where, text, as_opened):
    """Write one file's whole text, given the text as it was when the file was opened. A file that
    is not there yet can be made, but only when the page says it saw nothing there, and only
    where its folder is. Otherwise the file on disk has to still read exactly as the page last
    saw it, or nothing is written. Answers whether it was written, with how many characters, and
    if not, why."""
    full = os.path.join(root, where)
    if not os.path.isfile(full):
        if as_opened != '':
            return {'ok': False, 'why': 'no such file'}
        if not os.path.isdir(os.path.dirname(full)):
            return {'ok': False, 'why': 'no such folder'}
    else:
        with open(full, 'r') as f:
            on_disk = f.read()
        if on_disk != as_opened:
            return {'ok': False, 'why': 'the file changed since it was opened'}
    with open(full, 'w') as f:
        f.write(text)
    return {'ok': True, 'wrote': len(text)}


def scan(root, where):
    """What one file's own label block says, as labels_in_text reads it. Raises where the file
    cannot be read, which the dispatcher counts as unreadable."""
    with open(os.path.join(root, where), 'r') as f:
        return labels_in_text(f.read())


def strip(root, where):
    """Take one file's whole label block off its top, rewriting the file. A file whose block carries
    a line the db has no place for is passed over and its unknown lines named, so nothing is lost.
    Answers what was done: changed, untouched, or kept, with the unknown lines. Raises where the
    file cannot be read."""
    full = os.path.join(root, where)
    with open(full, 'r') as f:
        text = f.read()
    unknown = labels_in_text(text)['unknown']
    if unknown:
        return {'did': 'kept', 'unknown': unknown}
    stripped = without_block(text)
    if stripped == text:
        return {'did': 'untouched', 'unknown': []}
    with open(full, 'w') as f:
        f.write(stripped)
    return {'did': 'changed', 'unknown': []}
