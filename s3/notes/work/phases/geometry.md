# Geometry System — Design Spec

Sources: `ws/src/lib/ts/geometry/` and `ws/src/lib/ts/managers/Geometry.ts`

---

## Coordinates.ts

**Location:** `ws/src/lib/ts/types/Coordinates.ts`

Three core types used everywhere in the geometry system.

### `Polar`

```ts
class Polar { r: number; phi: number; }
```

- `r`: radius
- `phi`: angle in radians
- `asPoint`: converts to `Point` via `Point.fromPolar`

### `Point`

```ts
class Point { x: number; y: number; }
```

**Coordinate convention:** y increases downward (browser convention). Angles increase counter-clockwise in math space, but `rotate_by` reverses y to match browser rendering. `angle` getter negates y before `atan2` to convert browser y back to math convention.

**Static constructors:**
- `Point.zero` — `(0, 0)`
- `Point.x(x)` — `(x, 0)`
- `Point.y(y)` — `(0, y)`
- `Point.square(n)` — `(n, n)`
- `Point.fromPolar(r, phi)` — rotates `Point.x(r)` by `phi`
- `Point.fromDOMRect(rect)` — `(rect.left, rect.top)`
- `Point.origin_inWindowCoordinates_for(element)` — walks `offsetParent` chain

**Key computed properties:**
- `magnitude` — Euclidean length
- `angle` — `atan2(-y, x)`, math convention
- `abs` — `(|x|, |y|)`
- `negated` — `(-x, -y)`
- `dividedInHalf` — `(x/2, y/2)`
- `asSize` — reinterprets as `Size(x, y)` (can be negative)
- `asPolar` — `Polar(magnitude, angle)`
- `swap` — `(y, x)`

**Operations (all return new Point):**
- `offsetBy(point)`, `offsetByXY(x, y)`, `offsetByX(x)`, `offsetByY(y)`, `offsetEquallyBy(n)`
- `multipliedEquallyBy(n)`, `dividedEquallyBy(n)`
- `spreadByXY(x, y)` — component-wise multiply
- `multiply_xBy(n)`, `multiply_yBy(n)`
- `vector_to(point)` — `point - this`
- `rotate_by(angle)` — counter-clockwise rotation, y reversed for browser

**Hit testing:**
- `isContainedBy_path(path: string)` — creates temp canvas, uses `Path2D` + `isPointInPath`

**Quadrant and orientation:**
- `quadrant_ofPoint` — returns `T_Quadrant` enum (upperRight/upperLeft/lowerLeft/lowerRight)
- `orientation_ofVector` — returns `T_Orientation` (right/up/left/down) based on angle within quadrant

### `Size`

```ts
class Size { width: number; height: number; }
```

**Static constructors:**
- `Size.zero`, `Size.square(n)`, `Size.width(w)`, `Size.height(h)`
- `Size.fromDOMRect(rect)`

**Key computed properties:**
- `asPoint` — `Point(width, height)`
- `center` — `asPoint.dividedInHalf`
- `proportion` — `width / height`
- `dividedInHalf` — `dividedEquallyBy(2)`

**Operations (all return new Size):**
- `extendedByXY(x, y)`, `extendedByX`, `extendedByY`
- `reducedBy(point)`, `reducedByX`, `reducedByY`, `reducedByXY`
- `insetEquallyBy(delta)` — expands by `2 * -delta` (shrinks)
- `expandedEquallyBy(delta)`
- `multipliedEquallyBy(n)`, `dividedEquallyBy(n)`, `dividedBy(size)`
- `best_ratio_to(size)` — `min(w/w, h/h)` — used for fit-to-screen

### `Rect`

```ts
class Rect { origin: Point; size: Size; }
```

**Static constructors:**
- `Rect.zero`
- `Rect.createSizeRect(size)` — origin at zero
- `Rect.createWHRect(w, h)`
- `Rect.createExtentRect(origin, extent)` — origin + `vector_to(extent).asSize`
- `Rect.createCenterRect(center, size)` — centered on point
- `Rect.createRightCenterRect(rightCenter, size)`
- `Rect.createFromDOMRect(domRect)` — adjusts for scroll offset
- `Rect.rect_forElement(element)` — `getBoundingClientRect` → `Rect`
- `Rect.rect_forComponent(c: SvelteComponent)` — `offsetTop/Left/Width/Height`

**Derived points:**
- `extent` — `origin + size.asPoint` (bottom-right corner)
- `center` — `origin + size.center`
- `topRight`, `bottomLeft`, `centerTop`, `centerBottom`, `centerLeft`, `centerRight`

**Derived scalars:** `x`, `y`, `width`, `height`, `right`, `bottom`

**Operations (return new Rect):**
- `offsetBy(delta)`, `offsetByXY`, `offsetByX`, `offsetByY`, `offsetEquallyBy`
- `extend_widthBy(w)`, `expand_heightBy(h)`, `expand_sizeBy(ratio)`
- `expandedBy(expansion: Point)` — grows size and shifts origin
- `multiply_xBy`, `multiply_yBy`, `originMultipliedBy`, `multipliedEquallyBy`, `dividedEquallyBy`
- `centeredRect_ofSize(size)` — new rect of given size centered on this rect's center
- `normalized` — flips negative width/height in-place (mutates, returns self for chaining)
- `atZero`, `atZero_forX`, `atZero_forY` — zero out origin axes

**Spatial tests:**
- `contains(point)` — inclusive bounds check
- `intersects(rect)` — separating axis theorem; zero-dimension rects treated as lines
- `clippedTo(bounds)` — intersection rect, zero-size if no intersection

**Angle/corner helper:**
- `corners_forAngle(angle)` — returns `[Point, Point]` pair based on quadrant; used for line endpoints

**`asBBox`:** returns `{ minX, minY, maxX, maxY }` for rbush spatial indexing

---

## G_Widget

**Location:** `ws/src/lib/ts/geometry/G_Widget.ts`

Single-source geometry record for one tree node widget. Every `Ancestry` owns one `G_Widget`. It is the scratchpad for all layout values for that widget — positions of dots, title, connecting lines, subtree dimensions.

### Fields

