# Layout Code Analysis

## Problem

The code responsible for computing where to render each bit of the graph (tree or radial) is a complex, tangled mishmash of ad-hoc write-what-works. It is excruciatingly hard to debug or modify.

## Goal

Understand the flow for several use cases. Be able to pinpoint a likely cause of a bug. This may involve flow diagrams. Certainly need some kind of map of the current code.

---

## Key Files

| File | Role |
|------|------|
| `managers/Geometry.ts` | Orchestrator. Entry points: `layout()`, `grand_build()`, `grand_sweep()` |
| `geometry/G_TreeGraph.ts` | Tree mode layout. Owns `layout()` and recursive widget positioning |
| `geometry/G_RadialGraph.ts` | Radial mode layout. Owns clusters and necklace positioning |
| `geometry/G_Widget.ts` | Per-widget geometry. Computes origins, offsets, reveal positions |
| `geometry/G_Cluster.ts` | Radial cluster layout. Paging, arc angles, widget distribution |
| `geometry/G_TreeBranches.ts` | Tree branch layout. Child widget positioning |
| `geometry/G_TreeLine.ts` | Tree connector lines |
| `signals/Signals.ts` | Event dispatch. `signal_rebuildGraph`, `signal_reposition_widgets` |
| `signals/Events.ts` | User input → layout triggers |

---

## Entry Points (What Triggers Layout)

```
User Action                    → Code Path
─────────────────────────────────────────────────────────────────
Window resize                  → e.handle_window_resize → g.restore_preferences()
Wheel scroll                   → e.handle_wheel → g.set_user_graph_offsetTo()
Key 'C'                        → e.handle_key_down → g.set_user_graph_offsetTo(Point.zero)
Key '!'                        → e.handle_key_down → g.grand_adjust_toFit()
Key 'M'                        → controls.toggle_graph_type() → g.grand_build()
Key '>' / '<'                  → g_graph_tree.increase_depth_limit_by() → g.layout()
Click drag dot                 → e.handle_singleClick_onDragDot → g.grand_build() or g.layout()
Focus change                   → ancestry.becomeFocus() → g.grand_build()
Details toggle                 → details.details_toggle_visibility() → g.update_rect_ofGraphView()
Radial ring resize             → radial.w_resize_radius subscription → g_cluster.layout()
```

---

## Main Layout Flow

### 1. `g.grand_sweep()` (full rebuild + layout)
```
g.grand_sweep()
  └─ g.layout()                          ← position everything
  └─ g.grand_build()
       └─ signals.signal_rebuildGraph_fromFocus()
            └─ emits T_Signal.rebuild    ← Svelte components react
```

### 2. `g.grand_build()` (rebuild graph from focus)
```
g.grand_build()
  └─ signals.signal_rebuildGraph_fromFocus()
       └─ emits T_Signal.rebuild
```

### 3. `g.layout()` (mode-specific positioning)
```
g.layout()
  ├─ [radial mode] → g_graph_radial.layout()
  │     └─ destructor()
  │     └─ layout_forChildren_cluster(true)   ← children
  │     └─ layout_forChildren_cluster(false)  ← parents/related
  │     └─ layout_focus()                     ← focus widget
  │     └─ layout_forPaging()                 ← distribute across clusters
  │
  └─ [tree mode] → g_graph_tree.layout()
        └─ layout_focus_ofTree(rect_ofGraphView)
        └─ g_focus.layout_each_generation_recursively(depth_limit)
        └─ g_focus.layout_each_bidirectional_generation_recursively(depth_limit)
        └─ adjust_focus_ofTree(rect_ofGraphView)
```

---

## Tree Layout Deep Dive

### `G_TreeGraph.layout()`
```
layout()
  │
  ├─ layout_focus_ofTree(rect)
  │     Computes: origin_ofFocusReveal from rect_ofGraphView.center
  │     Sets: g_focus.origin_ofWidget
  │     Uses: subtree_size, x_offset_forDetails, y_offset
  │
  ├─ g_focus.layout_each_generation_recursively(depth_limit)
  │     For each branch ancestry (recursively):
  │       └─ layout_one_generation()
  │             └─ layout()                    ← G_Widget.layout()
  │             └─ layout_origin_ofTrunk()
  │             └─ g_childBranches.layout()    ← G_TreeBranches.layout()
  │
  └─ adjust_focus_ofTree(rect)
        Re-computes final g_focus.origin_ofWidget
        (unclear why this runs twice - see TODO in code)
```

