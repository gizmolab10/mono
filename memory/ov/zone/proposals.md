---
kind: specify
title: "Proposals"
description: "ov proposals — each being weighed or driven; one leaves when it becomes the drive, dissolves into truth, or dies."
tags: [now, weighed]
date: 2026-08-31
---
# Proposals

## proposal: the work journal moves into memory (7 September 2026)

**Success criteria.** `memory/ov/notes/work/work journal.md` is gone from memory/ov/notes/work and sits in memory/ov, whole, its 52 entries unchanged. The map names its new path. The done row in shorthand.md sends ticked items to the file where it now is, and the handbook's inception rule — write nothing new into the old notes — no longer collides with it. Every link that named the old path resolves.

**Where in memory.** `memory/ov/archive/work journal.md`. The handbook names archive/ as the home for a no-longer-current, carefully composed file: kept readable, never loaded at start, no sizing limit. The journal is 78k and is history by its own brief, "what has been finished, newest first", which the design keeps out of truth/. The other choice is the project root beside log.md, as a second record of what happened; that puts two histories a folder apart, and the handbook's sizing table would have to except it.

**What changes with it.** The map's journal line, one link. The done row's target. The handbook's inception list of what still lives only in the old notes, if it names the journal. ov's browse shows the file under memory/ov once it moves, since memory files answer to their project.

**Open.** Whether done writes new entries into the moved journal, or the log's D: lines and the settle are the record of finished work and the journal is closed at its last entry, 19 August 2026.

## proposal: the form's controls section moves into the top row (5 September 2026)

**Success criteria.** In edit, the row across the top holds, right of the back button, a section on `--bg` with a thick upright line at its left, holding exactly what the form's controls section holds today: the count, the steppers, the folders, the name field, the four buttons and the delete question. The dispatcher and build buttons are not drawn in edit; in browse the row is as today. The form's stack has five sections, and 'more' folds them all. Every press does what it did: step, rename, new, Obsidian, send, delete; the section's bare space is the way out and lights with the label rows. svelte-check clean, ov's tests pass, confirmed on screen.

**What moves**, from Edit.svelte into Controls.svelte: the row's markup, `typed_name` and `handle_rename`, `asking_to_delete` and `handle_delete`, `handle_create`, `handle_obsidian`, `handle_send`, the two effects, and the rules for the head, the count, the folders, the spacers, the buttons, the question and the name. Controls reads the file from `w_viewed` and the stepping from `w_can_back`, `w_can_forward`, `w_file_back`, `w_file_forward`, `w_file_site` and `step_view`, all in Operations, so Edit passes nothing. Send reads the file's text through `read_file` at the moment of sending, since the text lives in Edit.

**What goes.** Edit_Filters: the `controls` prop and its snippet, `w_show_controls`, `toggle_controls`, `controls_button`, `controls_action`, the 'controls' clickable, and the stack's first section with its `leads`. Edit.svelte: the `controls_rows` snippet and the `.view-top` rules. `T_Preference.show_controls` loses its only user: reported, not removed.

**The section.** Right of the back button, core's Separator drawn `vertical` at `k.thickness.huge`, then a box with `background: var(--bg)` taking the rest of the row, holding the moved row. Its bare space is the `WAY_OUT.top` hit target, a section, pressing back to the list.

**Open.** 1. The stack's leading line, today the controls section's with its clickable: the search section's line becomes the first, its clickable riding it as now. 2. Whether the section's corners are rounded, matching the content box below, or square. 3. The row's height: today the head is `--height` plus a small gap below; in the top row the hamburger and back button set it.

**Cost.** Controls.svelte grows by the whole row, Edit.svelte shrinks by the same; Controls gains imports from Files, Saving and the File types.

**Decided**, 5 September 2026: the search section is the stack's first; the section's corners are rounded; the hamburger sets the row's height, and the back button is two pixels smaller. Built in Controls.svelte, Edit.svelte, Operation.svelte and Edit_Filters, svelte-check and ov's tests clean, awaiting the screen. `T_Preference.show_controls` has no user left: reported, not removed.

## proposal: every project moves into mono/projects (1 September 2026)

Weighed again 7 September 2026 in shared's truth/decisions.md, after the notes and tools moves: item 2 below is now the 383 links from memory into the project folders, item 4 the dispatcher, servers.sh and two hooks, and lv's and gallery's Netlify base folder is set outside the repo. Undecided.

**Success criteria.** Every app still starts with `yarn dev` from its own folder and serves on the port it served on before. `yarn vitest` passes in core, ov and lv with no test edited except the ones that spell a path. Every cross-collection link inside the notes still resolves — the dead-link report finds no more than it found the day before. ov's file list shows the same count of files under the same project names.

**What moves.** Thirteen folders at the top of the repo are projects: core, di, ga, gallery, ji, lv, ma, me, mj, mu, ov, s3, ws. They go into a new `projects/` folder, a sibling of `memory/`. What stays at the top: `memory`, `notes`, `logs`, `package.json`, `yarn.lock`, `node_modules`, `CLAUDE.md`, `README.md`.

**Why.** The top of the repo mixes three unlike things — the projects, the shared material, and the tooling — and nothing says which is which. `memory/` already gathers one kind under one name; `projects/` does the same for the other. It also makes the shared collection nameable: today the shared files sit at the repo's top with no folder of their own, which is why ov calls that collection `mo` and treats the repo root as its root. The idea's own sub-item — a `projects/shared` holding `notes` — follows from the move rather than being a separate act.

**What has to change with it**

1. `package.json` — `workspaces.packages` names ten folders bare; each becomes `projects/<name>`. The nohoist patterns name the package, not the folder, so they are untouched.
2. Every cross-collection link in the notes. A guide reaches a sibling project as `../../../<name>/...`, counting from the repo top. One more folder makes it `../../../../<name>/...` for a project-to-project link, while a project-to-shared link keeps its depth only if `notes` moves too. This is the largest part of the work and the one that can be measured — the dead-link report is the measurement.
3. ov's own path arithmetic. `T_Bundle` names each collection by its folder, and `project_of` reads a memory file's first folder against that list; both keep working, since the names do not change. What changes is where the app roots each collection, and `following_links.test.ts` spells the old depths.
4. The hub dispatcher and the hooks. `inject-always.sh` builds `$REPO/memory/$PROJECT/notes/...` and scans `$REPO/memory/*/notes/guides`; since 7 September 2026 neither names a project folder, so neither changes. The `/p` skill checks `~/GitHub/mono/<name>/`.
5. `CLAUDE.md` and the guides that spell paths.

**Cost.** One rename of thirteen folders, then a re-pointing pass whose size is the number of relative links between collections. `git mv` keeps the history. The risk is not the move but the links, and the dead-link report already exists to say when they are right.

**Open question.** Does `notes` move into `projects/shared`, or does it stay at the top? Moving it makes every collection a folder under one parent and gives `mo` a real name; leaving it keeps every project-to-shared link at the depth it has today. The two cannot both be had.

## proposal: code debt belongs in the zone, like ideas (28 August 2026)

An owed item is an idea that has been accepted but not yet done. The zone already holds ideas — things captured without being believed — and the debt list is the same kind of thing at a later point on the same arc: accepted, waiting, not yet true of the code. So it stays in `zone/`, beside `ideas.md`, and never becomes a truth. Truth files say what the code IS; a debt list says what it is not.

That is what the move on 27 August already did, by hand. This proposal is for making it the design rather than an accident.

**What follows from it**

- **`zone/debt.md` is the one place work is owed.** One file per project. Nothing new is ever written to the old `memory/<project>/notes/work/` files.
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
