<!-- markdownlint-disable MD060 -->

# Dimensions placement latest spec

This spec describes what the dimensions code does every time the canvas redraws. The spine is the per-render data pipeline. Each chapter is one stage of that pipeline; chapter one shows the whole flow, chapters two through seven walk it stage by stage, chapter eight covers the log.

Source root: `di/src/lib/ts/render/Dimension_Placement.ts` and `di/src/lib/ts/render/Dimension_Renderer.ts`.

---

## 1. Pipeline

Every render runs this flow, top to bottom:

```text
   scene parts
       |
       v
   eligible parts                       (chapter 2)
       |
       v
   silhouette box  +  uniface boxes     (chapter 3)
       |
       v
   filter chain: each part-axis         (chapter 4)
       |
       v
   scoring                              (chapter 5)
       |
       v
   placements
       |
       v
   render                               (chapter 7)
```

Persistence (chapter 6) wraps the whole pipeline: when the scene is stable, the placements from last render are reused and the chain in the middle is skipped.

The diagnostic log (chapter 8) writes one block per render summarising what happened.

---

## 2. Eligible parts

### 2.1 Eligibility

A part feeds the placement when ALL hold:

- 2.1.1 It is currently visible, and NOT hidden by the near-occluder peel (zoom cluster C). A peeled part gets no dimensionals. *(PENDING — peel not yet built.)*
- 2.1.2 It passes the count gate (2.1.6): the part is among the dimensionals the count slider shows, OR the part is selected, OR the part is hovered. *(PENDING — replaces the old dimensions on/off flag, which stays the current behavior until the slider is built.)*
- 2.1.3 No ancestor is set to hide its children.
- 2.1.4 It has a parent (the root smart object is excluded — it is the scene container, not a real part). Parents with visible children ARE eligible.
- 2.1.5 The repeater filter does not drop it (see 2.3).

#### 2.1.6 The count gate *(PENDING — not yet built)*

A control sets how many dimensionals show: a whole number from 0 to 100, default 2, persisted across reload. It replaces the old on/off flag. The control is a slider just to the right of the names/angles segmented control; it moves continuously with tick marks every 10, and its setting is rounded to the whole count shown.

- Candidates are every allowed axis of every part where at least one is within the frustum (leaf or parent, NOT root); each part offers up to three (width, depth, height).
- Order the candidates biggest-first (step 3h) and keep that many; the rest drop.
- 0 shows none.
- The selected part is ALWAYS shown in full whenever it is fully within the frustum, regardless of the number.
- A hovered part ALWAYS shows its own, even at 0.

"at least one is within the frustum" = any of the eight of a part's box corners project inside the canvas and in front of the camera. Which parts qualify shifts as you zoom, and differs between the flat scale and the dolly (zoom cluster A and B).

### 2.2 X-ray mode

When the OPTION key is held AND at least one part in the scene is hidden, the visibility test flips — only HIDDEN parts are eligible. With no hidden part, OPTION is a no-op.

X-ray and the near-occluder peel are independent: x-ray flips which parts are visible by the OPTION rule above; the peel hides near parts by depth as you zoom in. The peel never hides the selected or hovered part. *(PENDING — peel not yet built.)*

### 2.3 Repeater filter

| Part is...                                            | Eligible? | Axes              |
| ----------------------------------------------------- | --------- | ----------------- |
| No parent, or parent is not a repeater                | yes       | x, y, z           |
| First child of a repeater (the "template")            | yes       | x, y, z           |
| Non-template child of a non-firewall repeater (clone) | no        | —                 |
| Inside a firewall repeater, matches template length   | no (clone)| —                 |
| Inside a firewall repeater, first/last fireblock      | yes       | repeat axis only  |
| Inside a firewall repeater, middle fireblock          | no (clone)| —                 |

### 2.4 Walk order

Eligible parts are walked by depth from the root (shallow first), then by name alphabetical at each depth. The duplicate-text drop (chapter 4) walks parts in this order and keeps the first claimant of each (text, axis) pair — so a parent wins over its child when their dim text agrees.

---

## 3. Geometry

### 3.1 Silhouette box

A world-axis-aligned box. Its corners are every corner of every visible LEAF part whose eight corners ALL project inside the visible canvas after tumble plus projection. Container parts (parents with visible children) do not feed the silhouette. Parts partly off canvas are skipped. The box is computed in the room's STATIC (untumbled) frame, so it stays glued to the parts and tumbles with the view.

