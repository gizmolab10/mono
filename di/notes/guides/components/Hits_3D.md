# Hits_3D

3D hit testing for Smart Objects — corners, edges, faces.

## Location

`src/lib/ts/managers/Hits_3D.ts`

## Purpose

Screen-space hit testing for 3D canvas objects. Separate from DOM-based `Hits.ts` which handles svelte components.

## Design Decision

**Separate from DOM Hits** — Option C from our analysis. Mouse can only be in canvas OR in DOM, never both. No coordination needed — just routing. `Events_3D` handles canvas, existing `Events` handles document.

## Hit Types (T_Hit_3D)

Order encodes precedence (lower = higher priority):
1. `corner` — vertex hit (8px radius)
2. `edge` — line segment hit (5px radius)
3. `face` — polygon hit (front-facing only)
4. `none`

## Structure

```typescript
class Hits_3D {
  // Registration
  register(so: Smart_Object)
  unregister(so: Smart_Object)

  // Projection cache (updated by Render each frame)
  update_projected(scene_id: string, projected: Projected[])
  get_projected(scene_id: string): Projected[] | undefined

  // Hit testing
  test(point: Point): Hit_3D_Result | null

  // Hover state
  w_hover: Writable<Hit_3D_Result | null>
  hover: Hit_3D_Result | null
  set_hover(result: Hit_3D_Result | null)

  // Selection state
  w_selection: Writable<Hit_3D_Result | null>
  selection: Hit_3D_Result | null
  set_selection(result: Hit_3D_Result | null)
}
```

## Hit_3D_Result

```typescript
interface Hit_3D_Result {
  so: Smart_Object;
  type: T_Hit_3D;
  index: number;  // which corner/edge/face
}
```

## Face Detection

Faces use CCW winding when viewed from outside. Hit test:
1. `is_front_facing()` — 2D cross product < 0 means front-facing in screen coords
2. `point_in_polygon()` — ray casting algorithm

## Selection Behavior

- Click sets selection to current hit (only if something was hit)
- Selection persists until another element is clicked
- Rendered as blue dots; hover rendered as red dots on top

### Face Flip on Rotation

When a face is selected and the object rotates, the selected face may flip away from the camera. `update_projected()` detects this and auto-switches to the opposite face:

1. Check if selected face is still front-facing
2. If not, try opposite face (index XOR 1: 0↔1, 2↔3, 4↔5)
3. If opposite is front-facing, switch selection to it

This assumes faces are paired (front/back, left/right, top/bottom).

## Data Flow

1. `Setup.ts` creates SOs, registers with `hits_3d`
2. `Render.ts` projects vertices, calls `hits_3d.update_projected()`
3. `Events_3D.ts` on mousemove calls `hits_3d.test()`, `hits_3d.set_hover()`
4. `Events_3D.ts` on mousedown calls `hits_3d.set_selection()` if hit
5. `Render.ts` reads `hits_3d.selection` and `hits_3d.hover`, draws highlights

## Related

- `runtime/Smart_Object.ts` — entities being tested
- `signals/Events_3D.ts` — mouse event handling
- `render/Render.ts` — projection + highlight rendering
- `types/Enumerations.ts` — `T_Hit_3D` enum
