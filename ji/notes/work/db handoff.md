# db implementation — progress

Tracks the build of [[db proposal]] against [[db spec]]. Design lives in the proposal; this file is status only.

## Done

- [x] **Record shapes** — Document (id, blob ref, name, backend, kind, date), Tag, Tagging, Relationship (with sort position), Predicate, plus the backend / kind / record enumerations.
  - `src/lib/ts/types/DB_Records.ts`
- [x] **Per-record bookkeeping** — in-memory dirty flag per record kind (the modify date lives on the Document, not here).
  - `src/lib/ts/database/Persistable.ts`
- [x] **Namespaced storage** — read/write one record kind's list, keyed by the active backend so they never collide; plus the active-backend setting.
  - `src/lib/ts/managers/Preferences.ts`
- [x] **Indexes** — tagging by tag id, tagging by document id, relationships by parent id and by child id; derived roots and untagged. Rebuilt on load and after each change.
  - `src/lib/ts/database/Indexes.ts`
- [x] **Shared base** — in-memory lists, load-all / save-all, per-record create hooks, the blob seam, the three reads, the delete cascade.
  - `src/lib/ts/database/DB_Common.ts`
- [x] **Local backend** — record lists in browser storage; blob seam in browser storage (stand-in for disk files).
  - `src/lib/ts/database/DB_Local.ts`
- [x] **Three reads + graph walk** — list documents (acyclic walk from each root), filter by tag, untagged.
- [x] **Delete cascade** — drop tagging + relationship rows, the record, and the blob; same for a tag.
- [x] **Registry** — one instance per backend, active-backend store, saved choice, the ring (local only for now).
  - `src/lib/ts/database/Databases.ts`
- [x] **Removed** the old flat Documents.ts (wrong shape).

## Verified

- `yarn svelte-check` — 0 errors, 0 warnings.
- Driven test — save a document and list it back after a fresh reload; tag and filter; ordered children under a parent; delete cascade leaves no orphan rows or blob.
  - `src/lib/ts/database/DB.test.ts` — 4 passing.

## Not yet built

- [ ] **Blobs as real files on disk** (proposal step 4) — the local blob seam is browser storage for now; the File System Access API path is pending (needs a user gesture).
- [ ] **Firestore backend + Google blob store** (proposal step 6) — the seam and registry make it a drop-in; not started.
- [ ] **Binary blobs** — the blob seam holds text (a string) today; binary needs an encoding decision.
- [ ] **Wire into the app** — nothing calls the store yet; Add.svelte's drop still only logs. That is the sibling "determine design and wire in" subpart.
