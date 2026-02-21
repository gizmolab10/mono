5 # Hierarchy.ts — Design Spec

File: `ws/src/lib/ts/managers/Hierarchy.ts`
Lines: 1753
Sections (marked by `static readonly _____SECTION`): 14

---

## Module-level exports

```ts
export let h!: Hierarchy;
core.w_hierarchy.subscribe(value => h = value);
```

`h` is the live singleton. It is re-assigned whenever the Svelte store `core.w_hierarchy` changes (i.e., when a new `Hierarchy` is constructed for a different database). All code in the app that needs the current hierarchy reads from `h`.

```ts
export type Ancestry_ByHID = { [hid: Integer]: Ancestry }
export type SI_Relationships_ByHID = { [hid: Integer]: S_Items<Relationship> }
```

Two structural type aliases used as dictionary value types throughout.

---

## Public instance fields

| Field | Type | Purpose |
|---|---|---|
| `ids_translated` | `Dictionary<string>` | Maps old IDs to new IDs during ID-replacement operations |
| `replace_rootID` | `string \| null` | When non-null, the root ID from the incoming file that should replace the live root. `k.empty` = replace, `null` = do not replace. Required for DB_Local at launch. |
| `si_traitThings` | `S_Items<Thing>` | Reactive set of ALL things that have at least one trait |
| `relationships` | `Array<Relationship>` | Master list of all relationships |
| `si_traits` | `S_Items<Trait>` | Reactive set of all traits |
| `predicates` | `Array<Predicate>` | All known predicates |
| `si_tags` | `S_Items<Tag>` | Reactive set of all tags |
| `externalsAncestry` | `Ancestry` | Cached ancestry for the `externals` container thing |
| `things` | `Array<Thing>` | Master list of all things |
| `rootAncestry` | `Ancestry` | The root ancestry (path = `k.root`, kind = `contains`) |
| `isAssembled` | `boolean` | True once `wrapUp_data_forUX()` completes |
| `db` | `DB_Common` | The database instance this hierarchy is bound to |
| `root` | `Thing` | The root thing |

---

## Private dictionaries

### Things

| Field | Key type | Value type | What it stores |
|---|---|---|---|
| `thing_dict_byHID` | `Integer` (hid) | `Thing` | Primary lookup: thing by its hash ID |
| `things_dict_byType` | `string` (T_Thing) | `Array<Thing>` | All things of a given type (e.g. `T_Thing.bulk`, `T_Thing.root`) |
| `things_dict_byTitle` | `string` | `Array<Thing>` | All things matching a given title string |
| `thing_dict_byAncestryHID` | `Integer` (ancestry hid) | `Thing` | Cache: the thing that belongs to a given ancestry |

### Relationships

| Field | Key type | Value type | What it stores |
|---|---|---|---|
| `relationship_dict_byHID` | `Integer` (hid) | `Relationship` | Primary lookup: relationship by its hash ID |
| `si_relationships_dict_byKind` | `string` (T_Predicate) | `S_Items<Relationship>` | All relationships of a given predicate kind |
| `si_relationships_dict_byParentHID` | `Integer` (parent thing hid) | `S_Items<Relationship>` | All relationships where a thing is the parent |
| `si_relationships_dict_byChildHID` | `Integer` (child thing hid) | `S_Items<Relationship>` | All relationships where a thing is the child |

### Ancestries

| Field | Key type | Value type | What it stores |
|---|---|---|---|
| `ancestry_dict_byHID` | `Integer` (ancestry hid) | `Ancestry` | Primary lookup: ancestry by its hash ID (hash of its path string) |
| `ancestry_dict_byKind_andHID` | `string` (T_Predicate kind) | `Ancestry_ByHID` | Two-level lookup: kind → (hid → Ancestry); used for kind-scoped ancestry queries |
| `si_ancestries_dict_byThingHID` | `Integer` (thing hid) | `S_Items<Ancestry>` | All ancestries that point at a given thing (a thing can have multiple ancestries if it has multiple parents) |

### Predicates

| Field | Key type | Value type | What it stores |
|---|---|---|---|
| `predicate_dict_byKind` | `string` (T_Predicate) | `Predicate` | Lookup: predicate by its kind string |
| `predicate_dict_byDirection` | `number` (0 or 1) | `Array<Predicate>` | Groups predicates by directionality: 0 = unidirectional, 1 = bidirectional |

### Traits

| Field | Key type | Value type | What it stores |
|---|---|---|---|
| `trait_dict_byHID` | `Integer` (hid) | `Trait` | Primary lookup: trait by its hash ID |
| `si_traits_dict_byType` | `string` (T_Trait) | `S_Items<Trait>` | All traits of a given trait type |
| `si_traits_dict_byOwnerHID` | `Integer` (owner thing hid) | `S_Items<Trait>` | All traits owned by a given thing (by owner ID hash) |
| `si_traits_dict_byThingHID` | `Integer` (thing hid) | `S_Items<Trait>` | All traits associated with a given thing (same key space as byOwnerHID — populated in parallel) |
| `si_things_dict_byT_trait` | `string` (T_Trait) | `S_Items<Thing>` | All things that have a trait of a given type |

### Tags

| Field | Key type | Value type | What it stores |
|---|---|---|---|
| `tag_dict_byHID` | `Integer` (hid) | `Tag` | Primary lookup: tag by its hash ID |
| `tag_dict_byType` | `string` | `Tag` | Lookup: tag by its type string (one tag per type) |
| `si_tags_dict_byThingHID` | `Integer` (thing hid) | `S_Items<Tag>` | All tags that reference a given thing |

### Ancillary

| Field | Key type | Value type | What it stores |
|---|---|---|---|
| `access_dict_byHID` | `Integer` (hid) | `Access` | Access records by hash ID |
| `access_dict_byKind` | `string` | `Access` | Access records by kind string |
| `user_dict_byHID` | `Integer` (hid) | `User` | User records by hash ID |

---

## Sections (the 14 `_____` dividers)

