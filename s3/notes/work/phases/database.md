# Database Layer Design Spec

Source files: `ws/src/lib/ts/database/`

---

## Overview

The database layer is a polymorphic abstraction over multiple storage backends. All concrete implementations extend `DB_Common`. The singleton `Databases` class manages instantiation, caching, and switching between backends. Each backend owns its own `Hierarchy` instance; switching databases swaps the active `Hierarchy` via `core.w_hierarchy`.

The layer covers five persistable entity types, enumerated as `T_Persistable`:
- `things`
- `relationships`
- `predicates`
- `traits`
- `tags`

Plus two Airtable-specific types: `access`, `users`.

Persistence mode is expressed by `T_Persistence` (from `common/Enumerations`):
- `T_Persistence.none` — not persisted (test, docs, filesystem, bubble-embedded)
- `T_Persistence.local` — localStorage via `p` helpers
- `T_Persistence.remote` — remote API (Firebase, Airtable, Bubble)

---

## T_Database Enum

Defined in `DB_Common.ts`:

```ts
export enum T_Database {
    filesystem = 'filesystem',
    firebase   = 'firebase',
    airtable   = 'airtable',
    unknown    = 'unknown',
    bubble     = 'bubble',
    dgraph     = 'dgraph',
    local      = 'local',
    test       = 'test',
    docs       = 'docs',
}
```

`dgraph` is listed but not implemented (its `DB_DGraph` import is commented out in `Databases.ts`).

## DB_Name Enum

Human-readable display names, also used as `idBase` default values:

```ts
export enum DB_Name {
    filesystem = 'Filesystem',
    airtable   = 'Airtable',
    unknown    = 'Unknown',
    firebase   = 'Public',
    bubble     = 'Bubble',
    dgraph     = 'DGraph',
    bulks      = 'Bulks',
    local      = 'Local',
    test       = 'Test',
    docs       = 'Docs',
}
```

Firebase's `idBase` defaults to `'Public'` but is overridden per URL query string or persisted preference.

---

## DB_Common — Abstract Base

`DB_Common` provides default implementations for all CRUD hooks. Subclasses override what they need.

### Instance fields

| Field | Default | Meaning |
|---|---|---|
| `t_persistence` | `T_Persistence.none` | Persistence mode |
| `t_database` | `T_Database.unknown` | Which backend |
| `idBase` | `DB_Name.unknown` | Namespace for all entities in this DB |
| `hierarchy` | (unset) | The `Hierarchy` owned by this DB instance |
| `load_time` | `'busy...'` | Human-readable load duration string |
| `load_start_time` | `-1` | Unix ms timestamp; `-1` means not timing |

### Computed properties

| Property | Logic |
|---|---|
| `displayName` | Returns `this.t_database` (overridden in Firebase to return `idBase`) |
| `details_forStorage` | `['fetch', this.load_time]` — overridden by some subclasses |
| `isStandalone` | `t_database != T_Database.bubble` |
| `isRemote` | `t_persistence == T_Persistence.remote` |
| `isPersistent` | `t_persistence != T_Persistence.none` |

### Overridable lifecycle hooks

```ts
setup_remote_handlers(): void
apply_queryStrings(queryStrings: URLSearchParams): void
hierarchy_fetch_forID(idBase: string): Promise<void>   // bulk browsing support
```

### Core fetch/remove

```ts
fetch_all(): Promise<boolean>        // delegates to fetch_all_fromLocal() by default
remove_all(): Promise<void>          // delegates to remove_all_fromLocal()
```

`remove_all_fromLocal()` iterates `Persistable.t_persistables` and calls `p.writeDB_key(key, null)` for each — i.e., clears localStorage. Only runs if `isPersistent`.

`fetch_all_fromLocal()` iterates `Persistable.t_persistables`, reads each from localStorage via `p.readDB_key(key)`, calls `h.extract_objects_ofType_fromDict()` per dict. If a key is absent and the DB is non-remote and standalone, creates defaults: default predicates for `T_Persistable.predicates`, a root thing for `T_Persistable.things`.

### CRUD method signatures (all async)

Each of the five entity types has three persistent CRUD methods:

**Things:**
```ts
thing_remember_persistentCreate(thing: Thing): Promise<void>
thing_persistentUpdate(thing: Thing): Promise<void>
thing_persistentDelete(thing: Thing): Promise<void>
```
Default base behavior: calls `h.thing_remember(thing)` on create, then calls `persist_all()` for all three.

**Predicates:**
```ts
predicate_remember_persistentCreate(predicate: Predicate): Promise<void>
predicate_persistentUpdate(predicate: Predicate): Promise<void>
predicate_persistentDelete(predicate: Predicate): Promise<void>
```

**Relationships:**
```ts
relationship_remember_persistentCreate(relationship: Relationship): Promise<void>
relationship_persistentUpdate(relationship: Relationship): Promise<void>
relationship_persistentDelete(relationship: Relationship): Promise<void>
```

