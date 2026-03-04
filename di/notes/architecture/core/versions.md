# File Format Migration

How a v1 `.di` file becomes a v7 scene at runtime.

All migration lives in `Scenes.ts` (the `migrate()` method). Dispatch is version-number-based — `migrate(raw, version)` parses the version string to an integer and runs each step whose threshold exceeds it: `if (v < 3)`, `if (v < 4)`, etc.

## RESOLVED

Was shape-based (inspecting SO fields). We agreed in v1/v2 to use version numbers. Now it does — `validate_import()` extracts the version from `Exported_File`, and `migrate()` dispatches on it. Bare scenes (old localStorage without wrapper) get `CURRENT_VERSION` as fallback.

## Current version

`CURRENT_VERSION = '7'` in `Scenes.ts`.

## Entry points

- `load()` — reads localStorage (wrapped as `Exported_File`), falls back to bundled `drawer.di`
- `parse_text()` — parses a `.di` file string (library insertion, import)
- `load_from_text()` — loads from JSON text (library panel)
- `import_from_file()` — file picker import
- All call `validate_import()` → `migrate(scene, version)` → (optional) `restore_constants()`

## Version flow

```
raw data → validate_import() → { version, scene }
                                      ↓
                              migrate(scene, version)
                                      ↓
                              Portable_Scene (v7)
```

`validate_import()` handles two shapes:
- **Wrapped** (`Exported_File`): has `version` + `scene` fields. Version extracted directly.
- **Bare** (`Portable_Scene`): has `smart_objects` at top level. Assigned `CURRENT_VERSION` as fallback. Only fires for old localStorage data written before `save()` started wrapping.

## The chain

### v1/v2 → v3: mint IDs, rewrite references, bounds → axes

**Gate:** `v < 3`

`migrate_legacy()` handles both v1 and v2. v1 SOs lack `id` fields — migration generates UUIDs, rewrites `parent_name` → `parent_id`, and regex-replaces `"name."` → `"uuid."` in formula strings. Then `migrate_so()` converts each SO's six bounds into three `Portable_Axis` objects: `origin` (min), `extent` (max), `length` (max − min), `angle` (from `rotations` array if present). Formulas and invariants carry over.

### v3 → v4: array attributes → keyed object

**Gate:** `v < 4`

Old format: `attributes: [origin, extent, length, angle]`. New format: `attributes: { origin, extent, length, angle }`.

### v4 → v5: absolute values → parent-relative offsets

**Gate:** `v < 5`

Child `origin` and `extent` values shift from absolute coordinates to offsets from the parent's same-named bound. Formula attributes are skipped (they produce absolute values at runtime). Old `offset` fields (pre-v5 explicit offsets) are used directly if present.

### v5 → v6: rename standard_dimensions → constants

**Gate:** `v < 6`

Pure field rename. No data transformation.

### v6 → v7: repeater support

No migration needed. The `repeater` field on Portable_SO is optional — existing files without it work unchanged.

## What happens to a v1 file today

```
v1 file → validate_import()   [extract version: '1']
        → migrate(scene, '1')
          → v < 3: migrate_legacy()  [mint IDs, bounds → axes]
          → v < 4: no-op            [legacy already produces keyed objects]
          → v < 5: migrate_to_offsets() [absolute → parent-relative]
          → v < 6: no-op            [no standard_dimensions field]
        → Portable_Scene (v7)
```

All geometry, formulas, hierarchy, and camera state survive. SO IDs change (newly generated), so re-saving produces a file that won't match byte-for-byte, but the scene is identical.

## Storage

`save()` writes `{ version: CURRENT_VERSION, scene: Portable_Scene }` to localStorage. `add_to_library()` writes the same `Exported_File` shape to IndexedDB and disk.

## Where the code lives

Migration lives in `Versions.ts`. Scenes.ts calls `versions.migrate()` and keeps `validate_import()`.

| Function | File | Does |
|---|---|---|
| `versions.migrate()` | Versions.ts | version-based dispatch, runs the chain |
| `migrate_legacy()` | Versions.ts | v1→v2 ID minting + v2→v3 axis conversion |
| `migrate_so()` | Versions.ts | single SO: bounds → axes |
| `migrate_to_offsets()` | Versions.ts | v4→v5 absolute → relative offsets |
| `validate_import()` | Scenes.ts | unwrap Exported_File, extract version, accept bare scene |
