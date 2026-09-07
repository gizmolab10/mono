# Milestone 26 — Snap & Pin

## Concept

While dragging an SO (constraining movement to a plane), when one edge comes close to the edge of another SO, snap it (bring the separation to zero). Then offer to pin the edges together with cross-referencing formulas.

## Tasks

- [ ] Phase 1: snap detection during face drag
- [ ] Phase 2: `attached` flag on Attribute + propagation logic
- [ ] Phase 3: pin-offer button near snapped edge
- [ ] resolve overlap
- [ ] dado/piercing -> slider?
- [ ] tests with library items:
    - [ ] pin stringer diagonal to the end points
    - [ ] location of the big beams in basement
    - [ ] cabinet carcasse

## Decision

Pin via cross-reference with `attached` flag

Both attributes get formulas pointing at each other. Both are marked `attached`. During deserialization, the first encountered keeps its value as seed; the second evaluates its formula (resolving to the first's value). During propagation, both use the formula.

No givens needed. No ownership. The relationship is direct and self-documenting.

## Proposal

### Phase 1: Snap during drag

**Where:** `Drag.apply_face_drag_absolute`

After computing new bounds from the delta, scan sibling SOs (children of same parent). For each axis on the drag plane, compare dragged SO's min/max against each sibling's min/max. If within snap threshold, clamp the bound to match. Store which bounds snapped and to which sibling.

### Phase 2: `attached` flag on Attribute

**Where:** `Attribute.ts`, `Constraints.ts`

Add `attached: boolean` to Attribute. Serialize/deserialize it. In `deserialize`, when encountering an attached attribute with a compiled formula: if it's the first attached attribute in the current pass, skip evaluation (keep value as seed). The second evaluates normally.

### Phase 3: Pin offer on drag end

**Where:** `Drag.ts`, `Graph.svelte`

After drag ends with a snap active, show a small button near the snapped edge. On accept:

1. Set formula on dragged SO's snapped attribute → references sibling's corresponding bound
2. Set formula on sibling's corresponding attribute → references dragged SO's bound
3. Mark both attributes as `attached`

On decline or ignore: snap position holds but no formula link.