1. `_____ROOT` — root thing and root ancestry bootstrap
2. `_____THINGS` — plural things operations (refresh, forget-all, query by ancestry)
3. `_____THING` — singular thing CRUD: remember, forget, create, duplicate, delete, relocate
4. `_____BULKS` — bulk alias management (cross-database things)
5. `_____RELATIONSHIPS` — plural relationship operations, bidirectional queries, ID translation
6. `_____RELATIONSHIP` — singular relationship CRUD, dict maintenance, persistence
7. `_____ANCESTRIES` — plural ancestry operations, rebuild, traversal-based creation
8. `_____ALTERATION` — UX wiring for pending connection add/delete alteration mode
9. `_____ANCESTRY` — singular ancestry CRUD, expansion toggle, navigation (browse, relocate, move up/down)
10. `_____PREDICATES` — plural predicate operations
11. `_____PREDICATE` — singular predicate CRUD, defaults
12. `_____TRAITS` — plural trait operations (refresh, forget-all, ID translation)
13. `_____TRAIT` — singular trait CRUD, text mutation, type lookup
14. `_____TAGS` — tag CRUD and per-thing indexing
15. `_____ANCILLARY` — Access and User runtime creation
16. `_____FILES` — file I/O: export to JSON/CSV/Seriously, import from file
17. `_____LOST_AND_FOUND` — orphan recovery: lost-and-found container creation and population
18. `_____REMEMBER` — `forget_all()` and `refreshKnowns()` coordinator methods
19. `_____OTHER` — stats, focus accessor, alteration stop, depth calculation
20. `_____BUILD` — dirty tracking, JSON/Seriously extraction pipeline, UX wrapup

Note: the file has more than 14 unique section symbols; the comment in the prompt refers to the count of unique `_____` names. The actual count is 16 distinct names across 20 static declarations (some repeated).

---

## The 8 Responsibilities

### 1. Entity store

The canonical in-memory store for all persistable entities. Every entity type has:
- A flat array (or `S_Items`) as the master list
- One or more dictionaries for O(1) lookup

Entity types: `Thing`, `Relationship`, `Predicate`, `Trait`, `Tag`, `Ancestry`, `Access`, `User`.

### 2. Entity lifecycle

Every entity type follows the same remember/forget pattern (see below). Hierarchy is the single choke-point for adding or removing any entity from memory. No entity is constructed and left un-remembered if it is expected to participate in any lookup.

### 3. Ancestry navigation

Ancestries are path-addressed nodes in the hierarchy. The hierarchy manages:
- Creating unique ancestries on demand (`ancestry_remember_createUnique`)
- Traversal-based bulk creation (`ancestries_assureAll_createUnique`)
- Expansion state toggling (`ancestry_toggle_expansion`)
- Focus changes via `becomeFocus()`

### 4. UX orchestration

Keyboard-driven navigation and edit operations all flow through Hierarchy:
- `ancestry_rebuild_persistentMoveRight` — right/left arrow with modifiers
- `ancestry_rebuild_runtimeBrowseRight` — pure browse (no persistence)
- `ancestry_rebuild_persistentRelocateRight` — Option+arrow relocates
- `ancestry_rebuild_persistentMoveUp_maybe` — up/down arrow
- `ancestry_toggle_expansion` — expand/collapse
- `ancestry_edit_persistentCreateChildOf` — create child
- `ancestry_edit_persistentAddAsChild` — add existing thing as child
- `thing_edit_persistentAddLine` — insert a line separator
- `thing_edit_persistentDuplicate` — duplicate a thing in place
- `ancestry_alter_connectionTo_maybe` — apply a pending alteration (add/delete relationship)

### 5. Persistence bridge

Hierarchy delegates actual DB writes to `this.db` (a `DB_Common` subclass). It never writes directly. Lifecycle methods are named `remember_persistent*` when they also write, vs `remember_runtime*` when they are memory-only.

Key bridge calls:
- `db.thing_persistentDelete(thing)`
- `db.relationship_persistentDelete(relationship)`
- `db.relationship_remember_persistentCreate(relationship)`
- `db.trait_persistentDelete(trait)`
- `db.persist_all(force?)`
- `db.hierarchy_fetch_forID(title)` — bulk fetch
- `db.remove_all()` — wipe DB on full import

### 6. File I/O

Export:
- `persistRoot_toFile(format)` — exports the entire hierarchy rooted at `rootAncestry`
- `persist_toFile(format)` — exports from the grabbed/focused ancestry
- `persist_fromAncestry_toFile(ancestry, format)` — dispatches to JSON (implemented) or CSV (stub)
- `all_data` getter — assembles `{ title, idRoot, things, traits, predicates, relationships, tags }`
- `progeny_dataFor(ancestry)` — traverses progeny to collect all entities under a subtree
- `select_file_toUpload(format, SHIFT)` — sets `replace_rootID` and opens import popup

Import:
- `fetch_andBuild_fromFile(file)` — dispatches to `extractJSON_fromDict`, CSV via `pivot`, or `extractSeriously_fromDict`
- `extractJSON_fromDict(dict)` — two modes: (1) insert into current grab, (2) full replace (when `replace_rootID != null`)
- `extractSeriously_fromDict(dict, into)` — recursive import from the legacy "Seriously" format; creates things and traits, sets dates and orders
- `extract_allTypes_ofObjects_fromDict(dict)` — iterates all `T_Persistable` types, dispatches to per-type extractor
- `extract_objects_ofType_fromDict(t_persistable, dict)` — switch that calls the right `_extract_fromDict` method

### 7. Lost and found

Orphan recovery: things that have no parent relationship get placed into a "lost and found" container.

- `lost_and_found(): Promise<Thing | null>` — returns the lost-and-found `Thing` (creates it if needed via `ancestry_lost_and_found`)
- `ancestry_lost_and_found(): Promise<Ancestry | null>` — finds or creates a `T_Thing.found` child of `rootAncestry`
- `relationships_lostAndFound_persistentCreate(idBase)` — iterates all things; for each one with no parent relationship (and not root, and matching idBase), creates a `contains` relationship from lost-and-found to that thing

Note: `relationships_lostAndFound_persistentCreate` is currently commented-out at the `wrapUp_data_forUX()` call site. The infrastructure exists but is not active.

### 8. Bulk alias management

