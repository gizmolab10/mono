# Details panel — architecture

The right-side panel. Four folding sections, top to bottom: preferences, library, parts, part.

## File structure

```text
src/lib/svelte/details/
├── Details.svelte
├── Hideable.svelte
├── D_Preferences.svelte
├── D_Library.svelte
├── D_Parts.svelte
├── D_Selection.svelte
├── D_Givens.svelte
├── P_Attributes.svelte
├── P_Angles.svelte
└── P_Repeat.svelte
```

The `D_` files are the folding sections. The `P_` files are sub-panels — currently only used by the part section as the contents of its three tabs.

## Related files

```text
src/lib/ts/
├── managers/
│   ├── Stores.ts
│   ├── Selection.ts
│   ├── Parts.ts
│   └── Scenes.ts
├── events/
│   └── Hits.ts
└── render/
    └── Engine.ts
```
## Per-section content

- **Preferences** carries project-level settings. The factory-reset button lives in the section's left-side action slot.
- **Library** carries the saved-scene list, the folder picker, and click-to-load on each row. Reinstall on the left, new-scene plus-button on the right.
- **Parts** carries the parts tree with drag-and-drop reordering, multi-row highlight, eye cells (visibility on the right, hide-children on its left), per-row triangle for folding subtrees, repeat badge on the first sibling of a repeater group, and in-row name editing when the selected row is clicked again. The plus-button in the right-side action slot adds a child to the currently selected part — hidden when the selection is a repeater or one of its clones. When the selection changes, the panel auto-reveals the new row by uncollapsing every ancestor that was hiding it.
- **Part** is the editor for the currently selected part. Empty state: "nothing is selected." Selected state: an editable name field, action buttons (duplicate, and divide-in-half when the cut is legal — both hidden for the root), and a three-button switcher between attributes, angles, and repeats. The chosen tab is remembered across selection changes.

The parts list and the part editor are separate components so each one folds independently — a user reorganizing the tree can keep the parts section open and the part section closed; a user editing one part can do the opposite.

## `Hideable` behavior

Each of the four sections is wrapped in a generic folding component. The visibility state for each section is one bit in a small bitmask kept in the visible-details preferences, persistent across reloads. Each banner operates as a button. Some banners have left-side or right-side action slots. When visible, the body is just whatever child component was passed in.

## Click-target refresh

Buttons and rows inside the panel register with the hits system. The detector caches each target's on-screen position, so anything that moves a target out from under its cached position has to recalibrate the hits system.

- **On scroll.** The panel listens for scroll events and calls the detector's refresh helper on every scroll. Citation: `src/lib/svelte/details/Details.svelte` line 52 — `onscroll = {() => hits.recalibrate()}`.
- **On resize.** Each folding wrapper carries a resize observer that calls the deferred-refresh helper when the section's size changes — so the record is regenerated after the layout settles. Citation: `src/lib/svelte/details/Hideable.svelte` line 33.
- **On mount.** The mount handler waits one tick and calls the deferred refresh, priming the record after the initial layout. Citation: `src/lib/svelte/details/Details.svelte` line 42.

## Reactive ties between the parts list and the part editor

The auto-reveal effect that uncollapses ancestors of the selected row reads the collapsed-set through a non-subscribing read rather than the reactive store. That is deliberate: it stops the effect from re-firing every time the user collapses or expands a row, which would otherwise fight the user's click.

