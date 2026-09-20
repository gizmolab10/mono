# core

A library with no entry point, carved out of ov: what every mono app can share. Four ts folders — common, events, types, utilities — each behind an index.ts barrel, and nine support components. Core keeps no state of its own; a host hands its state in as props and remembers what needs remembering.

## Truths

- [structure.md](truth/structure.md) — what core is and the rules that keep it core.
- [adopting core.md](truth/adopting%20core.md) — how a host takes core: the three files that say where the alias points, the one file holding every adoption, what the host owes at startup, and the lessons each paid for. Read it before adopting anything.
- [lexicon.md](truth/lexicon.md) — core's terms.
- [banned words.md](truth/banned%20words.md) — core's own word substitutions; the hooks read it.
- [working features.md](truth/working%20features.md) — what the app can do, newest first; ov's, from the carve.
- [scope.md](truth/scope.md) — what belongs in core and what deliberately does not.
- [claude-files.md](memory/core/truth/claude-files.md) — how CLAUDE files are listed, placed, read, and written.
- [action type.md](memory/core/truth/action%20type.md) — the type that hands Separator more than one title, each with its handler and its position.
- [sections.md](truth/sections.md) — the sections stack, core's design; from shared's truth/develop, 19 September 2026.
- [sections spec.md](truth/sections%20spec.md) — the same design written as porting steps for di, ji and ws; from shared's truth/develop, 19 September 2026, to merge into sections.md.
- [hits system.md](truth/hits%20system.md) — the hits manager; from shared's truth/develop, 19 September 2026.
- `design/` — the format, the goals, and how the editing works; moved whole from `notes/guides/design/`, unsorted.
- `project/` — the file map and what the app can do; moved whole from `notes/guides/project/`, unsorted.

## Zone

- [drive.md](zone/drive.md) — the current undertaking, and the project's current state, moved here from this index 16 September 2026.

## Logs

- [decisions.md](logs/decisions.md) — every decision, dated, never deleted, and the pacs decided. In logs since 18 September 2026, the open pacs in zone/proposals.md.
