# Persistable Entities — Design Spec

Source: `ws/src/lib/ts/persistable/`

---

## Overview

The entity layer is a hierarchy of classes rooted at `Identifiable`, extended by `Persistable`, then by six concrete entity types: `Thing`, `Relationship`, `Predicate`, `Trait`, `Tag`, `User`, `Access`.

Every object in the graph has an `id` (string, database-origin or generated) and an `hid` (integer hash of that id). Persistence state is delegated to `S_Persistence`. The concrete types map directly to Airtable tables (or equivalent) via the `T_Persistable` enum values.

Only five types participate in normal bulk persistence: `things`, `traits`, `predicates`, `relationships`, `tags`. `User` and `Access` exist in `T_Persistable` but are excluded from `Persistable.t_persistables`.

---

## Class Hierarchy

```
Identifiable
  └── Persistable
        ├── Thing
        ├── Relationship
        ├── Predicate
        ├── Trait
        ├── Tag
        ├── User
        └── Access
```

---

## Identifiable

**File:** `ws/src/lib/ts/runtime/Identifiable.ts`

Base class for all uniquely-identified objects. Not persistable on its own.

### Properties

| Property | Type      | Description |
|----------|-----------|-------------|
| `id`     | `string`  | Canonical string identifier. Database record ID or generated. |
| `hid`    | `Integer` | Integer hash of `id`. Used as fast lookup key in Maps throughout the hierarchy manager. |

### Constructor

```ts
constructor(id: string = Identifiable.newID())
```

Sets both `id` and `hid` on construction. Default generates a new ID if none supplied.

### Static Methods

**`newID(prefix: string = 'NEW'): string`**
Generates a unique ID from UUIDv4. Takes the last 14 characters of the UUID (most-unique bytes), strips all `-` characters, prepends `prefix`. Result is alphanumeric, 17 chars with default prefix.

**`removeAll(item: string, from: string): string`**
Iterative string replacement — removes all occurrences of `item` from `from` until length stops changing.

**`id_inReverseOrder(id: string): string`**
For IDs longer than 3 characters, generates a fresh new ID. For short IDs (3 chars or fewer), reverses the non-first characters (keeps first char, reverses the rest). Used to generate stable reversed-relationship IDs for short IDs.

**`remove_item_byHID<T>(from: Array<T>, item: T): Array<T>`**
Filters an array by removing the element whose `hid` matches the target. Type-cast pattern: treats generics as `Identifiable` internally.

### Instance Methods

**`equals(other: Identifiable | null | undefined): boolean`**
String equality on `id`. Returns `false` for null/undefined.

**`setID(id: string = Identifiable.newID())`**
Updates both `id` and `hid`. Allows post-construction ID assignment.

---

## Persistable

**File:** `ws/src/lib/ts/persistable/Persistable.ts`

Abstract base for all persisted entities. Delegates persistence state to `S_Persistence`. Does not implement `persistent_create_orUpdate` itself — that is overridden by each subclass.

### Properties

| Property         | Type            | Description |
|------------------|-----------------|-------------|
| `t_persistable`  | `T_Persistable` | Which entity type this is (table name enum). |
| `persistence`    | `S_Persistence` | Manages dirty state, already-persisted flag, and the persist closure. |
| `idBase`         | `string`        | Identifies which "bulk" (database segment/base) this entity belongs to. Used for cross-bulk comparisons. |

### Constructor

```ts
constructor(t_database: string, idBase: string, t_persistable: T_Persistable, id: string, already_persisted: boolean = false)
```

- Calls `super(id)` to set `id` and `hid`.
- Creates a new `S_Persistence` instance with `t_database`, `t_persistable`, `id`, `already_persisted`, and `false` (second boolean, likely `isDirty` initial value).

### Instance Methods

**`persistent_create_orUpdate(already_persisted: boolean): Promise<void>`**
Empty async method. Overridden by every concrete subclass to either create or update the record in the database.

**`log(option: T_Debug, message: string)`**
Delegates to `debug.log_maybe`. Some subclasses override this to append `this.description`.

**`isInDifferentBulkThan(other: Persistable): boolean`**
Returns `true` if `this.idBase != other.idBase`. Overridden by `Thing` to add cross-bulk alias logic.

**`set_isDirty(flag: boolean = true)`**
Sets `this.persistence.isDirty` to `flag` and signals a data redraw via `busy.signal_data_redraw()`. Does nothing if `busy.isFetching` is true AND `h.db.isPersistent` is false (i.e., skips dirty marking during fetch on non-persistent databases).

