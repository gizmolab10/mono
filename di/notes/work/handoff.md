# Simpler Topology

**Next:** Visual testing confirmed — pierce-point labels now appear. All 42 tests passing, svelte-check clean. `use_simple_topology` is `true`. Design spec: [simpler design.md](facets/designs/simpler%20design.md).

### Solved: missing labels at pierce points

Pierce-point endpoints had two segments (edge + intersection line) but didn't get labels because there were TWO endpoints at each point — an oc and an fi — with different keys. Each had only one segment connected (dead-end = no label).

**Fix:** Topological key matching. In Pass 1b, when about to create an oc endpoint (edge X clipped by face Y), check the fi_on_edge lookup for an fi that ends at edge X and involves face Y. If found, reuse the fi key. No position matching, no registries — pure topology. Required swapping Pass 1a before Pass 1b so the fi lookup is available when edges are clipped.

**What we ruled out:** position matching (fragile thresholds), post-processing merge (unnecessary complexity), harvesting from clip data (wrong direction — behind vs in front), array-typed endpoints (unnecessary).

## Session plan

**Session 1: Pass 1 (visibility)** — DONE. Stub, edge clipping, fake sliver filter, intersection lines with skip-self. All Layer 2 tests pass.

**Session 2: Pass 2 (arrangement)** — DONE. Crossing detection (brute force with bounding box rejection), clip splitting, depth classification, occluding segments. All 42 tests pass.

**Session 3: Pass 3 (labeling) + wiring** — DONE. Labeling already happens during Pass 1 (corners, oc, fi) and Pass 2 (ex). Wired into Render.ts with `use_simple_topology` flag. Diff logging shows label for old vs simple. svelte-check clean.

### Autonomy guidance

- Session 2 is safe for full autonomous — it's pure geometry with clear tests.
- Sessions 1 and 3 touch domain-specific edge cases (depth checks, face-plane skipping, identity merging). Co should stop and ask rather than guess if a test fails in an unexpected way.

---

1. Clip everything for visibility — edges against faces, intersection lines against faces. Don't label anything, just collect the visible pieces.
2. Find all crossings between the visible pieces. Split both pieces at each crossing.
3. Now label everything — corners, intersections, crossings — based on where each piece came from.

## Implementation plan

New class in a new file (Topology_Simple.ts), same public interface as the current Topology. Render.ts switches between them with a flag so we can compare output side by side.

### Step 1: Visibility

Port the existing clipping math (edge-vs-face and intersection line computation) but strip out all identity matching, endpoint registration, and the three registries. Each visible clip just carries its source info — which SO, which edge or face pair, and the world coordinates of its endpoints.

### Step 2: Crossings

Brute-force all pairs of visible clips from different SOs. Use Flatbush to skip pairs with non-overlapping bounding boxes. At each crossing, record the screen position and split both clips. After all crossings are found, do all splits in one pass.

### Step 3: Labels

Walk the split segments and assign endpoint identities. Corners are where a segment starts or ends at a mesh vertex. Intersections are where the source is a face-face intersection line. Crossings are everything else. Build the output maps that Facets expects.

## Validation

Run both classes on the same frame. Diff the endpoint counts, segment counts, and facet results. The new class should produce the same or better output with zero identity-matching bugs.

## What gets deleted

The three registries, the endpoint tagging during clipping, the zero-length gap logic, the fi-only fallback filter, the previous-clip-end tracking, phantom filtering — all of it.

## Risk

The clipping math is tangled with the identity matching right now. Extracting just the clipping will take care — need to make sure the occlusion results are identical before adding the crossing and labeling steps.

## Test suite (Topology.test.ts)

Five layers, all in one file. Tests the current Topology class first — when the new class is built, these same tests validate it.

- **Layer 1: Pure 2D geometry** — line intersection, parametric t, polygon clipping. No 3D, no objects. Extracted as standalone functions.
- **Layer 2: Clipping** — single object (no occlusion), edge-behind-face (clipped), non-overlapping objects (no intersections), fake sliver filtering, intersection line skip-self occlusion. Uses the full Topology.compute() with a rotated orthographic projection.
- **Layer 3: Splitting** — split a segment at 0, 1, 3 points. Edge cases: splits at t≈0 or t≈1 ignored, unsorted input, duplicates.
- **Layer 4: Two-object scenes** — side-by-side, overlapping, one behind another, edge piercing through a face (crossings + splits), split continuity, occluding segment validity, three-object occlusion, symmetric edge counts. Structural checks: unique keys, all referenced endpoints exist.
- **Layer 5: Golden test** — overlapping ALPHA + BETA. Checks output completeness and consistency. Reports orphan endpoints for debugging.

Status: all 42 tests passing. Golden test reports 2 missing intersection endpoints (the known bug). vitest config updated with build-time defines. Pre-existing Constraints test failure is unrelated.

Also added to vitest.config.ts: `__ASSETS_DIR__`, `__BUILD_NUMBER__`, `__BUILD_NOTES__` defines so Topology's import chain works in test.

### Shallow

The layers are broad but shallow:

- **Layer 1** is solid — the pure math functions are well covered with edge cases.
- **Layer 2** is weak — it only checks that segments exist and are non-empty, not that the clipping is geometrically correct. Doesn't verify that a partially occluded edge has the right visible intervals.
- **Layer 3** is solid — splitting logic is simple and well tested.
- **Layer 4** checks structural integrity (keys exist, no duplicates) but doesn't verify geometric correctness. It doesn't check that the right edges are clipped at the right places.
- **Layer 5** is the weakest — it just checks that output isn't empty and reports missing endpoints. It doesn't compare against known-correct values.

### Deep enough

What's missing for thoroughness:

- Precise geometric assertions: "this edge should be visible from t=0.3 to t=0.7" rather than "this edge has some visible clips"
- Specific endpoint position checks: "the intersection point should be at screen position (x, y)"
- Hardcoded expected output for a known scene (the actual "golden" part of the golden test)
- Negative cases: "this endpoint should NOT exist" (phantom filtering)

#### postpone

Pros:

- The structural tests (keys exist, no orphans, segments non-empty) are enough to catch catastrophic breakage during the rewrite
- Once the new code exists, we can capture its output as the golden reference — no need to bake in the old code's bugs
- The rewrite simplifies the pipeline, making geometric assertions easier to write (fewer intermediate states to reason about)

Cons:

- During the rewrite, subtle geometric errors could slip through undetected
- We lose the chance to document exactly what the current code does before replacing it

### Critical behavior tests (added)

Two behaviors that a rewrite could easily break:

1. **Fake sliver filtering** — when an edge is hidden behind two adjacent faces of the same object, the seam between the faces shouldn't produce a phantom visible sliver. Test verifies no micro-gaps appear between consecutive clips on behind-object edges.

2. **Intersection line skip-self occlusion** — intersection lines between two overlapping objects should NOT be hidden by those same objects' faces, but SHOULD be hidden by a third object in front. Test runs with and without a blocker box and compares visible clip counts.

### Edge piercing tests (added)

Five tests that exercise edges physically passing through another object's face:

1. **Produces crossings and splits** — interpenetrating boxes should generate edge splits, occluding segments, and intersection segments.
2. **Split continuity** — when an edge is split, the sub-segments should tile without micro-gaps. Adjacent clips sharing a boundary should share the same endpoint key.
3. **Occluding segments connect existing endpoints** — both endpoints exist, are different, and the segment has nonzero length.
4. **Three-object occlusion** — middle box occluded from both sides, all endpoint references valid.
5. **Symmetric edge counts** — two identical boxes at mirror positions produce the same number of edges and clips.
