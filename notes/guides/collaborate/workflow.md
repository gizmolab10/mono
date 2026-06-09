# Workflow

See [motive.md](../philosophy/motive.md) for the origin story and philosophy behind this system.

## Cadence

Turn-taking. Jonathan moves, co responds, Jonathan reads, Jonathan decides, co acts. Forward progress made out of small, careful, deliberate moves — not sweeping leaps.

**Roles.** Jonathan frames the question and decides. Co researches, traces, proposes, and — on explicit green light — builds. Co has wide capabilities but uses them only when pointed at them.

**Propose-first.** "Propose" means describe the plan and do nothing else. The one exception is actions Jonathan has already asked for in the same turn — a skill argument like "and update handoff" runs immediately alongside the proposal. Code changes still wait for a go.

**Questions are not orders.** "How will you do X?" asks for a description, not the action itself. Describe and wait.

Living notes at [../../../di/notes/work/cadence.md](../../../di/notes/work/cadence.md).

## The Structure
- `notes/guides/` — living reference (style, patterns, how-tos)
- `notes/work/` — ALL work is recorded here, as we go
- `CLAUDE.MD` — entry point, tells Claude where to start

## One Truth, One Place

Guides encode decisions, grouped by topic. CLAUDE.MD is the entry point, the large scale map. Don't duplicate — reference.

## Starting Work
When asked to "work on X":
1. Check if `notes/work/X.md` exists
2. If yes → read and resume
3. If no → create it with problem/goal/phases structure

## Work File Structure
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

## Finishing Work
When work is complete, one of two destinations:

| Destination | When | Example |
|-------------|------|---------|
| `notes/work/done/` | Task is finished, doc is historical record | svelte.md, quaternions.md |
| `notes/guides/` | Doc becomes living reference for future work | testing.md |

## Tidying up

Refining documentation by removing duplication, sharpening purpose, and finding the right home for each piece.

**The process:**

1. Read what exists
2. Spot overlap and blur
3. Propose cleaner splits
4. Move or merge until each file has one clear job
5. Trim dated material and work-in-progress hedging

**The goal:** Fewer files, clearer purposes, easier to find things, easier to maintain. Less confusion for both co and Jonathan.

## Safe Updating

When updating a work doc (milestones, notes, plans):

1. **Reorder, don't remove.** Move sections around to improve flow — never delete material.
2. **"Propose a rewrite" means propose.** Present the plan, wait for approval before touching the file.
3. **Summarize by adding, not replacing.** If a synopsis or summary would help, add it alongside the original — don't compress the original into it.
4. **Design notes are not clutter.** Type definitions, rationale, lifecycle rules, error source mappings — these are decisions, not noise. They stay.
5. **When in doubt, add a section.** A new "synopsis" or "open items" section at the top costs nothing. Gutting the middle to make room costs everything.

## Diagnostic Logging

Every time you add new code, also add ample diagnostic logging that prints enough information to verify what goes right and what goes wrong. For every decision the code makes (filter, threshold, branch), the log must carry the actual values that drove the decision — the measured number, the input, the chosen path — not just a name. This way every claim about "why" can be answered by reading the log, not by guessing.

Log lines must be readable by a human who does not know the code — use real names (e.g. ALPHA, BETA), descriptive labels (e.g. edge CG, face ABCD), and short sentences, not key dumps.

## Writing Design Documents

See [design.md](creating%20a%20design.md).
