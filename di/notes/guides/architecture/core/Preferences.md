# Preferences

A small wrapper around the browser's local storage. Reads and writes named values that survive across page reloads.

## Location

`src/lib/ts/managers/Preferences.ts`

## What it does

Stores typed values in the browser's local storage under a project-specific prefix. Provides four basic operations and two store-builders.

## Operations

- **Read.** Pull a value out by name. Returns the stored value or null if no value has been stored.
- **Write.** Save a value under a name. The value is JSON-encoded.
- **Remove.** Delete one stored value.
- **Clear.** Delete every stored value owned by this project.
- **Reset.** Delete every stored value except the saved scene and the saved library — used by the "factory reset" button.
- **Dump.** Print every stored value to the browser console for debugging.

## Builders

- **persistent.** Returns a writable store seeded with the value last saved under a key, and saves the value on every change.
- **persistent_set.** Same shape, but the value is a Set of strings, stored as a JSON array.

## Stored values

The set of names that can be stored is fixed by an enum. As of today the names cover:

- Layout: whether the side panel is open, which sub-panels are open.
- Colors: background, accent, text, edge.
- Units: imperial or metric.
- View: decorations bitmask, edge thickness, precision, view mode, solid flag, grid visibility, grid opacity.
- Rotation: rotation-snap on or off.
- Render: orientation, scale.
- Parts table: which tab is active, whether the parts list is shown, whether the givens are shown, the set of collapsed-row ids.
- Mode: editing-lock flag.
- Persistence: the saved scene, the saved library, the active library folder.

Citation: `src/lib/ts/managers/Preferences.ts` lines 11-60 — the `T_Preference` enum.

## Storage format

All values are JSON-encoded and stored under the prefix `di:`. So a key called `showDetails` lives in local storage at `di:showDetails`.

## Read failure

A read that finds no value, or finds an undecodable string, returns null. The caller is expected to fall back to a default.

## Related files

- `src/lib/ts/managers/Stores.ts` — many session-and-persistent values are built using the persistent helpers in this module.
- Any module that calls `persistent` or `persistent_set` to back a store with local storage.
