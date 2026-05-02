# Selecting parts

Two patterns for choosing the parts you want to work on: a single click, and a single click while holding the command key.

## A plain click selects one part

Click any face on the canvas. That part becomes the selected one. Its name shows in the parts panel; its three axes are now editable. A second plain click on a different part replaces the selection — only one part is selected.

## A click while holding command adds to the selection

Hold the command key (or the control key on a non-Apple machine) and click another part. The first part stays selected; the new part joins it. Hold command and click a part that is already selected, and the part is removed from the selection.

A click without the command key clears any multi-selection and starts again with the part you just clicked.

## Drilling down through a stack

When several parts overlap on screen, a plain click picks the front-most one. Click the same point again and the selection moves to the next one in the stack. Click again and it advances. The cycle wraps when it runs out of parts. Repeater copies (the duplicated steps in a staircase, the duplicated studs in a wall) are skipped — only the master is reachable from the click. Parts that have been hidden are also skipped.

Citation: the cmd-click branch lives in `src/lib/ts/events/Events_3D.ts` line 121-133. The drill-down rule and the skip filters live in `src/lib/ts/events/Hits_3D.ts` lines 124-189. The selection model lives in `src/lib/ts/managers/Selection.ts`.
