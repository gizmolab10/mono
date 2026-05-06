# 33 — Drag (mothballed)

**Date mothballed:** 2026-04-14
**Status:** mothballed mid-investigation. Code is shipped and stable; one residual visual issue is open.

---

- [ ] [[three.dimensions]] revisit Intersection detection when object count grows

## Where it stopped

The drag rewrite is shipped and works. Five hundred fourteen tests pass, type-check is clean. The remaining open question — small residual drift on child drags whose formulas reach upstream to a parent — was triaged but not resolved before mothballing. Jonathan rejected the most-recently-proposed compensations as "too complex" and suggested the residual is just plane-projection geometry; co's proposals never matched that framing.

## What works

- **Live pivot during the drag.** No more frozen-pivot snap on mouse-up.
- **Mouse-to-bounds math is in world space.** Mouse pixel unprojected to a world ray, intersected with the captured face plane, decomposed onto the face's edges. The plane is captured in the parent's local coordinate system so it stays valid even when an upstream push resizes the parent.
- **Root drag tracks the mouse perfectly under any view rotation.**
- **A drag never edits formula text.** Changes are pushed into the raw numbers the formula references, by walking the formula graph upstream and splitting the desired change across them.
- **All four corner types work.** Both maximum and minimum corners follow the mouse; the opposite corner stays pinned.
- **Face drag works on rotated children.**
- **Visible root draws all twelve of its edges.** Invisible root keeps its bottom-face outline at full opacity regardless of the grid slider.

## What's still drifting

Dragging a child whose size depends on a parent's dimension (e.g., child length = parent width) shows a small lag — the rendered corner sits a little behind the mouse, in the mouse's direction of motion. Less than one pixel-equivalent for a slow drag, more visible on long fast drags. The mothballed proposals were:

- One-shot leakage measurement at drag start (rejected as too complex).
- Structural detection plus flat doubling (rejected as too complex).

Jonathan thinks the right framing is plane-projection geometry — "expands along the gradient, an easy thing to compute." Next session should approach from that angle rather than continuing the leakage-compensation thread.

---

## Session — 2026-04-14 — drag pivot, mouse math, and parent-local frame

After the upstream-constant drag was wired in (entry below), Jonathan tested live and surfaced a chain of issues. Each one was investigated, the cause narrowed down, and a fix proposed and applied. The work split into five threads.

### One — visible root draws all its edges

Old behavior: a visible root only drew the four edges of its bottom face. New behavior: a visible root draws all twelve of its edges. The bottom-face restriction was carried over from when the root was always invisible; now that the root can be visible, it deserves the full wireframe. The invisible-root branch further down still restricts to the bottom face. Single-line change in [di/src/lib/ts/render/Render.ts](di/src/lib/ts/render/Render.ts).

### Two — invisible root's bottom edges always visible

Old behavior: the dashed wireframe of an invisible root used the grid-opacity slider as its alpha, so turning the grid down to zero hid the floor reference too. New behavior: the invisible root's wireframe is drawn at full opacity regardless of the grid slider; other invisible objects still fade with the grid. Single-line change in [di/src/lib/ts/render/Render.ts](di/src/lib/ts/render/Render.ts).

### Three — pivot is live during the drag

Old behavior: at drag start, the rotation pivot was frozen at the shape's center, so the world matrix did not "drift" during the drag. Side effect: the rendered shape stretched lopsidedly from a fixed pivot, then snapped back to its real centroid on mouse-up. Jonathan asked for the recenter to happen continuously during the drag instead of in one snap at the end. The freeze and the unfreeze were deleted; the field on the scene record was deleted; both fallback reads of the field (in the renderer and in the drag's own copy of the world matrix) now always use the live center.

### Four — mouse-to-bounds math, three iterations

The first live test of the live-pivot drag surfaced "mouse moves twice as fast as the corner being dragged." Three rounds of investigation:

- **First fix — solve the 2x2 system instead of orthogonal projection.** The screen-projected face edges are not perpendicular when the face is tilted, but the old code projected the mouse displacement onto each edge independently, double-counting along the diagonal. Replaced with a proper 2x2 inverse solve in both the stretch path and the face-drag path. Helped, but residual drift remained.
- **Second fix (rejected) — recompute screen edges every frame.** Tried updating the projection ratio each frame from the current world matrix. Caused wild instability — a positive-feedback loop where the bound change shifted the live pivot, which shrank the projected edges, which amplified the next bound change. Reverted.
- **Third fix — world-space ray-plane intersection.** Replaced the screen-space pixel decomposition entirely. Each frame the mouse pixel is unprojected to a world ray, intersected with the face plane captured at drag start, and the world displacement is decomposed onto the face's drag-start world edges. The plane is fixed for the whole drag, so no feedback. Root drag became perfect.

### Five — parent-local frame for child drags

