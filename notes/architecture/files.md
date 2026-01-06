# File Layout

Where everything lives. There's a lot of files, and we're only just getting started.

```
src/
├── main.ts                  # Mounts Svelte app
├── App.svelte               # Root component, canvas + UI
├── vite-env.d.ts            # Type declarations
└── lib/ts/
    ├── test.ts              # init() wires managers
    ├── common/
    │   ├── Constants.ts     # App-wide constants
    │   └── Extensions.ts    # Number/String prototype extensions
    ├── managers/
    │   ├── index.ts         # re-exports singletons
    │   ├── Animation.ts
    │   ├── Camera.ts
    │   ├── Input.ts
    │   ├── Render.ts
    │   └── Scene.ts
    ├── runtime/
    │   └── Identifiable.ts  # Base class with id/hid
    ├── state/
    │   └── S_Mouse.ts       # Mouse state encapsulation
    ├── types/
    │   ├── index.ts         # re-exports
    │   ├── Angle.ts         # Orientation, Quadrant
    │   ├── Coordinates.ts   # Point, Size, Rect, Polar, Point3, Size3, Block
    │   ├── Enumerations.ts  # App-wide enums
    │   ├── Interfaces.ts    # Projected, O_Scene
    │   └── Types.ts         # Type aliases (Dictionary, Integer, etc.)
    └── utilities/
        ├── Colors.ts        # Color utilities
        └── Testworthy_Utilities.ts  # General utilities (tu singleton)
```

## Entry

The front door. Svelte mounts, canvas renders, managers wake up.

| File | What it does |
|------|--------------|
| `main.ts` | Mounts `App.svelte` |
| `App.svelte` | Renders canvas, calls `init(canvas)` on mount |
| `test.ts` | Wires managers, sets up scene |

## Common

Shared foundations, that everything else relies on.

| File | What it does |
|------|--------------|
| `common/Constants.ts` | App-wide constants |
| `common/Extensions.ts` | Number/String prototype extensions (`isBetween`, `hash`, etc.) |

## Types

Geometry primitives, enums, interfaces—imported everywhere.

| File | What it does |
|------|--------------|
| `types/Angle.ts` | `Angle` class, `T_Quadrant`, `T_Orientation`, `Direction` enums |
| `types/Coordinates.ts` | `Point`, `Size`, `Rect`, `Polar`, `Point3`, `Size3`, `Block` classes |
| `types/Enumerations.ts` | App-wide enums (`T_Signal`, `T_Persistence`, `T_Predicate`, etc.) |
| `types/Interfaces.ts` | `Projected`, `O_Scene` interfaces |
| `types/Types.ts` | Type aliases (`Dictionary`, `Integer`, callbacks) |

## Managers

Singletons that own specific concerns. Simple class names, lowercase exports.

| File | Export | Class |
|------|--------|-------|
| `Scene.ts` | `scene` | `Scene` |
| `Camera.ts` | `camera` | `Camera` |
| `Render.ts` | `render` | `Render` |
| `Input.ts` | `input` | `Input` |
| `Animation.ts` | `animation` | `Animation` |

## Runtime

Base classes for objects that need identity and lifecycle.

| File | What it does |
|------|--------------|
| `runtime/Identifiable.ts` | Base class with `id` (string) and `hid` (hash) |

## State

Encapsulated snapshots. Pass these around instead of raw events.

| File | What it does |
|------|--------------|
| `state/S_Mouse.ts` | Encapsulates mouse event state (up, down, double, long, etc.) |

## Utilities

Grab-bag helpers. The `tu` singleton is the workhorse.

| File | What it does |
|------|--------------|
| `utilities/Colors.ts` | Color utilities |
| `utilities/Testworthy_Utilities.ts` | General utilities, exported as `tu` singleton |
