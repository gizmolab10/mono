# UX State Design Spec

Source files: `ws/src/lib/ts/managers/UX.ts`, `ws/src/lib/ts/state/S_Items.ts`, and all state objects listed below.

---

## S_Items<T> — Generic Paged Collection

File: `ws/src/lib/ts/state/S_Items.ts`

The foundational collection primitive used everywhere grab lists, recents, found results, traits, and tags are managed.

### Writable stores (direct)

- `w_items: writable<Array<T>>([])` — the backing array
- `w_index: writable<number>(0)` — current position within items

### Derived stores (read-only)

- `w_item: Readable<T | null>` — `items[index] ?? null`; re-derives whenever `w_items` or `w_index` changes
- `w_length: Readable<number>` — `items.length`; re-derives from `w_items`
- `w_extra_titles: Readable<string[]>` — `[]` when length < 2, else `[T_Direction.previous, T_Direction.next]`; signals whether prev/next navigation UI should appear
- `w_description: Readable<string>` — debugging string: `"id (@ <index>): <id>   ids (<count>): <sorted-joined-ids>"`; re-derives from both stores

### Computed getters (synchronous)

- `get index(): number` — `get(w_index)`
- `set index(i: number)` — `w_index.set(i)`
- `get item(): T | null` — `get(w_item)`
- `get length(): number` — `get(w_length)`
- `get items(): Array<T>` — `get(w_items)`
- `get identifiable(): Identifiable | null` — item cast to `Identifiable`
- `get descriptionBy_sorted_IDs(): string` — sorted pipe-joined ids of all items

### items setter

`set items(items: Array<T>)` — sets `w_items`, then clamps the prior index: if array is empty, index → 0; otherwise index → `prior.force_between(0, length - 1)`. This means the index is always valid after assignment.

### Manipulation methods

- `reset()` — sets items to `[]`, then index to `0`
- `push(item: T)` — if item not already present (by reference via `indexOf`), appends it; always moves index to the item's position in the array (whether existing or newly pushed)
- `remove(item: T)` — splices item out; if resulting array is empty calls `reset()`; otherwise adjusts index down by 1 if the removed item was before the current index
- `remove_all_beyond_index()` — iterates backwards from last item to `index + 1`, removing each; effectively truncates future history
- `add_uniquely_from(from: S_Items<T> | null)` — merges items from another S_Items, skipping duplicates (by reference)
- `find_next_item(next: boolean): boolean` — increments or decrements index (wrapping), skipping nulls; returns `true` if a non-null item was found; returns `false` if no items exist

### Persistence methods

- `serialize<U>(itemSerializer: (item: T) => U): U[]` — maps items through a serializer
- `static fromDefault<T>(item: T): S_Items<T>` — creates a single-item collection
- `static deserialize<T, U>(data: U[] | null, itemDeserializer: (data: U) => T | null): S_Items<T> | null` — creates from serialized data, filters nulls, sets index to last item; returns null if empty

### Static

- `static dummy = new S_Items<any>([])` — shared empty instance used as a placeholder in `S_Banner_Hideable`

### S_Recent structure

Type: `S_Recent` (defined in `ws/src/lib/ts/types/Types.ts`, not shown here, but used in UX.ts)

From usage in UX.ts, an `S_Recent` has:
- `focus: Ancestry` — the ancestry that was the focus at this point in history
- `si_grabs: S_Items<Ancestry>` — the grab set at this point in history (with its own index)
- `depth: number` — the `g.w_depth_limit` value at this point in history

---

## UX.ts (S_UX class) — Focus, Grabs, Recents

File: `ws/src/lib/ts/managers/UX.ts`
Singleton exported as `x`.

### Top-level writable stores

- `w_s_title_edit: writable<S_Title_Edit | null>(null)` — currently active title edit state, or null
- `w_s_alteration: writable<S_Alteration | null>()` — current structural alteration in progress
- `w_rubberband_grabs: writable<Ancestry[]>([])` — live grab set during rubberband drag; bypasses history
- `w_thing_title: writable<string | null>()` — current thing's title (for display/reactivity)
- `w_order_changed_at: writable<number>(0)` — timestamp signaling order mutations
- `w_thing_fontFamily: writable<string>()` — font family for current thing

### Non-reactive collections (S_Items instances)

