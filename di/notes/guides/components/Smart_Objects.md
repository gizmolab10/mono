# Smart Objects

Geometry with attributes — the foundation for editing, dimensions, hierarchy.

## Location

`src/lib/ts/runtime/Smart_Object.ts`

## Purpose

SO wraps `O_Scene` (rendering geometry) with identity and attributes. SO is the primary entity; O_Scene is an optional ref for rendering.

## Design Decision

**Composition over replacement** — SO holds an optional `O_Scene` reference rather than replacing it. This keeps rendering logic separate from the attribute/identity layer.

## Structure

```typescript
class Smart_Object extends Identifiable {
  name: string;
  scene: O_Scene | null;
  attributes_dict_byName: Dictionary<Attribute>;
}
```

## Attributes

Default attributes created on construction:
- `x`, `y`, `z` — position
- `width`, `height`, `depth` — dimensions

## Usage

```typescript
const scene_obj = scene.create({ vertices, edges, faces, color });
const so = new Smart_Object('my_cube', scene_obj);
hits_3d.register(so);
```

## Related

- `types/Attribute.ts` — name/value pairs
- `managers/Hits_3D.ts` — registers SOs for hit testing
- `types/Interfaces.ts` — `O_Scene` definition
