# Render Pipeline Bottlenecks

Here are the performance bottlenecks I found in the render pipeline. I've ordered them by how much frame time I believe each one costs, worst first. Evidence lines are shown separately from the plain-English explanation.

---

## 1.  ✅ DONE A whole duplicate geometry pipeline runs every frame for a feature that is turned off

The new topology pipeline runs in full every single frame. Its output is stored in four fields that are read by exactly one consumer: the facets debug renderer. That renderer is gated behind a debug switch that is off because the facets feature is mothballed. So every frame, a 2000-line geometry engine runs, builds endpoints, edge segments, intersection segments, and occluding segments — and then all of that data is immediately thrown away.

This is very likely the single biggest win available. Nothing depends on it in normal use.

Evidence:

- The unconditional compute: [Render.ts:404-439](di/src/lib/ts/render/Render.ts#L404-L439)
- The only consumer, guarded by a debug flag: [Render.ts:447-481](di/src/lib/ts/render/Render.ts#L447-L481)
- The debug flag, labeled "mothballed": [Constants.ts:27](di/src/lib/ts/common/Constants.ts#L27)
- The second pipeline file itself: [Topology.ts](di/src/lib/ts/render/Topology.ts) — 2014 lines
- Recent commit history confirms facets was given up on

Proposal:

- ✅ Smallest safe step: wrap the entire second-pipeline compute block in the same debug switch that guards its only consumer. One `if` around the existing block. Zero new code. When the switch is off, the whole block is skipped. When the switch is on, everything still works exactly as today. **Done** — the compute block is now guarded by the same debug switch as the consumer. Change at [Render.ts:404-406](di/src/lib/ts/render/Render.ts#L404-L406). Tests pass and type-check is clean.
- ❌ Declined: deleting the second-pipeline file, the four storage fields on the renderer, the block that calls into it, and the consumer block. Jonathan wants the code kept around.

## 2.  ✅ DONE The whole scene is rerendered every animation frame whether or not anything changed

The animation loop used to call render every tick with no out-of-date flag. Idle time, hovering, or typing in a side panel all ran the full pipeline at roughly sixty times a second for nothing.

A canvas-out-of-date flag now sits on the renderer. It starts on, flips off at the start of each paint, and flips back on whenever any input that affects the canvas changes. The animation tick returns early whenever the flag is off and the orientation snap-back animation is not running.

Evidence (historical — before the fix):

- The loop hookup: [Engine.ts:134-138](di/src/lib/ts/render/Engine.ts#L134-L138)
- Render entry point: [Render.ts:188](di/src/lib/ts/render/Render.ts#L188)

### What shipped

Three layers of coverage, all done on 2026-04-15:

- **Twenty-six subscriptions at setup.** Fourteen scene inputs (selection, object list, tick pulse, forward-face tracker, editing mode, decorations, persisted orientation, 2D/3D mode, line thickness, grid opacity, show-grid, solid mode, precision, persisted scale), six color inputs (hover derivation, selected, background, text, edge, accent), and six interaction inputs (pointer hover, drag pin offer, face-label editor, angular editor, dimension editor, unit system). Each subscription flips the flag to "out of date" when its source changes. Every unsubscribe is held on the renderer so hot-module-reload drops them cleanly.
- **Three targeted marks for the paths that do not go through a reactive store.** The bound setter on every smart object, the top of the post-propagate hook, and the top of the resize method each mark the canvas out of date directly.
- **Wrapped writables for rot prevention.** A helper wraps a Svelte writable so every set and update also marks the canvas out of date. The fourteen canvas-affecting scene stores, the six color stores, and the six interaction stores were migrated to the helper. Any new canvas-affecting store declared through the helper gets coverage automatically.

### Decisions taken before the build

- **Rot prevention:** strongest of the three options. Every canvas-affecting store write funnels through the wrapped-writable helper.
- **Ship order:** three logical steps in one session — subscriptions and targeted marks first, then the early-return gate, then the writable migration.
- **Keystroke override:** skipped. The one-character rollback constant at the top of the renderer is enough.
- **Targeted marks:** shipped alongside the subscriptions, not as a follow-up. Without them the gate would have left three categories silently stale — window resize, direct bound writes during drag, and propagation-driven changes.

### Rollback lever

A single override constant at the top of the renderer forces the flag to always read "out of date" when flipped to true. Next reload picks it up — no commit, no redeploy.

### Residual risks

- Debug flag flips that are not wired through anything reactive do not mark the canvas.
- Any mutation site the audit missed will be silent. Tumble was verified on 2026-04-15 and passed; the remaining interaction types on the verify list still need walking through by eye.

Full session narrative: [handoff.md](./handoff.md).

## 3.  ✅ DONE The world transform for every object is rebuilt from scratch several times per frame

The function that builds an object's world transform used to be called from many places during one frame — projection, the solid-fill pass, the selection-occlusion pass, the root-scale extent pass, edge rendering, and the hidden-wireframe pass — each time building the same answer from scratch.

A per-frame memo now sits on the renderer, keyed by object identity. The first call in a frame computes and stores; every later call in the same frame returns the stored matrix. The memo is wiped at the top of the next frame so camera moves, rotations and drags are always fresh.

Evidence (historical — before the fix):

- The builder, allocating fresh matrices each call: [Render.ts:675-717](di/src/lib/ts/render/Render.ts#L675-L717)
- Repeated call sites in one frame: [Render.ts:204](di/src/lib/ts/render/Render.ts#L204), [Render.ts:260](di/src/lib/ts/render/Render.ts#L260), [Render.ts:337](di/src/lib/ts/render/Render.ts#L337), [Render.ts:410](di/src/lib/ts/render/Render.ts#L410), [Render.ts:489](di/src/lib/ts/render/Render.ts#L489), [Render.ts:503](di/src/lib/ts/render/Render.ts#L503), [Render.ts:557](di/src/lib/ts/render/Render.ts#L557), [Render.ts:785](di/src/lib/ts/render/Render.ts#L785)

### What this change did

Landed on 2026-04-16 in one edit:

- **Per-frame memo on the renderer.** A map from object id to its world matrix for the current frame.
- **Cache check at the top of the builder.** If an entry exists for the requested object, return it immediately; otherwise compute and store the new matrix before returning.
- **Cache clear at the top of each paint.** Sits next to the other per-frame clears (the dimension-rects list, the face-name-rects list, the angulars-rects list, the projection cache invalidation).
- **Every caller unchanged.** Only the builder's internals changed. The hidden-wireframe pass, the dimensions pass, the angulars pass, the grid pass, the axes pass, the selection-occlusion pass, and the hit-test projection all benefit for free.
- **Ancestor matrices for free.** The recursive parent-chain walk hits the cache on the second and later descents, so a deep tree's ancestor matrices are built exactly once per frame between them all.

Four hundred and ninety-six tests still pass; five hundred and fourteen overall remain green. Type-check is clean.

### What did not ship

The separable second optimization — swap the five fresh matrix allocations inside the builder for scratch matrices held on the renderer. Not required for correctness and not part of this step. Left as a follow-up.

## 4.  ✅ DONE The whole scene is measured every frame just to get one number that is hardly ever used

Every frame, the renderer used to visit every shape and every corner of every shape, spin each corner into its on-screen position, and track the overall span from one end of the scene to the other. The whole pass existed to produce a single number — roughly "how wide is the scene along its longest side". That number is only ever read by the mothballed facets debug view from bottleneck #1.

Evidence (historical — before the fix):

- The measuring pass: [Render.ts:407-418](di/src/lib/ts/render/Render.ts#L407-L418)

### What this step did

Landed on 2026-04-16 in one edit:

- **Removed the per-corner walk.** No more visiting every corner of every shape and spinning each one into on-screen position.
- **Read the scene extent already computed earlier in the same frame.** Three subtracts and two picks — same longest-side number, no per-corner math.
- **Still gated behind the facets debug switch.** The math only runs when the debug view is turned on. In normal use the whole block is skipped (side effect of the bottleneck #1 fix).

All five hundred and fourteen tests still pass; type-check is clean.

## 5.  ✅ DONE Object intersections are tested as object-pair × face-pair with no early exit beyond a bounding box

Whenever two shapes' overall boxes overlap, the renderer used to test every front face of the first shape against every front face of the second, and for each such face pair run the expensive math that finds where their planes cross. With many parts on screen this grew fast — pairs of shapes times faces times faces. Most of those face pairs do not actually touch each other at all.

Evidence (historical — before the fix):

- Nested pair-loop over all objects, then face-loop over each: [Render.ts:975-982](di/src/lib/ts/render/Render.ts#L975-L982)
- Object-level AABB prune only: [Render.ts:977-979](di/src/lib/ts/render/Render.ts#L977-L979)

### What the face-pair prune did

Landed on 2026-04-16 in one edit:

- **Each face now carries its own small box.** While the world-space corners of a front face are built, a low corner and a high corner are tracked with one compare each. The same loop that already walks the corners gathers the box for free.
- **Face-pair prune before the math.** The inner loop first checks whether the two faces' boxes overlap along all three directions. If they don't, the math is skipped. Six compares replace the expensive plane-crossing work for every face pair that doesn't touch.

The bigger change — a spatial index over every front face of every shape — is left as a follow-up. Only worth doing if profiling after this change still shows face-pair intersection at the top.

All five hundred and fourteen tests still pass; type-check is clean.

## 6.  ✅ DONE Finding the neighbor of each polygon edge is done by scanning every other face of the object

When tagging each edge as silhouette or internal, the code used to walk every other face of the same shape looking for one that shares both corner vertices. That was a quadratic scan per shape.

Now an edge-to-adjacent-faces map is built once per shape before the tagging loop. Each edge looks up its neighbor face in constant time. Shipped on 2026-04-16.

## 7.  ✅ DONE (by prior refactor) The spatial index used for edge clipping is rebuilt from scratch every frame — twice

The original bottleneck claimed two nearly-identical spatial indexes were built each frame — one for edge clipping, one for selection-dot occlusion — and asked that they be merged into one. That premise no longer holds in the current code.

Evidence as of 2026-04-16:

- Exactly one index is built per frame, at [Render.ts:368](di/src/lib/ts/render/Render.ts#L368).
- The selection-dot pass queries the same one, not a separate one. Read sites: [Render.ts:518-520](di/src/lib/ts/render/Render.ts#L518-L520), [Render.ts:1724-1725](di/src/lib/ts/render/Render.ts#L1724-L1725), [Render.ts:1967-1968](di/src/lib/ts/render/Render.ts#L1967-L1968).
- The only other file that mentions this kind of index is the mothballed topology file, and it only imports the type — it never constructs one.

Implication: a prior refactor already merged the two indexes into one. Nothing left to merge.

### Not shipped — between-frame caching

The bottleneck text also hinted at reusing the index from the previous frame when nothing that affects it moved. That is a separate, meaningfully different optimization from "merge two indexes into one" and was not pursued. Reasoning:

- Idle frames are already skipped entirely by the canvas-out-of-date gate from bottleneck #2.
- The remaining wins are narrow — hover changes, selection changes, edit-mode toggles, color changes while the scene is geometrically static. Active interactions (camera move, drag, tumble, wheel-zoom, any geometry mutation) must rebuild no matter what.
- The saving is rough and unmeasured. I AM GUESSING low-single-digits to maybe ten percent of a painted frame for scenes with tens of shapes. Not measured.
- Implementation cost is a second narrower out-of-date flag, wired alongside the existing one. Non-trivial.

Recommendation: revisit only if profiling after the other bottlenecks still points here.

## 8.  ✅ DONE The camera-view extent does a recursive descent that filters the whole object list at each level

Finding the rotation-aware bounding box for the grid shadow walks the children of the root, then for each child descends recursively. At each level of the descent, the code used to scan the entire flat object list to find that node's children. For a scene with N objects and depth D this approached N×D.

Evidence (historical — before the fix):

- [Render.ts:630-652](di/src/lib/ts/render/Render.ts#L630-L652)

### What the lookup map did

Landed on 2026-04-16 in one edit:

- **Parent-to-children map built once per frame at the top of the function.** One walk of the object list fills the map. The recursive descent then looks up children by parent identity in constant time instead of scanning the full list.
- **Direct-children list also read from the map.** Replaced the earlier filter call that searched the full list for the root's children.
- **No external plumbing.** The map lives locally inside the function, built fresh each frame. No scene-manager mutation hooks needed.

All five hundred and fourteen tests still pass; type-check is clean.

## 9. Hot loops allocate fresh math objects by the thousands per frame

Projection, edge clipping, intersection, and plane math all create new vectors and matrices inside their inner loops. This is a steady stream of short-lived objects that pressures the garbage collector and makes frame time jittery even when the math itself is cheap.

Switching to a small pool of preallocated temporaries would not change the math but would change the frame-time stability.

Evidence — a few representative sites among many:

- Corner-and-plane build inside the front-face loop: [Render.ts:295-305](di/src/lib/ts/render/Render.ts#L295-L305)
- Selection-occluder build, same pattern: [Render.ts:348-360](di/src/lib/ts/render/Render.ts#L348-L360)
- Root-scale vertex transform: [Render.ts:411-415](di/src/lib/ts/render/Render.ts#L411-L415)
- Edge-clip world-space lerps inside the occlusion loop: [Render.ts:1724](di/src/lib/ts/render/Render.ts#L1724), [Render.ts:1731](di/src/lib/ts/render/Render.ts#L1731)
- One `vec4` allocated per projected vertex: [Render.ts:720](di/src/lib/ts/render/Render.ts#L720)

Proposal:

- For each hot function, hold a small handful of scratch vectors and matrices as private fields on the renderer, named for their role (scratch corner, scratch normal, scratch point, and so on). Reuse them every call.
- The math library already has "write into this out-parameter" variants for all the operations the code uses. Change the code to call the in-place variants with the scratch targets instead of the allocating variants.
- The few places where a result genuinely needs to outlive the function (for example a stored world corner) should still allocate a fresh vector — but only at the storage point, not on every intermediate step.
- I AM GUESSING this is mechanically boring to do and the payoff is steadier frame times rather than lower averages. I have not measured garbage-collector pressure on this app.

## 10.  ✅ DONE Occluded-endpoint filtering walks every face edge for every intersection endpoint

After intersections are computed, a filter pass used to scan the full object list to find an object by id, then scan all edge segments to find one by edge key. Both lookups were linear.

Now an object-id map and an edge-key-per-object map are built once at the top of the filter pass. Both lookups are constant-time. Shipped on 2026-04-16.

## 11.  ✅ DONE Crossing-split application does a linear search per split

When applying splits to edge segments, the code used to scan every segment of the owning shape looking for the matching edge key. Now a direct-lookup map from "shape plus edge key" to the segment is built once before the split loop runs. Same result, constant-time lookup. Shipped on 2026-04-16.

## 12. The occlusion clipper rebuilds the whole interval list for every occluder it considers

The clip routine holds the "remaining visible intervals" for one edge. For each occluder hit, it allocates a fresh array, pushes new interval objects, and throws the old one away. With many occluders and many edges, this is a large stream of tiny allocations in the hottest path in the whole renderer.

An in-place mutate of a small scratch array would avoid most of it.

Evidence:

- [Render.ts:1747-1756](di/src/lib/ts/render/Render.ts#L1747-L1756)

Proposal:

- Hold two fixed-size scratch arrays on the renderer: "current intervals" and "next intervals," each with a small upper bound (edges rarely split into many pieces).
- Track the count with an integer field instead of using the array length.
- For each occluder step, read from current, write into next, then swap the two roles by swapping references. No allocation per occluder.
- At the end, copy the surviving intervals out into a small result array for the caller.
- I AM GUESSING the per-edge interval count rarely exceeds a handful — the six-face cuboid case makes this almost certain, but a richer mesh with many overlapping occluders could in principle blow past a fixed size. Pick a size that fits the current worst case with headroom, and fall back to a grow-on-overflow path if ever needed.

## 13. The non-visible-object hidden-wireframe pass calls the legacy occlusion wrapper

The pass that draws hidden objects as dashed grey walks every edge and calls the simple occlusion clipper. That wrapper internally calls the rich clipper — which builds the full interval-cause data structure — and then throws all of that metadata away in a map step. The hidden pass does not need the cause data at all.

A plain clipper that skips the metadata would halve this path.

Evidence:

- Caller: [Render.ts:573-576](di/src/lib/ts/render/Render.ts#L573-L576)
- The wrapper that allocates then throws away the cause data: [Render.ts:1784-1791](di/src/lib/ts/render/Render.ts#L1784-L1791)

Proposal:

- Split the clipper into two variants. The rich one stays for the pass that actually needs the cause tags. A plain one returns only visible intervals as pairs of points — no cause fields, no polygon-edge indices, no endpoint-identity metadata.
- The hidden-wireframe pass and any other "I just want the visible bits" caller calls the plain variant.
- The two variants can share an inner helper that does the interval-math in place on scratch arrays (see bottleneck #12). The rich variant wraps that with cause bookkeeping; the plain variant doesn't.

## 14.  ✅ DONE "Is this face in the occluder list?" uses a linear scan

When building face data for intersection testing, the code used to check every face against the full occluder list with a linear scan. Now a set of "shape plus face number" strings is built once when the occluder list is finalized; the per-face check is a single set lookup. Shipped on 2026-04-16.

## 15. String keys are built per edge per frame in the hottest compute loops

Edge keys, clip keys, and endpoint keys are assembled with template strings inside the edge and intersection loops. Every string is a fresh allocation. In a cold profiler these usually do not dominate, but in a canvas app that is already allocation-heavy they stack on top of item #9 above.

Numeric keys (a 32-bit pair) or an interned-string cache for edge keys would reduce the pressure.

Evidence — a small sample:

- [Render.ts:792](di/src/lib/ts/render/Render.ts#L792), [Render.ts:846](di/src/lib/ts/render/Render.ts#L846), [Render.ts:868](di/src/lib/ts/render/Render.ts#L868), [Render.ts:1001-1003](di/src/lib/ts/render/Render.ts#L1001-L1003), [Render.ts:1029](di/src/lib/ts/render/Render.ts#L1029)

Proposal:

- For the "min-max vertex pair" edge keys, replace the string with a single number computed as `(max << 16) | min`. Works for any geometry with fewer than sixty-five thousand vertices. Every current cuboid has eight.
- For the compound keys (object id plus edge plus occluder), keep them as strings but only for entries that cross a map boundary — inside hot per-edge compute, use the numeric edge key directly wherever the code is not actually crossing the map.
- If any compound key is unavoidable: intern it in a per-frame cache so that the second time the same compound appears in the same frame it reuses the previous string reference instead of rebuilding it.
- I AM GUESSING this nets a measurable improvement only after bottleneck #9 is also fixed — if allocation pressure is the dominant issue, both of these contribute; if it turns out not to be the dominant issue, neither helps much. Do this one last.

---

## Where I am guessing

I AM GUESSING about the absolute impact of items 9, 12, and 15 — allocation cost depends on scene size and the browser's garbage collector, and I did not run or profile the app. Their rank relative to each other is my best read, not measured.

I AM GUESSING that item 6 (the neighbor search) grows quadratically in practice — it does grow in the number of faces per object, but with only six faces per cuboid today the effect is probably small. It will bite the moment any object gets a richer mesh.

Everything above item 9 I am confident about from reading the code alone — those are structural, not dependent on scene size assumptions.

## What I did not look at, by choice

- The overlay renderers (grid, axes, dimensions, angulars). You said analyze the render pipeline; I checked that they run after the hot passes and none of them looked structurally expensive in the call graph, so I did not open them.
- The events/hits side of the pipeline. It runs on pointer move, not on every render tick, and you did not ask me to include it. Say the word if you want it.
- The facets file itself ([Facets.ts](di/src/lib/ts/render/Facets.ts)). Dead in normal use per the mothball flag, so the only relevant observation is already in bottleneck #1.

## Suggested order to tackle these

- ✅ Bottleneck #1 — **done**. The second pipeline now only runs when the facets debug switch is on. Bottleneck #4 also stops running in the common case as a side effect, since it only fed data into #1.
- ✅ Bottleneck #2 — **done**. The canvas-out-of-date flag with twenty-six subscriptions, three targeted marks, an early-return gate, and a wrapped-writable helper for rot prevention all shipped on 2026-04-15.
- ✅ Bottleneck #3 — **done**. Per-frame memo on the renderer builds each object's world matrix once per frame instead of several times. Shipped on 2026-04-16.
- ✅ Bottleneck #4 — **done**. The per-corner scene-extent walk was replaced with a read from the scene extent already computed earlier in the same frame. Still inside the facets gate, so normal use skips it entirely. Shipped on 2026-04-16.
- ✅ Bottleneck #5 — **done**. Each front face carries its own small box, and the face-pair loop prunes by that box before running the expensive plane-crossing math. Shipped on 2026-04-16.
- ✅ Bottleneck #7 — **done by prior refactor**. Only one spatial index is built per frame, not two — the merge the bottleneck called for already happened. Between-frame caching of the single index was left unshipped as unmeasured and narrow; revisit if profiling later points here. Verified on 2026-04-16.
- ✅ Bottleneck #8 — **done**. A parent-to-children lookup map built once per frame replaces the per-level full-list scan in the camera-view-extent descent. Shipped on 2026-04-16.
- ✅ Bottlenecks #6, #10, #11, #14 — **done**. All four map-lookup swaps shipped on 2026-04-16.

Remaining bottlenecks (#9, #12, #13, #15) are **mothballed**. All four are scratch-memory or allocation-reduction work with uncertain payoff — estimated five to fifteen percent of a painted frame, unmeasured. Revisit only if profiling points at allocation pressure as the top remaining cost.

Say what you want to dig into first and I can go deeper on any single item.

---

## Second pass — tumble is slow at 100 parts (2026-04-17)

Jonathan reports that at roughly one hundred parts on screen, tumbling (orbit-camera drag) is noticeably sluggish. The skip-when-clean gate does not help tumbling because every mouse move invalidates the canvas. The per-paint cost itself is what matters now. A fresh inspection of the paint found five hotspots. All are driven by the parts-count scaling in ways that line up with the previously-mothballed allocation items.

Numbered A through E so they do not collide with the original 1–15 list above. A is the deepest hot loop and the top target. The mothballed items (#9, #12, #13, #15) map onto B, C, D, E below.

---

## A. Edge-against-face clipping allocates a new interval list per occluder per edge

For each visible edge of each visible part, the clipper walks every face that might hide it. For each such face, it builds a **fresh array of interval objects** to represent "what parts of the edge are still visible". With roughly six hundred visible edges and up to one hundred occluding faces considered per edge, this is tens of thousands of array builds per paint, each with its own allocations.

Evidence:

- The per-occluder rebuild: [Render.ts:1809-1818](di/src/lib/ts/render/Render.ts#L1809-L1818)
- The two world-space lerp points allocated per plane crossing: [Render.ts:1786](di/src/lib/ts/render/Render.ts#L1786), [Render.ts:1793](di/src/lib/ts/render/Render.ts#L1793)
- The outer occluder loop: [Render.ts:1767-1820](di/src/lib/ts/render/Render.ts#L1767-L1820)

Proposal:

- Hold **two scratch arrays of interval records** on the renderer, each preallocated with a generous fixed slot count (start with 32). Also hold a length integer for each, tracked separately from the array's own `.length`.
- On each occluder step, treat one scratch array as "current" and the other as "next". Read from current, write into next, then swap the two references at the end of the step. No array allocation inside the loop.
- Each interval record is itself an object today — change those to small preallocated record holders (one scratch list of records, indexed by the length integer). This removes the `new_intervals.push({ … })` allocation pattern inside the occluder loop.
- For the two world-space lerp points: hold two `vec3` scratches on the renderer and call the in-place variants of the gl-matrix lerp (the math library already has out-parameter versions of every op).
- On overflow (rare, only with richer meshes): grow by doubling. Cap the scratch back to a modest size at the top of every paint so occasional big edges do not hold memory.
- Surface a one-line assertion in dev builds that warns if the overflow path triggers, so we notice if some geometry consistently needs bigger scratch.

Out of scope, left for a later pass: replacing the spatial index rebuild. That is already O(visible faces) and is only one allocation per paint.

## B. Hot loops create fresh vectors and matrices on every iteration

Projection, edge clipping, plane math, and intersection all create new `vec3`, `vec4`, and `mat4` objects inside their innermost loops. A count of the file found about thirty-nine allocation sites on the paint path. At a hundred parts this produces thousands of short-lived math objects per frame, which pressures the garbage collector and makes frame time jittery.

Evidence — a sample:

- Projected corner and plane build in the front-face loop: [Render.ts:295-305](di/src/lib/ts/render/Render.ts#L295-L305)
- Selection-occluder corner build: [Render.ts:348-360](di/src/lib/ts/render/Render.ts#L348-L360)
- Hidden-wireframe world-space transforms for every edge of every invisible part: [Render.ts:582-587](di/src/lib/ts/render/Render.ts#L582-L587)
- Identity matrix rebuilt inside the face-pair intersection loop: [Render.ts:1034](di/src/lib/ts/render/Render.ts#L1034)
- Edge-vector and point-vector rebuilt inside the per-endpoint edge-info closure: [Render.ts:1078-1080](di/src/lib/ts/render/Render.ts#L1078-L1080)
- Every projected corner gets a fresh `vec4`: [Render.ts:720](di/src/lib/ts/render/Render.ts#L720)

Proposal:

- For each hot function, hold **a small handful of scratch vectors and matrices** as private fields on the renderer, named for their role: `scratch_corner`, `scratch_normal`, `scratch_plane_point`, `scratch_world_a`, `scratch_world_b`, `scratch_identity`, and so on. Reuse them on every call.
- Replace every allocating gl-matrix call in a hot loop with its in-place variant: `vec3.lerp(out, …)` with `out = this.scratch_world_a` instead of `vec3.lerp(vec3.create(), …)`. Same for `vec3.sub`, `vec3.cross`, `vec3.transformMat4`, `vec4.transformMat4`, `mat4.multiply`, `mat4.identity`.
- The few places where a result genuinely needs to outlive the function (stored world corner, memoized world matrix) keep allocating — but only at the storage point, not on every intermediate step.
- The identity matrix used inside the face-pair loop: hoist it to a per-paint field, built once at the top of the paint, reused every call. Today it gets rebuilt for every face pair.
- Ship this in groups: projection first (highest hit count), then edge clipping, then intersection, then plane math. Each group is verifiable independently by pixel diff against a before-snapshot.

## C. Face-pair intersection builds three short strings for every face pair tested

The face-pair loop computes the intersection geometry, then builds three template strings — two face keys and one intersection edge id — before checking whether the result will actually be stored. Even pairs that fail the downstream checks allocate these strings. At a hundred parts with six faces each, the worst-case face-pair count is in the tens of thousands per paint.

Evidence:

- The three string builds: [Render.ts:1047-1049](di/src/lib/ts/render/Render.ts#L1047-L1049)
- The surrounding nested loop: [Render.ts:1016-1049](di/src/lib/ts/render/Render.ts#L1016-L1049)

Proposal:

- Move the three string builds **below** every early-out check in the face-pair body. Today they build before the "do the clips actually produce anything" branch is entered. The keys only need to exist if the code actually stores a result.
- For the per-loop portion that must build keys: replace the template-string pair-key scheme with a **numeric key** where possible. For a face key that is "object id plus face index", the face index is a small integer (0–5 for a cuboid). If object ids were numeric (or a per-frame numeric alias for the small set of objects on screen), the face key could be packed as one number. Leave the compound intersection key as a string for the map boundary — only entries that survive to the map need the string.
- The small-integer-vertex-pair edge key built inside the edge-info closure: same pattern, replace `${Math.min(i,j)}-${Math.max(i,j)}` with `(Math.max(i,j) << 16) | Math.min(i,j)` since every current mesh has far fewer than sixty-five thousand vertices.

## D. Hidden-wireframe pass calls the rich clipper and throws away its metadata

The pass that draws dashed grey outlines for invisible parts calls the same clipper as the visible-edge pass. That clipper tags every interval with "which face caused this cut" and "which polygon edge of that face was crossed", then the hidden-wireframe pass strips all of it back down to pairs of two-dimensional points and discards the tags. Half of the clipper's work in this pass is wasted.

Evidence:

- The call: [Render.ts:585-588](di/src/lib/ts/render/Render.ts#L585-L588)
- The wrapper that allocates, tags, and then discards: the simple wrapper lives at around [Render.ts:1784-1791](di/src/lib/ts/render/Render.ts#L1784-L1791) and internally calls the rich variant

Proposal:

- Split the clipper into **two variants with a shared inner helper**. The inner helper does the interval math on scratch arrays (see A). The rich variant wraps that with cause and polygon-edge bookkeeping; the plain variant returns only an array of visible `(start, end)` pairs.
- The hidden-wireframe pass at [Render.ts:585](di/src/lib/ts/render/Render.ts#L585) calls the plain variant. Any other "I just want the visible bits" caller also calls the plain variant.
- The front-edge pass at [Render.ts:832](di/src/lib/ts/render/Render.ts#L832) keeps calling the rich variant — it actually uses the cause data to compute endpoint identities.
- With A in place, both variants share the same scratch arrays, so the plain variant is almost free.

## E. Short string keys are built per edge per frame

Edge keys, clip keys, and endpoint keys are assembled with template strings inside the edge and intersection loops. Every string is a fresh allocation. On its own this does not dominate frame time, but on top of B it magnifies allocation pressure — every edge in the scene generates a handful of these.

Evidence — a sample:

- Vertex-pair edge keys: [Render.ts:792](di/src/lib/ts/render/Render.ts#L792), [Render.ts:1075](di/src/lib/ts/render/Render.ts#L1075)
- Clip key built per occluder per clip interval: [Render.ts:876](di/src/lib/ts/render/Render.ts#L876)
- Endpoint keys: [Render.ts:898](di/src/lib/ts/render/Render.ts#L898), [Render.ts:909-912](di/src/lib/ts/render/Render.ts#L909-L912)
- Intersection-edge ids: [Render.ts:1049](di/src/lib/ts/render/Render.ts#L1049)

Proposal:

- **Pack vertex-pair edge keys as a single number.** Every current mesh has far fewer than sixty-five thousand vertices, so `(Math.max(i,j) << 16) | Math.min(i,j)` is unambiguous. The map storing per-object edge adjacency can use `Map<number, …>` just as easily as a string key.
- For **compound keys that cross a module boundary** (an edge key plus an object id plus an occluder id, stored in a map that outlives the call): keep them as strings, but only build the string once the map write is certain to happen. Today some keys are built before the decision to store.
- For **ephemeral compound keys** used only to compare inside the same loop: compute the comparison as a pair of numbers and avoid the string altogether.
- Ship this one **last**, after B is done. Its payoff is real only when allocation pressure is already the top remaining cost — if the gl-matrix scratch migration leaves allocation off the critical path, this one becomes optional.

---

## Suggested ship order for second pass

A first — deepest loop, biggest single allocator. B next — broadest hit, moderate mechanical effort, needed by A and D to share scratch. D after B, because it is done almost free once the scratch-array pattern from A is in place. C any time after its own loop is done — it is self-contained and blocks nothing else. E last; skip entirely if B leaves allocation off the critical path.

Measure between each step. The skip-when-clean gate gave us a straightforward way to count paints; adding a per-paint millisecond sampler next to the existing rolling counter would let us confirm each step pays.

## Status — 2026-04-17

- **A — done.** The part of the paint that decides which bits of an edge are still visible after the faces in front of it are considered now reuses two pre-built scratch lists and a reusable world-space lerp target. No list or record object gets freshly allocated while walking through the faces that might hide an edge. A one-line rollback switch at the top of the file flips back to the previous allocating path on next reload. All five hundred fourteen tests still pass; type-check is clean.
- **B — done in the highest-value places.** Several allocation sites in the hottest loops were changed to write into pre-built scratch math objects kept on the renderer instead of allocating new ones each time: the world-space corner and plane-edge builds for the faces that occlude other faces, the world-space corner and plane-edge builds for the faces that take part in cross-object intersections, the empty "no transform" matrix now shared across three spots that pass one to the projector, the edge-vector and point-vector builds inside the endpoint-tagging closure, the world-space endpoint builds inside the hidden-wireframe loop, and the world-space endpoint builds inside the visible-edge loop. Allocation sites deeper in the file (lerps inside the intersection-endpoint work, a couple of scratch vectors in the polygon-clipping helper) were not touched — they sit off the tumble-critical path. Tests still pass; type-check is clean.
- **D — done.** The inner loop that walks through occluders and splits the edge's visible intervals was split out of the clipper into a shared helper. The full-featured variant still reports which occluding face caused each cut, used by the visible-edge pass. The light variant skips that bookkeeping and returns only pairs of screen points, used by the dashed-grey hidden-wireframe pass. Both share the same scratch lists built in A. Tests still pass.
- **C — deferred.** The first half of the proposal — move the three short string builds below the early-out checks inside the face-pair loop — turned out to already be the case. Those strings only get built once the face-pair has actually produced a visible clip, so there's nothing to move.
Evidence at [Render.ts:1096-1098](di/src/lib/ts/render/Render.ts#L1096-L1098).
The second half — replace the short "smaller-vertex-dash-larger-vertex" edge-name strings with a single packed number — would ripple through every place where an edge-name is stored: the per-edge computed segment records, the intersection-edge split list, the crossing split list, the "segment-owner plus edge" map keys, and one spot where an edge-name string gets split back into two numbers. Too broad for a second-pass quick win. Revisit only if profiling after A, B, and D points here.
Evidence for the split-back site at [Render.ts:564](di/src/lib/ts/render/Render.ts#L564).
- **E — deferred for the same reason as the second half of C.** The short edge-name strings and the compound "edge plus occluder" keys built inside the visible-edge and intersection loops are used both for quick set lookups AND for storage in long-lived data structures. Changing only the lookup side is easy; changing the stored shape ripples broadly. Revisit if profiling still points at string-allocation pressure.

### Files touched

- [Render.ts](di/src/lib/ts/render/Render.ts) — one new rollback switch at the top of the file, one new shape moved up from inside a function to the file level so several functions can share it, several scratch math objects grouped on the renderer and named for their role, two new versions of the edge-vs-face clipper (full and light) plus a shared inner helper they both call, and the previous allocating path kept in place behind the rollback switch.

### Verification

- Type-checker: zero errors, zero warnings.
- Test runner: five hundred fourteen of five hundred fourteen tests pass.
- Real-world tumble with a hundred parts not measured yet — the paint-versus-skip counter added during the first pass is still in place and can be used to confirm the improvement.
