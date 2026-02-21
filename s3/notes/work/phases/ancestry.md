# Ancestry — Design Spec

Source: `ws/src/lib/ts/runtime/Ancestry.ts` (~966 lines)

---

## Conceptual model

An `Ancestry` is a **path from the graph root to a specific node**, encoded as an ordered sequence of relationship IDs. It is not a node itself — it is a route to one. The same `Thing` (node) can be reached by many distinct paths, each of which is a separate `Ancestry` with its own state (expanded/collapsed, visibility, geometry).

The path is stored as a single string (`id` / `pathString`), where relationship IDs are joined by `k.separator.generic` (`"::"`) and looked up at runtime. The root has the special path `k.root` (`"root"`), with zero relationship IDs.

Key conceptual rules:
- The root ancestry has `isRoot === true` and `relationship_ids.length === 0`.
- Every non-root ancestry's last relationship ID identifies the relationship whose `child` is the `thing` at this node.
- The `kind` on an ancestry is taken from the last relationship and governs what predicate all children belong to.
- Ancestries for `T_Predicate.isRelated` (bidirectional) predicates are single-segment paths (just the relationship ID), not stacked like `contains` paths.

---

## Class hierarchy

```
Identifiable
  └── Ancestry
```

`Identifiable` provides:
- `id: string` — the path string itself (also the unique identifier)
- `hid: Integer` — hash of `id`, used for dictionary lookup
- `equals(other)` — compares `id` strings

`Ancestry` overrides `equals` to also require `t_database` match:
```ts
equals(ancestry: Ancestry | null | undefined): boolean {
  return super.equals(ancestry) && this.t_database == ancestry?.t_database;
}
```

---

## Constructor and identity

```ts
constructor(t_database: string, path: string = k.root, kind: string = T_Predicate.contains)
```

- `t_database: string` — which database instance this ancestry belongs to (matched against `get(databases.w_t_database)` in expand/collapse to guard against cross-db mutations)
- `path: string` — the full path string, passed to `super(path)`, becomes both `id` and `pathString`
- `kind: string` — predicate kind of the last relationship; defaults to `T_Predicate.contains`

### Identity fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | The path string (inherited from `Identifiable`) |
| `pathString` | `string` | Alias for `id` (getter) |
| `hid` | `Integer` | Hash of `id` (inherited from `Identifiable`) |
| `t_database` | `string` | Database type string |
| `kind` | `string` | Predicate kind of the terminal relationship |
| `g_widgets` | `Dictionary<G_Widget>` | Per-graph-mode geometry cache, keyed by `T_Graph` |

---

## Relationship IDs

```ts
get relationship_ids(): Array<string>
```
Splits `pathString` on `"::"`. Returns `[]` for root. Each element is a relationship's `id` string.

```ts
get relationship_hids(): Array<Integer>
```
Maps each relationship ID to its hash.

```ts
get depth(): number
```
`relationship_ids.length`. Root = 0. Every hop into the tree increments depth by 1.

```ts
idAt(back: number = 1): string
```
Returns the relationship ID at position `back` from the end (1 = last). Falls back to `k.root` if `back > ids.length`.

```ts
relationshipAt(back: number = 1): Relationship | null
```
Looks up `idAt(back).hash()` in `h.relationship_forHID`. Default back=1 returns the terminal relationship.

```ts
get relationship(): Relationship | null
```
The terminal relationship (`relationshipAt()`).

```ts
get relationships(): Array<Relationship>
```
All relationships in the path, in order, with invalid entries stripped.

---

## Thing lookup

```ts
get thing(): Thing | null
```
Delegates to `h.thing_forAncestry(this)`. The Hierarchy looks up `id_thing` in the thing store.

```ts
get id_thing(): string
```
- If `isRoot`: returns `h.idRoot`
- Otherwise: `this.relationship?.idChild ?? k.unknown`

The terminal relationship's `idChild` is the thing at this position in the path. This means `ancestry.thing` is always the leaf node, not the root.

```ts
thingAt(back: number): Thing | null
```
Returns the thing at any depth in the path. `back=1` returns the leaf thing (via `relationshipAt(1).child`). Falls back to `h.root` for the root case.