**Traits:**
```ts
trait_remember_persistentCreate(trait: Trait): Promise<void>
trait_persistentUpdate(trait: Trait): Promise<void>
trait_persistentDelete(trait: Trait): Promise<void>
```

**Tags:**
```ts
tag_remember_persistentCreate(tag: Tag): Promise<void>
tag_persistentUpdate(tag: Tag): Promise<void>
tag_persistentDelete(tag: Tag): Promise<void>
```

One extra hook for focus:
```ts
thing_becomeFocus(thing: Thing): Promise<void>   // no-op in base
```

### persist_all()

```ts
async persist_all(force: boolean = false): Promise<void>
```

Entry point for saving all dirty entities.

- If `databases.defer_persistence` is true OR `features.allow_autoSave` is false (and not forced): signals a data redraw but does not persist.
- Otherwise: sets `busy.isPersisting = true`, iterates `Persistable.t_persistables`, calls `persistAll_identifiables_ofType_maybe()` for each.
- For Airtable only: uses a polling interval (100ms) waiting for `!h.isDirty` before clearing `busy.isPersisting`, instead of clearing it immediately.

### persistAll_identifiables_ofType_maybe()

```ts
async persistAll_identifiables_ofType_maybe(t_persistable: T_Persistable, force: boolean = false): Promise<void>
```

- **Remote DBs** (Firebase, Airtable): iterates all entities of type, calls `identifiable.persist()` per dirty item, clears dirty flag.
- **Local DB**: writes entire array to `p.writeDB_key(key, identifiables)`, clears all dirty flags.
- **Non-persistent DBs** (test, docs, filesystem, bubble): nothing happens.

### Startup sequence — hierarchy_setup_fetch_andBuild()

Called by `Databases.grand_change_database()` after setting the active hierarchy.

```ts
async hierarchy_setup_fetch_andBuild(): Promise<void>
```

1. `apply_queryStrings(c.queryStrings)` — let the DB parse URL params
2. If no `h` exists yet: `core.w_hierarchy.set(new Hierarchy(this))`
3. `core.w_t_startup.set(T_Startup.fetch)`
4. If `h.hasRoot`: skip to `h.ancestries_assureAll_createUnique()`, `h.restore_fromPreferences()`, `core.w_t_startup.set(T_Startup.ready)`, `x.setup_subscriptions()`
5. Otherwise: `hierarchy_create_fastLoad_or_fetch_andBuild()`

### hierarchy_create_fastLoad_or_fetch_andBuild()

```ts
async hierarchy_create_fastLoad_or_fetch_andBuild(): Promise<void>
```

1. If `c.eraseDB > 0`: decrement and call `remove_all()`.
2. `h.forget_all()` — clear all in-memory entity maps.
3. If `debug.fast_load`: try `fetch_all_fromLocal()` first as a cache. If it produced a root and the DB is non-remote, call `h.wrapUp_data_forUX()` and return. If remote, call `setup_remote_handlers()` and `persist_all()`.
4. Record `load_start_time`.
5. Await `fetch_all()`. If it returns true, await `h.wrapUp_data_forUX()`.

### update_load_time()

```ts
update_load_time(): void
```

Computes human-readable duration string from `load_start_time`. Sets `load_time` to e.g. `'took 2.3 seconds'`, `'instantaneous'`, or `'incomplete'`. Resets `load_start_time` to `-1`.

---

## Databases.ts — Abstraction Layer Manager

Singleton exported as `const databases = new Databases()`.

### Key fields

| Field | Type | Purpose |
|---|---|---|
| `dbCache` | `Dictionary<DB_Common>` | Lazily-instantiated DB instances keyed by `T_Database` string |
| `w_data_updated` | `writable<number>` | Svelte store — signals data change |
| `w_t_database` | `writable<string>` | Svelte store — current DB type string |
| `defer_persistence` | `boolean` | When true, `persist_all()` skips saving (used during batch operations) |
| `db_now` | `DB_Common` | The currently active DB |

### Constructor

1. Sets `db_now` to a Firebase instance (default).
2. Subscribes to `w_t_database`. On change: calls `grand_change_database(type)` in a `setTimeout(..., 10)` to wait for the hierarchy to be initialized.

### apply_queryStrings()

```ts
apply_queryStrings(queryStrings: URLSearchParams): void
```

Reads the `?db=` query param. If present, looks up the DB by type. Otherwise reads from `T_Preference.db` in localStorage, defaulting to `T_Database.firebase`. Normalizes legacy values (`'firebase'` → `T_Database.firebase`, `'file'` → `T_Database.local`). Sets `w_t_database`.

### grand_change_database()

```ts
async grand_change_database(type: string): Promise<void>
```

1. Gets or creates the `DB_Common` instance for `type`.
2. Sets `db_now`.
3. Gets or creates a `Hierarchy` for that DB, sets `db.hierarchy`.
4. Persists the new `type` to `T_Preference.db`.
5. Sets `core.w_hierarchy` to the new hierarchy.
6. Sets `w_t_database`.
7. Awaits `db.hierarchy_setup_fetch_andBuild()`.
8. Signals `busy.signal_data_redraw()`.

