# Handoff

**Date:** 2026-06-18
**Work stream:** dim placement scoring + spec cleanup. Per-session detail in [work journal](di/notes/work/now/work%20journal.md).

## Current focus — paused mid-proposal

The dim placement score has grown a camera-side penalty, a lies-flat reward, and a flipped witness-length-vs-screen-room weighting. The last visual still parks the dim across the canvas from the wall (the lies-flat term rewards the OUTWARD direction, not the dim line POSITION). Jonathan asked for one more term: reward when the entire dimensional sits ON the plane of the part's front-most face.

That is geometrically impossible with the current silhouette box (it wraps the whole scene; the silhouette face is parallel to the wall but offset by the scene depth). Two choices were offered:

- ONE — graded reward by distance from the dim line to the part's front-face plane.
- TWO — measure the silhouette box per PART being measured (not per scene). Silhouette face IS the part's face, so on-plane is binary.

Jonathan paused to update tracking files before picking one. Next session: get the answer, implement, verify, then resume the scoring iteration.

## What changed this session

- **Camera-side penalty** added to normal-search score. Weight fifty thousand per unit of away-alignment. Front-side candidates always beat back-side ones when both exist.
- **Lies-flat reward** added. Weight five hundred, scaled by how strongly the part's front-most face points at the camera. Per-side detail shows it as `+ lies-flat N.N`.
- **Score weights flipped**: witness-length penalty raised from one to two per pixel, empty-canvas reward lowered from two to one. Shorter witnesses now win over more outward room when the two are comparable.
- **Persistence skip path retired.** The seeded run now handles every render — re-project all persisted entries, lock the ones that still pass strict viability checks, free-place the rest. Slice B and the drift counter are gone from spec and code. About two hundred forty lines of skip-check body deleted.
- **Vote (informational only) retired.** Spec section 4.6 deleted, code computation (one hundred fifty lines) deleted, summary line dropped. Was never gating anything.
- **Spec contradictions fixed.** Section 5.3 used to duplicate the scoring weights from 5.1 with stale values; that list now keeps only the canvas inset and witness-line spacing. Section 4.5 ("first viable position is recorded" vs "all surviving positions are scored") rewritten — only the second sentence remains.
- **Spec 7.2 translated to lexicon.** "Label slide" → OVERHANG. "Per-side flip" → PER-SIDE EXTERIOR. Witness interior / witness exterior used consistently in the dim-line segments table.
- **Per-side diagnostic richer.** The score breakdown now also shows the camera-side penalty and the lies-flat reward — easier to read why a candidate won.
- **Face axis labels** drawn on the selected part in red. Every front-facing face of the selected part shows its axis letter (x / y / z) at the face center, centered behind a small white box.
- **Hover eligibility** added to chapter 2 — a hovered part feeds the search even when the dim toggle is off. Persistence map clears when the hovered part changes.
- **Hit test extended** to dims that only draw because their part is selected (the test used to bail out entirely when the dim toggle was off).
- **Conciseness hook** added to precheck. Flags common verbose phrases and word counts past one hundred twenty (prose) or three hundred (with a list).

## Open notes

