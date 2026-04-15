# Drag — lessons

Four things to not relearn the hard way.

## 1. Live pivot and one-to-one mouse tracking are in tension under a tumbled view

If the rotation pivot follows the shape's live center, and the user has tumbled the view off-axis, then a one-sided stretch (one corner moves, the opposite corner stays) will render the moving corner at less than one-to-one with the mouse. The math is "(identity plus rotation) times half the bound change," which is below one for any non-identity rotation. You cannot have both a live pivot and a perfectly tracking corner with a center-pivot. The way out is to use a different pivot for stretch drags (the opposite corner, which is the point that does not move), or to compensate the bound write — both have downsides Jonathan rejected, so this stays as residual drift for now.

## 2. Non-perpendicular projected edges need the full two-by-two solve

A flat axis-aligned face has perpendicular bounds-space edges, but its screen projection generally tilts those edges so they are no longer perpendicular on screen. Decomposing a mouse displacement onto each tilted edge by orthogonal projection (mouse dotted with edge, divided by edge squared) double-counts the diagonal. The correct decomposition is to solve the two-by-two linear system "mouse equals A times first edge plus B times second edge" with the determinant. Cheap, exact, no special cases except when the two edges land colinear on screen (face viewed edge-on — return null and skip).

## 3. Recomputing the projection ratio from current state during a drag explodes

If you re-project the face's screen edges every frame using the shape's current world matrix, you create a positive-feedback loop — the bound change shifts the live pivot, which shrinks (or skews) the projected edges, which amplifies the next bound change. A few frames in, the corner lurches in random directions. The fix is to capture the projection ratio once at drag start, or — better — abandon screen-space projection for the math entirely and use world-space ray-plane intersection.

## 4. World-space ray-plane is exact for root, but a child needs the parent's local frame

Unprojecting the mouse to a world ray and intersecting with the face's drag-start world plane gives an exact mouse-to-bounds mapping for a root drag — the math is closed-form and there is no perspective approximation. For a child whose formulas push upstream to the parent, the parent's world transform slides during the drag, the child slides with it, and the world plane no longer matches what the user sees. Capturing the plane in the parent's local coordinate system fixes that — each frame, transform the mouse world ray into the parent's current local frame (using the inverse of the parent's current world matrix) before hitting the still-fixed parent-local plane. The residual lag from the parent's frame changing each frame converges toward the right answer geometrically, leaving a small per-frame drift that was not solved before mothballing.