### db_forType()

```ts
db_forType(t_database: string): DB_Common
```

Lazily creates and caches instances. Mapping:

| `T_Database` value | Concrete class |
|---|---|
| `firebase` | `DB_Firebase` |
| `airtable` | `DB_Airtable` |
| `bubble` | `DB_Bubble` |
| `local` | `DB_Local` |
| `test` | `DB_Test` |
| `docs` | `DB_Docs` |
| `filesystem` | `DB_Filesystem` |
| `dgraph` | (commented out, not instantiated) |

### db_change_toNext() / db_next_get()

Cycles through databases in a fixed ring order. Forward cycle:

`local → firebase → airtable → dgraph → test → docs → filesystem → local`

### startupExplanation

Returns a human-readable string like `(loading your firebase data, from Public)`. Returns empty string for `test`.

---

## DB_Firebase — Firebase / Firestore

### Backend

Firebase Firestore (project `seriously-4536d`). Uses Firebase JS SDK v9+ modular API. `t_persistence = T_Persistence.remote`.

### Firestore schema

Two top-level areas:

**1. Predicates collection** (flat, not bulk-scoped):
```
/predicates/{predicateId}
    kind: T_Predicate
    isBidirectional: boolean
```

**2. Bulks sub-document structure:**
```
/Bulks/{idBase}/things/{thingId}
    title: string
    color: string
    t_thing: T_Thing

/Bulks/{idBase}/relationships/{relId}
    predicate: DocumentReference → /predicates/{id}
    parent:    DocumentReference → /Bulks/{idBase}/things/{id}
    child:     DocumentReference → /Bulks/{idBase}/things/{id}
    orders:    Array<number>
    kind:      T_Predicate

/Bulks/{idBase}/traits/{traitId}
    ownerID: string
    t_trait: T_Trait
    text: string

/Bulks/{idBase}/tags/{tagId}
    type: string
    thingHIDs: Array<Integer>
```

**3. Access log:**
```
/access_logs/{docId}
    ipAddress: string
    queries: string
    build: number
    timestamp: serverTimestamp
```

### Key fields

| Field | Value / Type |
|---|---|
| `idBase` | Defaults to `DB_Name.firebase` (`'Public'`); overridden by `?name=` or `?dbid=` param or `T_Preference.base_id` |
| `bulksName` | `'Bulks'` (the Firestore collection name for bulk namespacing) |
| `bulks` | `Dictionary<Bulk>` — map of `idBase` → `Bulk` (holds collection refs) |
| `deferSnapshots` | `boolean` — when true, incoming snapshots are queued rather than processed |
| `deferredSnapshots` | `Array<SnapshotDeferal>` |
| `predicatesCollection` | `CollectionReference` — set during `setup_remote_handlers()` |

### Bulk class

```ts
class Bulk {
    idBase: string
    tagsCollection: CollectionReference | null
    thingsCollection: CollectionReference | null
    traitsCollection: CollectionReference | null
    relationshipsCollection: CollectionReference | null
}
```

Collection references per bulk are populated by `setup_remote_handlers()` and used for all CRUD ops. `bulk_forID(idBase)` lazily creates `Bulk` objects.

### Fetch sequence

`fetch_all()`:
1. `recordLoginIP()` — logs visitor IP and query strings to `access_logs` (skips `69.181.235.85`)
2. `documents_fetch_ofType(T_Persistable.predicates)` — global, not bulk-scoped
3. `hierarchy_fetch_forID(this.idBase)`:
   - Fetches `relationships`, `traits`, `tags`, `things` (in that order — things last so IDs in other collections can be translated)
4. `setup_remote_handlers()` — attaches `onSnapshot` listeners
5. `fetch_bulkAliases()` — if current `idBase` is the bulk admin, discovers all other bulk namespaces

### documents_fetch_ofType()

```ts
async documents_fetch_ofType(t_persistable: T_Persistable, idBase: string | null = null): Promise<void>
```

- If `idBase` is null: reads from flat `/{t_persistable}` collection (predicates only).
- If `idBase` is set: reads from `/Bulks/{idBase}/{t_persistable}`.
- If collection is empty and `idBase` is set: calls `document_defaults_ofType_persistentCreateIn()` to seed defaults (creates the bulk document with `isReal: true` then removes that field, creates default predicates or default root thing).
- Calls `document_ofType_remember_validated()` for each doc.

### document_ofType_remember_validated()

Constructs a `Persistent*` value object from raw Firestore `DocumentData`, validates it, then calls the appropriate `h.*_remember_runtimeCreateUnique()` method:

