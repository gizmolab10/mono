# Dimensions code spec — fresh read June 10, 2026

This is a numbered description of what the dimensions code DOES today, written by walking the source files top to bottom. It does not consult any existing rules or proposal file in notes/work — every claim is backed by a file-and-line citation so you can verify against the running code.

## A. When and what runs

1. Every time the canvas redraws, the dimensions code does three things in order: clears the list of last frame's clickable label rectangles, runs the placement search, then asks the renderer to draw the result.
   - Source: di/src/lib/ts/render/R_Dimensions.ts:31-36

2. A diagnostic overlay can also draw at the start: a red silhouette-box wireframe, dashed grey rejected-face outlines, and blue outlines of the kept faces. All three are gated by hard-coded flags in the renderer; current setting is all OFF, so nothing diagnostic draws by default.
   - Source: di/src/lib/ts/render/Dimension_Renderer.ts:292-322, 382-383

2a. Persistence between renders. The second step from rule 1 (run the placement search) gets a conditional branch around it. Each label's last-render values — which edge, which face, which witness index, which label position — are remembered. On the next render, four viability checks per label decide whether the full search can be skipped:

    - The label's previous witness index is still on the post-vote winners list for its face.
    - The label's previous position along the dim line is within (new range start − 5 px) to (new range end + 5 px).
    - At the remembered position, the label rectangle still clears every other label's remembered rectangle by the pair-clearance value.
    - At the remembered position, the label rectangle does not cross inside the silhouette polygon (touching from outside is fine — matches the main search path's silhouette filter; rule 26).

    If every label passes all four, the full search is skipped and the remembered values are reused for this render. If any label fails any check, the full search runs seeded with last render's values: labels that pass the STRICT (no-tolerance) versions of the same four checks are LOCKED in place and act as fixed obstacles; only labels that failed get re-placed.

    Drift safety: after two consecutive skip-renders in which any check passed only by the 5-pixel tolerance (would have failed without it), force a full search on the next render anyway.

    - Source: di/src/lib/ts/render/Dimension_Placement.ts — persistence record type and map near the top of the file; the skip-versus-seeded-versus-full decision inside run_uniface_placement after the witness-index vote.

## B. Which parts get dimensioned

3. A part is eligible when it is currently visible AND none of its ancestors is set to hide its children AND it has no visible child of its own (it is a leaf in the visible tree).
   - Source: di/src/lib/ts/render/Dimension_Placement.ts:462-480, 3129-3142

4. X-RAY MODE: when the OPTION key is held AND the scene has at least one hidden part, the eligibility flips — only HIDDEN parts get dimensioned and visible parts get nothing. With no hidden part present, OPTION-hold is a no-op.
   - Source: di/src/lib/ts/render/Dimension_Placement.ts:468-471

5. Eligible parts are walked alphabetically by part name. This walk order is what makes the duplicate-text drop deterministic (the alphabetically earliest part claims any given text-on-axis pair).
   - Source: di/src/lib/ts/render/Dimension_Placement.ts:3147

## C. Repeater filter

6. A part with no parent, or whose parent is not a repeater, is eligible on all three axes.
   - Source: di/src/lib/ts/render/Dimension_Placement.ts:511-512

7. The FIRST child of a repeater is the template — eligible on all three axes.
   - Source: di/src/lib/ts/render/Dimension_Placement.ts:514-517

8. A non-template child of a NON-firewall repeater is a clone — gets no dimensions on any axis.
   - Source: di/src/lib/ts/render/Dimension_Placement.ts:518-521

9. Inside a FIREWALL repeater: a child whose length on the repeat axis matches the template is a clone (no dimensions). Children whose length differs are fireblocks. The FIRST fireblock and the LAST fireblock (when its length differs from the first) are eligible — but only on the repeat axis. Middle fireblocks are clones.
   - Source: di/src/lib/ts/render/Dimension_Placement.ts:522-540

9a. FIREBLOCK PER-AXIS SKIP. For an eligible fireblock, the main loop in run_uniface_placement still iterates all three axes. The two axes that are not the repeat axis are silently continued past at the top of the per-axis body; only the repeat axis enters the search.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:3468-3471

## D. Silhouette box and uniface box

10. The silhouette box is the world-axis-aligned bounding box of every corner of every rendered eligible part. It is computed in the room's STATIC (untumbled) frame, so it stays glued to the parts and tumbles with the view rather than swinging around with the screen.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2031-2046, 2120-2135

11. The uniface box has six faces, one per world-axis outward direction (LEFT, RIGHT, FRONT, BACK, TOP, BOTTOM). Each face sits OUTSIDE the matching side of the silhouette box by a configured SCREEN-pixel margin (15 px). The shift in world units to achieve that screen distance is computed once per face by projecting one world-unit-along-the-outward-normal and measuring the resulting screen distance.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2057-2096

12. There are FOUR nested uniface boxes, at screen distances 1×margin, 2×margin, 3×margin, 4×margin from the silhouette box. The witness-index cap is 4.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2077-2094, di/src/lib/ts/common/Constants.ts:160

13. FACE EXCLUSION. A face is excluded for the entire nested-box family when its outward normal points WITHIN 20° of straight at the camera, OR WITHIN 45° of straight away from the camera. The camera direction is expressed in the room's static frame (the camera never actually moves — the room rotates around it instead).
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2010-2026, 2141-2151, di/src/lib/ts/common/Constants.ts:165-166

## E. What the search decides per (part, axis)

14. For each (part, axis), the search chooses four things at once:
    - which of the part's four parallel edges to anchor the witness lines from
    - which of the four candidate faces to lay the dim line in
    - which nested-uniface index (1, 2, 3, or 4) to use
    - the label's position along the dim line.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:3631-3919

15. The four candidate faces per axis are exactly the faces whose outward normal is perpendicular to the axis being measured:
    - x-axis (width): FRONT, BACK, TOP, BOTTOM
    - y-axis (depth): LEFT, RIGHT, TOP, BOTTOM
    - z-axis (height): LEFT, RIGHT, FRONT, BACK
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2183-2187

## F. Pre-search vote on witness indices (runs once per render)

16. A first-look sweep visits every (part, axis, face, witness-index) cell IN ISOLATION — no cross-part comparisons. For each cell, shape filters run on the (edge, face, witness-index) AND five sampled label positions (50%, 30%, 70%, 15%, 85% along the dim line) are tested against the silhouette polygon. A cell counts as viable when at least one position passes.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:3270-3399, sample positions at 3232

17. After the sweep, every (face, witness-index) cell has a count: how many distinct (part, axis) records marked it viable. Per face, the two cells with the highest counts win the vote; ties break toward the smaller witness index. A face with zero viable parts has no winners.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:3403, pick_top_two at 2454-2472

18. The main search later REFUSES to enter any (face, witness-index) cell that lost the vote. Each face concentrates its labels onto at most two shared witness indices.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:3646-3650

## G. Main search loop

19. For each (part, axis), the main loop walks the witness indices in order (1, 2, 3, 4). Inside one witness index it walks the four candidate edges; inside each edge it walks the four candidate faces; inside each (edge, face) combination, the shape filters run once and if they pass, the loop tries the five sampled label positions.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:3631-3919

20. The loop RETURNS THE FIRST WITNESS INDEX with at least one passing candidate. As soon as one witness index yields a winner, deeper witness indices are not visited at all. Within the winning witness index, the highest-scoring candidate (across all edge/face/position combinations) wins.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:3918 ("first witness index with a winner wins")

20a. NO-CANDIDATE SILENT DROP. When a (part, axis) finishes the main loop without a winner — every witness index in 1, 2, 3, 4 was tried and no edge/face/position combination passed — run_uniface_placement still pushes a placement record for that (part, axis), but with no chosen face. The record carries the formatted number text (for the diagnostic log) but no anchors, no edge endpoints, no label position. The renderer never sees this record; the cleanup pass below strips it.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:4017-4032

20b. FINAL CLEANUP PASS. Before returning, run_uniface_placement filters out every placement whose chosen face is null. That removes:
    - the no-winner drops from rule 20a,
    - the duplicate-text drops from rule 22 (which also push a null-face record),
    - any other dimension-level rejection that records a null-face placement.

    The diagnostic counter "no-viable-pair drop removed N placements" reports how many got stripped on this render.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:4037-4043

## H. Filters — three groups

21. Filters are grouped by what they depend on:
    - DIMENSION filters depend on (part, axis) only; run once per part-axis before any side is considered.
    - SHAPE filters depend on (edge, face, witness-index) only; run once per such combination.
    - POSITION filters depend on the candidate label position; re-run for every sampled position.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2595-2630

### Dimension filters

22. DUPLICATE-TEXT DROP: if some already-placed dimension shows the SAME formatted number text on the SAME axis, this whole (part, axis) is rejected. The part records a null placement and is skipped. Since parts are walked alphabetically, the alphabetically earliest part wins any tie.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2636-2648, 3480-3519

### Shape filters

23. EDGE-ON-PLANE: the dim's flat plane normal (the cross of the edge direction and the face's outward normal) is dotted with the camera direction. The absolute value of that dot must be at least 0.174 (about 10° off edge-on). Below that, the dim's plane is so nearly edge-on to the camera that drawing in it would be unreadable — reject the whole (edge, face).
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2696-2701, threshold at di/src/lib/ts/common/Constants.ts:164

