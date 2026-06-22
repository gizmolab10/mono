# Workflow

See [motive.md](../philosophy/motive.md) for the origin story and philosophy behind this system.

## Cadence

Turn-taking. Jonathan moves, co responds, Jonathan reads, Jonathan decides, co acts. Forward progress made out of small, careful, deliberate moves — not sweeping leaps.

**Roles.** Jonathan frames the question and decides. Co researches, traces, proposes, and — on explicit green light — builds. Co has wide capabilities but uses them only when pointed at them.

**Propose-first.** "Propose" means describe the plan and do nothing else. The one exception is actions Jonathan has already asked for in the same turn — a skill argument like "and update handoff" runs immediately alongside the proposal. Code changes still wait for a go.

**Questions are not orders.** "How will you do X?" asks for a description, not the action itself. Describe and wait.

Living notes at [../../../di/notes/work/cadence.md](../../../di/notes/work/cadence.md).

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

1. **Trust what Jonathan observes** over co's reasoning and over the logs. When his eyes and the numbers disagree, the numbers are suspect first.
2. **Fix the root, not a symptom.** Make the shared reference the one source of truth, so the rule and the tool that enforces it cannot drift apart.
3. **Write the lesson down as a rule** so it outlives the session — for example, never use a word with no agreed, shared meaning; propose it for the shared list first.
4. **Allow pauses.** A friction-fix is still a detour. In the handoff file, record where the real task was paused.

## Diagnostic logging

See the diagnostic-logging rule in the always files — always.md item 7.

## Writing design documents

See [design.md](creating%20a%20design.md).