| `T_Persistable` | `h` method called |
|---|---|
| `predicates` | `h.predicate_remember_runtimeCreateUnique(id, data.kind, data.isBidirectional)` |
| `things` | `h.thing_remember_runtimeCreateUnique(idBase, id, data.title, data.color, data.t_thing, true)` |
| `relationships` | `h.relationship_remember_runtimeCreateUnique(idBase, id, data.predicate.id, data.parent.id, data.child.id, data.orders, T_Create.isFromPersistent)` |
| `traits` | `h.trait_remember_runtimeCreateUnique(idBase, id, data.ownerID, data.t_trait, data.text, true)` |
| `tags` | `h.tag_remember_runtimeCreateUnique_forType(idBase, id, data.type, data.thingHIDs, true)` |

### Real-time listeners — setup_remote_handlers()

Called after initial fetch. Registers `onSnapshot` on each bulk sub-collection (all types except predicates). Predicates collection reference is saved to `this.predicatesCollection`.

Per snapshot:
- If `h.isAssembled` is false: ignores (startup still in progress).
- If `deferSnapshots` is true: calls `snapshot_deferOne()`.
- Otherwise: calls `handle_docChanges()` per doc change. Schedules a single `signal_docHandled()` call via `setTimeout(..., 0)` — deferred to after all microtasks complete so it fires exactly once per batch.

### handle_docChanges()

```ts
async handle_docChanges(idBase: string, t_persistable: T_Persistable, change: DocumentChange): Promise<boolean>
```

Validates data with `data_isValidOfKind()`. Routes to type-specific handler. Returns `true` if a rebuild is needed.

### Per-type change handlers

All follow the same pattern:

**`thing_handle_docChanges()`**
- `added`: skip if thing already known, or if it matches `this.addedThing` (echo suppression), or if it's the root. Otherwise create via `h.thing_remember_runtimeCreate()`.
- `removed`: call `thing.remove_fromGrabbed_andExpanded_andResolveFocus()`, then `h.thing_forget(thing)`. Root things: mark dirty instead of removing.
- `modified`: skip if modified within 800ms (debounce), or if no actual field changes. Apply changes via `thing_extractChangesFromPersistent()`.

**`trait_handle_docChanges()`** — same pattern. After any change, `setTimeout(20)` calls `h.traits_refreshKnowns()` and `g.grand_build()`.

**`tag_handle_docChanges()`** — same pattern. After any change, `setTimeout(20)` calls `h.tags_refreshKnowns()` and `g.grand_build()`.

**`relationship_handle_docChanges()`** — same pattern. `added` case: does not check `addedRelationship` (unlike things/traits/tags). On `modified`, applies changes via `relationship_extractChangesFromPersistent()`.

### signal_docHandled()

```ts
signal_docHandled(relationships_haveChanged: boolean): void
```

If relationships changed:
1. `busy.signal_data_redraw()`
2. `h.ancestries_fullRebuild()`
3. `setTimeout(20)`: `h.relationships_refreshKnowns()`, `h.rootAncestry.order_normalizeRecursive()`, `g.layout()`

### Snapshot deferral

When the local client creates an entity (e.g. `thing_remember_persistentCreate`), the pattern is:
1. Set `deferSnapshots = true`
2. Set `persistence.awaiting_remoteCreation = true`
3. `addDoc(...)` — Firestore assigns the permanent ID
4. Update the local object's ID via `h.thing_remember_updateID_to(thing, ref.id)`
5. Set `awaiting_remoteCreation = false`, `already_persisted = true`
6. Call `handle_deferredSnapshots()` to replay any snapshots that arrived during the write

The `SnapshotDeferal` class stores `(idBase, t_persistable, snapshot)` tuples.

### Echo suppression

Before a create, the object being added is stored in `this.addedThing`, `this.addedTrait`, or `this.addedTag`. The `*_handle_docChanges` handlers check `remoteThing.isEqualTo(this.addedThing)` — if matched, the `added` event is treated as an echo of the local write and ignored (returns `false`, no rebuild).

### Persistent value objects (wire format)

| Class | Fields stored to Firestore |
|---|---|
| `PersistentThing` | `title`, `color`, `t_thing` |
| `PersistentTrait` | `ownerID`, `t_trait`, `text` |
| `PersistentTag` | `type`, `thingHIDs` |
| `PersistentPredicate` | `kind`, `isBidirectional` |
| `PersistentRelationship` | `predicate` (DocumentReference), `parent` (DocumentReference), `child` (DocumentReference), `orders`, `kind` |

Each has `hasNoData` guard and `isEqualTo()` for comparison.

`PersistentThing.virginTitle` strips `@`-embedded metadata (splits on `@`, returns first part).

### Validation — data_isValidOfKind()

Static method. Required fields per type:
- `things`: `title`, `color`, or `t_thing` (any present)
- `traits`: `ownerID` and `t_trait`
- `tags`: `thingHIDs` and `type`
- `relationships`: `predicate`, `parent`, and `child`
- `predicates`: `kind`

### Bulk aliases — fetch_bulkAliases()

Only runs when `this.idBase == k.name_bulkAdmin`.