When zero parts qualify (heavy zoom), the box collapses to a single point at the origin and the silhouette-clearance filter (chapter 4) becomes a no-op.

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

Each box has six faces (LEFT, RIGHT, FRONT, BACK, TOP, BOTTOM). Per face, the millimetre shift is computed once by projecting the face centre and one world-unit-along-the-outward-normal, then scaling.

### 3.3 Outer edge candidates

Besides the uniface candidates above, each part-axis also offers OUTER EDGE candidates. They are added to the same candidate set the placement algorithm traverses — filtered in chapter 4 and scored in chapter 5, alongside the uniface candidates. They are NOT a fall-back that runs only when nothing else is viable.

EIGHT per axis: four edges of the part along the measured axis, paired with two outward perpendicular directions per edge (the two non-measured local axes pointing away from the part).

For each, a binary search finds the SMALLEST shift along the witness (perpendicular) line such that, after the part's world matrix plus tumble plus projection are applied, every drawn mark of the dimensional sits at least 10 px inside its nearest canvas edge AND the label rectangle does not overlap the part's projected bounding box on screen. Smallest shift means shortest **tumbled and projected** witnesses.

Candidates whose two projected witness lines run closer than 15 px apart are dropped (same threshold as the uniface candidates).

These candidates carry no special winner rule: chapter 5 scores them the same way it scores the uniface candidates, so the best candidate overall — uniface or outer edge — wins.

### 3.4 Outer edge constants

- Outer edge canvas inset: **10 px** on every side
- Outer edge witness-line spacing minimum: **15 px**

### 3.5 Face exclusion

A face is excluded from EVERY witness-index level when its outward normal points:

- within 20 degrees of straight AT the camera, OR
- within 45 degrees of straight AWAY from the camera.

Camera direction is expressed in the room's static frame.

### 3.6 Per-axis candidate faces

The four candidate faces for each measured axis are the faces whose outward normal is perpendicular to that axis:

| Axis (label)     | Candidate faces             |
| ---------------- | --------------------------- |
| x  (width)       | FRONT, BACK, TOP, BOTTOM    |
| y  (depth)       | LEFT, RIGHT, TOP, BOTTOM    |
| z  (height)      | LEFT, RIGHT, FRONT, BACK    |

### 3.7 Off-Canvas exclusion

Every mark of every dimensional MUST be inside the canvas. Any candidate placement with a mark outside is NOT viable -> dropped.

### 3.8 Geometry constants

- Witness-index cap: **6** nested boxes
- Silhouette margin (per witness-index step): **15 px**
- Front-face exclusion angle: **20°**
- Back-face exclusion angle: **45°**

---

## 4. Filter chain: each part-axis -> any viable candidate?

For each eligible part, for each axis, the search picks ONE of each of four things at once:

1. which of the part's four parallel edges to anchor the witness lines from
2. which of the four candidate faces to lay the dim line in
3. which of the six nested uniface boxes to use (witness-index 1 to 6)
4. the label's position along the dim line.

Every combination is a CANDIDATE — and the outer edge candidates from §3.3 join this same set. Each candidate goes through a chain of filters. A candidate that passes every filter is VIABLE. A part-axis that produces at least one viable candidate goes on to scoring (chapter 5). A part-axis with zero viable candidates produces no dimensional on that axis.

The chain runs filters in three groups, cheapest first. The first failure stops the chain for that candidate.

### 4.1 Duplication filters (run once per part-axis)

| Filter            | What it checks                                                    | Threshold        |
| ----------------- | ----------------------------------------------------------------- | ---------------- |
| `duplicate-text`  | Another already-placed dim shows the same number text on this axis. | exact match    |

### 4.2 Shape filters (run once per edge / face / witness-index)

| Filter                    | What it checks                                                                 | Threshold                    |
| ------------------------- | ------------------------------------------------------------------------------ | ---------------------------- |
| `edge-on-plane`           | Dim's flat-plane normal is too close to perpendicular to the camera direction. | 0.174 dot (~10° off edge-on) |
| `witness-overlaps-placed` | A witness line runs too close to an already-placed witness line on screen.     | 5px                          |
| `own-witness-convergence` | The two witness lines for THIS candidate run too close on screen.              | 15 px                        |

