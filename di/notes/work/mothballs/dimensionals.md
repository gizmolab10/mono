# Dimensionals

Dimension annotations on 3D geometry. Each smart object gets up to three labels (one per axis), each label paired with two witness lines, a dimension line, and a pair of arrows. The geometry is rebuilt every paint — no part of a dimension is persisted to disk — but label positions DO carry from one paint to the next so the layout settles instead of restarting.

The hard part isn't painting the lines. It's choosing where each label goes so it ends up outside the drawing's outline, doesn't overlap any neighbor, doesn't run past the canvas, and doesn't dangle off a stretched witness line. Most of the file is that one decision.

## Status — redesign decided, not yet built

The placement algorithm described below is what's running today. A redesign has been decided that replaces the force-driven simulation with a four-degrees-of-freedom search per label: which silhouette edge to anchor on, which perpendicular direction to push out along, how far out the dim line sits (witness length), and where along the dim line the label sits (slidable position). Across the whole scene the search picks one combination per label such that every label sits at least 15 pixels outside the combined outline and at least 33 pixels from every other label. Springs and repulsion go away. Fireblock labels stay out of the search and act as fixed obstacles. See [Uncrowded Dimensionals Redesign](di/notes/work/now/dimensionals.md) for the consolidated spec.

This guide will be updated when the new algorithm replaces the current code. Until then, the sections below describe what the file actually does.

## File

[R_Dimensions.ts](../../../../src/lib/ts/render/R_Dimensions.ts) — about 1100 lines. The interface at the top names everything the file borrows from the main renderer: the canvas, the projection, world matrices, face winding, point-in-polygon, arrow drawing, and the list of label rectangles that click-to-edit reads from.

Three pieces do the heavy lifting. The entry point walks every part and orchestrates the three placement phases below. A per-axis preparation step builds one label candidate from one part and one axis. A drawing step paints the final candidate.

Standalone helpers handle the convex hull of the drawing, the push that moves a point past a hull edge, the arrow-vs-polygon intersection, and the force simulation.

## Visible parts and X-ray

A label draws when its owning part is visible AND no parent up the chain has its hide-children flag set. Holding OPTION while at least one part is invisible flips the rule: invisible parts draw their dimensions, visible parts don't. With nothing invisible in the scene, OPTION does nothing.

