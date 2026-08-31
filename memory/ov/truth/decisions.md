---
kind: 
title: "Decisions"
description: "Live rationales, and the pac responses that weigh coming choices."
tags: [maybe, incorporated]
date: 
---
# Decisions

## Decisions made during 2026

- 25 August 2026; new tag **keep** in the **progress** tagset.
- 25 August 2026; new tag **maybe** in the **fix** tagset.
- 25 August 2026; **speed** renamed **faster**, everywhere it was worn.
- 25 August 2026; a ninth tagset, **fate** — keep, maybe, stale, stow — its four tags moved out of **progress** and **fix**. Each tag answers: what becomes of this file?
- 25 August 2026; the **stow** tag is gone — no file wore it. The tagset stays **fate**: keep, maybe, stale.
- August 25. CLAUDE files are **lowercase** by convention, and yet **uppercase** is still tolerated.

## Evaluations (pac) made during 2026

- 30 August 2026; **merge all small ts files into one common/core.ts** — small meaning at most the lines in Configuration.ts plus 3, today 2 + 3 = 5.
  For: the seam gathered into one file — every borrowing from core is one export line in a file whose name says what it is, the one-place readability the lib/core folder wanted, without a folder and without colliding with the alias's name. Three one-liners become one; a future adoption adds a line rather than a file.
  Against: with the threshold at 5 lines, four files qualify — the three borrowings (Constants 4, Colors 4, Configuration 2) and one stray: Types.ts at 5, ov's own. So even a sharp threshold mixes one concept in that is not a borrowing, and one-concept-one-file is the design's own rule; the sizing table caps a file's length, never the count of files. The criterion also moves as Configuration grows. And the sweep is the same one the lib/core pac choked on: every importer of the merged files changes its path.
  The standing rival: alias-direct — importers write `from 'core/ts/...'`, no shim files at all, the borrowing readable in every import line; same sweep, zero files.
  Deciding question: is the merge criterion *small* or *borrowed from core*? Borrowed-from-core makes core.ts an honest seam file whatever its length; small makes it a drawer, and the name stops being true at the first stray.
  Decided 30 August 2026: borrowed. common/Core.ts holds ov's borrowings from core — Constants, Configuration, Colors, and Extensions (a side-effect import) — one line each; Types.ts, ov's own, keeps its own file.

- 27 August 2026; **move handoff.md and code debt.md into the new design as they are.**

  For: both are live — pull-don't-push says move a thing the day work reaches for it, and today's session reached for both. Moving them untouched is the cheapest possible move: no editing, no judgment, nothing lost by trimming wrongly. ov's memory has nowhere to say what is owed — `decisions.md` holds rationales, `controls.md` holds design — and that missing home is exactly why handoff keeps getting written. And the ratchet is already being broken while they stay outside: this session wrote a summary into handoff.md today, into a file on the death list.

  Against: "as is" imports history, which the migration rules forbid (changed to inception, on 28 August 2026). `code debt.md` is 390 lines, of which 315 are its done section — 292 finished checkboxes against 27 unchecked. Git already holds that work and the log holds what is recent. Size: at 390 lines it breaks the ~100-line truth limit four times over, and any `use_when` broad enough to be useful would eat the orientation budget. Duplication: handoff's "where it stands" and `index.md`'s current-state paragraph would both claim one topic, as would handoff's open items and the log's `Q:` lines — two files claiming one topic is the bug the design names. And handoff is a journal by nature: dated, narrative, rewritten each session. That is what `log.md` is; a truth file rewritten wholesale every session is a log wearing the wrong name.

  A middle path, if wanted: `code debt.md` becomes `truth/debt.md` holding only the 27 unchecked items and its done section stays behind, abandoned in place; handoff stops being a file at all — its "what to do next" becomes the current-state paragraph in `index.md` plus `Q:` lines in the log.

  Deciding question: is "as is" worth importing 292 finished checkboxes, or is the point of the move that these two files finally stop being a second system?