| Field | Type | Purpose |
|---|---|---|
| `g_bidirectionalLines` | `G_TreeLine[]` | Lines to bidirectional relatives |
| `location_within_necklace` | `Point` | Raw position on the radial ring (set by `G_Cluster`) |
| `timestamp` | `number` | Creation time (milliseconds) |
| `g_parentBranches` | `G_TreeBranches` | Future use — parent branch layout |
| `g_childBranches` | `G_TreeBranches` | Child branch layout scratchpad (holds subtree size, center) |
| `location_ofRadial` | `Point` | Computed radial widget origin (adjusted from necklace location) |
| `offset_ofWidget` | `Point` | CSS transform offset applied to widget element |
| `origin_ofWidget` | `Point` | Widget origin in tree focus mode |
| `origin_ofRadial` | `Point` | Radial-mode widget origin (further adjusted for reveal direction) |
| `origin_ofTrunk` | `Point` | Tree-mode widget origin (derived from `g_line.rect.extent`) |
| `origin_ofTitle` | `Point` | Title element origin within widget |
| `center_ofDrag` | `Point` | Center of the drag dot (within widget coordinate space) |
| `center_ofReveal` | `Point` | Center of the reveal dot (within widget coordinate space) |
| `size_ofSubtree` | `Size` | Width/height of this widget's visible subtree (height set during branch layout) |
| `reveal_isAt_right` | `boolean` | Whether the reveal dot is on the right side (vs left, for reverse-pointing radial items) |
| `pointsTo_child` | `boolean` | Whether this widget's reveal arrow points to children (vs parents) |
| `g_cluster` | `G_Cluster` | The radial cluster this widget belongs to |
| `s_widget` | `S_Widget` | Svelte state for this widget |
| `g_line` | `G_TreeLine` | The connecting line from parent to this widget |
| `ancestry` | `Ancestry` | The ancestry this widget represents |
| `width_ofWidget` | `number` | Computed widget width |
| `t_graph` | `T_Graph` | Cached graph type at construction time |

### Computed Properties

**`origin`** — The authoritative origin for this widget, switching on `t_widget`:
- `T_Widget.radial` → `location_ofRadial`
- `T_Widget.focus` → `origin_ofWidget`
- default (tree) → `origin_ofTrunk`

**`t_widget`** (private) — `T_Widget.radial` if `show.inRadialMode`, `T_Widget.focus` if `ancestry.isFocus`, else `T_Widget.tree`

**`showingReveal`** — delegates to `ancestry.showsReveal_forPointingToChild(this.pointsTo_child)`. Returns whether the reveal triangle/dot is currently shown.

**`reveal_count`** — number of items the reveal dot represents:
- If no cluster, or cluster is `isCluster_ofChildren`: `ancestry.children.length`
- Otherwise: `ancestry.count_ofParents`

**`absolute_center_ofDrag`** — `origin.offsetBy(center_ofDrag)` — absolute screen position

**`absolute_center_ofReveal`** — `origin.offsetBy(center_ofReveal)` — absolute screen position

**`origin_ofGraphDrawing`** — `origin_ofRadial` in radial mode, else `origin`

**`html_element`** — delegates to `s_widget.html_element`

### Width/Height Computation (`layout()`)

Called in all layout paths. Uses `ancestry.thing.width_ofTitle` as the basis.

```
dot_size = k.height.dot

width_ofReveal_dot = showingReveal ? dot_size : 0

width_ofDrag = (dot_size * 2) + (inRadialMode ? 2 : -4)

width_ofWidget =
  isRadialFocus ? width_ofTitle + 18
                : width_ofTitle + width_ofDrag + width_ofReveal_dot + (inRadialMode ? 0 : 4) - 5
```

**`center_ofDrag`:**
```
x_ofDrag = reveal_isAt_right
  ? 2
  : width_ofWidget - dot_size - 1.25 + (show_reveal ? 0.5 : 0)

origin_ofDrag = Point(x_ofDrag, 2.8)
center_ofDrag = origin_ofDrag.offsetEquallyBy(dot_size / 2)
```

**`center_ofReveal`** (only set when `showingReveal`):
```
y_ofReveal = dot_size - 3.8
x_offsetFor_revealAt_right = width_ofWidget - dot_size - 10
x_ofReveal = dot_size + (reveal_isAt_right ? x_offsetFor_revealAt_right : -3)
center_ofReveal = Point(x_ofReveal, y_ofReveal)
```

**`origin_ofTitle`:**
```
x_ofRadial_title = (reveal_isAt_right && !isRadialFocus) ? 19 : (show_reveal ? 22 : 10)
origin_ofTitle = Point.x(inRadialMode ? x_ofRadial_title : dot_size + 5)
```

**`location_ofRadial`** (not set if `isRadialFocus`):
```
x_ofRadial = reveal_isAt_right ? -4 : -dot_size
location_ofRadial = location_within_necklace.offsetByXY(x_ofRadial + 4, 6 - dot_size)
```

**`origin_ofRadial`:**
```
origin_ofRadial = location_ofRadial.offsetByX(
  reveal_isAt_right ? 0 : -width_ofTitle - width_ofReveal_dot
)
```

**`offset_ofWidget`:**
```
x_offset_ofWidget = reveal_isAt_right ? -7 : 6 + dot_size - width_ofWidget
offset_ofWidget = Point(x_offset_ofWidget + (ancestry.isFocus ? 5 : 0), 0.5)
```

### Layout Entry Points

**`layout()`** — computes all widget-local geometry (dot positions, width, origin tweaks). No recursive calls. Requires subtree layout to have run already for progeny size.

**`layout_one_generation()`** — calls `layout()`, then `layout_origin_ofTrunk()`, then `g_childBranches.layout()`. The "heavy lifter" per the comment.

**`layout_origin_ofTrunk()`** — tree mode only. Derives `origin_ofTrunk` from `g_line.rect.extent.offsetByXY(k.height.row, -8.6)`, then calls `g_line.layout()`.

**`layout_necklaceWidget(rotated_origin, reveal_isAt_right)`** — radial mode. Sets `t_graph`, `location_within_necklace`, `reveal_isAt_right`, then calls `layout()`.

**`layout_each_generation_recursively(depth, visited)`** — DFS over `branchAncestries`. Lays out progeny first (depth-first), then `layout_one_generation()` on self. Skips already-visited ancestries.

