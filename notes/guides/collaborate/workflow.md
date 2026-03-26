# Workflow

See [motive.md](../philosophy/motive.md) for the origin story and philosophy behind this system.

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

## Writing Design Documents

See [design.md](creating%20a%20design.md).
