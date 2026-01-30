# Managers

Each manager owns one concern. Singleton pattern throughout.

## Overview

| Class | Export | Location | What it does |
|-------|--------|----------|--------------|
| `Scene` | `scene` | `render/` | O_Scene CRUD, hierarchy |
| `Camera` | `camera` | `render/` | View/projection matrices |
| `Render` | `render` | `render/` | Projection pipeline, draw calls |
| `Input` | `input` | `render/` | Mouse events → rotation |
| `Animation` | `animation` | `render/` | rAF loop, tick callbacks |
| `Hits` | `hits` | `managers/` | RBush spatial index, click routing |
| `Components` | `components` | `managers/` | Component registry |
| `Preferences` | `preferences` | `managers/` | localStorage wrapper |

## File Layout

```
src/lib/ts/
├── managers/
│   ├── Components.ts
│   ├── Hits.ts
│   └── Preferences.ts
└── render/
    ├── index.ts
    ├── Animation.ts
    ├── Camera.ts
    ├── Input.ts
    ├── Render.ts
    ├── Scene.ts
    └── Trivial.ts
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

hits ← components (spatial index)
    ↓
Events.ts → hits.handle_mouse()
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

View and projection matrices.

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
render.render()
render.resize(width, height)
```

## Input

Mouse drag → quaternion rotations.

```ts
input.init(canvas)
input.set_drag_handler((delta: Point) => void)
input.rotate_object(obj, delta, sensitivity?)
```

## Animation

Frame loop with delta time.

```ts
animation.start()
animation.stop()
animation.on_tick((dt) => void)
```

## Hits

RBush-based spatial indexing for click/hover detection.

```ts
hits.register(target: S_Hit_Target)
hits.unregister(id: string)
hits.handle_mouse(s_mouse: S_Mouse)
hits.target_at(point: Point) → S_Hit_Target | null
```

## Components

Registry for UI components that participate in hit detection.

```ts
components.register(component: S_Component)
components.unregister(id: string)
components.get(id: string) → S_Component | null
```

## Preferences

localStorage persistence with `di:` prefix.

```ts
preferences.read(key: T_Preference) → T | null
preferences.write(key: T_Preference, value: T)
preferences.remove(key: T_Preference)
preferences.restore()
```
