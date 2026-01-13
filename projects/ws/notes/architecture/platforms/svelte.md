# Svelte 5 Migration Roadmap

**Started:** 2026-01-05  
**Status:** Planning

---

## Current State Assessment

### Tech Stack
- **Svelte:** 4.x (need upgrade to 5.x)
- **Vite:** 4.3.2 (need upgrade for Svelte 5 compatibility)
- **@sveltejs/vite-plugin-svelte:** 2.0.3 (need upgrade to 4.x or 5.x)
- **TypeScript:** 5.4.5 ✓
- **Vitest:** 4.0.16 ✓

### Architecture Patterns (to migrate)
1. **Stores:** Heavy use of `writable()`, `derived()`, `get()` from `svelte/store`
   - Singleton managers (x, g, h, k, etc.) with store properties
   - Derived stores for computed state
   - Store subscriptions in components

2. **Reactivity:** Svelte 4 patterns throughout
   - `$:` reactive statements
   - `$store` auto-subscriptions
   - `export let` props

3. **Lifecycle:** Standard Svelte 4
   - `onMount`, `onDestroy` 
   - `tick` for DOM updates

4. **Component Structure:**
   - ~60 Svelte components across 12 directories
   - Deep prop drilling through geometry/state objects
   - Signal-based communication between components

---

## Svelte 5 Migration Targets

### New Paradigm: Runes

| Svelte 4 | Svelte 5 |
|----------|----------|
| `let x = 0` (reactive in component) | `let x = $state(0)` |
| `$: doubled = x * 2` | `let doubled = $derived(x * 2)` |
| `$: { console.log(x) }` | `$effect(() => { console.log(x) })` |
| `export let prop` | `let { prop } = $props()` |
| `writable()` stores | `$state()` with classes or `createStore()` |
| `$store` auto-subscribe | Direct access (stores still work) |

### Migration Strategy: Incremental

Svelte 5 has **full backward compatibility** for Svelte 4 syntax. We can migrate incrementally:
1. Upgrade tooling
2. Verify everything still works
3. Migrate one pattern at a time
4. Test rigorously at each step

---

## Phase 0: Foundation (CURRENT)

### 0.1 Tooling Upgrade
- [ ] Upgrade `svelte` to 5.x
- [ ] Upgrade `@sveltejs/vite-plugin-svelte` to 5.x
- [ ] Upgrade `vite` to 5.x or 6.x
- [ ] Upgrade `@sveltejs/kit` if needed
- [ ] Update `vitest` config for Svelte 5
- [ ] Run existing tests → **must pass**

### 0.2 Baseline Verification
- [ ] `yarn dev` works
- [ ] App loads and renders
- [ ] All existing tests pass
- [ ] No console errors

🔖 **CHECKPOINT 0:** App runs unchanged on Svelte 5

---

## Phase 1: Store Migration

### 1.1 Analyze Store Usage
- [ ] Catalog all stores across managers
- [ ] Map store dependencies
- [ ] Identify isolated vs. interconnected stores

### 1.2 Create Svelte 5 Store Pattern
- [ ] Design new state pattern (class with `$state`, or wrapper)
- [ ] Create adapter/migration utilities if needed
- [ ] Test pattern in isolation

### 1.3 Migrate Core Stores (one at a time)
Order by isolation (least dependencies first):
- [ ] `busy` (S_Busy.ts)
- [ ] `show` (Visibility.ts)  
- [ ] `colors` (Colors.ts)
- [ ] `controls` (Controls.ts)
- [ ] `search` (Search.ts)
- [ ] `x` (UX.ts) - complex, do later
- [ ] `g` (Geometry.ts)
- [ ] `e` (Events.ts)

**Test after each migration**

🔖 **CHECKPOINT 1:** All stores migrated, tests pass

---

## Phase 2: Component Props

### 2.1 Convert Props Pattern
- [ ] Create script to identify `export let` usage
- [ ] Start with leaf components (no children)
- [ ] Work up component tree

### 2.2 Component Migration Order
Leaf components first:
- [ ] `draw/*` components (Box, Circle, Spinner, etc.)
- [ ] `text/*` components
- [ ] `mouse/*` components (Button, Slider, etc.)
- [ ] `widget/*` components
- [ ] `details/*` components
- [ ] `controls/*` components
- [ ] `search/*` components
- [ ] `main/*` components (last - these are parents)

🔖 **CHECKPOINT 2:** All components use `$props()`

---

## Phase 3: Reactivity

### 3.1 Convert Reactive Statements
- [ ] `$:` assignments → `$derived`
- [ ] `$:` side effects → `$effect`
- [ ] Complex reactivity chains → review/simplify

### 3.2 Clean Up
- [ ] Remove workarounds for Svelte 4 quirks
- [ ] Simplify reactive chains where possible
- [ ] Review and remove unnecessary tick() calls

🔖 **CHECKPOINT 3:** All reactivity uses runes

---

## Phase 4: New Patterns

### 4.1 Leverage Svelte 5 Features
- [ ] Consider Snippets for repeated markup
- [ ] Evaluate `$effect.tracking()` for debugging
- [ ] Review `$inspect()` for development

### 4.2 Performance Optimization
- [ ] Profile with Svelte 5 DevTools
- [ ] Identify unnecessary re-renders
- [ ] Optimize hot paths

🔖 **CHECKPOINT 4:** Modern Svelte 5 throughout

---

## Testing Strategy

### Per-Migration Tests
1. **Before:** Run full test suite
2. **After:** Run full test suite
3. **Manual:** Verify in browser

### Test Categories
- **Unit:** Store behavior, utility functions
- **Component:** Rendering, props, events
- **Integration:** Store ↔ component interaction
- **E2E:** Full user flows (manual for now)

### Current Test Coverage
```
src/lib/ts/tests/
├── Colors.test.ts
├── Coordinates.test.ts
├── UX_ancestry_next_focusOn.test.ts
├── UX_becomeFocus.test.ts
├── UX_direct_setters.test.ts
├── UX_initialization.test.ts
├── UX_integration.test.ts
├── serializers.test.ts
└── setup.ts
```

### Test Commands
```bash
yarn test        # Run all tests
yarn test:ui     # Visual test runner
yarn test:run    # Single run (CI)
```

---

## Risk Mitigation

### Git Strategy
- Branch per phase: `svelte5/phase-0`, `svelte5/phase-1`, etc.
- Squash merge to main at checkpoints
- Tag releases: `v0.2-svelte5-phase0`, etc.

### Rollback Points
Each checkpoint is a safe rollback point. If phase N breaks things:
1. `git stash` current work
2. `git checkout` previous checkpoint tag
3. Investigate in isolation

### Known Risks
1. **Store subscriptions in derived:** May need refactoring
2. **Signal system:** May conflict with Svelte 5 reactivity
3. **Third-party Svelte components:** Check compatibility
4. **svelte-motion:** May need alternative

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-05 | Incremental migration | Svelte 5 backward compat allows safe, tested steps |
| | | |

---

## Notes

### Svelte 5 Resources
- [Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide)
- [Runes Documentation](https://svelte.dev/docs/svelte/runes)
- [What's New](https://svelte.dev/blog/svelte-5-is-alive)

### Dependencies to Check
- `svelte-motion` - Check Svelte 5 support
- `@svelteuidev/*` - Check Svelte 5 support
- `carbon-components-svelte` - Check Svelte 5 support
- `framework7-svelte` - Check Svelte 5 support

---

## Next Action

**Phase 0.1: Tooling Upgrade**

Start with upgrading dependencies and verifying the app still runs.
