# Geometry Manager Design

Quick reference for who does what in layout. Geometry.ts coordinates, the G_* helpers do the actual math. Signals trigger rebuilds, stores trigger reactivity, direct calls when you need control.

## Responsibilities

### Geometry.ts
- Graph view rect calculation (window size, details visibility)
- User offset/center management
- Scale factor management
- Breadcrumbs layout
- Coordinates tree/radial layout dispatch

### geometry/*.ts Helpers
- **G_TreeGraph**: Tree layout algorithm (focus positioning, recursive branch layout)
- **G_RadialGraph**: Radial layout algorithm (clusters, paging, focus)
- **G_Widget**: Individual widget positioning (tree/radial origins, subtree sizes)
- **G_TreeBranches**: Tree branch layout (vertical stacking)
- **G_TreeLine**: Tree line geometry (parent-child connections)
- **G_Cluster**: Radial cluster positioning (arcs, thumbs, labels, widget necklace)
- **G_Repeater**: Button row layout (spacing, alignment)
- **G_Paging, G_Pages, G_Cluster_Pager**: Radial paging geometry

## Layout Invocation

### Signals
- `signal_rebuildGraph_fromFocus()` → triggers full rebuild
- `signal_reposition_widgets_fromFocus()` → triggers reposition only

### grand_* Methods
- `grand_build()` → `signal_rebuildGraph_fromFocus()`
- `grand_sweep()` → `layout()` + `grand_build()`
- `grand_adjust_toFit()` → scale + `layout()`

### Reactive Stores
- `w_rect_ofGraphView` → triggers layout on change
- `w_user_graph_offset` → triggers recalibrate
- `w_depth_limit` → triggers layout
- `w_branches_areChildren` → affects layout logic
- `w_scale_factor` → affects coordinate scaling

### Direct Calls
- `g.layout()` → dispatches to `g_tree.layout()` or `g_radial.layout()`
- `g_widget.layout()` → individual widget positioning
- `g_cluster.layout()` → cluster positioning

## Actors

### Drivers
- Window resize → `update_rect_ofGraphView()`
- Details visibility → `update_rect_ofGraphView()`
- Focus changes → `grand_build()`
- Depth limit changes → `layout()`
- Tree/radial mode switch → `layout()`
- User drag → `set_user_graph_offsetTo()`
- Preferences restore → `restore_preferences()`
- Database changes → `grand_build()`
- Hierarchy mutations → `grand_sweep()` / `grand_build()`

### Configured By
- Graph view rect → widget positioning bounds
- User offset → graph translation
- Scale factor → coordinate scaling
- Depth limit → recursion depth
- Branch direction → parent vs child layout
- Widget positions → computed from layout algorithm
- Cluster positions → computed from radial algorithm
- Paging → limits visible widgets per cluster

