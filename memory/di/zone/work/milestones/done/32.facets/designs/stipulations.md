
# full set of stipulations

i think we need a set of stipulations to guide our design. otherwise we blunder around, which frankly is exactly what we are doing.

1. all objects are convex
2. objects that intersect create 2D facets
    1. the nearer object hides portions or all of the farther one

lines

3. facets are arbitrary shapes made out of visible straight lines
4. lines are either edges or intersection lines
    1. all lines are assigned to the visible faces it shares
    2. an edge is a silhouette when only one dihedral face is visible
5. lines are either part or whole
    1. parts happen when another SO occludes or intersects it
    2. creates one or more visible parts, one invisible (excluded) part
    3. edges that exactly cross (are co planar), creates four visible parts, none are invisible
    4. lines have two visible endpoints
    5. no two segments on the same face may connect the same pair of endpoints — duplicates are removed
6. two edges that exactly cross -> split at the same ('cross' type) world point
    1. both edges do NOT actually pierce a face
    2. each cross point connects to lots of segments

points

7. each has exactly one key
    1. if two discovery paths find the same point, they produce the same key
    2. two endpoints with the same key MUST be at the IDENTICAL screen position
    3. nearby split points on the same edge (within a world-distance threshold) are the same point — merge them. **Caveat:** the threshold is in world units; different scenes with different scales might need different thresholds.
8. types are either corner, cross, occlude, or pierce
    1. corner is where two or more edges of one SO meet
    2. pierce is when an edge or intersection line ends at a face of another SO
    3. cross is when edges from two SOs intersect at the same 3D point (coplanar)
    4. occlude is when edges from two SOs cross on screen but are at different depths (non-coplanar)
    5. preferred type: corner > cross > occlude > pierce
9. at the end of a line -- connects to at least one other line
    1. one point
    2. lines can belong to different objects
10. has one or more faces assigned to it
    1. endpoint of a line where it pierces another SO's face boundary is also assigned to that face
    2. two edges that cross are always from two SOs' faces, the cross endpoint is assigned to both
    3. an edge that has two faces (of the same SO) visible cannot also be assigned to another SO
    4. a silhouette of one object that crosses another object's edge is also assigned to that other object's face
    5. exclude any segment that ends at a corner (of another object) not inside a face of the first object

traces

11. tracing visits endpoints that are assigned to a single face (the face's segment list)
    1. tracing always starts from a corner, and proceeds along the clockwise edge
    2. at each point, the next segment is clockwise, according to screen space angles at that point
    3. if a point is revisited, stop -> that is a facet
    4. if a point is a dead end -> DUD (ignored)
    5. examine all segments of a trace, if none are on an edge -> DUD
    6. each traced segment is removed from the list, unless the trace is a DUD
    7. each traced corner is removed from the list of vertices, unless the trace is a DUD
    8. after all corners have begun a trace, use one of the remaining list of segments to begin a trace