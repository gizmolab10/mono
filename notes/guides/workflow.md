# Workflow

## Work Tracking

All work is tracked in `notes/work/`.

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

---

## Problem

What we're solving.

## Goal

What success looks like.

---

## Phase 1: Name

- [ ] Task
- [ ] Task

---

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

## Guides

Guides in `notes/guides/` are living documents:

- Read at start of relevant work
- Update when patterns change
- Reference for consistent practices

### Guide vs Done

**Guide:** "How to test" — ongoing reference  
**Done:** "We migrated to Svelte 5" — historical record
