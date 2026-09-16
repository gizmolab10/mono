#!/usr/bin/env python3
"""Moves one project's finished work into its work journal, the ultimate target for finished
items, decided 15 September 2026.

    python3 tools/process_finished.py <project> [memory_root] [finished_file]

Every checked box in the project's memory files, with the lines indented under it, becomes part
of one journal entry per file and leaves the file. Every settled proposal section, one with
"Decided" or "dead" in it, does the same. Every file in a done folder moves whole to the project's
logs folder, index.md files staying where they are, and the links it holds or that name it are
re-pointed. The logs folder itself is never read for boxes: it holds records. finished.md is
written again at the end. Prints what moved."""
import datetime
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.realpath(os.path.join(HERE, '..'))
PROJECT = sys.argv[1] if len(sys.argv) > 1 else ''
# Real paths throughout, so a folder reached through a link, as macOS's temp folder is, matches itself.
MEMORY = os.path.realpath(sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, '..', 'memory'))
FINISHED = os.path.realpath(sys.argv[3] if len(sys.argv) > 3 else os.path.join(MEMORY, 'shared', 'zone', 'finished.md'))
SKIP_FOLDERS = {'archive', 'node_modules'}
JOURNAL = 'work journal.md'
BOX = re.compile(r'^(\s*)- \[x\]', re.I)
LINK = re.compile(r'\]\(([^)]+)\)')
TODAY = datetime.date.today().isoformat()


def indent(line):
    return len(line) - len(line.lstrip(' \t'))


def take_checked(text):
    """The text without its checked boxes, and the boxes taken: each with the lines indented
    under it, a blank line inside counted only when a deeper line follows it."""
    lines = text.split('\n')
    kept, blocks, i = [], [], 0
    while i < len(lines):
        line = lines[i]
        if not BOX.match(line):
            kept.append(line)
            i += 1
            continue
        depth = indent(line)
        block = [line]
        i += 1
        while i < len(lines):
            if lines[i].strip() == '':
                j = i + 1
                while j < len(lines) and lines[j].strip() == '':
                    j += 1
                if j < len(lines) and indent(lines[j]) > depth:
                    block.extend(lines[i:j])
                    i = j
                    continue
                break
            if indent(lines[i]) > depth:
                block.append(lines[i])
                i += 1
            else:
                break
        blocks.append(block)
    text = re.sub(r'\n{3,}', '\n\n', '\n'.join(kept))
    return (text.rstrip('\n') + '\n' if text.strip() else text), blocks


def take_settled(text):
    """The text of proposals.md without its settled sections, and those sections."""
    parts = re.split(r'(?m)^(?=## )', text)
    head, sections = parts[0], parts[1:]
    settled = [s for s in sections if 'Decided' in s or 'dead' in s.lower()]
    kept = [s for s in sections if s not in settled]
    return head + ''.join(kept), settled


def journal_add(path, entry):
    """A new entry goes first, after whatever the journal opens with and before its first
    heading. A journal that does not exist yet is made."""
    if os.path.exists(path):
        with open(path, encoding='utf-8') as f:
            text = f.read()
    else:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        text = "# Work Journal\n\nWhat's been finished, newest first.\n\n"
    at = text.find('\n## ')
    if at < 0:
        text = text.rstrip('\n') + '\n\n' + entry
    else:
        text = text[:at + 1] + entry + text[at + 1:]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)


def dispatcher_move(full_from, full_to):
    """A file with a row moves through the dispatcher so the row follows. Answers whether it did;
    a refusal, or a file outside the repo, answers no and the caller renames it itself."""
    if not (full_from.startswith(REPO + os.sep) and full_to.startswith(REPO + os.sep)):
        return False
    url = 'http://localhost:5171/move-guide?' + urllib.parse.urlencode(
        {'from': os.path.relpath(full_from, REPO), 'to': os.path.relpath(full_to, REPO), 'host': 'ai'})
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=b'', method='POST'), timeout=20) as r:
            return bool(json.loads(r.read()).get('success'))
    except Exception:
        return False


def repoint(moves):
    """Every link in the memory folder that named a moved file at its old place, and every link
    inside a moved file that resolved from its old place, is written again for the new place."""
    changed = 0
    reverse = {new: old for old, new in moves.items()}
    for folder, subfolders, files in os.walk(MEMORY):
        subfolders[:] = [s for s in subfolders if s not in SKIP_FOLDERS and not s.startswith('.')]
        for name in files:
            if not name.endswith('.md'):
                continue
            path = os.path.join(folder, name)
            here = os.path.dirname(path)
            old_dir = os.path.dirname(reverse.get(path, path))
            with open(path, encoding='utf-8') as f:
                text = f.read()

            def fix(m):
                nonlocal changed
                t = m.group(1)
                if t.startswith(('http', 'mailto', 'obsidian', '#')) or '://' in t:
                    return m.group(0)
                base, sep, frag = t.partition('#')
                dec = urllib.parse.unquote(base)
                if not dec:
                    return m.group(0)
                resolved = os.path.normpath(os.path.join(here, dec))
                if os.path.exists(resolved):
                    return m.group(0)
                target = None
                if resolved in moves:
                    target = moves[resolved]
                elif old_dir != here:
                    from_old = os.path.normpath(os.path.join(old_dir, dec))
                    target = moves.get(from_old, from_old if os.path.exists(from_old) else None)
                if target is None:
                    return m.group(0)
                changed += 1
                return '](' + os.path.relpath(target, here).replace(' ', '%20') + sep + frag + ')'

            text2 = LINK.sub(fix, text)
            if text2 != text:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(text2)
    return changed


