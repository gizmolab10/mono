---
description: ov (Overview) — a browser and editor for every markdown file in the repo.
---
# ov

A browser and editor for every markdown file in this repo: a list on the left, one file's words on the right, and every size and color coming from one place. Ported from ji. Built with Svelte.

**Current state:** both views are one shape — a filters stack whose heavy line sits on the region's top edge, search first inside it; the editor's stack also holds its controls, back links, information, kinds and tags. Everything ov borrows from core lives in `common/Core.ts`, one line each, through the "core" alias. Browse offers the lifecycle tag area and neither shows nor counts log files. mu is a collection; a file's project is its own idea. On the Mac, vitest and yarn dev (the vite half of the alias) still owe their proof.

## Zone

- [handoff.md](zone/handoff.md) — where to pick up; moved from the old notes as it was.
- [code debt.md](zone/code debt.md) — everything owed and everything finished; moved as it was, done section and all.

## Truths

- [scope.md](truth/scope.md) — what belongs in ov and what deliberately does not.
- [lexicon.md](truth/lexicon.md) — ov's terms, the one home; the old pre-flight lexicon is merged in and gone.
- [decisions.md](truth/decisions.md) — live rationales, and the pac responses weighing coming choices.
- [controls.md](truth/controls.md) — how the list's filters and the editor's controls behave.
- [claude-files.md](truth/claude-files.md) — how CLAUDE files are listed, placed, read, and written; the three places that must agree.
