# Undo and redo

Step backward through the last several changes, and forward again, without losing the currently-displayed scene.

## How to step back and forward

- **Step backward.** Press the platform's undo combination — control with the letter z, or command with the letter z on an Apple machine.
- **Step forward.** The same combination with shift held — control plus shift plus z, or command plus shift plus z.

Each press moves one step. Up to fifty steps are kept; beyond that, the oldest one rolls off.

## What gets stepped through

Anything that changes the saved scene. Every drag, every typed-in value, every added or deleted part, every renamed part, every formula edit, every angle change, every repeater toggle, every named-value edit — they all step through.

## What does not get stepped through

Choices that affect only what you see, not the saved scene, are not in the undo path. Selecting a part, opening or closing the side panel, fitting the view to the parts, switching between two-and-three-dimensional view, switching between solid and see-through — all of these change with no effect on the undo button.

## What clears the history

Loading a fresh scene from the library, importing a file, and the reset action all clear both the backward and forward stacks. The newly-loaded state has no undo path before it.

Citation: the keyboard handler lives at `src/lib/ts/events/Events.ts` lines 197-200. The history mechanism is described on [the history page](../../architecture/core/history.md).
