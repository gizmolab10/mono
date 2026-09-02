---
kind: analyze
title: "Drive"
description: "The current drive: make the handbook fully implemented — where the law and the files disagree."
tags: [now, weighed]
date: 2026-08-31
---
# Drive

## proposal: unmurk every bit of our documentation

Sweep every comment and every md file for the words we have settled (1 September 2026

**Success criteria.** Every banned word is gone from the 681 md files and from the 13,475 comment lines in the 841 ts and svelte files, or is named in a report with the reason it stayed. `yarn vitest` and `yarn svelte-check` pass in every project afterwards. Every change is one git commit that `git revert` undoes on its own. Jonathan is asked nothing while it runs.

**What is being fixed.** Four things, in this order, each one measurable:

1. The 41 rows of the `banned-words` table — where the replacement word sits, so no deliberation is needed.
2. The words the lexicon settles — co, Jonathan, path, gap, hierarchy, details, register, and the rest.
3. A stand-in word whose subject was named more than one sentence back — it, them, they, this, that, those, there. This includes nouns that have no clear reference — the table, the handler.
4. A word Jonathan asked co to translate: co gave the plain version on screen, and the file still holds the murky one. Write the plain version into the file.

**How it runs without supervision.** A second Claude Code session, in its own git worktree off `main`, so nothing moves under Jonathan while he works in this one. It does the sweep on a branch, NO COMMITS. When it is done he merges the branch, or drops it, or reverts any single commit inside it.

This is the one place agency #1 is relaxed to allow a worktree.

**What it writes as it goes.** One report at `notes/work/big rewrite log.md`: every file touched, including `memory/`, every word swapped, and every place where the banned-words table named no replacement and the sentence had to be rewritten. That last list is the one worth reading — a swap is mechanical, a rewrite is a judgment, and each of those judgments is a line Jonathan may want back.

**What it must not do.** Rename anything. Reformat indentation. Rewrite a quoted specimen, a shell sample, or the fixed utterances I AM GUESSING and I can prove this. Touch a file under `memory/`, `.claude/worktrees/` or `node_modules/`.

**Cost.** The sweep reads 1,522 files. The risk is not the swap but the rewrite: where the table names no replacement, a sentence is rewritten and its meaning can drift. The report is what makes that reviewable, and the per-folder commits are what make it revertible.

**Answered 1 September 2026.** `plain-english-check.sh` now reads the banned-words tables and the lexicon, so a banned word written into a file is said on the next turn. The sweep no longer has to build that; it only has to clean up what came before.