**`layout_each_bidirectional_generation_recursively(depth, visited, bidirectionals)`** — tree mode only, when `show.w_show_related` is on. Lays out bidirectional lines per generation, deduplicating against already-processed lines.

**`layout_subtree_for(height, origin, t_graph, pointsTo_child, reveal_isAt_right)`** — called from `G_TreeBranches.layout()` for each child. Computes `origin_ofWidget` and `g_line.rect`, sets `size_ofSubtree.height`, then calls `layout_one_generation()`. Only runs if `t_graph` matches `show.w_t_graph`.

**`layout_bidirectional_lines(bidirectionals)`** — collects `g_lines_forBidirectionals` from ancestry, deduplicates, calls `g_line.layout()` on each new one.

### Private Helpers

**`origin_forAncestry_inRect(ancestry, rect)`** — positions widget within a branch rect:
```
y = rect.extent.y - ancestry.halfHeight_ofVisibleSubtree
x = rect.origin.x + thing.width_ofTitle + k.height.dot * 2 + k.width.child_gap - 7
```

---

## G_TreeGraph

**Location:** `ws/src/lib/ts/geometry/G_TreeGraph.ts`

Root-level controller for tree-mode layout. Singleton exported as `g_graph_tree`. Owns the focus ancestry and coordinates layout of the full tree.

### Fields

| Field | Type | Purpose |
|---|---|---|
| `attached_branches` | `string[]` | IDs of branches already attached to the DOM in the current render pass |
| `focus` | `Ancestry` | Current focus ancestry (subscribed from `x.w_ancestry_focus`) |

### Writable Stores (on `Geometry` manager, used here)

- `g.w_depth_limit` — max recursion depth for layout
- `g.w_rect_ofGraphView` — current graph view rect

### Key Methods

**`layout()`** — full tree layout sequence:
1. Gets `rect_ofGraphView` and `depth_limit`
2. `layout_focus_ofTree(rect)` — positions focus widget (preliminary, acknowledged as "wrong" in comment)
3. `g_focus.layout_each_generation_recursively(depth_limit)` — DFS layout of all visible generations
4. `g_focus.layout_each_bidirectional_generation_recursively(depth_limit)` — bidirectional lines
5. `adjust_focus_ofTree(rect)` — corrects focus widget's final position

**`g_focus`** — computed: `focus?.g_widget`

**`visible_g_widgets`** — traverses the focus ancestry, collecting `g_widget` for each `isVisible` ancestry.

**`reset_scanOf_attached_branches()`** — clears `attached_branches = []`, returns `true` to signal Svelte to reattach the tree. Called before each render pass.

**`branch_isAlready_attached(ancestry)`** — checks if `ancestry.id` is in `attached_branches`; if not, adds it. Used to prevent double-rendering of shared branches.

**`increase_depth_limit_by(increment)`** — updates `g.w_depth_limit` and calls `g.layout()`.

**`set_tree_types(t_trees)`** — sets which kinship types are shown (children, related, etc.), triggers `grand_build`.

### Private Layout Helpers

**`layout_focus_ofTree(rect)`** — preliminary focus positioning:
```
subtree_size = focus.size_ofVisibleSubtree
x_offset_ofFirstReveal = focus.thing.width_ofTitle / 2 - 2
y_offset_ofFirstBranches = (dot/2) - (subtree_height/2) - 5
x_offset_ofFirstBranches = -8 - dot + x_offset_ofFirstReveal
x_offset = (details_offset) + 5 + x_offset_ofFirstReveal - (subtree_width/2) - (dot/2.5)
origin_ofFocusReveal = rect.center.offsetByXY(x_offset, -y_offset)
g_focus.origin_ofWidget = origin_ofFocusReveal.offsetByXY(x_offset_ofFirstBranches, y_offset_ofFirstBranches)
```
On mobile: `origin_ofFocusReveal.x = 25`.

**`adjust_focus_ofTree(rect)`** — corrects final focus position:
```
y_offset = -1 - rect.origin.y
x_offset_ofReveal = focus.thing.width_ofTitle / 2 - 2
x_offset_forDetails = show_details ? -k.width.details : 0
x_offset = x_offset_forDetails - (subtree_width/2) - (dot/2.5) + x_offset_ofReveal - 5
origin_ofFocusReveal = rect.center.offsetByXY(x_offset, y_offset)
g_focus.origin_ofWidget = origin_ofFocusReveal.offsetByXY(-21.5 - x_offset_ofReveal, -5)
```

---

## G_TreeBranches

**Location:** `ws/src/lib/ts/geometry/G_TreeBranches.ts`

Scratchpad for the set of child branches hanging off one widget. Computes vertical distribution of children and the origin of the branch line group. Each `G_Widget` owns two instances: `g_parentBranches` (future) and `g_childBranches`.

### Fields

| Field | Type | Purpose |
|---|---|---|
| `show_child_branches` | `boolean` | Whether child branches should be shown (false for parent branches instance) |
| `origin_ofLine` | `Point` | Where the vertical trunk line starts for this branch group |
| `ancestry` | `Ancestry` | The ancestry whose children are being laid out |
| `size` | `Size` | Bounding size of all child branches combined |

### `layout()`

Runs only in tree mode, when ancestry is expanded (or root). No-op otherwise.

**Vertical distribution algorithm:**
```
halfHeight = ancestry.halfHeight_ofVisibleSubtree
origin_ofWidget = g_widget.origin_ofWidget.offsetByXY(1, halfHeight + 1)
height = -halfHeight    // starts negative, grows positive

for each branchAncestry (where branchAncestry.depth > ancestry.depth):
    g_widget_ofBranch.layout_subtree_for(height, origin_ofWidget, T_Graph.tree)
    width = max(width, g_widget_ofBranch.width_ofWidget)
    height += g_widget_ofBranch.size_ofSubtree.height

this.size = Size(width, height + halfHeight)
this.origin_ofLine = origin_ofWidget.offsetByXY(25, 1.2)
```

Children are stacked vertically starting from `halfHeight` above the parent's widget center. Each child's `layout_subtree_for` receives the running `height` value (how far down from the anchor point this child starts).

**`origin_ofLine`** — the start point of the vertical trunk line connecting parent to its children block, offset 25px right and 1.2px down from the widget anchor.

---

## G_TreeLine

