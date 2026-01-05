# Project Architecture

How does the app actually run? Here's the flow.

## Entry Flow

```
index.html
    └── src/main.ts
            └── init(canvas)  ← from src/lib/ts/test.ts
```

**index.html** loads the module.

**main.ts** builds the DOM—styles, canvas, info text—then calls `init(canvas)`.

**test.ts** wires everything together:
1. Initializes managers with the canvas
2. Creates scene objects
3. Sets initial rotations
4. Hooks up input → outer cube rotation
5. Hooks up animation tick → inner cube spin + render
6. Starts the loop

## Types

See [types.md](types.md).

## Scene Graph

i wanted nested rotations without gimbal lock. Each `O_Scene` can have a `parent`—child transforms are relative to parent's world matrix.

```
outer_cube (teal)
  └── inner_cube (red, scale 0.4, auto-rotates)
```

Drag the outer cube, inner cube follows. Inner cube spins independently inside.

## File Layout

See [files.md](files.md).

## Pipeline

The render pipeline, step by step:

1. `render.get_world_matrix(obj)` — builds local matrix from quat + position + scale, multiplies by parent's world matrix
2. `render.project_vertex(v, world_matrix)` — transforms through MVP, perspective divide, maps to screen
3. `render.render_object(obj)` — projects vertices, draws edges with depth-based alpha
4. `render.render()` — clears canvas, iterates `scene.get_all()`

## Matrices

| Matrix | Location | What it does |
|--------|----------|--------------|
| `view` | `camera` | Camera transform via `mat4.lookAt` |
| `projection` | `camera` | Perspective via `mat4.perspective` |
| `mvp_matrix` | `render` | Combined MVP, reused per batch |
