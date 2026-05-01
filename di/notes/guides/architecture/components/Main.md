# Main

The root layout component. Decides where the toolbar, the side panel, the drawing area, and the build-notes modal sit on the screen.

## Location

`src/lib/svelte/main/Main.svelte`

## What it shows

A full-viewport panel with two states:

- **Normal state.** A horizontal strip of toolbar at the top, then a row below it containing the side panel on the left and the drawing area on the right. The side panel can be hidden, in which case the drawing area takes the full width.
- **Build-notes state.** A single full-screen overlay showing the build-notes content. Triggered by the build button inside the drawing area; dismissed by clicking the background.

## What it owns

- The current viewport width and height. Read from the window on first mount and updated on every window resize.
- The current toolbar height. Bound to the toolbar's actual measured height.
- A flag for the build-notes overlay.

It reads the side-panel-open flag from the stores manager.

## How it sizes its children

The toolbar gets a fixed-height row at the top whose height is whatever the toolbar measures itself to be.

The drawing-area row below takes the remaining viewport height minus the toolbar height and three layout gaps.

If the side panel is open, its width is two hundred and eighty pixels minus two layout gaps, except in the phone responsive layout (viewport below seven hundred and twenty pixels), where the side panel takes the full width minus two layout gaps. The drawing area gets the rest.

If the side panel is closed, the drawing area takes the full row.

Citations for the size constants: `src/lib/ts/common/Constants.ts` — `width.details`, `width.wrap_phone`, `height.controls`, `thickness.separator.main`.

## How it bootstraps the events

On first mount, it calls the events manager's setup helper. That helper attaches the document-level mouse and touch handlers that drive everything else.

## CSS shape

The outer panel is fixed-positioned at the top-left with the viewport's width and height. Inside, a top region holds the toolbar. Below it, a flex row holds the side panel (when shown) and the drawing area side by side, with a gap between them. Each region has rounded corners.

## Children

- `Controls.svelte` — the toolbar at the top.
- `Details.svelte` — the side panel (only when the side-panel-open flag is set).
- `Graph.svelte` — the drawing area.
- `BuildNotes.svelte` — the full-screen build-notes overlay (only when the build button has been clicked).

## Related files

- `src/lib/ts/managers/Stores.ts` — the side-panel-open flag.
- `src/lib/ts/common/Constants.ts` — the layout constants (panel width, breakpoint, toolbar height, gap thickness).
- `src/lib/ts/events/Events.ts` — the events manager that gets set up on mount.
