# File Layout

Where everything lives.

```text
src/
├── main.ts                   # Mounts Svelte app
├── App.svelte                # Root component
├── vite-env.d.ts             # Type declarations
└── lib/
    ├── svelte/
    │   ├── details/          # Right-side panel and its sub-panels
    │   │   ├── Details.svelte
    │   │   ├── Hideable.svelte
    │   │   ├── D_Givens.svelte
    │   │   ├── D_Library.svelte
    │   │   ├── D_Parts.svelte
    │   │   ├── D_Preferences.svelte
    │   │   ├── D_Selection.svelte
    │   │   ├── P_Angles.svelte
    │   │   ├── P_Attributes.svelte
    │   │   └── P_Repeat.svelte
    │   ├── main/             # Top-level layout components
    │   │   ├── Main.svelte
    │   │   ├── Controls.svelte
    │   │   ├── Graph.svelte
    │   │   ├── BuildNotes.svelte
    │   │   ├── UserGuide.svelte
    │   │   └── Status_Strip.svelte
    │   └── mouse/            # Reusable mouse-driven controls
    │       ├── Close_Button.svelte
    │       ├── Separator.svelte
    │       ├── Slider.svelte
    │       └── Steppers.svelte
    └── ts/
        ├── algebra/          # Formula compile, evaluate, propagate
        │   ├── index.ts
        │   ├── Compiler.ts
        │   ├── Constraints.ts
        │   ├── Errors.ts
        │   ├── Evaluator.ts
        │   ├── Givens.ts
        │   ├── Nodes.ts
        │   ├── Orientation.ts
        │   └── Tokenizer.ts
        ├── common/           # App-wide constants and helpers
        │   ├── index.ts
        │   ├── Configuration.ts
        │   ├── Constants.ts
        │   ├── Dirty.ts
        │   └── Extensions.ts
        ├── editors/          # Inline editing for canvas labels
        │   ├── index.ts
        │   ├── Angular.ts
        │   ├── Dimension.ts
        │   ├── Drag.ts
        │   └── Face_Label.ts
        ├── events/           # Mouse event routing and hit testing
        │   ├── index.ts
        │   ├── Events.ts
        │   ├── Events_3D.ts
        │   ├── Hit_Target.ts
        │   ├── Hits.ts
        │   ├── Hits_3D.ts
        │   ├── Mouse_Timer.ts
        │   ├── S_Hit_Target.ts
        │   └── S_Mouse.ts
        ├── managers/         # Singletons that own app state
        │   ├── index.ts
        │   ├── History.ts
        │   ├── Parts.ts
        │   ├── Preferences.ts
        │   ├── Scenes.ts
        │   ├── Selection.ts
        │   ├── Status.ts
        │   ├── Stores.ts
        │   └── Versions.ts
        ├── render/           # Canvas rendering pipeline
        │   ├── index.ts
        │   ├── Animation.ts
        │   ├── Camera.ts
        │   ├── Engine.ts
        │   ├── Facets.ts
        │   ├── R_Angulars.ts
        │   ├── R_Axes.ts
        │   ├── R_Dimensions.ts
        │   ├── R_Grid.ts
        │   ├── Render.ts
        │   ├── Scene.ts
        │   └── Topology.ts
        ├── runtime/          # Smart Object data model
        │   ├── index.ts
        │   ├── Axis.ts
        │   ├── Identifiable.ts
        │   └── Smart_Object.ts
        ├── tests/            # Unit tests
        │   ├── setup.ts
        │   └── *.test.ts (about thirty files)
        ├── types/            # Type aliases and interfaces
        │   ├── index.ts
        │   ├── Angle.ts
        │   ├── Attribute.ts
        │   ├── Coordinates.ts
        │   ├── Enumerations.ts
        │   ├── Interfaces.ts
        │   ├── Types.ts
        │   └── Units.ts
        └── utilities/        # Color helpers and SVG path generators
            ├── index.ts
            ├── Colors.ts
            ├── SVG_Paths.ts
            └── Testworthy_Utilities.ts

manual/                      # In-app help content (markdown + screenshots)
├── index.md                 # First-steps walkthrough
├── images/                  # Screenshots used by the manual pages
└── reference-guide/         # Reference pages (one per topic)
    ├── index.md             # Reference-guide table of contents
    ├── build notes.md
    ├── formulas.md
    ├── library.md
    ├── repeaters.md
    ├── reparenting.md
    ├── save and load.md
    ├── selection.md
    ├── undo and redo.md
    └── units.md
```

## Entry

- `main.ts` — Mounts the root component
- `App.svelte` — Sets global styles and runs the layout component

## Svelte components

