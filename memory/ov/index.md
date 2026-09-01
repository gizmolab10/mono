---
description: ov (Overview) — a browser and editor for every markdown file in the repo.
---
# ov

A browser and editor for every markdown file in this repo: a list on the left, one file's words on the right, and every size and color coming from one place. Ported from ji. Built with Svelte.

**Current state:** both views are one shape — a filters stack whose heavy line sits on the region's top edge, search first inside it; the editor's stack also holds its controls, back links, information, kinds and tags. Everything ov adopts from core lives in `common/Core.ts`, one line each, through the "core" alias. Browse offers the lifecycle tag area, neither shows nor counts log files, and its projects control lists every project — memory subfolders answer to their own projects, so memory itself owns no files. handoff.md is dissolved; the map lives in `truth/`; the three proposals sit in `zone/proposals.md`.

The adoption is finished and measured: no file in ov is a copy of anything in core, proved by comparing both source folders — zero identical, zero near, zero paired by name. Thirty-two of core's files arrive through `Core.ts`, plus `Extensions` as a bare import there and `main.css` at `main.ts`. Those are the only two doors through the alias, and `core_alias.test.ts` fails if a third opens: code goes through `Core.ts`, the stylesheet through `main.ts`, since where a stylesheet loads decides which rule wins between two that match equally. core now checks and tests itself — its own first check found that `Big_Pill` had never compiled. Three files say where the alias points, not two: `tsconfig.json`, `vite.config.ts` and `vitest.config.ts`, the last read in place of the second. ov is clean at 529 files with 336 tests; core at 466 with 91. How a host does all this is core's now — [adopting core.md](../core/truth/adopting%20core.md).

## Zone

- [ideas.md](zone/ideas.md) — ov ideas, appended freely; every settle triages each one.
- [proposals.md](zone/proposals.md) — the proposals being weighed; one leaves when it becomes the drive, dissolves into truth, or dies.

## Truths

- [scope.md](truth/scope.md) — what belongs in ov and what deliberately does not.
- [lexicon.md](truth/lexicon.md) — ov's terms, the one home; the old pre-flight lexicon is merged in and gone.
- [decisions.md](truth/decisions.md) — live rationales, and the pac responses weighing coming choices.
- [controls.md](truth/controls.md) — how the list's filters and the editor's controls behave.
- [claude-files.md](truth/claude-files.md) — how CLAUDE files are listed, placed, read, and written; the three places that must agree.
- [map of ov files.md](truth/map%20of%20ov%20files.md) — every source file in overview; read it instead of discovering files using regex and wildcards, and update it when files move.
- [action type.md](truth/action%20type.md) — the type that hands Separator more than one title, each with its handler and its position.
- [okf.md](truth/okf.md) — the open format the guides are kept in: one concept per file, labels at the top, version control underneath.