- The lies-flat term scales by `max(0, −n_camera · n_front)`. When the front-most face points sideways, the term collapses to zero — that is intentional, but worth eyeballing across scenes.
- The on-plane reward (next session's task) probably requires deciding between graded distance and per-part silhouette boxes. The per-part choice is the bigger structural change.
- The "label inside part box" reject in the last-resort step assumes one part box per dim. Multi-part dims would need a different check.

## Reference material

- [[open items]]
- [[di/notes/work/now/code.debt]]
- [[di/notes/work/now/work journal]]
- [[dimensions.latest.spec]]
- [[lexicon]]

## Proposal — code debt #1: step 3h (descending-millimetres traversal)

The first unchecked code-debt item is "read and implement open items line 111." That line is step 3h in `open items.md`: replace today's alphabetical-by-name part order with a queue ordered biggest-measurement-first — big measurements get first pick of each spot, small ones fit around them or drop. Marked mothballed.

Plan:

1. Read the current part-walk order (spec 2.4; the main loop in `Dimension_Placement.ts`).
2. Build a queue of (part, axis, mm size) for eligible pairs, biggest first. Equal-text pairs already drop before the queue via the duplicate-text rule.
3. Pop in order, run the existing placement algorithm, commit when a candidate survives.
4. Tests pin: order is biggest-first, the bigger label wins a contested spot, the queue empties cleanly.
5. Log the queue order and each pop's outcome.

Tension to resolve before coding: this item is mothballed; our process says simplify and perfect the flag-off case first, and bug 001 is still open. Decide whether to do step 3h now or defer it under bug 001.

## Paused — flag-off / simplify arc (2026-06-22)

The "simplify and perfect the flag-off case" work is parked, by decision in code-debt item 1. Resume from here:

- Bug 001 (`notes/work/now/bugs/001 dim is inside silho/`) is captured — screenshot, log, data — but not yet diagnosed.
- The open thread: the outline the placement guard tests a label against is the projected box-corner hull, which does NOT match the silhouette the eye sees; a label can read as inside the silhouette while the guard calls it outside. Every diagnosis tried so far was wrong against the visual.
- No code changed during the flag-off work; nothing to revert.
- With this parked, the active item becomes code-debt line 9 (step 3h).

## Proposal — code debt: dimensions count slider (default 2)

Code-debt lines 10–11: add a slider to controls (default 2) and remove the "dimensions" segment from the segmented control. The on/off toggle becomes a count — how many dimensionals show — and biggest-first (step 3h) decides which.

Settled with Jonathan:

- The slider is a COUNT — the number of dimensionals shown — 0–100, ticks every 10, default 2 (so two dimensionals by default). NOT a percent. It moves continuously (NO snapping); the shown count is its value rounded. It sits to the RIGHT of the names/angles segmented control.
- It shows that many of the candidate dimensionals, biggest-first (step 3h). Candidates = every allowed axis of every part fully within the frustum (leaf or parent, NOT root); each part offers up to three. 0 = none; a count at or above the pool size shows them all.
- The selected part is ALWAYS shown in full whenever it is fully inside the frustum, regardless of the count.
- No dimensions flag any more: the count replaces it; 0 is "off".
- The count is persisted across reload.

Plan:

1. Add a persisted preference holding the count (whole number 0–100, default 2).
2. Slider to the RIGHT of the names/angles segmented control, bound to it — 0–100, ticks every 10, continuous (NO snapping) — reusing `Slider.svelte`; add tick-drawing only if it lacks it. The shown count is the slider value rounded. Remove the "dimensions" segment (`Primary_Controls.svelte` line 65), leaving names and angles.
3. Placement: from the biggest-first work list (step 3h) over fully-in-frustum parts (leaf or parent, not root), keep the first N; always keep every entry of the selected part when it is fully in frustum; drop the rest. 0 shows none. Hover still shows a hovered part's own.
4. Migrate the three flag readers — the button (`Primary_Controls.svelte`), the store and its on/off bit (`Stores.ts`), and the placement eligibility (`Dimension_Placement.ts`) — to the count; delete the now-dead flag bit and toggle.
5. Tests: 0 shows none; a count at or above the pool shows all; a mid count shows that many, biggest-first; the selected fully-in-frustum part always shows; off-frustum parts excluded; the count persists; the slider draws ticks every 10 and its value rounds to a whole count. Log the count, the candidate total, how many shown, and whether the selected part was force-kept.

## Proposal — zoom cluster (dolly, flat/dolly toggle, near-occluder peel)

Three connected proposals about zoom. All still design — no code yet. Today zoom scales the model around the origin (a scale matrix on the root); the camera eye is fixed at 2750 mm.
Evidence: root scale matrix, Drag.ts 747–750; camera eye, Camera.ts line 8.

A. Dolly zoom — move the camera in and out instead of scaling the model.

- The model keeps true world size; the eye moves along its line of sight toward the center.
- Must clamp the near plane (10 mm) or near parts clip away. Evidence: Camera.ts near = 10.
- Migration: retire the stored scale amount; re-derive the default, the status read-out, saved views, and the new dimensions slider's frustum basis from eye distance.

B. Flat-or-dolly toggle — a persisted flag plus a control that switches between today's flat scale and the dolly.

- Default flat; dolly behind the flag. Define a flat-amount to eye-distance mapping so switching mid-scene does not jump the view.
- Cost: two zoom paths to keep and test, and one more control.

C. Near-occluder peel — as you zoom in, HIDE parts closer to the camera than a zoom-driven depth, so front layers peel away and inner parts show.

- Chosen flavor: blanket near-plane peel. Hide outright (not fade). Never peel the selected or hovered part.
- Depth = distance from the eye along the view axis to a part's nearest box corner; the peel depth ramps with zoom, tuned by a curve.
- Focus-targeted peel (hide only the true occluders of a focus part) is the fallback if the blanket peels the wrong things; the renderer already tracks occluding faces. Evidence: Render.ts line 27.
- Note: x-ray mode is the blunt always-on version. Evidence: solid/x-ray toggle, Primary_Controls.svelte line 72.

Order to build: A (dolly) first, then C (peel) which leans on the dolly's depth, then B (toggle) if both are wanted. Each needs tests and a log line of what it culled or moved.

## Proposal — parts hover and select while the lock is on

Goal: with the edit lock on, you can still point at a part and see it light up, and click to select it. Only changing the model stays locked — no dragging, resizing, or dimension edits. Today the lock turns all three off together; this splits "looking and picking" from "changing".

Today's three blocks (all keyed on the lock):
- Mouse-move forces the hover to nothing, so no part lights up. Evidence: Events_3D.ts 73–77.
- Press-down clears any target and allows only tumble, so no part is picked. Evidence: Events_3D.ts 124–129.
- The click-a-part-to-select fallback is skipped. Evidence: Hits.ts line 72.

Change:
1. Hover while locked: run the same part hit test and light up the part under the cursor (its face), but keep the cursor as the tumble hand and do NOT light up the edit-only affordances (no dimension bolding, no text cursor). Evidence to edit: Events_3D.ts 73–77.
2. Pick while locked: a plain click (press and release with no movement) selects the part under the cursor; a press-and-move still tumbles. Since a press can't know yet whether it will become a drag, decide on release: in the release handler, when nothing moved, hit-test the click point — a part lights the selection, the background clears it (the same select/deselect the editing path already does on press/release). Evidence to edit: release handler Events_3D.ts 191–203 (drop the lock condition on the deselect branch and add the locked-click select); press-only-tumble stays at 124–129.
3. Reconcile the two input paths: selection also has a 2D-system fallback that is gated the same way (Hits.ts line 72). Pick ONE path to own locked selection so a click does not select twice. Recommend the 3D release handler owns it; leave Hits.ts line 72 gated, or open it and remove the release-handler branch — decide at build by tracing which fires for a canvas click.

Stays locked: dragging or resizing a part, editing a dimension or face label, the resize handles. Only hover-light and click-select open up.

Tests: with the lock on — hovering a part sets the part-hover highlight and leaves the dimension-hover empty; a no-move click on a part selects it; a click on the background clears to root then to none; a press-and-drag tumbles and selects nothing; dragging a part does not move it; a dimension click does not start an edit. Log, on each locked canvas release: did-move yes/no, the hit kind under the point, and the resulting selection.

Built. With the lock on: hovering lights up the part under the cursor; a no-move click selects that part; a click on a part's dimensional selects the part that owns it (the hit-to-face map resolves any measurement to its owner's face); a background click clears to root then none; a press-and-drag tumbles and selects nothing. Dragging, resizing, and dimension/label edits stay locked. The 2D-system fallback stays gated so a click can't select twice; the 3D release handler owns locked picking. Each locked release logs did-move, the hit kind, and the resulting selection. Vocabulary settled: "part" = SO, "subpart" = corner/edge/face/dimensional (lexicon updated). Evidence: Events_3D.ts (locked hover in the mouse-move branch, locked pick in the release handler).

