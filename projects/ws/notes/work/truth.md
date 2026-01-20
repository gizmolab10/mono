# Truth

**Started:** 2026-01-19
**Status:** Analysis complete

## Problem

Multiple overlapping sources of truth for grabs and focus create complexity and potential bugs.

## Analysis

### Focus — Sources of Truth

| Location | Type | Role |
|----------|------|------|
| `x.si_recents` | `S_Items<[Ancestry, S_Items<Ancestry>]>` | **Primary** — history of focus + grabs pairs |
| `x.w_ancestry_focus` | derived store | **Derived** from `si_recents.item[0]` |
| `x.w_ancestry_forDetails` | derived store | **Computed** from search, grabs, or focus |

**Flow:**
1. `ancestry.becomeFocus()` pushes `[ancestry, si_grabs]` onto `si_recents`
2. `w_ancestry_focus` is a derived store that reads from `si_recents.item[0]`
3. `ancestry_next_focusOn()` navigates `si_recents` index, restoring associated grabs

**Good:** Single source (`si_recents`), derived stores react automatically.

### Grabs — Sources of Truth

| Location | Type | Role |
|----------|------|------|
| `x.si_grabs` | `S_Items<Ancestry>` | **Primary** — current grabbed ancestries |
| `x.si_saved_grabs` | `S_Items<Ancestry>` | **Temp** — saved during search |
| `si_recents.item[1]` | `S_Items<Ancestry> \| null` | **Historical** — grabs associated with each focus |

**Flow:**
1. `ancestry.grab()` / `ancestry.ungrab()` / `ancestry.grabOnly()` mutate `si_grabs.items`
2. When focus changes, current `si_grabs` is stored in `si_recents` pair
3. `ancestry_next_focusOn()` restores grabs from the navigated pair
4. Search saves/restores grabs via `x.save_grabs()`

**Complications:**
- `update_grabs_forSearch()` overwrites `si_grabs.items` when search is active
- `search.selected_ancestry` can make something appear grabbed via `isGrabbed` check
- `si_recents` stores a reference to `si_grabs`, not a copy — mutations affect history

### isGrabbed — Multiple Paths

```typescript
get isGrabbed(): boolean {
    return this.includedInStore_ofAncestries(x.si_grabs.w_items)
        || (search.selected_ancestry?.equals(this) ?? false);
}
```

An ancestry appears grabbed if:
1. It's in `si_grabs.items`, OR
2. It's the search-selected result

### w_ancestry_forDetails — Three Priorities

```typescript
// Derived from 7 stores:
// search.w_t_search, si_found.w_index, si_found.w_items,
// show.w_show_search_controls, si_grabs.w_items, si_grabs.w_index, w_ancestry_focus

1. Search selected ancestry (if search active + selected)
2. Current grab (if any grabs)
3. Focus ancestry
4. Fallback: root
```

## Problems Identified

### 1. Reference vs Copy in Recents

When `becomeFocus()` stores `[ancestry, this.si_grabs]`, it stores a **reference**. Later mutations to `si_grabs` change the historical record. Should store a copy.

### 2. Search Overwrites Grabs

`update_grabs_forSearch()` replaces `si_grabs.items` with search results. This:
- Loses user's manual grabs
- Triggers recents subscription with overwritten grabs
- Creates confusing state where grabs != what user grabbed

### 3. isGrabbed Has Two Meanings

The `search.selected_ancestry` fallback makes `isGrabbed` mean two different things:
- "User explicitly grabbed this" vs "Search is showing this"

This leaks search state into grab semantics.

### 4. Derived Store Complexity

`w_ancestry_forDetails` depends on 7 stores. Changes to any can cascade unpredictably. The priority logic is implicit in code, not declarative.

## Recommendations

### Short-term Fixes

1. **Clone grabs in becomeFocus()** — Store `[ancestry, new S_Items(si_grabs.items)]` instead of reference
2. **Separate search display from grabs** — Create `w_ancestry_forSearchDisplay` instead of overwriting `si_grabs`

### Longer-term Simplification

1. **Single state machine** — Replace multiple stores with one that explicitly models modes:
   - `{ mode: 'normal', focus, grabs }`
   - `{ mode: 'search', focus, grabs, searchResults, selectedIndex }`
   
2. **Make priorities explicit** — Instead of derived store with implicit priorities, have explicit `get ancestry_forDetails()` that documents the rules

3. **Separate concerns** — `isGrabbed` should only mean "grabbed". Search highlighting is a separate concern.

## Files Involved

- `src/lib/ts/managers/UX.ts` — si_grabs, si_recents, becomeFocus logic
- `src/lib/ts/managers/Search.ts` — search state, selected_ancestry
- `src/lib/ts/runtime/Ancestry.ts` — grab/ungrab/isGrabbed methods
- `src/lib/ts/state/S_Items.ts` — generic list+index container

## Next Action

Redesigning recents and search from scratch — see `recents.md` and `search.md`.

Once those designs are solid, compare with current implementation and plan migration.
