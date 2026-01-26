# Startup Restore

**Started:** 2025-01-21
**Status:** Complete

## Problem

With the recents redesign complete, `si_recents` is the single source of truth. But on startup, `si_recents` is empty.

Old system had `_startup_grabs` hack:
```typescript
// In becomeFocus():
if (currentGrabs.length === 0 && this.si_recents.length === 0 && this._startup_grabs.length > 0) {
    currentGrabs = this._startup_grabs;
    currentIndex = this._startup_grabs.length - 1;
    this._startup_grabs = [];  // Clear after first use
}
```

This was deleted in Phase 5 cleanup.

## Question

**Is startup restore still working?**

Specifically:
1. Does something seed `si_recents` before the first `becomeFocus()` call?
2. Or do we lose persisted grabs on refresh?
3. Where does `restore_recents()` (or equivalent) get called?

## Investigation Needed

- [x] Find where localStorage grabs are read on startup
- [x] Trace the call path: localStorage → ??? → si_recents
- [x] Test: refresh page, verify grabs persist

## Solution

Changed from storing `grabbed`/`focus` separately to storing full `si_recents` array (max 10 items).

### Changes

**Enumerations.ts**
- Changed `T_Preference.grabbed` → `T_Preference.recents`

**S_Items.ts** — Added serialization support:
- `serialize<U>(itemSerializer)` — maps items through serializer
- `static deserialize<T,U>(data, itemDeserializer)` — creates S_Items from serialized data  
- `static fromDefault<T>(item)` — creates S_Items with single default item

**Preferences.ts** — Rewrote `restore_recents()`:
- Local `serialize` and `deserialize` functions for S_Recent ↔ plain object
- Uses `S_Items.deserialize()` to restore
- Subscribes to `si_recents.w_items` to persist on change (max 10 items)
- Removed separate `grabbed`/`focus` subscriptions

**Serialization format:**
```typescript
{
  focus: string,      // ancestry.pathString
  grabs: string[],    // array of pathStrings
  grabIndex: number,  // si_grabs.index
  depth: number
}
```

### Reset execution order fix

`reset_recents` and `reset_preferences` are called during `apply_queryStrings`, but `restore_*` functions run later and would overwrite the reset.

**Solution:** Use flags in Configuration.ts:
- `c.erase_recents` — checked by `restore_recents()`
- `c.erase_preferences` — checked by `restore_preferences()`

The `restore_*` functions check their flag first, clear localStorage if true, then continue with normal restore (which now uses defaults).

### Naming

Renamed for consistency:
- `preferences_reset` → `reset_preferences`
- `recents_reset` → `reset_recents`

## Key insight

Can't replace `x.si_recents` entirely — UX.ts constructor sets up derived stores that reference `si_recents.w_item`. Instead, populate the existing instance:
```typescript
x.si_recents.items = restored.items;
x.si_recents.index = restored.index;
```

## Related Files

- `src/lib/ts/managers/UX.ts` — si_recents, becomeFocus
- `src/lib/ts/common/Enumerations.ts`
- `src/lib/ts/state/S_Items.ts`
- `src/lib/ts/managers/Preferences.ts`
- `src/lib/ts/managers/Configuration.ts`