---

## Predicate

```ts
get predicate(): Predicate | null
```
Looks up `h.predicate_forKind(this.kind)`. The predicate governs what kind of relationships form the edges in this ancestry's tree.

```ts
get isBidirectional(): boolean
```
`this.predicate?.isBidirectional ?? false`

---

## Depth

```ts
get depth(): number
```
`relationship_ids.length`. Root is 0.

```ts
get depth_within_focus_subtree(): number
```
`this.depth - focus.depth`. When there is no focus: 0. Negative means this ancestry is an ancestor of the focus (a "progeny" in reverse — i.e., it appears "above" the focus in the tree).

```ts
get focus_isProgeny(): boolean
```
`this.depth_within_focus_subtree < 0` — true when this ancestry is an ancestor of the current focus, meaning the focus is a descendant of this node.

---

## Depth limit system

### Global limit

```ts
get global_depth_limit(): number
```
`get(g.w_depth_limit) ?? 0`. A Svelte writable store on `Geometry`, persisted as a preference. Default at boot is 3, restored from preferences (default 12).

### Visibility by depth

```ts
get isVisible_accordingTo_depth_within_focus_subtree(): boolean
```
`depth_within_focus_subtree < global_depth_limit`. An ancestry is within the depth limit if it is fewer than `global_depth_limit` hops below the current focus. The focus itself has `depth_within_focus_subtree === 0`, which is always `< limit` when limit > 0.

### Truncation indicators

```ts
get hidden_by_depth_limit(): boolean
```
```ts
!this.isVisible_accordingTo_depth_within_focus_subtree && this.isExpanded && this.hasChildren && show.inTreeMode
```
True when: the ancestry is past the depth limit AND is expanded AND has children AND we are in tree mode. This state triggers display of a "truncation indicator" (typically the tiny outer dots SVG).

```ts
get children_hidden_by_depth_limit(): boolean
```
```ts
this.depth_within_focus_subtree >= (this.global_depth_limit - 5) &&
  this.isExpanded && this.hasChildren && show.inTreeMode
```
A lookahead: becomes true 5 levels before the hard limit. Used to show a warning or adjust rendering before truncation hits.

### Interaction between the four

| Condition | `hidden_by_depth_limit` | `children_hidden_by_depth_limit` |
|---|---|---|
| At or beyond limit | yes | yes |
| Within 5 of limit | no | yes |
| Well inside limit | no | no |

Both require `isExpanded && hasChildren && show.inTreeMode`. Tree mode only — radial mode does not use this system.

---

## Visibility

### Tree mode

```ts
get isVisible(): boolean  // tree branch
```
```
incorporates(focus) && isAllExpanded_fromRootTo(focus) && isVisible_accordingTo_depth_within_focus_subtree
```
All three must hold:
1. **incorporates**: this ancestry starts with the same relationship IDs as the focus (i.e., the focus is a prefix or equal).
2. **isAllExpanded_fromRootTo**: every ancestor between this node and the focus is expanded.
3. **depth limit**: within `global_depth_limit` of the focus.

### Radial mode

```ts
get isVisible(): boolean  // radial branch
```
Three cases:
- `this.isFocus` — always visible
- `childIsFocus` — `focus.parentAncestry == this` — also always visible
- `parentIsFocus` — parent is focus AND paging index is visible (`g_paging.index_isVisible(siblingIndex)`)

---

## Expansion

Expansion state is stored in `x.si_expanded`, a `S_Items<Ancestry>` writable store. The root is always considered expanded.

```ts
get isExpanded(): boolean
```
`this.isRoot || this.includedInStore_ofAncestries(x.si_expanded.w_items)`

Membership is tested by `pathString` matching, not reference equality.

```ts
expand(): boolean
collapse(): boolean
toggleExpanded(): boolean
```
All delegate to `expanded_setTo(bool)`.

```ts
expanded_setTo(expand: boolean): boolean
```
Guards: `matchesDB && (!isRoot || expand) && isExpanded != expand`. Updates `x.si_expanded.w_items` by pushing or splicing by `pathString`. Returns `true` if actually mutated.