Bulk aliases are `T_Thing.bulk` things whose `title` is the `idBase` of another database. They act as cross-database portals.

- `bulkAlias_forTitle(title)` — looks up a bulk alias in `things_dict_byType[T_Thing.bulk]` by title match
- `bulkAlias_remember_forRootID_create(title, rootID, color)` — when a bulk database's root thing is loaded, registers that root's HID as a secondary key pointing to the bulk alias thing, so children relationships (which reference the foreign rootID) resolve correctly; sets `needsBulkFetch = true`
- `bulkAlias_remember_recursive_persistentRelocateRight(ancestry, parentAncestry)` — moves a subtree across bulk boundaries: recursively copies things into the destination `idBase`, creates relationships, expands, then deletes the originals
- `ancestry_remember_bulk_persistentRelocateRight(ancestry, parentAncestry)` — entry point for cross-bulk relocation; calls the recursive method and handles grab state

During `thing_runtimeCreate`: if a thing has `t_thing == T_Thing.root` but its `idBase` differs from `db.idBase`, it is treated as a foreign root and routed to `bulkAlias_remember_forRootID_create` instead of constructing a `Thing` directly.

---

## `remember` / `forget` per entity type

### `thing_remember(thing: Thing)`

1. Guards: skips if `thing` is falsy or already in `thing_dict_byHID`.
2. Adds to `thing_dict_byHID[thing.hid]`.
3. Pushes to `things` array if not already there (checked by id).
4. If `thing.isRoot` and idBase conditions are met: forgets the old root (handles bubble starting object), sets `this.root = thing`.
5. Pushes to `things_dict_byType[thing.t_thing]` if not already there.
6. Pushes to `things_dict_byTitle[thing.title]` if not already there.

### `thing_forget(thing: Thing, force: boolean = false)`

1. Guards: never forgets root unless `force = true`.
2. Removes from `thing_dict_byHID`.
3. Removes from `things` array.
4. Clears the `things_dict_byType` bucket for this type.
5. Clears the `things_dict_byTitle` bucket for this title.

Note: `things_dict_byType` and `things_dict_byTitle` are deleted entirely for the thing's type/title, not just the item — a coarse invalidation rather than a precise splice.

### `relationship_remember(relationship: Relationship)`

1. Guards: skips if `relationship_dict_byHID[relationship.hid]` already set.
2. Adds to `relationships` array.
3. Adds to `si_relationships_dict_byKind[relationship.kind]`.
4. Sets `relationship_dict_byHID[relationship.hid]`.
5. Calls `relationship_remember_dict_byKnown` for both `si_relationships_dict_byChildHID[relationship.hidChild]` and `si_relationships_dict_byParentHID[relationship.hidParent]`.
6. Alerts (!) if `relationship.idBase != this.db.idBase` — cross-db relationships are a hard error.

### `relationship_forget(relationship: Relationship)`

1. Deletes from `relationship_dict_byHID`.
2. Removes from `si_relationships_forKind(relationship.kind)`.
3. Removes from `relationships` array.
4. Calls `relationship_forget_forHID` for child and parent HID dicts.

### `ancestry_remember(ancestry: Ancestry)`

1. Sets `ancestry_dict_byHID[hid]`.
2. Sets the kind-scoped dict entry `ancestry_dict_byKind_andHID[ancestry.kind][hid]`.
3. Calls `ancestry_remember_forThing_ofAncestry` — pushes to `si_ancestries_dict_byThingHID[thing.hid]` if not already present.

### `ancestry_forget(ancestry: Ancestry | null)`

1. Deletes from `ancestry_dict_byHID`.
2. Deletes from `ancestry_dict_byKind_andHID[ancestry.kind]`.
3. Calls `ancestry_forget_forThing_ofAncestry` — removes from `si_ancestries_dict_byThingHID[thing.hid]`.

### `predicate_remember(predicate: Predicate)`

1. Sets `predicate_dict_byKind[predicate.kind]`.
2. Pushes to `predicates` if not already there.
3. Pushes to `predicate_dict_byDirection[isBidirectional ? 1 : 0]` if not already there.

### `predicate_forget(predicate: Predicate)`

1. Removes from `predicates_dict_byDirection` bucket; deletes bucket if empty.
2. Removes from `predicates` array.
3. Deletes from `predicate_dict_byKind`.

### `trait_remember(trait: Trait)`

1. Sets `trait_dict_byHID[trait.hid]`.
2. If `trait.owner` exists: pushes owner to `si_things_dict_byT_trait[trait.t_trait]` and to `si_traitThings`.
3. Pushes to `traits` (via `this.si_traits.items`).
4. Pushes to `si_traits_dict_byOwnerHID[ownerID.hash()]`.
5. Pushes to `si_traits_dict_byThingHID[ownerID.hash()]`.
6. Pushes to `si_traits_dict_byType[trait.t_trait]`.

### `trait_forget(trait: Trait)`

1. Deletes from `trait_dict_byHID`.
2. Deletes the entire `si_traits_dict_byOwnerHID[hid]` bucket.
3. Deletes the entire `si_traits_dict_byThingHID[hid]` bucket.
4. Deletes the entire `si_traits_dict_byType[trait.t_trait]` bucket.
5. Deletes the entire `si_things_dict_byT_trait[trait.t_trait]` bucket.
6. Removes from `si_traits`.
7. Removes `trait.owner` from `si_traitThings`.

### `tag_remember(tag: Tag)` / `tag_forget(tag: Tag)`

Both delegate to four helpers:
- `tag_addTo_known_tags(tag, add)` — flat array
- `tag_addTo_known_tags_dict_byHID(tag, add)` — `tag_dict_byHID`
- `tag_addTo_known_tags_dict_byType(tag, add)` — `tag_dict_byType`
- `tag_addTo_known_tags_dict_byThingHID(tag, add)` — `si_tags_dict_byThingHID` for every HID in `tag.thingHIDs`

The `add: boolean` parameter inverts the operation: `true` = insert, `false` = remove.

---

## Navigation methods in detail

### `ancestry_toggle_expansion(ancestry: Ancestry)`