- `si_expanded = new S_Items<Ancestry>([])` — set of currently expanded ancestries
- `si_recents = new S_Items<S_Recent>([])` — focus/grab history stack (described below)
- `si_found = new S_Items<Thing>([])` — search results

### Non-reactive fields

- `dragDotJustClicked: boolean` — prevents Widget from double-handling drag dot clicks
- `parents_focus: Ancestry` — stored previous focus when in children branch mode
- `prior_focus: Ancestry` — stored focus before switching to parent branch mode

---

### si_recents — The Focus/Grab History Stack

`si_recents` is an `S_Items<S_Recent>`. Each entry is an `S_Recent` snapshot: `{ focus, si_grabs, depth }`.

The index within `si_recents` is the "current position" in history. Operations:
- `becomeFocus`, `grab`, `grabOnly`, `grab_none`, `ungrab` all call `si_recents.push(recent)` — which appends a new entry and moves the index to the end
- `recents_go(next)` calls `si_recents.find_next_item(next)` — navigates backward or forward through history without creating a new entry
- No explicit undo/redo truncation is performed at the S_Items level when going back and then making a new change — `push` appends unconditionally

---

### w_ancestry_focus — Derived Focus

```ts
w_ancestry_focus = derived(
    [si_recents.w_item, w_grabIndex, show.w_t_graph, w_grabs],
    ([item, index, mode, grabs]) => item?.focus ?? h?.rootAncestry
)
```

- Reads `si_recents.w_item` — the current `S_Recent`
- Extracts `.focus` from that recent
- Falls back to `h.rootAncestry` if no recent exists
- The `mode`, `index`, `grabs` dependencies are declared but the radial-mode branch is commented out in the current code
- Re-derives whenever the current recent changes (any push to `si_recents` or navigation within it)

---

### w_si_grabs, w_grabs, w_grabIndex — Multi-Select Grab System

#### w_si_grabs

```ts
w_si_grabs = derived([si_recents.w_item], ([recent]) => recent?.si_grabs ?? null)
```

The raw `S_Items<Ancestry>` from the current `S_Recent`, or null.

#### w_grabs

```ts
w_grabs = derived([si_recents.w_item, w_rubberband_grabs], ([recent, rubberbandGrabs]) => {
    if (rubberbandGrabs.length > 0) return rubberbandGrabs;
    return recent?.si_grabs?.items ?? [];
})
```

- **Rubberband takes priority**: if `w_rubberband_grabs` is non-empty, returns that array directly (bypassing history)
- Otherwise returns `recent.si_grabs.items`
- Result: always an `Ancestry[]`

#### w_grabIndex

```ts
w_grabIndex = derived([si_recents.w_item, w_rubberband_grabs], ([recent, rubberbandGrabs]) => {
    if (rubberbandGrabs.length > 0) return rubberbandGrabs.length - 1;
    return recent?.si_grabs?.index ?? 0;
})
```

- During rubberband: index is always the last item (most recently added)
- Otherwise: `recent.si_grabs.index`

---

### w_ancestry_forDetails — Details Panel Target

Priority cascade, re-derives from: `search.w_t_search`, `si_found.w_index`, `si_found.w_items`, `show.w_show_search_controls`, `w_ancestry_focus`, `w_grabs`, `w_grabIndex`.

1. **Search selected** (highest priority): if `showSearchControls` is true AND `t_search === T_Search.selected`, returns `foundItems[foundIndex].ancestry`
2. **Current grab**: if `grabs.length > 0`, returns `grabs[grabIndex]`
3. **Focus**: returns `focus`
4. **null**: fallback

Getter: `get ancestry_forDetails(): Ancestry | null` — synchronous read via `get(w_ancestry_forDetails)`.

---

### becomeFocus(ancestry: Ancestry): boolean

```
priorFocus = get(w_ancestry_focus)
changed = !priorFocus || !ancestry.equals(priorFocus)
if changed:
    clone current grabs and grabIndex into si_grabs_clone
    push S_Recent { focus: ancestry, si_grabs: si_grabs_clone, depth: get(g.w_depth_limit) } to si_recents
    set w_s_alteration to null
    call ancestry.expand()
return changed
```

- Creates a new history entry with the new focus and a snapshot of the current grabs
- Clears any in-progress alteration
- Expands the focused ancestry
- Returns whether the focus actually changed

---