- `main/` — The four layout regions (controls, details, graph, build-notes), the in-app help overlay (UserGuide), plus the small status strip rendered inside the graph
- `details/` — The right-side panel and its three sub-panels (preferences, library, parts) plus the sub-sub-panels for the parts panel (attributes, angles, repeat, givens, selected, name)
- `mouse/` — Reusable mouse-driven controls (sliders, steppers, separators, close button)
- `manual/` — Markdown source for the in-app help overlay; the help component imports every file under here as raw text and renders the active page at runtime

## Algebra

Formula language used inside attribute cells. Compile a typed expression to a tree, walk it forward to read a number, walk it backward to push a change up to its source.

- `Tokenizer.ts` — Turns formula text into a token stream
- `Compiler.ts` — Turns the token stream into a tree
- `Nodes.ts` — Tree node shapes
- `Evaluator.ts` — Walks the tree forward (read) and backward (propagate)
- `Constraints.ts` — Glue between the algebra and the scene; resolves names, writes values, runs propagation, holds the start/length/end/center letter rules
- `Givens.ts` — Global table of named numbers a formula can read
- `Errors.ts` — Parse-error classification with span and message
- `Orientation.ts` — Compute orientation from bounds and back

## Common

- `Constants.ts` — App-wide sizes, gaps, fonts
- `Configuration.ts` — Run-time configuration values
- `Dirty.ts` — A writable that also flags the canvas as out-of-date
- `Extensions.ts` — Number and String prototype extensions

## Editors

Inline canvas editors for dimension labels, angle labels, and face labels — and the drag helper that powers stretch and rotate.

- `Dimension.ts` — Click a dimension number on the canvas to edit it
- `Angular.ts` — Click an angle label on the canvas to edit it
- `Face_Label.ts` — Click a face label on the canvas to edit it
- `Drag.ts` — Stretch and rotate behavior; tracks current drag target

## Events

Mouse event routing for both the canvas (3D) and the panels (2D), plus the spatial index that maps clicks to interactive targets.

- `Events.ts` — Document-level mouse and touch events
- `Events_3D.ts` — Canvas-level mouse events; starts and ends drags
- `Hits.ts` — Spatial index of clickable targets in the panels
- `Hits_3D.ts` — 3D hit testing on the canvas — corners, edges, faces, the click stack with drill-down rule
- `Hit_Target.ts` — Hit-target registration helper
- `S_Hit_Target.ts` — Per-target state (rect, hover, etc.)
- `S_Mouse.ts` — Mouse event state encapsulation
- `Mouse_Timer.ts` — Long-click and double-click timing

## Managers

Singletons that own app-wide state.

- `Stores.ts` — General session and persistent values shared across components
- `Selection.ts` — The list of currently selected parts (empty / one / many)
- `Parts.ts` — The collapsed-rows set and the tree-walk helpers for the parts table
- `Scenes.ts` — Scene save and load
- `History.ts` — Undo and redo stack
- `Preferences.ts` — Local-storage wrapper
- `Status.ts` — The on-screen status strip
- `Versions.ts` — Library object version migration

## Render

The canvas rendering pipeline.

- `Engine.ts` — The top-level orchestrator — owns the render loop, scene operations, repeater sync
- `Render.ts` — The actual draw calls — projection, edges, faces, overlays
- `Animation.ts` — The animation tick loop
- `Camera.ts` — View and projection matrices, viewport extent
- `Scene.ts` — The master list of scene entries
- `Topology.ts` — Visible-edge clipping pipeline
- `Facets.ts` — Face-pair intersection helper
- `R_Grid.ts` — The background grid
- `R_Axes.ts` — The axis indicators
- `R_Dimensions.ts` — The dimension labels around the selected part
- `R_Angulars.ts` — The angle labels around the selected part

## Runtime

- `Smart_Object.ts` — The data shape for one part — bounds, attributes, formulas, repeater config
- `Axis.ts` — One direction inside a Smart Object — start, length, end, center, invariant
- `Identifiable.ts` — Base class with id and human-id

## Tests

About thirty unit-test files under `tests/`, named after the module they pin down. The setup file boots a test environment.

## Types

- `Types.ts` — Bound names, axis names, callbacks
- `Enumerations.ts` — App-wide enums (`T_Hit_3D`, `T_Editing`, etc.)
- `Interfaces.ts` — Scene entry, projected vertex, label rect
- `Coordinates.ts` — Point, Size, Rect classes
- `Angle.ts` — Angle class with quadrant and orientation
- `Attribute.ts` — One name/value/formula entry on a Smart Object
- `Units.ts` — Imperial / metric conversion

## Utilities

- `Colors.ts` — Color values, reactive color stores
- `SVG_Paths.ts` — SVG path strings (hamburger, etc.)
- `Testworthy_Utilities.ts` — Small generic helpers