- In radial mode: calls `ancestry_rebuild_persistentMoveRight` with `RIGHT = !ancestry.isExpanded` and all modifier flags false, then `g.grand_build()`.
- In tree mode: calls `ancestry.toggleExpanded()` then `g.grand_sweep()` if state changed.

### `ancestry_rebuild_persistentMoveRight(ancestry, RIGHT, SHIFT, OPTION, EXTREME, fromReveal)`

The main dispatcher for right/left arrow (and equivalent) with full modifier key support.

1. If `OPTION`: calls `ancestry_rebuild_persistentRelocateRight` (move the grabbed node to a new parent). Gated by `features.allow_graph_editing`.
2. If filesystem DB and `RIGHT` and file is previewable: calls `files.show_previewOf_file` instead.
3. If `RIGHT` and `thing.persistence.needsBulkFetch`: calls `ancestry_redraw_persistentFetchBulk_browseRight` (lazy bulk load).
4. Otherwise: calls `ancestry_rebuild_runtimeBrowseRight`.

### `ancestry_rebuild_runtimeBrowseRight(ancestry, RIGHT, SHIFT, EXTREME, fromReveal)`

Pure in-memory browse. No DB writes.

**RIGHT = true:**
- Returns early if no relevant relationships in tree mode.
- In tree mode: expands `ancestry`. If new grab is not visible at current depth, sets `newFocusAncestry` to `newGrabAncestry` stripped back to `depth_limit`.
- In radial mode: sets `newFocusAncestry = ancestry`; handles paging via `g_paging`.
- `SHIFT`: clears `newGrabAncestry` (expand without moving grab).

**RIGHT = false (LEFT):**
- `EXTREME`: root becomes focus.
- Not `SHIFT`, not from reveal: if not focus, expands parent.
- Not `SHIFT`, from reveal: toggles expanded on `ancestry`.
- `SHIFT`: collapses `ancestry` or parent depending on current state.

After computing grab/focus:
- Calls `newGrabAncestry.grabOnly()`.
- Conditionally calls `newFocusAncestry.becomeFocus()`.
- Calls `g.grand_sweep()` if layout changed, else `g.layout()`.

### `ancestry_rebuild_persistentRelocateRight(ancestry, RIGHT, EXTREME)`

Moves the grabbed thing to a new parent (with DB write).

1. `RIGHT`: new parent = next sibling of `ancestry`. `LEFT`: new parent = grandparent (strip back 2).
2. If crossing bulk boundaries: delegates to `ancestry_remember_bulk_persistentRelocateRight`.
3. Otherwise: mutates `relationship.idParent` to `parentThing.id`, adjusts order, rebuilds ancestry reference, grabs new ancestry, normalizes order recursively.
4. If parent was not expanded: expands it.
5. Handles refocus if relocated node is not visible at current depth.
6. Calls `g.grand_build()`.

### `ancestry_rebuild_persistentMoveUp_maybe(ancestry, up, SHIFT, OPTION, EXTREME)`

Delegates entirely to `ancestry.persistentMoveUp_maybe(up, SHIFT, OPTION, EXTREME)`. If the call returns `graph_needsSweep = true`, calls `g.grand_sweep()`.

### `ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe(up, SHIFT, OPTION, EXTREME)`

Reads `x.w_ancestry_forDetails` (current grab) and calls `ancestry_rebuild_persistentMoveUp_maybe` on it.

### `ancestry_redraw_persistentFetchBulk_browseRight(thing, ancestry, grab)`

Lazy-loads a bulk database:
1. Calls `db.hierarchy_fetch_forID(thing.title)`.
2. Calls `relationships_refreshKnowns()`.
3. In tree mode: expands `ancestry`, grabs first child if `grab` is true, calls `g.grand_build()`.
4. In radial mode: calls `ancestry.becomeFocus()` then `g.grand_build()`.

### `ancestry_alter_connectionTo_maybe(ancestry: Ancestry)`

Applies a pending alteration (stored in `x.w_s_alteration`):
- `T_Alteration.delete`: calls `relationship_forget_persistentDelete`.
- `T_Alteration.add`: calls `ancestry_persistentCreateUnique_byAddingThing` with the `from_thing`.
- Calls `stop_alteration()` and `g.grand_build()` after.

---

## Orphan recovery

`relationships_lostAndFound_persistentCreate(idBase: string)`:

Iterates `this.things`. For each thing where:
- `!thing.isRoot`
- `!relationship_whereHID_isChild(thing.hid)` (no parent relationship)
- `thing.idBase == idBase`
- `this.idRoot` exists

Creates a `T_Predicate.contains` relationship from the lost-and-found thing to the orphan, using `T_Create.getPersistentID` and auto-incrementing `parentOrder`.

Currently disabled at the call site in `wrapUp_data_forUX` (commented out). Infrastructure is complete.

`ancestry_lost_and_found()`:
- Checks `things_dict_byType[T_Thing.found]` — if found, returns the first item's ancestry.
- Otherwise calls `ancestry_persistentCreateUnique('lost and found', rootAncestry, T_Thing.found)` to create it.

---

## Cross-database bulk alias stitching

When a bulk database's data is fetched, its root thing arrives with its own `id` and `idBase`. The `thing_runtimeCreate` method intercepts this:

```ts
if (id && t_thing == T_Thing.root && idBase != this.db.idBase) {
    thing = this.bulkAlias_remember_forRootID_create(idBase, id, color);
}
```

`bulkAlias_remember_forRootID_create(title, rootID, color)`:
1. Finds the existing `T_Thing.bulk` thing whose `title` matches the foreign `idBase`.
2. Registers its HID under `rootID.hash()` in `thing_dict_byHID` — so when children relationships reference the foreign rootID, `thing_forHID` resolves them to the bulk alias thing in the host hierarchy.
3. Sets `bulkAlias.bulkRootID = rootID` and `needsBulkFetch = true`.

During `thing_runtimeCreate` for a `T_Thing.bulk` thing (not the foreign root case):
- Parses `title@bulkRootID` format: splits on `@` to extract the display title and `bulkRootID`.
- Sets `needsBulkFetch = true`.

This two-phase stitching (pre-fetch: alias created; post-fetch: root HID registered) allows the host hierarchy's relationship index to transparently bridge across database boundaries.

