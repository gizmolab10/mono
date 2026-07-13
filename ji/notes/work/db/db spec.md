# WS DB Engine — spec

Intersection stores documents. They are hierarchal and tagged. Support for firestore and local storage and file system. hierarchy is to be injected in phase 2.

> Where save/fetch touch that model, this spec just says "the records" and leaves the model's internals alone.
> All file paths below are under `ws/src/lib/ts/`.

Goal: "save a named document with one or more category tags and/or parents, and list them back."

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

- **firebase** (`DB_Firebase.ts`) — kind `remote`. Stores in **Firestore (cloud)**; per-record create/update/delete and live snapshots. Pulls in the whole Firebase SDK — `DB_Firebase.ts:2, 13, 35-37`.
- **local** (`DB_Local.ts`) — kind `local`. use **browser localStorage** for records and the browser's **File System Access API**  for storing blobs, and `showDirectoryPicker`) to scan a chosen folder into the blobs read-only, and can preview/download/copy-path the real files — `DB_Filesystem.ts:56-58, 93-101, 279-311`.

## Per-record bookkeeping (`persistable/Persistable.ts`, `state/S_Persistence.ts`)

- Every stored record extends **`Persistable`**, which owns an **`S_Persistence`** — a small object holding `isDirty`, `already_persisted`, a last-modify date, and the record's id — `S_Persistence.ts:6-26`.
- `Persistable.persist()` runs the subclass's create-or-update behind a gate that skips records that are not dirty — `Persistable.ts:32-36`, `S_Persistence.ts:37-46`.
- The save loops read `persistence.isDirty` and call `set_isDirty(false)` after writing — `DB_Common.ts:113-121`.

## What ji actually needs

The plugin architecture above ports whole — registry, shared base, backends, per-record bookkeeping, multiple tables. What changes for ji is only the **data** and external storage for blobs.

### Stored vs. derived

Two kinds of data, and the line between them matters:

- **Permanently stored, external to the app** — the five records (in the db) and the document blobs (in the blob store or filesystem). This is the source of truth; it survives a reload and is all any backend actually saves.
- **Built in memory on the fly** — the indexes and the derived sets (the roots, the untagged list, a walk's results, per-record dirty flag). None of these are saved. They are rebuilt from the stored records on load and updated as rows change.

### Five db records, plus the external blob

The db holds exactly five record types. The document blobs sit outside the db.

- **The document blob** — the raw file bytes, referenced by an id. **Never stored in a database.** The choice of backend determines where these bytes actually live:
    - local backend → filesystem, with file path as id.
    - remote backend (future) → a Google blob store (Cloud Storage), a by-unique-name file store with no size cap. Chosen because a single database record caps near a megabyte and a document can be larger.
- **Records** — live in the db. 
    - **Documents** — A unique id, a reference to a blob, the blob's name, its backend type (local or remote), its kind (text, image, pdf, ...) so it can be opened or shown, and a created/modified date for sort-by-recency.
    - **Tags** — A unique id, and a name.
    - **Tagging** — A unique id, a tag id and one document id. Each tagging record is one to one. a tag id can have many tagging records, so also a document id — thus allowing a many-to-many link between tags and documents.
    - **Relationships** — A unique id, a predicate id, a parent and a child id (referring either to documents or tags), and a sort position that orders children under one parent. Lets each kind independently form ordered **graphs** — a node may have many parents (grouping and audit trails, which don't care about overlap). A **root** is any node no relationship points to as a child. There can be many roots; walking must stay acyclic (never follow a parent back into itself).
    - **Predicates** — A unique id and a type (eg, parent, related to, supported by, and can be expanded to include other predicates)

### Deleting a document

Removing a document is a cascade: delete its tagging rows, delete any relationship rows where it is the parent or the child, delete the document record, then delete the blob through the same by-document-id feature. A tag is deleted the same way — drop its tagging rows and relationship rows first. This keeps orphans (dangling links, unreferenced blobs) from piling up.

### The three reads

- **List documents** — walk the graph from each root down by parent ids, and for each id read its tag records to know its categories. A blob is fetched by document id only when it is actually opened.
- **Filter by category** — read the tagging records for a tag id to get the document ids associated with it, then read those blobs.
- **Untagged (inbox)** — gather every document id that appears in any tagging record, then list the documents whose id is not in that set. A parent link does not count as a tag, so a document with parents but no tag still appears here.

These are accomplished by indexing, each of them updates when a tagging or relationship row is added or deleted:

- **Tagging by tag id** → the document ids wearing that tag. Powers **filter by category** in one lookup.
- **Tagging by document id** → a document's tags. Powers the per-document categories in **list documents**, and its set of keys is exactly the tagged documents — so **untagged** is all document ids minus that key set.
- **Relationships by parent id** → a node's children, already in sort order. Powers the downward walk in **list documents**. A companion **relationships by child id** gives each node's parents and, by its key set, the non-roots — so the roots are all nodes minus that set.
