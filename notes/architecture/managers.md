# Managers

i wanted clean separation. Each manager owns one concern.

> **The pattern**: A manager is:
> - responsible for a specific process
> - manages multiple objects (factory + lookup)
> - a singleton

## Overview

| Class | Export | What it does |
|-------|--------|--------------|
| `Scene` | `scene` | O_Scene CRUD, hierarchy |
| `Camera` | `camera` | View/projection matrices |
| `Render` | `render` | Projection pipeline, draw calls |
| `Input` | `input` | Mouse events → rotation |
| `Animation` | `animation` | rAF loop, tick callbacks |

## File Layout

```
src/lib/ts/managers/
├── index.ts         # re-exports singletons
├── Scene.ts
├── Camera.ts
├── Render.ts
├── Input.ts
└── Animation.ts
```

## Dependencies

```
animation.on_tick()
    ↓
input → scene (rotate object)
    ↓
render ← camera (matrices)
    ↓
scene.get_all() → render
```

## Scene

Factory + registry for `O_Scene` instances.

```ts
scene.create({ vertices, edges, color, scale?, parent? }) → O_Scene
scene.get(id) → O_Scene | undefined
scene.get_all() → O_Scene[]
scene.destroy(id)
scene.clear()
```

## Camera

View and projection matrices. Nothing fancy.

```ts
camera.init(size: Size)
camera.set_position(eye, center?)
camera.set_fov(fov)
camera.view       // mat4
camera.projection // mat4
```

## Render

The projection pipeline and drawing.

```ts
render.init(canvas)
render.render()   // clears + draws all scene objects
```

## Input

Mouse drag handling. Converts drag deltas to quaternion rotations.

```ts
input.init(canvas)
input.set_drag_handler((delta: Point) => void)
input.rotate_object(obj, delta, sensitivity?)
```

## Animation

Frame loop with delta time. Register callbacks, they fire every frame.

```ts
animation.start()
animation.stop()
animation.on_tick((dt) => void)
```
