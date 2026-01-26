# Workflow

My first uses for AI were one-off: gee, how do you do such-and-such? I'd take the advice, often asking for more. Over time, I noticed I was asking the same things repeatedly because I wouldn't remember the answers. So I started asking AI to write concise descriptions of what we did together, in markdown.

The pile grew unmanageable. I asked AI to help: find redundancies, tighten the writing, make it easy to use. What I have now: clean separation of purpose.

Then I asked if these markdown files could be published as a static website. BOOM — up-to-date documentation, something I have NEVER before encountered. And more: a shared context that lets AI pick up exactly where we left off.

See [chat.md](chat.md) for how we interact — roles, requirements, and the division of labor.

## The Structure
- `notes/guides/` — living reference (style, patterns, how-tos)
- `notes/work/` — ALL work is recorded here, as we go
- `CLAUDE.MD` — entry point, tells Claude where to start

## How we Work Together

### Approval Gate

When Jonathan says "y" (or similar approval), collaborator must **output the verification step before any action**:

| Task type | Output before acting |
|-----------|---------------------|
| Refactoring/migration | grep results + full file list |
| Implementation | Quote the relevant plan section |
| Debugging | State hypotheses being tested |

The output is the gate. Jonathan sees it. If it's missing or thin, the step was skipped.

**Why this exists:** Knowing the discipline isn't enough. The gap between knowledge and execution is where failures happen. This gate makes the verification visible—skipping it becomes obvious immediately, not after the build breaks.

### Starting Work
When asked to "work on X":
1. Check if `notes/work/X.md` exists
2. If yes → read and resume
3. If no → create it with problem/goal/phases structure

### Work File Structure
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

### Finishing Work
When work is complete, one of two destinations:

| Destination | When | Example |
|-------------|------|---------|
| `notes/work/done/` | Task is finished, doc is historical record | svelte.md, quaternions.md |
| `notes/guides/` | Doc becomes living reference for future work | testing.md |

### Tidying up

Refining documentation by removing duplication, sharpening purpose, and finding the right home for each piece.

**The process:**

1. Read what exists
2. Spot overlap and blur
3. Propose cleaner splits
4. Move or merge until each file has one clear job
5. Trim dated material and work-in-progress hedging

**The goal:** Fewer files, clearer purposes, easier to find things, easier to maintain. Less confusion for both co and Jonathan.


## Debugging Discipline

See [debugging.md](../test/debugging.md) for the full guide.

**Key principles:**

1. **Verify source first** — check where it comes from before assuming usage is wrong
2. **Be systematic** — form multiple hypotheses, test the complete pipeline

**Anti-patterns:**
- Scattering `console.log` everywhere hoping to spot something
- Jumping to assumptions instead of testing hypotheses
- Making multiple speculative fixes at once

## Implementation Discipline

Before writing code:

1. **Quote the plan.** If there's a work doc or migration plan, QUOTE the relevant section in your response before writing any code. This proves you read it.

2. **Re-read before editing.** See File Freshness in [chat.md](chat.md).

3. **One change at a time.** Make one fix, test it, then move on. Don't stack multiple speculative changes.

4. **Say "let me re-read" out loud.** If you're about to implement something from a plan, say "Let me re-read [file]" and actually do it. This is a forcing function.

**When working on a migration or multi-phase plan:**
- State which phase you're in
- Quote what the plan says to do for that phase
- Do exactly that, nothing more
- Don't take shortcuts that "should work" — follow the plan

**The trap:** Optimizing for appearing helpful by producing code quickly. The fix: slow down, verify, quote sources.

## Refactoring Discipline

See [refactoring.md](../develop/refactoring.md) for the full guide with examples.

**MANDATORY.** Before ANY change that removes, renames, or changes the signature of functions, properties, stores, imports, or type definitions:

### The Rule: Search FIRST, Change NEVER Until Scope Is Known

1. **STOP.** Do not write any code yet.
2. **SEARCH.** Run grep/find for ALL usages.
3. **LIST.** Present EVERY file that needs changes.
4. **WAIT.** Get user acknowledgment of scope.
5. **CHANGE ALL.** Update every file in one pass.
6. **THEN TEST.**

### Enforcement

If collaborator produces a fix and user reports "still broken" or "new error in different file":
- This is a REFACTORING DISCIPLINE FAILURE
- Collaborator must STOP, apologize, and run the search that should have happened first
- Do not make another point fix

The pieces are obvious in hindsight, but rarely assembled this way.

See [philosophy.md](motive.md) for reflections on why this works.