### Grab Methods

All grab methods guard against `radial.isDragging` — they are no-ops during a radial drag.

#### grab(ancestry: Ancestry)

Multi-select toggle-append:
1. Copy current grabs into `items`
2. If ancestry is already in `items` but not at the end, remove it from its current position
3. If ancestry is not at the end (or not present), push it to the end
4. Set `si_grabs_new.index` to `items.length - 1`
5. Push new `S_Recent` with current focus, new grab list, current depth
6. Call `h.stop_alteration()`

Net effect: ancestry moves to the end of the grab list (becomes the "primary" grab).

#### grabOnly(ancestry: Ancestry)

Single-select:
1. Create new `S_Items<Ancestry>([ancestry])` (replaces all prior grabs)
2. Push new `S_Recent` with current focus (or ancestry as fallback), new single-item grab list, current depth
3. Call `h.stop_alteration()`

#### grab_none()

Clear all grabs (guards against `radial.isDragging`):
1. Create new empty `S_Items<Ancestry>([])`
2. Push new `S_Recent` with current focus, empty grab list, current depth
3. Call `h.stop_alteration()`

#### ungrab(ancestry: Ancestry)

Remove one ancestry from the grab set:
1. Set `w_s_title_edit` to null
2. Copy current grabs, find and splice out the ancestry (using `equals()`)
3. Push new `S_Recent` with current focus, reduced grab list, current depth
4. Call `h.stop_alteration()`

#### setGrabs_forRubberband(ancestries: Ancestry[])

Sets `w_rubberband_grabs` directly — bypasses history entirely. Used during live rubberband drag for performance.

#### ungrab_invisible_grabs()

Iterates `get(w_grabs)`. For each grab where `grab.hidden_by_depth_limit` or `grab.focus_isProgeny` is true, calls `grab.ungrab()`. Cleans up grabs that are no longer visible.

---

### grabIndex Navigation

#### grab_next_ancestry(next: boolean)

Used by details selection banner prev/next:
- If search is active (`t_search > T_Search.off`): delegates to `si_found.find_next_item(next)`
- Otherwise: calls `recent.si_grabs.find_next_item(next)` on the current recent's grab list, then forces derived stores to re-derive by doing `si_recents.w_items.update(items => [...items])` (creates new array reference to trigger reactivity)
- Always calls `details.redraw()` after

---

### recents_go(next: boolean) — History Navigation

Navigates the focus/grab history:
1. Guards: `busy.isRendering` → return; `si_recents.length === 0` → return
2. Sets `busy.isRendering = true`
3. Calls `si_recents.find_next_item(next)` — moves index in `si_recents`
4. If successful: calls `recent.focus?.expand()`, calls `grab.ancestry_assureIsVisible()` for all grabs, sets `g.w_depth_limit` to `recent.depth`, calls `g.grand_build()`, calls `details.redraw()`
5. Uses `requestAnimationFrame` to unset `busy.isRendering = false` (rate-limiting)

---

### update_forFocus() — Branch Mode Switching

Handles switching between parent-branch mode (`g.w_branches_areChildren = false`) and children-branch mode (`g.w_branches_areChildren = true`):

```
focus = get(w_ancestry_focus) ?? h.rootAncestry
if branches_areChildren:
    parents_focus = focus          // save current focus as "parents" perspective
    focus = prior_focus            // restore what the children perspective had
else:
    prior_focus = focus            // save current focus as "children" perspective
    focus = parents_focus ?? (ancestry_forDetails ?? null)   // restore parents perspective
focus?.becomeFocus()
```

- `parents_focus` and `prior_focus` are plain fields (not stores), acting as slot storage for the two perspectives
- `becomeFocus()` called on the target ancestry triggers the actual store update

---

### restore_focus() / set_ancestryFocus_from_recents_index

These method names appear in the prompt but are not present in the current source of `UX.ts`. The closest equivalent functionality is:
- `recents_go(next)` — navigates recents by index
- The `si_recents.find_next_item(next)` call within it — which is the mechanism for restoring a prior focus from the history stack

No method named `restore_focus` or `set_ancestryFocus_from_recents_index` exists in the current codebase.

---

### Trait and Tag accessors

