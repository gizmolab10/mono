<!-- markdownlint-disable MD060 -->

# Dimensions placement spec

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
   scoring  /  last-resort fall-back    (chapter 5)
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

A part feeds the search when ALL hold:

- 2.1.1 It is currently visible.
- 2.1.2 Dimensions flag is true OR the part is selected.
- 2.1.3 No ancestor is set to hide its children.
- 2.1.4 It has a parent (the root smart object is excluded — it is the scene container, not a real part). Parents with visible children ARE eligible.
- 2.1.5 The repeater filter does not drop it (see 2.3).

### 2.2 X-ray mode

When the OPTION key is held AND at least one part in the scene is hidden, the visibility test flips — only HIDDEN parts are eligible. With no hidden part, OPTION is a no-op.

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

When zero parts qualify (heavy zoom), the box collapses to a single point at the origin and the silhouette-clearance filter (chapter 4) becomes a no-op; everything that fails the search falls through to the last-resort step (chapter 5).

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

### 3.3 Face exclusion

A face is excluded from EVERY witness-index level when its outward normal points:

- within 20 degrees of straight AT the camera, OR
- within 45 degrees of straight AWAY from the camera.

Camera direction is expressed in the room's static frame.

### 3.4 Per-axis candidate faces

The four candidate faces for each measured axis are the faces whose outward normal is perpendicular to that axis:

| Axis (label)     | Candidate faces             |
| ---------------- | --------------------------- |
| x  (width)       | FRONT, BACK, TOP, BOTTOM    |
| y  (depth)       | LEFT, RIGHT, TOP, BOTTOM    |
| z  (height)      | LEFT, RIGHT, FRONT, BACK    |

### 3.5 Off-Canvas exclusion

Every mark of every dimensional MUST be inside the canvas. Any candidate placement with a mark outside is NOT viable -> dropped.

### 3.6 Geometry constants

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

Every combination is a CANDIDATE. The candidate goes through a chain of filters. A candidate that passes every filter is VIABLE. A part-axis that produces at least one viable candidate goes on to scoring (chapter 5). A part-axis with zero viable candidates goes to the last-resort step.

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

Each (edge, face, witness-index) combination tries five label positions along the dim line, in this order: 50%, 30%, 70%, 15%, 85%. The first viable one is recorded (the score chooses across all surviving positions, not just the first viable one).

### 4.6 Vote (informational only)

Before the main chain runs, a pre-scan visits every candidate IN ISOLATION (no other-part interference) and counts which (direction, witness-index) cells are viable for how many part-axes. The top TWO witness-indices per direction are the "winners". The vote is recorded in the log; it does NOT restrict the main search. Every candidate at every witness-index is considered.

### 4.7 Filter-chain constants

- Witness-line convergence minimum: **15 px**
- Edge-on dot threshold: **0.174** (~10° off edge-on)
- Pair clearance (label vs label / anchor / dim / own-anchor / own-dim): **5 px**
- Anchor-zone half-width: **20 px**
- Label-position samples: **5** at 50%, 30%, 70%, 15%, 85%

---

## 5. Scoring and last-resort

### 5.1 Scoring

For a part-axis with at least one viable candidate, every viable candidate gets a score; the highest wins.

