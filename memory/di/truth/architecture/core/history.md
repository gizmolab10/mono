# History (undo and redo)

The history module is in charge of letting the user step backward through the last several changes — and forward again — without losing the currently-displayed scene.

Citation: `src/lib/ts/managers/History.ts`.

## How a step is captured

Every mutation that the user can step back through asks the history module to take a snapshot first. A snapshot is a deep copy of the current scene — every part, the camera, the named values, the open-and-closed state of the parts panel — captured before the mutation is done. The snapshot goes onto the undo stack. The redo stack is wiped, since a fresh edit invalidates the redo branch.

The undo stack is capped at fifty entries. Older snapshots roll off the bottom.

Citation: `History.ts` lines 4, 7-15.

## Stepping back and forward

Stepping back pops the top of the undo stack, pushes a fresh snapshot of the current scene onto the redo stack, and returns the popped state for restore. Stepping forward does the mirror — pop the redo stack, push the current state onto undo, return the popped state.

The restore path runs through the same scene-loader the file-load uses. The scene gets cleared, the new state is rebuilt, and the propagation rebuilds derived geometry. The recompute flag is off, so the restore does not also clear the history stacks.

Citation: `History.ts` lines 17-29; `src/lib/ts/render/Engine.ts` lines 370-380 (the load-scene calls).

## What clears the stacks

Loading a fresh scene from the library, importing a file, or hitting the reset button all clear both stacks. The fresh state has no undo path before it.

Citation: `Engine.ts` line 260 (the load-scene clear).

## Where snapshots happen

Every site that mutates the scene snapshots first.

In the engine:

- The precision setter.
- Deleting the selected part.
- Inserting a child from a saved file.
- Adding a child or a template child.
- Duplicating a part.
- Re-parenting a part by drag.

In the editors that the canvas uses:

- A dimension edit committed.
- An angle edit committed.
- A face-label edit committed.

In the events handler:

- The first move of a drag, once a hit is done.

In the side-panel sub-pages:

- Renaming a part.
- Committing a formula edit, a value edit, or a lock toggle.
- Every angle slider step, every angle reset, every axis swap.
- Every repeater toggle, every spacing-slider step, every fireblock toggle.
- Defining, renaming, or deleting a named value.

Citation: `Engine.ts` lines 573, 591, 655, 795, 826, 855, 1278; `src/lib/ts/editors/Angular.ts` line 57; `src/lib/ts/editors/Dimension.ts` line 59; `src/lib/ts/editors/Face_Label.ts` line 59; `src/lib/ts/events/Events_3D.ts` line 113; `src/lib/svelte/details/D_Parts.svelte` line 90; `P_Attributes.svelte` lines 122, 169, 220; `P_Angles.svelte` lines 59, 94, 112, 123, 136, 151; `P_Repeat.svelte` lines 31, 40, 49, 125, 145, 160, 171; `D_Givens.svelte` lines 61, 84, 98.

## What is not stepped through

View-state changes do not snapshot: clicks that only change selection, fit, two-and-three-dimensional toggle, solid-versus-x-ray, the side-panel open and closed flags. The user can flip these at will and the undo button does not move.

Evidence: a grep for snapshot calls under the toolbar component returns nothing.

## How the user reaches it

A keyboard handler watches for the platform's undo combination — control or command together with the letter z — and steps backward; with shift held, it steps forward.

Citation: `src/lib/ts/events/Events.ts` lines 197-200.

## Tests

Round-trip behavior is pinned down in `src/lib/ts/tests/History.test.ts`.