### 4.3 Witness length filters (run once per label position)

| Filter                   | What it checks                                                                 | Threshold                                               |
| ------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `silhouette`             | Label rectangle crosses INSIDE the silhouette polygon.                         | 0 px (touching from outside allowed; crossing rejected) |
| `label-vs-label`         | Label rectangle clears every already-placed label rectangle.                   | 5 px                                                    |
| `label-vs-placed-anchor` | Label rectangle clears every already-placed witness anchor.                    | 5 px                                                    |
| `label-vs-placed-dim`    | Label rectangle clears every already-placed dim line.                          | 5 px                                                    |
| `own-anchor-vs-placed`   | This candidate's own two anchors clear every already-placed label rectangle.   | 5 px                                                    |
| `own-dim-vs-placed`      | This candidate's own dim line clears every already-placed label rectangle.     | 5 px                                                    |
| `label-vs-anchor-zone`   | Label rectangle does not overlap a 20 px zone past any anchor (own or placed). | 20 px                                                   |

`label-vs-placed-witness` is documented in the dim-spec but currently DISABLED in code — the white label box covers any witness line passing behind it, so the visual case for the filter does not hold.

### 4.4 Slide-and-retry

When a position filter rejects (silhouette, label-vs-label, label-vs-placed-anchor, label-vs-placed-dim only), the search shifts the label by (the rejection's shortfall + 1 px) along the dim line — once in each direction — and re-runs the position filters on the shifted label. The first direction that passes wins. Shape filters and the own-anchor / own-dim / anchor-zone filters are NOT slide-eligible: sliding moves the label, not the witnesses or anchors, so those rejections cannot be helped that way.

### 4.5 Canonical label positions

Each (edge, face, witness-index) combination tries five label positions along the dim line: 50%, 30%, 70%, 15%, 85%. EVERY position that passes the filter chain is scored; the highest score wins. The five fixed positions are the search's sample set — they are not ranked or short-circuited.

### 4.6 Filter-chain constants

- Witness-line convergence minimum: **15 px**
- Edge-on dot threshold: **0.174** (~10° off edge-on)
- Pair clearance (label vs label / anchor / dim / own-anchor / own-dim): **5 px**
- Anchor-zone half-width: **20 px**
- Label-position samples: **5** at 50%, 30%, 70%, 15%, 85%

---

## 5. Scoring

For a part-axis with at least one viable candidate, every viable candidate gets a score; the highest wins.

```text
S = (L - W) - α·u² - β·(W₁ + W₂)/2 - γ·(I₁ + I₂)/2 + ε·R - ζ·max(0, n_camera · n_out) + η·(1 − |n_front · n_out|)·max(0, −n_camera · n_front)
```

| Symbol | Meaning                                                                          | Value |
| ------ | -------------------------------------------------------------------------------- | ----- |
| S      | candidate's score; higher wins                                                   |       |
| L      | dim line length on screen (px)                                                   |       |
| W      | label width on screen (px)                                                       |       |
| t      | label's sampled position along the dim line, 0 at anchor 1 to 1 at anchor 2      |       |
| u      | off-center fraction `\|t − 0.5\| / 0.5`                                          |       |
| W₁, W₂ | screen lengths of the two witness lines (px)                                     |       |
| I₁, I₂ | percent of each witness line inside the silhouette polygon, sampled 11 times     | 0–100 |
| R      | screen-pixel distance from anchor midpoint to canvas edge along the outward perpendicular; clamped to zero from below | px |
| n_camera | camera-forward direction in static-world coords (points from camera into the scene) | unit  |
| n_out    | outward direction of this candidate's silhouette-box face in static-world coords | unit  |
| α      | centering-penalty cap                                                            | 20    |
| β      | witness-length weight per px                                                     | 3     |
| γ      | inside-silhouette weight per percent                                             | 200   |
| ε      | screen-room weight per px                                                        | 1     |
| n_front  | part's front-most face normal in static-world coords (the face most aligned with the camera) | unit  |
| ζ      | camera-side penalty weight                                                       | 50000 |
| η      | lies-flat reward weight                                                          | 500   |

The camera-side term (ζ·max(0, n_camera · n_out)) penalises candidates whose outward direction points AWAY from the camera — the label would sit on the back side of the part, behind it. A candidate whose outward direction points toward the camera pays zero. Weight fifty thousand outranks the empty-canvas reward by enough that no plausible amount of open canvas can rescue a back-side candidate when any front-side candidate is viable.

The lies-flat term (η·(1 − |n_front · n_out|)·max(0, −n_camera · n_front)) rewards candidates whose outward direction lies in the plane of the part's front-most face. The reward also scales with how strongly that face points toward the camera — a face perpendicular to the view earns nothing; a face pointing straight at the camera earns full weight. The reward favours in-plane choices in lightly congested areas without overriding the camera-side rule or witness-length term.

The empty-canvas-room term (ε·R) is what gives the search its bias for directions with more empty space outside the silhouette; the witness-length penalty (β) holds short witnesses still attractive when the room is similar; the inside-silhouette penalty (γ) protects against witness lines drawn over the building.

## 6. Persistence between renders

The pipeline's output (the placements) is remembered for one render. On the next render, every persisted placement is re-projected and viability-checked. The ones that still fit are LOCKED and contribute their geometry as fixed obstacles to the filter chain; the ones that fail get re-placed by the main loop. There is no separate "skip everything if nothing changed" short-circuit — the lock-and-re-place path runs every render.

Each persisted placement records: the chosen edge, face, witness-index, and label position. On the next render, the placement is re-projected and three viability checks run (STRICT, no tolerance):

- The previous label position is within [0, 1] along the new dim line range. (Slid placements are exempt — their saved fraction stays outside [0, 1] by design.)
- Pair clearance (label vs label): **5 px**. The label rectangle still clears every other previously-locked label rectangle by 5 px.
- The label rectangle does not cross inside the new silhouette polygon.

Plus: the off-canvas check from chapter 3 — every drawn mark of the dim must stay inside the canvas. If a persisted placement drifts past a canvas edge after tumble, it fails and gets re-placed.

A persisted placement that passes ALL checks is LOCKED. Its rectangle, witnesses, dim line, and anchors join the placed-obstacles set before the main loop runs. The free placements (failed checks, or part-axes that never had a winner last render) search around the locked ones.

---

## 7. Render

### 7.1 Paint order

For every kept placement the renderer draws, in this paint order:

1. Witness lines (blue).
2. Dim line segments (blue).
3. Hover overlay — every line on a hovered or selected part repainted in red, plus the part's outline.
4. Arrowheads.
5. White label box and the dim text inside it.

WITNESS LINES start 5 px past the part edge and end 10 px past the anchor. ARROWS sit at each anchor; per-side flip and label slide decide whether they point inward or outward (see 7.2).

OFF-CANVAS DROP: if BOTH anchors of a placement sit outside the visible canvas, nothing draws for that placement. With at least one anchor on canvas, the whole geometry draws (canvas clipping handles the rest).

TOGGLE OFF + selection: the renderer draws only placements whose part is selected; placements for non-selected parts are skipped at this step (the placement search still ran for all parts).

### 7.2 Label position relative to the witness anchors

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

### 7.3 Hit-testing

Each rendered label registers a clickable rectangle (axis, owning part, screen position, size, witness index). Hover and click-to-edit consume this list.

### 7.4 Render constants

- Witness gap from part edge: **5 px**
- Witness overhang past anchor: **10 px**
- Outside extension overhang: **20 px**
- Label-box padding: **±2 px** in x, **±1 px** in y
- Label height: **14 px**
- Label font: **12 px sans-serif**
- Arrow size: **6 px**

---

## 8. Diagnostic log

Every render builds one log block. The block has, in order:

1. One line per part-axis: whether the placement algorithm picked it (and, for a uniface candidate, at which witness index), or whether it was dropped.
2. The summary line: total dimensions considered, how many had at least one viable candidate, how many were picked.
3. Filter-rejection histogram: count per filter.
4. Per-side detail (only when one part is hovered): for each candidate side, the score components if it passed, or "no passing candidate (N tried, mostly rejected by FILTER)" with a sample failing label rectangle and a plain-English "why" line.

REPEAT SUPPRESSION: if the block matches the last render's block exactly, no log is emitted (mouse-move-only renders stay quiet). Otherwise the block is written to the browser console AND sent by POST to the local dispatcher at `localhost:5171/log-dimensionals`, which writes it to `logs/dimensionals.log`. The first POST per browser session adds `?fresh=1` to overwrite the file; subsequent POSTs append.