```text
S = (L - W) - α·u² - β·(W₁ + W₂)/2 - γ·(I₁ + I₂)/2 + ε·R
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
| α      | centering-penalty cap                                                            | 20    |
| β      | witness-length weight per px                                                     | 1     |
| γ      | inside-silhouette weight per percent                                             | 200   |
| ε      | screen-room weight per px                                                        | 2     |

The empty-canvas-room term (ε·R) is what gives the search its bias for directions with more empty space outside the silhouette; the witness-length penalty (β) holds short witnesses still attractive when the room is similar; the inside-silhouette penalty (γ) protects against witness lines drawn over the building.

### 5.2 Last-resort fall-back

A part-axis with ZERO viable candidates runs a separate step. It IGNORES the silhouette and uniface boxes.

EIGHT candidates per axis: four edges of the part along the measured axis, paired with two outward perpendicular directions per edge (the two non-measured local axes pointing away from the part).

For each candidate, a binary search finds the shift along the witness (perpendicular) line such that: after the part's world matrix plus tumble plus projection are applied, the entire dimensional (all its marks are within the canvas, AND at least one sits 10 px inside the nearest canvas edge. Choose the perpendicular that makes the wit lines shortest.

Candidates whose two projected witness lines run closer than 15 px apart are dropped (same threshold as the normal search).

The winner is picked in this order:

1. PRIMARY — the candidate whose outward direction is most perpendicular to the camera view (in the plane of the part face being measured). Directions that point straight toward or away from the camera lose to directions that lie sideways across the view.
2. TIEBREAKER — among candidates with the same camera-perpendicularness, the SHORTEST projected witness length wins.

If no candidate clears every check, the part-axis has no viable candidates.

### 5.3 Scoring and last-resort constants

- Centering-penalty cap: **20**
- Witness-length weight per pixel: **1**
- Inside-silhouette weight per percent: **200**
- Screen-room weight per pixel: **2**
- Last-resort canvas inset: **10 px** on every side
- Last-resort witness-line spacing minimum: **15 px**

---

## 6. Persistence between renders

The pipeline's output (the placements) is remembered for one render. On the next render, before the filter chain runs, a SKIP CHECK decides whether everything can be reused.

### 6.1 Skip check

Each persisted placement records: the chosen edge, face, witness-index, and label position. On the next render, the placement is re-projected and three viability checks run:

- The previous label position is within (new range start − 5 px) to (new range end + 5 px).
- The label rectangle still clears every other persisted label rectangle by 5 px.
- The label rectangle does not cross inside the new silhouette polygon.

If EVERY persisted placement passes ALL three, the filter chain is skipped and the persisted placements are reused for this render.

(A fourth check used to gate this path — "the previous witness index is still on the post-vote winners list" — but the main search no longer restricts to the winners list, so that check would only ever bail the skip path falsely. It was removed.)

### 6.2 Seeded run (when the skip fails)

If any persisted placement fails any check, the filter chain runs from scratch BUT seeded: any persisted placement that passes STRICT (no-tolerance) versions of the same three checks is LOCKED and contributes its rectangle, witnesses, dim line, and anchors as fixed obstacles for the rest of the chain. Only placements that failed get re-placed.

### 6.3 Drift safety

If two consecutive renders skip the chain because a check passed ONLY by the 5-pixel tolerance, the next render forces a full chain run regardless of the persisted state.

### 6.4 Persistence constants

- Skip-check tolerance: **5 px**
- Drift-safety threshold: **2** consecutive tolerance-only skips

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

### 7.2 Label slide and per-side flip

LABEL SLIDE (one-shot before position filters): if the label rectangle at the natural midpoint would fully cover EITHER arrowhead's anchor AND its base, the label is slid past that anchor by (half-label-width + 2 + 20 + arrow-length). Position filters see the slid position; the renderer reads the same slid position later.

PER-SIDE FLIP (independent for each anchor): when the label is NOT slid, each side decides on its own. If the anchor's signed distance from the label edge along the dim direction is less than (half-label-width + 2 + arrow-length), that side flips to draw the OUTSIDE extension and an outward-pointing arrow. The two sides may flip independently.

DIM LINE SEGMENTS:

| Case                          | Segments                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| SLID                          | 20 px overhang past each anchor + connector from the slid-past anchor's overhang outer end to the label's near edge. |
| BOTH SIDES INSIDE             | one straight line, anchor to anchor.                                                       |
| ONE SIDE INSIDE, ONE OUTSIDE  | half-line from the inside anchor to the label's near edge on that side, plus 20 px overhang past the outside anchor. |
| BOTH SIDES OUTSIDE            | two 20 px overhangs, one past each anchor; label sits between with no line through it.      |

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

1. The vote summary: per direction, the count of part-axes that found each witness-index viable, and the two winning witness-indices.
2. One line per part-axis: whether the normal search picked it (and at which witness index), whether it fell to the last-resort step, or whether it was dropped.
3. The summary line: total dimensions considered, how many had at least one viable candidate, how many were picked.
4. Filter-rejection histogram: count per filter.
5. Per-side detail (only when one part is hovered): for each candidate side, the score components if it passed, or "no passing candidate (N tried, mostly rejected by FILTER)" with a sample failing label rectangle and a plain-English "why" line.

REPEAT SUPPRESSION: if the block matches the last render's block exactly, no log is emitted (mouse-move-only renders stay quiet). Otherwise the block is written to the browser console AND sent by POST to the local dispatcher at `localhost:5171/log-dimensionals`, which writes it to `logs/dimensionals.log`. The first POST per browser session adds `?fresh=1` to overwrite the file; subsequent POSTs append.

---

## Changelog (this session)

- Witness-index cap raised from 4 to 6.
- Eligible parts now include parents (formerly leaves only); the root is excluded.
- Walk order now depth-from-root then name alphabetical (formerly name only); a parent wins duplicate-text over its child.
- Search no longer breaks at the first winning witness-index; every (edge, face, witness-index, label-position) candidate is considered and the best score wins.
- Vote no longer restricts the main search; it is now informational only. The persistence skip path lost its corresponding winners-list check for the same reason.
- Scoring: the world-distance penalty (weight 100 per world unit) was removed. A screen-room reward (weight 2 per pixel) was added.
- Last-resort fall-back replaces the silent null-face drop; eight candidates per axis, binary search on millimetre shift, fits inside the canvas with 10 px clearance, drops candidates whose witness lines run under 15 px apart.
