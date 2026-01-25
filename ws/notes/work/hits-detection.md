i want to analyze (1) where hits.recalibrate is currently called and (2) where in the app it should but isn't being called. perhaps, i need to formally state the conditions for which recalibrate is required and then look for code that meets that condition but doesn't call recalibrate.

## Current recalibrate calls

| File | Method | Trigger |
|------|--------|---------|
| Geometry.ts | `update_rect_ofGraphView()` | Graph view rect changes (window resize, details toggle) |
| Geometry.ts | `set_user_graph_offsetTo()` | User drags/scrolls the graph |

Both use `setTimeout(() => hits.recalibrate(), 100)` to defer.

## When recalibrate is required

Hit target rects become stale when:
1. **Widget positions change** — layout, focus change, expand/collapse
2. **Widget set changes** — add/remove widgets from DOM
3. **Graph container changes** — resize, scroll, zoom
4. **Visibility changes** — show/hide details, controls, widgets
5. **Graph mode changes --** between tree and radial
6. **Focus changes**

## Potential missing calls

Places that change layout but don't call recalibrate:
- `g.layout()` — repositions widgets
- `g.grand_build()` — rebuilds graph
- `g.grand_sweep()` — layout + rebuild
- Focus changes via `becomeFocus()`
- Expand/collapse via `ancestry.toggleExpand()`
- Ring resize via `radial.w_resize_radius`
