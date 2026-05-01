# Controls

The top toolbar — every global control the user can reach without opening a panel.

## Location

`src/lib/svelte/main/Controls.svelte`

## What it shows

A row of clickable controls across the top of the screen:

- A hamburger button on the left that toggles the right-side panel.
- A "save" button that writes the current scene to the library.
- An editing-lock toggle. When the lock is on, clicks on the canvas do not select or drag — only camera tumble works.
- A "fit" button that appears only when the root part has children outside its current bounds. Clicking grows the root to enclose them.
- Six face buttons (bottom, top, left, right, back, front) that orient the camera so the named face is the front-most.
- A "straighten" button that snaps the current orientation to the nearest face-aligned angle.
- A magnet button that toggles rotation-snap on or off.
- A view-mode toggle (3D ↔ 2D).
- A solid-or-x-ray toggle.
- Three decoration toggles for names, dimensions, and angles.
- A small horizontal slider for the guide-line opacity, with the word "guides" above it.
- A wide horizontal slider that zooms the drawing.

## State it reads

The toolbar subscribes to general session values from the stores manager: the current view mode, decorations bitmask, solid flag, side-panel-open flag, forward face index, rotation-snap flag, editing-lock flag, tick counter, orientation, scale, and grid opacity. It also reads the engine to decide when the "fit" button shows and when "straighten" is enabled.

## Three responsive layouts

The toolbar measures its own width and picks one of three layouts:

- **Phone layout.** Width below seven hundred and twenty pixels. Three stacked rows. Top row: hamburger, face buttons, guides slider. Middle row: decorations, view-mode toggle, solid-or-x-ray toggle. Bottom row: straighten and the magnet, then the zoom slider.
- **Mobile layout.** Width between seven hundred and twenty and fourteen hundred pixels. Two stacked rows. Top row: hamburger, save, edit-lock, the three decoration toggles plus view-mode and solid, the guides slider. Bottom row: face buttons, straighten and magnet, the zoom slider.
- **Desktop layout.** Width above fourteen hundred pixels. One row of buttons, with the zoom slider in its own area on the right that flexes into whatever space is left after the buttons (capped at six hundred pixels wide).

The breakpoints come from the constants file. Citation: `src/lib/ts/common/Constants.ts` lines 86-87 — `wrap_mobile: 1400`, `wrap_phone: 720`.

## How drag-targets register

Every clickable in the toolbar registers itself with the click-target detector under a string id (for example "save", "fit", "view-mode", or "face-0"). The detector keeps a spatial index of these targets and routes mouse-down events to the right handler.

## CSS shape

A flex row across the full width. Inside, a desktop layout has two children: the buttons block (also a flex row) and the slider block (flexes to fill the remainder). Phone and mobile layouts use a column of flex rows instead.

## Related files

- `src/lib/svelte/mouse/Slider.svelte` — the slider control used for both the zoom and guides sliders.
- `src/lib/ts/managers/Stores.ts` — the store values the toolbar subscribes to.
- `src/lib/ts/render/Engine.ts` — the engine methods the toolbar calls (toggle view mode, orient to face, straighten, fit to children, scale up/down, toggle rotation snap).
- `src/lib/ts/common/Constants.ts` — the breakpoint and size constants.
