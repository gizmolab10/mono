#!/usr/bin/env python3
"""Writes memory/shared/logs/finished.md: one line per memory file that holds finished work,
across every project. Two patterns, one verb each, no judgment anywhere. A twin of
code_debt.py, decided 15 September 2026.

    python3 tools/finished.py [memory_root] [out_file]

Both arguments default to this repo's memory folder and shared/logs/finished.md.
Prints the number of lines written."""
import datetime
import os
import re
import sys
from urllib.parse import quote

HERE = os.path.dirname(os.path.abspath(__file__))
MEMORY = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'memory')
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(MEMORY, 'shared', 'logs', 'finished.md')
# Finished work sits in done folders, so they are walked; code debt skips them.
SKIP_FOLDERS = {'archive', 'node_modules'}


def plural(n, one, many):
    return f'{n} {one if n == 1 else many}'


def clauses_for(name, text, in_logs):
    """Every clause one file earns, from the patterns that hit it. No box inside a logs folder is
    counted: the journal there is where finished items end up, and a done file moved there holds
    its boxes as a record. Nor is a decided pac: logs/decisions.md is the rationale's home, and the
    process leaves it alone. Nor is a box in learn.md: a ticked one is a correction waiting for
    record's hand, not finished work."""
    lines = text.split('\n')
    found = []
    checked = 0 if in_logs or name == 'learn.md' else sum(1 for l in lines if re.match(r'^\s*- \[x\]', l, flags=re.I))
    if checked:
        found.append(f'{checked} done')
    if name == 'proposals.md':
        sections = re.split(r'^## ', text, flags=re.M)[1:]
        settled = sum(1 for s in sections if 'Decided' in s or 'culled' in s.lower())
        if settled:
            found.append(f'{plural(settled, "proposal", "proposals")} settled')
    return found


def walk(memory, out):
    """Every (project, letter, shown path, relative path, clauses) with at least one clause."""
    rows = []
    for project in sorted(os.listdir(memory)):
        root = os.path.join(memory, project)
        if not os.path.isdir(root) or project.startswith('.'):
            continue
        for folder, subfolders, files in os.walk(root):
            subfolders[:] = sorted(s for s in subfolders if s not in SKIP_FOLDERS and not s.startswith('.'))
            for name in sorted(files):
                path = os.path.join(folder, name)
                if not name.endswith('.md') or os.path.realpath(path) == os.path.realpath(out):
                    continue
                relative = os.path.relpath(path, root)
                top = relative.split(os.sep)[0]
                letter = {'zone': 'z', 'truth': 't'}.get(top)
                # The log sits in the logs folder, shown by its own name and no letter.
                shown = relative.split(os.sep, 1)[1] if letter or top == 'logs' else relative
                with open(path, encoding='utf-8') as f:
                    text = f.read()
                clauses = clauses_for(name, text, top == 'logs')
                if clauses:
                    rows.append((project, letter, shown, relative, clauses))
    return rows


def main():
    rows = walk(os.path.abspath(MEMORY), os.path.abspath(OUT))
    today = datetime.date.today().isoformat()
    # How many items each project's finished column names: the numbers in its clauses added up.
    # The H1 carries every project's added up.
    quantity = {}
    for project, _letter, _shown, _relative, clauses in rows:
        for clause in clauses:
            quantity[project] = quantity.get(project, 0) + sum(int(n) for n in re.findall(r'\d+', clause))
    lines = [f'# Finished ({sum(quantity.values())})', '',
             f'{len(rows)} files hold finished work, as of {today}.']
    # One table per project, its heading carrying the quantity. The file is a link, relative to
    # where finished.md sits, memory/shared/logs/ unless told otherwise. A root file's z/t cell is empty.
    up = os.path.relpath(os.path.abspath(MEMORY), os.path.dirname(os.path.abspath(OUT)))
    current = None
    for project, letter, shown, relative, clauses in rows:
        if project != current:
            current = project
            lines += ['', f'## {project} ({quantity[project]})', '', '| z/t | file | finished |', '| --- | --- | --- |']
        href = quote(f'{up}/{project}/{relative}')
        lines.append(f'| {letter or ""} | [{shown}]({href}) | ' + ' and '.join(clauses) + ' |')
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    record_labels(OUT, today)
    print(len(rows))


def record_labels(out, today):
    """The file's labels go into the db beside the dispatcher, through the dispatcher's own
    module, rather than into the file. Only for the real file inside the repo. A test writing
    somewhere else records nothing."""
    repo = os.path.realpath(os.path.join(HERE, '..'))
    full = os.path.realpath(out)
    if not full.startswith(repo + os.sep):
        return
    sys.path.insert(0, os.path.join(HERE, 'hub'))
    import database
    database.record_file(os.path.relpath(full, repo), full, 'analyze', ['now'], title='Finished',
                         description='One line per memory file holding finished work, across every project. '
                                     'Written by tools/finished.py, edit nothing here by hand.',
                         date=today)


if __name__ == '__main__':
    main()