Evidence: [R_Dimensions.ts:304-330](../../../../src/lib/ts/render/R_Dimensions.ts#L304-L330)

## The combined outline

Before placing any label, the renderer builds one convex outline that wraps every painted leaf part. Containers (parts that have at least one painted child) are skipped — their bounding-box corners can sit well outside any actually painted geometry and would inflate the outline past where the drawing visually ends.

Every label's job is to land outside this single shared outline, no matter which part it belongs to. Without the shared outline, a label from one part could drift across a neighbor's silhouette and look like it was measuring the wrong thing.

Evidence: [R_Dimensions.ts:332-359](../../../../src/lib/ts/render/R_Dimensions.ts#L332-L359)

## Collecting candidates

For every visible part, the renderer asks each of its three axes the same question: where SHOULD this label go? Each axis goes through the same five sub-steps; if any one of them fails, the next silhouette edge along the axis is tried; if every edge fails, the axis gets no label this paint.

### 1. Pick silhouette edges for each SO

A silhouette edge is one where, of the two faces that meet along it, one is facing the camera and the other is facing away. That's exactly the boundary where the visible side of the shape ends and the hidden side begins — the outline you would trace if you drew the shape's profile from the camera's current viewpoint. Among those, ties are broken by which face leans most directly toward the viewer; the most-toward-the-viewer face wins, and its associated edge is preferred. The step returns a list, not a single choice, because later filters can rule the first edge out and force a fallback.

Evidence: [R_Dimensions.ts:892-949](../../../../src/lib/ts/render/R_Dimensions.ts#L892-L949)

### 2. Pick a witness direction — the path of least resistance

For the chosen edge, the renderer considers all four signed perpendicular axes — the two world axes other than the one being measured, each in both directions. For each candidate direction, it measures how far the label would have to travel to clear the combined outline, accounting for the label rectangle's footprint along that direction. The direction with the SMALLEST required push wins. The label leaves the drawing the way that requires the least sideways travel.

Two filters cull bad candidates before the clearance comparison:

1) The camera-forward filter rejects any direction that points within about 30° of the camera's forward. A direction pointing nearly into or out of the screen projects to a sliver of pixels and looks like a glitch. If all four directions fail this filter, the four are restored — a degenerate line is still better than a missing dimension.

2) The witness-length filter projects the would-be witness line at the post-push distance and measures it on screen. Any direction whose projected witness exceeds 120 pixels is rejected. Deep-perspective parts can generate witness lines that stretch halfway across the canvas, and those look wrong even when the math is right.

Evidence: [R_Dimensions.ts:629-761](../../../../src/lib/ts/render/R_Dimensions.ts#L629-L761)

### 3. Apply the silhouette push

The winning direction's clearance is added to the base distance, plus a 30-pixel margin so the label sits clear of the outline rather than touching it. The total push is capped at 80 pixels — beyond that, the label is allowed to sit closer to the drawing rather than fly off the canvas. The witness lines and the dimension line are then projected at the pushed distance.

Evidence: [R_Dimensions.ts:773-796](../../../../src/lib/ts/render/R_Dimensions.ts#L773-L796)

### 4. Decide the layout case

If the dimension line is long enough to fit the text plus a pair of inward-pointing arrows, the layout is "normal". Otherwise the arrows flip outward and the dimension line is extended past each end. Lines too short for either layout are dropped.

Evidence: [R_Dimensions.ts:815-821](../../../../src/lib/ts/render/R_Dimensions.ts#L815-L821)

### 5. Occlusion check

If another part has a front face that fully covers the label's text rectangle, AND that face is closer to the camera than the dimension line, the candidate is dropped. The label would be hidden anyway.

Evidence: [R_Dimensions.ts:962-997](../../../../src/lib/ts/render/R_Dimensions.ts#L962-L997)

After collection finishes, every surviving candidate carries its outside-the-silhouette position as its anchor, along with the projected witness lines, the projected dimension line, and the label rectangle the simulator and the renderer will work with.

## Dropping duplicates

If two candidates would print the same number anywhere in the drawing, only the first kept; the rest are dropped before the simulation. Cuts noise on symmetric parts where two dimensions would have read the same.

Evidence: [R_Dimensions.ts:432-440](../../../../src/lib/ts/render/R_Dimensions.ts#L432-L440)

## Force simulation

Every surviving candidate is treated as a particle. Three forces act on it during a fixed number of iterations per paint.

A spring pulls each label toward its outside-the-silhouette anchor. The spring is currently off by default — measurements showed it wasn't earning its keep, so its strength ships as zero. The runtime setter stays in place so the measurement UI can flip it back on for comparison.

Repulsion pushes overlapping labels apart along the axis of least overlap. When two label rectangles (plus their padding) overlap, the lower-index label gets pushed positive and the higher-index label gets pushed negative, so two coincident labels split apart instead of clumping.

Damping multiplies each label's velocity by 0.6 each iteration so the motion bleeds off rather than oscillating forever.

After the iteration loop, the largest single-pass movement is reported back; the renderer marks the system as settled when nothing moved more than half a pixel.

Evidence: [R_Dimensions.ts:226-279](../../../../src/lib/ts/render/R_Dimensions.ts#L226-L279)

### Carrying motion across paints

Each label's position and velocity are stored in a map keyed by part id plus axis name. The next paint seeds each candidate from this map before the iteration loop runs, so motion continues from where it left off. Labels that disappear between paints — part hidden, edge no longer on the silhouette, occluded — are pruned from the map after drawing.

This is why dimensions breathe smoothly when the model tumbles, instead of jumping every paint.

Evidence: [R_Dimensions.ts:73](../../../../src/lib/ts/render/R_Dimensions.ts#L73), [281-285](../../../../src/lib/ts/render/R_Dimensions.ts#L281-L285), [450-460](../../../../src/lib/ts/render/R_Dimensions.ts#L450-L460), [546-560](../../../../src/lib/ts/render/R_Dimensions.ts#L546-L560)

### Skipping work when nothing changed

If the previous paint settled AND the current paint has the same set of label keys with the same anchor positions (within half a pixel), the iteration loop is skipped entirely. Without this, borderline candidates would flicker in and out of the drop conditions on every paint as the simulator made microscopic adjustments.

Evidence: [R_Dimensions.ts:461-487](../../../../src/lib/ts/render/R_Dimensions.ts#L461-L487)

## Late drops

After the simulation finishes, three last filters run on every surviving candidate. Failing any one drops the label.

The off-canvas filter checks whether the label rectangle extends past any edge of the canvas. If it does, drop.

The floater filter recomputes the intersection between each witness line and the (post-simulation) dimension line. If either intersection lands BEHIND the witness line's start point — meaning the witness would have to grow backward to meet the dimension line — drop. Without this filter, those labels paint with a disconnected dimension line and look broken.

The drawn-witness filter measures each witness line's actual length after the simulation has moved the label. Even though the witness-length cap during collection already rejected the obvious offenders, the force simulation can stretch a witness line beyond 120 pixels after the fact. Drop those too.

Evidence: [R_Dimensions.ts:489-544](../../../../src/lib/ts/render/R_Dimensions.ts#L489-L544)

## Drawing

For each surviving candidate the renderer paints:

- Two witness lines, each from its anchor point straight to wherever the dimension line crosses its projected direction.
- The dimension line, pinned to pass through the label's settled position parallel to its original projected direction. Witness lines stretch or shrink to meet it; they never bend off-axis.
- The arrows — inward for normal layout, outward for inverted.
- The label rectangle (white fill, dark text), painted horizontally regardless of the dimension line's angle on screen.

Each painted label also pushes a rectangle onto the renderer's list so click-to-edit can hit-test it later.

Evidence: [R_Dimensions.ts:999-1104](../../../../src/lib/ts/render/R_Dimensions.ts#L999-L1104)

## Repeater integration

Repeater clones skip dimensions entirely — only the template (the first child) paints all three axes. Fireblock parts are the exception.

The first fireblock paints its repeat-axis dimension only. The last fireblock also paints its repeat-axis dimension, but only if its length differs from the first fireblock's — a shortened bookend bay.

Fireblocks are identified by comparing their repeat-axis length to the template's. They differ because fireblocks are sized to the bay gap, not the stud width.

Evidence: [R_Dimensions.ts:380-410](../../../../src/lib/ts/render/R_Dimensions.ts#L380-L410)

## Diagnostic counters

Every paint, the file counts: candidates collected, duplicates dropped, directions forbidden by the camera-forward filter, candidates whose smallest clearance exceeded the 80-pixel push cap, off-canvas/floater/long-witness drops, post-simulation overlaps still left, and labels actually painted. Each count feeds a running average via an incremental-mean formula (no history stored — one float per metric). The status strip reads the dropped-label average so the user sees how many dimensions are being suppressed per frame on average.

Evidence: [R_Dimensions.ts:79-89](../../../../src/lib/ts/render/R_Dimensions.ts#L79-L89), [297-302](../../../../src/lib/ts/render/R_Dimensions.ts#L297-L302), [578-591](../../../../src/lib/ts/render/R_Dimensions.ts#L578-L591)

## Key constants

| Name | Default | Purpose |
| --- | --- | --- |
| `gap_px` | 4 | gap between the edge and the witness line start |
| `dist_px` | 20 | base distance from the edge to the dimension line, before the silhouette push |
| `ext_px` | 8 | witness line extension past the dimension line |
| `SILHOUETTE_MARGIN` | 30 | buffer pixels between the drawing's outline and any label |
| `PUSH_CAP_PX` | 80 | hard ceiling on how far a label can be pushed past the outline |
| `WITNESS_LEN_MAX` | 120 | longest acceptable projected witness during direction selection |
| `WITNESS_DRAWN_MAX_PX` | 120 | longest acceptable drawn witness after the simulation settles |
| `FORBIDDEN_CAM_DOT` | 0.866 | cosine threshold for "too close to camera forward" (~30°) |
| `SPRING_K` | 0 | spring strength pulling labels toward the outside-the-silhouette anchor (off by default) |
| `REPULSION_K` | 0.4 | strength of inter-label push when rectangles overlap |
| `PADDING` | 15 | extra pixels around each label rectangle for repulsion purposes |
| `DAMPING` | 0.6 | per-iteration velocity multiplier |
| `ITERATIONS` | 30 | simulation passes per paint |

Pixel targets in the upper rows are converted to 3D distances via the average projected length of a unit witness vector at both edge endpoints, then projected.

When a value's wrong, the symptom usually points to it:

- Labels overlap → repulsion too weak, padding too small, or not enough iterations.
- Labels drift and never settle → damping too high, iterations too high.
- Labels land inside the drawing → silhouette margin too low, or the 80-pixel push cap clipping a needed push.
- Labels disappear in deep-perspective views → witness-length cap too low, camera-forward filter too aggressive.