1. Gets the `ancestry_externals` from the hierarchy.
2. Fetches all documents in the top-level `Bulks` collection.
3. For each bulk doc not matching the current `idBase`:
   - If no alias thing exists: creates a `T_Thing.bulk` thing with the bulk's name as title (color `'red'`), adds it as a child of `externalsAncestry`.
   - If the alias thing exists and `thing_isBulk_expanded` is true: calls `h.ancestry_redraw_persistentFetchBulk_browseRight(thing)` to preload that bulk.

### Relationship ID resolution (cross-bulk)

`hierarchy_fetch_forID(idBase)` is also called from bulk alias expansion. It fetches the four bulk-scoped sub-collections for any given `idBase`, enabling stitching of external bulks into the active hierarchy at browse time.

### remove_all()

Deletes the `/Bulks/{idBase}` document and its `Things`, `Traits`, `Relationships` sub-collections. `Tags` are not explicitly listed in `subcollections_persistentDeleteIn()` — only `['Things', 'Traits', 'Relationships']`.

---

## DB_Local — localStorage

```ts
t_persistence = T_Persistence.local
t_database    = T_Database.local
idBase        = DB_Name.local   // 'Local'
```

No overrides. Inherits all behavior from `DB_Common`:
- `fetch_all()` → `fetch_all_fromLocal()` reads from localStorage via `p.readDB_key`.
- `persist_all()` → `persistAll_identifiables_ofType_maybe()` writes JSON arrays to `p.writeDB_key`.
- `remove_all()` → `remove_all_fromLocal()` nulls each key.

Data is stored as JSON in localStorage under keys matching `T_Persistable` values (lowercased): `things`, `relationships`, `predicates`, `traits`, `tags`.

---

## DB_Filesystem — File System Access API

```ts
t_persistence = T_Persistence.none
t_database    = T_Database.filesystem
idBase        = DB_Name.filesystem   // 'Filesystem'
```

Read-only. Maps a local directory tree into the graph.

### Storage

No persistence — data is re-derived from the filesystem on each load. The only persisted state is the previously-selected directory handle (via `files.save_directoryHandle` / `files.restore_directoryHandle`).

### Private state

| Field | Type | Purpose |
|---|---|---|
| `rootHandle` | `File_System_Directory_Handle \| null` | The user-selected directory |
| `file_information` | `Map<string, File_Entry>` | All discovered file/directory entries keyed by generated ID |

`File_Entry` shape:
```ts
interface File_Entry {
    id: string
    name: string
    path: string
    isDirectory: boolean
    handle: File_System_Handle
    parentId: string | null
}
```

### Fetch sequence

`fetch_all()` (called without user gesture, during DB switch):
1. Checks `DB_Filesystem.isSupported()` (requires `showDirectoryPicker` in `window`).
2. If `rootHandle` is null, attempts `files.restore_directoryHandle()`.
3. If a handle is available, calls `scanFromRoot()`.
4. If no handle: creates placeholder state — default predicates, a single root thing with title `'Click here to browse a folder'` and color `'blue'`.

`selectFolder()` (called from UI button with user gesture):
1. Calls `window.showDirectoryPicker({ mode: 'read' })`.
2. Saves handle via `files.save_directoryHandle(handle)`.
3. Clears hierarchy: `h.forget_all()`, nulls `h.rootAncestry`, `h.root`, `h.thing_dict_byAncestryHID`.
4. Calls `scanFromRoot()`, then `h.wrapUp_data_forUX()`, `core.w_hierarchy.set(h)`, `g.grand_build()`.

### Directory scanning — scanFromRoot() / scanDirectory()

`scanFromRoot()`:
1. Clears `file_information`.
2. Creates default predicates.
3. Generates root thing ID from `generateId(rootHandle.name, '')`.
4. Creates a `T_Thing.root` thing for the directory.
5. Registers the root entry in `file_information`.
6. Recurses via `scanDirectory(rootHandle, rootId, '', 0)`.

`scanDirectory(dirHandle, parentId, parentPath, depth)`:
- Depth limit: 5 levels.
- For each entry in `dirHandle.values()`:
  - Path: `parentPath + '/' + handle.name`
  - ID: `generateId(name, path)` — replaces non-alphanumeric chars with `_`, truncates to 50 chars
  - Color: `'steelblue'` for directories, `colorForFile(name)` for files
  - `t_thing`: `T_Thing.folder` for directories, `T_Thing.generic` for files
  - Creates a Thing via `h.thing_remember_runtimeCreateUnique()`
  - Creates a `T_Predicate.contains` relationship to the parent with `[order, 0]`
  - For previewable files: adds a `T_Trait.link` trait with the relative path as text
  - Recurses into directories

### Color map

Files are colored by extension:
- PDF: `#e74c3c`
- doc/docx: `#2980b9`
- txt/md: `#7f8c8d`
- xls/xlsx/csv: `#27ae60`
- Images (jpg/png/gif/svg/webp): `#9b59b6`
- js: `#f1c40f`, ts: `#3498db`, svelte: `#ff3e00`, html: `#e67e22`, css: `#1abc9c`, json: `#95a5a6`
- Audio/video: `#e91e63`
- Unknown: `'grey'`

