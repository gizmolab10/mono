---
kind: howto
title: "Workflow"
description: "The turn-taking cadence and the propose-before-acting discipline."
tags: [now, session, team]
date: 2026-07-07
---
# Workflow

See [motive.md](../philosophy/use%20ai.md) for the origin story and philosophy behind this system.

## Cadence

Turn-taking. Jonathan moves, co responds, Jonathan reads, Jonathan decides, co acts. Forward progress made out of small, careful, deliberate moves — not sweeping leaps.

**Roles**
    Jonathan frames the question and decides about proposals and visual feedback.
    Co researches, analyzes, proposes. In small increments. Tests, code, request visual feedback.

Claude's query-response is best for Jonathan if it is precise, concise, and easy to comprehend. Long responses are wasted on him. Explanations irrelevant until asked for.

Living notes at [[cadence]].

## The structure

- `notes/guides/` — living reference (style, patterns, how-tos)
- `notes/work/` — ALL work is recorded here, as we go
- `CLAUDE.MD` — entry point, tells Claude where to start

## One truth, one place

Guides encode decisions, grouped by topic. CLAUDE.MD is the entry point, the large scale map. Don't duplicate — reference.

## Starting work

When asked to "work on X":

1. Check if `notes/work/X.md` exists
2. If yes → read and resume
3. If no → create it with problem/goal/phases structure

## Opening a proposal

Two lines before anything else: what we already have, and the one piece we do not.

```text
we will rely on some stuff we have

1. renderer
2. asset awareness
3. html injector      <- we need this one
```

Jonathan wrote that at the top of the photo-gallery proposal; mine had the new piece buried inside a
paragraph three sections down, where it read as a step rather than as the work. The list makes the
whole shape plain: two things to lean on, one thing to build.

Check every name on the list before writing it down. He had to ask whether all three existed, and
one of them did not.

## Work file structure

```markdown
# Title
**Started:** YYYY-MM-DD
**Status:** Phase N in progress

## Problem
What we're solving.

## Goal
What success looks like.

## Phase 1: Name
- [ ] Task
- [ ] Task

## Next Action
**Phase N:** Specific next step
```

Update status and checkboxes as work progresses.

## The handoff pieces

The living work of a project sits in its work area — `notes/work/` for a light project (flat), `notes/work/now/` for a larger one. A small set of files, each with one job:

- **`handoff.md`** — current status and the single **Next** action, the baton; read first each session.
- **`code debt.md`** — open coding tasks, as checkboxes.
- **`code debt paid.md`** — finished tasks, archived out of code debt (alternate location: 'done' subsection of code debt)
- **`work journal.md`** — reverse-chronological log of implemented (and tested as successful) proposals.
- **`working features.md`** — reverse-chronological list of what currently works.

When to move things between these — done work to the journal, the active surface kept short — is [keep shop](keep%20shop.md)'s job.

Two more are reference, kept in the project's `guides/` (`guides/` for a light project, `guides/project/` for a larger one):

- **`map of <X> files.md`** — the source file map, ALWAYS updated when files move.
- **`map of <X> guides.md`** — same for guides.

**Locations vary; `done` and `up` don't care.** They act on whichever of these a project has, wherever it keeps them — so ji (flat in `notes/work/`, `guides/` sibling to work) and di (active files in `notes/work/now/`, maps under `guides/project/`) are both handled without hard-coding either path.

**Minimal set.** A new project needs only `code debt.md` to start — a list of what to build. Add `handoff.md` once sessions span more than one sitting, then add other files as the project needs them.

### Template guides (di) — where things sit

di is the model these rules came from. It predates them and drifted; on 2026-08-20 it was brought
into line, and this is the settled layout:

- The road map is reference, not active work, so it sits in `notes/designs/`, where ji keeps its own.
- The three maps — files, guides, notes — sit together in `guides/project/`.
- Work file names are spaced, never dotted: `code debt.md`, `code debt paid.md`.

## Finishing work

When work is complete, one of two destinations:

