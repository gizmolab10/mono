# Project Architecture

How the app actually runs. Big picture.

## Entry flow

```text
index.html
    └── src/main.ts
            └── App.svelte
                    └── Main.svelte
                            ├── Controls.svelte    (the toolbar at the top)
                            ├── Details.svelte     (the side panel on the right)
                            ├── Graph.svelte       (the drawing area; hands its canvas to the engine)
                            └── BuildNotes.svelte  (a full-screen overlay, only when the build button is clicked)
```

The mount file boots the Svelte tree. The root component sets global styles. The layout component sizes its four children. The drawing-area component grabs its canvas element and hands it to the engine's setup helper, which wires the camera, scene, animation loop, input handlers, and saved-state restoration.

## The core loop

```text
animation tick
    → engine updates the front-face indicator
    → renderer paints the canvas
        → Phase 1: project every vertex (camera matrix times world position)
        → Phase 2: face fills, drawn back to front
        → Phase 2b: build the occluder index for face-pair clipping
        → Phase 2c: intersection lines between overlapping parts
        → Phase 3: edges, clipped against any occluding faces
        → Overlays: labels, dimensions, angles, grid, debug
```

Mouse input feeds through the canvas event handler into the drag tool, which routes the gesture either to a part-resize, a part-rotation, or a camera tumble. The toolbar's zoom slider and a small +/- step pair drive the scale store. The render loop picks up every change on the next tick.

## Parts

The scene is made of parts. A part is a cuboid with three directions (x, y, z), each direction holding a start, a length, and an end attribute plus an invariant marker that says which of the three is computed from the other two. A center value is computed on every read; it has no stored slot.

A part also carries a back-reference to a scene-tree entry. The scene-tree entry holds the geometry the renderer paints: vertices, edges, faces, color, parent reference. Parts nest, so each part's world transform multiplies through its parent's.

Parts are configured with the [algebra](algebra.md) — formulas in the attribute cells.

## Engine

The boss. The engine owns:

- The animation tick loop.
- Scene lifecycle helpers — add a child, delete a part, save and load scenes, duplicate a subtree, re-parent a part to a new place in the tree.
- Repeater management — when a part has a repeater configuration set, the engine generates the right number of clones from the template and keeps them in sync as the parent or the constraint changes.
- View-mode switching — between three-dimensional free-rotation and two-dimensional face-aligned mode. Two-dimensional mode snaps the orientation onto a face boundary with an animated transition.
- Camera wiring — the engine receives the canvas from the drawing-area component on setup and hands it to the renderer.
- Selection-aware actions — fit-to-children, orient-to-face, straighten, scale up and down.

## Matrices

- The view matrix lives on the camera. It is a look-at transform from the camera position.
- The projection matrix lives on the camera. It is either perspective (three-dimensional mode) or orthographic (two-dimensional mode).
- The model-view-projection matrix is built per-part inside the renderer once per frame and reused for every vertex on that part.

## Render pipeline

A phase-by-phase breakdown lives in [Three Dimensions](three.dimensions.md). The extracted overlay modules (dimensions, angles, grid, axes) each talk to the renderer through a small host interface.

## Selection

The current selection is a list of parts, not a single part. An empty list means nothing is selected; one item means single selection (the historic case); two or more means a multi-selection set built up by command-clicks. Renderers and panels read this list either through a backwards-compatible "the only selected part" view or directly as a list. Details lives in [Hits_3D](Hits_3D.md) and the [Selection manager](di/di%20notes/di%20guides/di%20architecture/core/managers.md).
