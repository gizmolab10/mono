<!-- markdownlint-disable MD060 -->

# Dimensions placement latest spec

This spec describes what the dimensions code does every time the canvas redraws. The spine is the per-render data pipeline. Each chapter is one stage of that pipeline; chapter one shows the whole flow, chapters two through eight walk it stage by stage, chapter nine covers the log, and chapter ten lists the constants.

Source root: `di/src/lib/ts/render/Dimension_Placement.ts` and `di/src/lib/ts/render/Dimension_Renderer.ts`.

---

## 1. Pipeline

Every render runs this flow, top to bottom:

```text
   scene parts
       |
       v
   eligible parts                          (chapter 2)
       |
       v
   silhouette box  +  uniface boxes        (chapter 3)
       |
       v
   traversal order: all eligible part-axes (chapter 4)
       |
       v
   filter chain: each part-axis            (chapter 5)
       |
       v
   scoring                                 (chapter 6)
       |
       v
   placements
       |
       v
   render                                  (chapter 8)
```

Persistence (chapter 7) wraps the whole pipeline: when the scene is stable, the placements from last render are reused and the chain in the middle is skipped.

The diagnostic log (chapter 9) writes one block per render summarising what happened.

---

## 2. Candidates (eligibility)

Selected and hovered parts are always eligible.

A placement is one (edge, face, witness-index) choice. Each eligible part has three axes; each axis has four candidate edges (12 per part). Each edge borders two faces (up to 24 per part). Each face offers seven placements (up to 168 per part): the six witness-index levels (3.2) plus the outer edge (3.3). Each placement is then sampled at five label positions — 50%, 30%, 70%, 15%, 85% along the dim line (up to 840 per part).

### 2.1 Per-axis candidate faces (planes)

Each part has six faces. Dimensionals are drawn in the plane of a face that contains the edge being measured. For each axis, the candidate faces are those whose outward normal is perpendicular to that axis (see table). Each axis can contain 0, 1 or 2 dimensionals, out of a possible 8.

| Axis (label)     | Candidate faces             |
| ---------------- | --------------------------- |
| x  (width)       | FRONT, BACK, TOP, BOTTOM    |
| y  (depth)       | LEFT, RIGHT, TOP, BOTTOM    |
| z  (height)      | LEFT, RIGHT, FRONT, BACK    |

### 2.2 Face exclusion

A face is excluded from EVERY witness-index level when its outward normal points:

- within 20 degrees of straight AT the camera, OR
- within 45 degrees of straight AWAY from the camera.

Camera direction is expressed in the room's static frame.

### 2.3 Frustum exclusion

A part is eligible only when ALL eight of its box corners project inside the canvas and in front of the camera; if even one corner is off-screen or behind the camera, the part is dropped. Which parts qualify shifts as you zoom, and differs between the flat scale and the dolly (zoom cluster A and B).

Every mark (line, label, arrowhead) of every dimensional MUST be inside the canvas. Any placement with a mark outside is NOT viable -> dropped.

### 2.4 Occlusion exclusion

An edge of a part is excluded (not measured) when any stretch of it is hidden behind another part. This uses the renderer's own hidden-line result — the same clipping that decides which parts of an edge are drawn — so a partly hidden edge (its middle behind another part, its ends showing) is excluded too, not only edges whose end corners are hidden.

### 2.5 Repeater filter

| Part is...                                            | Eligible? | Axes              |
| ----------------------------------------------------- | --------- | ----------------- |
| No parent, or parent is not a repeater                | yes       | x, y, z           |
| First child of a repeater (the "template")            | yes       | x, y, z           |
| Non-template child of a non-firewall repeater (clone) | no        | —                 |
| Inside a firewall repeater, matches template length   | no (clone)| —                 |
| Inside a firewall repeater, first/last fireblock      | yes       | repeat axis only  |
| Inside a firewall repeater, middle fireblock          | no (clone)| —                 |

