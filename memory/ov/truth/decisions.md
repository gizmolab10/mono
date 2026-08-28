---
kind: 
title: "Decisions"
description: "Live rationales, and the pac responses that weigh coming choices."
tags: [maybe]
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

- 27 August 2026; **move handoff.md and code debt.md into the new design as they are.**

  For: both are live — pull-don't-push says move a thing the day work reaches for it, and today's session reached for both. Moving them untouched is the cheapest possible move: no editing, no judgment, nothing lost by trimming wrongly. ov's memory has nowhere to say what is owed — `decisions.md` holds rationales, `controls.md` holds design — and that missing home is exactly why handoff keeps getting written. And the ratchet is already being broken while they stay outside: this session wrote a summary into handoff.md today, into a file on the death list.

  Against: "as is" imports history, which the migration rules forbid (changed to inception, on 28 August 2026). `code debt.md` is 390 lines, of which 315 are its done section — 292 finished checkboxes against 27 unchecked. Git already holds that work and the log holds what is recent. Size: at 390 lines it breaks the ~100-line truth limit four times over, and any `use_when` broad enough to be useful would eat the orientation budget. Duplication: handoff's "where it stands" and `index.md`'s current-state paragraph would both claim one topic, as would handoff's open items and the log's `Q:` lines — two files claiming one topic is the bug the design names. And handoff is a journal by nature: dated, narrative, rewritten each session. That is what `log.md` is; a truth file rewritten wholesale every session is a log wearing the wrong name.

  A middle path, if wanted: `code debt.md` becomes `truth/debt.md` holding only the 27 unchecked items and its done section stays behind, abandoned in place; handoff stops being a file at all — its "what to do next" becomes the current-state paragraph in `index.md` plus `Q:` lines in the log.

  Deciding question: is "as is" worth importing 292 finished checkboxes, or is the point of the move that these two files finally stop being a second system?
