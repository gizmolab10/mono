#!/usr/bin/env python3
"""Feeds finished.py a made-up memory folder and reads what it writes.
    python3 tools/test_finished.py"""
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, 'finished.py')


def put(root, relative, text):
    path = os.path.join(root, relative)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)


def main():
    passed = failed = 0
    with tempfile.TemporaryDirectory() as memory:
        put(memory, 'zz/zone/ideas.md', '# Ideas\n\n- [ ] one\n- [x] done\n- [X] two\n')
        put(memory, 'zz/truth/rules.md', '# Rules\n\n- [x] a truth may hold this\n')
        put(memory, 'zz/zone/learn.md', '# Learn\n\n- [x] a correction ticked, waiting for record, never counted\n')
        put(memory, 'zz/logs/decisions.md', '## Decisions made\n\n- x\n\n## Evaluations (pac)\n\n- 1 Jan; **a.** For. Decided 2 Jan: yes.\n- 2 Jan; **b.** For. Against.\n')
        put(memory, 'zz/zone/proposals.md', '# P\n\n## one\n\nProposal.\n\n## two\n\nDecided and built.\n\n## three\n\nReading (3) is culled.\n')
        put(memory, 'zz/logs/work journal.md', '# Work Journal\n\n## 2026-01-02 — b\n\ntext\n\n## 2026-01-01 — a\n\ntext\n')
        put(memory, 'zz/zone/work/done/old.md', '- [x] finished, counted though its folder is done\n')
        put(memory, 'zz/archive/retired.md', '- [x] retired, never counted\n')
        put(memory, 'zz/logs/moved.md', '- [x] in logs, never counted\n')
        put(memory, 'zz/zone/clean.md', '# nothing done here\n\n- [ ] open\n')
        put(memory, 'zz/zone/two words.md', '- [x] one\n')
        put(memory, 'shared/zone/placeholder.md', '# nothing\n')
        out = os.path.join(memory, 'shared', 'zone', 'finished.md')
        count = subprocess.run([sys.executable, SCRIPT, memory, out], capture_output=True, text=True).stdout.strip()
        with open(out, encoding='utf-8') as f:
            body = f.read()
        lines = [l for l in body.split('\n') if l.startswith('| ') and not l.startswith('| z/t') and not l.startswith('| ---')]

        def check(name, want):
            nonlocal passed, failed
            if want in body:
                print(f'PASS: {name}'); passed += 1
            else:
                print(f'FAIL: {name} — wanted "{want}"\n{body}'); failed += 1

        if count == '5':
            print('PASS: five lines counted'); passed += 1
        else:
            print(f'FAIL: five lines counted — got {count}'); failed += 1
        check('the H1 carries every project\'s items added up', '# Finished (7)')
        check('a table per project, its heading counting the items', '## zz (7)\n\n| z/t | file | finished |')
        check('checked in zone, capital X too',  '| z | [ideas.md](../../zz/zone/ideas.md) | 2 done |')
        check('checked in truth',                '| t | [rules.md](../../zz/truth/rules.md) | 1 done |')
        check('settled proposals',               '| z | [proposals.md](../../zz/zone/proposals.md) | 2 proposals settled |')
        check('a done folder is walked',         '| z | [work/done/old.md](../../zz/zone/work/done/old.md) | 1 done |')
        check('a space in a name is encoded',    '| z | [two words.md](../../zz/zone/two%20words.md) | 1 done |')
        if not any(w in l for l in lines for w in ('work journal', 'moved.md', 'decisions.md', 'retired.md', 'clean.md', 'placeholder', 'learn.md')):
            print('PASS: logs, decided pacs, learn, archive and quiet files left out'); passed += 1
        else:
            print('FAIL: logs, decided pacs, archive and quiet files left out'); failed += 1
        again = subprocess.run([sys.executable, SCRIPT, memory, out], capture_output=True, text=True).stdout.strip()
        with open(out, encoding='utf-8') as f:
            body2 = f.read()
        if body2 == body and again == count:
            print('PASS: running twice writes the same file'); passed += 1
        else:
            print('FAIL: running twice writes the same file'); failed += 1
    print('----')
    print(f'{passed} passed, {failed} failed')
    sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
