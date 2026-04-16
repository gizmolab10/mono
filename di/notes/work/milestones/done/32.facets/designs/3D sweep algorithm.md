# Line Segment Arrangement Algorithm

How to find all crossings between projected line segments and split them into a clean planar graph. This is the core of the standard approach to hidden-line rendering.

## The big idea

Imagine a vertical line sweeping left to right across the screen. As it moves, it crosses some subset of the segments. The order of segments along the sweep line only changes at three kinds of events: a segment starts, a segment ends, or two segments cross. Between events, nothing changes.

The key insight: two segments can only cross if they are neighbors along the sweep line just before the crossing. So we only ever need to check neighboring pairs.

## The algorithm (Bentley-Ottmann)

Two data structures:

- **Event queue** — a priority queue ordered by x position (leftmost first). Starts with all segment endpoints. Intersection points get added as they're discovered.
- **Sweep status** — a sorted list of segments currently crossing the sweep line, ordered by their y position at the current x. Implemented as a balanced tree.

### Processing events

**Segment starts:** Insert it into the sorted status. Check if it crosses the neighbor above or the neighbor below. If yes, schedule those crossings. If the two neighbors were previously adjacent, cancel any crossing predicted between them (they're no longer neighbors).

**Segment ends:** Before removing it, find the neighbor above and neighbor below. Remove the segment. The two neighbors are now adjacent — check if they cross to the right of the sweep line.

**Two segments cross:** Record the crossing. Swap their positions in the status. Check the new neighbor pairs created by the swap.

### Why it finds everything

If two segments cross, there must be a moment just before the crossing when they're adjacent in the status. The algorithm always checks adjacent pairs when adjacencies change, so it always discovers the next crossing before it happens. No crossing can be missed.

## Building the graph (DCEL)

The sweep finds all crossing points. To get the planar graph (with enclosed regions), you build it as you go using a structure where every edge is stored as two directed half-edges running in opposite directions. Each half-edge knows its twin, the next edge around its face, and which face it borders.

At each event:
- Segment starts → create a new vertex and edge
- Segment ends → close the edge, link it into the face boundary
- Crossing → split both edges at the crossing point, rewire the connections

After the sweep, walk the half-edge chains to find all enclosed regions.

## Edge cases that break things

- **Same x position:** Break ties by y. Equivalent to a tiny rotation.
- **Vertical segments:** Treat bottom as start, top as end.
- **Three segments meeting at one point:** Delete all of them, record the crossing, re-insert in reversed order.
- **Shared endpoints:** Those are crossings too — process all segments starting at the same point together.
- **Floating-point errors:** The most serious problem. Rounding can make the ordering inconsistent (A above B, B above C, C above A). Exact arithmetic fixes this but is slow. Snapping to an integer grid is a practical alternative.

## Do we even need this?

For a small number of segments (under 100–200), brute force is simpler, faster, and more robust:

1. Test every pair of segments for crossing (for 100 segments, that's ~5000 tests — microseconds)
2. Collect all crossing points
3. Split every segment at its crossing points
4. Build the planar graph from the split segments

No balanced trees, no priority queues, no event ordering bugs. The sweep line only wins when you have thousands of segments.

**Our case:** We typically have 20–40 visible edge clips plus a few intersection lines. Brute force is the right choice.

## How this applies to our pipeline

The proposed rewrite:

1. **Visibility pass** — clip all edges and intersection lines against occluding faces. Output: a flat list of visible 2D segments, each tagged with its source (which edge or face pair).

2. **Arrangement pass** — brute-force all pairs, find every crossing, split both segments at each crossing. Output: a planar graph where no two segments cross in their interiors.

3. **Classification pass** — walk the planar graph to find enclosed regions. Each region inherits its SO and face from the segments that bound it. Assign endpoint labels (corner, intersection, crossing) based on the source tags.

This replaces the current five interleaved phases with three clean passes. The identity-matching complexity disappears because labels are assigned at the end, not during clipping.

## Scale and performance

Typical scene: 500 objects, each with 4–6 visible edges, so 2000–3000 visible segments plus intersection lines. Brute force all-pairs would mean millions of pair tests — too slow without filtering.

But the objects are spread across the screen, so most segments are far apart and can't possibly cross. A spatial index (Flatbush is already in the project) filters out pairs whose bounding boxes don't overlap. With good spatial spread, the actual crossing tests drop from millions to a few thousand — fast enough for per-frame computation.

**Decision: brute force + spatial index.** Sweep line is unnecessary for well-distributed geometry. If scenes later cluster heavily (many objects piled up in one area), upgrade to sweep line then.
