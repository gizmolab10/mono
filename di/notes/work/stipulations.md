
# full set of stipulations

i think we need a set of stipulations to guide our design. otherwise we blunder around, which frankly is exactly what we are doing.

1. all objects are convex
2. objects that intersect create 2D facets
    1. the nearer object hides the farther one (projected screen depth)
3. facets are arbitrary shapes made out of visible straight lines
4. lines are either edges or intersection lines
    1. all lines are assigned to the visible faces it shares
    2. an edge is a silhouette when only one dihedral face is visible
5. lines are either part or whole
    1. parts happen when another SO occludes it
    2. creates one or more visible parts, one invisible (excluded) part
6. lines have two endpoints
    1. both must be visible
    2. are either corner, cross, or pierce
        1. corner is where two or more edges of one SO meet
        2. pierce is when an edge or intersection line ends at a face of another SO
        3. cross is when edges from two SOs intersect, somewhere along the lengths of both
        4. corner wins over pierce and cross, cross wins over pierce
7. each endpoint has exactly one key -- if two discovery paths find the same point, they produce the same key
    1. two endpoints with the same key MUST be at the IDENTICAL screen position
8. each endpoint of a line segment connects to at least one other line
    1. the other lines share the endpoint
    2. the other lines can belong to different objects
9. the endpoint has one or more faces assigned to it
    1. endpoint of a line where it pierces another SO's face boundary is also assigned to that face
    2. two edges that cross are always from two SOs' faces, the cross endpoint is assigned to both
    3. an edge that has two faces (of the same SO) visible cannot also be assigned to another SO
    4. a silhouette of one object that crosses another object's edge is also assigned to that other object's face
    5. exclude any segment that ends at a corner (of another object) not inside a face of the first object
10. tracing visits endpoints that are assigned to a single face
    1. a trace must close (return to its starting point) to form a facet
    2. an unclosed trace is a DUD and is ignored
    3. a trace that does not include at least one edge of its own object is unpainted
