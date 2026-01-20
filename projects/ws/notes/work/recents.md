# Recents

recents is broken. let's start over

## I Want the app to:

- Remember what i grab or when i change the focus
- Go backwards and forwards through history
- History is circular (after the last is the first)
- Remove current recent by typing "/"
- Unlimited length
- Mode to ignore all grabs (record but skip during navigation)

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
- `si_recents.item.focus` — current focus
- `si_recents.item.grabs` — current grabs  
- `si_recents.item.grabIndex` — current grab index
- `si_recents.item.depth` — current depth level

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

| #   | Method/Property            | Is                                            | Will Become                                                 |
| --- | -------------------------- | --------------------------------------------- | ----------------------------------------------------------- |
|     | UX.ts                      |                                               |                                                             |
| 1   | `w_ancestry_focus`         | Derived from `si_recents` pair                | Derived from `si_recents_new.item.focus`                    |
| 2   | `w_ancestry_forDetails`    | Uses `si_grabs.w_items`, `si_grabs.w_index`   | Derive from `si_recents_new.item.grabs`                     |
| 3   | `ancestry_next_focusOn()`  | Navigates `si_recents`, restores `si_grabs`   | Just navigate `si_recents_new` index                        |
| 4   | `becomeFocus()`            | Pushes `[ancestry, si_grabs]` to `si_recents` | Push snapshot to `si_recents_new`                           |
| 5   | `save_grabs()`             | Copies `si_grabs` to temp                     | Delete — snapshot already captures                          |
| 6   | `grabOnly()`               | Mutates `si_grabs.items = [ancestry]`         | Push snapshot to `si_recents_new`                           |
| 7   | `grab()`                   | Mutates `si_grabs.items.push()`               | Push snapshot to `si_recents_new`                           |
| 8   | `ungrab()`                 | Mutates `si_grabs.items.splice()`             | Push snapshot to `si_recents_new`                           |
| 9   | `update_grabs_forSearch()` | Overwrites grabs with search results          | Delete — search stays separate                              |
| 10  | `grab_next_ancestry()`     | Uses `si_grabs.find_next_item()`              | Mutate `si_recents_new.item.grabIndex`                      |
|     | Ancestry.ts                |                                               |                                                             |
| 11  | `isGrabbed`                | Checks `si_grabs.w_items` + search fallback   | Derive from `si_recents_new.item.grabs`, no search fallback |

### Phases

**Phase 1: Add new structure alongside old** (decisions: 1, 2)
- [ ] Create `S_Recent` type in `state/S_Recent.ts`
- [ ] Create `si_recents_new: S_Items<S_Recent>` in UX.ts
- [ ] Create derived stores `w_focus_new`, `w_grabs_new`, `w_depth_new`
- [ ] Test: Verify derived stores react to changes

**Phase 2: Wire up snapshot creation** (decisions: 4, 6, 7, 8)
- [ ] Create `snapshot_current(): S_Recent` helper
- [ ] Call snapshot on: `becomeFocus`, `grab`, `grabOnly`, `ungrab`, depth change
- [ ] Push snapshots to `si_recents_new` (parallel to old system)
- [ ] Test: Verify history accumulates correctly

**Phase 3: Wire up navigation** (decisions: 3, 10)
- [ ] Implement `recents_go(next: boolean)` using `si_recents_new`
- [ ] On navigate: state comes from snapshot, no replay
- [ ] Test: Forward/backward restores correct state

**Phase 4: Swap consumers (behind flag)** (decisions: 11)
- [ ] `isGrabbed` checks flag, uses new or old
- [ ] Test: App works with flag on

**Phase 5: Remove old code** (decisions: 5, 9)
- [ ] Delete `si_grabs`, old `si_recents`, `w_ancestry_focus`, `save_grabs`, `update_grabs_forSearch`
- [ ] Remove feature flag
- [ ] Rename `_new` → final names
- [ ] Test: Full regression

### Rollback

At any phase before 5, flip `use_new_recents = false` to restore old behavior.