def log_line(root, line):
    path = os.path.join(root, 'logs', 'log.md')
    heading = f'## {datetime.date.today().strftime("%-d %B %Y")}\n'
    if os.path.exists(path):
        with open(path, encoding='utf-8') as f:
            text = f.read()
    else:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        text = f'# {PROJECT} log\n\n'
    if heading in text:
        at = text.index(heading) + len(heading)
        rest = text[at:]
        lead = '\n' if rest.startswith('\n') else ''
        text = text[:at] + lead + line + '\n' + rest[len(lead):]
    else:
        marker = re.search(r'<!-- consolidated:[^\n]*-->\n', text)
        at = marker.end() if marker else text.find('\n') + 1
        text = text[:at] + '\n' + heading + '\n' + line + '\n' + text[at:]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)


def main():
    if not PROJECT or not os.path.isdir(os.path.join(MEMORY, PROJECT)):
        sys.exit(f'no such project under {MEMORY}: {PROJECT!r}')
    root = os.path.join(MEMORY, PROJECT)
    journal = os.path.join(root, 'logs', JOURNAL)
    items = files_with_items = proposals = 0
    # 1. The checked boxes, outside logs and done folders, the journal and finished.md left out.
    for folder, subfolders, files in os.walk(root):
        subfolders[:] = sorted(s for s in subfolders if s not in SKIP_FOLDERS and s != 'done' and not s.startswith('.')
                               and not (folder == root and s == 'logs'))
        for name in sorted(files):
            path = os.path.join(folder, name)
            if not name.endswith('.md') or os.path.realpath(path) == os.path.realpath(FINISHED):
                continue
            with open(path, encoding='utf-8') as f:
                text = f.read()
            kept, blocks = take_checked(text)
            if not blocks:
                continue
            shown = os.path.relpath(path, root)
            entry = f'## {TODAY} — {shown}: {len(blocks)} done\n\n' + '\n'.join(l for b in blocks for l in b) + '\n\n'
            journal_add(journal, entry)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(kept)
            items += len(blocks)
            files_with_items += 1
    # 2. The settled proposals.
    for folder, subfolders, files in os.walk(root):
        subfolders[:] = [s for s in subfolders if s not in SKIP_FOLDERS and not s.startswith('.')]
        if 'proposals.md' in files:
            path = os.path.join(folder, 'proposals.md')
            with open(path, encoding='utf-8') as f:
                text = f.read()
            kept, settled = take_settled(text)
            if settled:
                shown = os.path.relpath(path, root)
                entry = f'## {TODAY} — {shown}: {len(settled)} proposals settled\n\n' + ''.join(s if s.endswith('\n') else s + '\n' for s in settled) + '\n'
                journal_add(journal, entry)
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(kept)
                proposals += len(settled)
    # 3. Every file in a done folder moves whole to logs, index.md files staying.
    moves, collisions = {}, []
    logs = os.path.join(root, 'logs')
    for folder, subfolders, files in os.walk(root):
        subfolders[:] = [s for s in subfolders if s not in SKIP_FOLDERS and not s.startswith('.')]
        if os.path.basename(folder) != 'done' and f'{os.sep}done{os.sep}' not in folder + os.sep:
            continue
        for name in sorted(files):
            if name == 'index.md' or not name.endswith('.md'):
                continue
            full_from = os.path.realpath(os.path.join(folder, name))
            full_to = os.path.join(logs, name)
            if os.path.exists(full_to):
                collisions.append(os.path.relpath(full_from, root))
                continue
            os.makedirs(logs, exist_ok=True)
            if not dispatcher_move(full_from, full_to):
                os.rename(full_from, full_to)
            moves[full_from] = full_to
    links = repoint(moves) if moves else 0
    # 4. finished.md written again, and the project's log told.
    subprocess.run([sys.executable, os.path.join(HERE, 'finished.py'), MEMORY, FINISHED], capture_output=True)
    if items or proposals or moves:
        log_line(root, f'- D: finished work processed: {items} items from {files_with_items} files and {proposals} settled proposals into logs/{JOURNAL}; '
                       f'{len(moves)} done files moved to logs, {links} links re-pointed'
                       + (f'; not moved, a file of that name already in logs: {", ".join(collisions)}' if collisions else ''))
    print(json.dumps({'items': items, 'files': files_with_items, 'proposals': proposals, 'moved': len(moves), 'links': links, 'collisions': collisions}))


if __name__ == '__main__':
    main()
