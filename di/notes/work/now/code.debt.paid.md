# Code Debt — Paid

Items moved here from [[code.debt]] once done. Newest first.

## 2026-07-04 — Root dimensions, hover tag, pure-number constants

- [x] dimensionals for root should appear — the root part now gets dimensions like any part, and shows them even when the root is invisible; the hover tag reads the root's own name at full size.
- [x] hover tag missing "width (x)" — the tag now names the axis and length whenever the cursor is over any part of a dimensional (its label or a line), even when a part sits behind it and even with edit locked.
- [x] constants can be pure numbers — a bare number is kept as a plain scalar (0.23 stays 0.23, usable in formulas), anything with a unit stays a measurement. Fixed: a leading-dot number (.23) used to fail to parse and silently discard the edit; the pure-number kind is preserved through propagation, save, and both scene-load paths. A scalar whose decimal repeats (1/3, 2/3, 1/6) shows as a fraction; a terminating decimal stays decimal.
- [x] save/edit buttons moved into the parts banner — save on the banner's left, edit on the right just before the plus; both removed from the top toolbar. Phone layout (which never showed them) now has them too.
- [x] hover a midpoint → the floating tag names its axis (the axis that edge runs along), the same way a dimensional's tag does. COMMAND-C over a midpoint puts the part name plus the short axis letter (name.w / .d / .h) on the clipboard, matching the dimensional COMMAND-C.
- [x] selection dots → drawn on top — the selection and hover dots now render after the dimensions and angulars, so they sit above those too, not just the part geometry. (Sub-item of "selection dots"; the rest of that item stays open.)
- [x] with edit locked, nothing in the details is editable — every edit path across the details refuses and every control shows disabled/greyed when the lock is on: the angles editor (typed value, slider thumb, ±90, swap, reset, rotation-order arrow, and its hover), the attributes table (formula/number inputs, invariant marker, lock toggle, and its hover), the selection name field, the constants table (name/value, lock, remove), the repeat editor (repeat/unrepeat, run/rise axes, spacing and gap sliders, firewall, wall/stairs, add-master), the dimensional hover pill, the parts/constants plus buttons, and the selection's divide-in-half and duplicate buttons. The shared slider gained a disabled state (thumb can't drag, no hover highlight).
- [x] plus (add-child) button moved from the parts banner to the selection banner.

## 2026-07-03 — Attributes editor

- [x] option to group attributes by axis — a persisted "sle" ↔ "xyz" toggle sits between the segmented control and the table. In sle it groups by start/length/end (left key s/l/e, name column the axis letters). In xyz it regroups the nine rows by axis (left key x/y/z, name column start/length/end repeating down each group). Root and invariant cell-merging reworked to hold under either grouping. Visual-confirmed by Jonathan.

## 2026-07-01 — Dimensionals

- [x] dimensions redraw on hover — hover no longer clears the prior valid list, so nothing repositions; the hovered part only adds/removes its own dimensions.
- [x] hover and select included in dimension slider count — the count now draws the largest N of the whole valid list (selected/hovered among the largest count as one of the N; below the cut they still draw). Moving the slider re-picks without repositioning.
