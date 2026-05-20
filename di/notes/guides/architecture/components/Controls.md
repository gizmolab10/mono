# Controls

The strip of global controls at the top and bottom of the screen — every command the user can reach without opening a panel. The strip is split into two components: the primary controls (a button toolbar that adapts to width) and the secondary controls (the wide zoom slider plus a status row underneath).

## Primary controls

`src/lib/svelte/main/Primary_Controls.svelte`

A row of clickable controls. The component measures its own width and picks one of three layouts.

### What it shows

- A hamburger button that toggles the details panel.
- An undo / redo pair of stepper buttons.
- A save button that writes the current scene to the library.
- An editing-lock toggle. When the lock is on, clicks on the canvas do not select or drag — only camera tumble works.
- A fit button that appears only when editing is allowed AND the root part has children outside its current bounds. Clicking grows the root to enclose them.
- A view-mode toggle (3D ↔ 2D).
- A solid-or-x-ray toggle.
- A straighten button that snaps the current orientation to the nearest face-aligned angle.
- A magnet button that toggles rotation-snap on or off.
- Three decoration toggles for names, dimensions, and angles.
- Six face buttons (bottom, top, left, right, back, front) that orient the camera so the named face points toward the viewer.
- A help button that opens the user guide.

### State it reads

The primary controls subscribe to general session values from the stores manager: the current view mode, decorations bitmask, solid flag, details-panel-open flag, forward face index, rotation-snap flag, editing-lock flag, tick counter, and orientation. It also reads the engine and the history manager to decide when the fit, straighten, undo, and redo buttons are enabled.

### Three responsive layouts

The component measures its own width and picks one:

- **Phone layout.** Width below 720 pixels. Three stacked rows. Top row: hamburger, undo/redo, save, editing-lock, fit (when active), straighten, help. Middle row: view-mode, solid-or-x-ray, decorations. Bottom row: magnet, face buttons.
- **Mobile layout.** Width between 720 and 1400 pixels. Two stacked rows. Top row: hamburger, undo/redo, save, editing-lock, fit (when active), view-mode, solid-or-x-ray, straighten, magnet, help. Bottom row: decorations and face buttons centred.
- **Desktop layout.** Width above 1400 pixels. One row. Everything from the mobile top row plus the decorations and face buttons fits on a single line.

The breakpoints come from the constants file. Citation: `src/lib/ts/common/Constants.ts` — `wrap_mobile: 1400`, `wrap_phone: 720`.

## Secondary controls

`src/lib/svelte/main/Secondary_Controls.svelte`

Two bands below the primary controls. The top band holds the wide zoom slider. The bottom band runs build number, status strip, and guides slider across the width.

### Bands shown

Top band:

- A wide horizontal zoom slider that scales the drawing. Logarithmic, from 0.01 up to 10000.

Bottom band:

- A build-number button on the left that opens the build notes.
- The status strip in the middle (orientation, scale, dropped-dimensions count, and other live readouts).
- A guides cluster on the right — the word "guides" followed by a short opacity slider for the guide-line opacity.

### State the secondary controls read

The secondary controls subscribe to two store values: grid opacity and the current scale. The build-number text comes from the constants file.

## How click targets register

Every clickable in both components registers itself with the click-target detector under a string id (for example "save", "fit", "view-mode", or "face-0"). The detector keeps a spatial index of these targets and routes mouse-down events to the right handler.

## Related files

- `src/lib/svelte/mouse/Slider.svelte` — the slider control used for both the zoom and guides sliders.
- `src/lib/svelte/mouse/Steppers.svelte` — the undo/redo stepper pair.
- `src/lib/svelte/main/Status_Strip.svelte` — the readout strip that sits in the middle of the secondary controls' bottom band.
- `src/lib/ts/managers/Stores.ts` — the store values both components subscribe to.
- `src/lib/ts/render/Engine.ts` — the engine methods the primary controls call (toggle view mode, orient to face, straighten, fit to children, scale up/down, toggle rotation snap, undo, redo).
- `src/lib/ts/managers/History.ts` — the source for undo and redo availability.
- `src/lib/ts/common/Constants.ts` — the breakpoint, size, and build-number constants.
