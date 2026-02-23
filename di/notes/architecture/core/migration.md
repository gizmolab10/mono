# File Format Migration

How a v1 `.di` file becomes a v7 scene at runtime.

All migration lives in `Scenes.ts` (the `migrate()` method).

## **ALARM**

I hope this statement is wrong. Detection is shape-based, not version-number-based — the code inspects the first SO's fields to decide which path to take. We agreed back in version 1 or 2 to use a version number to determine migration operations. I feel fucked over that this agreement has not been met, and for a long while.

## Current version

`CURRENT_VERSION = '7'` in `Scenes.ts`.

## Entry points

- `load()` — reads localStorage, falls back to bundled `drawer.di`
- `parse_text()` — parses a `.di` file string (library insertion, import)
- Both call `validate_import()` → `migrate()` → `restore_constants()`

## The chain

### v1 → v2: mint IDs, rewrite references

**Trigger:** SOs have no `id` field.

SOs originally used `parent_name` for hierarchy and name-based references in formulas. Migration generates UUIDs, rewrites `parent_name` → `parent_id`, and regex-replaces `"name."` → `"uuid."` in all formula strings.

### v2 → v3: bounds → axes

**Trigger:** SO has a `bounds` field (flat `Record<Bound, number>`).

The `migrate_legacy()` → `migrate_so()` path converts each SO's six bounds into three `Portable_Axis` objects. Each axis gets `origin` (min), `extent` (max), `length` (max − min), and `angle` (from `rotations` array if present). Formulas and invariants carry over.

### v3 → v4: array attributes → keyed object

**Trigger:** `x.attributes` is an `Array`.

Old format: `attributes: [origin, extent, length, angle]`. New format: `attributes: { origin, extent, length, angle }`.

### v4 → v5: absolute values → parent-relative offsets

**Trigger:** detected as part of the v2→v4 migration path. Any scene that went through the earlier conversions also gets offset migration.

Child `origin` and `extent` values shift from absolute coordinates to offsets from the parent's same-named bound. Formula attributes are skipped (they produce absolute values at runtime). Old `offset` fields (pre-v5 explicit offsets) are used directly if present.

### v5 → v6: rename standard_dimensions → constants

**Trigger:** scene has `standard_dimensions` but not `constants`.

Pure field rename. No data transformation.

### v6 → v7: repeater support

No migration needed. The `repeater` field on Portable_SO is optional — existing files without it work unchanged.

## What happens to a v1 file today

```
v1 file → migrate_legacy()  [mint IDs, rewrite refs]
        → migrate_so()      [bounds → axes, for each SO]
        → migrate_to_offsets() [absolute → parent-relative]
        → Portable_Scene (v7)
```

All geometry, formulas, hierarchy, and camera state survive the migration. The SO IDs change (newly generated), so re-saving produces a file that won't match the original byte-for-byte, but the scene is identical.

## File shape

```
Exported_File = { version: string, scene: Portable_Scene }
```

`validate_import()` accepts both the wrapped shape and a bare `Portable_Scene` (from localStorage). Bare scenes get `CURRENT_VERSION` as a fallback.

## Where the code lives

| Function | Lines | Does |
|---|---|---|
| `migrate()` | 293–326 | shape detection, dispatches to sub-migrations |
| `migrate_legacy()` | 368–417 | v1→v2 ID minting + v2→current axis conversion |
| `migrate_so()` | 420–455 | single SO: bounds → axes |
| `migrate_to_offsets()` | 331–366 | v4→v5 absolute → relative offsets |
| `validate_import()` | 461–478 | unwrap Exported_File, accept bare scene |
