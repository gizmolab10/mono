---
kind: analyze
title: "Proposals"
description: "<!-- ov proposals — each being weighed or driven; one leaves when it becomes the drive, dissolves into truth, or dies. -->"
tags: [now, weighed]
date: 2026-08-31
---
# Proposals

## proposal: code debt belongs in the zone, like ideas (28 August 2026)

An owed item is an idea that has been accepted but not yet done. The zone already holds ideas — things captured without being believed — and the debt list is the same kind of thing at a later point on the same arc: accepted, waiting, not yet true of the code. So it stays in `zone/`, beside `ideas.md`, and never becomes a truth. Truth files say what the code IS; a debt list says what it is not.

That is what the move on 27 August already did, by hand. This proposal is for making it the design rather than an accident.

**What follows from it**

- **`zone/debt.md` is the one place work is owed.** One file per project. Nothing new is ever written to the old `notes/work/` files.
- **The done section stops growing.** A finished item is deleted, and a `D:` line in the log says what was done. Git holds the corpse; the log holds the recent; the debt list holds only what is still owed. The 292 finished checkboxes now in the file are history that came along with the move — they can be cut at the next settle without losing anything.
- **Settle triages debt the way it triages ideas.** Ideas get promote, keep, or cull. Debt gets: done (delete it, log a `D:`), still owed (leave it), or dead (delete it, log why). Three settles untouched is the same signal it is for an idea — do it or drop it.
- **An idea promoted becomes debt, not truth.** That is the missing step in the arc: `propose` puts a thing in `ideas.md`; deciding to build it moves the line to `debt.md`; building it writes the truth and deletes the debt line. Today `propose` has nowhere to hand a thing off to.
- **handoff is not a second file.** Where to pick up is the first unchecked item in `debt.md`, plus the current-state paragraph in `index.md` and the log's `Q:` lines. The file that moved can be read and emptied at the next settle rather than kept.

**Cost.** One more file in every project's zone, and a settle step that touches it. Both small.

**Open question:** does `soon` stay as a heading inside `debt.md`, or does a debt line carry a tag — `now`, `soon`, `tabled` — the way a file does?

## guide -> file rename (from handoff)

Criteria settled: rename to `file` wherever the thing can be a design or work note too; keep `guide` where the name exists outside our code (the guides/ folder, its paths, sentences that turn on the difference); leave the ~550 comments, each changed as its file is next touched, never as a sweep. Group 1 is done — fourteen names, 87 occurrences, 11 files, and the dispatcher route `/list-guides` -> `/list-files`. Remaining: group 2, a reading job — walk the 52 occurrences inside paths and confirm each is the folder on disk rather than a thing the app lists.

## gather the utilities (from handoff)

Seventeen of the nineteen utility files hand out loose functions, so the editor's frame opens with nineteen import lines. Gather each file's functions into one exported thing, so a caller names the file, not every function: `export const labels = { labels_from, label_block, has_labels, blank_file };` Open: a class or one gathered object (no state either way — Colors and SVG_Paths, which hold classes, should end the same shape as the rest); whether `labels.from` reads better than `labels_from`; and one file first, looked at, before the rest.
