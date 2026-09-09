#!/usr/bin/env python3
"""Writes memory/shared/zone/big picture.md: one line per memory file that holds unfinished
work, across every project. Eight patterns, one verb each, no judgment anywhere.

    python3 tools/big-picture.py [memory_root] [out_file]

Both arguments default to this repo's memory folder and shared/zone/big picture.md.
Prints the number of lines written."""
import datetime
import os
import re
import sys
from urllib.parse import quote

HERE = os.path.dirname(os.path.abspath(__file__))
MEMORY = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'memory')
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(MEMORY, 'shared', 'zone', 'big picture.md')
SKIP_FOLDERS = {'archive', 'done', 'logs', 'node_modules'}


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
    if name == 'decisions.md':
        at = text.find('## Evaluations')
        pacs = [l for l in text[at:].split('\n') if l.startswith('- ')] if at >= 0 else []
        open_pacs = sum(1 for l in pacs if 'Decided' not in l)
        if open_pacs:
            found.append(f'decide {plural(open_pacs, "pac", "pacs")}')
    if name == 'proposals.md':
        sections = re.split(r'^## ', text, flags=re.M)[1:]
        open_props = sum(1 for s in sections if 'Decided' not in s and 'dead' not in s.lower())
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
    if name == 'learn.md':
        raw = sum(1 for l in lines if re.match(r'^- \d+\.', l))
        if raw:
            found.append(f'distill {plural(raw, "entry", "entries")}')
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
                if not name.endswith('.md') or name == 'big picture.md':
                    continue
                path = os.path.join(folder, name)
                relative = os.path.relpath(path, root)
                top = relative.split(os.sep)[0]
                letter = {'zone': 'z', 'truth': 't'}.get(top)
                shown = relative.split(os.sep, 1)[1] if letter else relative
                with open(path, encoding='utf-8') as f:
                    text = f.read()
                clauses = clauses_for(path, name, letter == 't', text)
                if clauses:
                    out.append((project, letter, shown, relative, clauses))
    return out


def main():
    rows = walk(os.path.abspath(MEMORY))
    today = datetime.date.today().isoformat()
    lines = ['---', 'kind: analyze', 'title: "Big picture"',
             'description: "One line per memory file holding unfinished work, across every project. Written by tools/big-picture.py; edit nothing here by hand."',
             'tags: [now]', f'date: {today}', '---', '# Big picture', '',
             f'{len(rows)} files hold unfinished work, as of {today}.']
    # One table per project. The file is a link, relative to where big picture.md sits:
    # memory/shared/zone/. A root file's z/t cell is empty.
    current = None
    for project, letter, shown, relative, clauses in rows:
        if project != current:
            current = project
            lines += ['', f'## {project}', '', '| z/t | file | verb |', '| --- | --- | --- |']
        href = quote(f'../../{project}/{relative}')
        lines.append(f'| {letter or ""} | [{shown}]({href}) | ' + ' and '.join(clauses) + ' |')
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    print(len(rows))


if __name__ == '__main__':
    main()
