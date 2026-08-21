---
kind: explain
title: "Notes Map (di)"
description: "Every folder under di's notes, and what each one holds. Update when notes are added, moved, or removed."
tags: [journal, notes]
date: 2026-08-20
---
# Notes map — di

Every folder under `notes/`. Update when notes files are added, moved, or removed. The map of the
source code is [map of di files](map%20of%20di%20files.md); the map of the guides themselves is
[map of di guides](map%20of%20di%20guides.md).

## guides/ — reference

- `pre-flight/` — read at session start: always, lexicon, banned words.
- `project/` — the maps (files, guides, notes), and `overview/`, `philosophy/`, `research/`.
- `architecture/` — how the program is built, one page per part.
- `development/` — how work is done here: rules, testing, tooling.

## designs/ — direction

- `di road map.md` — where di is going, phase by phase.

## work/ — active tracking

- `now/` — the current working files: `code debt.md`, `code debt paid.md`, `handoff.md`,
  `work journal.md`, `working features.md`, `learn.md`, `revisit.di.md`, and the loose notes beside
  them.
- `next/` — planned work not yet started.
- `milestones/` — work bundled into named milestones, open and done.
- `done/` — finished notes and historical sessions.
- `mothballs/` — plans set aside, kept whole.
- `ai/` — cadence, technique, and di's own learn file.

## tools/

- `sync-next.mjs` — reads the first unchecked item out of `work/now/code debt.md`.
