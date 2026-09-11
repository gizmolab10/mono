# Hits_3D

Three-dimensional hit testing on the canvas — corners, edges, faces of every part the user sees.

## Location

`src/lib/ts/events/Hits_3D.ts`

## What it owns

- A list of every part registered as hit-testable.
- A cache of each part's most recent projected vertices and bounding box. The render code refreshes this cache once per part per frame.
- The current hover — which entity the cursor is over. Stored here; the renderer reads it.
- The corner pick-up radius (eight pixels) and edge pick-up radius (five pixels).

## What it does NOT own

The selection. The current list of selected parts lives in the selection manager (`src/lib/ts/managers/Selection.ts`). The hit-test reads from that module so it can give the selected part priority for resize handles, but it does not write to it.

## What a click on the canvas does

The hit-test routine runs once per click. It tries each test in priority order, returning the first match:

1. **Dimension label.** When dimensions are visible and the click is on one, the dimension wins outright.
2. **Angle label.** Same, when angles are visible.
3. **Corner or edge of the selected part.** Picked up only when the cursor is within the small pick-up radius. This lets the user start a resize on the current selection without losing the selection to whatever sits behind.
4. **Face hit, drilled.** If the cursor is well inside a face (not on a corner or edge of the selected part), the routine builds an ordered list of every part the click ended up on, then picks one of them.

## The face-hit list (drill-down)

Each click builds the list fresh. For each registered part, the routine:

- Skips the root.
- Skips parts whose visibility flag is off.
- Skips repeater clones — only the master in a repeater group can be clicked.
- Skips parts whose bounding box does not contain the click point.
- Of the remaining parts, finds the closest front-facing face the click point is inside.

The list is sorted front to back. The routine then picks one entry by this rule:

- If the currently selected part is in the list, return the part right after it. Wrap to the front when the current part is the last entry.
- Otherwise return the front-most.

This gives drill-down for free. The first click on a stack picks the front-most. A second click on the same place picks the part one layer behind. The list rebuilds on every click — the routine keeps no memory between clicks.

## Auto face-flip on rotation

When the selected part rotates so the originally-picked face turns away from the camera, the next projection update detects this and flips the selection to whichever face is now most front-facing on the same part. The selection stays on the part; only the face index changes.

## Hover

A mousemove on the canvas calls the same hit-test routine and stores the result as the hover. The renderer reads it to paint a different highlight color on whatever the cursor is over.

## Result shape

A hit returns three pieces of information: the part that was hit, the kind of hit (corner, edge, face, dimension, angle), and the index inside that kind (which corner number, which face number).

## Data flow

1. The engine registers each part with the hit-tester when the part enters the scene.
2. The render code, once per frame per part, hands the hit-tester the projected vertices, the world transform, and the screen-space bounding box.
3. The canvas mouse-down handler calls the hit-test routine and either starts a drag or updates the selection list, depending on which kind of hit came back.
4. The canvas mouse-move handler calls the hit-test routine on every move and stores the result as the hover.
5. The render code reads the selection list (from the selection manager) and the hover (from this module) to paint highlights.

## Related files

- `src/lib/ts/managers/Selection.ts` — the selection list this module reads.
- `src/lib/ts/events/Events_3D.ts` — the canvas mouse handlers that call this module.
- `src/lib/ts/render/Render.ts` — the consumer that reads hover and selection to paint highlights.
- `src/lib/ts/runtime/Smart_Object.ts` — the entities being tested.
- `src/lib/ts/types/Enumerations.ts` — the hit-kind enum.
