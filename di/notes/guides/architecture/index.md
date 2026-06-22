# Architecture

How Design Intuition is built. Read top to bottom — each layer builds on the last.

## 1. Orient

Start here. One page, whole app.

- See the [Overview](../project/overview/) folder for the project shape, file layout, and the entry-flow walk-through.

## 2. Understand

Where things live, what they do.

- [Core](./core/) — singletons and systems
    - [Managers](di/di%20notes/di%20guides/di%20architecture/core/managers.md) — who owns what
    - [Algebra](algebra.md) — constraints, expressions, reverse propagation
    - [Errors](di/di%20notes/di%20guides/di%20architecture/core/errors.md) — structured errors, suggestion buttons, name validation
    - [History](di/di%20notes/di%20guides/di%20architecture/core/history.md) — undo and redo, snapshot sites, restore path
    - [Preferences](di/di%20notes/di%20guides/di%20architecture/core/Preferences.md) — local-storage wrapper
    - [Scenes](scenes.md) — scene loading and the two-phase build pattern
    - [Smart_Objects](Smart_Objects.md) — part data shape
    - [Units](di/di%20notes/di%20guides/di%20architecture/core/units.md) — millimetre storage, four families, formatting and parsing
    - [Versions](versions.md) — file format migration
- [Components](./components/) — per-file reference pages for layout components
    - [Details](di/di%20notes/di%20guides/di%20architecture/components/Details.md) — sidebar: preferences, library, parts, part
- [UI](./ui/) — what the user sees
    - [Panel layout](panel.layout.md) — three regions, CSS, separators
    - [Hits](hits%20system.md) — click and hover dispatch
    - [Key paths](key%20paths.md) — keyboard shortcuts grouped by context
    - [Style](di/di%20notes/di%20guides/di%20architecture/ui/style.md) — CSS conventions and design tokens

## 3. Deep dive

The render pipeline — projection, occlusion, intersections, overlays.

- [Graph](./graph/) — start with [Three Dimensions](three.dimensions.md), then explore:
    - [Two Dimensions](two.dimensions.md) — 2D mode, face snapping
    - [Three Dimensions](three.dimensions.md) — the full render pipeline
    - [Intersecting Faces](intersecting.faces.md) — face-pair clipping
    - [Rendering Types](rendering.types.md) — type definitions
    - [Drag](drag.md) — edge and vertex dragging
    - [Axes](axes.md) — rotation, swap, angular rendering
    - [Dimensionals](./graph/dimensionals.md) — measurement labels with witness lines
    - [Editors](editors.md) — canvas input editors and their shared lifecycle
    - [Hits_3D](Hits_3D.md) — three-dimensional hit testing
    - [Rotation](di/di%20notes/di%20guides/di%20architecture/graph/rotation.md) — the world-versus-camera split and the camera-view extent
    - [Render](di/di%20notes/di%20guides/di%20architecture/graph/render.md) — the per-frame pipeline overview
    - [Repeaters](di/di%20notes/di%20guides/di%20architecture/graph/repeaters.md) — clone generation for studs, joists, stairs

## Contents

- [Components](./components/)
- [Core](./core/)
- [Graph](./graph/)
- [UI](./ui/)
