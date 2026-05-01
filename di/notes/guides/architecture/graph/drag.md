
## Edge/corner stretch — done

Stretching an edge or corner had three stacked bugs.

**Wrong edge picked near corners.** `test_edges` returned the first edge within proximity radius — index order won the tiebreak. Fixed: track minimum distance, return closest.

**Both edges flew apart.** Changing one bound shifts center by Δ/2. Through rotation, that center shift moves *every* vertex in world space. Opposite edge drifts. Fix: pin opposite-side vertex. Capture its world position at mousedown, recompute after bound change, adjust `scene.position` to cancel the drift. Drift goes through inverse parent world matrix — position lives in parent space, not world.

**Accumulation noise on a moving plane.** Old code used frame-to-frame deltas on a plane that shifted as bounds changed. Replaced with the stretch anchor pattern: freeze face geometry at mousedown, compute absolute offsets from snapshot every frame. Same pattern as face translation.

### Stretch anchor pattern

1. **Mousedown** — capture face plane geometry (e1/e2 world+local, plane point, normal, anchor world pos). Snapshot affected bounds + position + opposite vertex.
2. **Every frame** — intersect current mouse with the *fixed* plane. Absolute world delta from anchor. Decompose onto frozen e1/e2. Map to local via frozen e1_local/e2_local. Dot with axis vector(s) → absolute bound offset(s).
3. **Apply** — reset bounds and position to initial, apply offsets, compensate center-rotate-uncenter shift by pinning opposite vertex.

## Click-to-select — done

Two event systems both handled mousedown on the 3D canvas. `Events_3D` (canvas listener) used canvas-relative coords and selected the right face. Then the event bubbled to `Events.ts` (document listener) → `Hits.ts`, which re-ran `hit_test` with *page* coordinates — wrong coordinate space — and overwrote the selection with the root SO.

Fix in `Hits.ts`: the 3D fallback path now bails on mouseup (`!s_mouse.isDown`) and on mousedown if `Events_3D` already set a drag target (`drag.has_target`). Also moved `Events_3D` mouseup from `window` to `document` so both systems listen at the same level.
