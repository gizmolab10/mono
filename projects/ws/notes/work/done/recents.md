# Recents

recents is broken. let's start over

## I Want the app to:

* Remember what i grab or when i change the focus
* Go backwards and forwards through history
* History is circular (after the last is the first)
* Remove current recent by typing "/"
* Unlimited length
* Mode to ignore all grabs (record but skip during navigation)

## Entry Structure — Single source of truth

```typescript
type Recent = {
    focus: Ancestry,
    grabs: Ancestry[],
    grabIndex: number,
    depth: number
}

si_recents = new S_Items<Recent>([])
```

**Single source of truth:**

* `si_recents.item.focus` — current focus
* `si_recents.item.grabs` — current grabs
* `si_recents.item.grabIndex` — current grab index
* `si_recents.item.depth` — current depth level

**New entry when:** focus, grabs, or depth changes. Snapshot the whole state.

**Navigation:** Move index, apply the snapshot. No replay logic.

**Derived stores:**

```typescript
w_focus = derived(si_recents.w_item, item => item?.focus)
w_grabs = derived(si_recents.w_item, item => item?.grabs)
w_depth = derived(si_recents.w_item, item => item?.depth)
```

No separate `si_grabs`, no separate `w_ancestry_focus`. Just `si_recents`.


---

## Migration Plan

### Panic Button

Feature flag in Features.ts:

```typescript
use_new_recents = false  // flip to true when ready
```

All new code checks this flag. Old paths stay intact until Phase 5.

### Decision Points (11)

| # | Method/Property | Is | Will Become |
|----|----|----|----|
|    | UX.ts |    |    |
| 1 | `w_ancestry_focus` | Derived from `si_recents` pair | Derived from `si_recents_new.item.focus` |
| 2 | `w_ancestry_forDetails` | Uses `si_grabs.w_items`, `si_grabs.w_index` | Derive from `si_recents_new.item.grabs` |
| 3 | `ancestry_next_focusOn()` | Navigates `si_recents`, restores `si_grabs` | Just navigate `si_recents_new` index |
| 4 | `becomeFocus()` | Pushes `[ancestry, si_grabs]` to `si_recents` | Push snapshot to `si_recents_new` |
| 5 | `save_grabs()` | Copies `si_grabs` to temp | Delete — snapshot already captures |
| 6 | `grabOnly()` | Mutates `si_grabs.items = [ancestry]` | Push snapshot to `si_recents_new` |
| 7 | `grab()` | Mutates `si_grabs.items.push()` | Push snapshot to `si_recents_new` |
| 8 | `ungrab()` | Mutates `si_grabs.items.splice()` | Push snapshot to `si_recents_new` |
| 9 | `update_grabs_forSearch()` | Overwrites grabs with search results | Delete — search stays separate |
| 10 | `grab_next_ancestry()` | Uses `si_grabs.find_next_item()` | Mutate `si_recents_new.item.grabIndex` |
|    | Ancestry.ts |    |    |
| 11 | `isGrabbed` | Checks `si_grabs.w_items` + search fallback | Derive from `si_recents_new.item.grabs`, no search fallback |

### Phases

#### **Phase 1: Add new structure alongside old** (decisions: 1, 2)

- [x] Create `S_Recent` type in `state/S_Recent.ts`
- [x] Create `si_recents_new: S_Items<S_Recent>` in UX.ts
- [x] Create derived stores `w_focus_new`, `w_grabs_new`, `w_depth_new`
- [x] Create `src/lib/ts/tests/recents_new.test.ts`
- [ ] Run `yarn test recents_new` — all pass

Test file:
```typescript
// recents_new.test.ts
describe('Phase 1: derived stores', () => {
  it('reacts to si_recents_new push', () => {
    si_recents_new.push({ focus: A, grabs: [B], grabIndex: 0, depth: 2 })
    expect(get(w_focus_new)).toBe(A)
    expect(get(w_grabs_new)).toEqual([B])
    expect(get(w_depth_new)).toBe(2)
  })
})
```

#### **Phase 2: Wire up snapshot creation** (decisions: 4, 6, 7, 8)

- [x] Create `snapshot_current(): S_Recent` helper
- [x] Call snapshot on: `becomeFocus`, `grab`, `grabOnly`, `ungrab`, depth change
- [x] Push snapshots to `si_recents_new` (parallel to old system)
- [x] Add Phase 2 tests to `recents_new.test.ts`
- [ ] Run `yarn test recents_new` — all pass