```ts
get isAllProgeny_expanded(): boolean
```
Traverses all progeny; returns false if any are not expanded.

```ts
isAllExpanded_fromRootTo(targetAncestry: Ancestry | null): boolean
```
Walks up the parent chain until hitting `targetAncestry` or the root. Returns false if any ancestor is not expanded.

```ts
get shows_children(): boolean
```
`isExpanded && hasChildren && isVisible_accordingTo_depth_within_focus_subtree`

```ts
get shows_branches(): boolean
```
`get(g.w_branches_areChildren) ? shows_children : !isRoot`

In "branches = children" mode, branches are the children. In "branches = parents" mode, branches are all non-root ancestries.

---

## Reveal dot and SVG path

### Direction

```ts
get points_right(): boolean
```
- Tree mode: `!hasVisibleChildren` (points right when collapsed, left when expanded)
- Radial mode: `this.g_widget?.reveal_isAt_right ?? true`

### Show logic

```ts
showsReveal_forPointingToChild(pointsTo_child: boolean): boolean
```
- `isBidirectional` predicates never show reveal dots
- Tree mode: shows when `hasChildren && !isBulkAlias` (for `pointsTo_child=true`)
- Radial mode: shows when `!isFocus && (hasParents || hasChildren || isBulkAlias)` and `!isBidirectional`

```ts
get shows_reveal(): boolean
```
`showsReveal_forPointingToChild(!(this.relationship?.isReversed ?? false))`

The direction arg depends on whether the terminal relationship is reversed.

### SVG path

```ts
get svgPathFor_revealDot(): string
```
- `shows_reveal` is true: `svgPaths.fat_polygon(k.height.dot, this.direction_ofReveal)` — a directional chevron/arrow
- `shows_reveal` is false: `svgPaths.circle_atOffset(k.height.dot, k.height.dot - 1)` — a plain circle

`k.height.dot = 14`.

```ts
get direction_ofReveal(): number
```
`this.points_right ? Direction.right : Direction.left`

### Tiny outer dots

```ts
svgPathFor_tiny_outer_dot_pointTo_child(pointsTo_child: boolean): string | null
```
In tree mode: shown when `hidden_by_depth_limit` (truncation indicator) or `isVisible_forChild` (children exist, not expanded).
In radial mode: children dots shown when not expanded; parent/related dots shown based on `show.parent_dots` / `show.related_dots` / `show.related_dots`.
Returns `null` when dots should not be shown; otherwise calls `svgPaths.tiny_outer_dots_circular(k.tiny_outer_dots.diameter, count, points_right)`.

`k.tiny_outer_dots.diameter = 20` (dot_size 14 + expansion 6).

---

## Focus

```ts
get isFocus(): boolean
```
`get(x.w_ancestry_focus)?.equals(this) ?? false`

```ts
becomeFocus(): boolean
```
Delegates to `x.becomeFocus(this)`, which:
1. Creates a new `S_Recent` entry recording current grabs and depth
2. Pushes to `x.si_recents`
3. Expands the new focus ancestry

```ts
reveal_toFocus()
```
Walks up the parent chain. If the focus is not among this ancestry's ancestors, reassigns focus to the parent. Then recursively calls `reveal_toFocus()` on the parent and expands it. Ensures the ancestry is reachable by navigating focus as needed.

---

## Grab

Grab state is in `x.w_grabs` (derived from `x.si_recents`).

```ts
grab()
```
`x.grab(this)` — adds to the current grab set, pushes a new `S_Recent`.

```ts
ungrab()
```
`x.ungrab(this)` — removes from grab set.

```ts
grabOnly()
```
`x.grabOnly(this)` — replaces all grabs with just this ancestry.

```ts
get isGrabbed(): boolean
```
`this.includedInAncestries(get(x.w_grabs))`

```ts
toggleGrab()
```
Grabs if not grabbed, ungrabs if grabbed.

```ts
grab_forShift(SHIFT: boolean)
```
SHIFT: `toggleGrab()`. No SHIFT: `grabOnly()`.