### File access methods

```ts
get_file_handle(thingId: string): File_System_Handle | null
get_file_information(thingId: string): File_Entry | null
readFileAsText(thingId: string): Promise<string | null>
readFileAsDataURL(thingId: string): Promise<string | null>
downloadFile(thingId: string): Promise<void>
copyPath(thingId: string): Promise<boolean>
isPreviewable(filename: string): boolean
```

These are called from UX layers to read file content or trigger downloads. `readFileAsDataURL()` uses a `FileReader` with `readAsDataURL`. `downloadFile()` creates a temporary `<a>` element and programmatically clicks it.

### details_forStorage

Returns `['folder', this.rootHandle?.name ?? 'none']`.

---

## DB_Bubble — Embedded iframe / Bubble.io plugin

```ts
t_persistence = T_Persistence.remote
t_database    = T_Database.bubble
idBase        = DB_Name.bubble   // 'Bubble'
```

Not standalone (`isStandalone` returns false). Receives data from a parent Bubble.io page via `window.postMessage`. Also posts events back to parent.

### Message protocol — Inbound (parent → ws)

All inbound events arrive via `window.addEventListener('message', ...)`.

| `event.data.type` | Action |
|---|---|
| (empty `properties_string`) | `h.wrapUp_data_forUX()` |
| `'CHANGE_FOCUS'` | `changeFocusTo(bubble_properties.id)` |
| `'CHANGE_GRAB'` | `changeGrabTo(bubble_properties.id)` |
| `'CHANGE_GRAPH_MODE'` | Sets `show.w_t_graph` radial or tree |
| `'REPLACE_HIERARCHY'` | Sets `replace_hierarchy = true` flag |
| `'UPDATE_PROPERTIES'` | If `replace_hierarchy`: creates fresh `Hierarchy`. Then `extract_fromProperties(bubble_properties)` |

### Fetch sequence

`fetch_all()`:
1. Registers `window.addEventListener('message', this.handle_bubble_message)`.
2. Posts `{ type: 'listening' }` to `window.parent` — signals readiness.
3. Returns `false` immediately (data arrives asynchronously via message events).

### extract_fromProperties()

Consumes the full property payload from Bubble:

| Property | Type | Effect |
|---|---|---|
| `ids` | string[] | Thing IDs |
| `titles` | string[] | Thing titles |
| `colors` | string[] | Thing colors |
| `parents` | string[] | Parent ID lists (separator: `k.separator.generic`) |
| `related` | string[] | Related ID lists |
| `root` | string | ID of the root thing |
| `focus` | string | ID to set as focus |
| `in_radial_mode` | boolean | Graph mode |
| `zoom_scale` | number | Zoom level |
| `depth_limit` | number | Tree depth cap |
| `show_details` | boolean | Show details panel |
| `override_focus_and_mode` | boolean | Whether to apply focus/mode overrides |
| `override_zoom_scale` | boolean | Whether to apply zoom |
| `override_depth_limit` | boolean | Whether to apply depth |
| `erase_user_preferences` | boolean | Reset stored prefs |
| `suppress_tree_mode` | boolean | Force radial |

For each thing: creates `T_Thing.root` or `T_Thing.generic` thing, creates `T_Predicate.contains` relationships to parents, creates `T_Predicate.isRelated` relationships to related IDs. Orders are always `[1, 1]`.

First call: `h.wrapUp_data_forUX()` (sets `invoke_wrapUp = false`). Subsequent calls: `h.ancestries_assureAll_createUnique()` + `busy.signal_data_redraw()`.

### Message protocol — Outbound (ws → parent)

Set up by `setup_to_send_events()`, called after first valid inbound message. Sends:

| Svelte subscription | Message posted |
|---|---|
| `show.w_t_graph` changes | `{ type: 'in_radial_mode', in_radial_mode: bool }`, `{ type: 'trigger_an_event', trigger: 'mode_changed' }` |
| `x.w_ancestry_focus` changes | `{ type: 'focus_id', id }`, `{ type: 'trigger_an_event', trigger: 'focus_changed' }` |
| `x.w_grabs` changes | `{ type: 'selected_ids', ids }`, `{ type: 'trigger_an_event', trigger: 'selection_changed' }` |
| `show.w_show_catalist_details` | `{ type: 'selected_ids', ids }`, `{ type: 'trigger_an_event', trigger: 'selection_changed' }` |
| `x.w_ancestry_forDetails` changes | `{ type: 'details_id', id }`, `{ type: 'trigger_an_event', trigger: 'details_changed' }` |

All outbound messages use `window.parent.postMessage(..., '*')`. Each subscription is debounced by comparing to `prior_id[]` or `prior_grabbed_ids`. The `allow_response_to[]` array (indexed by `T_MID`) suppresses the first change event per channel (first fire is the initial subscription callback, not a real change).

