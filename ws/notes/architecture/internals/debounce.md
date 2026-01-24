# Debounce & Timing Consolidation Proposal

## Current State

10 ad-hoc timing patterns scattered across the codebase:

### TypeScript

| File | Pattern | Purpose | Delay |
|------|---------|---------|-------|
| Geometry.ts | `setTimeout(() => hits.recalibrate(), 100)` | Wait for DOM after rect change | 100ms |
| Geometry.ts | `setTimeout(() => hits.recalibrate(), 100)` | Wait for DOM after offset change | 100ms |
| Events.ts | `throttle()` method | Generic throttle utility | configurable |
| Events.ts | `setTimeout(() => h.db.persist_all(), 1)` | Defer auto-save to next tick | 1ms |

### Svelte

| File | Pattern | Purpose | Delay |
|------|---------|---------|-------|
| Widget_Title.svelte | `setTimeout(() => updateInputWidth(), 100)` | Wait for DOM in onMount | 100ms |
| Widget_Title.svelte | `setTimeout(() => ancestry.startEdit(), 1)` | Defer edit start | 1ms |
| Widget_Title.svelte | `setTimeout` + `requestAnimationFrame` | Debounced layout on title change | 400ms |
| Widget_Drag.svelte | `setTimeout(() => x.dragDotJustClicked = false, 100)` | Reset flag after click handled | 100ms |
| Search.svelte | `setTimeout(() => s_element_set_focus_to(), 1)` | Defer focus | 1ms |

### Already Centralized

| File | Purpose |
|------|---------|
| S_Busy.ts | `isRendering` flag for navigation rate-limiting |
| S_Busy.ts | `signal_data_redraw(after)` with configurable delay |
| Mouse_Timer.ts | Full timer infrastructure (autorepeat, double-click, long-click, alteration) |

---

## Categories

### 1. DOM Ready (100ms delays)
Wait for browser to finish layout/paint before measuring or recalibrating.

**Instances:**
- Geometry.ts × 2
- Widget_Title.svelte (onMount)
- Widget_Drag.svelte (flag reset)

**Proposal:** Add `busy.afterPaint(callback)` using `requestAnimationFrame`:
```typescript
afterPaint(callback: () => void) {
    requestAnimationFrame(() => {
        requestAnimationFrame(callback);  // double-RAF ensures paint complete
    });
}
```

### 2. Defer to Next Tick (1ms delays)
Yield to let current execution complete.

**Instances:**
- Events.ts (auto-save)
- Widget_Title.svelte (startEdit)
- Search.svelte (focus)

**Proposal:** Add `busy.defer(callback)`:
```typescript
defer(callback: () => void) {
    setTimeout(callback, 0);
}
```

### 3. Debounced Actions (400ms)
Coalesce rapid changes into single action.

**Instances:**
- Widget_Title.svelte (layout on title change)

**Proposal:** Add `busy.debounce(key, delay, callback)`:
```typescript
private debounceTimers: Map<string, number> = new Map();

debounce(key: string, delay: number, callback: () => void) {
    const existing = this.debounceTimers.get(key);
    if (existing) clearTimeout(existing);
    this.debounceTimers.set(key, setTimeout(() => {
        this.debounceTimers.delete(key);
        callback();
    }, delay));
}
```

### 4. Throttle (existing in Events.ts)
Rate-limit repeated calls.

**Proposal:** Move `throttle()` from Events.ts to S_Busy.ts.

---

## Proposed S_Busy.ts API

```typescript
export class S_Busy {
    // Existing
    isPersisting = false;
    isFetching = false;
    isRendering = false;
    isFocusEventDisabled = false;
    
    // New
    afterPaint(callback: () => void): void
    defer(callback: () => void): void
    debounce(key: string, delay: number, callback: () => void): void
    throttle(key: string, delay: number, callback: () => void): void
    
    // Existing helpers
    get isFocusEventEnabled(): boolean
    get isDatabaseBusy(): boolean
    async temporarily_set_isPersisting_while(closure): Promise<void>
    async temporarily_set_isFetching_while(closure): Promise<void>
    async temporarily_disable_focus_event_while(closure): Promise<void>
    signal_data_redraw(after?: number): void
}
```

---

## Migration Plan

### Phase 1: Add new methods to S_Busy.ts
- `afterPaint()`
- `defer()`
- `debounce()`
- Move `throttle()` from Events.ts

### Phase 2: Migrate TypeScript files
- Geometry.ts → `busy.afterPaint()`
- Events.ts → `busy.defer()`, remove local `throttle()`

### Phase 3: Migrate Svelte files
- Widget_Title.svelte → `busy.afterPaint()`, `busy.defer()`, `busy.debounce()`
- Widget_Drag.svelte → `busy.afterPaint()`
- Search.svelte → `busy.defer()`

---

## Benefits

1. **Single source of truth** for timing patterns
2. **Named keys** for debounce/throttle make debugging easier
3. **Consistent behavior** across codebase
4. **Testable** — can mock S_Busy in tests
5. **Discoverable** — developers look in one place

## Risks

- More imports of `busy` across codebase
- Slight overhead for simple cases

## Decision

- [ ] Implement full proposal
- [ ] Implement partial (just `afterPaint` and `defer`)
- [ ] Leave as-is (ad-hoc is fine for now)
- [ ] Other: _______________
