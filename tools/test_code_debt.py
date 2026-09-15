#!/usr/bin/env python3
"""Feeds code_debt.py a made-up memory folder and reads what it writes.
    python3 tools/test_code_debt.py"""
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, 'code_debt.py')


def put(root, relative, text):
    path = os.path.join(root, relative)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)


def main():
    passed = failed = 0
    with tempfile.TemporaryDirectory() as memory:
        put(memory, 'zz/zone/ideas.md', '# Ideas\n\n- [ ] one\n- [x] done\n- [ ] two\n')
        put(memory, 'zz/truth/rules.md', '# Rules\n\n- [ ] a truth should not hold this\n')
        put(memory, 'zz/truth/decisions.md', '## Decisions made\n\n- x\n\n## Evaluations (pac)\n\n- 1 Jan; **a.** For. Decided 2 Jan: yes.\n- 2 Jan; **b.** For. Against.\n')
        put(memory, 'zz/zone/proposals.md', '# P\n\n## one\n\nProposal.\n\n## two\n\nDecided and built.\n\n## three\n\nReading (3) is dead.\n')
        put(memory, 'zz/zone/questions.md', '# q\n\n- why\n- how\n- when\n')
        put(memory, 'zz/logs/log.md', '# log\n\n<!-- consolidated: never -->\n\n## day\n\n- S: settled, not counted\n- D: a, not counted\n- I: b\n- I: c\n\n---\n\n## old list, below the rule\n\n- never counted\n- never counted\n')
        put(memory, 'zz/zone/learn.md', '## Raw Log\n\n- 2. 2026-01-02 **b.**\n- 1. 2026-01-01 **a.**\n\n## Distilled\n')
        put(memory, 'zz/zone/collisions.md', '# c\n\n## first\n\ntext\n\n## second\n\ntext\n')
        put(memory, 'zz/zone/drive.md', '# Drive\n')
        put(memory, 'zz/zone/clean.md', '# nothing to do here\n')
        put(memory, 'zz/zone/two words.md', '- [ ] one\n')
        put(memory, 'zz/archive/old.md', '- [ ] retired, never counted\n')
        put(memory, 'zz/zone/work/done/finished.md', '- [ ] finished by its folder, never counted\n')
        put(memory, 'shared/zone/placeholder.md', '# nothing\n')
        out = os.path.join(memory, 'shared', 'zone', 'code debt.md')
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

        check('count printed', '')
        if count == '10':
            print('PASS: ten lines counted'); passed += 1
        else:
            print(f'FAIL: ten lines counted — got {count}'); failed += 1
        check('a table per project, its heading counting the items', '## zz (16)\n\n| z/t | file | needs this |')
        check('unchecked in zone',         '| z | [ideas.md](../../zz/zone/ideas.md) | 2 open |')
        check('unchecked in truth',        '| t | [rules.md](../../zz/truth/rules.md) | 1 open truth |')
        check('open pacs',                 '| t | [decisions.md](../../zz/truth/decisions.md) | decide 1 pac |')
        check('open proposals',            '| z | [proposals.md](../../zz/zone/proposals.md) | decide 1 proposal |')
        check('questions',                 '| z | [questions.md](../../zz/zone/questions.md) | answer 3 questions |')
        check('log lines, no letter',      '|  | [log.md](../../zz/logs/log.md) | settle 2 lines |')
        check('learn under work',          '| z | [learn.md](../../zz/zone/learn.md) | distill 2 entries |')
        check('collisions',                '| z | [collisions.md](../../zz/zone/collisions.md) | rewrite 2 collisions |')
        check('drive',                     '| z | [drive.md](../../zz/zone/drive.md) | dissolve the drive |')
        check('a space in a name is encoded', '| z | [two words.md](../../zz/zone/two%20words.md) | 1 open |')
        if not any(w in l for l in lines for w in ('clean.md', 'old.md', 'placeholder', 'finished.md')):
            print('PASS: quiet files, archive and done left out'); passed += 1
        else:
            print('FAIL: quiet files, archive and done left out'); failed += 1
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
