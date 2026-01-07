# File Layout

Where everything lives. There's a lot of files, and we're only just getting started.

```
src/
├── main.ts                  # Mounts Svelte app
├── App.svelte               # Root component, canvas + UI
├── vite-env.d.ts            # Type declarations
└── lib/
    ├── svelte/
    │   └── layout/          # UI components
    │       ├── Box.svelte
    │       ├── Controls.svelte
    │       ├── Details.svelte
    │       ├── Graph.svelte
    │       ├── Gull_Wings.svelte
    │       ├── Main.svelte
    │       └── Separator.svelte
    └── ts/
        ├── common/
        │   ├── Constants.ts           # App-wide constants
        │   ├── Extensions.ts          # Number/String prototype extensions
        │   └── Testworthy_Utilities.ts  # General utilities (tu singleton)
        ├── draw/
        │   ├── Colors.ts              # Color utilities + stores
        │   └── SVG_Paths.ts           # SVG path generators (svg_paths singleton)
        ├── managers/
        │   └── Preferences.ts         # localStorage wrapper
        ├── render/
        │   ├── index.ts               # re-exports singletons
        │   ├── Animation.ts
        │   ├── Camera.ts
        │   ├── Input.ts
        │   ├── Render.ts
        │   └── Scene.ts
        ├── runtime/
        │   └── Identifiable.ts        # Base class with id/hid
        ├── state/
        │   └── S_Mouse.ts             # Mouse state encapsulation
        ├── tests/
        │   ├── Angle.test.ts
        │   ├── Colors.test.ts
        │   ├── Coordinates.test.ts
        │   ├── Extensions.test.ts
        │   ├── Render.test.ts
        │   └── Testworthy_Utilities.test.ts
        └── types/
            ├── index.ts               # re-exports
            ├── Angle.ts               # Orientation, Quadrant, Direction
            ├── Coordinates.ts         # Point, Size, Rect, Polar, Point3, Size3, Block
            ├── Enumerations.ts        # App-wide enums
            ├── Interfaces.ts          # Projected, O_Scene
            └── Types.ts               # Type aliases (Dictionary, Integer, etc.)
```

## Entry

The front door. Svelte mounts, canvas renders, managers wake up.

| File | What it does |
|------|--------------|
| `main.ts` | Mounts `App.svelte` |
| `App.svelte` | Renders canvas, calls `init(canvas)` on mount |

## Common

Shared foundations that everything else relies on.

| File | What it does |
|------|--------------|
| `Constants.ts` | App-wide constants |
| `Extensions.ts` | Number/String prototype extensions (`isBetween`, `hash`, etc.) |
| `Testworthy_Utilities.ts` | General utilities, exported as `tu` singleton |

## Draw

Visual utilities for colors and SVG generation.

| File | Export | What it does |
|------|--------|--------------|
| `Colors.ts` | `colors` | Color utilities, reactive stores for theme colors |
| `SVG_Paths.ts` | `svg_paths` | SVG path string generators (gull wings, etc.) |

## Types

Geometry primitives, enums, interfaces—imported everywhere.

| File | What it does |
|------|--------------|
| `Angle.ts` | `Angle` class, `T_Quadrant`, `T_Orientation`, `Direction` enums |
| `Coordinates.ts` | `Point`, `Size`, `Rect`, `Polar`, `Point3`, `Size3`, `Block` classes |
| `Enumerations.ts` | App-wide enums (`T_Signal`, `T_Persistence`, `T_Predicate`, etc.) |
| `Interfaces.ts` | `Projected`, `O_Scene` interfaces |
| `Types.ts` | Type aliases (`Dictionary`, `Integer`, callbacks) |

## Managers

Singletons that own specific concerns.

| File | Export | What it does |
|------|--------|--------------|
| `Preferences.ts` | `preferences` | localStorage read/write wrapper |

## Render

3D rendering pipeline singletons.

| File | Export | What it does |
|------|--------|--------------|
| `Scene.ts` | `scene` | O_Scene CRUD, hierarchy |
| `Camera.ts` | `camera` | View/projection matrices |
| `Render.ts` | `render` | Projection pipeline, draw calls |
| `Input.ts` | `input` | Mouse events → rotation |
| `Animation.ts` | `animation` | rAF loop, tick callbacks |

## Runtime

Base classes for objects that need identity and lifecycle.

| File | What it does |
|------|--------------|
| `Identifiable.ts` | Base class with `id` (string) and `hid` (hash) |

## State

Encapsulated snapshots. Pass these around instead of raw events.

| File | What it does |
|------|--------------|
| `S_Mouse.ts` | Encapsulates mouse event state (up, down, double, long, etc.) |

## Layout Components

Svelte components for the panel UI.

| File | What it does |
|------|--------------|
| `Main.svelte` | Top-level layout, orchestrates regions |
| `Box.svelte` | Container with separators on edges |
| `Separator.svelte` | Divider with optional gull wings |
| `Gull_Wings.svelte` | Decorative curved corners |
| `Controls.svelte` | Top toolbar region |
| `Details.svelte` | Right panel region |
| `Graph.svelte` | Main canvas region |
