# Panel layout

The root layout shape: a fixed-position, full-viewport container that holds four regions (toolbar, side panel, drawing area, build-notes overlay).

For the user-facing description, see the [Main component page](../components/Main.md). This page covers the layout decisions.

## Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                   .controls (the toolbar)                       │
│                  (height = h-controls const)                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                 │                                               │
│   .details      │              .graph                           │
│   (the side     │           (the drawing area)                  │
│   panel,        │            (flexes to fill)                   │
│   shown when    │                                               │
│   the side-     │                                               │
│   panel-open    │                                               │
│   flag is set)  │                                               │
│                 │                                               │
└─────────────────┴───────────────────────────────────────────────┘
                            .panel (full viewport)
```

When the build-notes button is clicked, the entire panel is replaced by a single full-screen overlay until dismissed.

## DOM structure

```text
Main.svelte (.panel)
├── (build-notes overlay)            — full-screen, only when active
└── (normal layout)
    ├── .region.controls              — toolbar
    │   └── Controls.svelte
    └── .main                         — flex row
        ├── .region.details           — side panel (only when open)
        │   └── Details.svelte
        └── .region.graph             — drawing area
            └── Graph.svelte
```

## Region styling

- `.panel` — fixed at top-left, full viewport width and height, accent background, project font.
- `.main` — flex row, no overflow, gap between children.
- `.region` — shared: relative position, hidden overflow, rounded corners.
- `.controls` — full width.
- `.graph` — flex grow.
- `.details` — flex-shrink zero so it stays its declared width.

## Sizing

Sizes come from the constants module:

- The toolbar height is bound to the toolbar's measured height.
- The side panel width is the layout constant for the side panel minus two layout gaps. In the phone responsive layout (viewport below seven hundred and twenty pixels), the side panel takes the viewport width minus two layout gaps.
- The drawing area takes whatever width remains after the side panel and gaps.

Citation: `src/lib/svelte/main/Main.svelte` lines 19-33.

## Reactive state

- The viewport width and height are read from the window on mount and updated on every window resize.
- The toolbar's measured height is bound from the toolbar element.
- The side-panel-open flag comes from the stores manager.
- The build-notes flag is component-local.

## What changed from earlier designs

- An older design used a generic `Panel.svelte` component that received its three regions as snippets. That design was removed in favor of direct children — the current `Main.svelte` instantiates the three components explicitly.
- An older design included a separator between the toolbar and the main row, plus a vertical separator between the details and graph regions. The current layout uses a simple gap instead.
- Earlier designs included `Fillets.svelte` and `Box.svelte` components for decorative borders. Those have been removed; the corner rounding now happens via CSS `border-radius` on each region.

## Related files

- [components/Main](../components/Main.md) — the layout component itself.
- `src/lib/ts/common/Constants.ts` — sizes and breakpoints.
- `src/lib/ts/managers/Stores.ts` — the side-panel-open flag.