**`persist(): Promise<void>`**
Calls `this.persistence.persist_withClosure(...)`, passing a closure that calls `persistent_create_orUpdate(already_persisted)`. The `already_persisted` flag comes from `S_Persistence`.

### Static Methods

**`get t_persistables(): Array<T_Persistable>`**
Returns the five types that participate in bulk operations:
```
[things, traits, predicates, relationships, tags]
```
Note: `users` and `access` are excluded.

**`dirty_count(persistables: Array<Persistable>): number`**
Counts how many in the array have `persistence.isDirty === true`.

---

## Thing

**File:** `ws/src/lib/ts/persistable/Thing.ts`

The primary node in the graph. Represents any named entity the user creates. Extends `Persistable`.

### Properties

| Property          | Type              | Persisted | Description |
|-------------------|-------------------|-----------|-------------|
| `title`           | `string`          | Yes       | Display name. |
| `color`           | `string`          | Yes       | Hex or CSS color string. |
| `t_thing`         | `T_Thing`         | Yes (as `type`) | Semantic type of this thing. |
| `bulkRootID`      | `string`          | No        | Set when this is a bulk alias; holds the root ID of the foreign database. Defaults to `k.empty`. |
| `selectionRange`  | `Seriously_Range` | No        | Text selection range for the title editor. Initialized to `(0, title.length)`. |

### Constructor

```ts
constructor(idBase: string, id: string, title = k.title.default, color = colors.default_forThings, t_thing = T_Thing.generic, already_persisted: boolean = false)
```

Passes `T_Persistable.things` to Persistable. `selectionRange` is reset to `(0, title.length)` on construction.

### Persisted Fields (`fields` getter)

```ts
get fields(): Dictionary<string>
// { title: this.title, color: this.color, type: this.t_thing }
```

### Computed / Runtime Getters

| Getter | Return Type | Description |
|--------|-------------|-------------|
| `si_tags` | `S_Items<Tag>` | Live tag set for this thing, by HID. |
| `si_traits` | `null \| S_Items<Trait>` | Live trait set for this thing, by HID. |
| `si_ancestries` | `null \| S_Items<Ancestry>` | Live ancestry set for this thing. |
| `parents` | `Array<Thing>` | Things that contain this via `T_Predicate.contains`. |
| `parentIDs` | `Array<string>` | IDs of `parents`. |
| `ancestries` | `Array<Ancestry>` | Unwraps `si_ancestries?.items` or returns `[]`. |
| `childRelationships` | `Array<Relationship>` | Relationships where this is the parent, predicate `contains`. |
| `relatedRelationships` | `Array<Relationship>` | Relationships where this is parent, predicate `isRelated`. |
| `fields` | `Dictionary<string>` | `{ title, color, type }` — the persisted field set. |
| `abbreviated_title` | `string` | First letter of each word, lowercased, joined. |
| `idBridging` | `string` | If `isBulkAlias`, returns `bulkRootID`; otherwise `id`. Used for cross-database relationship resolution. |
| `description` | `string` | `id + ' "' + title + '"'` |
| `breadcrumb_title` | `string` | Title clipped at 15 chars with ellipsis. |
| `width_ofTitle` | `number` | Pixel width of the title string. |
| `isRoot` | `boolean` | `t_thing == T_Thing.root` |
| `isFolder` | `boolean` | `t_thing == T_Thing.folder` |
| `isBookmark` | `boolean` | `t_thing == T_Thing.bookmark` |
| `isBulkAlias` | `boolean` | `t_thing == T_Thing.bulk` |
| `isExternals` | `boolean` | `t_thing == T_Thing.externals` |
| `hasRelated` | `boolean` | `relatedRelationships.length > 0` |
| `isAcrossBulk` | `boolean` | `idBase != h.db.idBase` — this thing lives in a foreign base. |
| `hasParents` | `boolean` | Has at least one parent via `contains`. |
| `isFocus` | `boolean` | The current focus ancestry's thing matches this `id`. |
| `parents_ofAllKinds` | `Array<Thing>` | Union of parents across all known predicate kinds, deduplicated. |
| `thing_isBulk_expanded` | `boolean` | For bulk aliases only: checks expanded ancestry store to see if this thing is expanded. |
| `ancestry` | `Ancestry` | First ancestry, or `h.rootAncestry` as fallback. |
| `ancestry_maybe` | `Ancestry \| null` | First ancestry or null; uses `h.ancestries_forThing`. |

