# Code Debt — Paid

Items moved here from [[code.debt]] once done. Newest first.

## 2026-07-03 — Attributes editor

- [x] option to group attributes by axis — a persisted "sle" ↔ "xyz" toggle sits between the segmented control and the table. In sle it groups by start/length/end (left key s/l/e, name column the axis letters). In xyz it regroups the nine rows by axis (left key x/y/z, name column start/length/end repeating down each group). Root and invariant cell-merging reworked to hold under either grouping. Visual-confirmed by Jonathan.

## 2026-07-01 — Dimensionals

- [x] dimensions redraw on hover — hover no longer clears the prior valid list, so nothing repositions; the hovered part only adds/removes its own dimensions.
- [x] hover and select included in dimension slider count — the count now draws the largest N of the whole valid list (selected/hovered among the largest count as one of the N; below the cut they still draw). Moving the slider re-picks without repositioning.
