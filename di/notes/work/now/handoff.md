# Code-Debt Handoff

**Date:** 2026-04-11
**Work stream:** items from [code.debt.md](di/notes/work/now/code.debt.md) in this folder

**Next:** decide whether the parts-panel sibling-position label is verified well enough to check off the first debt item, then move to the next unchecked item (the color sub-list, starting with selection and hover dot colors).

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

---

## Open items

- **Check off the first debt item?** The parts-panel sibling-position label is shipped. Tests pass, type-check is clean. Jonathan wants to verify visually before the debt bullet gets checked off — pending.
- **Next debt item to tackle.** After the first one is checked, the next unchecked bullet is the color sub-list, which begins with "selection and hover dot colors: larger". That is itself a nested list with several leaf items. When you are ready to start, say so and I will propose a plan for the first leaf.

---

## Notes for future sessions

- The code-debt track is a grab-bag of small, unrelated items. Each one deserves its own short propose-then-build cycle. Do not batch them.
- The slow-render work has its own handoff at `di/notes/work/milestones/32.facets/slow/handoff.md`. That handoff is for bottleneck work inside the facets milestone, not debt items.
- The `handoff` and `hands` shorthands now point at this file (the `now/` handoff). If you want a separate shorthand for the slow-render handoff, add a row to `notes/guides/pre-flight/shorthand.md`.
