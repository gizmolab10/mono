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

**Phase 1: Add new structure alongside old** (decisions: 1, 2)

- [ ] Create `S_Recent` type in `state/S_Recent.ts`
- [ ] Create `si_recents_new: S_Items<S_Recent>` in UX.ts
- [ ] Create derived stores `w_focus_new`, `w_grabs_new`, `w_depth_new`
- [ ] Create `src/lib/ts/tests/recents_new.test.ts`
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

**Phase 2: Wire up snapshot creation** (decisions: 4, 6, 7, 8)

- [ ] Create `snapshot_current(): S_Recent` helper
- [ ] Call snapshot on: `becomeFocus`, `grab`, `grabOnly`, `ungrab`, depth change
- [ ] Push snapshots to `si_recents_new` (parallel to old system)
- [ ] Add Phase 2 tests to `recents_new.test.ts`
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

**Phase 3: Wire up navigation** (decisions: 3, 10)

- [ ] Implement `recents_go(next: boolean)` using `si_recents_new`
- [ ] On navigate: state comes from snapshot, no replay
- [ ] Add Phase 3 tests to `recents_new.test.ts`
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

**Phase 4: Swap consumers (behind flag)** (decisions: 11)

- [ ] `isGrabbed` checks flag, uses new or old
- [ ] Add Phase 4 tests to `recents_new.test.ts`
- [ ] Run `yarn test recents_new` — all pass

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

| Step | Action | Expected |
|----|----|----|
| 1 | Set `use_new_recents = true` in Features.ts | App compiles |
| 2 | Load app in tree mode | Root is focus, no grabs highlighted |
| 3 | Click widget A | A highlighted (grabbed), details shows A |
| 4 | Shift-click widget B | A and B highlighted, details shows B |
| 5 | Click widget C | Only C highlighted, details shows C |
| 6 | Press back key | Previous state restored (A+B or just A) |
| 7 | Press forward key | C highlighted again |
| 8 | Switch to radial mode | Same grab state preserved |
| 9 | Click different widget | Highlight updates correctly |
| 10 | Open search, type query | Grabs unchanged (no highlight pollution) |
| 11 | Select search result | Details shows result, grabs still unchanged |
| 12 | Press Escape (close search) | Original grabs restored in view |

**Phase 5: Remove old code** (decisions: 5, 9)

- [ ] Delete `si_grabs`, old `si_recents`, `w_ancestry_focus`, `save_grabs`, `update_grabs_forSearch`
- [ ] Remove feature flag
- [ ] Rename `_new` → final names
- [ ] Update test file: remove flag references, rename `_new` → final names
- [ ] Run `yarn test recents_new` — all pass

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

### Rollback

At any phase before 5, flip `use_new_recents = false` to restore old behavior.