```ts
remove_fromGrabbed_andExpanded()
```
Collapses and ungrabs.

---

## Parent ancestry / navigation

```ts
get parentAncestry(): Ancestry | null
```
`this.ancestry_createUnique_byStrippingBack(1)` — strips the last relationship ID.

```ts
get siblingIndex(): number
```
`this.sibling_ancestries.map(a => a.pathString).indexOf(this.pathString)`

```ts
get sibling_ancestries(): Array<Ancestry>
```
`this.parentAncestry?.childAncestries ?? []`

```ts
get childAncestries(): Array<Ancestry>
```
`this.ancestries_createUnique_forKinship(T_Kinship.children)` — expands child relationships of the terminal thing using `Predicate.contains`.

```ts
get branchAncestries(): Array<Ancestry>
```
`g.w_branches_areChildren ? childAncestries : parentAncestries` — what gets rendered as "branches" depends on mode.

```ts
get parentAncestries(): Array<Ancestry>
```
Gathers all ancestries of `this.thing`, maps each to its `parentAncestry`, filters to those shallower than `this`.

```ts
get heritage(): Array<Ancestry>
```
Walks from this ancestry up to root via `ancestry_createUnique_byStrippingBack(1)`, returns them in root-first order.

---

## Ancestry creation and the uniqueness/caching system

### `h.ancestry_remember_createUnique`

```ts
// in Hierarchy.ts
ancestry_remember_createUnique(path: string = k.root, kind: string = T_Predicate.contains): Ancestry
```
Checks `si_ancestries_dict_byHID_forKind(kind)[path.hash()]`. If found, returns the cached instance. If not, creates `new Ancestry(db.t_database, path, kind)`, calls `ancestry_remember(ancestry)` (which inserts into both the flat HID dict and the per-thing dict), and returns it.

This means **every unique path string maps to exactly one Ancestry instance** (per database, per kind). All callers get the same object.

### `h.ancestry_forget`

Removes from `ancestry_dict_byHID`, from `ancestry_dict_byKind_andHID[kind]`, and from the per-thing dict. Used during deletion and cleanup.

### Creation methods on `Ancestry`

```ts
ancestry_createUnique_byStrippingBack(back: number): Ancestry | null
```
Strips the last `back` relationship IDs. `back=0` returns self. `back >= ids.length` returns `h.rootAncestry`. Otherwise joins remaining IDs and calls `h.ancestry_remember_createUnique`.

```ts
ancestry_createUnique_byAppending_relationshipID(id: string): Ancestry | null
```
Appends a relationship ID. Calls `h.ancestry_remember_createUnique`. After creation, validates:
- `containsMixedPredicates` → forget and return null
- `containsReciprocals` → forget and return null

```ts
ancestry_createUnique_byAddingThing(thing: Thing | null): Ancestry | null
```
Finds the `contains` relationship where `this.thing` is parent and `thing` is child, then calls `ancestry_createUnique_byAppending_relationshipID`.

```ts
ancestry_remember_createUnique_byAddingThing(thing, kind): Ancestry | null
```
Creates a new relationship (`h.relationship_remember_createUnique`) and appends it. For bidirectional predicates, also creates the reversed relationship in memory. Normalizes sibling orders afterward.

```ts
async ancestry_persistentCreateUnique_byAddingThing(thing, kind): Promise<Ancestry | null>
```
Same as above but persists the relationship to the database. Awaits `thing.persistence.already_persisted` check and `h.db.thing_remember_persistentCreate` if needed.

### Validity checks

```ts
get containsMixedPredicates(): boolean
```
True if any relationship in the path has a `kind` that doesn't match `this.kind`. Invalid ancestries are rejected on creation.

```ts
get containsReciprocals(): boolean
```
Walks relationship pairs; if adjacent relationships form a A→B, B→A pair (same child/parent IDs reversed), returns true. Prevents cycles in the path encoding.

```ts
get isInvalid(): boolean
```
`containsReciprocals || containsMixedPredicates`

---

## `incorporates`