After the world-space fix, child drag still drifted. Cause: when the dragged child has a formula that references the parent (e.g., child length = parent width), the upstream push grows the parent during the drag. The parent's world transform slides, the child slides with it, and the captured world plane no longer matches where the user sees the face. Fix: capture the plane in the **parent's local coordinate system** instead of world. Each frame, transform the mouse world ray into the parent's *current* local frame (using the inverse of the parent's current world matrix) and hit the still-fixed parent-local plane. Root drag also stays correct — root has no parent, so the "frame" becomes world, identical to the previous behavior.

Drift after this fix is small and roughly aligned with the mouse direction. Mothballed before resolving.

### Files updated this session

- `di/src/lib/ts/render/Render.ts` — visible-root edges, invisible-root opacity, removed pivot-freeze fallback.
- `di/src/lib/ts/editors/Drag.ts` — removed pivot freeze, removed pivot fallback, added 2x2 solve, then replaced with world-space ray-plane, then replaced with parent-local frame transform. Added a small helper to invert a frame's world matrix and another to transform a direction by a matrix.
- `di/src/lib/ts/types/Interfaces.ts` — removed the `frozen_center` field.

### Verification

- Type-check is clean — zero errors, zero warnings.
- Full test suite passes — five hundred fourteen green, unchanged.

---

## Session — 2026-04-14 — upstream-constant drag

The revised proposal from 2026-04-13 was built. A drag on a child no longer edits any formula text. Instead, the drag finds every raw number the dragged value depends on (by walking the formula graph upstream), measures how strongly each raw number pulls on the dragged value, and splits the desired change equally across them. If the chain has a cycle, the axis is a no-op and a line is logged. If two targets on one axis share a raw number (which would cause double-counting), the drag falls back to writing the dragged bound directly and logs a warning.

### What the rewrite changed

Two files.

- [di/src/lib/ts/algebra/Constraints.ts](di/src/lib/ts/algebra/Constraints.ts) — added the upstream walker, the coefficient measurer (which uses real propagation and restores state on exit), and the small helpers that read and write one modifiable leaf. Exported a new type for those leaves.
- [di/src/lib/ts/editors/Drag.ts](di/src/lib/ts/editors/Drag.ts) — replaced the per-axis formula-info record with a target record (which attributes must move, the reachable raw numbers, the coefficients, and the starting values). Rewrote the drag-start capture and the per-frame apply. Deleted the drag-end formula-text update and the trailing-offset collapser. Root still uses the original direct-bound symmetric-stretch path.

### Rules the new path honours

- A drag never rewrites formula text. Only raw numbers change.
- For a max-corner drag: end-derived axes push length upstream; start-derived axes push end and length upstream; length-derived axes write the end bound.
- For a min-corner drag: end-derived axes push length and start upstream; start-derived axes push length upstream; length-derived axes write the start bound.
- If an axis's two targets would both land on the same raw number, the axis falls back to a direct bound write.
- If the upstream walk hits a cycle, that target is inert and the drag is a no-op on that axis.

### Verification

- Type-check is clean — zero errors, zero warnings.
- Full test suite passes — five hundred fourteen green, unchanged from before.

### Files updated this session

- `di/src/lib/ts/algebra/Constraints.ts`
- `di/src/lib/ts/algebra/index.ts` — exports the new leaf type
- `di/src/lib/ts/editors/Drag.ts`

---

## Session — 2026-04-13 — corner-drag rewrite

Testing surfaced a bug: dragging a corner of a child part did not move the corner with the mouse. After several rounds of targeted investigation (documented in the log further down) the conclusion was that the existing approach had a built-in design limitation, not a fixable bug. The drag was rewritten in screen space with a frozen pivot. Several smaller bugs surfaced during testing of the new approach and were fixed in turn.

### The rules we settled on for the rewrite