---

## 3. Geometry

### 3.1 Silhouette box

A world-axis-aligned box. Its corners are every corner of every visible LEAF part whose eight corners ALL project inside the visible canvas after tumble plus projection. Container parts (parents with visible children) do not feed the silhouette. Parts partly off canvas are skipped. The box is computed in the room's STATIC (untumbled) frame, so it stays glued to the parts and tumbles with the view.

When zero parts qualify (heavy zoom), the box collapses to a single point at the origin and the silhouette-clearance filter (chapter 5) becomes a no-op.

### 3.2 Uniface boxes

Six nested boxes, each one face-by-face offset from the silhouette box. Offset distances are PROJECTED SCREEN PIXELS, fifteen pixels per witness-index level:

| Witness index | Screen pixels past the silhouette |
| ------------- | ---------------------------------- |
| 1             | 15                                 |
| 2             | 30                                 |
| 3             | 45                                 |
| 4             | 60                                 |
| 5             | 75                                 |
| 6             | 90                                 |

Each box has six faces (LEFT, RIGHT, FRONT, BACK, TOP, BOTTOM). Per face, the millimeter shift is computed once by projecting the face center and one world-unit-along-the-outward-normal, then scaling.

### 3.3 Outer edge placements

Outer edge is JUST ANOTHER OPTION, checked in the same loop as the unifaces (filtered in chapter 5 and scored in chapter 6). They are NOT a fall-back that runs only when nothing else is viable.

Each part-axis can place a dimension at the OUTER EDGE, at eight different locations. Each direction has four edges it can measure (anchor the wit lines). Each edge has two outward perpendicular directions (pointing away from the part).

For each, a binary search finds the SMALLEST shift along the wit line such that, after the part's world matrix plus tumble plus projection are applied, every drawn mark of the dimensional sits at least 10 px inside its nearest canvas edge AND all the other rules. Smallest shift means shortest **tumbled and projected** wit lines.

Placements whose two projected witness lines run closer than 15 px apart are dropped (same threshold as the uniface placements).

## 4. Traversal order

Selected and hovered parts are traversed first. If the dimensions count N is non zero, traversal examines each remaining eligible part, passing each of its 168 placements through the filter chain (see 5).

Build the traversal order (of part-axes) by scanning every part on all three of its axes. Collect all of these part axes in an array, largest dimensions first.

For those part-axes with equal lengths select just one and drop the rest according to this rule -> the parent (when it matches one of its children) or select the one whose name appears alphabetically first.

Each step of the traversal results in one or fewer valid placements.

### 4.1 Count threshold

A logarithmic slider to set a number N -> how many dimensionals are visible, shown rounded to nearest integer. Range from 0 to 100, default 2. Tick marks every 10 units. Slides continuously. N persists across reload. Just to the right of the names/angles segmented control.

N counts the largest dimensions: walking largest-first, the first N valid placements draw and use up the N — whether or not their parts are selected or hovered (a selected part among the largest uses one of the N). Beyond the N, a selected or hovered part still draws every valid dimension it has, whatever its length; an ordinary part draws nothing more. Selected or hovered parts are also always eligible — candidates even when only partly on screen.

### 4.2 Low pass threshold (not yet designed)

---

## 5. Filter chain

Each part has three part-axes. Each part-axis has up to 56 placements (168 / 3). Only one viable label position is needed.

Each placement runs through the chain of filters, cheapest first: the orientation and overlap filters per placement, then the witness-length filters per label position; the first failure stops the chain. A placement with at least one label position that passes every filter is VIABLE, and that label position goes on to scoring (chapter 6). A part-axis with zero viable label positions produces no dimensional on that axis.

### 5.1 Orientation filter

Run once per placement (edge / face / witness-index).

