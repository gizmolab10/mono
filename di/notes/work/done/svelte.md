# Svelte 5 Migration


**Started:** 2026-01-05  
**Status:** Phase 3 complete ✅ — Migration done!


---

## Problem

Migrate `di` from Svelte 4 to Svelte 5 using modern best practices, with rigorous testing at each step.

### Dependency Isolation (verified ✅)

webseriously MUST stay on Svelte 4. Confirmed separation:
- **di** and **webseriously** are separate repos with isolated `node_modules`
- No yarn workspaces linking them
- webseriously explicitly pins `"svelte": "4.x"` in package.json
- Upgrading di to Svelte 5 cannot affect webseriously

## Goal

A fully Svelte 5 app using runes (`$state`, `$derived`, `$effect`, `$props`) with a roadmap that:

* (a) tracks progress
* (b) adapts to surprises
* (c) serves as sanity safety net


---

## Current State

### Tech Stack

* **Svelte:** 4.2.0 → needs 5.x
* **Vite:** 5.0.12 ✓ (already compatible)
* **@sveltejs/vite-plugin-svelte:** 3.0.0 → needs 5.x
* **TypeScript:** 5.3.3 ✓

### Codebase (small)

```
src/
├── App.svelte              # Main app, canvas + quaternion demo
├── main.ts                 # Entry point
└── lib/
    ├── svelte/draw/
    │   └── Printable.svelte  # Single component
    └── ts/
        ├── managers/         # Animation, Camera, Input, Render, Scene
        ├── types/            # Angle, Coordinates, Enumerations, etc.
        ├── state/S_Mouse.ts  # Mouse state
        └── ...
```

### Current Patterns

* **No stores** - plain TS classes/singletons
* **No** `$:` reactivity - canvas-based, imperative
* `onMount` in App.svelte for canvas init
* `bind:this` for canvas element

### Dependencies

* `gl-matrix` - math (no Svelte dependency)
* `typed-signals` - event system (no Svelte dependency)
* `uuid` - IDs (no Svelte dependency)


---

## Migration Assessment

**This is a simple migration.** The app is canvas-based with minimal Svelte usage:

* 2 Svelte files total
* No stores to migrate
* No complex reactivity
* No third-party Svelte components


---

## Phase 0: Tooling Upgrade

### 0.1 Upgrade Dependencies

```bash
# Check what needs updating
yarn outdated

# Upgrade Svelte ecosystem
yarn add -D svelte@^5 @sveltejs/vite-plugin-svelte@^5 svelte-check@^4
```

Required versions:

- [x] `svelte` → 5.x ✅
- [x] `@sveltejs/vite-plugin-svelte` → 5.x ✅
- [x] `svelte-check` → 4.x ✅
- [x] `vite` → 6.x (required by plugin) ✅

### 0.2 Verify

- [x] `yarn dev` works ✅
- [x] Canvas renders
- [x] Quaternion rotation works
- [x] No console errors

🔖 **CHECKPOINT 0:** App runs on Svelte 5, unchanged


---

## Phase 1: Convert App.svelte

### 1.0 Entry Point (main.ts)

Svelte 5 changed the component instantiation API.

Before (Svelte 4):
```typescript
const app = new App({ target: document.getElementById('app')! });
```

After (Svelte 5):
```typescript
import { mount } from 'svelte';
const app = mount(App, { target: document.getElementById('app')! });
```

- [x] Update main.ts to use `mount()` ✅

### 1.1 Props (none currently)

App.svelte has no props - skip.

### 1.2 State

Current:

```svelte
<script lang="ts">
  let canvas: HTMLCanvasElement;
</script>
```

After (if needed for reactivity):

```svelte
<script lang="ts">
  let canvas: HTMLCanvasElement = $state()!;
</script>
```

But `bind:this` just needs a variable, not reactive state. **May not need change.**

### 1.3 Lifecycle

Current: `onMount(() => init(canvas))`

Svelte 5 still supports `onMount`. **No change needed.**

### 1.4 Verify

- [x] App still works identically
- [x] No deprecation warnings

🔖 **CHECKPOINT 1:** App.svelte on Svelte 5 patterns


---

## Phase 2: Convert Printable.svelte

- [x] Read current implementation ✅
- [x] Convert `export let` props → `$props()` ✅
- [x] Convert `$:` → `$effect()` ✅
- [x] Add `lang='ts'` and types ✅
- [x] Fix stray backticks typo ✅
- [x] Verify ✅

**Pre-existing bug noted:** `printer_aspect_ratio` is undefined in `layout()`

🔖 **CHECKPOINT 2:** All components converted


---

## Phase 3: Future-Proof Patterns

Once migrated, establish patterns for new development:

### 3.1 State Management Pattern

For future reactive state needs, decide on:

* Class with `$state` fields (recommended for this codebase)
* Or keep imperative for canvas work

### 3.2 Document Patterns

- [x] Update `notes/designs/guides/composition.md` for Svelte 5 ✅
- [x] Removed Svelte 4 caveats ✅
- [x] Added runes cheatsheet ✅

🔖 **CHECKPOINT 3:** Patterns documented


---

## Testing Strategy

### Manual Testing (current approach)


1. `yarn dev`
2. Verify canvas renders
3. Drag to rotate - works?
4. Check console for errors/warnings

### Phase 4: Add Vitest

- [ ] Add vitest + @testing-library/svelte
- [ ] Test utility functions (Coordinates, Colors, etc.)
- [ ] Test component rendering


---

## Decisions Log

| Date | Decision | Rationale |
|----|----|----|    
| 2026-01-05 | Simple migration path | Codebase is small, canvas-based, minimal Svelte patterns |
| 2026-01-05 | Migration complete | All components converted, docs updated |


---

## Next Action

**Migration complete!** Optional: Phase 4 (Vitest) when ready for testing infrastructure.