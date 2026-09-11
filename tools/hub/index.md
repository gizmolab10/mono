# Hub

- [dispatcher.py](dispatcher.py) — the dispatcher: the small server that reads and writes files on this machine, and the db, for the overview app and the hub page. Its routes are proved by [test_dispatcher.py](test_dispatcher.py), asked of the running dispatcher.
- [database.py](database.py) — the db: `ov.db` beside it, git-ignored, holding files, labels, sources and rules. Only the dispatcher reads and writes it. The dispatcher's `/scan` fills it from every file's own block, `/all-labels` hands it all back, `/set-fields` writes a file's title, description, use_when and date, and `/strip-block`, asked with a confirm word, takes the whole block off every file the db holds. Proved by [test_database.py](test_database.py) against a db of its own, with no dispatcher running.
- [index.html](index.html) — the hub page.
- [ports.json](ports.json) — every server's port, the one place.
- [servers.sh](servers.sh), [start-hub.sh](start-hub.sh), [clean.worktrees.sh](clean.worktrees.sh) — starting the dev servers and the hub, and clearing worktrees.
