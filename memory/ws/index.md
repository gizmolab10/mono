# ws

Webseriously, a graph visualization. Brought into the memory system 4 September 2026.

**Current state:** the filesystem database loads a folder again after a missing entry, and names entries by their whole path; both in `DB_Filesystem.ts`, tests at 192 passing. A VSCode launch configuration debugs ws in Chrome. The filesystem database saves nothing by design; which way it should save is open in zone/questions.md. svelte-check reports 296 errors in 53 files, all older than 4 September 2026 and none in the edited file. The old notes under `ws/notes/` have not moved in.

## Zone

- [ideas.md](memory/ws/zone/ideas.md) — ws ideas, appended freely; every settle triages each one.
- [questions.md](zone/questions.md) — what is unanswered, one line each.

## Truths

- [filesystem database.md](truth/filesystem%20database.md) — how the filesystem database reads a folder, names what it finds, and why it saves nothing.
- `architecture/` — how the program is built, one page per part; moved whole from `notes/guides/architecture/` 7 September 2026, unsorted.
- `collaborate/` — gotchas and ws's own style; moved whole from `notes/guides/collaborate/`, unsorted.
- `manuals/` — the user manual and the Bubble plugin doc; moved whole from `notes/guides/manuals/`, unsorted; ov's zone/consolidate.md proposes it leaves memory for `src/manual/`.