```ts
incorporates(ancestry: Ancestry | null): boolean
```
Returns true if `ancestry`'s relationship IDs are a **prefix** of this ancestry's IDs. Used in tree mode visibility: `this.incorporates(focus)` means focus is at or above this ancestry in the path.

This is the key check: "does this ancestry live under the focus?"

---

## `equals` and `includedInAncestries`

```ts
equals(ancestry: Ancestry | null | undefined): boolean
```
`super.equals(ancestry) && this.t_database == ancestry.t_database` — both path string and database must match.

```ts
includedInAncestries(ancestries: Array<Ancestry> | undefined): boolean
```
Filters using `equals`. Returns `(included.length ?? 0) > 0`.

```ts
includedInStore_ofAncestries(store: Writable<Array<Ancestry> | null>): boolean
```
Gets the store value and calls `includedInAncestries`.

---

## `ancestry_assureIsVisible` and `assure_isVisible_within`

```ts
ancestry_assureIsVisible(): boolean
```
If already visible, returns false. Otherwise:
- Tree mode: creates a focus ancestry by stripping back `global_depth_limit` levels, makes it focus, then calls `reveal_toFocus()`.
- Radial mode: makes `parentAncestry` the focus, then calls `assure_isVisible_within(sibling_ancestries)`.
Returns true if action was taken.

```ts
assure_isVisible_within(ancestries: Array<Ancestry>): boolean
```
Radial mode only. Finds this ancestry's index in `ancestries` by thing ID match. If `g_paging.index_isVisible(index)` is false, calls `g_paging.update_index_toShow(index)` to scroll to that page.

---

## `ancestry_toggle_expansion` (via `toggleExpanded`)

```ts
toggleExpanded(): boolean
```
`expanded_setTo(!this.isExpanded)` — inverts expanded state, returns whether state changed.

---

## Visible subtree geometry

```ts
height_ofVisibleSubtree(visited: string[] = []): number
```
If `shows_branches`: sums `height_ofVisibleSubtree` for all `branchAncestries` (cycle-guarded by visited). Returns `max(sum, k.height.row)`. Otherwise returns `k.height.row` (16px). Returns 0 if thing is null.

```ts
visibleSubtree_width(visited: string[] = []): number
```
Base width = `thing.width_ofTitle + 6`. If `shows_branches`, adds the max of each branch's `visibleSubtree_width` plus `k.height.line + k.height.dot` (connector + dot space).

```ts
get size_ofVisibleSubtree(): Size
```
`new Size(visibleSubtree_width(), height_ofVisibleSubtree())`

```ts
get halfSize_ofVisibleSubtree(): Size
```
`size_ofVisibleSubtree.dividedInHalf`

```ts
get halfHeight_ofVisibleSubtree(): number
```
`height_ofVisibleSubtree() / 2`

```ts
visibleSubtree_ancestries(visited: string[] = []): Array<Ancestry>
```
Recursively collects all visible ancestries in the subtree, including this one if visible.

---

## Geometry: `g_widget`, `g_cluster`, `g_paging`

```ts
get g_widget(): G_Widget
```
`g_widget_for_t_graph(get(show.w_t_graph))` — lazy-creates a `G_Widget` for the current graph mode, keyed by `T_Graph` enum value. Stored in `this.g_widgets` dict.

```ts
g_widget_for_t_graph(t_graph: T_Graph): G_Widget
```
Returns cached `G_Widget` or creates `G_Widget.empty(this)` and caches it.

```ts
get g_cluster(): G_Cluster | null
```
`this.g_widget.g_cluster ?? null` — the cluster this widget belongs to, if any.

```ts
get g_paging(): G_Paging | null
```
`this.g_cluster?.g_paging_forAncestry(this) ?? null` — paging state for this ancestry within its cluster.

---

## Traversal

```ts
traverse(apply_closureTo: (ancestry: Ancestry) => boolean, t_kinship: T_Kinship = T_Kinship.children, visited: string[] = [])
```
Depth-first traversal. Closure returns `true` to stop, `false` to continue. Visited is tracked by `thing.id` to prevent cycles. Traversal direction is controlled by `t_kinship` (children, parents, related).

