
# Rotation

I want users to be able to **rotate** an SO to an arbitrary angle (0 - 90) and rotate some more. quats let di do this without gl. The UI needs:

- [x] a slider from 0 - 90 with detents at 22.5, 30, 45, 60, 67.5
- [ ] +/- 90 buttons **rotate** (not swap)
- [ ] an input box for entering an angle (return or blur-input -> applies it)
- [ ] root expansion to account for rotations that protrude
- [ ] remove rotation controls when root SO is selected
- [ ] axis default -> z

## Expanding the root

`recompute_max_bounds` grows the child's AABB but the root doesn't expand to contain it. extract the post-propagation root expansion from `insert_child_from_text` into a reusable `expand_root_to_fit()`, call it after Angular commit and slider set_angle. low risk: only expands max bounds, root is invisible, preserves origin. medium risk: if any SO has formulas referencing root dimensions (`.l`, `.w`), expanding root changes those values.

# Swap

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

## rotate vs swap (settled)

**swap** = exchange actual axis data (bounds, formulas, invariants, aliases). a 120×4×96 wall swapped x↔y becomes 4×120×96. already exists in `swap_axes` (Engine.ts), built for repeaters.

**rotate** = set angle attributes, compose into quaternion for rendering. bounds stay the same — visual-only.

| | swap | rotate |
|---|---|---|
| what changes | actual bound data, formulas, invariants | visual orientation only |
| algebra system | stays consistent | disconnected — "x" axis points in y visually |
| children | formulas rewritten (alias swap) | children don't know parent rotated |
| constraint propagation | works naturally | needs transform layer between visual and logical coords |

**verdict:** swap is the right primitive for ±90° structural reorientation (the room use case). children inherit correct bounds, formulas resolve correctly, dimension labels make sense. rotate (angle-based) is useful for arbitrary angles later but swap comes first.

**catch:** swap xy currently corrupts. `swap_axes` was built for repeaters, may not handle general cases (deep children, formulas referencing parent axes). next step: dig into why it corrupts and fix.

## implementation approach (swap rewrite)

current `swap_axes` serializes data, swaps it across, fixes offsets — 75 lines, fragile. the fix is simpler: work agnostically.

**rule:** axis data is stored and accessed agnostically (start/end/length/angle, by index). explicit names (`x_min`, `width`) are the public API — used by the formula language and `attributes_dict_byName` lookups. the swap operates at the agnostic level (swap Axis objects, then relabel to keep the public API consistent). only touch formulas for cross-axis named SO references.

**steps:**
1. swap the Axis objects in the array (`axes[a] ↔ axes[b]`)
2. relabel: update `axis.name`, rename the four attributes (`attributes_dict_byName` is now a getter — rebuilds automatically from axes)
3. only touch formulas where a cross-axis named reference exists — `swap_formula_aliases` scoped to external SOs that reference the swapped one by explicit name

values, invariants, offsets all travel with the Axis object. no serialize round-trip, no offset fixup. current 75-line swap collapses to ~15.

### manual test

wacka.di