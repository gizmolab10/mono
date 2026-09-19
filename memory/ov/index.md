# ov

A browser and editor for every markdown file in this repo: a list on the left, one file's words on the right, and every size and color coming from one place. Ported from ji. Built with Svelte.

The adoption is finished and measured: no file in ov is a copy of anything in core, proved by comparing both source folders — zero identical, zero near, zero paired by name. Thirty-two of core's files arrive through `Core.ts`, plus `Extensions` as a bare import there and `main.css` at `main.ts`. Those are the only two bridges through the alias, and `core_alias.test.ts` fails if a third is built: code goes through `Core.ts`, the stylesheet through `main.ts`, since where a stylesheet loads decides which rule wins between two that match equally. core now checks and tests itself — its own first check found that `Big_Pill` had never compiled. Three files say where the alias points, not two: `tsconfig.json`, `vite.config.ts` and `vitest.config.ts`, the last read in place of the second. ov is clean at 529 files with 336 tests; core at 466 with 91. How a host does all this is core's now — [adopting core.md](../core/truth/adopting%20core.md).

## Zone

- [drive.md](zone/drive.md) — the current undertaking, and the project's current state, moved here from this index 16 September 2026.
- ideas.md, drive.md, consolidate.md, simplify gaps.md and `work/` — moved to [memory/ai/zone](../ai/index.md) 15 September 2026, ov's ideas merged into ai's.
- [proposals.md](zone/proposals.md) — the proposals being weighed; one leaves when it becomes the drive, dissolves into truth, or dies.
- ov as knowledge bases.md — moved to [memory/kb/zone](../kb/zone/ov%20as%20knowledge%20bases.md) 14 September 2026: how companies organize and browse their knowledge, and which of those approaches fit ov, mu and ji. Its roadmap's phases 1 to 6 are built, rules among them: the db beside the dispatcher holds all five labels of every file and its authors and where it came from, the files list and the editor read it, no memory file carries a block, and the dispatcher watches the disk so a file moved in the Finder keeps its labels.
- adopt kb.md — what a host hands kb, proposed. Moved to [memory/kb/zone](../kb/zone/adopt%20kb.md) at step 4 of the plan, 12 September 2026.
- music and ai.md — moved to [memory/ai/zone](../ai/zone/work/music%20and%20ai.md), by way of kb's zone for a day, 14 September 2026: kb, the library extracted from ov, which mu and ai import, each bringing its specialty: what kb holds, what a specialty is, the ai and music specialties each defined with a key values table, music with its open questions, the db tables, one db per host, and the plan: 32 steps in one list, ai on kb first, the questions, the backup and one db per host, then the strip of ov, then music, kb's new work, the drop box, mu adopting kb and three for later, each decision a step needs a substep before its work, the threading fix proposed inside step 21.

## Truths

- decisions.md and `design/` — moved to [memory/ai/truth](../ai/index.md) 15 September 2026; lexicon.md, banned words.md and working features.md merged into ai's.
- [scope.md](truth/scope.md) — what belongs in ov and what deliberately does not.
- [map of ov files.md](truth/map%20of%20ov%20files.md) — every source file in overview; read it instead of discovering files using regex and wildcards, and update it when files move.
- `project/` — the file map and what the app can do; moved whole from `notes/guides/project/`, unsorted.
- [okf.md](okf.md) — the open format the guides are kept in: one concept per file, labels at the top, version control underneath.