### Instance Methods

**`debugLog(message: string)`**
Logs with `T_Debug.things` flag.

**`trait_forType(type: T_Trait): Trait`**
Returns `this.si_traits?.item as Trait`. Note: does not use the `type` parameter to filter — appears to return the first trait regardless. Possibly a bug or stub.

**`hasParents_ofKind(kind: string): boolean`**
`parents_ofKind(kind).length > 0`.

**`hasMultipleParents_ofKind(kind: string): boolean`**
`parents_ofKind(kind).length > 1`.

**`log(option: T_Debug, message: string)`**
Overrides Persistable. Appends `this.description` to the message.

**`isInDifferentBulkThan(other: Thing): boolean`**
Overrides Persistable. Returns true if `idBase` differs OR if `other.isBulkAlias && !this.isBulkAlias && this.idBase != other.title`. The second condition handles the case where a bulk alias stores the foreign base ID as its title.

**`signal_color_change()`**
Increments `e.w_count_rebuild`, then sets `colors.w_thing_color` to `"${id}${separator}${count}"`. Triggers Svelte reactive updates for color-sensitive UI.

**`persistent_create_orUpdate(already_persisted: boolean): Promise<void>`**
If `already_persisted`: calls `databases.db_now.thing_persistentUpdate(this)`.
Else: calls `databases.db_now.thing_remember_persistentCreate(this)`.

**`crumbWidth(numberOfParents: number): number`**
Returns pixel width for breadcrumb display. Base is `width_ofTitle + 10`. Adds 11 for one parent, 18 for multiple parents (to accommodate parent indicator glyphs).

**`remove_fromGrabbed_andExpanded_andResolveFocus()`**
Called on deletion. Iterates all ancestries, removes from grabbed/expanded state for ancestries that reference this thing. If this thing is the current focus, promotes `h.rootAncestry` to focus.

**`parents_ofKind(kind: string): Array<Thing>`**
Queries `h.relationships_ofKind_forParents_ofThing(kind, true, this)`, extracts `relationship.parent` for each. Returns empty array if `isRoot`.

**`ancestries_createUnique_forPredicate(predicate: Predicate | null): Array<Ancestry>`**
Creates ancestry path objects for a given predicate. If `predicate.isBidirectional`, creates ancestries centered on this thing. Otherwise walks `parents_ofKind(predicate.kind)` and creates parent-rooted ancestries. Strips falsy values and deduplicates by thing.

---

## Relationship

**File:** `ws/src/lib/ts/persistable/Relationship.ts`

A directed edge between two `Thing`s, typed by a `T_Predicate`. Extends `Persistable`.

### Properties

| Property     | Type        | Persisted | Description |
|--------------|-------------|-----------|-------------|
| `kind`       | `T_Predicate` | Yes     | The predicate type string (e.g. `'contains'`). |
| `idParent`   | `string`    | Yes       | String ID of the parent thing. |
| `idChild`    | `string`    | Yes       | String ID of the child thing. |
| `orders`     | `Array<number>` | Yes   | Two-element array: `[T_Order.child, T_Order.other]`. Float ordering values. |
| `hidParent`  | `Integer`   | No        | Hash of `idParent`. Runtime lookup key. |
| `hidChild`   | `Integer`   | No        | Hash of `idChild`. Runtime lookup key. |
| `isReversed` | `boolean`   | No        | True if this relationship was synthesized as the reverse of a bidirectional predicate. Defaults `false`. |

### Constructor

```ts
constructor(idBase: string, id: string, kind: T_Predicate, idParent: string, idChild: string, orders: Array<number>, already_persisted: boolean = false)
```

Passes `T_Persistable.relationships`. Computes `hidParent` and `hidChild` via `.hash()`.

### Persisted Fields (`fields` getter)

```ts
get fields(): Airtable.FieldSet
// { kind: this.kind, parent: [this.idParent], child: [this.idChild], orders: this.orders.map(String) }
```

Orders are stored as strings in Airtable.

### Computed Getters

