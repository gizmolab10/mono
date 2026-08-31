---
kind: analyze
title: "25 August 2026 — a name for the tagset {stow, stale, keep, maybe}"
description: "<!-- ov ideas"
tags: [now, born]
date: 25 August 2026
---
# Ideas

write a proposal for JUST the first unchecked item (ignore all the others) to the top of handoff. success criteria at the top.

sooner or later every project creates a knowledge base and a work manager. this one is free, or is it? can it be made to be easily deployed? plug and play?

## next

- [ ] drag and drop file in browser -> any child goes to folder
- [ ] nudge left 15px -> sep left-side clickables (browse and editor)
- [ ] rename editor -> edit (browse is a verb)
- [ ] drag and drop file in browser -> any child goes to folder
- [ ] add subfolders under truth and zone
    - [ ] ai and design
- [ ] switch back to using **claude code** inside vscode
    - [ ] skills add /project (X)
    - [ ] remove /ov, etc
    - [ ] [[adoption journal]]
    - [ ] [[inception into the new design]]
- [ ] new 'sh' project — toolkit that all my projects can build from
    - [ ] section
    - [ ] separator
    - [ ] hits
    - [ ] constants
    - [ ] configuration
- [ ] read work/md audit (old location)
    - [ ] pac execute it
- [ ] 1127 occurrences of 'guide' -> many should be 'file'
- [ ] too many ts files are class-less
    - [ ] require LOOONG import statements
- [ ] strip of icons to switch between my many apps
    - [ ] localhost only
- [ ] write installation instructions in
    - [ ] [[ov installer]]
- [ ] compose-an-email does not work on Windows
- [ ] hermes agent

## soon

- [ ] not show tt when mouse is swiping
- [ ] replace '+' button with t-cross path
- [ ] OPTION-click turns a tag red, search discards matches to it
- [ ] blank line following checkbox line is missing
- [ ] cannot edit
    - [ ] colon at the end of an H3
    - [x] checkbox text when it has sub items
- [ ] animate tag relayout during window resize and details hide <-> show

- [ ] incorporate source code, hooks and CLAUDE
    - [ ] add more kinds and tags?
- [ ] convert 'search' titled sep -> unicode character (magnifying glass)
- [ ] editor
    - [ ] the title label is not the file name, why?
    - [ ] make 'brief' multi-line, auto-adjust height
    - [ ] add (find and) replace
    - [ ] support for check lists
    - [ ] improved editing of tables
- [ ] button to add a sibling to the current viewed file and open it for editing
- [ ] separator
    - [ ] where do reach and spacer get used?
- [ ] cute: add a link to hub
    - [ ] on all localhost served
    - [ ] upper right corner immediate left of help
- [ ] work has different tags — propose, design, progress, vital — area 'work'
- [ ] checkbox in details preferences to show/hide tooltips
- [ ] click and hold on a header opens the filters. does nothing if they are open

### content

- [ ] bring okf up to date
    - [ ] revise okf.md to read like a guide file
- [ ] do all the guide files read like a guide file?
    - [ ] propose to remove material that is no longer relevant
- [ ] work on murky

## tabled

- [ ] encapsulate in a new file ts/common/okf.md
    - [ ] for open source
    - [ ] ALL the kinds, tags, project 2-char names
    - [ ] and associated logic
- [ ] when a link's target is an anchor, add the anchor to the fifo

Churn

[[my story]]


## a name for the tagset {stow, stale, keep, maybe}

25 August 2026 — What unites the four: a verdict on a file's continued life. Candidates:
- **fate** — what becomes of the file; each tag is one answer. Claude's lean: shortest, every tag reads as one.
- **worth** — whether it still earns its place: keep yes, stale no, maybe undecided, stow yes-but-not-here.
- **future** — the same idea, pointed forward.
- **shelf** — warmer, the physical picture; fits stow best and stale least.

Choosing regroups two tags: stale now lives in fix, stow in progress.

migrate, transfer, organize, shift, decide, route, slot, status

I like 'status'

Claude's chime: in ov, "status" is already taken — the message line along the bottom (Status.ts, Status_Line.svelte). 'One name, one concept.' is a rule in the protocol's prose section: a word may mean only one thing, and a thing may go by only one name. Naming the tagset "status" would give that word two meanings inside ov — the tagset, and the message line at the bottom of the window. Of Jonathan's list, "slot" is the one nothing else claims.

Synonym hunt:
- slot (verb) — *file*, *sort*, *place*, park, shelve, tuck, *fit*, bin, lodge, **assign**. Taken in ov: sort (columns), place (tag placements), fit (fitting tests), file (everywhere).
- assign — give, allot, allocate, appoint, designate, delegate, **earmark**, set aside, hand out, mark for, task, entrust. Plain: give, allot, earmark, set aside.
- earmark — set aside, reserve, *tag*, *flag*, mark, allot, dedicate, save for, **hold** for, book. Tag and flag would be strange names in a tag system.
- hold — *keep*, grip, grasp, carry, **store**, retain, reserve, contain, cradle, clutch, hang onto, set aside. Keep is already one of the four tags.
- store — *stow*, *keep*, **save**, stash, shelve, cache, hold, bank, tuck away, lay in, put by. Stow and keep are both tags inside the set.
- assess — judge, weigh, gauge, rate, size up, appraise, evaluate, measure, take stock, look over. Plain: judge, weigh, gauge, size up.

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
