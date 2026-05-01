# Details panel — architecture

The right-side panel. Three folding sections: preferences, library, parts.

For the user-level description of what the panel shows, see the [Details component page](../components/Details.md). This page covers the architecture decisions.

## File structure

```text
src/lib/svelte/details/
├── Details.svelte         — the shell that holds the three folding sections
├── Hideable.svelte        — the generic folding-section wrapper used by each section
├── D_Preferences.svelte   — units, precision, line thickness, colors, view options
├── D_Library.svelte       — list of saved scenes; folder picker; per-row actions
├── D_Parts.svelte         — the parts tree, the selected-part editor, the drag-and-drop
├── P_Selected.svelte      — the three-tab segmented control (attributes / angles / repeat) inside the parts panel
├── P_Attributes.svelte    — the bounds table (start, length, end per direction; values; formulas; locks; invariant markers)
├── P_Angles.svelte        — the rotation angles editor
├── P_Repeat.svelte        — the repeater configuration editor
└── P_Givens.svelte        — the named-value (givens) editor
```

The naming convention: capital `D_` files are top-level details panels (one of the three folding sections); capital `P_` files are sub-panels nested inside the parts panel.

## Folding mechanism

The three sections use a generic folding wrapper, `Hideable.svelte`. Each instance declares its own bit of a small bitmask kept in the visible-details preferences. Toggling a section flips its bit. The bitmask is persistent across reloads.

- The header is a pill-shaped button (22px tall, fully rounded) with optional left-side and right-side action snippets.
- The body contains whatever child component was passed in.
- A resize observer on the wrapper calls the click-target detector's deferred refresh whenever the section opens, closes, or its content changes height.

## Click-target lifecycle

Buttons and rows inside the panel register with the click-target detector. The panel itself listens for scroll events and calls the detector's refresh helper on every scroll. Without this, scrolled rows would land at new positions while the click-target record still pointed at old positions.

## Banner-zone styling

The three sections live in a single `banner-zone` div whose background is the accent color. Each section's pill banner sits over this background, separated by a small gap. After the last section, a small pseudo-element rounds the bottom corners and fades into the panel background.

## Per-section content

- **Preferences** carries the units selector, the precision picker, the edge thickness slider, and the color pickers. The factory-reset button lives in the section's left-side action slot.
- **Library** carries the folder picker, the list of saved scenes, click-to-load behavior on each row, and the new-scene plus-button in the right-side action slot. The reinstall button lives in the left-side action slot.
- **Parts** carries the parts tree, drag-and-drop reordering, the multi-row highlight, the eye cells (in the table and in the collapsed view), the per-row triangle for folding subtrees, the duplicate button, and the segmented control for attributes / angles / repeat when exactly one part is selected.

## Related files

- [components/Details](../components/Details.md) — the user-level description.
- `src/lib/ts/managers/Stores.ts` — the visible-details bitmask store.
- `src/lib/ts/events/Hits.ts` — the click-target detector that gets refreshed on scroll.
