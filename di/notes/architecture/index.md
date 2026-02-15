# Architecture

How Design Intuition is built. Read top to bottom — each layer builds on the last.

## 1. Orient

Start here. One page, whole app.

- [Project](./project.md) — entry flow, core loop, Smart Objects, Engine, managers, algebra

## 2. Understand

Where things live, what they do.

- [Files](./files.md) — file layout, every module in a table
- [Core](./core/) — singletons and systems
  - [Managers](./core/managers.md) — who owns what
  - [Algebra](./core/algebra.md) — constraints, expressions, reverse propagation
- [UI](./ui/) — what the user sees
  - [Panel layout](./ui/panel.layout.md) — three regions, CSS, separators
  - [Details](./ui/details.md) — sidebar: preferences, selection, library

## 3. Deep Dive

The render pipeline — projection, occlusion, intersections, overlays.

- [Graph](./graph/) — start with [Three Dimensions](./graph/three.dimensions.md), then explore:
  - [3D Primer](./graph/3D.primer.md) — basics of 3D on a flat screen
  - [Quaternions](./graph/quaternions.md) — rotation without gimbal lock
  - [Spatial](./graph/spatial.md) — coordinate systems, transforms
  - [Two Dimensions](./graph/two.dimensions.md) — 2D mode, face snapping
  - [Three Dimensions](./graph/three.dimensions.md) — the full render pipeline
  - [Intersecting Faces](./graph/intersecting.faces.md) — face-pair clipping
  - [Rendering Types](./graph/rendering.types.md) — type definitions
  - [Drag](./graph/drag.md) — edge and vertex dragging
