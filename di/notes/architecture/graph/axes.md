# Axes — rotation & swap

Two ways to reorient an SO: rotate (visual, quat-based) and swap (structural, exchanges axis data).

## Rotation model

Fixed XYZ composition. Three independent angle slots, always composed in order:

```
q = R(z, γ) · R(y, β) · R(x, α)
```

Each axis stores its angle as an attribute. `touch_axis` sets the angle directly. No pair tracking, no eviction, no decomposition.

### Slider

Range -45..+45 centered on the nearest 90-degree multiple. The base is derived, not stored:

```
base = nearest_base(total_degrees)    // nearest 90° multiple, ties toward zero
offset = total - base                 // what the slider shows
```

Dragging the slider sets `base + offset`. The +/-90 buttons add/subtract 90 to the total. Typing in the angle table sets the total directly.

## Swap

Exchange actual axis data (bounds, formulas, invariants, aliases). A 120x4x96 wall swapped x<->y becomes 4x120x96. Structural, not visual.

### What gets swapped

For each SO in the target tree (selected + descendants):
1. Axis objects (start/end bounds, length, invariants)
2. Formula tokens — both `token.attribute` and `token.object` rewritten via alias maps
3. Absolute positions — pre-cached for all targets before any swaps (parent-first would corrupt child positions via `get_bound` walking the parent chain)

### Alias rewriting

`swap_attr_aliases` rewrites formula references:
- `build_alias_swap_map(a, b)` — swaps attribute names (e.g. `x_start` <-> `y_start`)
- `build_object_swap_map(a, b)` — swaps axis-qualified object refs (e.g. `.x` <-> `.y`, `x` <-> `y`)

All three axes get their formulas rewritten, not just the two being swapped.

## Rotate vs swap

| | swap | rotate |
| --- | --- | --- |
| changes | bound data, formulas, invariants | visual orientation only |
| algebra | stays consistent | "x" axis points in y visually |
| children | formulas rewritten (alias swap) | children unaware of rotation |
| propagation | works naturally | needs transform layer |

Swap is right for +/-90 structural reorientation. Rotate is right for arbitrary visual angles. Both needed.

## Angular rendering

### Key insight: reuse intersection lines

The intersection line where a child face meets a parent face gives us everything: the arc plane (the parent face), one witness direction (the intersection line = child's rotated axis), the hinge (where the intersection meets a parent edge), and the other witness direction (the parent edge = unrotated reference).

### Coordinate frame discipline

All angular geometry in **world space**, projected through `identity`. Never project child-local through parent world matrix.

### Pipeline

`render_intersections` collects segments -> `render_angulars` groups by child+parent_face, picks longest, selects hinge on parent face edge, computes witness directions, draws.

## Infrastructure

* `Angle_Rect` (`Interfaces.ts`): extends `Label_Rect` with `rotation_axis` and `angle_degrees`
* `Angular.ts` (`editors/Angular.ts`): hit test, begin/commit/cancel editing cycle
* `Render.ts`: `angular_rects[]` cleared each frame, `render_angulars()` + `render_angular()`
* Hit testing + events: wired through `Hits_3D`, `Events_3D`, `Graph.svelte`
