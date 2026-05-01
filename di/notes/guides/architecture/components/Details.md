# Details

The right-side panel — three folding sections that hold the project's settings, the saved scenes, and the parts of the current scene.

## Location

`src/lib/svelte/details/Details.svelte`

## What it shows

Three folding sections stacked top to bottom, each with its own header and a content area that opens or closes when the user clicks the header:

- **Preferences.** Project-level settings, plus a "factory reset" button on the left of its header.
- **Library.** The list of saved scenes, plus a "reinstall" button on the left of its header and a "+" button on the right that creates a new empty scene.
- **Parts.** The tree of parts in the current scene, plus a "+" button on the right of its header that adds a child to the currently selected part.

## What lives inside each section

- The Preferences section uses `D_Preferences.svelte`.
- The Library section uses `D_Library.svelte`.
- The Parts section uses `D_Parts.svelte`. This one is the largest — it carries the parts tree, the row drag-and-drop, the multi-row highlight, the eye cells (in the table and in the collapsed view), the per-row triangle for folding subtrees, the duplicate button, and the segmented control for attributes / angles / repeats when exactly one part is selected.

## Folding

The three sections are wrapped in a generic folding component (`Hideable.svelte`). The fold state is kept in the side-panel store under three flags (one per section) and is persisted across reloads.

## Click-target refresh on scroll

The panel's content can be tall enough to scroll. When the user scrolls inside it, the panel calls the click-target detector's refresh helper so every button and row inside picks up its new on-screen position. Without this, scrolled rows would land at new positions while the click-target record still pointed at the old positions, and clicks would miss.

Citation: `src/lib/svelte/details/Details.svelte` line 29 — `onscroll = {() => hits.recalibrate()}`.

## Resize observer

A folding section that opens or closes changes the panel's overall height. Each `Hideable` instance carries a `ResizeObserver` that calls the deferred-refresh helper when the section's size changes — so the click-target record is regenerated after the layout settles.

Citation: `src/lib/svelte/details/Hideable.svelte` line 33.

## Mount-time refresh

When the panel first mounts, the click-target record needs to be primed once after the initial layout. The mount handler waits one tick and calls the deferred refresh.

## CSS shape

A vertical column with horizontal padding zero, vertical padding zero, and overflow set to scroll on the vertical axis. The sections inside fill the column. A small radius at the bottom-right corner blends the panel into the canvas background.

## Related files

- `src/lib/svelte/details/Hideable.svelte` — the folding section wrapper.
- `src/lib/svelte/details/D_Preferences.svelte` — the preferences pane.
- `src/lib/svelte/details/D_Library.svelte` — the library pane.
- `src/lib/svelte/details/D_Parts.svelte` — the parts pane and everything it contains (parts table, drag-and-drop, eye cells, per-part editor).
- `src/lib/ts/events/Hits.ts` — the click-target detector.
- `src/lib/ts/managers/Scenes.ts` — the scenes manager that owns the library.
- `src/lib/ts/render/Engine.ts` — the engine that adds new children and loads scenes.