## Proposal — COMMAND-C copies the hovered thing's full name

Goal: with the cursor over a part or a dimensional, COMMAND-C puts its full dotted name on the system clipboard. A part copies its root-to-part name; a dimensional copies that plus the side word — width, depth, or height.

What's already here:
- A name builder exists but is buried as a private helper in the debug module: it walks parents, drops the root, and joins with dots ("kitchen.wall.stud"). Evidence: Debug.ts 53–61.
- The hover signals carry what we need: the hovered part (a face hit, which holds its smart object) and the hovered dimensional (its smart object plus its direction x/y/z). Evidence: Hits_3D.ts 37–49.
- Side word from direction: x → width, y → depth, z → height. Evidence: the placement reads so.width / so.depth / so.height by axis, Dimension_Placement.ts ~2572.
- No clipboard code exists yet; this adds the first use of the browser clipboard.

Change:
1. Lift the name builder out of the debug module into a shared spot so there is one source of truth, and let the debug code call it. For any part below the root it returns the root-to-part dotted name with the implicit root left off (as today). For the root itself it returns the root's own name (decided).
2. Add a window key listener for COMMAND-C. It acts ONLY when the cursor is over a canvas part or dimensional AND focus is not in a text field and no page text is selected — so normal copy still works everywhere else. When it acts: build the name, write it to the clipboard, and swallow the browser's own copy.
3. Name to copy: a hovered dimensional wins — its name is the part name plus a dot plus the side word. Otherwise a hovered part copies its name alone.
4. Log on each COMMAND-C: what was under the cursor (part or dimensional, with the smart object name and side), the exact text copied, or why it was skipped (focus in a field, nothing hovered).

