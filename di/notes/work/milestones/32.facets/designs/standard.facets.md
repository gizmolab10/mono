# Standard Algorithms for Painting Facets

How do you go from "a bunch of visible segments on screen" to "painted enclosed regions"? Turns out this is one of the most studied problems in computational geometry. Here's what the literature says, and where our approach fits.

---

## 1. What Is This Problem Called?

Several names, depending on which slice you're looking at:

**Arrangement of line segments** — the core geometric problem. Given a set of segments in the plane, find every enclosed region. This is the formal name in computational geometry (Edelsbrunner, de Berg, etc.).

**Planar subdivision** — what you get after building the arrangement. The plane is carved into faces (regions), edges, and vertices. Every point in the plane belongs to exactly one face.

**Hidden-surface removal** (or hidden-line elimination) — the 3D-to-2D part. Figuring out which parts of which faces are visible. Classic algorithms: Appel (1967), Roberts (1963), Weiler-Atherton (1977). The rendering pipeline in textbooks.

**Planar map** — another name for the subdivision, emphasizing the data structure. Sometimes called a "planar graph embedding."

Our problem spans two of these: we do hidden-line elimination to get the visible segments, then we build an arrangement of those segments to find the facets. The first part is 3D geometry. The second part is pure 2D.

The specific data structure that everyone reaches for is the **DCEL** — doubly-connected edge list. More on that below.

---

## 2. The Standard Algorithms

### Arrangement of Line Segments

The core idea: take N segments in the plane. They cross each other at various points. Those crossings, plus the segment endpoints, define vertices. The segments between vertices define edges. The edges enclose regions — faces.

Building this arrangement means:

1. Find every intersection point between every pair of segments
2. Split each segment at its intersection points into sub-edges
3. Connect everything into a graph
4. Walk the graph to find enclosed faces

That's it. Conceptually simple. The devil is in step 3 and 4 — how do you actually represent and walk this thing?

### DCEL: The Standard Answer

A **doubly-connected edge list** (also called a half-edge data structure) is the standard way to represent a planar subdivision. Every edge gets split into two **half-edges**, one for each direction. Each half-edge knows:

- Its **origin** vertex
- Its **twin** (the half-edge going the other direction on the same edge)
- Its **next** half-edge (walking around the face to the left)
- Its **prev** half-edge
- Which **face** it borders

Why is this the standard? Because walking around a face is trivial: start at any half-edge, follow `next` pointers until you get back to the start. That loop gives you the boundary of one facet. Every half-edge belongs to exactly one face. So finding all faces = walking all half-edge cycles.

The key operation when building a DCEL: **cyclic ordering at each vertex**. At every vertex, the outgoing half-edges are sorted by angle. This sorting is what makes the `next` pointers work — the "next" half-edge leaving a vertex is the next one counter-clockwise from the incoming twin.

