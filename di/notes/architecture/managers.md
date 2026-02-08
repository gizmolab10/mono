# Managers

Each manager owns one concern. Singleton pattern throughout.

## Overview

| Class         | Export        | Location    | What it does                             |
| ------------- | ------------- | ----------- | ---------------------------------------- |
| `Scene`       | `scene`       | `render/`   | O_Scene CRUD, hierarchy                  |
| `Camera`      | `camera`      | `render/`   | View/projection matrices                 |
| `Render`      | `render`      | `render/`   | Projection pipeline, draw calls          |
| `Events_3D`   | `e3`          | `signals/`  | Canvas mouse events → rotation, hover    |
| `Animation`   | `animation`   | `render/`   | rAF loop, tick callbacks                 |
| `Hits`        | `hits`        | `managers/` | RBush spatial index, click routing (DOM) |
| `Hits_3D`     | `hits_3d`     | `managers/` | 3D hit testing for canvas objects        |
| `Components`  | `components`  | `managers/` | Component registry                       |
| `Preferences` | `preferences` | `managers/` | localStorage wrapper                     |

## File Layout

```
src/lib/ts/
├── managers/
│   ├── Components.ts
│   ├── Hits.ts
│   ├── Hits_3D.ts
│   └── Preferences.ts
├── render/
│   ├── index.ts
│   ├── Animation.ts
│   ├── Camera.ts
│   ├── Render.ts
│   ├── Scene.ts
│   └── Setup.ts
└── signals/
    └── Events_3D.ts
```

## Dependencies

```
animation.on_tick()
    ↓
events → scene (rotate object)
    ↓
render ← camera (matrices)
    ↓
scene.get_all() → render
    ↓
render → hits_3d.update_projected()

events.mousemove → hits_3d.test() → hits_3d.set_hover()
    ↓
render.render_hover()

hits ← components (spatial index for DOM)
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

## Events_3D

Canvas mouse events → quaternion rotations, hover detection.

```ts
e3.init(canvas)
e3.set_drag_handler((delta: Point) => void)
e3.rotate_object(obj, delta, sensitivity?)
// mousemove → hits_3d.test() → set_hover()
```

## Animation

Frame loop with delta time.

```ts
animation.start()
animation.stop()
animation.on_tick((dt) => void)
```

## Hits

RBush-based spatial indexing for DOM click/hover detection.

```ts
hits.register(target: S_Hit_Target)
hits.unregister(id: string)
hits.handle_mouse(s_mouse: S_Mouse)
hits.target_at(point: Point) → S_Hit_Target | null
```

## Hits_3D

Screen-space hit testing for 3D canvas objects (Smart Objects).

```ts
hits_3d.register(so: Smart_Object)
hits_3d.unregister(so: Smart_Object)
hits_3d.update_projected(scene_id: string, projected: Projected[])
hits_3d.test(point: Point) → Hit_3D_Result | null
hits_3d.set_hover(result: Hit_3D_Result | null)
hits_3d.set_selection(result: Hit_3D_Result | null)
// w_hover, w_selection: Writable<Hit_3D_Result | null>
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