- `get trait(): Trait | null` — `h.si_traits.item`
- `get thing_trait(): Trait | null` — `si_thing_traits.item`
- `get si_thing_traits(): S_Items<Trait>` — `ancestry_forDetails?.thing?.si_traits ?? new S_Items<Trait>([])`
- `get si_thing_tags(): S_Items<Tag>` — `ancestry_forDetails?.thing?.si_tags ?? new S_Items<Tag>([])`
- `select_next_thingTrait(next: boolean)` — `si_thing_traits.find_next_item(next)`
- `select_next_thing_tag(next: boolean)` — `si_thing_tags.find_next_item(next)`
- `select_next_trait(next: boolean)` — navigates `h.si_traits`, assures ancestry is visible, rebuilds graph (currently noted as "not yet used")

---

### assure_grab_isVisible()

Gets `ancestry_forDetails`, calls `ancestry.ancestry_assureIsVisible()`, then `g.grand_build()` and `details.redraw()`.

---

## State Objects

---

### S_Alteration

File: `ws/src/lib/ts/state/S_Alteration.ts`

Tracks a structural edit in progress (e.g., a drag-to-reorder or relation change).

#### Fields

- `t_alteration: T_Alteration` — enum value identifying the type of alteration
- `predicate: Predicate | null` — which predicate the alteration applies to; defaults to `Predicate.contains` if null is passed
- `ancestry: Ancestry` — the ancestry being altered

#### Constructor

`constructor(ancestry, t_alteration, predicate)` — `predicate` is normalized to `Predicate.contains` if null.

#### Computed

- `get description(): string` — `"<t_alteration> <predicate.description>"` or `"<t_alteration> unpredicated"`

#### Usage in UX

Stored in `x.w_s_alteration`. Set to null by `becomeFocus`, `grab`, `grabOnly`, `grab_none`, `ungrab` (via `h.stop_alteration()`).

---

### S_Widget

File: `ws/src/lib/ts/state/S_Widget.ts`
Extends: `S_Element`

Preserves rendering state for a widget (node in tree or radial view) across DOM reattachment.

#### Fields (own)

- `last_snapshot: S_Snapshot` — snapshot captured at last render; used by `detect_ifState_didChange`
- `s_reveal: S_Element` — element state for the reveal/expand dot
- `s_title: S_Element` — element state for the title area
- `s_drag: S_Element` — element state for the drag dot

#### Constructor

Creates sub-elements via `elements.s_element_for(ancestry, T_Hit_Target.<type>, k.empty)` for drag, title, and reveal. Sets `last_snapshot` to current snapshot.

#### Color getters (delegated to Styles manager)

- `get stroke()` → `this.color`
- `get fill()` → `this.background_color`
- `get color()` → `widget_colors.color`
- `get border()` → `widget_colors.border`
- `get background_color()` → `widget_colors.background_color`
- `get background()` → CSS string `"background-color: <value>"`
- `get widget_colors()` → calls `styles.get_widgetColors_for(this.snapshot, this.thing_color, get(colors.w_background_color))`

#### State change detection

`get detect_ifState_didChange(): boolean` — compares current ancestry state (`isEditing`, `isGrabbed`, `isFocus`) against `last_snapshot`, then updates `last_snapshot`. Returns true if any of the three changed.

---

### S_Element

File: `ws/src/lib/ts/state/S_Element.ts`
Extends: `S_Hit_Target`

Single source of truth for stroke, fill, cursor, and border of interactive UI elements: buttons, segments, widget dots. Also tracks grabbed/expanded state.

#### Fields (own)

- `defaultDisabledColor = '#999999'`
- `color_background = 'white'` — base background color; for search-subtype dots: `'transparent'`; for other dots: value of `colors.w_background_color`
- `isDisabled = false`
- `isSelected = false`
- `isInverted = false` — inverts hover color logic
- `subtype = k.empty`
- `isFocus = false`
- `name = k.empty`

#### Constructor

Calls `elements.name_from(identifiable, type, subtype)` to compute the name. For dots, sets `color_background` based on subtype (search → transparent, else graph background).

#### Computed getters

- `get snapshot(): S_Snapshot` — creates a frozen snapshot of current state
- `get color_isInverted(): boolean` — `isInverted XOR isHovering`
- `get asTransparent(): boolean` — true if disabled OR subtype is `T_Control.details`
- `get show_help_cursor(): boolean` — true if control key is down AND type is `T_Hit_Target.action`
- `get cursor(): string` — if hovering and not disabled: help cursor (if `show_help_cursor`) or `hoverCursor`; else `defaultCursor`
- `get disabledTextColor(): string` — blended color from background and `#999999`
- `get description(): string` — `"in/out '<name>'"`
- `get thing_color(): string` — `ancestry.thing?.color ?? k.empty`

