# db implementation proposal

How to build the store [[db spec]] describes: the ws plugin architecture ported whole, ji's own five-record data model on top, document bytes kept outside the db. Nothing here departs from the spec — this is the build order and the file layout.

## The shape

Three layers plus bookkeeping, exactly as the spec's Layers 1–3:

- **Registry** — holds one live storage instance per kind, tracks the active one in a store, reads the choice from a saved setting, swaps and rebuilds on change.
- **Shared base** — the common load-all / save-all, the per-record create/change/delete hooks, the local save and load loops, and the read-blob / write-blob seam. Carries a persistence kind (local or remote) and the flags read off it.
- **Backends** — thin subclasses. ji builds two: local (records in browser storage, blobs as files on disk) and firestore (records in the cloud, blobs in the Google blob store). Each fills the blob seam its own way.
- **Per-record bookkeeping** — a small object per record holding the in-memory dirty flag. The last-modified date lives on the Document record itself, not here (so it survives a reload).

## The data (five records + external blob)

- **Document** — id, blob reference, name, storage type, kind, created/modified date.
- **Tag** — id, name.
- **Tagging** — id, tag id, document id (many-to-many).
- **Relationship** — id, predicate id, parent id, child id, sort position (ordered graph, many parents allowed).
- **Predicate** — id, type.
- **Blob** — the raw bytes, outside the db, reached by document id through the seam.

## Derived in memory (never saved)

Three indexes, rebuilt from the records on load, updated as rows change: tagging by tag id, tagging by document id, relationships by parent id (plus child id for roots). From these come the roots, the untagged set, and each read.

## The three reads

- **List documents** — walk the graph from each root down, categories per document from the tagging index.
- **Filter by category** — tagging-by-tag-id lookup.
- **Untagged (inbox)** — all documents minus the keys of tagging-by-document-id.

## Delete

A cascade: drop the tagging rows, drop the relationship rows (as parent or child), drop the record, drop the blob through the seam. Same for a tag. No orphans left behind.

## Proposed files (ji)

- `database/DB_Common.ts` — the shared base: kind, flags, load-all / save-all, per-record hooks, local save/load loops, blob seam.
- `database/DB_Local.ts` — local storage: records in browser storage, blobs as files on disk.
- `database/DB_Firestore.ts` — firestore storage: records in the cloud, blobs in the Google blob store, the Document's blob reference holding the path.
- `database/Databases.ts` — the registry: instance cache, active-storage store, saved choice, the ring.
- `database/Indexes.ts` — the three in-memory indexes and the derived roots / untagged sets.
- `persistable/Persistable.ts` — per-record dirty-flag bookkeeping.
- `types/` — the five record shapes.
- `managers/Preferences.ts` — per-storage namespaced read/write, plus the active-storage setting key.

## Build order

1. Record shapes + the base with the local storage and local save/load loops. Prove save-a-document-and-list-it-back with browser storage.
2. Indexes + the three reads.
3. Relationships + the graph walk + delete cascade.
4. The blob seam: local blobs as files on disk.
5. Registry + storage switching.
6. Firestore storage + the Google blob store (future; the seam and registry make it a drop-in).

## Verify

Each step ends with a driven check: add a document, reload, list it back; tag it, filter; delete it, confirm no orphan rows or blobs. Diagnostic logging on every save, load, index rebuild, and cascade — the count before and after, so every "why" reads off the log.
