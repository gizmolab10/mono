---
title: "Adopting the AI memory design"
description: "Where ov's move into the memory system stands — done, goal, remaining."
date: 
---
# Adopting the AI memory design

## Done so far

- ov brought up in the memory system: index, scope and lexicon truths, zone, log.
- CLAUDE files made first-class in ov and the dispatcher; three case bugs fixed; recorded in [claude-files.md](../../ov/truth/design/claude-files.md); all CLAUDE files renamed lowercase.
- First settle run and committed (`memory: settle ov`); ov named the first project.
- Root vitest config added so tests run right from mono's top.

## Goal

Make `ov/notes/` obsolete: everything living moves into `memory/ov/`, history stays behind as the archive, nothing new is written there.

## Remaining

- Move `memory/ov/notes/guides/pre-flight/lexicon.md` into [truth/lexicon.md](memory/ov/truth/lexicon.md).
- Move the living design content (`memory/ov/notes/guides/design/ov - goals.md`) into a truth; [scope.md](truth/scope.md) already links to it.
- Decide a home for the file map (`memory/ov/notes/guides/project/map of ov files.md`) — it is living and load-bearing.
- Fold the work notes (handoff, code debt, current context) into the index's current state and `Q:` lines; journals stay as archive.
- Point ov's CLAUDE.md at `memory/ov/` alone, and shrink the death list as each line above dies.

## learn, ov — missing stuff

Two loose ends found while listing, 3 September 2026:

- [ ] no project has a `memory/<project>/notes/work/now/learn.md`, though CLAUDE.md names one
- [x] Mono's lexicon links to an ov lexicon that does not exist — fixed 7 September 2026: the shared lexicon links to `memory/ov/truth/lexicon.md`.