**Location:** `ws/src/lib/ts/geometry/G_TreeLine.ts`

Scratchpad for one SVG connecting line between a parent widget and a child (or bidirectional partner) widget. Holds the SVG path string and bounding geometry.

### Fields

| Field | Type | Purpose |
|---|---|---|
| `t_curve` | `string` | Line curve type: `T_Tree_Line.flat`, `.up`, or `.down` |
| `ancestry` | `Ancestry \| null` | "Main" end of the line (not always the shallower one) |
| `other_ancestry` | `Ancestry` | Other end of the line |
| `isBidirectional` | `boolean` | Whether this is a bidirectional relationship line |
| `points_atOther` | `boolean` | Direction of arrowhead |
| `origin` | `Point` | SVG start point of the line |
| `extent` | `Point` | SVG end point of the line |
| `linePath` | `string` | The SVG `d` attribute string |
| `rect` | `Rect` | Bounding rect (set externally by `G_Widget.layout_subtree_for`) |
| `size` | `Size` | Computed from `|origin - extent|` |
| `stroke_width` | `number` | SVG stroke width |
| `name` | `string` | Debug name (`parent.titles...child.titles`) |

### Computed Properties

**`branchAncestry`** — `points_atOther ? other_ancestry : ancestry` — whichever end the arrowhead points at.

**`depth_ofLine`** — `max(ancestry.depth, other_ancestry.depth)` — used for rendering order.

### Curve Type

Set by **`set_curve_type_forHeight(height)`**:
- `height > 1` → `T_Tree_Line.down`
- `height < -1` → `T_Tree_Line.up`
- else → `T_Tree_Line.flat`

### `layout()`

Calls `layout_svgPaths()` then `update_name()`.

### `layout_svgPaths()` (private)

Applies a fixed offset of `(-118.5, 1.5)` to `this.rect`, then shrinks width by 4:
```
lineOffset = Point(-118.5, 1.5)
lineRect = rect.offsetBy(lineOffset).extend_widthBy(-4)
```

Then branches on `t_curve`:

**`T_Tree_Line.flat`:**
```
lineRect = lineRect.offsetByY(-1)
origin = lineRect.centerLeft
extent = lineRect.centerRight
linePath = svgPaths.line(origin.vector_to(extent))
```

**`T_Tree_Line.up`:**
```
origin = lineRect.origin
extent = lineRect.extent.offsetByY(-1.5)
```

**`T_Tree_Line.down`:**
```
origin = lineRect.bottomLeft.offsetByY(-0.5)
extent = origin.offsetBy(lineRect.size.asPoint).offsetByY(0.5)
```

For up/down curves, the SVG arc path:
```
size = |origin - extent|.asSize
flag = (t_curve == down) ? 0 : 1
originY = (t_curve == down) ? 0 : size.height
extentY = (t_curve == up) ? 0 : size.height
linePath = `M0 ${originY} A ${size.description} 0 0 ${flag} ${size.width} ${extentY}`
```

This produces an SVG arc (`A` command) where the arc bows left for up-curving lines and right for down-curving lines.

---

## G_Cluster

**Location:** `ws/src/lib/ts/geometry/G_Cluster.ts`

Handles all positioning for one cluster of widgets in radial mode. There are up to three clusters per focus: one for children, one for parents, one for bidirectional relationships. Each cluster has its own angle on the ring.

### Fields

