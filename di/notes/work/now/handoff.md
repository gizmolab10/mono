# Handoff

**Date:** 2026-06-09
**Work stream:** items from [code.debt.md](./code.debt.md), one item at a time. Per-session detail in [work journal](./work%20journal.md).

## Current focus

The active design is in [uniface proposal](../dimensions/uniface%20proposal.md). Phase 2 step 3 finished today — search, vote, filters, render, label hover, and per-side flip behaviour all passed visual review. Step 4 (rotated parts) is up next. 903 unit tests pass, one skipped, 31 pending.

Other open work is tracked in [open items](./open%20items.md).

## Open notes

- The visual diagnostic still shows only rejected uniface faces (dashed grey). Flip the kept-faces flag at the top of the drawing block back on when you want to see the full nested-box outlines again.
- Rule fourteen's text in [uniface rules](../dimensions/uniface%20rules.md) still says "within 20° of the camera's forward" — a single angle. The implementation uses 20° front, 45° back. The rules file still wants an edit to match.

## Reference material

- [[open items]]
- [[di/notes/work/now/code.debt]]
- [[di/notes/work/now/work journal]]
- [[uniface proposal]]
- [[creating a design]]
- [[lexicon]]

## Proposal — highlight a selected part's dimensionals

The next code-debt item: when a part is selected, also highlight every dimensional that belongs to that part. Today only the part itself is highlighted; the part's dim lines, witness lines, label boxes, and arrowheads stay in their normal blue colour.

**Where the behaviour already lives close by.** Hover on a part already turns every uniface pick on that part red (the renderer's hover pass reads `hits_3d.hover.so.id` and recolors every pick belonging to that part). Selection is a separate store — `selection.current.so`.

**Sketch.** In the renderer's draw-arrows-and-label pass and in the witness-and-dim-line pass, switch the per-pick colour to the red hover stroke when EITHER `entry.so_id === hovered_so_id` OR `entry.so_id === selected_so_id`. Selection and hover would both paint the same red; if a selected part is also hovered, the red simply stays red. The selection-highlighted dim line picks up the same "draw last on top of the blue pass" ordering already in place for hover.

**Exit criterion.** Visual inspection: select a part, every one of its dim lines, witness lines, arrowheads, and label boxes should turn red while every other part's stay blue. Click another part — the first part's dims fade back to blue and the new part's dims turn red.

**Open question for you.** Hover uses the same red stroke as selection would here. Should selection use a different colour so the two states are visually distinct, or is "selected and hovered look the same" fine?
