# Bad Tree Center

## Problem

When the user clicks the show details button (far upper left, three lines), the tree graph is supposed to move aside to make room for the details panel. It moves, but it moves the **wrong direction**.

## Goal

Fix this so the tree moves the **right direction** when details panel opens/closes.

## Investigation

Found in `G_TreeGraph.ts`: both `adjust_focus_ofTree` and `layout_focus_ofTree` had:

```typescript
const x_offset_forDetails = (get(show.w_show_details) ? -k.width.details : 0);
```

Negative offset moves tree left. But details panel opens on the left, so tree should move **right** (positive).

## Work Performed

**File**: `src/lib/ts/geometry/G_TreeGraph.ts`

~~Flipped sign in two locations:~~

~~1. `adjust_focus_ofTree` (line ~80): `-k.width.details` → `k.width.details`~~
~~2. `layout_focus_ofTree` (line ~93): `-k.width.details` → `k.width.details`~~

**REVERTED** - This was not the fix. The actual fix was adding the subscription (see layout.md).

**Status**: ✅ Fixed via `layout.md` fix #2 (subscription)