---

## Key public methods — full listing by section

### Section: ROOT

| Method | Signature | What it does |
|---|---|---|
| `assure_root_andAncestry()` | `(): void` | Creates `rootAncestry` if absent; resolves `this.root` from it |
| `hasRoot` | getter `boolean` | `!!this.root` |
| `idRoot` | getter `string \| null` | `this.root?.id ?? null` |

### Section: THINGS

| Method | Signature | What it does |
|---|---|---|
| `si_things_unique_havingTraits` | getter `S_Items<Thing>` | Returns `si_traitThings` |
| `things_forTitle(title)` | `(string): Array<Thing> \| null` | Looks up `things_dict_byTitle[title]` |
| `things_refreshKnowns()` | `(): void` | Clears and re-remembers all things from the saved master list |
| `things_forget_all()` | `(): void` | Clears `things`, `thing_dict_byHID`, `things_dict_byType` |
| `things_forAncestries(ancestries)` | `(Array<Ancestry>): Array<Thing>` | Maps ancestries → their things, skipping nulls |
| `things_forAncestry(ancestry)` | `(Ancestry): Array<Thing>` | For a `contains` ancestry: root + children. Otherwise: parent + children from relationship list |

### Section: THING

| Method | Signature | What it does |
|---|---|---|
| `thing_forHID(hid)` | `(Integer): Thing \| null` | O(1) lookup |
| `thing_remember_updateID_to(thing, idTo)` | `(Thing, string): void` | Forgets old, sets new ID, re-remembers, translates all referencing relationship and trait IDs |
| `thing_remember_runtimeCreateUnique(idBase, id, title, color, t_thing, already_persisted)` | returns `Thing` | Creates only if not already in dict; memory-only |
| `thing_remember_runtimeCreate(idBase, id, title, color, t_thing, already_persisted, needs_upgrade)` | returns `Thing` | Always creates; remembers; optionally marks dirty for upgrade |
| `thing_remember_runtimeCopy(idBase, original)` | `async`: returns `Thing` | Creates a copy with a new ID; strips prohibited types (`externals`, `root`, `bulk`) |
| `thing_edit_persistentAddLine(ancestry, below)` | `async`: void | Inserts a `T_Thing.generic` line separator above or below `ancestry` |
| `thing_edit_persistentDuplicate(ancestry)` | `async`: void | Copies thing, sets title to `'idea'`, adds as sibling |
| `thing_remember_persistentRelocateChild(child, fromParent, toParent)` | `async`: any | Finds the child→fromParent relationship, reassigns its `idParent`, persists |
| `thing_forAncestry(ancestry)` | `(Ancestry): Thing \| null` | Checks `thing_dict_byAncestryHID` cache first; computes via `ancestry.thingAt(1)` if miss |
| `thing_forget(thing, force)` | `(Thing, boolean): void` | Removes from all dicts and arrays; root is protected unless `force = true` |
| `thing_remember(thing)` | `(Thing): void` | See remember/forget section above |
| `thing_runtimeCreate(idBase, id, title, color, t_thing, already_persisted)` | returns `Thing` | Constructs `Thing`; intercepts foreign roots for bulk alias stitching |
| `thing_extract_fromDict(dict)` | `(Dictionary): void` | Deserializes a thing from a raw dict; handles root collision and replace_rootID |
| `thing_forget_persistentDelete(thing)` | `async`: void | Full delete: removes from grab/expanded/focus, forgets thing, deletes from DB, forgets+deletes all its ancestries, traits, and relationships |

### Section: BULKS

| Method | Signature | What it does |
|---|---|---|
| `bulkAlias_forTitle(title)` | `(string \| null): Thing \| null` | Finds bulk alias by title |
| `bulkAlias_remember_forRootID_create(title, rootID, color)` | `(string, string, string): Thing \| null` | Stitches foreign root ID to bulk alias |
| `bulkAlias_remember_recursive_persistentRelocateRight(ancestry, parentAncestry)` | `async`: `Ancestry \| null` | Recursively copies subtree into new bulk, deletes originals, expands |
| `ancestry_remember_bulk_persistentRelocateRight(ancestry, parentAncestry)` | `async`: void | Entry point for cross-bulk relocation |

### Section: RELATIONSHIPS

| Method | Signature | What it does |
|---|---|---|
| `si_relationships_forKind(kind)` | `(T_Predicate): S_Items<Relationship>` | Returns `si_relationships_dict_byKind[kind]` or empty |
| `relationships_refreshKnowns()` | `(): void` | Clears and re-remembers all relationships |
| `relationships_inBothDirections_forThing_andKind(thing, kind)` | `(Thing, string): Array<Relationship>` | Unions parent and child relationships for bidirectional lookup |
| `relationships_forget_all()` | `(): void` | Clears all relationship dicts and the master array |
| `relationships_areAllValid_forIDs(ids)` | `(string[]): boolean` | Returns false if any ID (non-empty) has no matching relationship |
| `relationships_ofKind_forParents_ofThing(kind, forParents, thing)` | `(string, boolean, Thing): Array<Relationship>` | Looks up by kind + thing's HID (uses `idBridging` for children to handle bulk aliases) |
| `relationships_forParent_ofKind(parent, predicate)` | `(Thing, Predicate): Array<Relationship>` | Handles bidirectional vs unidirectional dispatch |
| `relationships_forKindPredicate_hid_thing_isChild(kind, hid, forParents)` | `(string, Integer, boolean): Array<Relationship>` | Core lookup: filters by kind from byChildHID or byParentHID |
| `relationships_removeHavingNullReferences()` | `async`: void | Warns on null-ref relationships (delete logic is commented out) |
| `relationships_translate_idsFromTo_forParents(idFrom, idTo, forParents)` | `(string, string, boolean): void` | Rewrites idParent or idChild across all relationships for an ID change |

### Section: RELATIONSHIP

