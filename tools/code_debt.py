#!/usr/bin/env python3
"""Writes memory/shared/zone/code debt.md: one line per memory file that holds unfinished
work, across every project. Eight patterns, one verb each, no judgment anywhere.

    python3 tools/code_debt.py [memory_root] [out_file]

Both arguments default to this repo's memory folder and shared/zone/code debt.md.
Prints the number of lines written."""
import datetime
import os
import re
import sys
from urllib.parse import quote

HERE = os.path.dirname(os.path.abspath(__file__))
MEMORY = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'memory')
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(MEMORY, 'shared', 'zone', 'code debt.md')
# A logs folder is walked: since 13 September 2026 it holds the project's log.md beside the app's own
# logs, which are not markdown and are passed over by their names.
SKIP_FOLDERS = {'archive', 'done', 'node_modules'}


def plural(n, one, many):
    return f'{n} {one if n == 1 else many}'


def clauses_for(path, name, in_truth, text):
    """Every clause one file earns, from the patterns that hit it."""
    lines = text.split('\n')
    found = []
    unchecked = sum(1 for l in lines if re.match(r'^\s*- \[ \]', l))
    if unchecked:
        if in_truth:
            found.append(plural(unchecked, 'open truth', 'open truths'))
        else:
            found.append(f'{unchecked} open')
    if name == 'proposals.md':
        sections = re.split(r'^## ', text, flags=re.M)[1:]
        open_props = sum(1 for s in sections if 'Decided' not in s and 'culled' not in s.lower())
        if open_props:
            found.append(f'decide {plural(open_props, "proposal", "proposals")}')
    if name == 'questions.md':
        asked = sum(1 for l in lines if re.match(r'^\s*- ', l))
        if asked:
            found.append(f'answer {plural(asked, "question", "questions")}')
    if name == 'log.md':
        # After the marker, before any rule. An S: line is the settle's own record, and a D: line
        # is already home, written with the truth it names. Neither is work.
        at = text.find('<!-- consolidated')
        tail = text[at:] if at >= 0 else text
        rule = tail.find('\n---')
        if rule >= 0:
            tail = tail[:rule]
        entries = sum(1 for l in tail.split('\n') if l.startswith('- ') and not l.startswith('- S:') and not l.startswith('- D:'))
        if entries:
            found.append(f'settle {plural(entries, "line", "lines")}')
    if name == 'collisions.md':
        entries = sum(1 for l in lines if l.startswith('## '))
        if entries:
            found.append(f'rewrite {plural(entries, "collision", "collisions")}')
    if name == 'drive.md':
        found.append('dissolve the drive')
    return found


def walk(memory):
    """Every (project, letter, relative path, clauses) with at least one clause."""
    out = []
    for project in sorted(os.listdir(memory)):
        root = os.path.join(memory, project)
        if not os.path.isdir(root) or project.startswith('.'):
            continue
        for folder, subfolders, files in os.walk(root):
            subfolders[:] = sorted(s for s in subfolders if s not in SKIP_FOLDERS and not s.startswith('.'))
            for name in sorted(files):
                if not name.endswith('.md') or name == 'code debt.md':
                    continue
                path = os.path.join(folder, name)
                relative = os.path.relpath(path, root)
                top = relative.split(os.sep)[0]
                letter = {'zone': 'z', 'truth': 't'}.get(top)
                # The log sits in the logs folder, shown by its own name and no letter.
                shown = relative.split(os.sep, 1)[1] if letter or top == 'logs' else relative
                with open(path, encoding='utf-8') as f:
                    text = f.read()
                clauses = clauses_for(path, name, letter == 't', text)
                if clauses:
                    out.append((project, letter, shown, relative, clauses))
    return out


def main():
    rows = walk(os.path.abspath(MEMORY))
    today = datetime.date.today().isoformat()
    # How many items each project's needs-this column names: the numbers in its clauses added
    # up, a clause with no number, "dissolve the drive", counting one. The H1 carries every
    # project's added up, since 15 September 2026.
    quantity = {}
    for project, _letter, _shown, _relative, clauses in rows:
        for clause in clauses:
            numbers = [int(n) for n in re.findall(r'\d+', clause)]
            quantity[project] = quantity.get(project, 0) + (sum(numbers) if numbers else 1)
    lines = [f'# Code debt ({sum(quantity.values())})', '',
             f'{len(rows)} files hold unfinished work, as of {today}.']
    # One table per project, its heading carrying the quantity. The file is a link, relative to
    # where code debt.md sits, memory/shared/zone/ unless told otherwise. A root file's z/t cell is empty.
    up = os.path.relpath(os.path.abspath(MEMORY), os.path.dirname(os.path.abspath(OUT)))
    current = None
    for project, letter, shown, relative, clauses in rows:
        if project != current:
            current = project
            lines += ['', f'## {project} ({quantity[project]})', '', '| z/t | file | needs this |', '| --- | --- | --- |']
        href = quote(f'{up}/{project}/{relative}')
        lines.append(f'| {letter or ""} | [{shown}]({href}) | ' + ' and '.join(clauses) + ' |')
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    record_labels(OUT, today)
    print(len(rows))


def record_labels(out, today):
    """The file's labels go into the db beside the dispatcher, through the dispatcher's own
    module, rather than into the file: since 10 September 2026 a file's kind, tags, title,
    description and date live there and the file carries no block. Only for the real file
    inside the repo. A test writing somewhere else records nothing."""
    repo = os.path.realpath(os.path.join(HERE, '..'))
    full = os.path.realpath(out)
    if not full.startswith(repo + os.sep):
        return
    sys.path.insert(0, os.path.join(HERE, 'hub'))
    import database
    database.record_file(os.path.relpath(full, repo), full, 'analyze', ['now'], title='Code debt',
                         description='One line per memory file holding unfinished work, across every project. '
                                     'Written by tools/code_debt.py, edit nothing here by hand.',
                         date=today)


if __name__ == '__main__':
    main()
