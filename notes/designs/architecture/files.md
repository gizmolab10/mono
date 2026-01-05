# File Layout

Where everything lives.

```
src/
├── main.ts                  # DOM setup, calls init()
└── lib/ts/
    ├── test.ts              # init() wires managers
    ├── types/
    │   ├── index.ts         # re-exports
    │   ├── Angle.ts         # Orientation, Quadrant
    │   ├── Coordinates.ts   # Point, Size, Rect, Polar
    │   └── Interfaces.ts    # Projected, SceneObject
    └── managers/
        ├── index.ts         # re-exports singletons
        ├── Scene.ts
        ├── Camera.ts
        ├── Render.ts
        ├── Input.ts
        └── Animation.ts
```

## Entry

| File | What it does |
|------|--------------|
| `main.ts` | Creates DOM, calls `init(canvas)` |
| `test.ts` | Wires managers, sets up scene |

## Types

| File | What it does |
|------|--------------|
| `types/Angle.ts` | `Angle` class, `T_Quadrant`, `T_Orientation`, `Direction` enums |
| `types/Coordinates.ts` | `Point`, `Size`, `Rect`, `Polar` classes |
| `types/Interfaces.ts` | `Projected`, `O_Scene` interfaces |

## Managers

| File | Export | Class |
|------|--------|-------|
| `Scene.ts` | `scene` | `Scene` |
| `Camera.ts` | `camera` | `Camera` |
| `Render.ts` | `render` | `Render` |
| `Input.ts` | `input` | `Input` |
| `Animation.ts` | `animation` | `Animation` |
