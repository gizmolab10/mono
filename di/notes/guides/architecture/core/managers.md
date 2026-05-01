# Managers

Each manager owns one concern. Singleton pattern throughout. They live in `src/lib/ts/managers/`.

## Overview

- **Stores.** General session-and-persistent values shared across components — view mode, decorations bitmask, solid flag, side-panel-open flag, forward face index, rotation-snap flag, editing-lock flag, scale, grid opacity, orientation, the all-parts list, the tick counter.
- **Selection.** The current list of selected parts. Empty list means nothing selected; one item means the selected part; two or more means multi-selection. Exposes a backwards-compatible "the only selected part" view for the many call sites that read single-selection semantics.
- **Parts.** The collapsed-rows set for the parts table, plus tree-walk helpers (tree order, ancestor-collapsed check, reveal helpers, hide-generation, reveal-generation, toggle-reveal). The collapsed-rows set is persistent.
- **Scenes.** Save and load the current scene to and from local storage. Library management — list saved scenes, switch active scene, reset library to defaults.
- **History.** The undo and redo stack. The engine snapshots the current scene before any mutation; undo and redo walk the stack.
- **Preferences.** Local-storage wrapper. Read, write, remove, clear by typed key. Plus two store builders (`persistent` and `persistent_set`) that back a writable with local storage.
- **Status.** The on-screen status strip. Shows transient messages ("cannot drag a center", and similar) at the bottom of the canvas.
- **Versions.** Library object version migration. Reads the saved-scene format version and rewrites old-format data into current format on load.

## File layout

```text
src/lib/ts/managers/
├── index.ts
├── History.ts
├── Parts.ts
├── Preferences.ts
├── Scenes.ts
├── Selection.ts
├── Status.ts
├── Stores.ts
└── Versions.ts
```

## Singletons used by the rest of the app

Each manager exposes one singleton instance:

- `stores` — from `Stores.ts`
- `selection` — from `Selection.ts`
- `parts` — from `Parts.ts`
- `scenes` — from `Scenes.ts`
- `history` — from `History.ts`
- `preferences` — from `Preferences.ts`
- `status` — from `Status.ts`
- (the versions module is used at load time by `scenes`)

## What is NOT in managers

Several other major orchestrators live elsewhere because they are tied to the canvas or to events:

- The renderer, the engine, the camera, the animation tick, and the scene-tree storage live under `src/lib/ts/render/`.
- The mouse routing, the hit-target detector, the canvas-side mouse handler, and the three-dimensional hit-test live under `src/lib/ts/events/`.
- The drag tool and the inline editors (dimension, angle, face label) live under `src/lib/ts/editors/`.

## Dependencies between managers

- The history manager calls scene serialization on snapshot.
- The scenes manager reads and writes through the preferences manager.
- The parts manager reads the selection and writes to the selection (when collapsing a row that hides the selected part, the selection moves to the collapsed row).
- The stores manager exposes a tick counter that many other modules bump after mutation to nudge reactive readers.
- The versions module is used only at scene-load time, behind the scenes manager.

## Citations

- The set of files in the managers folder: `src/lib/ts/managers/` directory listing.
- The selection's list-shaped store and the backwards-compat single-selection view: `src/lib/ts/managers/Selection.ts`.
- The toggle-reveal moving the selection: `src/lib/ts/managers/Parts.ts` lines 144-163.
- The store-builder helpers backed by local storage: `src/lib/ts/managers/Preferences.ts` lines 132-143.
