# Map visual language

## Territory lines

The map should feel like a hand-drawn territory map — not geometric, not computed. Voronoi gives us the spatial logic (seed points, nearest-neighbor regions), but the borders themselves should wander.

### What the lines do

- change direction (cutbacks, not smooth curves)
- vary in thickness along their length
- shift color or fade/blur in places
- feel like someone drew them without lifting the pen

### What they are

Static, pre-built assets. Not generated at runtime from math. The Voronoi structure informs placement, but the lines are aesthetically tweaked by hand (or in Phaser Editor) until they feel right.

### Opposite of

- bubble/cell boundaries (pure straight lines)
- smooth bezier curves
- anything that looks computed

### When

Design exploration — not yet implemented. Revisit when the map moves beyond tent-triangles into real territory layout.