- **The drag tracks the mouse on screen.** The pixel displacement of the mouse is decomposed onto the face's screen-projected edge directions and scaled back to bounds units. There is no three-dimensional ray-and-plane intersection in the stretch path.
- **The pivot is frozen during the drag.** At drag start, the part's current center is captured. Both the renderer and the drag use the captured center for the world matrix until the drag ends. This prevents the depth drift that the old compensation was fighting.
- **Formulas are never erased by a drag.** The drag writes to whichever attribute is the source for the invariant relationship between start, end, and length. At drag end, the formula text on that source attribute is updated with an additive offset (for example, the parent's length minus thirty). The relationship to the parent stays live.
- **For minimum-corner drags, both the start and the length are written.** Writing only the length would let the opposite side move. Writing both pins the opposite side.
- **For face drags on rotated children, the local edges are rotated by the child's orientation before they are used.** Otherwise the motion is constrained to the parent's axes.

(The screen-space pivot freeze and the drag-end formula-text update were both later removed by the 2026-04-14 sessions above. The rewrite's structural decisions — separating the math, capturing initial bounds at drag start, identifying source attributes per invariant — survived.)

### What the rewrite changed

Two files.

- [di/src/lib/ts/editors/Drag.ts](di/src/lib/ts/editors/Drag.ts) — the stretch-anchor capture, the per-frame delta computation, the per-frame application, and the drag-end finalize step were all rewritten. The old center-shift compensation block, the find-opposite-vertex helper, and the diagnostic logs were deleted.
- [di/src/lib/ts/render/Render.ts](di/src/lib/ts/render/Render.ts) — the world-matrix function checks for a frozen center on the part and uses it when present.

The interface for a part's scene record gained an optional frozen-center field.

### Verification of the rewrite

- Type-check is clean — zero errors, zero warnings.
- Full test suite passes — five hundred fourteen green. (Twelve new tests for the screen-space math were added during the investigation and are still in place.)
- Jonathan tested all four corner types live and confirmed they track the mouse. The rotated-child face drag was tested live and confirmed.

### Files updated by the rewrite

- `di/src/lib/ts/editors/Drag.ts`
- `di/src/lib/ts/render/Render.ts`
- `di/src/lib/ts/types/Interfaces.ts` — the frozen-center field on the scene record (later removed)
- `di/src/lib/ts/tests/Drag_math.test.ts` — twelve tests for the pure math functions

---

## Summary of the original investigation

The log below captures the long debugging session that led to the rewrite. Kept here for reference; the structural decisions still apply, but the screen-space approach was later replaced by world-space ray-plane intersection in the parent's local frame.

**Step 1 — pinning down the suspect.** The four pieces of code that would be replaced if the drag were rewritten were named A1 through A4 and rated for certainty. None had any tests. The piece that converts a mouse position into a bounds delta was the most likely culprit, so that piece was made testable first.

**Step 2 — testing the math.** The pure math for ray-plane intersection and decomposition was extracted into standalone functions and twelve tests were written. Eleven passed on the first run; one had a wrong expected value and was fixed. The math itself was proven correct, which meant the bug had to be in the values being fed into the math, not in the math itself.

**Step 3 — checking the inputs.** A log was added that printed the edge vectors at drag start. They looked clean — proportional, orthogonal, non-degenerate. So the inputs were also correct, which meant the bug had to be downstream of the math entirely.

**Step 4 — finding the real cause.** A log was added inside the application step. The data showed that when the bounds changed, the drag was correctly compensating to pin the opposite corner in place — but the compensation was pushing the entire part backward in depth. The center-rotate-uncenter approach the world matrix uses was the root cause: any change to the bounds shifted the center, the rotation amplified the shift into all three axes, and the compensation correctly pinned the opposite corner but at the cost of moving the part away from the camera. Not a code bug, a design limitation.

**Step 5 — the rewrite.** The decision was made to rewrite the stretch drag in screen space with a frozen pivot. The mouse displacement is decomposed into the face's screen-projected edge directions and scaled to bounds units. The center is frozen at drag start so the world matrix doesn't drift during the drag. The compensation block was deleted entirely. The face drag, snap logic, pin offers, and root symmetric stretch were left untouched.

**Step 6 — first test of the rewrite.** Two new bugs surfaced. Dragging some corners did nothing, dragging others only changed one axis. A diagnostic showed the bounds delta was being computed correctly, but the change was being immediately undone after each frame. The cause was the formula system: the dragged bound was derived from a formula, and propagation re-evaluated the formula and overwrote the drag's value.

**Step 7 — the formula question.** A first attempt cleared the formula on the dragged bound, but Jonathan rejected this — the formulas encode the user's design intent and must not be erased. After three rounds of pros-and-cons, the agreed approach was to redirect the drag to whichever attribute is the source for the invariant rule, then update the formula's text at drag end with an additive offset. The relationship to the parent stays live, the formula stays editable, and the manual adjustment is encoded in the formula itself. (Later replaced by the upstream-constant approach in the 2026-04-14 session.)

**Step 8 — building the redirect.** The interface gained fields to capture each axis's source attribute, original formula text, and original formula result. The drag began writing to the length attribute instead of the end bound, and a new finalize step updated the formula text at drag end.

**Step 9 — the runaway-bounds bug.** First test showed the opposite edge "rocketing" away from the mouse. A diagnostic revealed the snapshot only captured the dragged-corner bounds, not the opposite-corner bounds. Each frame read the live opposite-corner value (which was being changed by the previous frame's wrong calculation) and accumulated a snowballing error. The fix was to compute the new length from the initial captured length plus the drag offset, never from live values.

**Step 10 — the min-corner inversion.** Max-corner drags worked. Min-corner drags moved both sides instead of pinning the opposite side. The cause was that setting only the length keeps the start fixed at zero and lets the end move — fine for max drags, wrong for min drags. The fix: for min-corner drags, set both the start and the length so the opposite side stays where it was.

**Step 11 — fixed.** All four corner types now track the mouse correctly.

**Step 12 — the rotated-child face-drag bug.** A separate bug surfaced where dragging a face on a rotated child constrained the motion to the parent's axes, ignoring the child's rotation. The cause was that the local edge vectors came from the child's un-rotated vertices. The fix was to rotate the local edges by the child's orientation before using them in the decomposition.

**Step 13 — the open question.** The formula updates produced long arithmetic strings (`.l + 5 - 30 + 12 - 8`). Jonathan asked for a proposal to keep the formulas as simple as reasonable. That proposal became the upstream-constant rewrite captured in the 2026-04-14 session above.
