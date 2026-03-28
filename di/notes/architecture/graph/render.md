# How Rendering Works

`src/lib/ts/render/Render.ts` — every frame starts here.

the whole pipeline is one function: `render()`. it clears the canvas and runs nine stages, always in this order. in two phases: figure out what's visible once, then everybody draws from that same answer.

## 1. Project everything

every vertex in the scene — visible or not — gets pushed through the camera. world coordinates become screen positions. then we cache it for general use. tumbling and editing update the cache. its main consumer the hit system.

## 2. Grid and ground shadow

an optional grid, drawn behind everything. a tweaky extra in 3D.

## 3. Fill faces

in solid mode, strip rear edges. collect every front-facing face, sort them farthest-first, fill white. be picazzo, paint over what's behind.

in wireframe mode, faces get tinted debug overlays instead — each face a different color so i can tell them apart.

## 4. Build the occlusion index

heavy lifting here. for each front-facing face on each child object:

- figure out its plane in 3D and its shape on screen
- tag each edge: silhouette (the body ends here) or internal (another front face continues)
- drop bounding boxes into a spatial index for fast "what's near this pixel?" lookups

there's a second index just for selection dots that includes invisible objects too — so dots behind hidden geometry still disappear properly.

## 5. Figure out what's visible

heavier lifting here. solid mode only. three passes.

okay, we have points. SOT and derived. and lines and planes, objects and occlusions.

**intersection lines** — when two SOs overlap, their faces cut through each other. for every pair of front-facing faces that might touch, i find where the planes cross, trim the line to fit both faces, project it to screen, then trim again for anything blocking it. each endpoint gets tagged: is it a corner? where two faces meet? where something hides it?

**edges** — for each visible edge, trim it against everything that might block it (the spatial index keeps this fast). tiny gaps between trims get merged. endpoints get the same identity tags, and when an edge meets an intersection line, they share the same endpoint.

**cleanup** — ghost endpoints that landed on hidden stretches of edges get removed. then i find edges from one SO that pass in front of another SO's face — these are the occlusion boundaries the facet tracer needs later.

## 6. Facets

experimental, debug-only for now. takes all those precomputed edges, intersections, and occlusion boundaries and builds a graph. sorts edges around each meeting point by angle. walks the graph to trace closed regions on the selected object's face. paints them with the accent color.

the endpoint identity system is what makes this possible — the tracer knows *why* each line starts or ends where it does (corner vs intersection vs hidden by something), so it can make the right turn at every junction.

## 7. Draw intersection lines

strokes the precomputed visible segments. straightforward — the hard work already happened in step 5.

## 8. Draw edges

for each visible object, draw its edges. solid mode pulls from the precomputed segments. wireframe just draws all front-face edges directly. everything gets batched by role — normal edges, guidance-face highlights (during drag), rotation-face highlights.

## 9. Overlays

the finishing touches, layered on top:

- 2D front-face outline
- invisible-object wireframes (dashed, ghostly)
- axes
- hover highlight and selection dots (hidden behind faces when appropriate)
- dimensions, angulars, face names
- debug labels

## the throughline

compute visible segments once, use them everywhere. edges, intersections, and facets all drink from the same well. that's the whole architecture in one sentence.