| Getter | Return Type | Description |
|--------|-------------|-------------|
| `child` | `Thing \| null` | Looks up thing by `hidChild` in hierarchy. |
| `parent` | `Thing \| null` | Looks up thing by `hidParent` in hierarchy. |
| `predicate` | `Predicate \| null` | Looks up predicate by `kind`. |
| `isValid` | `boolean` | `kind`, `parent`, and `child` all truthy. |
| `reversed` | `Relationship \| null` | Finds the matching reversed relationship in hierarchy (swapped parent/child). |
| `verbose` | `string` | Full debug string: base, persistence state, orders, id, description. |
| `description` | `string` | `"<parent.description> <predicate.kind> <child.description>"`. Falls back to IDs if things not found. |

### Instance Methods

**`reversed_remember_createUnique: Relationship`** (getter)
If no reversed relationship exists, creates one: new `Relationship` with swapped parent/child, reversed orders array, ID generated by `Identifiable.id_inReverseOrder(this.id)`, `isReversed = true`. Registers it in hierarchy.

**`order_forPointsTo(isCluster_ofChildren: boolean): number`**
Returns `orders[T_Order.child]` if `isCluster_ofChildren`, else `orders[T_Order.other]`.

**`remove_from(relationships: Array<Relationship>)`**
Filters by `kind != this.kind`. Note: the result is not assigned — this appears to be a bug (`.filter` return is discarded).

**`orders_setTo(newOrders: Array<number>)`**
Sets both order slots without persisting or signaling yet.

**`thing(child: boolean): Thing | null`**
Returns child or parent thing by hashing the relevant ID.

**`persistent_create_orUpdate(already_persisted: boolean): Promise<void>`**
Routes to `relationship_persistentUpdate` or `relationship_remember_persistentCreate`.

**`order_setTo_forPointsTo(order: number, toChildren: boolean = true)`**
Converts `toChildren` to a `T_Order` slot and delegates to `order_setTo`.

**`order_setTo(newOrder: number, t_order: T_Order = T_Order.child)`**
Only updates if the difference from current is `> 0.001`. On change: updates the array, sets `x.w_order_changed_at` to `Date.now()`, calls `set_isDirty()`.

**`assign_idParent(idParent: string)`**
Unregisters self from hierarchy, updates `idParent` and `hidParent`, marks dirty, re-registers in hierarchy. Allows reparenting of a relationship.

---

## Predicate

**File:** `ws/src/lib/ts/persistable/Predicate.ts`

Defines the type/nature of a `Relationship`. Extends `Persistable`. Instances are global singletons loaded once from the database.

### Properties

| Property          | Type          | Persisted | Description |
|-------------------|---------------|-----------|-------------|
| `kind`            | `T_Predicate` | Yes       | The string key identifying this predicate (e.g. `'contains'`). |
| `isBidirectional` | `boolean`     | Yes       | Whether relationships of this predicate are symmetric/bidirectional. |

### Constructor

```ts
constructor(id: string, kind: T_Predicate, isBidirectional: boolean, already_persisted: boolean = false)
```

Passes `k.empty` for `idBase` (predicates are not bulk-scoped) and `T_Persistable.predicates`.

### Computed Getters

**`description: string`**
`this.kind.unCamelCase().lastWord()` — un-camel-cases the kind string, takes last word. E.g. `'isRelated'` → `'related'`.

### Static Convenience Getters

Each looks up the predicate from the hierarchy by kind:

| Getter | Kind |
|--------|------|
| `contains` | `T_Predicate.contains` |
| `isTagged` | `T_Predicate.isTagged` |
| `requires` | `T_Predicate.requires` |
| `isRelated` | `T_Predicate.isRelated` |
| `alliedWith` | `T_Predicate.alliedWith` |
| `appreciates` | `T_Predicate.appreciates` |
| `explainedBy` | `T_Predicate.explainedBy` |
| `supportedBy` | `T_Predicate.supportedBy` |

All return `Predicate | null`. Implemented via `predicate_forKind(kind: string): Predicate | null` which delegates to `h.predicate_forKind`.

### Static Methods

**`isBidirectional_for(kind: T_Predicate): boolean`**
Returns `kind != T_Predicate.contains`. So only `contains` is unidirectional; everything else is bidirectional by default.

### Instance Methods

**`log(option: T_Debug, message: string)`**
Overrides Persistable. Appends `this.description`.

**`kinship_forChildren_cluster(isCluster_ofChildren: boolean): T_Kinship | null`**
Maps predicate+direction to a `T_Kinship`:
- `contains` + children → `T_Kinship.children`
- `contains` + not children → `T_Kinship.parents`
- `isRelated` → `T_Kinship.related`
- anything else → `null`

