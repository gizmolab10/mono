---
kind: specify
title: "md improvements"
description: "What to do about the audit: three passes of mechanical fixes, four decisions only Jonathan can make, and the structural work that keeps it true."
tags: [keep, now, proposal]
date: 2026-08-22
---
# md improvements

What to do about [md audit](md%20audit.md). Each pass stands alone and can be stopped after.

## Pass one — the entry points and the labels

Mechanical. Every fix is one line, and none needs a decision.

- **CLAUDE.md, three faults.** The map path names a file that does not exist; the description says "barebones web app" for something with 72 features and 410 tests; the last line forbids tags, which are now the app's centre.
- **Twelve labels**, from the audit's own table: four empty descriptions, a description that is really an instruction, a corrupted one, three dates that predate the writing, a title that says "ov installer" on a file about email, a file wearing `now` and `stow` at once.
- **Three dead pointers**: work/index links working features at a di path under a ji label; the murk journal names the murk guide at one path and the journal names another; guides/index lists one of its ten files.

**Proved by:** every link in ov's notes resolving, and every file carrying five labels with a description of its own.

## Pass two — the counts, cut rather than corrected

No two files agree on how many tags, kinds, areas, tests or notes there are. Five files, five disagreements, and none was wrong when written.

The fix is to stop restating them. The app already counts tags, kinds, areas and files; a note that wants a number says "the closed list" and links to it. Where a number must be written by hand, it lives in exactly one file.

**Proved by:** the audit's counts table having nothing left to compare.

## Pass three — four decisions, one page

These are yours. I would bring each with what I would do and why, and change nothing until you say.

1. **The founding document has two homes** — `ji/notes/work/proposals/ov.md` and `guides/design/ov - goals.md`. Which is the one, and does the other become a pointer?
2. **The index files** — OKF step 5, open since 2026-08-08. The app leaves them out and the folders do their job on screen; they exist for Obsidian and for mending drag-and-drop. Keep them and check them, or drop them and delete the mending code.
3. **OKF** is the format's home and no longer states the format. Split it into a living spec — the kinds, the tags, the label rules as they are today, one screen — and a record of how it got here?
4. **Three finished notes sit in soon** — the hits manager, the murk journal, mouse ux. Move them where finished work lives, and let soon hold only what is coming?

## Then — rewrite guides

`soon/rewrite guides.md` holds finished rewrites for 21 stale-tagged files and ends *"say the word on any of them and I'll do it."* After the three passes, that word is the next thing to say.

## What keeps it true

Sweeping today leaves the same table wrong in a month. Three structural pieces, smallest first:

1. **The app stamps the date** on any edit that changes a file's body. Four dates are wrong today, and the rule — last change of meaning, never a typo — cannot be kept by memory.
2. **The app checks labels**: a title that is unique and not "unnamed", a description that is not empty and not another file's, tags free of contradictory pairs, an H1 that agrees with the title. Every row of the audit's label table is one of those four.
3. **Point the app at its own notes.** The dead-link report and the stale sweep were built for the collections. Most of pass one is what they would have caught in `ov/notes` — the map path, the working-features link, the murk-guide path.

## Success

- Pass one: nothing in ov's notes points at a file that is not there, and every file's labels are its own.
- Pass two: a number appears in one place, or comes from the app.
- Pass three: four decisions made, and written into the files they govern.
- After: the 21 rewrites executed, and the four staleness files collapsed into two.
