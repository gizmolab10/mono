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
  vertices: Point3[];
  edges: [number, number][];
  orientation: quat;
  position: vec3;
  scale: number;
  color: string;
  parent?: O_Scene;
}
```

| Field | What it's for |
|-------|---------------|
| `id` | Unique identifier, auto-generated |
| `vertices` | 3D points defining geometry (`Point3[]`) |
| `edges` | Pairs of vertex indices to connect |
| `orientation` | Rotation as quaternion (gl-matrix `quat`) |
| `position` | Translation in world/parent space (gl-matrix `vec3`) |
| `scale` | Uniform scale factor |
| `color` | CSS color prefix, e.g. `'rgba(78, 205, 196,'` |
| `parent` | Optional parent for hierarchical transforms |

Note: `position` stays as `vec3` because it's passed directly to gl-matrix functions. `vertices` uses `Point3` because it's just stored/iterated—no gl-matrix interop needed.

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