**`angle_ofCluster_when(isCluster_ofChildren: boolean): number`**
Computes the radial angle for a cluster of this predicate type. Uses global rotate angle (`radial.w_rotate_angle`). For bidirectional predicates, offsets by `2π/3` (equilateral distribution). For unidirectional: children at the global angle, parents at global minus `2π/3`. Returns normalized angle.

**`persistent_create_orUpdate(already_persisted: boolean): Promise<void>`**
Routes to `predicate_persistentUpdate` or `predicate_remember_persistentCreate`.

---

## Trait

**File:** `ws/src/lib/ts/persistable/Trait.ts`

A typed key-value annotation attached to a `Thing`. Extends `Persistable`.

### Properties

| Property   | Type      | Persisted | Description |
|------------|-----------|-----------|-------------|
| `ownerID`  | `string`  | Yes       | String ID of the owning `Thing`. |
| `t_trait`  | `T_Trait` | Yes (as `type`) | The semantic type of this trait. |
| `text`     | `string`  | Yes       | The trait's value content. |
| `dict`     | `Dictionary` | No     | General-purpose dictionary. Used for pivot data import. Not persisted directly. |

### Constructor

```ts
constructor(idBase: string, id: string, ownerID: string, t_trait: T_Trait, text: string = k.empty, already_persisted: boolean = false)
```

Passes `T_Persistable.traits`.

### Persisted Fields (`fields` getter)

```ts
get fields(): Airtable.FieldSet
// { type: this.t_trait, ownerID: [this.ownerID], text: this.text }
```

`ownerID` is stored as a linked record array in Airtable.

### Computed Getters

**`owner: Thing | null`**
Looks up the owning thing by `ownerID.hash()` in the hierarchy.

### Instance Methods

**`persistent_create_orUpdate(already_persisted: boolean): Promise<void>`**
Routes to `trait_persistentUpdate` or `trait_remember_persistentCreate`.

### Static Methods

**`type_fromSeriously(type: string): T_Trait`**
Converts single-char codes from the legacy "Seriously" import format to `T_Trait` enum values:

| Code | T_Trait |
|------|---------|
| `'n'` | `note` |
| `'d'` | `date` |
| `'h'` | `link` |
| `'c'` | `citation` |
| `'$'` | `money` |
| `'#'` | `phone` |
| (default) | `text` |

---

## Tag

**File:** `ws/src/lib/ts/persistable/Tag.ts`

A label that can be associated with multiple `Thing`s simultaneously. Extends `Persistable`.

### Properties

| Property    | Type             | Persisted | Description |
|-------------|------------------|-----------|-------------|
| `type`      | `string`         | Yes       | The tag's label or category string. |
| `thingHIDs` | `Array<Integer>` | No (runtime) | Array of integer HIDs of tagged things. Used for fast lookup. |

### Constructor

```ts
constructor(idBase: string, id: string, type: string, thingHIDs: Array<Integer>, already_persisted: boolean = false)
```

Passes `T_Persistable.tags`.

Note: `thingHIDs` is runtime-only as HIDs are derived values. The actual persistence mechanism for tag-to-thing associations is not shown in this file (likely stored differently in Airtable).

### Computed Getters

**`things: Array<Thing>`**
Maps `thingHIDs` through `h.thing_forHID`, filters out nulls. Returns all live `Thing` objects tagged by this tag.

### Instance Methods

**`ownerAt(index: number): Thing | null`**
Returns the thing at position `index` in `this.things`, or null if out of bounds.

**`persistent_create_orUpdate(already_persisted: boolean): Promise<void>`**
Routes to `tag_persistentUpdate` or `tag_remember_persistentCreate`.

---

## User

**File:** `ws/src/lib/ts/persistable/User.ts`

Represents an authenticated user. Extends `Persistable`. Minimal entity — no computed properties or methods beyond the constructor.

### Properties

| Property | Type   | Persisted | Description |
|----------|--------|-----------|-------------|
| `name`   | `string` | Yes     | Display name. |
| `email`  | `string` | Yes     | Email address. |
| `phone`  | `string` | Yes     | Phone number. |

### Constructor

```ts
constructor(t_database: string, t_persistable: T_Persistable, id: string, name: string, email: string, phone: string, already_persisted: boolean = false)
```

