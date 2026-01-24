# Startup Restore

**Started:** 2025-01-21
**Status:** Open question

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

- [ ] Find where localStorage grabs are read on startup
- [ ] Trace the call path: localStorage → ??? → si_recents
- [ ] Test: refresh page, verify grabs persist

## Related Files

- `src/lib/ts/managers/UX.ts` — si_recents, becomeFocus
- `src/lib/ts/state/S_Persisted.ts` — persistence layer (if exists)
- Startup/initialization code (TBD)
