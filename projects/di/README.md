# di

Design Intuition — a cabinetry design tool the even people who hate computers will enjoy using.

## Stack

- Svelte 5 (runes, no slots)
- TypeScript
- Vite
- Vitest

## Setup

```bash
yarn install
yarn dev
```

## Structure

```
src/
├── App.svelte
├── lib/
│   ├── svelte/
│   │   └── layout/
│   │       ├── Main.svelte      # Root layout
│   │       ├── Controls.svelte  # Top bar
│   │       ├── Graph.svelte     # Canvas + 3D rendering
│   │       └── Details.svelte   # Left sidebar
│   └── ts/
│       ├── render/              # Camera, Input, Render, Animation, Scene
│       └── types/               # Coordinates, Interfaces
notes/
├── guides/                      # Development documentation
└── work/                        # Milestones and tasks
```

## Layout

```
┌─────────────────────────────────────────────────────┐
│                     Controls                        │
├───────────────┬─────────────────────────────────────┤
│               │                                     │
│    Details    │              Graph                  │
│   (280px)     │         (canvas, flex)              │
│               │                                     │
└───────────────┴─────────────────────────────────────┘
```

## License

MIT