The `T_MID` enum:
```ts
enum T_MID {
    details,  // 0
    focus,    // 1
    grab,     // 2
    mode,     // 3
}
```

---

## DB_Airtable — Airtable REST API

```ts
t_persistence = T_Persistence.remote
t_database    = T_Database.airtable
idBase        = DB_Name.airtable   // 'Airtable'
```

### Airtable bases configured

| Field | Base ID | Purpose |
|---|---|---|
| `basePivot` | `appopcsTBwET2o3RU` | Pivot |
| `baseCatalist` | `apphGUCbYIEJLvRrR` | Catalist |
| `basePublic` | `appq1IjzmiRdlZi3H` | Default / public |
| `baseWendy` | `appuDpzaPN3at9jRL` | Wendy |

Default `base` is `basePublic`. Overridden by `?name=tableID,token` query param.

### Tables per base

```ts
relationships_table = base(T_Persistable.relationships)
predicates_table    = base(T_Persistable.predicates)
things_table        = base(T_Persistable.things)
traits_table        = base(T_Persistable.traits)
access_table        = base(T_Persistable.access)
users_table         = base(T_Persistable.users)
```

`T_Persistable.access` and `T_Persistable.users` are Airtable-only.

### Fetch sequence

`fetch_all()`:
1. `things_fetch_all()`
2. `traits_fetch_all()`
3. `predicates_fetch_all()`
4. `relationships_fetch_all()`
5. `access_fetch_all()`
6. `users_fetch_all()`

### Field mappings on fetch

**Things:** `id`, `fields.title`, `fields.color`, `fields.type as T_Thing` (falls back to `fields.trait`). Calls `h.thing_remember_runtimeCreate()`.

**Traits:** `id`, `fields.text`, `fields.type as T_Trait`, `fields.ownerID as string[]` (takes `[0]`). Calls `h.trait_remember_runtimeCreateUnique()`.

**Predicates:** `id`, `fields.kind as T_Predicate`, `fields.isBidirectional as boolean`. Calls `h.predicate_remember_runtimeCreate()`.

**Relationships:** `id`, `fields.order as number`, `fields.parent as string[]` (takes `[0]`), `fields.child as string[]` (takes `[0]`), `fields.kindPredicate as T_Predicate`. Orders stored as `[order, 0]`. Calls `h.relationship_remember_runtimeCreateUnique(..., T_Create.isFromPersistent)`.

**Access:** `id`, `fields.kind`. Calls `h.access_runtimeCreate(id, kind)`.

**Users:** `id`, `fields.name`, `fields.email`, `fields.phone`. Calls `h.user_runtimeCreate()`.

### CRUD

Each type uses the Airtable SDK:
- Create: `table.create(entity.fields)` → returns record with permanent Airtable `id`. Updates local entity ID via `h.*_remember_updateID_to()` or `entity.setID(id)`.
- Update: `table.update(entity.id, entity.fields)`
- Delete: `table.destroy(entity.id)`

Quirk noted in `DB_Common.persist_all()`: Airtable is slower to confirm writes, so `busy.isPersisting` is not cleared immediately — instead a 100ms polling interval checks `!h.isDirty` before clearing it.

`hierarchy_fetch_forID()` is a no-op (`async hierarchy_fetch_forID(idBase: string) {}`). Airtable does not support multi-bulk namespacing.

`relationship_persistentDelete()` strips invalid identifiables first: `h.relationships = u.strip_invalid_Identifiables(h.relationships)`, calls `h.relationships_refreshKnowns()` immediately (fast UX update), then `await this.relationships_table.destroy(id)`.

---

## DB_Test — In-memory test data

```ts
t_persistence = T_Persistence.none
t_database    = T_Database.test
idBase        = DB_Name.test   // 'Test'
```

No persistence. Recreated on every launch. `details_forStorage` returns `['data', 'recreated on launch']`.

### Overrides

Overrides `fetch_all_fromLocal()` (not `fetch_all()`). Creates:

**Things:** `a`–`f` plus root `r` (Life, limegreen, `T_Thing.root`).

**Relationships (`contains`):** Full cross-product of connections between a–f and root. IDs like `cra`, `crb`, `cab`, `cac`, etc. Orders vary.

**Relationships (`isRelated`):** `rrb`, `rbd`, `rac`, `raf`, `rce`, `cfd`.

**Traits:**
- `ttc`: `T_Trait.text` on c — `'Carrumba Tinga!'`
- `tlb`: `T_Trait.link` on b — `'http://www.webseriously.org'`
- `ttb`: `T_Trait.text` on b — `'What a brilliant idea you have!'`

**Tags:**
- `f`: `'Fruity'` — `[d.hash(), c.hash()]`
- `m`: `'Moody'` — `[f.hash(), d.hash(), b.hash()]`
- `s`: `'Study'` — `[c.hash(), e.hash()]`