```ts
async async_traverse(apply_closureTo: (ancestry: Ancestry) => Promise<boolean>, t_kinship = T_Kinship.children, visited: string[] = [])
```
Same but async. Awaits the closure and each recursive call. Catches errors per-node.

---

## Ordering

```ts
get order(): number
```
`this.relationship?.order_forPointsTo(this.isCluster_ofChildren) ?? -12345`

```ts
order_setTo(order: number)
```
`this.relationship?.order_setTo_forPointsTo(order, isCluster_ofChildren)`

```ts
reorder_within(ancestries: Array<Ancestry>, up: boolean)
```
Normalizes orders, increments/decrements the index, computes a `nudge` of `±k.halfIncrement` (0.5) to avoid duplicate orders, sets new order, renormalizes.

```ts
order_normalizeRecursive(visited: string[] = [])
```
Recursively normalizes child orders, cycle-guarded by ancestry `id`.

---

## Kinship and predicate resolution

```ts
ancestries_createUnique_forKinship(kinship: string | null): Array<Ancestry>
```
Switch on `T_Kinship`:
- `children`: `ancestries_createUnique_forPredicate(Predicate.contains)` on this ancestry
- `parents`: `thing.ancestries_createUnique_forPredicate(Predicate.contains)` on the thing
- `related`: `thing.ancestries_createUnique_forPredicate(Predicate.isRelated)` on the thing

```ts
ancestries_createUnique_forPredicate(predicate: Predicate | null): Array<Ancestry>
```
For `contains`: appends each child relationship ID via `ancestry_createUnique_byAppending_relationshipID`. Normalizes order.
For non-contains: creates single-segment ancestries via `h.ancestry_remember_createUnique(relationship.id, kind)`.

---

## Bidirectionals

```ts
get bidirectional_ancestries(): Array<Ancestry>
```
For each predicate that `isBidirectional`, collects all ancestries pointing from other things to `this.thing`, uniquely concatenated.

```ts
get g_lines_forBidirectionals(): Array<G_TreeLine>
```
Finds visible ancestries for each bidirectional target that are deeper than `this.depth + 1`, creates `G_TreeLine` geometry objects connecting them.

```ts
g_line_bidirectionaTo(other: Ancestry): G_TreeLine
```
Computes a curved line rect from this ancestry's reveal center to other's drag center, with an x-offset of `-(k.height.line + k.height.dot / 2)`.

---

## Radial mode vs tree mode differences

| Concern | Tree mode | Radial mode |
|---|---|---|
| `isVisible` | focus-prefix + all-expanded + depth-limit | focus/child-of-focus/parent-of-focus + paging |
| `points_right` | `!hasVisibleChildren` (toggles with expand) | `g_widget.reveal_isAt_right` (angular position) |
| `shows_reveal` | only for `hasChildren || isBulkAlias` | also for `hasParents`; never when `isFocus` |
| depth limit | applies via `depth_within_focus_subtree` | not used |
| `hidden_by_depth_limit` | can be true | always false (guard: `show.inTreeMode`) |
| `ancestry_assureIsVisible` | strips back to focus level, `reveal_toFocus` | makes parent focus, `assure_isVisible_within` paging |
| `assure_isVisible_within` | no-op | scrolls paging to correct index |
| tiny outer dots | shown for `hidden_by_depth_limit` or collapsed-with-children | shown based on separate `isVisible_inRadial` logic |
| `shows_branches` | `shows_children` when `w_branches_areChildren` else `!isRoot` | same formula |

---

## Edit state

```ts
get isEditing(): boolean
```
`get(x.w_s_title_edit)?.ancestry_isEditing(this) ?? false`

```ts
get isEditable(): boolean
```
`canEdit && features.allow_title_editing && !isExternals && !isBulkAlias`. Firebase root is not editable.

```ts
startEdit()
```
Guards `isEditable` and not already editing. Sets `x.w_s_title_edit` to a new `S_Title_Edit(this)`, then calls `grabOnly()`.

---

## Alteration (add/remove relationships)

