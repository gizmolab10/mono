# Rotation

I want users to be able to **rotate** an SO to an arbitrary angle (0 - 90) and rotate some more. quats let di do this without gl. The UI needs:

- [x] a slider from 0 - 90 with detents at 22.5, 30, 45, 60, 67.5
- [x] +/- 90 buttons **rotate** (not swap)
- [x] convert the label -> input box for entering an angle (return or blur-input -> applies it)
- [x] root expansion to account for rotations that protrude
- [x] remove rotation controls when root SO is selected
- [x] axis default -> z
- [x] i want to solve the 2D use case first. image with a root protrusion
- [x] research: how resolve a quat to into the 2 axes, with specified order of rotation
	- [x] not-disabled axes (in the angles table)
	- [x] allow selecting any angle for rotation
		- [x] make that the 2nd of the two
	- [x] disallow third axis to "combine into the other two"?
- [x] rewrite the rotation model
- [x] move the angles table to d selected part
	- [x] remove the separator column (it has the cross indicator)
- [x] create a new details banner hideable: "rotation"
	- [x] move all the angle UX from d selected part into it
	- [x] remove the angle input field (redundant wrt angles table)
## Swap

i want to be able to rotate an SO. use case: to create a room, i need to

- insert one stretch (front wall)
- dup the stretch
- rotate the dup (right wall) by 90°
- again for left wall and back wall
- again for floor
- again for ceiling

Thus:

- [x] compare rotate and swap, should we support both?
- [ ] add to **selected part**: ability to rotate around an axis (x,y,z)
  - [x] applies to selected SO
  - [ ] segmented control for axes (x,y,z)
    - [ ] two buttons to rotate by 90° (+,-)
    - [ ] axis is determined by the tumble orientation of the SO
    - [ ] eg, if front face is front-most-facing, show y as the rotation axis
  - [ ] slider to rotate by degrees (0 - 90)
    - [ ] sticky at 22.5, 30, 45, 60, 75.5

### rotate vs swap (settled)

**swap** = exchange actual axis data (bounds, formulas, invariants, aliases). a 120×4×96 wall swapped x↔y becomes 4×120×96. already exists in `swap_axes` (Engine.ts), built for repeaters.

**rotate** = set angle attributes, compose into quaternion for rendering. bounds stay the same — visual-only.

|    | swap | rotate |
|----|----|----|
| what changes | actual bound data, formulas, invariants | visual orientation only |
| algebra system | stays consistent | disconnected — "x" axis points in y visually |
| children | formulas rewritten (alias swap) | children don't know parent rotated |
| constraint propagation | works naturally | needs transform layer between visual and logical coords |

**verdict:** swap is the right primitive for ±90° structural reorientation (the room use case). children inherit correct bounds, formulas resolve correctly, dimension labels make sense. rotate (angle-based) is useful for arbitrary angles later but swap comes first.

**catch:** swap xy currently corrupts. `swap_axes` was built for repeaters, may not handle general cases (deep children, formulas referencing parent axes). next step: dig into why it corrupts and fix.

## Sliding-window pair — rotation model rewrite

### The problem

Three independent angle slots work for single-axis rotation. But when a user rotates around x, then y, then goes back to tweak x, there's no record of *which two* they care about. The code stores 3 numbers and composes them in fixed order (x→y→z). That order is arbitrary — it doesn't reflect intent.

All 3 nonzero at once? Editing one feels like it fights the other two. The user thinks "i rotated x, then y" — two steps, in order. Three independent slots can't capture that.

### The model

Track a **sliding-window pair**: the 2 most recently touched axes. The pair is the source of truth; the quat is derived from it: `q = R(B, β) · R(A, α)` (A = older, B = newer).

| Before | User touches | After | Action |
|---|---|---|---|
| `null` | A at α | `[A]` | set A.angle = α |
| `[A]` | A at α' | `[A]` | update A.angle = α' |
| `[A]` | B at β | `[A, B]` | add B, set B.angle = β |
| `[A, B]` | A at α' | `[A, B]` | update A.angle = α' |
| `[A, B]` | B at β' | `[A, B]` | update B.angle = β' |
| `[A, B]` | C at γ | `[B, C]` | **evict A** — decompose, then set C |

### Eviction

When a 3rd axis C arrives and the pair is `[A, B]`:

1. Compute current quat: `q = R(B, β) · R(A, α)`
2. Swing-twist decompose `q` around C → `twist_C` (angle `γ_residual`) + `swing`
3. Swing-twist decompose `swing` around B → `twist_B` (angle `β'`) + `remainder`
4. `remainder` is lost — the component that lived on A and can't be expressed as B or C. This is the fidelity cost.
5. Set `B.angle = β'`, `C.angle = γ_residual`
6. Pair becomes `[B, C]`

For **drag** (nudge): C.angle = `γ_residual + delta` (preserves implicit C-rotation from old quat).
For **editor** (set absolute): C.angle = `user_value` (replaces residual — user typed a specific number, they mean it).

### Swing-twist for cardinal axes

Given quat `q = [x, y, z, w]` and twist axis A:

```
twist_A = normalize(0, ..., q[A], ..., w)    // keep only A-component and w
swing   = q · inverse(twist_A)
angle_A = 2 · atan2(twist_A[A], twist_A.w)
```

For axis-aligned cases, it's just extracting the right quaternion component. No trig tables, no iterative solvers.

### Fidelity

Dropping the oldest axis loses information. By design. The `remainder` from double swing-twist is the un-expressible residual — the rotation component that lived on the evicted axis and can't be projected onto the surviving two.

Negligible at typical angles (0–45°). Visible drift only at extreme combos (80°+ on all three), which is outside di's use. The user stopped caring about that axis — they're editing the other two.

### Not in scope

- **Swap** — independent mechanism, orthogonal to this
- **Formula-driven angles** — angle attributes on Axis still support formulas, but pair logic only applies to user-driven angles. Punt for now.
- **Rotation lock** — `rotation_lock` field exists but is unused. Leave it.
