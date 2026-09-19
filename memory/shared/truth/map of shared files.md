# Map of shared files

The files that belong to no one project: the tools, the hub, the scripts, the hooks and the commands. Read it instead of discovering files using regex and wildcards, and update it when files are added, moved, or removed. Made 17 September 2026.

## root

- [CLAUDE.md](../../../CLAUDE.md) — the shared context every session reads first: the projects, the principles, who is who, what to read on load, the defaults.

## tools/ — the memory system's tools

- [code_debt.py](../../../tools/code_debt.py) — writes memory/shared/zone/code debt.md, one line per memory file holding unfinished work; the shorthand `debt` runs it.
- [finished.py](../../../tools/finished.py) — writes memory/shared/logs/finished.md, one line per memory file holding finished work; the shorthand `finished` runs it.
- [process_finished.py](../../../tools/process_finished.py) — moves one project's finished work into its work journal and its done folders' files into its logs folder.
- [test_code_debt.py](../../../tools/test_code_debt.py), [test_finished.py](../../../tools/test_finished.py), [test_process_finished.py](../../../tools/test_process_finished.py) — each feeds its tool a made-up memory folder and reads what it wrote or moved.
- [index.md](../../../tools/index.md) — the folder's index.

## tools/hub/ — the dispatcher and the db

- [dispatcher.py](../../../tools/hub/dispatcher.py) — the small server that reads and writes files on this machine and the db, for the pages and the hub page; imports each host's plugin.py.
- [database.py](../../../tools/hub/database.py) — the db: one SQLite file per host beside the dispatcher, ai.db and mu.db, holding files, labels, sources, rules and collections; forget_missing drops every row whose file is gone, for the dispatcher's forget-missing route.
- [ai.sql](../../../tools/hub/ai.sql) — every table of ai.db as plain text, which enters git though no db does.
- [ports.json](../../../tools/hub/ports.json) — every server's port, and beside a host's port the name of its db.
- [index.html](../../../tools/hub/index.html) — the hub page, with its dispatcher, build and project buttons.
- [servers.sh](../../../tools/hub/servers.sh), [start-hub.sh](../../../tools/hub/start-hub.sh) — start or restart the development servers, and the hub.
- [test_database.py](../../../tools/hub/test_database.py), [test_dispatcher.py](../../../tools/hub/test_dispatcher.py) — the db's tests on a temp repo, and the dispatcher's routes asked of a running dispatcher.
- [index.md](../../../tools/hub/index.md) — the folder's index.

## tools/scripts/ — shell scripts

- [analyze-counts.sh](../../../tools/scripts/analyze-counts.sh), [clean.worktrees.sh](../../../tools/scripts/clean.worktrees.sh), [delete-netlify-deploys.sh](../../../tools/scripts/delete-netlify-deploys.sh), [file-structure-check.sh](../../../tools/scripts/file-structure-check.sh), [snapshot.sh](../../../tools/scripts/snapshot.sh), [update-docs.sh](../../../tools/scripts/update-docs.sh) — counts, dead worktrees and branches, Netlify deploys, the file structure, a snapshot, the docs; each says its own job at its top.
- [index.md](../../../tools/scripts/index.md) — the folder's index.

## .claude/hooks/ — what fires around every turn

- [inject-always.sh](../../../.claude/hooks/inject-always.sh) — before each message: the Always rules, and one of the in-turn guides in rotation, the banned words among them.
- [bash-command-check.sh](../../../.claude/hooks/bash-command-check.sh) — before a Bash tool call: blocks commands that join actions with `;`, `&&` or `||`.
- [plain-english-check.sh](../../../.claude/hooks/plain-english-check.sh) — after every edit: says when a banned word or a name that names nothing was written. Its flag PLAIN_ENGLISH_CHECK is false since 19 September 2026, an experiment, and false it does nothing.
- [markdown-check.sh](../../../.claude/hooks/markdown-check.sh) — after every edit of a .md file: says when its markdown is malformed, a bare placeholder such as `<X>` outside backticks and code fences its first check. Made 19 September 2026.
- [mark-ts-check-pending.sh](../../../.claude/hooks/mark-ts-check-pending.sh), [check-ts.sh](../../../.claude/hooks/check-ts.sh) — an edit to a .ts or .svelte file is noted, and each touched project is type-checked when the reply ends.
- [snapshot-before-edit.sh](../../../.claude/hooks/snapshot-before-edit.sh) — before an edit, a snapshot of the file for undo.
- [done-checklist.sh](../../../.claude/hooks/done-checklist.sh) — when a message says done, the done checklist.
- [banned-words-check.sh](../../../.claude/hooks/banned-words-check.sh), [phrase-check.sh](../../../.claude/hooks/phrase-check.sh), [conciseness-check.sh](../../../.claude/hooks/conciseness-check.sh), [relevance-check.sh](../../../.claude/hooks/relevance-check.sh), [read-this-turn-check.sh](../../../.claude/hooks/read-this-turn-check.sh), [required-disclaimer-check.sh](../../../.claude/hooks/required-disclaimer-check.sh), [diagnostic-citation-check.sh](../../../.claude/hooks/diagnostic-citation-check.sh), [hook-answer-check.sh](../../../.claude/hooks/hook-answer-check.sh) — when a reply ends: the banned words, three habit patterns, filler, relevance, reads this turn, the disclaimer, a diagnostic cited, a hook answered on screen; each warns, none blocks.
- [murk-count.sh](../../../.claude/hooks/murk-count.sh) — when a reply ends: counts the times Jonathan said a reply did not read, into murk.jsonl.
- [display-fix.sh](../../../.claude/hooks/display-fix.sh) — on display: shows a hard-banned word as its replacement, the file untouched.
- [test-always-tag.sh](../../../.claude/hooks/test-always-tag.sh) — proves the guides arriving with every message wear the always tag in the db.
- the `.test.sh` files beside banned-words-check, hook-answer-check, markdown-check, murk-count, plain-english-check and relevance-check — each hook's own tests.

## .claude/commands/ — the skills typed with a slash

- [p.md](../../../.claude/commands/p.md) — pick the project to work on, after the record step.
- [cd.md](../../../.claude/commands/cd.md) — propose the first unchecked item of the picked project's code debt.
- [history.md](../../../.claude/commands/history.md) — list the last N queries Jonathan typed, 5 when N is missing.
- [always.md](../../../.claude/commands/always.md) — run test-always-tag.sh and report.
- [dream.md](../../../.claude/commands/dream.md) — memory consolidation.
- [old.md](../../../.claude/commands/old.md) — the earlier form of p, kept.