### `G_Widget.layout_each_generation_recursively(depth)`
```
layout_each_generation_recursively(depth, visited)
  │
  ├─ [if depth > 0 && not visited && shows_branches]
  │     For each branchAncestry:
  │       └─ branchAncestry.g_widget.layout_each_generation_recursively(depth-1)
  │
  └─ layout_one_generation()  ← layout self AFTER children
```

### `G_Widget.layout_one_generation()`
```
layout_one_generation()
  ├─ layout()                 ← compute widget geometry
  ├─ layout_origin_ofTrunk()  ← position trunk connector
  └─ g_childBranches.layout() ← layout child branch lines
```

### `G_TreeBranches.layout()`
```
layout()
  │
  └─ For each branchAncestry:
       └─ g_widget_ofBranch.layout_subtree_for(height, origin, T_Graph.tree)
```

### `G_Widget.layout_subtree_for(...)`
```
layout_subtree_for(height, origin, t_graph, pointsTo_child, reveal_isAt_right)
  │
  ├─ Computes: height_ofSubtree, height_ofLines, rect_ofLines
  ├─ Sets: origin_ofWidget, g_line.rect, size_ofSubtree.height
  └─ layout_one_generation()
```

---

## Radial Layout Deep Dive

### `G_RadialGraph.layout()`
```
layout()
  │
  ├─ destructor()                         ← clear old clusters
  │
  ├─ layout_forChildren_cluster(true)     ← children cluster
  │     └─ assignAncestries_toClusterFor(childAncestries, Predicate.contains, true)
  │
  ├─ layout_forChildren_cluster(false)    ← parent clusters (one per predicate)
  │     For each predicate:
  │       └─ assignAncestries_toClusterFor(ancestries, predicate, false)
  │
  ├─ layout_focus()
  │     Sets: g_focus.origin_ofWidget, location_ofRadial, origin_ofRadial
  │     Uses: g.center_ofGraphView
  │
  └─ layout_forPaging()
       Distributes widgets across clusters based on radius
       For each cluster:
         └─ g_cluster.layout_forPaging()
```

### `G_Cluster.layout_forPaging()`
```
layout_forPaging()
  │
  ├─ g_paging.onePage_from(widgets_shown, ancestries)  ← get current page
  └─ layout()
```

### `G_Cluster.layout()`
```
layout()
  │
  ├─ g_cluster_pager.layout()
  ├─ layout_cluster_widgets()
  │     For each ancestry_shown:
  │       └─ g_widget.layout_necklaceWidget(rotated_origin, reveal_isAt_right)
  │
  ├─ g_cluster_pager.layout_forkTip(center)
  ├─ layout_label()
  ├─ layout_thumb_angles()
  ├─ update_label_forIndex()
  └─ signals.signal_reposition_widgets_fromFocus()
```

---

## G_Widget.layout() (Core Widget Geometry)

This is where the actual pixel positions get computed:

```
layout()
  │
  ├─ Inputs:
  │     - ancestry.thing.width_ofTitle
  │     - showingReveal (bool)
  │     - reveal_isAt_right (bool)
  │     - controls.inRadialMode
  │     - ancestry.isFocus
  │
  ├─ Computes:
  │     - width_ofWidget
  │     - x_ofDrag, x_ofRadial, x_offset_ofWidget
  │     - origin_ofDrag, origin_ofTitle
  │     - center_ofDrag, center_ofReveal
  │
  └─ Sets:
       - location_ofRadial (if not focus)
       - origin_ofRadial
       - origin_ofTitle
       - center_ofDrag
       - offset_ofWidget
       - width_ofWidget
       - center_ofReveal (if showingReveal)
```

---

## Key Stores That Affect Layout

