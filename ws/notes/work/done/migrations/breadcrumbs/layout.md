 # Layout Algorithm Refactoring

The goals here are two:
- replace existing code and recreate from scratch
- optimize for simple and fast

## Analysis Questions

### 1. ✅ What is scattered? - Layout logic in multiple places?
- G_TreeGraph
- G_RadialGraph
- G_Widget
- G_TreeBranches
- G_Cluster
- G_TreeLine
- G_Repeater
- G_Paging
- G_Pages
- G_Cluster_Pager

### 2. There will be a `Layout` manager
- It will be called Layout.ts and have the same features as Geometry.ts, but the implementation will be designed from good first principles (addressed herein).

### 3. ✅ What is the state? - Positions, sizes, constraints?
- Positions: `origin_ofWidget`, `origin_ofRadial`, `location_within_necklace`
- Sizes: `size_ofSubtree`, `width_ofWidget`
- Offsets: `user_graph_offset`, `offset_ofWidget`
- Scale factor
- Depth limit
- Branch direction
- Graph view rect

### 4. ✅ What is the lifecycle? - When to compute? When to update?
- Signals: `signal_rebuildGraph_fromFocus`, `signal_reposition_widgets_fromFocus`
- grand_* methods: `grand_build()`, `grand_sweep()`, `grand_adjust_toFit()`
- Reactive stores: `w_rect_ofGraphView`, `w_user_graph_offset`, `w_depth_limit`, `w_branches_areChildren`, `w_scale_factor`
- Direct calls: `g.layout()`, `g_widget.layout()`, `g_cluster.layout()`

## Design Questions

### 1. What do components declare? - Size constraints? Position preferences?

### 2. How does manager compute? - Single pass? Incremental? Cached?

### 3. ✅ What triggers updates? - Size changes? Content changes? User actions?
- Window resize
- Details visibility changes
- Focus changes
- Depth limit changes
- Tree/radial mode switches
- User drag (offset changes)
- Preferences restore
- Database changes
- Hierarchy mutations

### 4. How to optimize? - Spatial index? Dirty tracking? Batch updates?

## Simplification Opportunities

### 1. Remove duplication - Common layout patterns?
- **Recursive positioning**: Tree branches recursively position subtrees (`G_TreeBranches.layout()`, `G_Widget.layout_subtree_for()`)
- **Bottom-up size calculation**: `size_ofSubtree` computed from children up for vertical centering
- **Horizontal/vertical stacking**: Tree branches stack vertically, widgets stack horizontally within branches
- **Centering algorithms**: Focus widget centered in graph view (tree: `adjust_focus_ofTree()`, radial: `layout_focus()`)
- **Offset calculations**: Multiple offset layers (user_graph_offset, offset_ofWidget, reveal offset, details panel offset)
- **Circular distribution**: Radial mode distributes widgets around ring/necklace using angle-based positioning
- **Angle-based positioning**: Widgets positioned on radial necklace via `angle_at_index()` with arc-sine calculations
- **Cluster grouping**: Widgets grouped into clusters by predicate (children, parents, related) with fork angles
- **Paging calculations**: Large clusters paginated with arc-based UI (`G_Cluster_Pager`, `G_Paging`)
- **Coordinate transformations**: Converting between coordinate systems (graph view rect, user offset, scale factor, polar/cartesian) 

### 2. Reduce complexity - Nested calculations? Circular dependencies?
#### Coordinate system proliferation
- Multiple overlapping coordinate systems with unclear handoff points:
  - Graph view rect (window-relative)
  - User offset (graph translation)
  - Scale factor (coordinate scaling)
  - Widget local coordinates (relative to parent in tree, relative to center/ring in radial)
  - Component coordinates (dots, titles relative to widget)
  - Polar coordinates (radial mode angle/radius)
  - **Problem**: Chained `offsetBy()` calls make it unclear which coordinate system a value is in at any point ^9d39cb
  - **Problem**: Widget components (dots, titles) are in widget's coordinate system, but widgets themselves switch between parent-relative (tree) and center-relative (radial) 
  - **Goal**: Establish clear coordinate system hierarchy with explicit transformation points
#### Nested calculations
- Deeply nested offset chains obscure the actual position computation:
  - Tree: `rect_ofGraphView.center.offsetByXY(x_offset, y_offset).offsetByXY(-21.5 - x_offset_ofReveal, -5)`
  - Radial: `center.offsetByXY(0.5, -1).offsetBy(radial_vector.rotate_by(angle))`
  - **Problem**: Hard to reason about final position, debug positioning issues, or verify correctness
  - **Goal**: Flatten calculations with intermediate named variables or transformation pipeline
#### Circular dependencies
- Layout calculations may depend on values computed in other layout passes:
  - `size_ofSubtree` computed bottom-up, but used for centering in parent layout
  - Focus positioning depends on subtree size, but subtree size depends on focus position in some cases
  - **Problem**: Order of operations matters critically, but isn't always obvious
  - **Goal**: Establish clear dependency graph and computation order (e.g., sizes first, then positions)
#### Mixed concerns
- Layout logic mixes positioning, sizing, orientation, and visual tweaks:
  - `layout()` methods compute positions, sizes, orientations, and apply visual adjustments (tweaks like `+0.5`, `-1`) all together
  - **Problem**: Hard to separate layout algorithm from visual polish, making it difficult to reason about core layout
  - **Goal**: Separate layout computation from visual adjustments, or at least clearly document which is which
### 3. Clear abstractions - What are the core concepts?
- in the tree, each Widget must be exactly such that:
	- all its children fit vertically
	- it is centered exactly midway between its top and bottom children
	- layout proceeds leaf-most first
- in the radial mode
	- the focus determines which widgets populate the necklace
		- compute this based on maximizing the necklace population (more on this elsewhere)
	- widgets stack vertically, ie, their angular position is such that they do not overlap

### 4. Eliminate workarounds - Hacks for edge cases?

## Performance Opportunities

### 1. Batch operations - Compute all layouts together?

### 2. Lazy evaluation - Only compute visible/needed?

### 3. Incremental updates - Only update what changed?

### 4. Efficient structures - Spatial index for layout queries?
- we already deploy RBush. Is there any advantage to using it for determining what goes where?
### 5. Minimize re-renders - Cache layout results?
- We need a robust and easy to grok method of knowing which cached values need to be revised, and in what order, and which can be used as is.
## Summary
### Problems
- From [[#Coordinate system proliferation]]
	- Chained `offsetBy()` calls make it unclear which coordinate system a value is in at any point
	- Widget components (dots, titles) are in widget's coordinate system, but widgets themselves switch between parent-relative (tree) and center-relative (radial)
- From [[#Nested calculations]]
	- Hard to reason about final position, debug positioning issues, or verify correctness
- From [[#Circular dependencies]]
	- Order of operations matters critically, but isn't always obvious
- From [[#Mixed concerns]]
	- Hard to separate layout algorithm from visual polish, making it difficult to reason about core layout
### Goals
- From [[#Coordinate system proliferation]]
	- Establish clear coordinate system hierarchy with explicit transformation points
- From [[#Nested calculations]]
	- Flatten calculations with intermediate named variables or transformation pipeline
- From [[#Circular dependencies]]
	- Establish clear dependency graph and computation order (e.g., sizes first, then positions)
- From [[#Mixed concerns]]
	- Separate layout computation from visual adjustments, or at least clearly document which is which