#### Fill logic

1. `asTransparent` → `'transparent'`
2. `isADot` → `dotColors_forElement.fill`
3. `isAControl` → `buttonColors_forElement.fill`
4. `ancestry.isGrabbed` → `thing_color`
5. else: `color_isInverted ? hoverColor : isSelected ? 'lightblue' : color_background`

#### Stroke logic

1. `isADot` → `dotColors_forElement.stroke`
2. `isAControl` → `buttonColors_forElement.stroke`
3. `isDisabled` → `disabledTextColor`
4. else: `color_isInverted ? color_background : element_color`

#### SVG outline color

Only meaningful for dots; returns `dotColors_forElement.svg_outline_color` or `k.empty`.

#### Border logic

If `thing_color` is set:
- `ancestry.isEditing` → `"dashed <color> 1px"`
- `ancestry.isFocus && !ancestry.isGrabbed` → `"solid <color> 1px"`
- `isHovering` → `"solid <ofBackgroundFor(color)> 1px"`

Else → `"solid transparent 1px"`

---

### S_Snapshot

File: `ws/src/lib/ts/state/S_Snapshot.ts`

Immutable point-in-time snapshot of an `S_Element`'s state. Used by the Styles manager to compute colors without re-querying live state mid-render.

#### Fields

- `ancestry: Ancestry`
- `isInverted: boolean`
- `isDisabled: boolean`
- `isSelected: boolean`
- `isHovering: boolean`
- `isGrabbed: boolean` — from `ancestry.isGrabbed`
- `isEditing: boolean` — from `ancestry.isEditing`
- `isFocus: boolean` — from `ancestry.isFocus`
- `thing_color: string` — from `ancestry.thing?.color ?? k.empty`
- `subtype: string`
- `type: string`

#### Constructor

`constructor(s_element: S_Element)` — copies all fields from `s_element`, deriving `isFocus`, `isGrabbed`, `isEditing`, `thing_color` from the ancestry at that moment.

---

### S_Persistence

File: `ws/src/lib/ts/state/S_Persistence.ts`

Tracks the persistence lifecycle of a single persistable entity.

#### Fields

- `awaiting_remoteCreation: boolean` — entity has been created locally but the remote hasn't confirmed it yet; `persist_withClosure` is a no-op when true
- `t_persistable: T_Persistable` — enum type of the persistable entity
- `lastModifyDate: Date` — updated on each `persist_withClosure` call
- `already_persisted: boolean` — whether the entity already exists in the database
- `needsBulkFetch: boolean` — flag for deferred bulk fetch
- `t_database: string` — identifier for which database this belongs to
- `isDirty: boolean` — true if persistent, not already persisted, and not currently fetching
- `id: string`

#### Computed

- `get isPersistent(): boolean` — queries `databases.db_forType(t_database)?.isPersistent`

#### Methods

- `updateModifyDate()` — sets `lastModifyDate` to now
- `wasModifiedWithinMS(threshold): boolean` — returns true if last modify was within threshold ms; logs `'slow: needs remote save'` if not
- `async persist_withClosure(closure: Async_Handle_Boolean)` — if persistent and not awaiting remote creation: calls `updateModifyDate()`, then `await closure(already_persisted)`
- `setDate_fromSeriously(seriously_date: string)` — parses a Seriously-format timestamp string, converts from Mac Seriously epoch (1994-based) to current year by adding `(2025 - 1994)` years

---

### S_Resizing

File: `ws/src/lib/ts/state/S_Resizing.ts`
Extends: `S_Rotation`

Manages the resize-ring interaction for the radial necklace (arc radius dragging).

#### Own fields

- `basis_radius: number | null = null` — distance from arc radius to mouse-down location; `null` when not dragging

#### Constructor

`super(T_Hit_Target.resizing)`

#### Computed/overrides