| Method | Signature | What it does |
|---|---|---|
| `relationship_forHID(hid)` | `(Integer): Relationship \| null` | O(1) lookup |
| `relationship_whereHID_isChild(hid_thing, isChild)` | `(Integer, boolean): Relationship \| null` | First `contains` relationship where thing is child (or parent) |
| `relationship_remember_ifValid(relationship)` | `(Relationship): void` | Guards on `relationship.isValid` before remembering |
| `relationship_forget_forHID(dict, hid, relationship)` | `(SI_Relationships_ByHID, Integer, Relationship): void` | Removes from a specific HID-keyed dict bucket |
| `relationship_extract_fromDict(dict)` | `(Dictionary): void` | Deserializes; applies `replace_rootID` translation; guards against self-reference |
| `relationship_remember_dict_byKnown(relationship, hid, dict)` | `(Relationship, Integer, SI_Relationships_ByHID): void` | Upserts into a HID-keyed S_Items bucket |
| `relationship_forPredicateKind_parent_child(kind, hidParent, hidChild)` | `(string, Integer, Integer): Relationship \| null` | Finds exact parent+child+kind match |
| `relationship_remember_persistentCreateUnique(...)` | `async`: `Relationship` | Creates unique + writes to DB |
| `relationship_remember_createUnique(...)` | `(...)`: `Relationship` | Creates in memory only; updates order if already exists |
| `relationship_forget(relationship)` | `(Relationship): void` | Removes from all dicts |
| `relationship_remember(relationship)` | `(Relationship): void` | Adds to all dicts; alerts on cross-db violation |
| `relationship_replace_idsFromTo_inDict(idFrom, idTo, dict)` | `(string\|null, string\|null, Dictionary): void` | Mutates a raw dict's `idParent`/`idChild` during deserialization |
| `relationship_xforget_persistentDelete(ancestry)` | `async`: void | Forgets + deletes; collapses or normalizes |
| `relationship_forget_persistentDelete(ancestry, otherAncestry, predicate)` | `async`: void | Deletes relationship between two ancestries; handles bidirectional reversal |
| `relationship_remember_runtimeCreateUnique(...)` | `(...)`: `Relationship` | Creates in memory; also creates reversed relationship if bidirectional |

### Section: ANCESTRIES

| Method | Signature | What it does |
|---|---|---|
| `ancestries` | getter `Array<Ancestry>` | All values in `ancestry_dict_byHID` |
| `si_ancestries_dict_byHID_forKind(kind)` | `(string): Ancestry_ByHID` | Returns the kind-scoped HID dict |
| `ancestries_thatAreVisible` | getter `Array<Ancestry>` | `rootAncestry.visibleSubtree_ancestries()` |
| `ancestries_forget_all()` | `(): void` | Clears all ancestry dicts |
| `ancestries_assureAll_createUnique()` | `(): void` | Traverses entire hierarchy to ensure all ancestries exist |
| `ancestries_fullRebuild()` | `(): void` | Firebase-specific: wipes and re-remembers root ancestry |
| `si_ancesties_forThingHID(hid)` | `(Integer): S_Items<Ancestry>` | Creates ancestries for thing if not already done; returns `si_ancestries_dict_byThingHID[hid]` |
| `ancestries_rebuild_traverse_persistentDelete(ancestries)` | `async`: void | Deletes a set of ancestries and their progeny; updates siblings/focus/collapse state; calls `g.grand_build()` |
| `ancestries_create_forThing_andPredicate(thing, predicate, visited)` | `(Thing, Predicate, string[]): Array<Ancestry>` | Recursively walks parent relationships to construct all ancestries for a thing |

### Section: ALTERATION

| Method | Signature | What it does |
|---|---|---|
| `ancestry_alter_connectionTo_maybe(ancestry)` | `async`: void | Applies pending alteration (add/delete relationship) to `ancestry` |

### Section: ANCESTRY

| Method | Signature | What it does |
|---|---|---|
| `ancestry_forHID(hid)` | `(Integer): Ancestry \| null` | O(1) lookup |
| `ancestries_forThing(thing)` | `(Thing): Array<Ancestry>` | Returns `si_ancestries_dict_byThingHID[thing.hid]?.items` |
| `ancestry_persistentCreateUnique(name, parent, t_thing)` | `async`: `Ancestry \| null` | Creates a new named thing of given type and adds it as a child |
| `ancestry_remember(ancestry)` | `(Ancestry): void` | See remember/forget section |
| `ancestry_forget(ancestry)` | `(Ancestry\|null): void` | See remember/forget section |
| `ancestry_remember_forThing_ofAncestry(ancestry)` | `(Ancestry): void` | Updates `si_ancestries_dict_byThingHID` for the ancestry's thing |
| `ancestry_forget_forThing_ofAncestry(ancestry)` | `(Ancestry): void` | Removes from `si_ancestries_dict_byThingHID` |
| `ancestry_isAssured_valid_forPath(path)` | `(string): Ancestry\|null` | Validates all relationship IDs in path; returns ancestry or null |
| `ancestry_forget_persistentUpdate(ancestry)` | `async`: void | Forgets ancestry then calls `thing_forget_persistentDelete` |
| `ancestry_remember_bulk_persistentRelocateRight(ancestry, parentAncestry)` | `async`: void | Entry point for cross-bulk move |
| `ancestry_remember_createUnique(path, kind)` | `(string, string): Ancestry` | Creates or retrieves ancestry for path+kind pair |
| `ancestry_toggle_expansion(ancestry)` | `async`: void | Toggles expand/collapse; handles radial vs tree mode |
| `ancestry_edit_persistentCreateChildOf(parentAncestry)` | `async`: void | Creates a new generic `'idea'` child |
| `ancestry_edit_persistentAddAsChild(parentAncestry, child, order, shouldStartEdit)` | `async`: void | Adds `child` to `parentAncestry`; grabs it; starts edit if requested |
| `ancestry_externals` | getter `Promise<Ancestry\|null>` | Assures and caches `externalsAncestry` |
| `ancestry_assure_externals` | getter `Promise<Ancestry\|null>` | Finds or creates the `externals` container under root |
| `ancestry_redraw_persistentFetchBulk_browseRight(thing, ancestry, grab)` | `async`: void | Lazy-fetches a bulk database then refreshes display |
| `ancestry_rebuild_persistentMoveRight(ancestry, RIGHT, SHIFT, OPTION, EXTREME, fromReveal)` | `async`: void | Main right/left arrow dispatcher |
| `ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe(up, SHIFT, OPTION, EXTREME)` | `(): void` | Gets grabbed ancestry, calls moveUp |
| `ancestry_rebuild_persistentMoveUp_maybe(ancestry, up, SHIFT, OPTION, EXTREME)` | `(): void` | Delegates to `ancestry.persistentMoveUp_maybe`; sweeps if needed |
| `ancestry_rebuild_persistentRelocateRight(ancestry, RIGHT, EXTREME)` | `(): void` | Option+arrow: moves node to new parent |
| `ancestry_rebuild_runtimeBrowseRight(ancestry, RIGHT, SHIFT, EXTREME, fromReveal)` | `(): void` | In-memory browse navigation |

