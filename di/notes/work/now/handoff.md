# Code-Debt Handoff

**Date:** 2026-04-15
**Work stream:** items from [code.debt.md](di/notes/work/now/code.debt.md), one item at a time.

---

## Next

A proposal for the first unchecked code-debt item — "visible children button → new column, before eye column" — is on the table and waiting for Jonathan's **go**. The flag already exists on every shape and persists through save/load, but nothing reads it and there's no UI to toggle it. The proposal covers two pieces: wire the flag into the one place in the renderer that filters shapes by visibility so descendants vanish when any ancestor has the flag set, and add a new column to the parts-panel table just before the eye column with a tree-shaped icon that toggles the flag and stays in sync across repeater-group siblings the same way the eye column already does. Three small confirmations requested: cascade to all descendants (not just direct children), tree icon rather than a second eye, and matching repeater-group sync.

seems to me a parent's state is three: all, children, hidden. leaves only have visible, hidden. pac create a new enum for these three states. vs. two booleans, me and my children / progeny.

the new column goes before the current eye column. it shows an eye or a dash (click toggles them), for sos that have children. nothing for those that don't. 

## Where we are

- **Parts-panel sibling-position label is shipped.** Awaiting live verification before the code-debt bullet gets checked off.
- **Visible-children column is proposed, not built.** Waiting on three small confirmations before wiring it in.
- **Drag work is mothballed.** The drag rewrite is shipped and stable (514 tests green, type-check clean), but a small residual visual drift on child drags is unresolved. See [milestone 33](di/notes/work/milestones/33.drag/handoff.md) for the full state, and [its lessons](di/notes/work/milestones/33.drag/lessons.md) for what was learned.

## Open items

- **Waiting on Jonathan's go for the visible-children column.** See **Next** above.
- **Visually verify the parts-panel sibling-position label.** Pending live check.
- **Color sub-list.** Once the label is checked off and the visible-children column is shipped, the next unchecked bullet is the color sub-list — start with making the selection and hover dots larger. The leaf items will need their own proposals.
- **Mothballed: residual child-drag drift.** Parked in [milestone 33](di/notes/work/milestones/33.drag/handoff.md). Pick back up if and when Jonathan wants to revisit the drag work.

## Notes for future sessions

- The code-debt track is a grab-bag of small, unrelated items. Each one deserves its own short propose-then-build cycle. Do not batch them.
- The slow-render work has its own handoff at `di/notes/work/milestones/32.facets/slow/handoff.md`. That handoff is for bottleneck work inside the facets milestone, not debt items.
- The drag work has its own mothballed handoff at `di/notes/work/milestones/33.drag/handoff.md`. Same separation.
- The `handoff` and `hands` shorthands point at this file. If you want a separate shorthand for the drag handoff, add a row to `notes/guides/pre-flight/shorthand.md`.

---

## Session — 2026-04-11 — parts-panel sibling-position label

Jonathan invoked the code-debt shortcut and I proposed the first unchecked item: a small "N of M" label next to the name editor in the parts details panel, showing the selected smart object's position among its siblings in tree order. After two rounds of pros-and-cons and a CSS-selector safety check, I shipped it.

### The rules we settled on

- Counts include invisible smart objects and include clones.
- Order is tree order (uses the existing tree-order helper).
- Hidden when the selection is the root.
- Hidden when the selection has no siblings (only-child).
- Hidden when the parts tree is visible — the label lives inside the existing "no parts tree" guard.
- Sits on the same row as the name editor, right-aligned.

### What I changed

All changes in one file: [di/src/lib/svelte/details/D_Parts.svelte](di/src/lib/svelte/details/D_Parts.svelte).

- Added a reactive value at the top of the script block that derives the position and total from the selection, the parent, the scene list, and the tick store.
- Wrapped the existing name input in a new flex row and added a small muted label next to it. The input's attributes and handlers are unchanged.
- Added two CSS rules: one for the flex row and one for the label's font, color, and non-interactive behavior.

### CSS selector safety check

Before wrapping the input I ran a targeted grep for any rule that reached the input through its parent position. The input's class is referenced in exactly three places, all inside the same file, and every rule is a plain class selector with no parent qualifier, no child-position, no sibling combinator. Wrapping the input is safe.

### Verification

- Type-check is clean — zero errors, zero warnings.
- Full test suite passes — four hundred ninety-six green.
- I did not run the app and look at the label in a live session. Jonathan may want to verify visually before checking the debt item off.

### Files updated this session

- `di/src/lib/svelte/details/D_Parts.svelte`
- `di/notes/work/now/handoff.md` — this file (the section you are reading)
