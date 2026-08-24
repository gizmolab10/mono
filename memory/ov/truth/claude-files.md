---
type: design
title: CLAUDE files
description: How CLAUDE.md files are listed, placed, read, and written — and the three places that must agree.
tags: [claude-files, dispatcher, placement]
use_when: [dispatcher work, file listing, adding a kind of file the app shows, case or naming questions]
updated: 2026-08-24
---
# CLAUDE files

A CLAUDE.md at the repo's top or at a collection's top is a first-class file in ov: the dispatcher lists it, the app places it at its collection's top level, and it can be read and edited like any guide. One below a collection's top is nothing.

All CLAUDE files are spelled lowercase (`CLAUDE.md`), by decision — the uppercase spelling was an accident of history. The code still accepts either spelling everywhere, as a guard: the dispatcher's listing, its single allow-list check (`is_listed_note`, which gates both reading and writing), ov's `site_of_file` and `file_path_of`, and the name-stripping regexes are all case-blind.

Three places must agree for any kind of file the app shows, and each disagreement fails silently: the dispatcher's `/list-files` walk (what is sent), `site_of_file` (what the app places), and `is_listed_note` (what may be read and written). A file sent but not placed is read and thrown away; a file placed but not admitted shows in the list and refuses to open. Tests cover the CLAUDE cases in both codebases: `test_dispatcher.py` (listing, reading, refusal) and `saving.test.ts` (placement, either spelling, never deeper).
