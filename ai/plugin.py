"""
ai's plugin: the code the dispatcher imports and runs for the ai host, and for ov, which shares
ov's db with ai until ov is retired. The specialty's name and three of the four functions every
plugin has, the plugin api table in memory/ov/zone/music and ai.md saying what each takes and
answers. The listing rule is ov's, moved here whole from the dispatcher at step 6 of the plan.
"""
import os

# The specialty's name, written on the collections rows the look makes.
SPECIALTY = 'ai'

# The folders inside a work folder whose notes are listed, beside the notes standing at that
# folder's own top. Every other folder there holds work of a kind nothing links to.
WORK_FOLDERS = ('next', 'milestones', 'now', 'soon', 'done', 'proposals')

# Every project whose CLAUDE file and work notes are listed: the memory folder under memory, and
# the folder at the repo's top, of each. The empty name is the repo's own top, whose CLAUDE file
# and work notes are shared's.
PROJECTS = ('', 'core', 'memory', 'panel', 'gallery', 'ai', 'di', 'ji', 'kb', 'lv', 'me', 'mj', 'mu', 'ov', 'ws')


def listed_files(root):
    """Every file the ai host lists under the root, the repo: each file's path counting from the
    root, sorted. Index files are left in, since the page decides what to skip. A project's work
    folder gives up what sits at its very top and what sits one folder down inside WORK_FOLDERS,
    the notes a guide links to. A project's CLAUDE file sits at its top, spelled CLAUDE.MD or
    CLAUDE.md. Every markdown file in the memory system is listed, however deep, except a
    project's zone/work, which the work walk has already listed, depth-limited."""
    found = []
    for project in PROJECTS:
        work = os.path.join(root, 'memory', project or 'shared', 'zone', 'work')
        if os.path.isdir(work):
            for one in sorted(os.listdir(work)):
                whole = os.path.join(work, one)
                if one.endswith('.md') and os.path.isfile(whole):
                    found.append(os.path.relpath(whole, root))
                elif os.path.isdir(whole) and one.lower() in WORK_FOLDERS:
                    for deeper in sorted(os.listdir(whole)):
                        inside_one = os.path.join(whole, deeper)
                        if deeper.endswith('.md') and os.path.isfile(inside_one):
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
                if one.endswith('.md'):
                    found.append(os.path.relpath(os.path.join(here, one), root))
    found.sort()
    return found


def is_listed(root, where):
    """Whether the ai host lists this path, counting from the root, so the dispatcher may read the
    file's words and write them back: the listing rule said of one path. A project's CLAUDE file
    at the repo's top or a project's; a work note at the very top of a zone/work folder or one
    folder down inside WORK_FOLDERS; every other markdown file in the memory system at any depth."""
    if not where.lower().endswith('.md'):
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
