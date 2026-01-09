# Workflow

## The Problem

Most AI interactions are one-off Q&A. You ask, Claude answers, context evaporates. Next chat, you start from zero.

## The Solution

Treat documentation as shared memory:

- **notes/guides/** — living reference (patterns, style, how-tos)
- **notes/work/** — active work tracking
- **notes/work/done/** — completed work (historical record)
- **CLAUDE.MD** — entry point, tells Claude where to start

## How We Work Together

### Starting Work

When asked to "work on X":
1. Check if `notes/work/X.md` exists
2. If yes → read and resume
3. If no → create it with problem/goal structure

### Work File Structure

```markdown
# Title

**Started:** YYYY-MM-DD
**Status:** In progress

## Problem

What we're solving.

## Goal

What success looks like.

## Progress

- What's done
- What's next

## Next Action

Specific next step.
```

### Finishing Work

When complete, move to `notes/work/done/`.

Or, if it becomes a pattern others should follow, promote it to `notes/guides/`.

## Why This Works

- Guides encode decisions once, Claude applies them forever
- Work tracking survives sessions
- Documentation is dual-purpose — helps future-you AND brings Claude up to speed instantly
- The system accumulates knowledge over time