- `get hover_cursor(): string` → `'all-scroll'`
- `get isDragging(): boolean` → `!!basis_radius`
- `get fill_opacity(): number` → `isHovering ? k.opacity.cluster.armature : k.opacity.cluster.faint`
- `reset()` → calls `super.reset()`, sets `basis_radius = null`
- `update_fill_color()` → `fill_color = isHighlighted ? colors.opacitize(color, fill_opacity) : 'transparent'`
- `ring_zone_matches_type(ring_zone)` → true only if `ring_zone === T_Radial_Zone.resize && type === T_Hit_Target.resizing`

---

### S_Rotation

File: `ws/src/lib/ts/state/S_Rotation.ts`
Extends: `S_Component`

Manages rotation-ring and paging-thumb interactions in the radial view.

#### Fields

- `active_angle: number | null` — current angle at mouse MOVE position
- `basis_angle: number | null` — starting angle at mouse DOWN; null when not dragging
- `fill_color = 'transparent'`
- `cluster_name: string | null` — for paging type: name of the cluster this belongs to

#### Constructor

`super(null, type)` (type defaults to `T_Hit_Target.rotation`). Overrides `contains_point` with `does_contain_point`. After 1ms timeout calls `reset()`. Subscribes to `x.w_ancestry_focus`: sets `this.identifiable = ancestry`, calls `update_fill_color()` on every focus change.

#### Computed getters

- `get hover_cursor(): string` → `'alias'`
- `get isDragging(): boolean` → `!!basis_angle`
- `get isHighlighted(): boolean` → `isHovering || isDragging`
- `get active_cursor(): string` → `new Angle(active_angle!).cursor_forAngle`
- `get color(): string` → `ancestry?.thing?.color ?? colors.default_forThings`
- `get stroke_opacity(): number` → `isHovering ? k.opacity.cluster.hover : k.opacity.none`
- `get fill_opacity(): number` → `isHovering ? k.opacity.cluster.armature : k.opacity.cluster.faint`
- `get cursor(): string` → dragging → `active_cursor`; hovering → `hover_cursor`; else → `k.cursor_default`
- `get thumb_opacity(): number` → dragging or hovering → `k.opacity.cluster.active`; else → `k.opacity.cluster.thumb`

#### Methods

- `reset()` → sets both angles to null, calls `update_fill_color()`
- `update_fill_color()` → `fill_color = colors.opacitize(color, fill_opacity)`
- `does_contain_point(point): boolean` → checks ring zone via `radial.ring_zone_atScaled(point)`; for paging type, additionally verifies that the mouse is over this specific cluster's thumb via `g_graph_radial.g_cluster_atMouseLocation`
- `ring_zone_matches_type(ring_zone)` → maps type to zone: rotation ↔ rotate, resizing ↔ resize, paging ↔ paging

---

### S_Title_Edit

File: `ws/src/lib/ts/state/S_Title_Edit.ts`

Singleton (stored in `x.w_s_title_edit`) tracking the state machine of an in-progress title edit.

#### Enum T_Edit

- `percolating` — edit is propagating (e.g., through event system)
- `stopping` — edit is in process of stopping
- `editing` — actively editing
- `done` — edit complete

#### Fields

- `t_edit: T_Edit` — source of truth for editing state; starts at `T_Edit.editing`
- `ancestry: Ancestry` — the ancestry being edited
- `title: string` — current title string (starts as `k.empty`)

#### Computed getters

- `get thing(): Thing | null` → `ancestry.thing`
- `get isActive(): boolean` → `t_edit != T_Edit.done`
- `get description(): string` → `"<t_edit> <thing.title>"`
- `get thing_selectionRange(): Seriously_Range | undefined` → `thing?.selectionRange`

#### Identity / matching methods

- `refersTo(ancestry): boolean` → `this.ancestry.equals(ancestry)`
- `actively_refersTo(ancestry): boolean` → `refersTo(ancestry) && isActive`
- `inactively_refersTo(ancestry): boolean` → `refersTo(ancestry) && !isActive`
- `ancestry_isEditing(ancestry): boolean` → state is `T_Edit.editing` for that ancestry
- `ancestry_isStopping(ancestry): boolean` → state is `T_Edit.stopping` for that ancestry
- `ancestry_isPercolating(ancestry): boolean` → state is `T_Edit.percolating` for that ancestry
- `isAncestry_inState(ancestry, t_edit): boolean` — if ancestry doesn't match, returns false; otherwise checks `this.t_edit === t_edit`