Imagine vertex V with four edges radiating out at angles 30, 120, 210, 300 degrees. If you arrive along the 120-degree edge (so your twin points at 300), the next half-edge in the face cycle is the one at... not 300 (that's your twin), but the next CCW after 300, which is 30. That angular neighbor logic is the heart of the DCEL.

### Finding Crossings: Bentley-Ottmann vs Brute Force

**Brute force**: check every pair of segments for intersection. O(N^2). For 20-40 segments, that's 200-800 checks. Perfectly fine.

**Bentley-Ottmann sweep**: a sweep-line algorithm that finds all K intersections among N segments in O((N + K) log N) time. It sweeps a vertical line left to right, maintaining the order of segments intersecting the sweep line, and only checks neighbors for crossings.

For our scale (20-40 segments), brute force is the right call. Bentley-Ottmann's constant factors and implementation complexity aren't worth it under a few hundred segments. The textbooks agree: use brute force below ~100-200 segments.

### How Classic Hidden-Surface Algorithms Handle This

**Appel's algorithm (1967)**: walks along each edge, tracking a "quantitative invisibility" counter (how many faces are in front of this point). When the counter is zero, the edge is visible. It processes edges one at a time and clips them. It doesn't build facets — it produces visible edge segments only.

**Roberts' algorithm (1963)**: works with convex polyhedra. Tests each edge against each face for occlusion. Similar output: visible segments, not facets.

**Weiler-Atherton (1977)**: this one does produce regions. It clips polygons against polygons using a clever walk-along-the-boundary technique. Two polygons' boundaries are merged into a combined boundary, and you walk the merged boundary to extract the clipped regions. It's designed for polygon clipping, not general arrangements.

**Painter's algorithm**: sorts faces back-to-front and paints them in order. No clipping at all — just overdraw. Works for simple scenes but fails with intersecting objects (like our two boxes).

None of these classic algorithms directly produce facets from a general arrangement of segments. They either give you visible segments (Appel, Roberts) or they clip polygon-against-polygon (Weiler-Atherton). For our problem — "here are all the visible segments, now find the enclosed regions" — the arrangement + DCEL approach is what's needed.

---

## 3. The Complete Pipeline

From 3D geometry to painted facets, step by step:

### Step 1: Object-Space Visibility

Input: 3D polyhedra (ALPHA and BETA boxes)
Output: visible edge segments in 3D, clipped against occluding faces

For each edge of each object:
- Back-face cull: skip edges where both adjacent faces point away from the camera
- Clip against every potentially-occluding face of the other object
- Result: a set of 3D segments that are visible

This is the Appel/Roberts part. We already do this.

### Step 2: Intersection Lines

Input: pairs of face planes from different objects
Output: intersection line segments, clipped to both face boundaries and visibility

For each pair of faces (one from ALPHA, one from BETA):
- Compute the intersection line of the two planes
- Clip that line to the boundary of both faces (it must lie within both)
- Clip for visibility (the intersection line might be occluded by a third face)

We already do this too.

### Step 3: Project to 2D

Input: all visible 3D segments (edges + intersection lines)
Output: 2D segments in screen space

Orthographic projection. Straightforward. Each 3D segment becomes a 2D segment.

### Step 4: Find All Crossings

Input: 2D segments
Output: 2D segments split at every crossing point

**This is where it gets critical.** In the standard approach, you find ALL crossings between ALL segments — not just crossings between segments from different objects. Two edges of ALPHA can cross in screen space (think of a cube where a front edge crosses over a back edge in projection). Intersection lines can cross edges. Everything crosses everything.

For each pair of segments:
- Compute the 2D intersection point (if any)
- Split both segments at that point
- Record the new vertex

After this step, no two segments cross — they only meet at shared endpoints (vertices).

### Step 5: Build the DCEL

Input: vertices and split sub-segments (no crossings)
Output: a doubly-connected edge list

1. Create a vertex for every endpoint and crossing point
2. Create two half-edges (twins) for every sub-segment
3. At each vertex, sort outgoing half-edges by angle
4. Link `next` pointers: for half-edge H arriving at vertex V, find H's twin's angular neighbor and set that as H's `next`
5. The unbounded outer face exists implicitly

### Step 6: Extract Faces

Input: DCEL
Output: list of faces, each defined by a cycle of half-edges

Walk each half-edge's `next` chain until you return to the start. Each cycle defines one face. Mark half-edges as visited so you don't extract the same face twice.

One face will be the unbounded exterior. The rest are your facets.

### Step 7: Determine Face Colors

Input: faces from the DCEL, original 3D face data
Output: colored facets

For each facet, pick a sample point inside it (e.g., centroid of the boundary polygon). Ray-cast or use winding rules to determine which 3D face (if any) this point lies on. That tells you the face color. If the point is occluded, the facet might be behind something — but since we only used visible segments, every facet should be either a visible face or background.

### Data Flow Summary

```
3D polyhedra
    |
    v
[visibility clipping] --> visible edge segments (3D)
    |
    v
[intersection lines] --> intersection segments (3D)
    |
    v
[project to 2D] --> all segments in screen space
    |
    v
[find ALL crossings] --> split segments, no crossings remain
    |
    v
[build DCEL] --> half-edge structure with angular ordering
    |
    v
[extract face cycles] --> closed polygons = facets
    |
    v
[assign colors] --> painted facets
```

---

## 4. Where Our Approach Diverges

### What we do that's standard

- Visibility clipping of edges against occluding faces: standard
- Computing intersection lines between face pairs: standard
- Projecting to 2D: standard

### What's different

**We only find crossings between segments from different objects.** The standard approach finds ALL crossings — including two edges of ALPHA crossing each other in screen space, or an intersection line crossing an edge of the same object. By skipping same-object crossings, we miss split points. That means some segments aren't properly subdivided, so the graph has crossing edges, and face extraction breaks.

**We try to trace facets per-face instead of building a global arrangement.** The standard approach builds one big planar subdivision from ALL segments, then extracts faces. We try to handle each 3D face separately. The problem: intersection lines and occluding segments create regions that span the conceptual boundary between "this face's edges" and "that face's edges." A facet might be bounded on one side by ALPHA's edge AB, on another by the BETA-ALPHA intersection line, and on a third by ALPHA's edge CD. All three need to be in the same graph.

**We use occluding segments to connect boundary crossings.** This is an interesting idea — when an intersection line meets a face boundary, we add the occluding edge segment to bridge the gap. But the standard approach doesn't need this hack because the global arrangement naturally includes all the edges, and the DCEL connects everything through angular ordering at vertices.

### What's missing

1. **Same-object crossings in screen space.** Two edges of ALPHA can project to crossing segments. Without finding these crossings, the DCEL has crossing edges and face extraction fails. Example: on a rotated cube, the front-top edge and the back-bottom edge might cross in projection.

2. **A global DCEL instead of per-face tracing.** Per-face tracing requires knowing which segments belong to which face, and it breaks when segments serve as boundaries for multiple faces simultaneously (intersection lines always do this).

3. **Proper angular ordering at every vertex.** The cyclic sort of half-edges around each vertex is what makes face extraction work. If any vertex has incorrect ordering — or if edges pass through without being split — the `next` pointer chain breaks and face cycles are wrong.

4. **Face boundary edges as segments in the arrangement.** In the standard approach, the outline of each 3D face is itself a set of segments in the 2D arrangement. Intersection lines that end mid-face need to connect to these boundary edges through the arrangement graph. Without including boundary edges, intersection line endpoints are dangling — they don't connect to anything.

---

## 5. Simplest Correct Approach at Our Scale

With 20-40 segments and two objects, we don't need sweep lines or fancy algorithms. Here's the minimum viable path:

### The Recipe

1. **Collect all segments.** Every visible edge segment, every intersection line segment. One flat list. Don't separate by object or face. ~20-40 segments total.

2. **Brute-force all crossings.** Check every pair. With 40 segments, that's 780 pair checks. Trivial. Split segments at every crossing point. Use a tolerance for near-misses (endpoints that are almost-but-not-quite coincident).

3. **Build a vertex map.** Every endpoint and crossing becomes a vertex. Merge vertices within tolerance. Each vertex stores a list of connected half-edges.

4. **Create half-edges.** For each sub-segment, create two half-edges (one per direction). Compute the angle of each half-edge leaving its origin vertex.

5. **Sort and link.** At each vertex, sort outgoing half-edges by angle. For each half-edge H arriving at vertex V: find H's twin (which leaves V), find the next half-edge CCW after the twin in V's sorted list. That's H's `next`.

6. **Walk cycles.** Start at any unvisited half-edge, follow `next` until you return to the start. That's one face. Repeat until all half-edges are visited. Discard the unbounded face (largest area, or the one with clockwise winding).

7. **Color the faces.** For each face, pick an interior sample point. Determine which 3D face it projects onto. Use that face's material/color.

### Why this works at our scale

- Brute-force crossing detection: O(N^2) = ~800 operations. Fast.
- DCEL construction: O(N log N) at worst (sorting at vertices). Fast.
- Face extraction: O(N) — visit each half-edge once. Fast.
- Total implementation: maybe 200-300 lines of code. The DCEL is the only non-trivial part.

### The one tricky part

Numerical robustness. Floating-point crossings that are almost-coincident with endpoints. Two segments that are nearly collinear. The standard fix: use a tolerance epsilon, merge nearby vertices, and snap coordinates to a grid. Not glamorous but necessary.

---

## 6. How Intersection Lines Connect to Face Boundaries

This is the crux of the problem, and the standard answer is beautifully simple once you see it.

### The Situation

Take face ABCD on ALPHA (a rectangle with corners A, B, C, D). BETA's face cuts through it, creating intersection line PQ across the face. P sits on edge AB. Q sits on edge CD.

In 3D, P is a point on edge AB and Q is a point on edge CD. After projection to 2D, we have segments: A-P, P-B (edge AB, split at P), C-Q, Q-D (edge CD, split at Q), and P-Q (the intersection line).

### What the standard approach does

**Nothing special.** The intersection line endpoints P and Q are, by construction, points on existing edges. When you project everything to 2D and find all crossings, P shows up as a crossing between segment PQ and segment AB. Q shows up as a crossing between PQ and CD. The brute-force crossing finder handles this automatically.

After splitting at crossings:
- Edge AB becomes: A-P and P-B
- Edge CD becomes: C-Q and Q-D  
- Intersection line: P-Q
- Edges BC and DA remain whole (if no other crossings)

Now vertex P has three half-edges leaving it: toward A, toward B, and toward Q. Vertex Q has three half-edges: toward C, toward D, and toward P. Angular ordering at P and Q determines the face cycles.

Say face ABCD faces the camera. In screen space, the face boundary runs A -> B -> C -> D -> A. Intersection line PQ cuts across it. The DCEL produces two faces:

- Face 1: A -> P -> Q -> D -> A (one side of the cut)
- Face 2: P -> B -> C -> Q -> P (other side of the cut)

Both are valid closed cycles through the `next` pointers. No special "connection" logic needed.

### The key insight

**Intersection line endpoints ARE crossings.** They're crossings between the intersection line segment and the face boundary edges. The standard algorithm doesn't treat them differently from any other crossing. By finding ALL crossings (including between an intersection line and the edges of the face it cuts), the endpoints automatically get wired into the graph.

### Where our approach goes wrong

If we only look for crossings between segments from different objects, we find the crossing of PQ (from the ALPHA-BETA intersection) with... what? PQ is the intersection line. AB is ALPHA's edge. They're from the same face. If we skip same-face or same-object crossings, we never discover that P lies on AB. So P exists as an endpoint of PQ but doesn't connect to AB. The face boundary A-B doesn't get split. The DCEL can't form a closed cycle through P because P appears to be a dead end on edge AB.

**That's the bug.** The fix: find ALL crossings, regardless of which object or face the segments belong to.

### A concrete example with ALPHA and BETA

ALPHA is a box with visible face ABCD (front) and EFGH (top). BETA overlaps, cutting through both faces.

The intersection of BETA with face ABCD produces segment P1-Q1 (P1 on edge AB, Q1 on edge CD).
The intersection of BETA with face EFGH produces segment P2-Q2 (P2 on edge EF, Q2 on edge GH).

After collecting all segments:
- ALPHA edges: A-B, B-C, C-D, D-A, E-F, F-G, G-H, H-E, and the shared edges like B-F, C-G
- BETA visible edges: (whatever's visible)
- Intersection lines: P1-Q1, P2-Q2

Brute-force all crossings. P1 is found as a crossing of P1-Q1 with A-B. Q1 is found as crossing of P1-Q1 with C-D. Same for P2 and Q2. Every intersection line endpoint gets naturally wired into the edge graph.

Build the DCEL. Extract faces. Paint them. Done.

### One more subtlety

Sometimes an intersection line endpoint lands exactly on a face vertex (say P lands right on corner B). The standard fix: vertex merging with tolerance. P and B are within epsilon, so they merge into one vertex. That vertex now has all of B's edges plus the intersection line. The DCEL handles this fine — it's just a higher-degree vertex.

---

## Summary: What We Need to Build

1. **Flatten all segments into one list** — edges, intersection lines, everything
2. **Brute-force find ALL crossings** — no filtering by object or face
3. **Split segments at crossings, merge nearby vertices**
4. **Build a DCEL with angular ordering at each vertex**
5. **Walk half-edge cycles to extract faces**
6. **Color faces by sampling which 3D face they belong to**

The DCEL is the core data structure. Everything else is plumbing. The main insight we were missing: intersection line endpoints connect to face boundaries through the same crossing-detection pass that handles everything else. No special cases needed.
