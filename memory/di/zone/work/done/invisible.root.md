# Invisible Root

turn root into a pure container — invisible by default, non-interactive in 3D, selectable via panel or background click.

## decisions

- **no auto-sizing.** tried it, hated it. root keeps its user-set dimensions.
- **manual "fit" button** in the actions row. shrink_to_fit: snapshot children's absolute bounds, resize parent to their bounding box, normalize children so offsets stay non-negative.
- **fit-normalize on startup** if any SO has negative start/end/length (unless root is a repeater).
- **root is selectable** via the parts hierarchy and via background click. attributes table shows, angles table hidden.
- **root visibility persists.** serialize always writes `visible`. Engine only forces `visible = false` for brand new scenes.
- **background click** selects root. second background click deselects.

## implemented

### phase 1: root invisible (rendering)

- **Engine.ts** — `if (!saved) root_so.visible = false` (new scenes only)
- **Engine.ts** — startup fit-normalize when negatives detected (skip if root is repeater)
- **R_Dimensions.ts** — skip root: `if (!obj.parent) continue`
- **Smart_Object.ts** — serialize always writes `visible` (not just when false)

### phase 2: root non-interactive in 3D (hit testing)

- **Hits_3D.ts** — face hit loop skips root: `if (!so.scene.parent) continue`
- **Events_3D.ts** — background click selects root (or deselects if root already selected)

### phase 3: back face guidance

- **Hits_3D.ts** — `back_most_face(so)`: `front_most_face(so) ^ 1`
- **Drag.ts** — when parent is root, use `back_most_face` instead of `front_most_face`

### phase 4: fit button

- **Engine.ts** — `shrink_to_fit()`: snapshot children's absolute bounds, compute bounding box, resize parent, normalize children offsets. disabled for repeaters.
- **D_Selected_Part.svelte** — "fit" button in actions row, disabled when no children or is repeater.

### phase 5: details panel

- **D_Attributes.svelte** — angles table wrapped in `{#if !is_root}` (hidden for root)
- **D_Selected_Part.svelte** — deselected root shows empty panel; disabled buttons use `{#if}` not `disabled`; `needs_fit` derived state for fit button visibility

### phase 6: root_so source of truth

- **Scenes.ts** — `root_so: Smart_Object | null = null` (plain property, SOT)
- **Stores.ts** — removed `w_root_so` writable store and `root_so` getter entirely
- **Engine.ts, Render.ts, R_Grid.ts, Events_3D.ts, Graph.svelte** — all read `scenes.root_so`

### phase 7: HMR fix

- **Events.ts** — `private wired = false` guard prevents double document listener registration on HMR re-mount

### contextual selectability

when a saved file is inserted, its root becomes a child. `insert_child_from_text` sets parent, so `!so.scene.parent` checks already treat it as non-root. SO stays invisible in both contexts. no code changes needed.
