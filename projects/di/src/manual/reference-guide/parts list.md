# Organizing the parts list

You can re-arrange the parts hierarchy by dragging a row in the parts panel onto another row.

## What the drag does

Pick up a row in the parts panel. While the drag is in flight, a small indicator shows where the dropped row will land. Three drop zones exist on every other row.

1. **Drop on the row.** The dragged part becomes a child of the dropped-on part.
2. **Drop on the line above the row.** The dragged part becomes a sibling, placed just above the dropped-on part.
3. **Drop on the line below the row.** The dragged part becomes a sibling, placed just below the dropped-on part.

The dragged part keeps its visible position, size, and angle on the canvas. What changes is the structural relationship — which part is its parent.

## What the drag prevents

The drag refuses three combinations.

* A part dragged onto itself.
* A part dragged onto one of its descendants (which would create a loop).
* A part dragged into a part whose role is to be a repeater template (the first child of a repeating parent).

When the drop is refused, the indicator does not appear and the drop is silently ignored.

Citation: the drag wiring lives in `src/lib/svelte/details/D_Parts.svelte`. The re-parenting helper that preserves world bounds lives in `src/lib/ts/render/Engine.ts` lines 1242-1309.
