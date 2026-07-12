# WS DB Engine — spec

> What the ws persistence engine does, as reference for a trimmed ji port.
> Out of scope on purpose: **airtable**, **bubble** (remote REST backends) and **hierarchy** (the in-memory graph model the records live in). Where save/fetch touch that model, this spec just says "the records" and leaves the model's internals alone.
> All file paths below are under `ws/src/lib/ts/`.

## Big picture

The engine is a **pluggable store**. One shared base class defines a save/fetch/CRUD contract; each concrete backend subclasses it and decides *where and how* data persists (browser storage, a cloud service, a picked folder, or nowhere). A registry holds one live instance per backend, remembers which one is active, and rebuilds the in-memory records when you switch.

So there are three layers:
1. **Registry** — picks and swaps the active backend.
2. **Base CRUD** — the common save/fetch/dirty logic every backend shares.
3. **Backends** — one class each, differing only in the storage mechanism.

Plus a small **per-record bookkeeping** object that tracks whether a record still needs saving.

## Layer 1 — the registry (`database/Databases.ts`)

- Caches one backend instance per type (`db_forType`, builds on first use) — `Databases.ts:86-100`.
- Tracks the active backend in a store, `w_t_database`; the chosen type is read from a saved preference and defaults to firebase — `Databases.ts:32, 41`.
- Switching backends (`grand_change_database`) sets the active one, gives it a fresh in-memory model, saves the choice, then fetches and redraws — `Databases.ts:52-67`.
- Can cycle to the next/previous backend in a fixed ring — `Databases.ts:69-84`.

## Layer 2 — the base CRUD (`database/DB_Common.ts`)

Every backend inherits `DB_Common`. It defines:

- **A persistence kind** (`T_Persistence`: `none` / `local` / `remote`) and capability flags derived from it — `isPersistent` (kind ≠ none), `isRemote` (kind = remote) — `DB_Common.ts:46-48`.
- **`fetch_all` / `persist_all`** — the top-level load and save entry points — `DB_Common.ts:51, 83`.
- **Per-record hooks** — `thing_…`, `trait_…`, `tag_…`, `predicate_…`, `relationship_…` create/update/delete, each of which simply re-saves everything (`persist_all`) — `DB_Common.ts:54-73`. (These record types belong to the graph model, out of scope here; for ji there is one type: documents.)
- **The local save loop** (`persistAll_identifiables_ofType_maybe`) — for a **local** DB, writes the whole list of one record type to storage and marks each record clean; for a **remote** DB, saves only the dirty records one at a time — `DB_Common.ts:109-124`.
- **The local fetch loop** (`fetch_all_fromLocal`) — reads each record type's list back and rebuilds each record; if a list is missing, seeds an empty starting state — `DB_Common.ts:126-147`.

## Layer 3 — the backends (kept)

Each backend is a tiny subclass that mostly just sets its persistence kind:

- **local** (`DB_Local.ts`) — kind `local`. Stores in **browser localStorage**. This is the real save mechanism and the only one ji needs. `DB_Local.ts:6-9`.
- **firebase** (`DB_Firebase.ts`) — kind `remote`. Stores in **Firestore (cloud)**; per-record create/update/delete and live snapshots. Pulls in the whole Firebase SDK — `DB_Firebase.ts:2, 13, 35-37`.
- **filesystem** (`DB_Filesystem.ts`) — kind `none` (not saved). Uses the browser's **File System Access API** (`showDirectoryPicker`) to scan a chosen folder into the records read-only, and can preview/download/copy-path the real files — `DB_Filesystem.ts:56-58, 93-101, 279-311`.
- **docs** (`DB_Docs.ts`) — kind `none`. Builds a fixed documentation tree from a bundled structure at load — `DB_Docs.ts:9, 17-40`.
- **test** (`DB_Test.ts`) — kind `none`. Hand-builds sample data on launch — `DB_Test.ts:7, 13-63`.

## Per-record bookkeeping (`persistable/Persistable.ts`, `state/S_Persistence.ts`)

- Every stored record extends **`Persistable`**, which owns an **`S_Persistence`** — a small object holding `isDirty`, `already_persisted`, a last-modify date, and the record's id — `S_Persistence.ts:6-26`.
- `Persistable.persist()` runs the subclass's create-or-update behind a gate that skips records that are not dirty — `Persistable.ts:32-36`, `S_Persistence.ts:37-46`.
- The save loops read `persistence.isDirty` and call `set_isDirty(false)` after writing — `DB_Common.ts:113-121`.

## The storage primitive (`managers/Preferences.ts`)

The local backend ultimately calls these:

- **`write_key(key, value)`** — `localStorage[key] = JSON.stringify(value)`, with a guard that warns and skips if the value is too large — `Preferences.ts:48-54`.
- **`get_forKey(key)`** — parses `localStorage[key]` back to a value — `Preferences.ts:44`.
- **`writeDB_key` / `readDB_key`** — the same, but the key is first namespaced by the active backend, so backends don't collide — `Preferences.ts:45-46`.

Net: **one localStorage key per record type, holding a JSON array.**

## What ji actually needs (the trim)

For "save a named document with one or more category tags, and list them back":

- Keep only the **local** pattern: one localStorage key holding a JSON array of `{ id, name, tags: string[] }` records (add a body/date field if wanted).
- Optionally keep the **one idea** from the bookkeeping layer: a per-record `isDirty` flag so a save button can light up. Everything else in that layer is collapsible to a boolean.
- **Drop:** the registry and backend switching, firebase, filesystem, docs, test, `Persistable`/`Identifiable` inheritance, and the graph model.
- ji already owns the storage primitive — its own settings wrapper reads/writes localStorage (`ji/src/lib/ts/managers/Preferences.ts`).

Estimated size for ji: a small document-store module (~15-20 lines: read the array, add/remove, write it back) plus a plain record type. No new dependencies.
