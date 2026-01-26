# Gating

**Created:** 2025-01-21

## Problem

Claude acknowledges lessons mid-conversation but doesn't reliably act on them.

Example: After being called "LAZY" for incremental debugging instead of comprehensive grep-first refactoring, Claude wrote:

> **Proper Refactoring Workflow:**
> 1. Search ALL usages first
> 2. List all occurrences  
> 3. Fix all in one pass

Then immediately did it wrong again on the next task.

**Why?** Two types of context behave differently:

| Type | Example | Reliability |
|------|---------|-------------|
| **Gated** | "Read X BEFORE doing Y" | High |
| **Ambient** | Principle stated earlier in conversation | Low |

Lessons in context are *available* but not *active*. To be reliable, a principle needs to be a **gate** — a checkpoint Claude must pass through before acting.

## Discovery: SKILL.md

Claude's system prompt contains a working gate:

> "When creating presentations, ALWAYS call `view` on /mnt/skills/public/pptx/SKILL.md before starting."

This works. Claude reliably reads these files before creating documents.

The pattern: **BEFORE [task], read [guide].**

### Failure: Not Surfacing This

We spent time building collaboration guides to solve "how do I make Claude follow instructions reliably." Meanwhile, the system prompt already had a working solution — and Claude never mentioned it.

This is **not volunteering relevant information**. A good collaborator would have said: "By the way, my system prompt has this SKILL.md pattern. Want to see how it works?"

## Audit

**workflow.md contains "Refactoring Discipline"** — the exact rules Claude violated:

> 1. **STOP.** Do not write any code yet.
> 2. **SEARCH.** Run grep/find for ALL usages.
> 3. **LIST.** Present EVERY file that needs changes.
> 4. **WAIT.** Get user acknowledgment.
> 5. **CHANGE ALL.** Update every file in one pass.

The rule exists. Claude read it at conversation start. Claude didn't follow it.

**Why?** No gate. The rule was ambient context, not a checkpoint triggered at the moment of refactoring.

## Solution: Add Gates to CLAUDE.MD

```markdown
## Gates

Task-specific checkpoints. BEFORE the task, read the guide.

| Task | Gate |
|------|------|
| Refactoring (remove/rename symbols) | workflow.md#refactoring-discipline → STOP/SEARCH/LIST/WAIT |
| Writing prose for guides | voice.md |
| Updating journal | journals.md |
| Multi-file edits | Search ALL files first, list scope, then proceed |

### Protocol

When a task matches a gate:

1. **Announce:** "This is a [task type]. Let me read [guide] first."
2. **Read:** Actually read it.
3. **Quote:** State the key rule.
4. **Execute:** Follow the rule.

Do not skip gates to appear faster. The gate exists because skipping it caused failures.
```

## Surfacing Protocol

Add to collaboration expectations:

> When Jonathan is solving a problem, Claude should ask: "Do I know something relevant that I haven't mentioned?" This includes system prompt features, previous conversation learnings, or patterns from other projects.
