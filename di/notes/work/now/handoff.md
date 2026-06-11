# Handoff

**Date:** 2026-06-10
**Work stream:** items from [code.debt.md](./code.debt.md), one item at a time. Per-session detail in [work journal](./work%20journal.md).

## Current focus

The uniface placement path is now the only placement path. Today's session finished phase 2 step 7b of [uniface proposal](../milestones/34.dimensionals/uniface%20proposal.md): the new-path flag is gone (store, getter, toggle method, preference key, toolbar button, test-setup env bridge — all removed); the old per-dim renderer, its test file, and the nine Group B describe blocks in the placement test file are deleted; the old orchestrator (run_new_placement) and its trace/log/conflict-graph helpers are deleted along with greedy_seed. The vote/filter helpers that still have unit-test coverage stay on disk for now — they're dead but tested. The output record was also renamed and flattened across the codebase: "pick" became "placement", and the per-entry nested `.placement.field` shape became flat `.field`. svelte-check clean. 875 unit tests pass, one skipped, eight pending. The next code-debt item is "for a selected part, also highlight its dimensionals" — proposal below.

Other open work is tracked in [open items](./open%20items.md).

## Open notes

- The visual diagnostic still shows only rejected uniface faces (dashed grey). Flip the kept-faces flag at the top of the drawing block back on when you want to see the full nested-box outlines again.
- Rule fourteen's text in [uniface rules](../milestones/34.dimensionals/uniface%20rules.md) still says "within 20° of the camera's forward" — a single angle. The implementation uses 20° front, 45° back. The rules file still wants an edit to match.
- The status strip's dropped-count store now reads zero — the new path's drop-counter wiring was not ported in step 7b. The strip falls back to the orientation numbers, which is the desired idle state anyway. Wire a real count in if the diagnostic value comes up.

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
