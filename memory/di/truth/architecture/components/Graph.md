# Graph

The drawing area — the canvas plus everything that floats over it.

## Location

`src/lib/svelte/main/Graph.svelte`

## What it shows

A full-bleed canvas where the renderer paints the parts. On top of the canvas, three groups of overlay items appear at runtime:

- **Breadcrumbs.** A stack of part names from the root down to the currently selected part, drawn at the top-left when the selected part is at least one level deep. Clicking a crumb selects that ancestor.
- **Build button.** A small label at the bottom-left showing the current build number; clicking opens the build-notes modal.
- **Status strip.** A thin horizontal bar at the bottom of the canvas where transient messages appear ("cannot drag a center", and similar). Lives inside this component so it sits over the canvas.
- **Three text-input overlays.** Each appears only while the user is editing one of three kinds of label:
    - The dimension overlay positions itself over the dimension number being edited and accepts a new value.
    - The angle overlay positions itself over the angle being edited.
    - The face-label overlay positions itself over the face name being edited.

## Resizing

A `ResizeObserver` watches the container and resizes the canvas buffer to match the visible size in pixels. The observer also calls the deferred refresh on the click-target detector so the spatial index picks up the new layout.

## Initialization

On first mount the component sets the canvas width and height once and hands the canvas to the render engine for setup. Subsequent resizes pass the new size to the renderer's resize helper instead of reinitializing.

## Reading the selection

The component subscribes to the selection store and derives two things from it:

- The selected part itself (or root if nothing is selected) — used to compute the breadcrumb trail.
- The breadcrumb trail itself, walked from root down to the selected part.

## Editing-overlay handlers

Each of the three editors (dimension, angle, face-label) exposes a writable that holds the active edit's screen coordinates and current text. The component listens to those writables and renders the input only when the writable is non-null. Enter commits, Escape cancels, blur cancels.

## CSS shape

The container is a relative-positioned full-bleed div. The canvas is set to display block with the grab cursor when the user can tumble. The overlays use absolute positioning relative to the container, with the build button and the status strip pinned to the bottom and the breadcrumbs pinned to the top-left.

## Related files

- `src/lib/ts/render/Render.ts` — the renderer that paints the canvas.
- `src/lib/ts/render/Engine.ts` — the engine that hands the canvas to the renderer on setup.
- `src/lib/ts/editors/Dimension.ts` — the dimension editor whose overlay shows here.
- `src/lib/ts/editors/Angular.ts` — the angle editor whose overlay shows here.
- `src/lib/ts/editors/Face_Label.ts` — the face-label editor whose overlay shows here.
- `src/lib/svelte/main/Status_Strip.svelte` — the status strip rendered inside this component.
- `src/lib/ts/events/Hits.ts` — the click-target detector whose record gets refreshed on resize.
- `src/lib/ts/managers/Selection.ts` — the selection store this component subscribes to.
