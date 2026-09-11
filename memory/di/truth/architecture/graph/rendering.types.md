# Types

Located in `src/lib/ts/types/Interfaces.ts`. Two interfaces, both simple.

## Projected

What you get after the projection pipeline spits out a vertex.

```ts
interface Projected {
  x: number;  // screen X
  y: number;  // screen Y
  z: number;  // depth (NDC)
  w: number;  // clip space W (for culling)
}
```

Not a quaternion—same letters, different meaning. The `w` here is the divisor from perspective divide. We keep it to check if vertices are behind the camera (`w < 0` → don't draw).

Intentionally not using `Point` for `x, y`. It's a pipeline-specific structure, not general geometry.

## O_Scene

A thing in the scene graph that can be rendered.

```ts
interface O_Scene {
  id: string;
  so: Smart_Object;
  edges: [number, number][];
  faces?: number[][];
  parent?: O_Scene;
  position: vec3;
  color: string;
}
```

- `id` — unique identifier, auto-generated.
- `so` — back-reference to the part this entry draws. The vertex coordinates and the orientation come from the part, not from this entry.
- `edges` — pairs of vertex indices that define the wireframe.
- `faces` — optional groups of vertex indices that define filled polygons.
- `parent` — optional parent entry for hierarchical transforms.
- `position` — translation in parent space, passed directly to gl-matrix.
- `color` — CSS color prefix, for example `'rgba(78, 205, 196,'`.

Note: vertices are not stored on the entry. They live on the back-referenced part and are read on every projection pass. This keeps geometry edits in one place (the part's bounds, formulas, and rotation).

---

## Coordinate Types

### 2D (from Coordinates.ts)

| Class | What it's for |
|-------|---------------|
| `Point` | 2D position (x, y) |
| `Size` | 2D dimensions (width, height) |
| `Rect` | 2D rectangle (origin + size) |
| `Polar` | Polar coordinates (r, phi) |

### 3D (from Coordinates.ts)

| Class | What it's for |
|-------|---------------|
| `Point3` | 3D position (x, y, z) |
| `Size3` | 3D dimensions (width, height, depth) |
| `Block` | 3D box (origin + size) |

### Usage in Managers

| Manager | Type | Field/Param |
|---------|------|-------------|
| Render | `Size` | `size` (canvas dimensions) |
| Render | `Point3` | `project_vertex(v)` |
| Camera | `Size` | `init(size)` |
| Input | `Point` | `last_position`, `T_Handle_Drag(delta)` |
| Scene | `Point3[]` | `create({ vertices })` |

`Point` and `Size` have useful methods (`offsetBy`, `vector_to`, `dividedInHalf`, etc.) that simplify coordinate math. The 3D equivalents follow the same patterns.

---

## Canvas setup

Gotchas for crisp rendering on Retina displays.

- **DPR scaling** — canvas buffer = logical size × `devicePixelRatio`, context scaled by dpr, CSS `width`/`height` set to logical pixels
- **SO edges** — `lineWidth: 1`, `lineCap: square`, coordinates snapped to half-pixel grid (`Math.round(x) + 0.5`)
- **Dimensional lines** — `lineWidth: 0.5` (1 physical pixel on 2× Retina)
- **Text** — coordinates rounded to integers for crisp glyph placement
