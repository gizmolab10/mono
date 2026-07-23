# Plan — records as Persistables

Make every stored record a real object with an identity and a dirty flag, the way ws does: a base **Identifiable** (its id), a base **Persistable** that extends it (its dirty flag), and the five record kinds extending Persistable. Nothing is built yet — this is the plan and the one decision it reverses.

## What ws has (the model)

- **Identifiable** — the root. Carries `id` and `hid` (the id's hash, for fast keying), a `newID()` maker, and `equals`. Source: [ws Identifiable.ts](../../../ws/src/lib/ts/runtime/Identifiable.ts).
- **Persistable extends Identifiable** — adds the save state: a dirty flag and a `persist()`. Source: [ws Persistable.ts](../../../ws/src/lib/ts/persistable/Persistable.ts). (ws's is heavy — bulk aliases, a persistence state object, closures. ji wants only the dirty flag.)
- Every record (Thing, Tag, Relationship, …) extends Persistable, so each one *is* an Identifiable with its own dirty flag. On load, ws builds real instances from the stored dicts (`new Thing(dict)`), so the methods and the flag are there.

## What ji has now

- Four records are plain **interfaces** — Tag, Tagging, Relationship, Predicate ([DB_Records.ts](../ji/src/lib/ts/types/DB_Records.ts)). Document is a class but is never `new`-ed for storage.
- Records are made as **object literals** and read back through `load_list` as **parsed JSON** — plain objects, not class instances. This is why the document logic is **statics** (`Document.family_of`, `Document.kind_of`, …): a loaded record has no methods to call.
- The name **"Persistable" is now free.** The per-store dirty-tracking manager that used to hold it was renamed to **Persistence** ([Persistence.ts](../ji/src/lib/ts/types/Persistence.ts)), so the new base class can take the name with no clash. (Risk #2 below is therefore resolved in advance.)

## The decision this reverses

ji chose **not to rehydrate** on load — records stay plain JSON, and behavior lives in statics. That was deliberate (it's why the statics exist). Making records extend Persistable means they must be **real instances** to carry a working dirty flag and methods, so **load must rehydrate**: turn each stored dict into `new Document(dict)`, `new Tag(dict)`, and so on. This plan brings rehydration back. The upside is ws fidelity and turning the document statics into plain methods; the cost is a construct-per-record step on every load and the churn below.

## The change

1. **Identifiable** (new, `types/Identifiable.ts`) — a small base: `id`, `hid` (the id's hash), a `newID()` maker, `equals`. ji has no `.hash()` on String today, so either add that String extension (as ws has) or compute the hash inline. **Open call:** carry `hid` at all, or just `id`? ji's lookups key on the string id already, so `hid` may be unneeded — leaving it out keeps this lean.
2. **Persistable extends Identifiable** (rename/replace `types/Persistable.ts`) — adds one thing: `isDirty` (a flag) plus `mark_dirty()` / `clear()`. The current dirty-**manager** goes away; its job (the total unsaved count for the save button) becomes a scan over the records' own flags, as ws does with `dirty_count`.
3. **The five records become classes** extending Persistable — Document (already a class, now extends Persistable), Tag, Tagging, Relationship, Predicate. Each gets a constructor that takes its fields (and can take a stored dict).
4. **Load rehydrates** — `Hierarchy.fetch_all` turns each dict from `load_list` into a real instance of its kind. `records_byID`, `documents_byName`, and the walk keep working unchanged, now holding instances.
5. **Save is unchanged in shape** — `JSON.stringify` of an instance writes its fields and drops its methods, which is exactly what we want; `load_list` reads the fields back and the constructor restores the instance.
6. **Follow-on (optional, later):** the document **statics** can become instance methods now that a loaded document is a real Document — `document.family()` instead of `Document.family_of(...)`. Big, separate, not part of this landing.

## What it touches

- `types/Identifiable.ts` (new), `types/Persistable.ts` (becomes the base; the manager's count-role moves onto records), `types/DB_Records.ts` (interfaces → classes), `types/Document.ts` (extends Persistable).
- `managers/Hierarchy.ts` — record creation (`new` instead of object literals), `fetch_all` rehydrates, the dirty-count readout (`persistable.total_dirty_count`) switches to a scan.
- `svelte/details/D_Data.svelte` — reads the unsaved count; switch to the scan.
- The `DB_Record` union stays; its members are now classes.

## Risks

- **Rehydration must carry every field** — a missed field on the constructor silently drops data on the first save. Guard with a round-trip test (save → load → deep-equal) per kind.
- **Name clash** — the existing `Persistable` (manager) and the new `Persistable` (base) can't both keep the name. Plan: the base takes the name; the manager is removed, its count re-derived.
- **No behavior change intended** — this is a shape change. The 28 tests must stay green; add the round-trip tests on top.

## Order (small, proved between each)

1. Identifiable + Persistable base (no records use them yet) — compiles, no behavior change.
2. Tag → class (the simplest) end to end: create, save, load-rehydrate, round-trip test. Prove the pattern.
3. The other three interfaces → classes, same pattern.
4. Document extends Persistable; rehydrate documents on load.
5. Remove the old dirty-manager; move the unsaved count to a scan.
6. (Later, separate) statics → methods.

## Open questions

- **Carry `hid` (the id hash), or just `id`?** ji keys on the string id everywhere, so `hid` may be dead weight. Lean: skip it unless a real use appears.
- **Dirty flag now, or defer?** The only reader is the "unsaved" count, and the local store re-saves everything and clears anyway. The flag matters for a remote store (save only what changed). Build the flag now for fidelity, or add it when remote lands?
- **`newID()` prefix** — ws prefixes ids ("NEW…"); ji uses bare `crypto.randomUUID()`. Keep bare, or adopt a prefix?
