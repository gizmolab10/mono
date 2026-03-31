# Simpler Topology

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
- **Layer 2: Clipping** — single object (no occlusion), edge-behind-face (clipped), non-overlapping objects (no intersections). Uses the full Topology.compute() with a simple orthographic projection.
- **Layer 3: Splitting** — split a segment at 0, 1, 3 points. Edge cases: splits at t≈0 or t≈1 ignored, unsorted input, duplicates.
- **Layer 4: Two-object scenes** — side-by-side (no crossings), overlapping (intersection segments), one behind another (clipped edges). Structural checks: unique keys, all referenced endpoints exist.
- **Layer 5: Golden test** — overlapping ALPHA + BETA. Checks output completeness and consistency. Reports orphan endpoints for debugging.

Status: all 35 tests passing. Golden test reports 2 missing intersection endpoints (the known bug). vitest config updated with build-time defines. Pre-existing Constraints test failure is unrelated.

Also added to vitest.config.ts: `__ASSETS_DIR__`, `__BUILD_NUMBER__`, `__BUILD_NOTES__` defines so Topology's import chain works in test.