24. WITNESS-OVERLAPS-PLACED: if either of this candidate's two witness lines lies on the same 3D infinite line as any already-placed witness line, reject. Catches the case where two parts share an edge along the same direction and would otherwise draw two coincident witness lines.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2702-2711, segments_coincide_3d at 2654-2689

25. OWN-WITNESS-CONVERGENCE: the screen-pixel distance between the candidate's two witness lines themselves must be at least 15. Perspective can squeeze them toward each other; if they would draw within 15 px on screen, reject this (edge, face).
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2712-2718

### Position filters

26. SILHOUETTE: the candidate's label rectangle must NOT intersect the silhouette polygon (the six-sided projected outline of the silhouette box). The default clearance margin is zero — touching from outside is allowed; any crossing inside is rejected.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2746-2754

27. LABEL-VS-LABEL: the candidate label rectangle must clear every already-placed label rectangle by at least 5 px.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2756-2761

28. LABEL-VS-PLACED-ANCHOR: the candidate label rectangle must clear every already-placed witness anchor point by at least 5 px.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2762-2770

29. LABEL-VS-PLACED-WITNESS: **DISABLED IN CODE**. Code block is commented out. The comment explains: the white label box renders solid over any witness line passing behind it, so visual readability does not require the clearance.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2771-2782

