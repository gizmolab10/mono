---
description: ov (Overview) — a browser and editor for every markdown file in the repo.
---
# ov

A browser and editor for every markdown file in this repo: a list on the left, one file's words on the right, and every size and color coming from one place. Ported from ji. Built with Svelte.

**Current state:** CLAUDE files are first-class — listed, placed, readable, editable — with case-tolerance as a guard; all CLAUDE files renamed lowercase across the repo. Vitest confirmation still pending on the Mac (the run needs mono's root config, new since the last try).

## Truths

- [scope.md](truth/scope.md) — what belongs in ov and what deliberately does not.
- [lexicon.md](truth/lexicon.md) — ov's terms (currently points at the project's existing lexicon).
- [claude-files.md](truth/claude-files.md) — how CLAUDE files are listed, placed, read, and written; the three places that must agree.
