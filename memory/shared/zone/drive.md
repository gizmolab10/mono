---
kind: analyze
title: "Drive"
description: "The current drive: make the handbook fully implemented — where the law and the files disagree."
tags: [now, weighed]
date: 2026-08-31
---
# Drive

## proposal: sweep every comment and every md file for the words we have settled (1 September 2026)

**Success criteria.** Every banned word is gone from the 681 md files and from the 13,475 comment lines in the 841 ts and svelte files, or is named in a report with the reason it stayed. `yarn vitest` and `yarn svelte-check` pass in every project afterwards. Every change is one git commit that `git revert` undoes on its own. Jonathan is asked nothing while it runs.

**What is being fixed.** Four things, in this order, each one measurable:

1. The 41 rows of the banned-words table — the word to use is written in the row, so the swap needs no judgment.
2. The words the lexicon settles — co, Jonathan, path, gap, hierarchy, details, register, and the rest.
3. A stand-in word whose subject was named more than one sentence back — it, them, they, this, that, those, there.
4. Wording that a `t` has already replaced in a reply but never in the file it came from.

**How it runs without supervision.** A second Claude Code session, in its own git worktree off `main`, so nothing moves under Jonathan while he works in this one. It does the sweep on a branch, one commit per folder, and never touches `memory/` — that is his to commit. When it is done he merges the branch, or drops it, or reverts any single commit inside it.

This is the one place agency #1 has to bend: it says never the worktree, because the file co edits must be the file Jonathan opens. Here the whole point is that they are different files, and the worktree is thrown away the moment the branch is merged.

**What it writes as it goes.** One report at `notes/work/swept.md`: every file touched, every word swapped, and every place where the table gave no replacement and the sentence had to be rewritten. That last list is the one worth reading — a swap is mechanical, a rewrite is a judgment, and each of those judgments is a line Jonathan may want back.

**What it must not do.** Rename anything. Reformat indentation. Rewrite a quoted specimen, a shell sample, or the fixed utterances I AM GUESSING and I can prove this. Touch a file under `memory/`, `.claude/worktrees/` or `node_modules/`.

**Cost.** The sweep reads 1,522 files. The risk is not the swap but the rewrite: where the table names no replacement, a sentence is rewritten and its meaning can drift. The report is what makes that reviewable, and the per-folder commits are what make it revertible.

**Open question.** Does the same session also teach `plain-english-check.sh` to read the banned-words table, so the fault stops coming back? Today that hook carries a hard-coded list of twenty di identifiers and has never read the table or the lexicon — which is why "stands" went into a guide this afternoon.

## Fully implement the [[handbook]]

Where that content and the files disagree:

- [ ] Pros and cons still says pacs go to `zone/decisions.md`; they live in `truth/decisions.md` — the four-doors question, unresolved.
- [ ] Design churn says `decisions.md` holds one-line rationales, ~10, deleted when final; shared's holds multi-paragraph pacs, decided ones kept, well past the cap.
- [ ] Inception says "keep `truth/inception.md` current"; the file lives in shared/zone under another name.
- [ ] Hooks — the enforcement the handbook describes still reads the old notes, and does not run in a Cowork session at all.
- [ ] The truth cap: the moved maps break ~100 lines (ov's at 146) — the promised settle-cuts have not begun, and the map-upkeep step has never yet run at a settle.
- [ ] Zone names `zone/ref/` for visual references; no project has one. And `drive.md` existed nowhere while a drive was in flight — this file is the first.

**Where it stands:** the list is drawn; nothing on it is resolved.