#### Mutation methods

- `set_isEditing()` → sets `t_edit = T_Edit.editing`
- `stop_editing()` → sets `t_edit = T_Edit.done`, calls `thing?.set_isDirty()`
- `thing_setSelectionRange(range)` → sets `thing.selectionRange`
- `thing_setSelectionRange_fromOffset(offset)` → creates `Seriously_Range(offset, offset)`, calls above
- `setState_temporarilyTo_whileApplying(t_edit, apply)` — saves current state, sets to `t_edit`, calls `apply()`, restores state

---

### S_Rubberband

File: `ws/src/lib/ts/state/S_Rubberband.ts`
Singleton exported as `s_rubberband`.

Manages the rubberband (marquee) selection drag.

#### Fields

- `startPoint: Point | null = null` — mouse-down position; null when inactive
- `rbush: RBush<any> | null = null` — spatial index for hit-testing during drag
- `rect: Rect = Rect.zero` — current rubberband rectangle
- `lastUpdate: number = 0` — timestamp of last update (for throttling)

#### Computed

- `get isActive(): boolean` → `get(hits.w_dragging) === T_Drag.rubberband`

#### Methods

- `start(point, bounds)` — sets `startPoint`, clamps to `bounds`, resets `lastUpdate`, captures `hits.rbush_forRubberband`, sets `hits.w_dragging` to `T_Drag.rubberband`
- `update(mouseLocation, bounds): boolean` — throttled to 40ms intervals; clamps mouse to bounds, computes new `rect` from start to current point; returns true if rect was updated
- `stop()` — clears `startPoint`, `rbush`, resets `rect` to zero, sets `hits.w_dragging` to `T_Drag.none`

#### Integration with UX

During a rubberband drag, hits are reported via `x.setGrabs_forRubberband(ancestries)` which writes to `x.w_rubberband_grabs`. On stop, calling `x.grab(ancestry)` or `x.grab_none()` commits the selection to history. The rubberband live grabs override `w_grabs` derivation while `w_rubberband_grabs.length > 0`.

---

### S_Banner_Hideable

File: `ws/src/lib/ts/state/S_Banner_Hideable.ts`

State for a hideable details panel section banner.

#### Fields

- `slot_isVisible: boolean = false` — whether the slot content area is currently visible
- `t_detail: T_Detail` — which section this banner belongs to
- `hasBanner: boolean` — false for `T_Detail.header`; true for all others
- `isBottom: boolean` — true only for `T_Detail.data`

#### Constructor

`constructor(t_detail: T_Detail)` — sets `hasBanner` (all except `header`) and `isBottom` (`data` only).

#### si_items getter

Returns the `S_Items` that drives this section's pagination:
- `T_Detail.selection` → `null` (selection computes its titles directly from `w_grabs`)
- `T_Detail.tags` → `x.si_thing_tags`
- `T_Detail.traits` → `x.si_thing_traits`
- default → `S_Items.dummy`

---

### S_Busy

File: `ws/src/lib/ts/state/S_Busy.ts`
Singleton exported as `busy`.

Tracks async operation state to prevent concurrent operations and rate-limit UI actions.

#### Fields

- `isFetching: boolean = false` — database fetch in progress
- `isRendering: boolean = false` — used to rate-limit navigation during key repeat
- `isPersisting: boolean = false` — database write in progress
- `isFocusEventDisabled: boolean = false` — suppresses focus events temporarily

#### Computed

- `get isFocusEventEnabled(): boolean` → `!isFocusEventDisabled`
- `get isDatabaseBusy(): boolean` → `isPersisting || isFetching`

#### Async wrapper methods

- `temporarily_set_isPersisting_while(closure)` — sets `isPersisting = true`, signals redraw, awaits closure, restores prior value, signals redraw again
- `temporarily_set_isFetching_while(closure)` — same pattern for `isFetching`
- `temporarily_disable_focus_event_while(closure)` — sets `isFocusEventDisabled = true`, calls (sync) closure, restores. Note: not async despite the wrapper pattern

#### Signal method

- `signal_data_redraw(after = 0)` — `setTimeout(() => databases.w_data_updated.set(Date.now()), after)` — triggers reactive updates in any subscriber watching `databases.w_data_updated`

---

## Visibility.ts — Show Flags