Unlike other entities, the caller provides both `t_database` and `t_persistable` directly. `idBase` is hardcoded to `''` (empty). This gives `User` more flexibility for multi-database scenarios.

No `persistent_create_orUpdate` override. Persistence behavior falls through to the empty Persistable base implementation.

`User` is listed in `T_Persistable` but excluded from `Persistable.t_persistables`, so it does not participate in standard bulk dirty/persist operations.

---

## Access

**File:** `ws/src/lib/ts/persistable/Access.ts`

Represents an access control record. Extends `Persistable`. Minimal entity.

### Properties

| Property | Type   | Persisted | Description |
|----------|--------|-----------|-------------|
| `kind`   | `string` | Yes     | Access level or permission kind. Not typed beyond `string`. |

### Constructor

```ts
constructor(t_database: string, t_persistable: T_Persistable, id: string, kind: string, already_persisted: boolean = false)
```

Same pattern as `User`: caller supplies `t_database` and `t_persistable`. `idBase` hardcoded to `''`.

No `persistent_create_orUpdate` override. Excluded from `Persistable.t_persistables`.

---

## Enumerations

### T_Persistable

Maps entity types to their Airtable table names (PascalCase strings):

| Value | String |
|-------|--------|
| `things` | `'Things'` |
| `traits` | `'Traits'` |
| `predicates` | `'Predicates'` |
| `relationships` | `'Relationships'` |
| `tags` | `'Tags'` |
| `users` | `'Users'` |
| `access` | `'Access'` |

### T_Predicate

Relationship kinds. All are camelCase strings used as both enum values and stored database values:

| Value | String | Bidirectional? |
|-------|--------|---------------|
| `contains` | `'contains'` | No (only unidirectional predicate) |
| `isRelated` | `'isRelated'` | Yes |
| `isTagged` | `'isTagged'` | Yes |
| `requires` | `'requires'` | Yes |
| `appreciates` | `'appreciates'` | Yes |
| `explainedBy` | `'explainedBy'` | Yes |
| `supportedBy` | `'supportedBy'` | Yes |
| `alliedWith` | `'alliedWith'` | Yes (described as "steve melville's term") |

Bidirectionality rule: `Predicate.isBidirectional_for(kind)` returns `true` for everything except `contains`.

### T_Trait

Semantic types for `Trait` values:

| Value | String |
|-------|--------|
| `text` | `'text'` |
| `note` | `'note'` |
| `date` | `'date'` |
| `link` | `'link'` |
| `citation` | `'citation'` |
| `money` | `'money'` |
| `phone` | `'phone'` |
| `comment` | `'comment'` |
| `quest` | `'quest'` |
| `sum` | `'sum'` |
| `location` | `'location'` |
| `consequence` | `'consequence'` |

### T_Thing

Semantic types for `Thing`, stored as single-character strings:

| Value | Char | Meaning |
|-------|------|---------|
| `generic` | `'-'` | Default, untyped thing |
| `root` | `'!'` | The root node of a database |
| `folder` | `'f'` | Folder-like container |
| `bookmark` | `'b'` | Bookmark/link |
| `bulk` | `'~'` | Alias to a foreign database |
| `externals` | `'^'` | List of bulk aliases |
| `person` | `'p'` | Person entity |
| `organization` | `'o'` | Organization entity |
| `meme` | `'*'` | Meme entity |
| `found` | `'?'` | Search result placeholder |

### T_Order

Two-slot indexing for `Relationship.orders`:

| Value | Index | Meaning |
|-------|-------|---------|
| `child` | `0` | Order in the child/children cluster |
| `other` | `1` | Order in the other (parent/related) cluster |

Comment: "need two orders, so .... ???" — the design intent for dual ordering is not fully documented in source.

---

## ID and HID System

### id

String. Either assigned by the database (Airtable record ID format) or generated by `Identifiable.newID()`. Format of generated IDs: prefix (default `'NEW'`) + 14 alphanumeric chars from the tail of a UUIDv4 with dashes stripped.

### hid

Integer (type alias `Integer`). `id.hash()` — calls a custom string hash extension from `Extensions.ts` (not in scope here). Used as Map keys throughout the hierarchy manager for O(1) lookup. Every `Identifiable` computes this on construction and on `setID`.

### idBase

Set on `Persistable`. Identifies which Airtable base (database segment) an entity belongs to. Enables multi-database ("bulk") scenarios. Empty string for `Predicate`, `User`, and `Access` — these are not bulk-scoped. `Thing`, `Relationship`, `Trait`, `Tag` all carry a meaningful `idBase`.

