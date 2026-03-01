# Launch

Design Intuition is a 3D editor. Launch creates the Graph component, which sets up a 3D canvas and populates it with Smart Objects (SO).

## Launch details

`Graph.svelte` mounts, sizes the canvas, calls `engine.setup(canvas)`. Setup has three phases:

1. **Core** — clear stale singletons (scene, hits_3d, animation), init renderer, camera, input events
2. **Scene** — `this.load_scene(scenes.load())` — Scenes reads localStorage (or falls back to the bundled default), migrates, restores constants, returns a `Portable_Scene`. Engine tears down any existing scene and rebuilds from the portable data.
3. **Input + render** — wire the handlers for drag/rotate/scroll, start the animation loop

`setup` runs once. After that, scene switches happen through `load_scene` directly (library click, new-scene button, file import) — no page reload needed.

### Engine construction

Runs at module init (before `setup`). Wires two reactive hooks:

- **Edge color sync** — keeps all `O_Scene.color` values in sync with the user's color preference
- **post_propagate_hook** — after any `propagate` or `propagate_all`, iterates all SOs and calls `sync_repeater` on any SO with a repeater config. This is how repeater clone counts stay current after dimension changes.

### Scene construction

Scene construction happens at launch (phase 2 of setup calls `load_scene`) and again whenever the user switches scenes — clicking a library entry, importing a file, or hitting new-scene. All three go through `load_scene`, which tears down the current scene and rebuilds from a `Portable_Scene`. Two other entry points add SOs to an existing scene without replacing it: `insert_child_from_text` (option-click in the library) and `duplicate_selected`.

All five paths share the same trap, and the same rule prevents it.

#### The two phases

Creating SOs in bulk (load, insert, duplicate) always has two phases:

1. **Build** — deserialize, wire into scene tree, `rebind_formulas` on each SO
2. **Cascade** — call `propagate_all()` once

Never interleave them. `rebind_formulas` evaluates formulas immediately (sets `attr.value`), and `propagate` cascades through the entire scene — including SOs that haven't been bound yet. If you propagate clone[0] before clone[1] is bound, propagate sees clone[1] in the scene tree with `value = 0` and enforces invariants on garbage. Worse, each `propagate` fires `post_propagate_hook` (sync_repeater), which adds/removes SOs mid-loop.

#### The pattern

```typescript
// Phase 1: build
for (const so of new_sos) {
    const parent_id = so.scene?.parent?.so.id;
    if (parent_id) constraints.rebind_formulas(so, parent_id);
}

// Phase 2: cascade
constraints.propagate_all();
```

Three call sites follow this pattern: `load_scene`, `insert_child_from_text`, `duplicate_selected`. All three had bugs before adopting it.

#### Single-SO edits are different

`propagate(so)` is fine when one SO changed (drag, dimension edit, formula commit, rotation). The scene is fully bound — propagate just cascades from the changed SO outward. The rule only applies to bulk creation where new SOs coexist in a half-bound state.
