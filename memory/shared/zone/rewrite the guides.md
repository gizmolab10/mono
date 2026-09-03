---
kind: analyze
title: Rewrite the guides
description: remove murk from documentation
tags:
  - now
date: 2026-09-03
---
# Rewrite the guides

Jonathan and co worked on [[always]] for a long time. we achieved a very significant improvement. that's the good news. the bad news is Jonathan worked closely with co throughout. The goal — give co enough rules to do it solo.

## Mechanical sweep — solo now

Rule #1 in [[agency]] is relaxed to allow access to and work in a worktree. Sweep every comment and every md file for — banned words and lexicon. Jonathan is asked nothing during the sweep.

**Success criteria.** Every banned word is gone from the 681 md files and from the 13,475 comment lines in the 841 ts and svelte files, or is named in a report with the reason it stayed. `yarn vitest` and `yarn svelte-check` pass in every project afterwards. Every change is one **worktree** `git commit` — each can be undone with a `git revert`.

**What is being fixed.** Four things, in this order, each one measurable:

1. The 41 rows of the `banned-words` table — where the replacement word sits, so no deliberation is needed.
2. The words the lexicon settles — co, Jonathan, path, gap, hierarchy, details, register, and the rest.
3. A stand-in word whose subject was named more than one sentence back — it, them, they, this, that, those, there. This includes nouns that have no clear reference — the table, the handler.
4. A word Jonathan asked co to translate: co gave the plain version on screen, and the file still holds the murky one. Write the plain version into the file.

**How co runs without supervision.** A second Claude Code session, in a separate git worktree — by creating a branch off of `main`, so nothing moves under Jonathan while he works in this one. Co does the sweep and commits on a branch, NO COMMITS into the main branch. When this is done Jonathan merges the branch, or drops it, or reverts any single commit inside it.

**What co writes as it goes.** One report at `notes/work/big rewrite log.md`: every file touched, including `memory/`, every word swapped, and every place where the banned-words table named no replacement and the sentence had to be rewritten. That last list is the one worth reading — a swap is mechanical, a rewrite is a judgment, and each of those judgments is a line Jonathan may want back.

**What co must not do.** Rename anything. Reformat indentation. Rewrite a quoted code snippet, a shell sample, or the fixed co's utterances (eg, I AM GUESSING and I can prove this). Touch a file under `node_modules/`.

**Cost.** The sweep reads 1,522 files. The risk is not the swap but the rewrite: where the table names no replacement, a sentence is rewritten and its meaning can drift. The report is what makes that reviewable, and the per-folder commits are what make it revertible.

**Answered 1 September 2026.** `plain-english-check.sh` now reads the banned-words tables and the lexicon, so a banned word written into a file is reported on the next turn. The sweep no longer has to do this bit in future; it only has to clean up what came before.

## Sentence-level translation — solo soon

**Sentence-level translation** — murky wording to plain, in place.

Today Jonathan's edits followed roughly every third translation. When a full session of translations goes by **without** Jonathan rewriting one, this layer is solo-ready. CO IS GUESSING at pace: three to five more sessions like today's, and only if the lesson rate falls — today produced fifteen recorded lessons, which is not a curve that has flattened.

## Files that contain rules — requires full collaboration

**Rule and guide prose** — writing the rules themselves: never solo, by Jonathan's own design. [[agency]] rule 20 says the rewrite is the decision and Jonathan finishes it. Today Jonathan rewrote nearly every rule co drafted, including the ones co drafted about not needing rewrites.

Injected every turn or in rotation (mono-pre-flight + shared-t):

1. [always.md](../../../notes/guides/pre-flight/always.md) (mono-pre-flight) — the nine
2. [response.md](../../../notes/guides/pre-flight/response.md) (mono-pre-flight) — 9 reply rules
3. [agency.md](../../../notes/guides/pre-flight/agency.md) (mono-pre-flight) — 21 work rules
4. [lexicon.md](../../../notes/guides/pre-flight/lexicon.md) (mono-pre-flight) — the word rules
5. [conventions.md](../truth/conventions.md) (shared-t) — about 30 conventions

Read on trigger and at session start (mono-pre-flight):

6. [banned words.md](../../../notes/guides/pre-flight/banned%20words.md) — the table the hooks grep
7. [keywords.md](../../../notes/guides/pre-flight/keywords.md) — which words trigger which guide
8. [shorthand.md](../../../notes/guides/pre-flight/shorthand.md) — Jonathan's short commands
9. [kinds of tasks.md](../../../notes/guides/pre-flight/kinds%20of%20tasks.md)

Per project (each project's pre-flight):

10. di: [always.md](../../../di/notes/guides/pre-flight/always.md), [lexicon.md](../../../di/notes/guides/pre-flight/lexicon.md), [banned words.md](../../../di/notes/guides/pre-flight/banned%20words.md), [banned.md](../../../di/notes/guides/pre-flight/banned.md)
11. ji: [lexicon.md](../../../ji/notes/guides/pre-flight/lexicon.md)
12. ov: [banned words.md](../../../ov/notes/guides/pre-flight/banned%20words.md)
13. core: [banned words.md](../../../core/notes/guides/pre-flight/banned%20words.md)

Rules about working:

14. [CLAUDE.md](../../../CLAUDE.md) (mono) — principles, defaults, reading on load
15. [handbook.md](../truth/handbook.md) (shared-t) — the memory system's rules
16. [learn.md](../../../notes/work/learn.md) (mono-work) — past mistakes as rules-in-waiting

at session start (CLAUDE.md names them):

17. [gates.md](../../../notes/guides/pre-flight/gates.md)
18. the fifteen guides in [collaborate](../../../notes/guides/collaborate/) (mono-collaborate) — voice, chat, workflow, hooks, cadence and the rest

at session start (CLAUDE.md names it), and again after every correction from Jonathan ([[agency]] rule 17) and from [[keywords]].md when Jonathan types "doesn't exist", "not found" or "which one"

19. [pitfalls.md](../../../notes/guides/pre-flight/pitfalls.md)