| Store | Set By | Consumed By |
|-------|--------|-------------|
| `g.w_rect_ofGraphView` | `g.update_rect_ofGraphView()` | Tree/Radial layout |
| `g.w_user_graph_center` | `g.set_user_graph_offsetTo()` | **NOT used by tree** (bug?) |
| `g.w_user_graph_offset` | `g.set_user_graph_offsetTo()` | Wheel scroll, persisted |
| `show.w_show_details` | Details toggle | Tree layout (x_offset_forDetails) |
| `show.w_t_graph` | Mode toggle | `g.layout()` dispatch |
| `radial.w_resize_radius` | Ring drag | Cluster layout |
| `radial.w_rotate_angle` | Ring rotation | Cluster angle_ofCluster |
| `x.w_ancestry_focus` | Focus change | Everything |
| `g.w_depth_limit` | Key '>' / '<' | Tree recursion depth |

---

## Common Bug Locations

### Tree moves wrong direction when details toggle
- **File**: `G_TreeGraph.ts`
- **Location**: `adjust_focus_ofTree()` and `layout_focus_ofTree()`
- **Variable**: `x_offset_forDetails`
- **Issue**: Sign of offset

### Tree doesn't respond to user offset (C key)
- **File**: `G_TreeGraph.ts`
- **Issue**: Uses `rect_ofGraphView.center` instead of `g.w_user_graph_center`
- **Both**: `adjust_focus_ofTree()` and `layout_focus_ofTree()`

### Widget positions wrong after mode switch
- **File**: `G_Widget.ts`
- **Location**: `layout()` - many conditional branches for radial vs tree
- **Issue**: State from previous mode bleeding through

### Radial clusters overlap or wrong angle
- **File**: `G_Cluster.ts`
- **Location**: `angle_ofCluster`, `angle_at_index()`
- **Issue**: Complex angle math with arc-sin and wrapping

### Tree branches misaligned
- **File**: `G_TreeBranches.ts`, `G_Widget.ts`
- **Location**: `layout_subtree_for()`, `origin_forAncestry_inRect()`
- **Issue**: Height calculations, origin computations

---

## Flow Diagram: Focus Change → Layout

```
ancestry.becomeFocus()
    │
    ├─ x.si_recents.push(pair)
    ├─ ancestry.expand()
    ├─ hits.recalibrate()
    │
    └─ [caller] → g.grand_build()
                      │
                      └─ signals.signal_rebuildGraph_fromFocus()
                             │
                             └─ Svelte components receive T_Signal.rebuild
                                    │
                                    └─ Graph.svelte reattaches
                                           │
                                           └─ triggers g.layout()
```

---

## Flow Diagram: Details Toggle → Tree Repositions

```
details.details_toggle_visibility()
    │
    └─ show.w_show_details.set(!current)
           │
           └─ [subscription in Geometry constructor]
                  │
                  ├─ g.update_rect_ofGraphView()
                  │     └─ Computes new rect (x shifts by k.width.details)
                  │     └─ g.w_rect_ofGraphView.set(rect)
                  │
                  └─ g.layout()
                         └─ g_graph_tree.layout()
                               ├─ layout_focus_ofTree() uses x_offset_forDetails
                               └─ adjust_focus_ofTree() uses x_offset_forDetails
```

---

## TODO: Questions to Answer

1. Why does `adjust_focus_ofTree` run AFTER `layout_each_generation_recursively`? The code has a TODO saying it doesn't know why.

2. Why doesn't tree layout use `w_user_graph_center`? Radial does via `g.center_ofGraphView` but tree uses `rect_ofGraphView.center` directly.

3. ~~What triggers layout after `w_rect_ofGraphView` changes? Need to find the subscription.~~ **FIXED**: Added subscription in Geometry constructor.

4. The relationship between `origin_ofWidget`, `origin_ofTrunk`, `origin_ofRadial`, and `location_ofRadial` is confusing. When is each used?

---

## Work Performed

- [x] Mapped all key layout files
- [x] Identified entry points and triggers
- [x] Traced tree layout flow
- [x] Traced radial layout flow
- [x] Documented G_Widget.layout() internals
- [x] Listed key stores affecting layout
- [x] Identified common bug locations
- [x] Created flow diagrams for focus change and details toggle
- [x] **Fixed**: Added `show.w_show_details` subscription in `Geometry.setup_subscriptions()` (called from `Configuration.configure()`) to trigger `update_rect_ofGraphView()` + `layout()` when details visibility changes