| Field | Type | Purpose |
|---|---|---|
| `g_cluster_pager` | `G_Cluster_Pager` | Arc and fork geometry for the visible portion of this cluster |
| `g_thumbArc` | `G_Cluster_Pager` | Arc geometry for the paging thumb slider |
| `ancestries_shown` | `Ancestry[]` | The currently-visible page of ancestries |
| `g_cluster_widgets` | `G_Widget[]` | `G_Widget` for each shown ancestry |
| `ancestries` | `Ancestry[]` | All ancestries in this cluster (full list) |
| `color` | `string` | Arc color (from focus thing's color, opacity 0.2) |
| `isCluster_ofChildren` | `boolean` | True for child cluster, false for parent cluster |
| `arc_in_lower_half` | `boolean` | Whether the arc center is in the lower half of the ring |
| `label_center` | `Point` | Position of the cluster label |
| `cluster_title` | `string` | Label text (e.g. "5 children" or "5 children (2-4)") |
| `predicate` | `Predicate` | The predicate kind this cluster represents |
| `center` | `Point` | Graph view center (set during layout) |
| `widgets_shown` | `number` | Count of visible widgets in current page |
| `total_widgets` | `number` | Total widgets in cluster |
| `isPaging` | `boolean` | `widgets_shown < total_widgets` |
| `row_height` | `number` | Vertical spacing between widgets on the ring, scaled by radius |

### Cluster Angle

**`angle_ofCluster`** — one of three equilateral angles:
```
tweak = 2π/3   (120°, for equilateral distribution)
children_angle = get(radial.w_rotate_angle)   (global rotation)

if predicate.isBidirectional: children_angle + tweak
else if isCluster_ofChildren:  children_angle
else:                          children_angle - tweak
```

### `layout()`

Main layout sequence (runs when there are shown ancestries):
1. Sets `widgets_shown`, `isPaging`, `center`
2. Sets `color` from focus thing's color at 0.2 opacity
3. `g_cluster_pager.angle_ofCluster = angle_ofCluster`, then `g_cluster_pager.layout()`
4. `layout_cluster_widgets()` — positions each widget on the ring
5. `g_cluster_pager.layout_forkTip(center)` — places the fork tip point
6. `layout_label()` — computes label position and rotation
7. `layout_thumb_angles()` — sets thumb arc start/end angles
8. `update_label_forIndex()` — updates label text with paging info
9. `signals.signal_reposition_widgets_fromFocus()` — triggers re-render

### Widget Positioning (`layout_cluster_widgets()`)

```
inset = k.thickness.radial.ring / 1.5
radial_vector = Point.x(ring_radius + inset)
fork_points_right = radial_vector_ofFork.x > 0
center = graphView_center.offsetByXY(0.5, -1)

for index in 0..widgets_shown:
    adjusted_index = fork_points_right ? (widgets_shown - index - 1) : index
    angle = angle_at_index(adjusted_index)
    rotated_origin = center.offsetBy(radial_vector.rotate_by(angle))
    g_widget.layout_necklaceWidget(rotated_origin, angle_points_right)
```

When the fork points right, the index order is reversed so widgets read top-to-bottom regardless of fork direction.

### Angle Calculation (`angle_at_index(index)`) — private

Distributes widgets vertically (equal row spacing), converting y-position to ring angle:
```
max = widgets_shown - 1
row = (max / 2) - index        // center at fork, distribute around it
radial_vector = radial_vector_ofFork  // points at cluster midpoint
y = radial_vector.y + (row * row_height)

if |y| > radius:               // y is outside the ring
    y_isOutside = true
    y = radius * (y/|y|) - (y % radius)   // wrap around top/bottom back inside

child_angle = asin(y / radius)
if y_isOutside != (radial_vector.x > 0):
    child_angle = π - child_angle          // flip to other side of ring
```

This gives constant vertical spacing while staying on the ring, wrapping around top or bottom if there are many items.

### `row_height`

Computed on construction and whenever `radial.w_resize_radius` changes:
```
base_row_height = k.height.dot + 3
inset = k.thickness.radial.ring / 1.5
row_height = base_row_height * radius / (radius + inset)
```

Shrinks slightly as radius decreases relative to inset.

### Arc Angles

`update_arc_angles(index, max, child_angle)` — called inside `angle_at_index`:
- When `index == max`: sets `g_cluster_pager.start_angle`
- When `index == 0`: sets `g_cluster_pager.end_angle`

`finalize_angles()` — if fork doesn't point right, swaps start/end; then computes `arc_rect`.

### Paging

**`layout_forPaging()`** — called by `G_RadialGraph` after computing how many widgets to show:
1. Gets `g_paging`, computes `points_right`
2. Gets `onePage_from(widgets_shown, ancestries)` — sliced subset
3. Reverses if `points_right` (for correct visual order)
4. Calls `layout()`, returns absolute spread angle

**`adjust_paging_index_byAdding_angle(delta_angle)`** — maps drag rotation delta to index delta:
```
sensitivity_multiplier = π * spread_angle * 5 / min(18, max_index^0.5)
delta_fraction = delta_angle * sensitivity_multiplier / spread_angle
delta_index = delta_fraction * max_index
paging.addTo_paging_index_for(delta_index)
```

**`layout_thumb_angles()`** (private) — computes start/end angles for the thumb arc slider. Handles the case where arc straddles nadir (bottom of ring).

### Label

**`layout_label()`** (private):
```
angle = g_cluster_pager.angle_ofFork
ortho = arc_in_lower_half ? Angle.three_quarters : Angle.quarter
tweak = [10, 7, -17.4, -22.4][u.convert_toNumber([arc_in_lower_half, true])]
label_radius = ring_radius + tweak
label_center = center.offsetBy(Point.fromPolar(label_radius, angle))
g_cluster_pager.label_text_angle = ortho - angle
```

**`update_label_forIndex()`** — builds label text:
- Not paging: `"N children"` (or `"parents"`, `"related"`)
- Paging: `"N children (first-last)"`

### Mouse Hit Testing

**`isMouse_insideThumb`** — uses `Point.isContainedBy_path` against `g_thumbArc.svgPathFor_arcSlider`. Only true when `isPaging`.

---

## G_Cluster_Pager

**Location:** `ws/src/lib/ts/geometry/G_Cluster_Pager.ts`

Computes SVG arc paths for one arc — either the main cluster arc or the thumb slider arc. Used twice per cluster (`g_cluster_pager` and `g_thumbArc`).

### Fields

| Field | Type | Purpose |
|---|---|---|
| `label_text_angle` | `number` | Rotation angle for label text (radians) |
| `clusters_center` | `Point` | Center point for arc SVG paths (`Point.square(radius)`) |
| `label_center` | `Point` | Position of label (set by `G_Cluster.layout_label`) |
| `tip_ofFork` | `Point` | Position of the fork tip (set by `layout_forkTip`) |
| `outside_arc_radius` | `number` | Outer edge of arc band |
| `inside_arc_radius` | `number` | Inner edge of arc band |
| `arc_rect` | `Rect` | Bounding rect of the arc (computed by `finalize_angles`) |
| `angle_ofCluster` | `number` | The cluster's central angle |
| `isThumb` | `boolean` | Whether this is a thumb slider (smaller, inset) |
| `fork_radius` | `number` | Radius of the fork circle at the tip |
| `start_angle` | `number` | Arc start angle |
| `cap_radius` | `number` | Radius of arc end caps |
| `end_angle` | `number` | Arc end angle |

### Radii (set in constructor)

**Main arc (`isThumb = false`):**
```
outside_arc_radius = radius + k.thickness.radial.arc + 1
cap_radius = k.radius.arcSlider_cap
inside_arc_radius = radius + 1
```

**Thumb arc (`isThumb = true`):**
```
delta = k.thickness.separator.main / 3
outside_arc_radius = radius + k.thickness.radial.arc - delta + 1
cap_radius = k.radius.arcSlider_cap - delta
inside_arc_radius = radius + delta + 1
```
Thumb is inset from the main arc by `delta` on each side.

### Computed Properties

**`angle_ofFork`** — midpoint of `(start + end) / 2`, adjusted for nadir straddle:
```
offset_ofNadir = (arc_straddles_nadir && !arc_straddles(0)) ? π : 0
angle_ofFork = (end_angle + start_angle) / 2 - offset_ofNadir
```

**`spread_angle`** — `end_angle - start_angle`

**`arc_straddles_nadir`** — `arc_straddles(Angle.three_quarters)` (3π/2)

**`straddles_zero`** — `end_angle.straddles_zero(start_angle)`

**Direction predicates** (based on `angle_ofCluster`):
- `fork_slants_forward`, `fork_points_right`, `fork_points_down`

### `layout()`

Computes `fork_radius`:
```
fork_raw_radius = k.thickness.radial.ring * 0.6
fork_backoff = fork_adjustment(fork_raw_radius, inside_arc_radius)
fork_radius = fork_raw_radius - fork_backoff
```

`fork_adjustment` pulls the fork circle back so it sits flush against the inside arc edge (geometric correction using `asin`).

### `layout_forkTip(center)`

```
radial_vector = Point.fromPolar(inside_arc_radius, angle_ofFork)
tip_ofFork = center.offsetBy(radial_vector)
```

### `finalize_angles()`

Swaps `start_angle` / `end_angle` if `!fork_points_right`, then computes `arc_rect = compute_arc_rect`.

### `compute_arc_rect`

Builds bounding rect from start/end radial vectors plus `cap_radius`:
```
end_radial = radial_vector_atAngle(end_angle)
start_radial = radial_vector_atAngle(start_angle)
origin.x = min(start_radial.x, end_radial.x) - cap_radius
origin.y = min(start_radial.y, end_radial.y) - cap_radius
extent.x = max(start_radial.x, end_radial.x) + cap_radius
extent.y = max(start_radial.y, end_radial.y) + cap_radius
```

Where `radial_vector_atAngle(angle) = Point.fromPolar(inside_arc_radius + cap_radius, angle)`.

### SVG Path Generation

**`svgPathFor_arcSlider`** — calls `svgPathFor_arcSlider_using(inside, outside, cap_radius)`

**`svgPathFor_fatArc`** — uses full `ring_radius` to `ring_radius + ring_thickness`, `cap = ring/2`. Used for the visual arc background.

**`svgPathFor_arcSlider_using(small_radius, big_radius, cap_radius)`** — assembles 5 path segments:
1. Start at `big_radius` at `start_angle`
2. Arc edge along `big_radius` from start to end (counterclockwise)
3. Cap semicircle at end
4. Arc edge along `small_radius` from end back to start (clockwise)
5. Cap semicircle at start

**`svgPathFor_radialFork`** — `svgPaths.line_atAngle(clusters_center, inside_arc_radius, angle_ofFork)` — the radial line from center to fork tip.

**`arc_contains_point(point)`** — checks if a point is within the arc band and angular range. Used for hit testing.

**`layout_endpoints_onArc`** — given `radius`, `angle`, `arcLength`, computes SVG path for text on arc plus transform strings for start/end thumbs.

---

## G_Pages

**Location:** `ws/src/lib/ts/geometry/G_Pages.ts`

Per-thing paging state container. Every `Thing` has one `G_Pages`. Holds two dictionaries of `G_Paging` objects — one for child clusters, one for parent clusters — keyed by predicate kind.

### Fields

| Field | Type | Purpose |
|---|---|---|
| `parent_pagings_dict` | `Dictionary<G_Paging>` | Paging state keyed by predicate kind, for parent-facing clusters |
| `child_pagings_dict` | `Dictionary<G_Paging>` | Paging state keyed by predicate kind, for child-facing clusters |
| `thing_id` | `string` | The ID of the owning `Thing` |

### Key Methods

**`g_paging_for(g_cluster)`** — routes to `g_paging_forPredicate_toChildren` using the cluster's predicate and direction.

**`g_pagings_dict_forChildren(isCluster_ofChildren)`** — returns `child_pagings_dict` or `parent_pagings_dict`.

**`g_paging_forPredicate_toChildren(predicate, isCluster_ofChildren)`** — looks up or creates a `G_Paging` for the given predicate. On creation, initializes `kind`, `thing_id`, `isCluster_ofChildren`, and stores in the appropriate dict.

**`add_g_paging(g_paging)`** — adds a `G_Paging` to the correct dict by kind.

**`create_fromDict(dict)`** (static) — deserialization: reconstructs `G_Pages` and both paging dicts from a plain object.

---

## G_Paging

**Location:** `ws/src/lib/ts/geometry/G_Paging.ts`

Tracks which subset (page) of a cluster's ancestry list is currently visible. The index is a float that changes as the user drags the thumb slider.

### Fields

| Field | Type | Purpose |
|---|---|---|
| `isCluster_ofChildren` | `boolean` | Which direction this paging applies to |
| `thing_id` | `string` | Owner thing ID |
| `widgets_shown` | `number` | How many items are visible on the current page |
| `total_widgets` | `number` | Total items in the cluster |
| `kind` | `string` | Predicate kind string |
| `index` | `number` | First visible item index (float, changes during drag) |

### Computed Properties

**`isPaging`** — `widgets_shown < total_widgets`

**`indexOf_followingPage`** — `index + widgets_shown` — first index of the next page

**`maximum_paging_index`** — `total_widgets - widgets_shown` — maximum valid index

**`sub_key`** — `"thing_id|kind|isCluster_ofChildren"` — unique string key for this paging instance

### `index_isVisible(index)`

```
index.isBetween(this.index, this.indexOf_followingPage - 1, true)
```
Returns whether a given item index falls within the current visible window.

### `update_index_toShow(index)`

Core paging state mutation. Forces index into `[0, maximum_paging_index]` with wrap-around:
```
if index == indexOf_followingPage:
    this.index = (this.index + 1).force_between(0, maximum_paging_index)  // increment by 1
else:
    this.index = index.force_between(0, maximum_paging_index)             // force with wrap
```
Sets `radial.w_g_paging` signal if changed. Returns whether index actually changed.

### `addTo_paging_index_for(delta)`

`delta == 0 ? false : update_index_toShow(this.index + delta)`

### `onePage_from(widgets_shown, ancestries)`

Updates `total_widgets` and `widgets_shown`, clamps index, returns:
```
ancestries.slice(Math.round(index), Math.round(index) + widgets_shown)
```

### Serialization

**`create_g_paging_fromDict(dict, isCluster_ofChildren)`** — deserializes one `G_Paging`.
**`create_g_paging_dict_fromDict(dict, isCluster_ofChildren)`** — deserializes a full dict.

---

## G_RadialGraph

**Location:** `ws/src/lib/ts/geometry/G_RadialGraph.ts`

Root-level controller for radial-mode layout. Singleton exported as `g_graph_radial`. Owns all clusters for the current focus, orchestrates paging distribution.

### Fields

| Field | Type | Purpose |
|---|---|---|
| `g_parent_clusters` | `Dictionary<G_Cluster>` | Clusters keyed by predicate kind, for parent-facing relationships (includes related/bidirectional) |
| `g_child_clusters` | `Dictionary<G_Cluster>` | Clusters keyed by predicate kind, for child-facing relationships |

### `layout()`

Full radial layout sequence:
1. `destructor()` — clears and destructs all existing clusters
2. `layout_forChildren_cluster(true)` — build child cluster(s)
3. `layout_forChildren_cluster(false)` — build parent cluster(s)
4. `layout_focus()` — position the focus widget
5. `layout_forPaging()` — distribute visible counts and lay out with paging

### `layout_focus()`

Centers the focus widget in the graph view:
```
width_ofWidget = width_ofTitle + 13
x = -1 - (width_ofWidget / 2)
y = -10
origin_ofWidget = g.center_ofGraphView.offsetByXY(x, y)
g_focus.layout()
g_focus.offset_ofWidget = Point.zero
g_focus.width_ofWidget = width_ofWidget + 5
g_focus.location_ofRadial = origin_ofWidget
g_focus.origin_ofRadial = origin_ofWidget.offsetByX(-width_ofTitle)
```

### `layout_forChildren_cluster(isCluster_ofChildren)`

For children (`true`): creates one cluster using `Predicate.contains`, passing all child ancestries.

For parents (`false`): iterates all predicates, creates one cluster per predicate, passing ancestries for each predicate's parent kinship.

For each ancestry, assigns `ancestry.g_widget.g_cluster = g_cluster`.

### `layout_forPaging()`

Determines how many widgets to show per cluster given the ring size:
```
angle_per_widget = 40 / radius
maximum_portion = floor(π / angle_per_widget)     // arc spread limit: 180°
remaining_toShow = ceil(radius^1.5 / k.height.row)
```

If total ancestries exceed `remaining_toShow` or `maximum_portion`:
1. Sort clusters smallest-first
2. While clusters remain and `remaining_toShow > 0`:
   - `portion = min(ceil(remaining_toShow / clusters.length), maximum_portion)`
   - `show = min(portion, cluster.total_widgets)`
   - Assign `cluster.widgets_shown = show`
   - Remove cluster from list

Then calls `g_cluster.layout_forPaging()` on every cluster with ancestries.

### Computed Properties

**`g_clusters`** — all clusters (parent + child) as flat array

**`g_clusters_forPaging`** — clusters where `ancestries.length > 0`

**`g_cluster_atMouseLocation`** — scans all clusters, returns first where `isMouse_insideThumb` is true

**`total_ancestries`** — sum of `total_widgets` across all clusters

**`visible_g_widgets`** — all `g_cluster_widgets` from all clusters, plus the focus widget

**`g_necklace_widgets`** — all `g_cluster_widgets` from all clusters (excludes focus)

### `g_paging_forPredicate_toChildren(predicate, isCluster_ofChildren)`

Looks up focus thing's `G_Pages` via `radial.g_pages_forThingID`, then returns the `G_Paging` for this predicate/direction.

---

## G_Repeater

**Location:** `ws/src/lib/ts/geometry/G_Repeater.ts`

Layout engine for a row of titled buttons (repeater pattern). Used wherever multiple buttons share a row and need widths distributed according to their title text.

### Fields

| Field | Type | Purpose |
|---|---|---|
| `titles` | `string[]` | Display titles (possibly swapped) |
| `title_widths` | `number[]` | Measured pixel width of each title at `font_size` |
| `widths` | `number[]` | Computed button width for each column (includes gap) |
| `lefts` | `number[]` | Computed left offset for each column |
| `proportionate` | `boolean` | Distribute widths proportionally to title widths |
| `swap_title` | `boolean` | Whether to swap first and second titles |
| `font_size` | `number` | Font size in px, used to measure title widths |
| `columns` | `number` | Number of columns (= `titles.length`) |
| `margin` | `number` | Left + right margin |
| `height` | `number` | Row height |
| `width` | `number` | Total available width |
| `padding` | `number` | Padding inside each button (default 8) |
| `gap` | `number` | Gap between buttons |
| `title_gap` | `number` | Extra gap after first title (default 8) |

### Constructor

1. Optionally swaps first two titles (`swap_titles`)
2. Measures each title width with `u.getWidth_ofString_withSize(title, fontSize)`
3. Computes `widths` array: each entry is `gap + button_width_for(i)`

### `button_width_for(column)`

**Proportionate mode:**
```
total_title_width = sum(title_widths)
margin_and_gaps = margin*2 + title_gap + gap*(columns-1)
apportionment = (width - total_title_width - margin_and_gaps) / columns
return title_widths[column] + apportionment
```
Each button gets its title width plus an equal share of the remaining space.

**Non-proportionate mode:**
- First column (or second if titles are swapped): takes all remaining space after other buttons
- Other columns: `title_widths[column] + padding * 2`

The "greedy" column is identified as `column == (swap_title ? 1 : 0)`.

### `button_left_for(column)`

**Proportionate mode:**
```
sum(widths[0..column-1]) + title_gap - gap/2
```

**Non-proportionate mode:**
Accumulates `button_width_for(i) + gap` for `i < column`.

### `swap_titles(titles, swap_title)` (static)

```
(!swap_title || titles.length < 2) ? titles : [titles[1], titles[0], ...titles.slice(2)]
```

---

## Geometry Manager

**Location:** `ws/src/lib/ts/managers/Geometry.ts`

Singleton exported as `g`. The top-level orchestration layer. Owns Svelte stores for graph state, delegates actual layout to `g_graph_tree` or `g_graph_radial`.

### Svelte Stores

| Store | Type | Purpose |
|---|---|---|
| `w_depth_limit` | `writable<number>` | Max recursion depth for tree layout (default 3, restored from preferences as 12) |
| `w_branches_areChildren` | `writable<boolean>` | Whether branches show children (vs parents) |
| `w_user_graph_center` | `writable<Point>` | Effective graph center in window coordinates (rect center + user offset) |
| `w_user_graph_offset` | `writable<Point>` | User-applied pan offset |
| `w_rect_ofGraphView` | `writable<Rect>` | The bounding rect of the graph drawing area |
| `w_scale_factor` | `writable<number>` | Zoom scale factor (currently disabled/commented out) |

### `grand_build()`

```ts
signals.signal_rebuildGraph_fromFocus();
```

Triggers a full Svelte component rebuild from the focus. The heaviest operation — rebuilds the DOM tree.

### `grand_sweep()`

```ts
this.layout();
this.grand_build();
```

Full layout + rebuild. Used when both geometry and DOM need to be refreshed.

### `layout()`

Routes to the correct graph type:
```ts
if (show.inRadialMode) {
    g_graph_radial.layout();
} else {
    g_graph_tree.layout();
}
signals.signal_reposition_widgets_fromFocus();
setTimeout(() => hits.recalibrate(), 100);
```

After layout, emits a reposition signal and schedules hit-target recalibration after 100ms.

### `grand_adjust_toFit()`

Scales and centers the layout to fit the graph view:
```
scale_factor = layout_size.best_ratio_to(graphView_size)
new_size = layout_size / scale_factor
new_offset = user_graph_offset / scale_factor
w_user_graph_center = new_size.asPoint / 2
w_user_graph_offset = new_offset
set_scale_factor(scale_factor)
layout()
```

### `update_rect_ofGraphView()`

Recomputes `w_rect_ofGraphView` in response to window size or details panel changes:
```
secondary_below_primary = features.allow_tree_mode && (show_search || mode == tree)
y = controls_boxHeight * (secondary_below_primary ? 2 : 1) - 5
x = show_details ? k.width.details : 5
origin = Point(x, y)
size = windowSize.reducedBy(origin).reducedBy(Point.square(separator_thickness - 1))
rect = Rect(origin, size)
w_user_graph_center = rect.center + user_offset
```

Also schedules `hits.recalibrate()` after 100ms.

### Graph Center and Offset

**`center_ofGraphView`** — `get(w_rect_ofGraphView).size.asPoint.dividedInHalf`

**`set_user_graph_offsetTo(user_offset)`** — persists offset to preferences, updates `w_user_graph_center` and `w_user_graph_offset`, schedules hit recalibration. Returns whether offset actually changed (threshold: magnitude > 1).

**`renormalize_user_graph_offset()`** — restores from persisted preferences.

**`user_offset_toGraphDrawing`** — `rect_ofAllWidgets.offsetBy(user_graph_offset)` — useful for computing pan limits.

### Mouse Geometry

**`mouse_vector_ofOffset_fromGraphCenter(offset)`** — vector from `w_user_graph_center + offset` to current scaled mouse location. Returns `null` if no mouse location.

**`mouse_distance_fromGraphCenter`** — magnitude of above vector.

**`mouse_angle_fromGraphCenter`** — angle of above vector (or `null`).

### Widget Collection

**`all_g_widgets`** — delegates to `g_graph_radial.visible_g_widgets` or `g_graph_tree.visible_g_widgets` depending on mode.

**`rect_ofAllWidgets`** — bounding rect of all visible widget drawing origins.

### Ancestry Centering

**`ancestry_isCentered(ancestry)`** — true if `ancestry.center_ofTitle` is within 1px of `w_user_graph_center`.

**`ancestry_place_atCenter(ancestry)`** — sets user offset so the ancestry's title center aligns with the graph center.

### Preferences

**`restore_preferences()`** — reads `depth_limit`, `scale`, `user_offset` from preferences store; calls `update_rect_ofGraphView` and `set_scale_factor`.

### Layout Metrics

**`controls_boxHeight`** — `glows_banner_height + k.height.segmented`

**`glows_banner_height`** — 32 (mobile) or 20 (desktop)

**`breadcrumbs_top`** — `windowSize.height - controls_boxHeight`

**`windowSize`** — `inner_windowSize / scale_factor`

**`inner_windowSize`** — `Size(window.innerWidth, window.innerHeight)`

**`windowScroll`** — `Point(window.scrollX, window.scrollY)`

### Breadcrumb Layout

**`layout_breadcrumbs(ancestries, centered, left, thresholdWidth)`** — returns `[crumb_ancestries, widths, lefts, parent_widths]`:
1. Iterates ancestries in reverse (root-first)
2. Adds each until total width exceeds `thresholdWidth`
3. Measures each: `u.getWidthOf(breadcrumb_title) + 29`
4. If centered: shifts `left` by `(thresholdWidth - total) / 2`
5. Accumulates `lefts` array from left-to-right
6. Encodes `parent_widths` as `previous * 100 + width` (triggers Svelte reactivity on count change)

### Scale Factor

`set_scale_factor(scale_factor)` — currently entirely commented out. Scale functionality exists in the store (`w_scale_factor`) but the DOM zoom/CSS application is disabled.

---

## Data Flow Summary

```
Geometry.grand_sweep()
  ├── Geometry.layout()
  │     ├── g_graph_tree.layout()         [tree mode]
  │     │     ├── layout_focus_ofTree()
  │     │     ├── g_focus.layout_each_generation_recursively()
  │     │     │     └── [for each child ancestry, DFS]
  │     │     │           ├── child.g_widget.layout_each_generation_recursively()
  │     │     │           └── g_widget.layout_one_generation()
  │     │     │                 ├── g_widget.layout()              ← computes dot positions, width
  │     │     │                 ├── layout_origin_ofTrunk()        ← sets origin_ofTrunk, calls g_line.layout()
  │     │     │                 └── g_childBranches.layout()       ← distributes children vertically
  │     │     │                       └── [for each branch]
  │     │     │                             g_widget.layout_subtree_for()  ← sets rect, origin_ofWidget
  │     │     ├── g_focus.layout_each_bidirectional_generation_recursively()
  │     │     └── adjust_focus_ofTree()
  │     │
  │     └── g_graph_radial.layout()       [radial mode]
  │           ├── destructor()
  │           ├── layout_forChildren_cluster(true/false)  ← builds G_Cluster instances
  │           ├── layout_focus()                          ← centers focus widget
  │           └── layout_forPaging()                     ← distributes widget counts
  │                 └── [for each cluster]
  │                       g_cluster.layout_forPaging()
  │                         ├── g_paging.onePage_from()    ← slices visible ancestries
  │                         └── g_cluster.layout()
  │                               ├── g_cluster_pager.layout()
  │                               ├── layout_cluster_widgets()
  │                               │     └── [for each widget]
  │                               │           g_widget.layout_necklaceWidget()
  │                               │             └── g_widget.layout()
  │                               ├── layout_forkTip()
  │                               ├── layout_label()
  │                               └── layout_thumb_angles()
  │
  └── Geometry.grand_build()
        └── signals.signal_rebuildGraph_fromFocus()   ← triggers Svelte DOM rebuild
```
