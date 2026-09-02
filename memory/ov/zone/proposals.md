---
kind: analyze
title: "Proposals"
description: "ov proposals — each being weighed or driven; one leaves when it becomes the drive, dissolves into truth, or dies."
tags: [now, weighed]
date: 2026-08-31
---
# Proposals

## proposal: every project moves into mono/projects (1 September 2026)

**Success criteria.** Every app still starts with `yarn dev` from its own folder and serves on the port it served on before. `yarn vitest` passes in core, ov and lv with no test edited except the ones that spell a path. Every cross-collection link inside the notes still resolves — the dead-link report finds no more than it found the day before. ov's file list shows the same count of files under the same project names.

**What moves.** Thirteen folders at the top of the repo are projects: core, di, ga, gallery, ji, lv, ma, me, mj, mu, ov, s3, ws. They go into a new `projects/` folder, a sibling of `memory/`. What stays at the top: `memory`, `notes`, `logs`, `package.json`, `yarn.lock`, `node_modules`, `CLAUDE.md`, `README.md`.

**Why.** The top of the repo mixes three unlike things — the projects, the shared material, and the tooling — and nothing says which is which. `memory/` already gathers one kind under one name; `projects/` does the same for the other. It also makes the shared collection nameable: today the shared files sit at the repo's top with no folder of their own, which is why ov calls that collection `mo` and treats the repo root as its root. The idea's own sub-item — a `projects/shared` holding `notes` — follows from the move rather than being a separate act.

**What has to change with it**

1. `package.json` — `workspaces.packages` names ten folders bare; each becomes `projects/<name>`. The nohoist patterns name the package, not the folder, so they are untouched.
2. Every cross-collection link in the notes. A guide reaches a sibling project as `../../../<name>/...`, counting from the repo top. One more folder makes it `../../../../<name>/...` for a project-to-project link, while a project-to-shared link keeps its depth only if `notes` moves too. This is the largest part of the work and the one that can be measured — the dead-link report is the measurement.
3. ov's own path arithmetic. `T_Bundle` names each collection by its folder, and `project_of` reads a memory file's first folder against that list; both keep working, since the names do not change. What changes is where the app roots each collection, and `following_links.test.ts` spells the old depths.
4. The hub dispatcher and the hooks. `inject-always.sh` builds `$REPO/$PROJECT/notes/...` and scans `$REPO/*/notes/guides`; both gain `projects/`. The `/p` skill checks `~/GitHub/mono/<name>/`.
5. `CLAUDE.md` and the guides that spell paths.

**Cost.** One rename of thirteen folders, then a re-pointing pass whose size is the number of relative links between collections. `git mv` keeps the history. The risk is not the move but the links, and the dead-link report already exists to say when they are right.

**Open question.** Does `notes` move into `projects/shared`, or does it stay at the top? Moving it makes every collection a folder under one parent and gives `mo` a real name; leaving it keeps every project-to-shared link at the depth it has today. The two cannot both be had.

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

Seventeen of the nineteen utility files hand out loose functions, so the editor's frame opens with nineteen import lines. Gather each file's functions into one exported thing, so a caller names the file, not every function: `export const labels = { labels_from, label_block, has_labels, blank_file };` Open: a class or one gathered object (no state either way — Colors and SVG_Paths, which hold classes, should end the same structure as the rest); whether `labels.from` reads better than `labels_from`; and one file first, looked at, before the rest.