**Generated extras via `makeMore()`:**
- 4 children of Brilliant (b), prefix `'g'`, `contains`
- 4 parents of Brilliant (b), prefix `'c'`, `contains`
- 4 related to Brilliant (b), prefix `'e'`, `isRelated`
- 4 related to Root (r), prefix `'k'`, `isRelated`

### makeMore()

```ts
makeMore(count: number, first: string, kind: T_Predicate, idRef: string, asChild: boolean, order: number = 0): void
```

Generates `count` things with single-char IDs starting at `first`. Creates relationships of `kind` between `idRef` and each generated thing. Uses `Predicate.isBidirectional_for(kind)` to choose relationship ID prefix (`'r'` or `'c'`).

---

## DB_Docs — Documentation hierarchy

```ts
t_persistence = T_Persistence.none
t_database    = T_Database.docs
idBase        = 'Docs' as DB_Name
```

No persistence. Maps the static docs structure (imported from `files/Docs`) into a hierarchy.

### Overrides

Overrides `fetch_all_fromLocal()`.

1. Creates root thing with ID `'docs_root'`, title `'Documentation'`, color `'#4a90e2'`, `T_Thing.root`.
2. Adds `T_Trait.link` trait on root pointing to `'http://docs.webseriously.org/'`.
3. Calls `buildHierarchy(getDocsStructure(), 'docs_root', 0)`.

### buildHierarchy()

```ts
private buildHierarchy(nodes: DocNode[], parentId: string, depth: number): void
```

For each `DocNode`:
- ID: `${node.type}_${node.id}_${thingCounter++}` (monotonic counter prevents collisions).
- Color: depth-based from `getColorForDepth()`.
- Link trait: added if `node.type == 'file'` (uses `node.path`) or if `node.link` is present (uses `node.link`). Full URL is `docs_hostname + linkPath`.
- Relationship: `T_Predicate.contains` from parent, with `[order, depth]` as orders.
- Recurses into `node.children`.

### Color by depth

```
depth 0: #4a90e2  (blue)
depth 1: #7b68ee  (medium slate blue)
depth 2: #9370db  (medium purple)
depth 3: #ba55d3  (medium orchid)
depth 4: #da70d6  (orchid)
depth 5: #ee82ee  (violet)
```

Cycles modulo 6 for deeper trees.

### details_forStorage

Returns `['documentation', 'hierarchy']`.

---

## Persistence Flow Summary

### Creation (all entity types)

1. User action triggers e.g. `h.thing_remember_persistentCreate(thing)` which calls `db.thing_remember_persistentCreate(thing)`.
2. **Remote DBs** (Firebase, Airtable): `addDoc(collection, fields)` → remote assigns permanent ID → local entity ID updated → `already_persisted = true`.
3. **Local DB**: `h.thing_remember(thing)` then `persist_all()` → writes entire array to localStorage.
4. **Non-persistent DBs**: `h.thing_remember(thing)` only, no write.

### Update / Delete

1. Caller calls `db.thing_persistentUpdate(thing)` or `db.thing_persistentDelete(thing)`.
2. **Remote DBs**: direct `setDoc` / `deleteDoc` / `update` per entity.
3. **Local DB**: calls `persist_all()` which rewrites all entities of that type to localStorage atomically.
4. **Non-persistent**: no-op.

### Dirty flag flow

- Entities track `persistence.isDirty`.
- `persist_all()` → `persistAll_identifiables_ofType_maybe()` checks `isDirty` before calling `identifiable.persist()` (for remote) or batch-writes (for local).
- After write: `identifiable.set_isDirty(false)`.

### Fast-load path

If `debug.fast_load` is true, `hierarchy_create_fastLoad_or_fetch_andBuild()` tries localStorage first even for remote DBs. If a root is found in localStorage, it short-circuits the remote fetch. For remote DBs, it then calls `persist_all()` to sync the cached data back up.

---

## Cross-Database Stitching (Bulk Aliases)

Applies only to Firebase when `idBase == k.name_bulkAdmin`.

1. `fetch_bulkAliases()` queries the top-level `/Bulks` collection to get all bulk document IDs.
2. For each foreign bulk, creates a `T_Thing.bulk` thing with the bulk's ID as its title.
3. The thing is added as a child of `externalsAncestry` (a designated location in the hierarchy).
4. When a user browses into a bulk alias thing (`thing_isBulk_expanded`): `h.ancestry_redraw_persistentFetchBulk_browseRight(thing)` calls `hierarchy_fetch_forID(idBulk)` to load that bulk's data into the active hierarchy.
5. Bulk entity lookups use `bulk_forID(idBase)` to get the correct `CollectionReference` set for that namespace.

All entities from an external bulk carry the foreign `idBase` as their namespace, allowing things from multiple Firestore bulk documents to coexist in one hierarchy session.

---

## DB Cycling Order

The `db_next_get()` ring for forward navigation:

```
filesystem → local → firebase → airtable → dgraph (no impl) → test → docs → filesystem
```

`dgraph` is in the ring but `DB_DGraph` is not instantiated — `db_forType()` returns `undefined` for it (the `default` case is also commented out).
