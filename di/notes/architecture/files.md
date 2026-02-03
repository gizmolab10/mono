# File Layout

Where everything lives.

```
src/
├── main.ts                  # Mounts Svelte app
├── App.svelte               # Root component
├── vite-env.d.ts            # Type declarations
└── lib/
    ├── svelte/
    │   ├── draw/
    │   │   └── Printable.svelte
    │   └── main/
    │       ├── Controls.svelte
    │       ├── Details.svelte
    │       ├── Graph.svelte
    │       └── Main.svelte
    └── ts/
        ├── common/
        │   ├── index.ts
        │   ├── Constants.ts
        │   ├── Extensions.ts
        │   └── Testworthy_Utilities.ts
        ├── draw/
        │   ├── index.ts
        │   ├── Colors.ts
        │   └── SVG_Paths.ts
        ├── managers/
        │   ├── index.ts
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
        │   └── Trivial.ts
        ├── runtime/
        │   ├── index.ts
        │   ├── Identifiable.ts
        │   └── Smart_Object.ts
        ├── signals/
        │   ├── index.ts
        │   ├── Events.ts
        │   ├── Events_3D.ts
        │   └── Mouse_Timer.ts
        ├── state/
        │   ├── index.ts
        │   ├── S_Component.ts
        │   ├── S_Hit_Target.ts
        │   └── S_Mouse.ts
        ├── tests/
        │   ├── Angle.test.ts
        │   ├── Colors.test.ts
        │   ├── Coordinates.test.ts
        │   ├── Extensions.test.ts
        │   ├── Testworthy_Utilities.test.ts
        │   └── setup.ts
        └── types/
            ├── index.ts
            ├── Angle.ts
            ├── Coordinates.ts
            ├── Enumerations.ts
            ├── Interfaces.ts
            └── Types.ts
```

## Entry

| File | What it does |
|------|--------------|
| `main.ts` | Mounts `App.svelte` |
| `App.svelte` | Renders Main, initializes app |

## Svelte Components

| File | What it does |
|------|--------------|
| `main/Main.svelte` | Root layout, viewport management |
| `main/Controls.svelte` | Top toolbar region |
| `main/Details.svelte` | Left sidebar region |
| `main/Graph.svelte` | Canvas region with 3D rendering |
| `draw/Printable.svelte` | Print-friendly output |

## Common

| File | What it does |
|------|--------------|
| `Constants.ts` | App-wide constants (`k` singleton) |
| `Extensions.ts` | Number/String prototype extensions |
| `Testworthy_Utilities.ts` | General utilities (`tu` singleton) |

## Draw

| File | Export | What it does |
|------|--------|--------------|
| `Colors.ts` | `colors` | Color utilities, reactive stores |
| `SVG_Paths.ts` | `svg_paths` | SVG path string generators |

## Managers

| File | Export | What it does |
|------|--------|--------------|
| `Preferences.ts` | `preferences` | localStorage wrapper |
| `Hits.ts` | `hits` | RBush spatial index, click routing |
| `Hits_3D.ts` | `hits_3d` | 3D hit testing for canvas objects |
| `Components.ts` | `components` | Component registry |

## Render

| File | Export | What it does |
|------|--------|--------------|
| `Scene.ts` | `scene` | O_Scene CRUD, hierarchy |
| `Camera.ts` | `camera` | View/projection matrices |
| `Render.ts` | `render` | Projection pipeline, draw calls |
| `Animation.ts` | `animation` | rAF loop, tick callbacks |
| `Trivial.ts` | `init` | Demo scene setup |

## Signals

| File | Export | What it does |
|------|--------|--------------|
| `Events.ts` | `e` | Unified mouse event handlers (DOM) |
| `Events_3D.ts` | `e3` | Canvas mouse events → rotation, hover |
| `Mouse_Timer.ts` | `Mouse_Timer` | Long-click, double-click timing |

## State

| File | What it does |
|------|--------------|
| `S_Mouse.ts` | Mouse event state encapsulation |
| `S_Hit_Target.ts` | Hit target state for spatial indexing |
| `S_Component.ts` | Component state for hit detection |

## Runtime

| File | What it does |
|------|--------------|
| `Identifiable.ts` | Base class with `id` and `hid` |
| `Smart_Object.ts` | Geometry with attributes, wraps O_Scene |

## Types

| File | What it does |
|------|--------------|
| `Angle.ts` | `Angle` class, quadrant/orientation enums |
| `Attribute.ts` | Name/value pairs for Smart Objects |
| `Coordinates.ts` | `Point`, `Size`, `Rect`, `Point3`, etc. |
| `Enumerations.ts` | App-wide enums, `T_Hit_3D` |
| `Interfaces.ts` | `Projected`, `O_Scene` interfaces |
| `Types.ts` | Type aliases, callbacks |
