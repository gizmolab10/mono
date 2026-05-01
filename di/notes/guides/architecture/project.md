# Project Architecture

How does the app actually run? Here's the big picture.

## Entry Flow

```
index.html
    └── src/main.ts
            └── App.svelte
                    └── Main.svelte
                            ├── Controls.svelte   (top bar)
                            ├── Details.svelte     (left sidebar)
                            └── Graph.svelte       (canvas → Engine.setup)
```

**main.ts** mounts the Svelte app. **App.svelte** renders Main. **Graph.svelte** grabs the canvas element and hands it to `engine.setup()`, which wires everything: camera, scene, animation loop, input handlers, saved state restoration.
## The Core Loop

```
animation.on_tick()
    → engine updates front face
    → render.render()
        → Phase 1: project all vertices (MVP)
        → Phase 2: face fills (painter's algorithm)
        → Phase 2b: occlusion index (Flatbush)
        → Phase 2c: intersection lines between overlapping SOs
        → Phase 3: edges (clipped against occluding faces)
        → Overlays: labels, dimensions, angulars, grid, debug
```

Mouse/scroll input feeds through `Events_3D` → quaternion rotations on the selected SO. The render loop picks up the change next frame.

## Smart Objects

The scene is made of `Smart_Object`s — cuboids with three axes (x, y, z), each carrying a start and end `Attribute`. Attributes hold bounds in mm. An SO wraps an `O_Scene` (the render-side record: vertices, edges, faces, parent, color). They are configured using an [[algebra]].

SOs nest. Each child's world matrix multiplies through its parent's — no gimbal lock, quaternions throughout.

## Engine

The boss. Engine owns:

- **Cuboid topology** — the 12 edges and 6 faces every SO shares
- **Scene lifecycle** — add child, delete SO, save/load via Scenes
- **2D/3D mode** — in 2D, dragging accumulates a scratch orientation that snaps to face boundaries with animated transitions; in 3D, free rotation
- **Input wiring** — mouse drag → rotation, scroll → zoom, click → hit testing

## Matrices

| Matrix | Location | What it does |
|--------|----------|-------------|
| `view` | `camera` | Camera transform via `mat4.lookAt` |
| `projection` | `camera` | Perspective or orthographic projection |
| `mvp_matrix` | `render` | Combined Model-View-Projection, cached per object |

## Render Pipeline

Detailed phase-by-phase breakdown lives in [[three.dimensions]]. The extracted overlay modules (dimensions, angulars, grid) each talk to Render through a slim host interface.
