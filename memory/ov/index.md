---
description: ov (Overview) — a browser and editor for every markdown file in the repo.
---
# ov

A browser and editor for every markdown file in this repo: a list on the left, one file's words on the right, and every size and color coming from one place. Ported from ji. Built with Svelte.

**Current state:** both views are one shape — a filters stack whose heavy line sits on the region's top edge, search first inside it; the editor's stack also holds its controls, back links, information, kinds and tags. Everything ov adopts from core lives in `common/Core.ts`, one line each, through the "core" alias. Browse offers the lifecycle tag area, neither shows nor counts log files, and its projects control lists every project — memory subfolders answer to their own projects, so memory itself owns no files. handoff.md is dissolved; the map lives in `truth/`; the three proposals sit in `zone/proposals.md`. On the Mac, `yarn install` and the tests are proven — 24 files, 424 tests, once the core alias was added to `vitest.config.ts`, which vitest reads in place of `vite.config.ts`. `yarn dev` (the vite half of the alias) and a cold `check` still to confirm.

## Zone

- [adopting core.md](zone/adopting%20core.md) — the ov-adopts-core journey in one telling, for the next host; it moves into core's `truth/` later.
- [drive.md](zone/drive.md) — the current drive: prove the core adoption on the Mac, and how to resume in VSCode.
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
