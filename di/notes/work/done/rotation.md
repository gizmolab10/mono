# Rotation

Architecture: [[architecture/graph/axes.md]]

## Not in scope (yet)

- Formula-driven angles — angle attributes support formulas, but punt for now

## Todo

- [x] remove `closest_pair_angles` from Orientation.ts
- [x] move the relevant contents of this file -> architecture/graph/axes.md

## Done

- [x] slider (-45..+45, step 0.5) with detents at 0, ±22.5, ±30
- [x] +/- 90 buttons
- [x] per-axis angle input (type a value, blur or enter to apply)
- [x] axis selector: segmented x/y/z, default z
- [x] root expansion to account for rotations that protrude
- [x] hide rotation controls when root SO is selected
- [x] angles table in D_Selected_Part
- [x] dedicated "rotation" details banner (D_Rotation.svelte)
- [x] add a swap button after the +90 button (swaps the two unselected axes)
- [x] fix swap_axes for general cases (deep children, formulas referencing parent axes)
- [x] compare rotate vs swap — both needed