Stays out of scope: OPTION-C copying the value/label is a separate open item; this is only the name on COMMAND-C. Use a different modifier so they never clash.

Decided: hovering the root copies the root's own name (its descendants still drop the implicit root).

Open questions for build:
- Where the key listener mounts and unmounts (alongside the canvas mouse listeners, or a top-level component).
- Clipboard in a non-secure or file context can be missing; on failure, log and do nothing (no fallback unless wanted).

Tests (pure name builder): a part directly under root copies just its name; a nested part joins ancestors with dots and omits root; a dimensional appends width/depth/height for x/y/z; the root copies its own name.

Built. New shared name builder in common/Names: the root-to-part dotted name (root's name implicit for parts below it, its own name when the root itself is the target), the measurement word per direction (x width, y depth, z height), and the dimensional name (owner plus measurement). The debug name code now calls the same builder, so there is one source of truth. A window key listener catches COMMAND-C while the cursor is over the drawing: a dimensional under the cursor wins and puts "owner.measurement" on the clipboard, otherwise a part puts its full name; it steps aside when a text field is focused or page text is selected, and works whether or not the edit lock is on. Each press logs what was under the cursor and the exact text put, or why it was skipped. Tests: common/Names covered (root, under-root, deeper, the three measurements, dimensional, dimensional-on-root) — 6 pass. svelte-check clean. Evidence: Names.ts, Events_3D.ts (key listener and cursor tracking), Debug.ts (now calls the shared builder), Names.test.ts.

## Proposal — highlight the part and its other dimensionals while one is being edited

Goal (code-debt line 8): while a dimensional is being edited, also light up the part it belongs to and that part's other dimensionals — the same red-and-outline look a hovered part already gets.

What's already here:
- The dimension renderer builds one set of "parts to light up" from the selection plus the hovered part, then outlines each such part and re-strokes every one of its dimensionals in red — and it draws a lit part's dimensionals even when the dimension toggle is off. Evidence: Dimension_Renderer.ts 83–89 (the set) and 133–142 (the highlight pass).
- The editor knows which part and side are being edited while editing is underway. Evidence: the dimension editor's state holds the part and the side, Dimension.ts 19–21 and 45–52.

Change (small):
1. Add the part being edited to that "parts to light up" set. One line: read the editor's current part and, if editing is underway, add its id to the set next to the hovered-part id (Dimension_Renderer.ts ~88–89).
2. That single addition gives both halves of the item at once: the part gets outlined (its SO lit), and every one of its dimensionals — the one being edited and the others — turns red, even with the dimension toggle off.

Wiring note: the renderer does not import the dimension editor yet (it imports selection, hover, stores — Dimension_Renderer.ts 4–7). Adding that import is the only new dependency; check it does not form an import cycle (the editor leans on the render module for its hit rectangles). If a cycle shows up, pass the editing part's id in from the caller instead of importing the editor here.

Tests / check: this is a visual change — needs Jonathan's eye (start editing a dimensional; its part outlines and all its dimensionals go red, dimension toggle on or off). If a pure test is wanted, pull the set-building three lines into a small helper that takes the selection ids, the hovered id, and the editing id and returns the set, then test that the editing id is included.

Open question for build: when editing ends, the highlight should drop on its own because the editor's state goes empty — confirm nothing latches it on.

Built. The dimension renderer now adds the part being edited to its parts-to-light-up set, alongside selection and hover. One addition: while a dimensional is under edit, its part outlines and every one of its dimensionals — the edited one and the others — turns red, even with the dimension toggle off. The highlight drops on its own when editing ends, because the set is rebuilt each render from the editor's state, which goes empty. No import cycle (svelte-check clean). A gated diagnostic line names the part and side under edit while editing. Tests: the dimension suite still passes (120). Evidence: Dimension_Renderer.ts (editor import, the editing-part addition to the highlight set).
