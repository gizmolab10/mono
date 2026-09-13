# ov

A browser and editor for every markdown file in this repo: a list on the left, one file's words on the right, and every size and color coming from one place. Ported from ji. Built with Svelte.

**Current state:** both views share one structure — a filters stack whose heavy line sits on the region's top edge, search first inside it; the editor's stack also holds its back links, information, kinds and tags, and while a file is open the row across the top holds the file's controls in a section of its own. The stack's slots hold the half-gaps and answer the cursor; rows hold plain padding in rungs. Everything ov adopts from core lives in `common/Core.ts`, one line each, through the "core" alias. Browse offers the lifecycle tag area, neither shows nor counts log files, and its projects control lists every project — memory subfolders answer to their own projects, so memory itself owns no files. handoff.md is dissolved; the map lives in `truth/`; the proposals sit in `zone/proposals.md`, the newest built and confirmed; `zone/simplify gaps.md` says how the filter stacks size their rows. Launch draws the list from the dispatcher's listing alone and reads the labels after — the edited file first, then the rows in view, then the rest, twelve at a time — the list narrowing as they arrive. Two guide folders moved whole from `notes/guides/` into `truth/` 7 September 2026 — `design/` (6 files), `project/` (1) — unsorted.

The adoption is finished and measured: no file in ov is a copy of anything in core, proved by comparing both source folders — zero identical, zero near, zero paired by name. Thirty-two of core's files arrive through `Core.ts`, plus `Extensions` as a bare import there and `main.css` at `main.ts`. Those are the only two bridges through the alias, and `core_alias.test.ts` fails if a third is built: code goes through `Core.ts`, the stylesheet through `main.ts`, since where a stylesheet loads decides which rule wins between two that match equally. core now checks and tests itself — its own first check found that `Big_Pill` had never compiled. Three files say where the alias points, not two: `tsconfig.json`, `vite.config.ts` and `vitest.config.ts`, the last read in place of the second. ov is clean at 529 files with 336 tests; core at 466 with 91. How a host does all this is core's now — [adopting core.md](../core/truth/adopting%20core.md).

## Zone

- [ideas.md](zone/ideas.md) — ov ideas, appended freely; every settle triages each one.
- [proposals.md](zone/proposals.md) — the proposals being weighed; one leaves when it becomes the drive, dissolves into truth, or dies.
- [consolidate.md](zone/consolidate.md) — the folder-by-folder detail behind the guides sorting: of the 142 now in truth/, 91 stay, 17 fold, 22 archive, 6 to zone, 9 to ws's manual, 6 die; the mechanical move is built, the sorting is a pending pac in shared's decisions.md, the drive dissolved.
- [simplify gaps.md](zone/simplify%20gaps.md) — how the two filter stacks size their rows: the slot owns the reach, rows hold plain padding in rungs, the tags run holds its own headroom, a starved section sizes as a fold.
- [ov as knowledge bases.md](zone/ov%20as%20knowledge%20bases.md) — how companies organize and browse their knowledge, and which of those approaches fit ov, mu and ji. Its roadmap's phases 1 to 6 are built, rules among them: the db beside the dispatcher holds all five labels of every file and its authors and where it came from, the files list and the editor read it, no memory file carries a block, and the dispatcher watches the disk so a file moved in the Finder keeps its labels.
- adopt kb.md — what a host hands kb, proposed. Moved to [memory/kb/zone](../kb/zone/adopt%20kb.md) at step 4 of the plan, 12 September 2026.
- [music and ai.md](zone/music%20and%20ai.md) — kb, the library extracted from ov, which mu and ai import, each bringing its specialty: what kb holds, what a specialty is, the ai and music specialties each defined with a key values table, music with its open questions, the db tables, one db per host, and the plan: 32 steps in one list, ai on kb first, the questions, the backup and one db per host, then the strip of ov, then music, kb's new work, the drop box, mu adopting kb and three for later, each decision a step needs a substep before its work, the threading fix proposed inside step 21.

## Truths

- [scope.md](truth/scope.md) — what belongs in ov and what deliberately does not.
- [lexicon.md](truth/lexicon.md) — ov's terms, the one home; the old pre-flight lexicon is merged in and gone.
- [banned words.md](truth/banned%20words.md) — overview's own word substitutions; the hooks read it.
- [working features.md](truth/working%20features.md) — what the app can do, newest first.
- [decisions.md](truth/decisions.md) — live rationales, and the pac responses weighing coming choices.
- [controls.md](truth/design/controls.md) — how the list's filters and the editor's controls behave.
- [claude-files.md](truth/design/claude-files.md) — how CLAUDE files are listed, placed, read, and written; the three places that must agree.
- [map of ov files.md](truth/map%20of%20ov%20files.md) — every source file in overview; read it instead of discovering files using regex and wildcards, and update it when files move.
- [action type.md](truth/design/action%20type.md) — the type that hands Separator more than one title, each with its handler and its position.
- `design/` — what the app is for and how it got here; moved whole from `notes/guides/design/`, unsorted.
- `project/` — the file map and what the app can do; moved whole from `notes/guides/project/`, unsorted.
- [okf.md](okf.md) — the open format the guides are kept in: one concept per file, labels at the top, version control underneath.
