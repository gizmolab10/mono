# Rotation

Rotate an SO to an arbitrary angle around any axis. Quats let di do this without gl.

## Not in scope (yet)

- Formula-driven angles — angle attributes support formulas, but punt for now

## Todo

- [x] remove `closest_pair_angles` from Orientation.ts

## Done

- [x] slider (-45..+45, step 0.5) with detents at 0, ±22.5, ±30
- [x] +/- 90 buttons
- [x] per-axis angle input (type a value, blur or enter to apply)
- [x] axis selector: segmented x/y/z, default z
- [x] root expansion to account for rotations that protrude
- [x] hide rotation controls when root SO is selected
- [x] angles table in D_Selected_Part
- [x] dedicated "rotation" details banner (D_Rotation.svelte)

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

Dragging the slider sets `base + offset`. The ±90 buttons add/subtract 90 to the total. Typing in the angle table sets the total directly.

---
# Swap

Swap = exchange actual axis data (bounds, formulas, invariants, aliases). A 120x4x96 wall swapped x<->y becomes 4x120x96. Structural, not visual.

## Use case

To create a room:
- insert one stretch (front wall)
- dup, swap to make right wall
- again for left, back, floor, ceiling

## Todo

- [ ] add a swap button after the +90 button (swaps the two unselected axes)
- [ ] fix swap_axes for general cases (deep children, formulas referencing parent axes — currently corrupts)
## Done

- [x] compare rotate vs swap — both needed (see below)

## Rotate vs swap (settled)

**swap** = exchange actual axis data. Algebra stays consistent. Children inherit correct bounds, formulas resolve.

**rotate** = set angle attributes, compose into quat for rendering. Bounds unchanged — visual only.

|            | swap                            | rotate                          |
| ---------- | ------------------------------- | ------------------------------- |
| changes    | bound data, formulas, invariants | visual orientation only         |
| algebra    | stays consistent                | "x" axis points in y visually  |
| children   | formulas rewritten (alias swap) | children unaware of rotation    |
| propagation | works naturally                | needs transform layer           |

**verdict:** swap is right for ±90 structural reorientation. Rotate is right for arbitrary visual angles. Both needed.
