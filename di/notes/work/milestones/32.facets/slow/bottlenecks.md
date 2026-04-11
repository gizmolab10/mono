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

## 2. The whole scene is rerendered every animation frame whether or not anything changed

The animation loop calls render every tick. There is no dirty flag. If the user is idle, hovering, or typing in a side panel, the entire pipeline — projection, occlusion, intersections, edge clipping — runs at roughly sixty times a second for nothing.

A "scene changed" or "camera moved" bit that skips render when clean would give back a lot of idle-time budget.

Evidence:

- The loop hookup: [Engine.ts:134-138](di/src/lib/ts/render/Engine.ts#L134-L138)
- Render entry point: [Render.ts:188](di/src/lib/ts/render/Render.ts#L188)

### Proposal

- **Audit first — do not touch code yet.** Produce a written list of every site that mutates anything the canvas shows. The list needs to cover at least: camera move, pan, scale; selection change; hover change; drag step; store tick; the orientation snap-animation step; geometry mutation (add child, delete, duplicate, import, fit-to-children, undo, redo, scene load); constraint propagation; window resize and device-pixel-ratio change; preference changes that affect rendering (line thickness, grid opacity, edge color, solid mode, view mode, show-names, show-dimensionals, show-angulars); debug flag flips. The list is the contract the rest of the work is measured against.
- **Add a render_is_stale boolean on the renderer, and a helper (mark_render_as_stale(boolean)) that sets it to boolean.** Start the flag at **true** so the very first frame renders. The helper is a one-line boolean assignment — keep it cheap so over-setting is painless.
- **Wire every site in the audit to call the helper.** Do this in small batches. After each batch, run the app and watch a counter to confirm the flag is being set where you expect. Over-set rather than under-set while the audit matures — when in doubt, wire it.
- **Only after the audit is fully wired, flip the gate on:** at the top of the frame tick, if **render_is_stale** is false and no snap animation is running, skip the whole render call. Do not skip the animation-loop scheduling — only the work inside.
- **Clear render_is_stale at the very start of each render call that runs** (before any compute). This way, writes that happen during render still queue the next frame instead of being lost at the end.
- I AM GUESSING this will give back most of the idle frame cost — I have not measured idle frame time, and the snap-animation path keeps the renderer active whenever it is animating, so some frames will still run regardless.
- **Rollback lever.** Keep a single "always dirty" override constant at the flag declaration. Flipping it makes the gate a no-op and the behavior collapses back to today's unconditional redraw — no revert, no redeploy.
- **Prevent rot.** The audit is a one-time snapshot. New mutation sites added later will forget to wire dirty unless something enforces the invariant. Pick one and commit to it:
    1. Route every store write through a helper that calls the dirty helper automatically. Strongest option — the wiring is invisible to the author.
    2. Add a development-mode assertion that logs loud when a store write happens without a dirty mark in the same tick. Catches missing wiring during playtesting.
    3. At minimum, write a comment at the flag declaration naming the invariant. Weakest option — relies on the next author reading the comment.
- **Maybe:** a temporary keystroke that disables the gate for the rest of the session (a toggle, not a one-shot). When something looks stale, flipping the toggle keeps the app in "always redraw" mode while you hunt for the missing wiring.



## 3. The world transform for every object is rebuilt from scratch several times per frame

The function that builds an object's world transform allocates about five fresh matrices, walks up the parent chain recursively, and is called from many places during one frame: projection, the solid-fill pass, the selection-occlusion pass, the root-scale AABB pass, edge rendering, and the hidden-wireframe pass. Same object, same answer, built over and over.

A single pass that builds each object's world matrix once at the top of the frame and hands it out afterwards would remove the duplication plus all those matrix allocations.

Evidence:

- The builder, allocating fresh matrices each call: [Render.ts:675-717](di/src/lib/ts/render/Render.ts#L675-L717)
- Repeated call sites in one frame: [Render.ts:204](di/src/lib/ts/render/Render.ts#L204), [Render.ts:260](di/src/lib/ts/render/Render.ts#L260), [Render.ts:337](di/src/lib/ts/render/Render.ts#L337), [Render.ts:410](di/src/lib/ts/render/Render.ts#L410), [Render.ts:489](di/src/lib/ts/render/Render.ts#L489), [Render.ts:503](di/src/lib/ts/render/Render.ts#L503), [Render.ts:557](di/src/lib/ts/render/Render.ts#L557), [Render.ts:785](di/src/lib/ts/render/Render.ts#L785)

Proposal:

- Add a per-frame map keyed by object identity that holds the world transform for that object for this frame.
- At the top of the render call, clear the map.
- Change the world-transform builder so that the first time it is asked for an object's matrix in a frame it computes and stores; every subsequent call in that frame returns the stored matrix.
- Because parents must be built before children, this also gives every ancestor matrix for free during the first descent.
- Every current caller stays the same at the call site — only the internals of the builder change. Low-risk mechanical refactor.
- Separately: stop allocating five fresh matrices inside the builder. Reuse a small set of scratch matrices held on the renderer. The returned matrix is still a fresh one stored in the map; the intermediates are scratch.

## 4. The whole scene is walked once just to find the largest extent

After the solid-fill and occlusion passes, the code walks every object, transforms every vertex of every object to world space using freshly allocated math temporaries, and keeps a running min/max — only to produce one single number (the largest axis span). That number is then passed into the mothballed topology pipeline from bottleneck #1.

If topology is removed, this whole pass disappears. If topology stays, the number could be read from the AABB work already done elsewhere instead of re-transforming every vertex.

Evidence:

- [Render.ts:407-418](di/src/lib/ts/render/Render.ts#L407-L418)

Proposal:

- If bottleneck #1 is fixed by gating the second pipeline, this pass only runs when the debug switch is on — no further action needed.
- If you want it gone unconditionally: replace the vertex-level walk with a walk over the camera-view extent values already computed earlier in the same frame, and derive the largest axis span from those. This is one subtract and two maxes. No vertex transforms, no allocations.

## 5. Object intersections are tested as object-pair × face-pair with no early exit beyond a bounding box

For every pair of objects that aren't separated by their bounding boxes, every front-face of one object is tested against every front-face of the other. With a few dozen parts on screen this grows fast — the count is pairs times faces times faces.

A spatial index on world-space face bounding boxes, or a per-face AABB prune, would cut this down sharply. The object-level AABB prune that exists today only fires when two whole objects do not overlap at all.

Evidence:

- Nested pair-loop over all objects, then face-loop over each: [Render.ts:975-982](di/src/lib/ts/render/Render.ts#L975-L982)
- Object-level AABB prune only: [Render.ts:977-979](di/src/lib/ts/render/Render.ts#L977-L979)

Proposal:

- Quick win first: for every face, compute its world-space bounding box once inside the same loop that already builds the face data. Store it next to the face.
- In the inner pair loop, before calling the expensive plane-intersection math, do a bounding-box overlap test between the two faces' boxes. Most face pairs of overlapping objects still don't actually touch, so this skips most of the work.
- Bigger change, if the quick win is not enough: build a world-space bounding-box spatial index over all front faces of all objects once per frame. For each face, query the index for overlapping faces on other objects. Only compute intersections for returned candidates. This is the same pattern the edge-clip pass already uses.

## 6. Finding the neighbor of each polygon edge is done by scanning every other face of the object

When a front face is added to the occluder list, each of its edges has to be tagged as either a silhouette edge or an internal edge. To find the neighbor, the code walks every other face of the same object looking for one that contains both endpoint vertices. That is a quadratic-in-faces-per-object search run for every front face of every object.

A pre-computed edge-to-faces lookup built once when geometry loads would reduce this to a constant-time lookup.

Evidence:

- [Render.ts:280-292](di/src/lib/ts/render/Render.ts#L280-L292)

Proposal:

- Every object in the scene today shares the same cuboid topology (same edge and face lists held as constants on the engine). Build the edge-to-faces map once, alongside those constants, at module load.
- The map key is the ordered vertex pair, the value is the list of faces that contain it.
- At silhouette-tag time, look up the neighbor face in the map and check whether it is front-facing. Constant-time per edge.
- When non-cuboid topologies are introduced later, each topology builds its own map at construction time and stores it next to its edge/face arrays. Same lookup at the same call site.

## 7. The spatial index used for edge clipping is rebuilt from scratch every frame — twice

One spatial index is built over front-facing occluder polygons; a second, almost identical one, is built immediately afterwards for selection-dot occlusion that includes invisible children. Both are discarded at the end of the frame.

When nothing has moved between frames, both rebuilds are wasted work. Even when something did move, the two indices could share a build step since the selection version is a superset of the render version.

Evidence:

- Main index build: [Render.ts:311-327](di/src/lib/ts/render/Render.ts#L311-L327)
- Second, overlapping index build: [Render.ts:363-379](di/src/lib/ts/render/Render.ts#L363-L379)

Proposal:

- Build one superset index that contains every non-root front-facing face (both visible and invisible objects).
- Tag each entry with a single flag: "visible object" or "hidden object."
- The edge-clip pass queries the index and ignores hidden-object entries. The selection-dot pass queries the same index and accepts both. One index, one build.
- When bottleneck #2 is in place (a dirty flag), the index build itself becomes skippable on frames where nothing moved — reuse the index from the previous frame.

## 8. The camera-view extent does a recursive descent that filters the whole object list at each level

Finding the rotation-aware bounding box for the grid shadow walks the children of the root, then for each child descends recursively. At each level of the descent, the code scans the entire flat object list to find that node's children. For a scene with N objects and depth D this can approach N×D.

A precomputed parent→children index (built once when the scene changes) would collapse each descent to a direct lookup.

Evidence:

- [Render.ts:630-652](di/src/lib/ts/render/Render.ts#L630-L652)

Proposal:

- Build a map from parent to its direct children once, whenever the scene hierarchy mutates (add child, remove child, scene load, subtree import). Store it on the scene manager.
- Replace the per-descent full-list filter with a direct read from the map.
- The invalidation points already exist — each mutation path already does bookkeeping, so adding one more update there is a small localized change.

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

## 10. Occluded-endpoint filtering walks every face edge for every intersection endpoint

After intersections are computed, a filter pass asks "is this endpoint on an occluded part of any face?" For each candidate endpoint it walks every edge of the target face, then walks every visible clip interval on that edge. In scenes with many overlapping objects this is a lot of repeated linear scans over data that was just built.

Evidence:

- [Render.ts:1222-1320](di/src/lib/ts/render/Render.ts#L1222-L1320)

Proposal:

- At the top of the filter pass, build a small lookup map keyed by "object, face index" whose value is the list of visible clip intervals for each edge of that face. One pass over the already-computed edge data fills it.
- For each intersection endpoint, look up the edge-interval list directly and run the existing "is this point inside a visible interval" check. No inner linear scan over face edges.
- This keeps the logic identical; only the access pattern changes.

## 11. Crossing-split application does a linear search per split

When splits are applied to edge segments, the code groups them by edge key, then for each group scans every segment of the owning object looking for a match. The lookup should be by edge key in a map, not by linear scan.

Evidence:

- [Render.ts:1438-1491](di/src/lib/ts/render/Render.ts#L1438-L1491)

Proposal:

- Build a direct lookup map once: key is "object, edge key," value is the segment. Fill it in one pass over the already-computed edge segments before the split loop runs.
- In the split loop, replace the linear search with a map lookup.
- No behavior change; only the lookup shape.

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

## 14. "Is this face in the occluder list?" uses a linear scan

When building face data for intersection testing, the code checks whether each face is in the occluder list by calling `.some()` — a linear scan over the whole occluder list for every face of every object.

A set keyed by object id and face index, built once when the occluder list is built, would fix this.

Evidence:

- [Render.ts:939](di/src/lib/ts/render/Render.ts#L939)

Proposal:

- At the point the occluder list is finalized in the current frame, also build a set of "object id plus face index" strings (or a nested map of object id to face-index set).
- Replace the linear-scan check with a single set lookup.
- One extra pass over the occluder list, but it's a flat scan that the code already does once anyway, so no new cost worth worrying about.

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

1. Bottleneck #2 next. Touches one file in a shallow way, affects every frame.
2. Bottleneck #3 after that. Mechanical refactor, unlocks the per-face and per-edge work below it.
3. Bottlenecks #5, #7, #8 in any order. Each one is a focused local change.
4. Bottlenecks #6, #10, #11, #14. All map-lookup swaps. Quick and safe.
5. Bottlenecks #9, #12, #13 together. They all touch scratch-memory discipline and share the same mental model.
6. Bottleneck #15 last. Only worth doing if profiling after the above still shows allocation as the top cost.

Say what you want to dig into first and I can go deeper on any single item.