`isInDifferentBulkThan` on `Persistable` compares `idBase` directly. `Thing` overrides this with additional logic for bulk alias things (where the alias's `title` stores the foreign base ID).

### Reversed relationship IDs

`Identifiable.id_inReverseOrder(id)`: for short IDs (≤3 chars), reverses non-first chars. For longer IDs, generates a fresh ID. Used only for synthesized reverse relationships (`reversed_remember_createUnique`).

---

## Persistence Mechanics

### S_Persistence (referenced, not in scope)

Each `Persistable` holds a `persistence: S_Persistence`. Known interface from usage:
- `isDirty: boolean` — tracks whether the entity needs a write.
- `already_persisted: boolean` — distinguishes create vs update.
- `persist_withClosure(fn)` — executes the persist operation, passing `already_persisted` to the closure.

### `persist()` flow

```
entity.persist()
  → persistence.persist_withClosure(async (already_persisted) => {
      → entity.persistent_create_orUpdate(already_persisted)
          → database.thing_persistentUpdate(entity)    // if already persisted
          → database.thing_remember_persistentCreate(entity)  // if new
    })
```

### Dirty signaling

`set_isDirty()` on `Persistable` also calls `busy.signal_data_redraw()`. This couples persistence state to UI reactivity — dirtying an entity triggers a redraw signal. Guard condition: skips the mark if `busy.isFetching && !h.db.isPersistent`.

### What gets persisted

Each entity exposes a `fields` getter returning the storable field set:

| Entity | Persisted fields |
|--------|-----------------|
| `Thing` | `title`, `color`, `type` (t_thing) |
| `Relationship` | `kind`, `parent` (idParent as array), `child` (idChild as array), `orders` (stringified) |
| `Trait` | `type` (t_trait), `ownerID` (as array), `text` |
| `Tag` | `type` (tag label) — thingHIDs presumably via separate mechanism |
| `Predicate` | `kind`, `isBidirectional` — no explicit `fields` getter, handled differently |
| `User` | `name`, `email`, `phone` — no explicit `fields` getter |
| `Access` | `kind` — no explicit `fields` getter |

Runtime-only (not in `fields`):
- `hid`, `hidParent`, `hidChild` — derived from `id.hash()`
- `isReversed` on Relationship
- `bulkRootID`, `selectionRange` on Thing
- `dict` on Trait
- `thingHIDs` on Tag (HIDs are derived)

---

## Notable Patterns and Quirks

**`thing` vs `hid` lookup duality**: `Relationship` stores both `idParent`/`idChild` (persisted strings) and `hidParent`/`hidChild` (runtime integer hashes). All hierarchy lookups use HIDs. The string IDs are only used for persistence writes and for `assign_idParent`.

**`isBidirectional` determination**: Statically computed as `kind != contains`. The `isBidirectional` field is persisted, but it's fully derivable from `kind`. Storing it redundantly may be for forward-compatibility or explicit documentation in the database.

**Predicate has no `idBase`**: Predicates are passed `k.empty` for `idBase`. They are shared across all bulks.

**`User` and `Access` receive `t_persistable` as constructor arg**: Unlike the other entities (which hardcode their `T_Persistable` value in the constructor), `User` and `Access` accept it from the caller. This suggests they may be used across different table configurations.

**`remove_from` bug**: `Relationship.remove_from` calls `.filter()` but discards the result. The array passed in is not mutated.

**`trait_forType` ignores its argument**: `Thing.trait_forType(type: T_Trait)` returns `this.si_traits?.item` without filtering by `type`. The `type` parameter is unused. Likely a stub.

**`id_inReverseOrder` branching**: For IDs longer than 3 chars, generates a completely new ID rather than reversing. This means reversed-relationship IDs are not algorithmically invertible for real-world (Airtable) IDs — only short/test IDs get the reversal treatment.

**`orders` as two-element array**: `Relationship.orders` is `[childOrder, otherOrder]`. Indexed via `T_Order` enum. The design comment ("need two orders, so .... ???") suggests the dual-order system is somewhat provisional or under-designed.

**Signal pattern on color change**: `Thing.signal_color_change()` uses a compound store value (`"${id}${separator}${count}"`) to force Svelte reactivity even when the color value itself is the same — the count makes each signal unique.