30. LABEL-VS-PLACED-DIM: the candidate label rectangle must clear every already-placed dim line by at least 5 px.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2783-2790

31. OWN-ANCHOR-VS-PLACED: the candidate's OWN two anchors must clear every already-placed label rectangle by at least 5 px.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2791-2803

32. OWN-DIM-VS-PLACED: the candidate's OWN dim line must clear every already-placed label rectangle by at least 5 px.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2804-2809

32a. LABEL-VS-WITNESS-ANCHOR-ZONES: the candidate label rectangle must NOT overlap a 20-pixel zone extending along the dim line BEFORE OR AFTER each anchor in the following set:
    - each of the candidate's OWN two witness anchors (measured along the candidate's own dim line), AND
    - each anchor of every already-placed label (each measured along that placed label's own dim line).

    The zone is a flat 20 pixels on each side of each anchor, with no label-width dependence. Reject the candidate when the rectangle overlaps any zone in the set, even partially. Like the existing own-anchor and own-dim filters (rules 31, 32), the new filter is NOT slide-eligible — sliding the candidate would move it relative to its own anchors, which also gate it.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts — evaluate_position_clearances' anchor-zone check at the tail of the position-filter pipeline.

## I. Slide-and-retry recovery

33. When one of the POSITION filters rejects (filters 26, 27, 28, 30 — filter 29 is disabled), the search tries to recover: it shifts the label along the dim line by the rejection's reported shortfall plus one pixel, in each of the two dim-line directions, and re-runs the position filters once on each shifted version. The first direction that passes wins. Shape filters and own-anchor / own-dim filters are NOT slide-eligible (sliding moves only the label, not the witnesses or anchors).
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:3815-3844, slide-eligible set at 2624-2630

## J. Scoring

34. For a surviving candidate, the score is:
    - PLUS: bonus for the label fitting between the witnesses, equal to (dim length on screen − label width on screen).
    - MINUS: a centering penalty, 20 × (off-center percent)², zero at the midpoint and 20 at either anchor.
    - MINUS: a witness-length penalty, 1 × average screen length of the two witnesses.
    - MINUS: an inside-silhouette penalty, 200 × average percent of each witness line that lies inside the silhouette polygon (sampled at 11 points per witness).
    - MINUS: a world-distance penalty, 100 × the world-coordinate perpendicular distance from the part edge to the chosen face.

    The world-distance term dominates by design — the closest face in 3D world space wins by default; the other terms only break ties.

    As one equation:

    **S = (L − W) − α·u² − β·(W₁ + W₂)/2 − γ·(I₁ + I₂)/2 − δ·max(0, D)**

    Legend (all screen distances in pixels; world distances in world units):
    - S = the candidate's score; higher wins
    - L = dim line length on screen
    - W = label width on screen
    - t = sampled label position along the dim line (t = 0 at the first anchor, t = 1 at the second)
    - u = |t − 0.5| / 0.5  (off-center fraction; u = 0 at the midpoint, u = 1 at either anchor)
    - W₁ = first witness line's screen length
    - W₂ = second witness line's screen length
    - I₁ = percent of the first witness line inside the silhouette polygon, sampled at 11 evenly spaced points (0 to 100)
    - I₂ = same, for the second witness line
    - D = world-coordinate perpendicular distance from the part's bounding-box face to the chosen uniface face's plane (clamped to zero from below)
    - α = 20 (centering-penalty cap, in score units, reached at either anchor)
    - β = 1 (witness-length weight, in score units per screen pixel)
    - γ = 200 (inside-silhouette weight, in score units per percent)
    - δ = 100 (world-distance weight, in score units per world unit)

    - Source: di/src/lib/ts/render/Dimension_Placement.ts:3232-3236 (the four weights), 3845-3885 (the formula)

## K. Label slide and per-side arrow flip

35. LABEL SLIDE TRIGGER. Before the position filters run on a candidate position, the search checks: would either arrowhead's anchor AND its arrow base both sit INSIDE the label rectangle (padded by 2 px in x, 1 px in y) at this position? If yes for either side, the label is slid past that witness by (half-label-width + 2 + 20 + arrow-length). The position filters then see the slid position, so cross-label clearance is checked at the FINAL location. The renderer reads the same slid position later; it does not slide again.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:3722-3750, does_label_fully_cover_inside_arrow at 2279-2300

36. PER-SIDE FLIP. When the label is not slid, each side decides independently whether its arrow points inward or outward. The trigger per side: the anchor's signed distance from the label edge along the dim direction is less than (half-label-width + 2 + arrow-length). If less, that side flips to draw the outside extension and the outward-pointing arrow. The two sides decide independently — one can flip while the other does not.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2258-2271, 2391-2393

## L. What gets drawn

37. For every kept placement: two witness lines, one or more dim-line segments, two arrowheads (one per side), a white label box, the formatted number text inside the box, and a clickable rectangle registered with the hit-test system.
    - Source: di/src/lib/ts/render/Dimension_Renderer.ts:43-120, 206-271

38. WITNESS LINES start 5 pixels past the part edge (small gap so the witness does not touch the part) and end 10 pixels past the anchor (small overhang). Both witness lines draw from a single beginPath call.
    - Source: di/src/lib/ts/render/Dimension_Renderer.ts:24-27, 179-199

39. OFF-CANVAS DROP. If both anchors of the dim line are off the visible canvas, the placement draws nothing. If at least one anchor sits on the canvas, the whole geometry draws (clipped by the canvas).
    - Source: di/src/lib/ts/render/Dimension_Renderer.ts:83-91

40. DIM LINE SHAPE depends on which sides flipped and whether the label was slid:
    - SLID (label past one anchor): a 20-px overhang past each anchor (outside extension), PLUS a connector from the slid-past anchor's overhang outer end to the label's near edge.
    - BOTH SIDES INSIDE (normal): one straight line from anchor to anchor.
    - ONE SIDE INSIDE, ONE OUTSIDE: half-line from the inside anchor to the label's near edge on that side, plus a 20-px overhang past the outside anchor. Nothing crosses the label box.
    - BOTH SIDES OUTSIDE: two 20-px overhangs, one past each anchor. The label sits between, with no line crossing it.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2402-2422

41. ARROWS. Inside arrow: tip at the anchor, pointing along the dim line toward the other anchor. Outside arrow: tip at the anchor, pointing along the overhang AWAY from the other anchor. The arrow is a filled triangle drawn by the host's draw_arrow helper.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:2423-2430, di/src/lib/ts/render/Dimension_Renderer.ts:236-238

42. LABEL BOX. A white rectangle padded 2 px in x and 1 px in y around the dim text. The text is drawn centered horizontally and vertically inside the box. The box draws LAST in the rendering order so it covers any line passing behind it.
    - Source: di/src/lib/ts/render/Dimension_Renderer.ts:240-253, di/src/lib/ts/render/Dimension_Placement.ts:2431-2436

43. NUMBER TEXT. The part's dim value (width / depth / height) in millimeters is run through the unit formatter — current unit system, current precision — and the result is what shows on screen.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:3208-3212

## M. Hover and click-to-edit

44. Each label rectangle pushes a clickable entry (axis, owning part, screen position, size, witness index) into the dimension_rects list every render. The 3D hit-test code reads this list to map cursor positions to dim labels.
    - Source: di/src/lib/ts/render/Dimension_Renderer.ts:256-270

45. HOVER PAINTS IN RED. When the cursor is on a uniface placement (any of its dim or witness lines), the hovered placement's owning part identifier is recorded. When the cursor is on the part itself (corner / edge / face hover from the 3D hit test), the part identifier is recorded the same way. Either source: EVERY placement on that part draws its dim and witness lines in red, AND the part's outline (convex hull of its projected vertices) outlines in red. The label box still draws on top in normal color over each red line.
    - Source: di/src/lib/ts/render/Dimension_Renderer.ts:122-176

46. The render order is three layers: first the blue dim and witness lines (over the drawable list), then the red hover overlay (same lines, drawn in red on top), then the arrows and label boxes (always drawn last so they sit visibly on top of everything).
    - Source: di/src/lib/ts/render/Dimension_Renderer.ts:72-119

## N. Diagnostic logging

47. Every render builds a summary line for the diagnostic log: total dimensions considered, how many had at least one passing candidate, how many were picked, the witness-index vote counts and winners per direction, per-filter rejection histogram, and per-filter drops (repeater, no-viable-pair, off-canvas).
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:4044-4070

48. When a part is currently hovered, the diagnostic ALSO gets a per-side breakdown for that part's dimensions: the score components for each candidate side that survived ("score = fits-between X − off-center Y − line-length Z − crosses-design W − distance-from-part V (witness index N) <- chosen"), or "no passing candidate (N tried, mostly rejected by FILTER)" with a sample failing label rectangle on screen and a plain-English "why" line.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:3938-4009

49. REPEAT SUPPRESSION. If the diagnostic text exactly matches last render's, no log is emitted (mouse-move-only renders stay quiet). Otherwise the text goes to the browser console AND a POST request sends it to a hub dispatcher at localhost:5171/log-dimensionals that writes it to a file. The FIRST POST per browser session adds ?fresh=1 to overwrite the file; subsequent POSTs append.
    - Source: di/src/lib/ts/render/Dimension_Placement.ts:3082-3108, 4063-4069

## O. Constants in current use

The actual values driving the behavior, copied from di/src/lib/ts/common/Constants.ts:156-201:

- Witness-index cap: **4** nested uniface boxes
- Excluded-face front angle: **20°** (face pointing within 20° of the camera is rejected)
- Excluded-face back angle: **45°** (face pointing within 45° away is rejected)
- Edge-on dot threshold: **0.174** (about 10° off edge-on; below = rejected)
- Silhouette margin = witness-vs-witness convergence minimum: **15 px**
- Pair clearance (label-vs-label, label-vs-anchor, label-vs-dim, own-anchor, own-dim): **5 px**
- Outside-extension overhang: **20 px**
- Witness gap from part edge: **5 px**
- Witness past the anchor: **10 px**
- Label position samples per (edge, face, witness-index): **5** at 50%, 30%, 70%, 15%, 85%

Scoring weights (hard-coded inside `run_uniface_placement`, di/src/lib/ts/render/Dimension_Placement.ts:3232-3236):

- Centering penalty at the anchors: **20**
- Witness-length penalty per pixel: **1**
- Witness-inside-silhouette percent penalty: **200**
- World-distance penalty per world unit: **100**

Label rendering (di/src/lib/ts/render/Dimension_Renderer.ts and 2431-2436):

- Label box padding: **±2 px** in x, **±1 px** in y
- Label height: **14 px**
- Label font: **12 px sans-serif**
- Arrow size: **6 px**