| Filter          | What it checks                                                                                    | Threshold                    |
| --------------- | ------------------------------------------------------------------------------------------------- | ---------------------------- |
| `edge-on-plane` | The dim's flat plane is too close to edge-on toward the camera (label would draw nearly side-on). | 0.174 dot (~10° off edge-on) |

### 5.2 Overlap filters

Run once per placement (edge / face / witness-index).

| Filter                    | What it checks                                                             | Threshold |
| ------------------------- | -------------------------------------------------------------------------- | --------- |
| `witness-overlaps-placed` | A witness line runs too close to an already-placed witness line on screen. | 5px       |
| `own-witness-convergence` | The two witness lines for THIS placement run too close on screen.          | 15 px     |

### 5.3 Witness length filters

These are run once per label position.

| Filter                   | What it checks                                                                 | Threshold |
| ------------------------ | ------------------------------------------------------------------------------ | --------- |
| `silhouette`             | Label rectangle crosses INSIDE the silhouette polygon.                         | 0 px      |
| `label-vs-label`         | Label rectangle clears every already-placed label rectangle.                   | 5 px      |
| `label-vs-placed-anchor` | Label rectangle clears every already-placed witness anchor.                    | 5 px      |
| `label-vs-placed-dim`    | Label rectangle clears every already-placed dim line.                          | 5 px      |
| `label-vs-placed-witness`| Label rectangle clears every already-placed witness line.                      | 5 px      |
| `label-vs-anchor-zone`   | Label rectangle does not overlap a 20 px zone past any anchor (own or placed). | 20 px     |
| `own-anchor-vs-placed`   | This placement's own two anchors clear every already-placed label rectangle.   | 5 px      |
| `own-dim-vs-placed`      | This placement's own dim line clears every already-placed label rectangle.     | 5 px      |
| `own-witness-vs-placed`  | This placement's own witness lines clear every already-placed label rectangle. | 5 px      |

### 5.4 Slide-and-retry

