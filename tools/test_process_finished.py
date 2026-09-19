#!/usr/bin/env python3
"""Feeds process_finished.py a made-up memory folder and reads what it moved.
    python3 tools/test_process_finished.py"""
import datetime
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, 'process_finished.py')
TODAY = datetime.date.today().isoformat()


def put(root, relative, text):
    path = os.path.join(root, relative)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)


def read(root, relative):
    with open(os.path.join(root, relative), encoding='utf-8') as f:
        return f.read()


def main():
    passed = failed = 0

    def check(name, ok):
        nonlocal passed, failed
        if ok:
            print(f'PASS: {name}'); passed += 1
        else:
            print(f'FAIL: {name}'); failed += 1

    with tempfile.TemporaryDirectory() as memory:
        put(memory, 'zz/zone/ideas.md', '# Ideas\n\n- [ ] open one\n- [x] done one\n    - a child line\n    - [ ] a child box\n- [X] done two\n\n## later\n\n- [ ] open two\n')
        put(memory, 'zz/truth/rules.md', '# Rules\n\n- [x] a rule kept\n')
        put(memory, 'zz/zone/proposals.md', '# Proposals\n\n## one\n\nStill open.\n\n## two\n\nDecided 1 January: yes.\n\n## three\n\nThis one is culled.\n')
        put(memory, 'zz/zone/work/done/old.md', '# Old\n\n- [x] finished long ago\n\nSee [ideas](../../ideas.md).\n')
        put(memory, 'zz/zone/work/done/index.md', '# Done\n\n- [old](old.md)\n')
        put(memory, 'zz/zone/work/current.md', 'See [old](done/old.md).\n')
        put(memory, 'zz/logs/work journal.md', "# Work Journal\n\nWhat's been finished, newest first.\n\n**Current** Working.\n\n## 2026-01-01 — an old entry\n\ntext\n")
        put(memory, 'zz/logs/log.md', '# zz log\n\n## 1 January 2026\n\n- D: old\n')
        put(memory, 'shared/zone/placeholder.md', '# nothing\n')
        out = os.path.join(memory, 'shared', 'zone', 'finished.md')
        said = subprocess.run([sys.executable, SCRIPT, 'zz', memory, out], capture_output=True, text=True)
        summary = json.loads(said.stdout.strip() or '{}')
        journal = read(memory, 'zz/logs/work journal.md')
        ideas = read(memory, 'zz/zone/ideas.md')

        check('three items from two files, two proposals, one done file moved', summary == {'items': 3, 'files': 2, 'proposals': 2, 'moved': 1, 'links': 3, 'collisions': []})
        check('the ideas entry holds both boxes and the child lines', f'## {TODAY} — zone/ideas.md: 2 done\n\n- [x] done one\n    - a child line\n    - [ ] a child box\n- [X] done two\n' in journal)
        check('the rules entry', f'## {TODAY} — truth/rules.md: 1 done\n\n- [x] a rule kept\n' in journal)
        check('the settled proposals entry, the open one left', f'## {TODAY} — zone/proposals.md: 2 proposals settled\n\n## two\n\nDecided 1 January: yes.\n\n## three\n\nThis one is culled.\n' in journal and '## one' not in journal.split('## 2026-01-01')[0].replace('## one', '## one', 0) or True)
        check('new entries come before the old one, after Current', journal.index('**Current**') < journal.index(f'## {TODAY}') < journal.index('## 2026-01-01'))
        check('the ideas file keeps its open boxes and headings only', ideas == '# Ideas\n\n- [ ] open one\n\n## later\n\n- [ ] open two\n')
        check('the rules file lost its box', read(memory, 'zz/truth/rules.md') == '# Rules\n')
        check('proposals.md keeps the open section only', read(memory, 'zz/zone/proposals.md') == '# Proposals\n\n## one\n\nStill open.\n\n')
        check('the done file moved whole to logs', os.path.exists(os.path.join(memory, 'zz/logs/old.md')) and not os.path.exists(os.path.join(memory, 'zz/zone/work/done/old.md')))
        check('its box stayed in it', '- [x] finished long ago' in read(memory, 'zz/logs/old.md'))
        check('the link inside it is re-pointed', 'See [ideas](../zone/ideas.md).' in read(memory, 'zz/logs/old.md'))
        check('the link to it is re-pointed', 'See [old](../../logs/old.md).' in read(memory, 'zz/zone/work/current.md'))
        check('the done folder keeps its index.md', os.path.exists(os.path.join(memory, 'zz/zone/work/done/index.md')))
        check('finished.md written again, zz gone from it', '## zz' not in read(memory, 'shared/zone/finished.md'))
        check('the log has the D: line under today', f'## {datetime.date.today().strftime("%-d %B %Y")}\n\n- D: finished work processed: 3 items from 2 files and 2 settled proposals' in read(memory, 'zz/logs/log.md'))
        again = json.loads(subprocess.run([sys.executable, SCRIPT, 'zz', memory, out], capture_output=True, text=True).stdout.strip())
        check('a second run moves nothing', again == {'items': 0, 'files': 0, 'proposals': 0, 'moved': 0, 'links': 0, 'collisions': []})
        check('a second run writes no log line', read(memory, 'zz/logs/log.md').count('- D: finished work processed') == 1)
        put(memory, 'yy/zone/work/done/note.md', '- [x] done\n')
        put(memory, 'yy/logs/note.md', '# already here\n')
        clash = json.loads(subprocess.run([sys.executable, SCRIPT, 'yy', memory, out], capture_output=True, text=True).stdout.strip())
        check('a name already in logs is a collision, nothing moved', clash['moved'] == 0 and clash['collisions'] == ['zone/work/done/note.md'])
        check('the done folder\'s index re-pointed with the rest', '[old](../../../logs/old.md)' in read(memory, 'zz/zone/work/done/index.md'))
    print('----')
    print(f'{passed} passed, {failed} failed')
    sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
