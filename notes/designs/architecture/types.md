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
  vertices: [number, number, number][];
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
| `vertices` | 3D points defining geometry |
| `edges` | Pairs of vertex indices to connect |
| `orientation` | Rotation as quaternion |
| `position` | Translation in world/parent space |
| `scale` | Uniform scale factor |
| `color` | CSS color prefix, e.g. `'rgba(78, 205, 196,'` |
| `parent` | Optional parent for hierarchical transforms |

---

## Coordinate Types in Managers

Managers use `Point` and `Size` from `Coordinates.ts` instead of raw `x, y, width, height`:

| Manager | Type | Field/Param |
|---------|------|-------------|
| Render | `Size` | `size` (canvas dimensions) |
| Camera | `Size` | `init(size)` |
| Input | `Point` | `last_position`, `T_Handle_Drag(delta)` |

`Point` and `Size` have useful methods (`offsetBy`, `vector_to`, `dividedInHalf`, etc.) that simplify coordinate math.
