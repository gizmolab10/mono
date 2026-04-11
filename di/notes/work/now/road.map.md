# Road Map

**Started:** 2026-01-05 | **Status:** 26 of 31 planned milestones complete; milestone 32 (facets) mothballed; currently working on render performance and code-debt items.

*Moved from the completed-milestones folder on 2026-04-11 — this is a living document, not a retrospective.*

## Routine

*Rule — reread this file at the start of each session.*
*Rule — keep the indexes in the `now`,  `done`,`milestones`, and `milestones/done` folders up to date.*

## Current state (2026-04-11)

- Milestones 1–26 are complete. See [completed milestones](../milestones/done/).
- Milestones 27–31 are open and unstarted.
- Milestone 32 (facets) is mothballed.
- Active work: render performance bottleneck cleanup and small code-debt items. See [the current handoff](./handoff.md).

## Goal

A living roadmap: origin story, major milestones with context and outcomes, template pattern for other projects.

## Problem

Project history lives in my head. No quick way to see how we got here or what the major turning points were. Future me (or anyone else) would have to dig through commits and docs to reconstruct the journey. Plus i intend this project to lean into creating at all levels of abstraction. Creativity is gold.

---
## Templates

After writing the first milestone, I’ve decided on a format or template for the two kinds of file:

### Milestones Index

A concise snapshot of the arc of the project at the milestone level, each is part of the whole.

```markdown
### N -- Name
**Timeline:** dates | [details](milestone.N.md)
**Goal:** One sentence—what we set out to do.
**Outcome:** One sentence—what we got.
```

### Milestone Detail File

This is intended to capture the look of [[1.solid.foundation]], so refer to it (a) when you begin a new milestone and (b) when you polish it for completion.

```markdown
# Milestone N: Name
**Timeline:** dates

## Goal
What we set out to do.

---
## Narrative
Freeform story of how it unfolded. Use subsections as needed:
- Decisions made and why
- Challenges encountered
- What emerged

---
## Artifacts
Links to relevant files, commits, or docs: [[file]], [[another]]
```