When a label position fails the entire filter chain, the search shifts the label by (the rejection's shortfall + 1 px) along the dim line — once in each direction — and re-runs the witness-length filters on the shifted label. The reposition that passes wins; if both directions pass, the first one tried wins.

Sliding moves the label, not the witnesses or anchors. So the orientation and overlap filters (5.1, 5.2) and the own-anchor / own-dim / anchor-zone filters are NOT slide-eligible and are not invoked during this slide filter.

---

## 6. Scoring

For a part-axis with at least one viable label position, every viable label position gets a score; the highest wins.

```text
S = (L - W) - α·((t − 0.5) / 0.5)² - β·(W₁ + W₂)/2 - γ·(I₁ + I₂)/2 + ε·R - ζ·max(0, n_camera · n_out) + η·(1 − |n_front · n_out|)·max(0, −n_camera · n_front)
```

| Symbol   | Meaning                                                                                                                                       | Value |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| S        | the label position's score; higher wins                                                                                                       |       |
| L        | dim line length on screen (px)                                                                                                                |       |
| W        | label width on screen (px)                                                                                                                    |       |
| t        | label's sampled position along the dim line, 0 at anchor 1 to 1 at anchor 2                                                                   |       |
| W₁, W₂   | screen lengths of the two witness lines (px)                                                                                                  |       |
| I₁, I₂   | percent of each witness line inside the silhouette polygon, sampled 11 times                                                                  | 0–100 |
| R        | screen-pixel distance from anchor midpoint to canvas edge along the outward perpendicular; clamped to zero from below                         | px    |
| n_camera | camera-forward direction in static-world coords (points from camera into the scene)                                                           | unit  |
| n_out    | perpendicular to the measured edge, lies in the plane of one of the two faces that meet at that edge, and points outward (away from the part) | unit  |
| α        | centering-penalty cap                                                                                                                         | 20    |
| β        | witness-length weight per px                                                                                                                  | 3     |
| γ        | inside-silhouette weight per percent                                                                                                          | 200   |
| ε        | screen-room weight per px                                                                                                                     | 1     |
| n_front  | part's front-most face normal in static-world coords (the face most aligned with the camera)                                                  | unit  |
| ζ        | face-orientation penalty weight                                                                                                               | 50000 |
| η        | lies-flat reward weight                                                                                                                       | 500   |

The face-orientation penalty (ζ·max(0, n_camera · n_out)) penalises label positions whose outward direction points AWAY from the camera — the label would sit on the back side of the part, behind it. A label position whose outward direction points toward the camera pays zero. Weight fifty thousand outranks the empty-canvas reward by enough that no plausible amount of open canvas can rescue a back-side label position when any front-side one is viable.

The lies-flat term (η·(1 − |n_front · n_out|)·max(0, −n_camera · n_front)) rewards label positions whose outward direction lies in the plane of the part's front-most face. The reward also scales with how strongly that face points toward the camera — a face perpendicular to the view earns nothing; a face pointing straight at the camera earns full weight. The reward favours in-plane choices in lightly congested areas without overriding the face-orientation penalty or witness-length term.

The empty-canvas-room term (ε·R) is what gives the search its bias for directions with more empty space outside the silhouette; the witness-length penalty (β) holds short witnesses still attractive when the room is similar; the inside-silhouette penalty (γ) protects against witness lines drawn over the building.

---

## 7. Persistence between renders

The pipeline's output (the placements) is remembered for one render. On the next render, every persisted placement is re-projected and viability-checked. The ones that still fit are thus valid and contribute their geometry ***"as fixed obstacles to the filter chain"***; the ones that fail are repositioned by ***"the main loop"***. There is no separate "skip everything if nothing changed" short-circuit — the validate-and-reposition path runs every render.

Each persisted placement records: the chosen edge, face, label position, and one outward locator — the witness-index for a uniface placement, OR the outward distance in mm from the edge to the anchor for an outer-edge placement. Never both. (An outer edge has no uniface-box shift to read, so it stores the distance instead; the reuse pass rebuilds its anchors by shifting the edge that far along the outward direction.) On the next render, the placement is re-projected and the following four viability checks run (STRICT, no tolerance):

- The previous label position is within [0, 1] along the new dim line range. (Slid placements are exempt — their saved fraction stays outside [0, 1] by design.)
- Pair clearance (label vs label): **5 px**. The label rectangle still clears every other previously-valid label rectangle by 5 px.
- The label rectangle does not cross inside the new silhouette polygon.
- Pair clearance (label vs witness, witness vs label): **5 px**. The label rectangle clears every previously-valid witness line, and its own witness lines clear every previously-valid label rectangle.

Plus: If a persisted placement drifts past a canvas edge after tumble, the entire traversal (chapter 4) runs again.

A persisted placement that passes ALL checks is valid. Its rectangle, witnesses, dim line, and anchors join the placed-obstacles set before the main loop runs. The free placements (failed checks, or part-axes that never had a winner last render) filter around the valid ones.

### 7.1 Which events reposition, which do not

These events rebuild positions:

- **First render (no prior valid list)** — every placement is computed fresh; there is nothing to keep in place yet.
- **A scene change** — tumble, zoom, or an edit to the parts re-projects every placement; each keeps its prior-valid spot when that spot is still valid, and only the ones that fail a check are repositioned, minimal movement.


These events do NOT reposition any dimension — they keep the prior valid list, so every placement stays exactly where it is:

- **Hover** — only adds or removes the hovered part's own dimensions and the highlight.
- **Selection** — only adds or removes the selected part's own dimensions.
- **The dimension-count slider** — every valid placement is already computed regardless of N; moving N only re-determines which of them draw (the largest N plus always-eligible), so dimensions do not move.
- **The dimensions on/off flag** — retains the prior valid list; turning dimensions back on shows them where they were.
---

## 8. Render

### 8.1 Paint order

For every kept placement the renderer draws, in this paint order:

1. Parts
2. Witness lines
3. Dimension lines
4. Arrowheads
5. White label box and the dimension text inside it
6. Selection/drag dots

WITNESS LINES start 5 px past the part edge and end 10 px past the anchor. ARROWS sit at each anchor; per-side flip and label slide decide whether they point inward or outward (see 8.2).

### 8.2 Label geometry relative to the witness anchors

The label position determines whether the label sits in the witness INTERIOR (between the two witness anchors), in the witness EXTERIOR (past one of them), or straddles both witness anchors. The render geometry follows from the position.

OVERHANG (label sits past one witness anchor): set during the search if the label rectangle at the witness-interior midpoint would fully cover EITHER arrowhead — both the arrowhead's point (at the witness anchor) AND the arrowhead's base. The label position is shifted past that witness anchor by (half-label-width + 2 + outside-extension overhang + arrowhead size). The search uses this shifted position; the renderer reads the same shifted position.

PER-SIDE EXTERIOR (only when there is no overhang): each side decides on its own whether to draw the witness exterior on that side. If the witness anchor's signed distance from the label edge along the dim line direction is less than (half-label-width + 2 + arrowhead size), that side draws as witness exterior and its arrowhead points outward. The two sides decide independently.

DIM LINE SEGMENTS:

| Case                                          | Segments                                                                                  |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| OVERHANG                                      | outside-extension overhang past each witness anchor + connector from the overhung witness anchor's overhang outer end to the label's near edge. |
| BOTH SIDES IN THE WITNESS INTERIOR            | one straight line, witness anchor to witness anchor.                                       |
| ONE SIDE IN WITNESS INTERIOR, ONE SIDE OUT    | half-line from the interior witness anchor to the label's near edge on that side, plus outside-extension overhang past the exterior witness anchor. |
| BOTH SIDES IN THE WITNESS EXTERIOR            | two outside-extension overhangs, one past each witness anchor; label sits between with no line through it. |

### 8.3 Hit-testing

Each rendered label registers a clickable rectangle (axis, owning part, screen position, size, witness index). Hover and click-to-edit consume this list.

## 9. Diagnostic log

Every render builds one log block. The block has, in order:

1. One line per part-axis: whether the placement algorithm picked it (and, for a uniface label position, at which witness index), or whether it was dropped.
2. The summary line: total dimensions considered, how many had at least one viable label position, how many were picked.
3. Filter-rejection histogram: count per filter.
4. Per-side detail (only when one part is hovered): for each label position side, the score components if it passed, or "no passing label position (N tried, mostly rejected by FILTER)" with a sample failing label rectangle and a plain-English "why" line.

REPEAT SUPPRESSION: if the block matches the last render's block exactly, no log is emitted (mouse-move-only renders stay quiet). Otherwise the block is written to the browser console AND sent by POST to the local dispatcher at `localhost:5171/log-dimensionals`, which writes it to `logs/dimensionals.log`. The first POST per browser session adds `?fresh=1` to overwrite the file; subsequent POSTs append.

---

## 10. Constants

Each constant lives inline where it is used; this chapter indexes where. The render constants (10.4) have no inline home, so they live here.

### 10.1 Outer edge constants

Inline in 3.3: outer edge canvas inset, outer edge witness-line spacing minimum.

### 10.2 Geometry constants

Inline: witness-index cap and silhouette margin in 3.2; front-face and back-face exclusion angles in 2.2.

### 10.3 Filter-chain constants

Inline: edge-on dot threshold in 5.1; witness-line convergence in 5.2; pair clearance and anchor-zone half-width in 5.3; label-position samples in chapter 2.

### 10.4 Render constants

- Witness gap from part edge: **5 px**
- Witness overhang past anchor: **10 px**
- Outside extension overhang: **20 px**
- Label-box padding: **±2 px** in x, **±1 px** in y
- Label height: **14 px**
- Label font: **12 px sans-serif**
- Arrow size: **6 px**

---