### Section: PREDICATES / PREDICATE

| Method | Signature | What it does |
|---|---|---|
| `predicates_dict_byDirection(isBidirectional)` | `(boolean): Array<Predicate>` | Returns `predicate_dict_byDirection[0 or 1]` |
| `predicates_forget_all()` | `(): void` | Clears `relationship_dict_byHID` and `predicates` (note: also clears relationship dict — likely a bug or intentional coupling) |
| `predicates_refreshKnowns()` | `(): void` | Clears and re-remembers all predicates |
| `predicate_forKind(kind)` | `(string\|null): Predicate\|null` | `predicate_dict_byKind[kind]` |
| `predicate_kindFor_idRelationship(idRelationship)` | `(string): string\|null` | Looks up relationship by ID, returns its kind |
| `predicate_extract_fromDict(dict)` | `(Dictionary): void` | Deserializes a predicate |
| `predicate_forget(predicate)` | `(Predicate): void` | Removes from all dicts |
| `predicate_defaults_remember_runtimeCreate()` | `(): void` | Seeds 7 built-in predicates: `isTagged`, `contains`, `isRelated`, `requires`, `alliedWith`, `appreciates`, `explainedBy`, `supportedBy` |
| `predicate_remember(predicate)` | `(Predicate): void` | Adds to all dicts |
| `predicate_remember_runtimeCreateUnique(id, kind, isBidirectional, already_persisted)` | returns `Predicate` | Creates only if kind not already known |
| `predicate_remember_runtimeCreate(id, kind, isBidirectional, already_persisted)` | returns `Predicate` | Always creates and remembers |

### Section: TRAITS / TRAIT

| Method | Signature | What it does |
|---|---|---|
| `traits` | getter `Array<Trait>` | `si_traits.items` |
| `traits_forType(t_trait)` | `(T_Trait): S_Items<Trait>\|null` | `si_traits_dict_byType[t_trait]` |
| `si_traits_forOwnerHID(hid)` | `(Integer\|null): S_Items<Trait>\|null` | `si_traits_dict_byOwnerHID[hid]` |
| `traits_refreshKnowns()` | `(): void` | Saves items, clears, re-remembers |
| `traits_forget_all()` | `(): void` | Clears all trait dicts |
| `traits_translate_idsFromTo_forThings(idFrom, idTo)` | `(string, string): void` | Updates `ownerID` on all traits that reference `idFrom` |
| `trait_forHID(hid)` | `(Integer): Trait\|null` | O(1) lookup |
| `trait_runtimeCreate(...)` | returns `Trait` | Constructs `Trait` without remembering |
| `trait_remember_runtimeCreateUnique(...)` | returns `Trait` | Creates only if not already in dict |
| `trait_extract_fromDict(dict)` | `(Dictionary): void` | Deserializes a trait |
| `trait_forType_ownerHID(t_trait, ownerHID)` | `(T_Trait\|null, Integer\|null): Trait\|null` | Returns first trait of type (ignores ownerHID — uses `si_traits_dict_byType[t_trait]?.item`) |
| `trait_forget(trait)` | `(Trait): void` | See remember/forget section |
| `trait_remember(trait)` | `(Trait): void` | See remember/forget section |
| `trait_remember_runtimeCreate(...)` | returns `Trait` | Creates and remembers |
| `trait_setText_forTrait(text, trait)` | `async`: void | Sets trait text and marks dirty; if `text == null`, forces full persist |

### Section: TAGS / TAG

| Method | Signature | What it does |
|---|---|---|
| `si_tags_forThingHID(hid)` | `(Integer): S_Items<Tag>` | `si_tags_dict_byThingHID[hid]` |
| `tags` | getter `Array<Tag>` | `si_tags.items` |
| `tags_refreshKnowns()` | `(): void` | Saves items, clears, re-remembers |
| `tags_forget_all()` | `(): void` | Clears `si_tags_dict_byThingHID`, `si_tags`, `tag_dict_byType`, `tag_dict_byHID` |
| `tags_translate_idsFromTo_forThings(idFrom, idTo)` | `(string, string): void` | Replaces HID references in all `tag.thingHIDs` arrays |
| `tag_forType(type)` | `(string): Tag\|null` | `tag_dict_byType[type]` |
| `tag_forHID(hid)` | `(Integer): Tag\|null` | `tag_dict_byHID[hid]` |
| `tag_extract_fromDict(dict)` | `(Dictionary): void` | Deserializes a tag |
| `tag_forget(tag)` / `tag_remember(tag)` | `(Tag): void` | Delegate to 4 helper methods |
| `tag_remember_runtimeCreateUnique_forType(...)` | returns `Tag` | Finds by type; merges `thingHIDs` if already exists |
| `tag_remember_runtimeCreateUnique(...)` | returns `Tag` | Finds by HID; merges `thingHIDs` if already exists |
| `tag_remember_runtimeCreate(...)` | returns `Tag` | Constructs, remembers, marks dirty if not already persisted |

### Section: ANCILLARY

| Method | Signature | What it does |
|---|---|---|
| `access_runtimeCreate(idAccess, kind)` | `(string, string): void` | Creates `Access` object, stores in both access dicts |
| `user_runtimeCreate(id, name, email, phone)` | `(string, string, string, string): void` | Creates `User` object, stores in `user_dict_byHID` |

### Section: FILES