```ts
get alteration_isAllowed(): boolean
```
Checks `x.w_s_alteration` state. Guards against:
- Same thing
- Same ancestry
- Creating cycles (`isParent_ofFrom || isProgeny_ofFrom || isFrom_anAncestor`)
- For add: cycles disallow; for remove: must already be parent.

---

## Keyboard navigation helpers

```ts
persistentMoveUp_maybe(up, SHIFT, OPTION, EXTREME): [boolean, boolean]
```
Routes to one of three handlers based on `isCluster_ofChildren` / `isBidirectional`:
- `persistentMoveUp_forChild_maybe` — normal child nav
- `persistentMoveUp_forParent_maybe` — parent cluster nav (radial)
- `persistentMoveUp_forBidirectional_maybe` — related cluster nav (radial)

Each returns `[needs_graphRebuild, needs_graphRelayout]`.

OPTION key: `reorder_within` (physically reorders the relationship). No OPTION: moves the grab cursor to adjacent sibling.

---

## Title and component access

```ts
get title(): string
```
`this.thing?.title ?? 'missing title'`

```ts
get abbreviated_title(): string
```
`this.thing?.abbreviated_title ?? '?'`

```ts
get titles(): Array<string>
```
Maps all ancestor things to their titles. Used for `description`.

```ts
get description(): string
```
`\`${kind} "${thing?.t_thing}" ${titles.join(':')}\`` — used for debugging.

```ts
get titleComponent(): S_Component | null
```
`components.component_forAncestry_andType_createUnique(this, T_Hit_Target.title)`

```ts
get rect_ofTitle(): Rect | null
```
`this.rect_ofComponent(this.titleComponent)`

```ts
get center_ofTitle(): Point | null
```
`this.rect_ofTitle?.center ?? null`

---

## Progeny checks

```ts
isAProgenyOf(ancestry: Ancestry): boolean
```
Traverses `ancestry` depth-first; returns true if `this.equals(progenyAncestry)` during traversal. Never traverses bidirectional ancestries.

```ts
isChildOf(other: Ancestry): boolean
```
`this.id_thing == other.thingAt(2)?.id` — true if this thing is the immediate child of the thing 2 hops up in `other`.

```ts
progeny_count(visited: string[] = []): number
```
Recursive sum of all descendant ancestries, cycle-guarded by thing ID.

```ts
get isAllProgeny_expanded(): boolean
```
Traverses; returns false on first unexpanded ancestry.

```ts
get hasGrandChildren(): boolean
```
Checks if any `childAncestry.hasChildren`.

---

## Store helpers

```ts
matchesStore(store: Writable<Ancestry | null>): boolean
```
`get(store)?.equals(this) ?? false`

```ts
includedInStore_ofAncestries(store: Writable<Array<Ancestry> | null>): boolean
```
`!!get(store) && this.includedInAncestries(get(store)!)`

---

## Key constants used

| Constant | Value | Role |
|---|---|---|
| `k.root` | `"root"` | Path string for root ancestry |
| `k.separator.generic` | `"::"` | Joins relationship IDs in path |
| `k.height.dot` | `14` | Dot diameter for SVG paths |
| `k.height.row` | `16` | Row height for subtree geometry |
| `k.height.line` | `18` | Line height (row + 2) |
| `k.tiny_outer_dots.diameter` | `20` | Tiny dot outer diameter |
| `k.halfIncrement` | `0.5` | Nudge for order deduplication |

---

## Key stores touched

| Store | Owner | Role |
|---|---|---|
| `x.w_ancestry_focus` | `S_UX` (derived) | Current focus ancestry |
| `x.w_grabs` | `S_UX` (derived) | Current grabbed ancestries |
| `x.si_expanded` | `S_UX` | Expanded ancestries set |
| `x.w_s_title_edit` | `S_UX` | Active title edit state |
| `x.w_s_alteration` | `S_UX` | Active relationship alteration |
| `x.si_recents` | `S_UX` | History stack (focus + grabs + depth) |
| `g.w_depth_limit` | `Geometry` | Global depth limit (persisted) |
| `g.w_branches_areChildren` | `Geometry` | Tree direction mode |
| `show.w_t_graph` | `Visibility` | Current graph type (tree/radial) |
