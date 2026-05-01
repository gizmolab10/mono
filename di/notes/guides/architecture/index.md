# Architecture

How Design Intuition is built. Read top to bottom — each layer builds on the last.

## 1. Orient

Start here. One page, whole app.

- See the [Main](../project/main/) folder for the project shape, file layout, best practices, stipulations, and testing.

## 2. Understand

Where things live, what they do.

- [Core](./core/) — singletons and systems
    - [Managers](core/managers.md) — who owns what
    - [Algebra](./core/algebra.md) — constraints, expressions, reverse propagation
    - [Preferences](./core/Preferences.md) — local-storage wrapper
    - [Scenes](./core/scenes.md) — scene loading and the two-phase build pattern
    - [Smart_Objects](./core/Smart_Objects.md) — part data shape
    - [Versions](./core/versions.md) — file format migration
- [Components](./components/) — per-file reference pages for layout components
- [UI](./ui/) — what the user sees
    - [Panel layout](./ui/panel.layout.md) — three regions, CSS, separators
    - [Details](ui/details.md) — sidebar: preferences, selection, library
    - [Hits](./ui/hits.md) — click and hover dispatch
    - [Style](./ui/style.md) — CSS conventions and design tokens

## 3. Deep dive

The render pipeline — projection, occlusion, intersections, overlays.

- [Graph](./graph/) — start with [Three Dimensions](./graph/three.dimensions.md), then explore:
    - [Two Dimensions](./graph/two.dimensions.md) — 2D mode, face snapping
    - [Three Dimensions](./graph/three.dimensions.md) — the full render pipeline
    - [Intersecting Faces](./graph/intersecting.faces.md) — face-pair clipping
    - [Rendering Types](./graph/rendering.types.md) — type definitions
    - [Drag](./graph/drag.md) — edge and vertex dragging
    - [Axes](./graph/axes.md) — rotation, swap, angular rendering
    - [Dimensionals](./graph/dimensionals.md) — measurement labels with witness lines
    - [Hits_3D](./graph/Hits_3D.md) — three-dimensional hit testing
    - [Rotation](./graph/rotation.md) — the world-versus-camera split and the camera-view extent
    - [Render](./graph/render.md) — the per-frame pipeline overview
    - [Repeaters](./graph/repeaters.md) — clone generation for studs, joists, stairs

## Contents

- [Components](./components/)
- [Core](./core/)
- [Graph](./graph/)
- [Ui](./ui/)

The research folder (3D primer, library-versioning notes, spatial-acceleration research) lives under [project/research](../project/research/).
