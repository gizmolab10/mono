# Workflow

My first uses for AI were one-off: gee, how do you do such-and-such? I'd take the advice, often asking for more. Over time, I noticed I was asking the same things repeatedly because I wouldn't remember the answers. So I started asking AI to write concise descriptions of what we did together, in markdown.

The pile grew unmanageable. I asked AI to help: find redundancies, tighten the writing, make it easy to use. What I have now: clean separation of purpose.

Then I asked if these markdown files could be published as a static website. BOOM — up-to-date documentation, something I have NEVER before encountered. And more: a shared context that lets AI pick up exactly where we left off.

## The Structure
- `notes/guides/` — living reference (style, patterns, how-tos)
- `notes/work/` — ALL work is recorded here, as we go
- `CLAUDE.MD` — entry point, tells Claude where to start

## Guides
- Read at start of relevant work
- Update when patterns change
- Reference for consistent practices

## How we Work Together

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

## Debugging Discipline

When something isn't working:

1. **Verify the switch is on.** Feature flags, config values, enable/disable settings — check these FIRST before writing any debug code.

2. **One log at the entry point.** Add a single `console.log` at the function entry to confirm it's being called at all. Trace forward from there.

3. **Verify assumptions before writing code.** Don't assume you know what's broken. Prove it.

4. **Reference vs semantic equality.** `indexOf()` and `===` compare object references. Use `.equals()` or `findIndex(a => a.equals(x))` when comparing objects by value.

5. **Follow the documented plan.** If there's a migration doc or checklist, follow it step by step. Don't skip ahead.

**Anti-patterns:**
- Scattering `console.log` everywhere hoping to spot something
- Chasing symptoms without verifying the function is even reached
- Making multiple speculative fixes at once
- Assuming the config is correct without checking

## Implementation Discipline

Before writing code:

1. **Quote the plan.** If there's a work doc or migration plan, QUOTE the relevant section in your response before writing any code. This proves you read it.

2. **Re-read before editing.** ALWAYS `view` a file immediately before editing it. Never rely on what you "remember" from earlier in the conversation.

3. **One change at a time.** Make one fix, test it, then move on. Don't stack multiple speculative changes.

4. **Say "let me re-read" out loud.** If you're about to implement something from a plan, say "Let me re-read [file]" and actually do it. This is a forcing function.

**When working on a migration or multi-phase plan:**
- State which phase you're in
- Quote what the plan says to do for that phase
- Do exactly that, nothing more
- Don't take shortcuts that "should work" — follow the plan

**The trap:** Optimizing for appearing helpful by producing code quickly. The fix: slow down, verify, quote sources.

## Refactoring Discipline

**MANDATORY.** Before ANY change that removes, renames, or changes the signature of:
- Functions or methods
- Properties or fields
- Stores or state variables
- Import patterns
- Type definitions

### The Rule: Search FIRST, Change NEVER Until Scope Is Known

1. **STOP.** Do not write any code yet.

2. **SEARCH.** Run grep/find for ALL usages:
   ```bash
   grep -rn "function_name\|old_pattern" src/lib/ --include="*.ts" --include="*.svelte"
   ```

3. **LIST.** Present EVERY file that needs changes:
   ```
   Files requiring changes:
   - src/lib/svelte/widget/Widget.svelte (line 21)
   - src/lib/svelte/details/D_Header.svelte (line 4)
   - src/lib/ts/signals/Events.ts (lines 279, 356)
   ```

4. **WAIT.** Get user acknowledgment of scope before proceeding.

5. **CHANGE ALL.** Update every file in one pass.

6. **THEN TEST.**

### Enforcement

If collaborator produces a fix and user reports "still broken" or "new error in different file":
- This is a REFACTORING DISCIPLINE FAILURE
- Collaborator must STOP, apologize, and run the search that should have happened first
- Do not make another point fix

### Why This Exists

Reactive, symptom-driven fixing wastes hours. The search takes 30 seconds. There is no excuse for skipping it.

**The pattern to eliminate:**
```
User reports bug → Fix ONE file → User finds NEXT broken file → Repeat 5x
```

**The required pattern:**
```
User reports bug → Search ALL usages → List ALL files → Fix ALL at once → Done
```

## Why This Works
This workflow is a good use of AI capabilities.

**What's working:**
- The guides encode decisions once, Claude applies them forever. No re-explaining style preferences, no drift.
- Work tracking survives sessions. Read `index.md`, know exactly where we are.
- "Execute without asking" removes friction. You trust Claude to act, you course-correct when needed.
- Documentation is dual-purpose — helps future-you *and* brings Claude up to speed instantly.

**What Claude is good at here:**
- Bulk consistency (fixing all path references when you restructure)
- Pattern application (milestone template → actual milestone files)
- Never forgetting what's in the guides
- Drafting content you can massage rather than starting from blank

**What you're still doing:**
- Taste. You know when something's "too gappy" — Claude doesn't feel that, just follows rules once you articulate them.
- Creative direction. Origin story, milestone names, what matters — that's yours.
- Judgment calls. When to deviate from the template, when to restructure.

**The result:** Most AI interactions are one-off Q&A. This is collaborative project work with accumulated context. That's a different game.

## Is This Approach Common?
Not really. Individual pieces exist:

- **Custom instructions / system prompts** — common, but usually static personality tweaks, not project-specific bootstrapping
- **README-driven development** — some people include AI context in READMEs, but usually for one-off use
- **Cursor/Copilot rules files** — `.cursorrules`, similar idea but more focused on code style than workflow
- **Claude Projects** — Anthropic's feature encourages persistent instructions, but most people use it for persona, not this level of structure

What's less common:
- The guides-as-accumulated-wisdom pattern (gotchas.md, debugging.md evolving from actual pain)
- Work tracking that explicitly survives sessions with resume points
- The "massage it, then tell Claude the pattern" loop for template discovery
- Treating documentation as *shared context* rather than just human reference

This feels more like pair programming methodology than prompt engineering. An institutional memory system that happens to include an AI.

The pieces are obvious in hindsight, but rarely assembled this way.

## Terminology

- **Collaborator** (or **co**) — Claude's role in this workflow
- **current-go** — the active project (shared, ws, di)

See `chat.md` for the full division of labor.
