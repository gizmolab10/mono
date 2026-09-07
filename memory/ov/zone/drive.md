---
kind: analyze
title: "Drive"
description: "The one proposal being decided and implemented; it dissolves into truth when done."
tags: [now, weighed]
date: 2026-09-07
---
# Drive

## every old guide moves from notes into truth

Refined by [consolidate.md](consolidate.md), 7 September 2026, which sorts the 142 into truth, fold, archive, zone, ws's manual and dead, folder by folder. All 19 folders moved whole into `truth/` the same day — the mechanical half of this drive. The sorting itself (fold/archive/dead) has not been carried out; every guide sits in `truth/` unsorted.

### **Success criteria**

No `memory/<project>/notes/guides/` folder remains. Every guide that was in one sits in that project's `truth/`, or is named dead in the project's log with a D: line. Every link into a moved guide resolves — the dead-link report finds no more than it found the day before. CLAUDE.MD's reading-on-load list, the hooks and the maps name the new places. ov lists the same files under the same projects. `yarn vitest` 336 pass, `yarn svelte-check` clean, the dispatcher's 32 tests pass.

### **What moves**

142 guides in 16 folders across 7 projects: ws architecture 29, di architecture 29, shared develop 24, shared collaborate 14, ws manuals 9, di project 6, shared setup 5, shared tools 4, ov design 4, core design 4, shared philosophy 3, ji specifications 3, di development 3, ws collaborate 2, shared test 2, ji setup 1. The idea's own list — manual, milestones, features, components, architecture, design — names ws's manuals, the two architecture folders and the two design folders; milestones is a work folder, not a guides folder, and the working features files are in truth already.

### **The scheme**

1. `git mv` each guides folder's sub-folders into `truth/`, whole, keeping their names: `truth/architecture/`, `truth/develop/`, `truth/collaborate/` and so on. The folder index files go.
2. The link pass used for the notes and pre-flight moves re-points every link by resolving it against its file's old place.
3. Readers: CLAUDE.MD's `memory/shared/notes/guides/collaborate/` line and its exclude.md line; keywords.md's rows, which name guides as `develop/...` and `collaborate/...`; the maps of di, ji, lv and ws; the catalogs.
4. ov: `site_of_file` and `file_path_of` build a guide's path under `notes/guides/`; a moved guide is a memory file, answering to its project by `project_at` as the truths do now. The `is_design` split reads `notes/designs/`, which stays.

### **What it collides with**

The handbook's inception bullet: a moved notes folder is still the old notes, and "its truths enter truth/ one at a time, the day work reaches for them". This moves all 142 at once. And truth is one level of files today, each about one concept and about a hundred lines; 142 guides in named sub-folders make it a tree.

### **Cost**

Sixteen `git mv`, one link pass, the readers above, and one rewrite of the handbook's inception bullet. History kept.

### **Deciding question**

Does truth take sub-folders — `truth/architecture/…`, `truth/develop/…` — or do the 142 flatten into truth's one level, name collisions resolved by hand? Decided 7 September 2026: sub-folders. What remains is consolidate.md's sorting and its two other questions.