| Destination | When | Example |
|-------------|------|---------|
| `notes/work/done/` | Task is finished, doc is historical record | svelte.md, quaternions.md |
| `notes/guides/` | Doc becomes living reference for future work | testing.md |

## Tidying up

Reorganize and merge files so each has one clear job — removing duplication, sharpening purpose, finding the right home for each piece. (For changing a single doc, see Safe updating below.)

**The process:**

1. Read what exists
2. Spot overlap and blur
3. Propose cleaner splits
4. Move or merge until each file has one clear job
5. Trim dated material and work-in-progress hedging

**The goal:** Fewer files, clearer purposes, easier to find things, easier to maintain. Less confusion for both co and Jonathan.

## Safe updating

When updating a work doc — milestones, notes, plans — keep its content intact. (For reorganizing across files, see Tidying up above.)

1. **Reorder, don't remove.** Move sections around to improve flow — never delete material.
2. **"Propose a rewrite" means propose.** Present the plan, wait for approval before touching the file.
3. **Summarize by adding, not replacing.** If a synopsis or summary would help, add it alongside the original — don't compress the original into it.
4. **Design notes are not clutter.** Type definitions, rationale, lifecycle rules, error source mappings — these are decisions, not noise. They stay.
5. **When in doubt, add a section.** A new "synopsis" or "open items" section at the top costs nothing. Gutting the middle to make room costs everything.

## Fixing friction before the work

Sometimes the real task stalls not on the problem but on how co and Jonathan work together. The usual causes: words co uses with no agreed meaning, over-confident wrong reads that fight what Jonathan plainly sees, or a check that fires on the wrong thing. When the same friction derails turn after turn, pause the task and fix it at its source — that friction taxes every later turn, the task included, so the fix is an investment, not a digression.

How to run such a pause:

1. **Trust what Jonathan observes** over co's reasoning and over the logs (BOTH are often WRONG).
2. **Fix the cause, not a symptom.** ALWAYS formulate ONE source of truth. Assure that the rule and the tool that enforces it cannot drift apart.
3. **Write the lesson down as a rule** so it outlives the session — for example, "NEVER use a word with no agreed, shared meaning; ALWAYS FIRST propose it for the lexicon."
4. **Allow pauses and tangents.** A translate-fix is a temporary aside. In the current project's [[handoff]] file, record where the real task was paused — from which it can resume.

## Regular review

Are these guides effective and intelligible? Are they smooth, engaging and gentle? Are they brief and precise?

Jonathan can only read a little at a time and immediately his comprehension plummets. This is not good. Makes him wonder how many of these files are doing what was intended, or indeed ANYTHING useful. Of course they MUST be readable by him.

Journal it here. Jonathan will read the first bit of this file. first he will ask claude to read it. then he will edit it until it makes sense. then he will ask claude to compare and to learn from his example. Thus...

### Grow the guides the way the lexicon grows

Evidence so far suggests that Jonathan cannot describe what is optimal. Rules and more rules end up tangled rather than dialing in. Our lexicon experiment tells us that when you record each correction I give you, you can use it to grow the lexicon, and that your responses have gotten easier for me enough to stay in the flow.

This same growth strategy will work for the guides, for one reason: every lexicon entry comes from a correction Jonathan actually made, in his preferred words.

**1.** When Jonathan corrects me, that correction becomes one line of a guide, in the words he used. It happens immediately.

**2.** However, before adding that line, look for a line already saying something close. If there is one, the new line takes its place. So a guide holds about as many lines as you have made distinct complaints, and never more.

**3.** Adding and removing will hopefully improve communication in general, and also specifically with his understanding of each rule.

### Read cadence — Added to [[response]] item 12 — on 2026-08-20

Roles say what we do. Two duplicates of [[agency]] item 8 were cut. Replies: precise, concise, unexplained.

## Diagnostic logging

See the diagnostic-logging rule in the always files — always.md item 7.

## Writing design documents

See [design.md](create%20a%20design.md).