File: `ws/src/lib/ts/managers/Visibility.ts`
Singleton exported as `show`.

### Writable stores (all are preferences or runtime flags)

#### Graph mode

- `w_t_graph: writable<T_Graph>` — current graph mode; initialized from preferences (`def(P.graph)`). Values: `T_Graph.radial`, `T_Graph.tree`
- `w_t_auto_adjust_graph: writable<T_Auto_Adjust_Graph | null>` — auto-adjust behavior for graph layout; from preferences

#### Tree configuration

- `w_t_trees: writable<Array<T_Kinship>>` — which tree types are shown (e.g., children, parents); from preferences

#### Count dot configuration

- `w_t_countDots: writable<Array<T_Kinship>>` — which kinship types show count dots; from preferences
- `w_show_countsAs: writable<T_Counts_Shown>` — how counts are displayed; from preferences

#### Details panel

- `w_t_details: writable<Array<T_Detail>>` — which detail sections are active; from preferences
- `w_show_details: writable<boolean>` — master toggle for the details panel; from preferences; subscribes to `g.update_rect_ofGraphView()` and `g.layout()` after startup ready

#### Search

- `w_show_search_controls: writable<boolean>(false)` — whether the search controls are visible; not persisted (runtime only)

#### Related links

- `w_show_related: writable<boolean>` — whether related (cross-link) relationships are shown; from preferences

#### Database UI

- `w_show_other_databases: writable<boolean>` — whether to show other databases in the picker; from preferences
- `w_show_save_data_button: writable<boolean>(false)` — whether the save data button is visible
- `w_show_catalist_details: writable<boolean>(false)` — Catalist-specific details visibility

#### Directionals

- `w_t_directionals: writable<boolean[]>([false, true])` — directional arrow display flags (two-element array)

#### Popup

- `w_id_popupView: writable<string | null>()` — ID of the currently shown popup view, or null

#### Debug

- `debug_cursor: boolean = false` — enables cursor debugging (not a store)

### Computed getters

- `get inRadialMode(): boolean` → `get(show.w_t_graph) == T_Graph.radial`
- `get inTreeMode(): boolean` → `get(show.w_t_graph) == T_Graph.tree`
- `get children_dots(): boolean` → `isShowing_countDots_ofType(T_Kinship.children)`
- `get related_dots(): boolean` → `isShowing_countDots_ofType(T_Kinship.related)`
- `get parent_dots(): boolean` → `isShowing_countDots_ofType(T_Kinship.parents)`

`isShowing_countDots_ofType(t_counts): boolean` — checks if the string value of `T_Kinship[t_counts]` is in the `w_t_countDots` array.

### Methods

- `apply_queryStrings(queryStrings: URLSearchParams)` — reads `levels`, `hide`, `show` URL params; sets `g.w_depth_limit` from levels; toggles `w_show_details`, `w_show_related`, or tree types from the named flags
- `toggle_show_other_databases()` — flips `w_show_other_databases`, writes to preferences
- `restore_preferences()` — bulk-reads all preference keys and sets corresponding stores
- `reactivity_subscribe()` — subscribes `w_show_details`, `w_show_related`, `w_t_graph` to write preferences and call `g.layout()` on change

### Constructor

Subscribes to `core.w_t_startup`; once startup is `T_Startup.ready`, subscribes `w_show_details` to trigger graph rect update and layout.

---

## Data Flow Summary

```
User action
    │
    ▼
grab / grabOnly / grab_none / ungrab / becomeFocus
    │
    ▼
si_recents.push(S_Recent { focus, si_grabs, depth })
    │
    ▼
si_recents.w_item changes (derived: current S_Recent)
    │
    ├──► w_ancestry_focus  (derived: recent.focus ?? rootAncestry)
    │         │
    │         └──► w_ancestry_forDetails (derived: search > grabs > focus)
    │
    ├──► w_si_grabs        (derived: recent.si_grabs)
    ├──► w_grabs           (derived: rubberband ?? recent.si_grabs.items)
    └──► w_grabIndex       (derived: rubberband → last; else recent.si_grabs.index)

Rubberband drag (bypasses history):
    setGrabs_forRubberband(ancestries)
    │
    ▼
    w_rubberband_grabs.set(ancestries)
    │
    ├──► w_grabs overridden (rubberband takes priority)
    └──► w_grabIndex overridden (→ last index)
```