| Method | Signature | What it does |
|---|---|---|
| `persistRoot_toFile(format)` | `(T_File_Extension): void` | Exports from `rootAncestry` |
| `persist_toFile(format)` | `(T_File_Extension): void` | Exports from grabbed/focused ancestry |
| `data_fromAncestry_toSave(ancestry)` | `(Ancestry): Dictionary` | Returns `all_data` if root, else `progeny_dataFor` |
| `select_file_toUpload(format, SHIFT)` | `(T_File_Extension, boolean): void` | Sets `replace_rootID`, opens import popup |
| `persist_fromAncestry_toFile(ancestry, format)` | `(Ancestry, T_File_Extension): void` | Dispatches to JSON save (CSV alerts not implemented) |
| `all_data` | getter `Dictionary` | Full hierarchy snapshot: `{ title, idRoot, things, traits, predicates, relationships, tags }` |
| `fetch_andBuild_fromFile(file)` | `async`: void | Defers persistence, dispatches to format-specific extractor, re-enables + force-persists |
| `progeny_dataFor(ancestry)` | `(Ancestry): Dictionary` | Traverses subtree, collects unique things/relationships/traits/tags |

### Section: LOST AND FOUND

| Method | Signature | What it does |
|---|---|---|
| `lost_and_found()` | `async`: `Thing\|null` | Returns the lost-and-found thing |
| `ancestry_lost_and_found()` | `async`: `Ancestry\|null` | Finds or creates the `T_Thing.found` child of root |
| `relationships_lostAndFound_persistentCreate(idBase)` | `async`: void | Adopts all orphans into lost-and-found |

### Section: REMEMBER

| Method | Signature | What it does |
|---|---|---|
| `forget_all()` | `(): void` | Clears all entity stores (things, traits, tags, ancestries, relationships) |
| `refreshKnowns()` | `(): void` | Clears ancestries, then refreshes things/traits/tags/predicates/relationships |

### Section: OTHER

| Method | Signature | What it does |
|---|---|---|
| `data_count` | getter `number` | Sum of all entity array lengths |
| `focus` | getter `Thing\|null` | `w_ancestry_focus`'s thing, or `this.root` if no focus |
| `stop_alteration()` | `(): void` | Sets `x.w_s_alteration` to null |
| `depth` | getter `number` | Maximum depth across all known ancestries |

### Section: BUILD

| Method | Signature | What it does |
|---|---|---|
| `isDirty` | getter `boolean` | `total_dirty_count > 0` |
| `total_dirty_count` | getter `number` | Sum of dirty counts across all persistable types; 0 for bubble DB |
| `extractSeriously_fromDict(dict, into)` | `async`: void | Recursive import of legacy Seriously format |
| `extractJSON_fromDict(dict)` | `async`: void | Two-mode JSON import: insert vs full replace |
| `extract_allTypes_ofObjects_fromDict(dict)` | `(Dictionary): void` | Iterates all `T_Persistable` types, dispatches to per-type extractor |
| `extract_objects_ofType_fromDict(t_persistable, dict)` | `(T_Persistable, Dictionary): void` | Switch dispatch to `*_extract_fromDict` |
| `restore_fromPreferences()` | `(): void` | Restores paging, expanded state, recents from preferences |
| `wrapUp_data_forUX()` | `async`: void | Post-load pipeline: assure root+ancestry, create all ancestries, restore preferences, signal ready, persist, set `T_Startup.ready` |

---

## Invariants and gotchas

**Cross-db alert**: `relationship_remember` calls `alert()` (not `console.warn`) if `relationship.idBase != this.db.idBase`. This is a hard runtime error visible to the user.

**Root protection**: `thing_forget` silently ignores the root thing unless `force = true`. This prevents accidental root deletion.

**Self-reference guard**: `relationship_extract_fromDict` skips relationships where `idParent == idChild` with a `console.log('preventing infinite recursion')`.

**`predicates_forget_all` clears relationship dict**: The method clears `this.relationship_dict_byHID = {}` in addition to predicates. This appears to be an intentional coupling (predicates and relationships are tightly linked for lookups) but is surprising given the method name.

**`replace_rootID` semantics**: `null` = normal import (add as child). `k.empty` (empty string) = full replace without keeping the incoming root ID (used with SHIFT on import). Any other string = full replace using that specific root ID.

**Bidirectional relationship creation**: `relationship_remember_runtimeCreateUnique` automatically creates a reversed sibling relationship when `Predicate.isBidirectional_for(kind)` is true. The reversed relationship is an in-memory mirror; both directions are indexed.

**Bulk alias secondary HID registration**: After a bulk fetch, the foreign root's ID is registered as a secondary key in `thing_dict_byHID` pointing at the bulk alias. This means the bulk alias thing has two entries in that dict: its own HID and the foreign root's HID.

**`things_dict_byType` and `things_dict_byTitle` on forget**: Both are deleted entirely (not spliced). A subsequent `things_refreshKnowns()` is needed to rebuild accurate type/title buckets after a delete.

**Trait `trait_forType_ownerHID` ignores `ownerHID`**: The method signature takes `ownerHID` but the implementation ignores it, returning `si_traits_dict_byType[t_trait]?.item` — the first trait of that type regardless of owner.

**`ancestry_assure_externals` has a known problem**: The code contains a comment `// VITAL: the following code has problems` and the externals ancestry is not properly set in the `.then()` callback (it is commented out).

**`relationships_lostAndFound_persistentCreate` is disabled**: Called from `wrapUp_data_forUX` but commented out. The lost-and-found container can still be created manually.

**`relationship_remember_createUnique` does not call `relationship_remember`**: It constructs a `Relationship` but does not add it to any dict. The caller is responsible for remembering it (or it is used as a value object).

**`ancestry_forFile` priority**: grabbed > focused > root. Private getter used by `persist_toFile`.

**`fetch_andBuild_fromFile` defers persistence**: Sets `databases.defer_persistence = true` for the duration of the import, then forces `persist_all(true)` in the `finally` block regardless of errors.

**`wrapUp_data_forUX` sets `T_Startup.ready`**: This is the single signal that the app is ready for user interaction. It also calls `x.setup_subscriptions()` which wires Svelte reactive subscriptions.
