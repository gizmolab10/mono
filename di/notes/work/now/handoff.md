# Handoff

**Date:** 2026-06-18
**Work stream:** dim placement scoring + spec cleanup. Per-session detail in [work journal](di/di%20notes/di%20work/now/work%20journal.md).

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
