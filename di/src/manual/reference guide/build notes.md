# Build notes

The build-notes overlay is a brief log of what changed in each build. It opens over the entire app; the rest of the app is hidden until you dismiss it.

## How to open it

Click the build-notes button in the toolbar. The overlay replaces the normal layout.

## How to read it

The overlay shows ten notes at a time, with the most recent ten on top. The title says "Build Notes (10 most recent)" while you are looking at the top of the list. Two stepper arrows below the close button move you ten older or ten newer notes at a time. The title changes to plain "Build Notes" while you are away from the top.

## How to dismiss it

Click the close button at the top right, or press the escape key. The normal layout returns.

Citation: the overlay component lives at `src/lib/svelte/main/BuildNotes.svelte`. The notes themselves are listed in the constants file under the build-notes key.