Add to test file:
```typescript
describe('Phase 2: snapshot creation', () => {
  it('creates snapshot on becomeFocus', () => {
    A.becomeFocus()
    expect(si_recents_new.length).toBe(1)
    expect(si_recents_new.item.focus).toBe(A)
  })

  it('creates snapshot on grab', () => {
    B.grab()
    expect(si_recents_new.length).toBe(2)
    expect(si_recents_new.item.grabs).toContain(B)
  })

  it('creates snapshot on grabOnly', () => {
    C.grabOnly()
    expect(si_recents_new.length).toBe(3)
    expect(si_recents_new.item.grabs).toEqual([C])
  })
})
```

#### **Phase 3: Wire up navigation** (decisions: 3, 10)

- [x] Implement `recents_go(next: boolean)` using `si_recents_new`
- [x] On navigate: state comes from snapshot, no replay
- [x] Add Phase 3 tests to `recents_new.test.ts`
- [x] Added `isNavigating` flag to prevent snapshot during navigation
- [ ] Run `yarn test recents_new` — all pass

Add to test file:
```typescript
describe('Phase 3: navigation', () => {
  beforeEach(() => {
    A.becomeFocus()           // index 0: focus=A, grabs=[]
    B.grabOnly()              // index 1: focus=A, grabs=[B]
    C.becomeFocus()           // index 2: focus=C, grabs=[B]
  })

  it('goes backward', () => {
    recents_go(false)         // backward to index 1
    expect(get(w_focus_new)).toBe(A)
    expect(get(w_grabs_new)).toEqual([B])
  })

  it('goes backward again', () => {
    recents_go(false)
    recents_go(false)         // backward to index 0
    expect(get(w_grabs_new)).toEqual([])
  })

  it('wraps circular', () => {
    recents_go(false)
    recents_go(false)
    recents_go(false)         // circular: backward to index 2
    expect(get(w_focus_new)).toBe(C)
  })

  it('goes forward', () => {
    recents_go(false)
    recents_go(false)
    recents_go(false)
    recents_go(true)          // forward to index 0
    expect(get(w_focus_new)).toBe(A)
  })
})
```

#### **Phase 4: Swap consumers (behind flag)** (decisions: 11)

- [x] Add `use_new_recents` flag to Features.ts
- [x] `isGrabbed` checks flag, uses new or old
- [x] Add Phase 4 tests to `recents_new.test.ts`
- [x] Removed `isNavigating` hack — replaced with direct push model
- [x] Added `busy.isRendering` rate-limiting for key repeat
- [ ] Implement actual derivation for `si_grabs` (see below)
- [ ] Run `yarn test recents_new` — all pass

**Phase 4b: Actual Derivation for si_grabs**

Current approach uses sync subscription to update `si_grabs` from snapshots:
```typescript
si_recents_new.w_item.subscribe(snapshot => {
    si_grabs.items = snapshot.si_grabs.items;
});
```

This works but `si_grabs` is "effectively derived" — two sources of truth.

Target: true derivation with single source of truth:
```typescript
w_grabs = derived(si_recents_new.w_item, item => item?.si_grabs?.items ?? [])
```

| Approach | Pros | Cons |
|----------|------|------|
| Sync subscription (current) | Zero consumer changes | Two sources, possible race |
| True derivation | Single source of truth, impossible race | Consumer migration |

Consumers to migrate:
- `x.si_grabs.items` → `get(x.w_grabs)`
- `x.si_grabs.w_items` → `x.w_grabs`
- `x.si_grabs.index` → derive from snapshot or add `w_grabIndex`
- `w_grabbed` in Svelte files → `w_grabs`

Steps:
- [x] Create `w_grabIndex_new` derived store
- [x] Update `w_ancestry_forDetails` to use new system when flag on
- [x] Update `grab_next_ancestry()` to mutate snapshot's index directly
- [x] Update `grab()`, `ungrab()` to read from `w_grabs_new`
- [x] Update `becomeFocus()` to read from `w_grabs_new` / `w_grabIndex_new`
- [x] Remove sync subscription
- [x] Test (manual steps 1-14)
- [x] Fix: shift-click (grab index not set)
- [x] Fix: startup seeding (fallback to si_grabs when si_recents_new empty)
- [x] Add persistence subscription for w_grabs_new

**Note:** Full history is NOT persisted — only current grabs/focus restore on refresh. History resets.

Add to test file:
```typescript
describe('Phase 4: isGrabbed with flag', () => {
  it('uses new system when flag on', () => {
    features.use_new_recents = true
    A.grabOnly()
    expect(A.isGrabbed).toBe(true)
    expect(B.isGrabbed).toBe(false)
  })
})
```

Manual test:

| Step | Action                                      | Expected                                    |
| ---- | ------------------------------------------- | ------------------------------------------- |
| 1    | Set `use_new_recents = true` in Features.ts | App compiles                                |
| 2    | Load app in tree mode                       | Root is focus, no grabs highlighted         |
| 3    | Click widget A                              | A highlighted (grabbed), details shows A    |
| 4    | Shift-click widget B                        | A and B highlighted, details shows B        |
| 5    | Click widget C                              | Only C highlighted, details shows C         |
| 6    | Press back key                              | Previous state restored (A+B or just A)     |
| 7    | Press forward key                           | C highlighted again                         |
| 8    | Switch to radial mode                       | Same grab state preserved                   |
| 9    | Click different widget                      | Highlight updates correctly                 |
| 10   | Open search, type query                     | Grabs unchanged (no highlight pollution)    |
| 11   | Select search result                        | Details shows result, grabs still unchanged |
| 12   | Press Escape (close search)                 | Original grabs restored in view             |
| 13   | Multi-grab A, B, C (shift-click)            | Details shows one (per grabIndex)           |
| 14   | Click next/prev arrows in details           | Cycles through A → B → C → A                |

#### **Phase 5: Remove old code** ✅ COMPLETE

- [x] Delete old `si_recents`, `save_grabs`, `update_grabs_forSearch`, `ancestry_next_focusOn`
- [x] Remove feature flag (`use_new_recents`)
- [x] Rename `_new` → final names (`si_recents`, `w_grabs`, `w_grabIndex`)
- [x] Clean up imports (removed `features` from Ancestry.ts, UX.ts)
- [x] `isGrabbed` simplified to just use `x.w_grabs`

**Final structure:**

```typescript
// UX.ts
si_recents = new S_Items<S_Recent>([])  // Single source of truth
w_grabs = derived(si_recents.w_item, item => item?.si_grabs?.items ?? [])
w_grabIndex = derived(si_recents.w_item, item => item?.si_grabs?.index ?? 0)
w_ancestry_focus = derived(si_recents.w_item, item => item?.focus)
```

**Note:** `si_grabs` retained for startup restore only (reads from localStorage).

**Remaining manual test:** Run final regression testing table above.

Verify no dangling references:
```
grep -r "si_grabs\|save_grabs\|update_grabs_forSearch" src/
```

Final manual regression testing:

| Area | Steps | Expected |
|----|----|----|
| **Focus** |    |    |
|    | Click widget | Widget becomes focus, tree recenters |
|    | Click breadcrumb | grabOnly that ancestor |
|    | Double-click widget | Focus changes, children expand |
| **Grabs** |    |    |
|    | Click widget | Single grab, highlighted |
|    | Shift-click another | Multi-grab, both highlighted |
|    | Click elsewhere | Previous grabs cleared |
|    | Click grabbed widget | Ungrab (if toggle behavior) |
| **History** |    |    |
|    | Make 5 focus/grab changes | History accumulates |
|    | Press back 3 times | Each state restores correctly |
|    | Press forward 2 times | States restore correctly |
|    | Press back past start | Wraps to most recent (circular) |
|    | Press "/" | Current entry removed from history |
| **Search** |    |    |
|    | Grab A, then open search | A stays grabbed |
|    | Type query, get results | Grabs unchanged |
|    | Arrow through results | Details updates, grabs unchanged |
|    | Press Enter on result | Result becomes focus+grab, search closes |
|    | Press Escape | Search closes, original grabs intact |
| **Details** |    |    |
|    | Grab single widget | Details shows that widget |
|    | Multi-grab A, B, C | Details shows one (per grabIndex) |
|    | Press next/prev in details | Cycles through grabbed items |
| **Modes** |    |    |
|    | Do all above in tree mode | Works |
|    | Switch to radial mode | Grabs preserved |
|    | Do all above in radial mode | Works |
| **Depth** |    |    |
|    | Change depth slider | History entry created |
|    | Navigate back | Previous depth restored |

## Completed

**Date:** 2025-01-21

### Verdict: ✅ `x.si_recents` IS the single source of truth for both focus and grabs.

**Current implementation:**

| Store | Role |
|-------|------|
| `x.si_recents` | **SINGLE SOURCE OF TRUTH** |
| `x.w_ancestry_focus` | Derived from `si_recents.w_item?.focus` |
| `x.w_grabs` | Derived from `si_recents.w_item?.si_grabs?.items` |
| `x.w_grabIndex` | Derived from `si_recents.w_item?.si_grabs?.index` |

**Key changes from old system:**

- No separate `x.si_grabs` exists
- All derived stores read from `si_recents.w_item`
- Every mutation (`grab`, `ungrab`, `grabOnly`, `becomeFocus`) creates a NEW `S_Recent` snapshot with CLONED grabs
- Fixes the "reference vs copy" problem identified above

The analysis in this document is now **historical** — it describes the old architecture that has been replaced.
