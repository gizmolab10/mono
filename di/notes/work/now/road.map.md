# Road Map

**Started:** 2026-01-05 | **Status:** 26 of 31 planned milestones complete; milestones 32 (facets) and 33 (drag) mothballed; current focus is the dimensionals-placement redesign and ongoing code-debt items.

*Moved from the completed-milestones folder on 2026-04-11 — this is a living document, not a retrospective.*

## Routine

*Rule — reread this file at the start of each session.*
*Rule — keep the indexes in the `now`, `done`, `milestones`, and `milestones/done` folders up to date.*
*Rule — refresh this file's date stamp and "Current state" section whenever a significant piece of work is started or done.*

## Current state (2026-05-20)

- Milestones 1–26 are complete. See [completed milestones](../milestones/done/).
- Milestones 27–31 are open. Milestone 27 (selection algorithm) has a planning file in [work/now/27.selection.algorithm.md](27.selection.algorithm.md).
- Milestones 32 (facets) and 33 (drag) are mothballed.
- Active code-debt tasks: see [code.debt.md](di/di%20notes/di%20work/now/code.debt.md). Each session works one unchecked item; finished items are recorded in [code.debt.paid.md](code.debt.paid.md).
- Current handoff: [handoff.md](di/di%20notes/di%20work/now/handoff.md).

### Dimensionals-placement redesign (decided, not yet built)

The dimensions-label algorithm is being replaced with a four-degrees-of-freedom search per label (edge, direction, witness length, slidable position). The full 25-rule consolidated spec is at [guides/development/rules/dimensionals.md](di/notes/work/now/dimensionals.md). The library-versus-custom decision was settled in favour of a custom implementation — supporting research at [guides/project/research/dimensionals-research.md](dimensionals-research.md). Today's force-driven implementation still ships; the eighteen `dimensions-*.spec.ts` e2e files under [e2e/tests/](../../../e2e/tests/) capture the acceptance criteria, with most marked `test.skip` pending the test hooks listed in rule 25.

Phased task list with dependencies, effort guesses, and per-task risks at [dimensionals.work.md](dimensionals.work.md). Progress is recorded in the handoff per the first item in [code.debt.md](di/di%20notes/di%20work/now/code.debt.md).

### Recent infrastructure (since 2026-04-11)

- Notes tree reorganised: rules now live under [guides/development/rules/](../../guides/development/rules/); long-form research under [guides/project/research/](../../guides/project/research/); learning material under [guides/development/learn/](../../guides/development/learn/); adherence material under [guides/development/adhere/](../../guides/development/adhere/).
- Architecture guide for the running placement code at [guides/architecture/graph/dimensionals.md](../../guides/architecture/graph/dimensionals.md). It carries a "Status — redesign decided, not yet built" header pointing at the new spec.
- The toolbar component file has been split in the source: `Primary_Controls.svelte` and `Secondary_Controls.svelte`. The single [Controls.md](di/di%20notes/di%20guides/di%20architecture/components/Controls.md) guide now describes both.

## What's next

In order of priority:

1. Implement the dimensionals redesign so the eighteen e2e tests can be unskipped. Largest piece of work in flight.
2. Resume the active code-debt item — see [code.debt.md](di/di%20notes/di%20work/now/code.debt.md).
3. Open milestone 27 (selection algorithm) once dimensionals are settled.

Milestones 28–31 follow at their own pace; none of them are blocked.

## Goal

A living roadmap: origin story, major milestones with context and outcomes, template pattern for other projects.

## Problem

Project history lives in my head. No quick way to see how we got here or what the major turning points were. Future me (or anyone else) would have to dig through commits and docs to reconstruct the journey. Plus i intend this project to lean into creating at all levels of abstraction. Creativity is gold.

---

## Templates

After writing the first milestone, i've decided on a format or template for the two kinds of file:

### Milestones Index

A concise snapshot of the arc of the project at the milestone level, each is part of the whole.

```markdown
### N -- Name
**Timeline:** dates | [details](milestone.N.md)
**Goal:** One sentence—what we set out to do.
**Outcome:** One sentence—what we got.
```

### Milestone Detail File

This is intended to capture the look of [1.solid.foundation](1.solid.foundation.md), so refer to it (a) when you begin a new milestone and (b) when you polish it for completion.

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
Links to relevant files, commits, or docs: <file>, <another>
```
