# Managers & Files — Design Spec

Source files: `ws/src/lib/ts/files/` and `ws/src/lib/ts/managers/`

---

## Files.ts

Singleton exported as `files`. Handles file I/O for import/export, file preview, and directory handle persistence.

### Format preference

```ts
format_preference: T_File_Extension = T_File_Extension.json;
```

Determines which parser `fetch_fromFile` dispatches to. Supported values: `T_File_Extension.seriously`, `T_File_Extension.json`, `T_File_Extension.csv`. `.seriously` and `.json` both route to the JSON parser — they are treated identically.

### Write

**`persist_json_object_toFile(object, fileName)`**
Serializes `object` via `tu.stringify_object`, creates a Blob with type `application/json`, creates an `<a>` element, sets `href` to an object URL, triggers a `.click()` download, then revokes the URL. No return value.

### Read

**`fetch_fromFile(file: File): Promise<any>`**
Dispatches based on `format_preference`:
- `.seriously` / `.json` → `extract_json_object_fromFile` (reads text, calls `JSON.parse`)
- `.csv` → `extract_csv_records_fromFile`

**`extract_json_object_fromFile` (private)**
Uses `FileReader.readAsText`, rejects on empty result or parse error, resolves with parsed object.

**`extract_csv_records_fromFile` (private)**
Uses `FileReader.readAsText`. Handles quoted fields by replacing in-quote commas with `$$$$$$`, splits on newline, extracts header row, maps remaining rows to `Record<string, string>` objects. Returns array of row-records.

### Preview

**Writables:**
- `w_preview_filename: Writable<string>` — filename of the currently previewed file
- `w_preview_content: Writable<string | null>` — text or data-URL content
- `w_preview_type: Writable<T_Preview_Type>` — `'text'`, `'image'`, or `null`

**`preview_type_forFilename(filename)`**
Checks extension against `T_Image_Extension` and `T_Text_Extension` enums. Returns `'image'`, `'text'`, or `null`.

**`show_previewOf_file(fileId: string): Promise<boolean>`**
Only works when `h.db` is a `DB_Filesystem`. Fetches file info via `h.db.get_file_information(fileId)`. If not a directory and has a previewable type:
- image: reads via `h.db.readFileAsDataURL(fileId)`, sets `w_preview_content`
- text: reads via `h.db.readFileAsText(fileId)`, sets `w_preview_content`

Sets `w_preview_type`, `w_preview_filename`, and opens popup via `show.w_id_popupView.set(T_Control.preview)`.

### Directory handle persistence

Uses IndexedDB (`DB_NAME = 'webseriously-files'`, `STORE_NAME = 'directory-handles'`, `HANDLE_KEY = 'last-folder'`) to survive page reloads.

**`save_directoryHandle(handle)`** — writes handle to IDB under `HANDLE_KEY`.

**`restore_directoryHandle()`** — reads handle from IDB, calls `handle.requestPermission({ mode: 'read' })`. Returns `null` if permission not granted.

**`clear_directoryHandle()`** — deletes the stored handle from IDB.

---

## Docs.ts

Auto-generated stub. The comment says: "Run `bash shared/tools/create-docs-db-data.sh` to regenerate."

### Interface

```ts
interface DocNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  link?: string;
  children?: DocNode[];
}
```

### Export

**`getDocsStructure(): DocNode[]`** — currently returns `[]`. Intended to provide the documentation file tree for a DB_Docs database type. The shell script populates this at build/codegen time.

No class, no singleton — purely exported types and a factory function.

---

## Pivot.ts

Singleton exported as `pivot`. Transforms flat Airtable-style dictionaries (CSV or JSON records) into the app's internal graph model (Things, Traits, Tags, Relationships).

### Purpose

Pivot is the adapter for cross-database data: it takes records from an external source (Airtable export format) and creates in-memory runtime objects. It is not a general cross-DB linker — it is specifically shaped around Airtable's field names.

### Data shape it reads

Each dict represents one record with fields including:
- `Type` — `'bookmark'` or other
- `Title` — display name
- `Link` — URL (for bookmarks)
- `Description` — text content
- `parent 1 link` — title of parent Thing (used to build Relationships)
- `Custom Tags`, `Custom Tags (Local)`, `All Local Tags (folder names)` — tag strings, comma-separated

### Methods

**`extract_fromDict(dict: Dictionary)`**
Creates a Thing for each dict record. Uses `Identifiable.newID()` for IDs. Sets `t_thing` to `T_Thing.bookmark` or `T_Thing.generic` based on `dict['Type']`. Calls `h.thing_remember_runtimeCreate`. Calls `create_trait_forThingfromDict` and `create_tags_forThing_fromDict`. If title is `'TEAM LIBRARY'` or `'MEMBER LIBRARY'`, immediately creates a parent Relationship to `h.root`.

**`create_trait_forThingfromDict(thing_id, dict)`**
Creates a `Trait` via `h.trait_remember_runtimeCreate`. For bookmarks, uses `T_Trait.link` and `dict['Link']`. For others, uses `T_Trait.text` and `dict['Description']`. Stores the full dict on `trait.dict` for later relationship creation.

**`create_tags_forThing_fromDict(thingID, dict)`**
Reads three tag keys: `'Custom Tags'`, `'Custom Tags (Local)'`, `'All Local Tags (folder names)'`. Delegates each to `create_tag_forThing_andKey_fromDict`.

**`create_tag_forThing_andKey_fromDict(thingID, tag_types)`**
Splits the value on `k.comma`, calls `h.tag_remember_runtimeCreateUnique_forType` for each tag type.

**`create_relationships_fromAllTraits()` (async)**
Main post-processing step. Iterates all traits, reads `trait.dict['parent 1 link']`, looks up the parent Thing by title via `h.things_forTitle`. If not found, falls back to `h.lost_and_found()`. Creates a Relationship via `h.relationship_remember_runtimeCreateUnique`. Clears `trait.dict` after processing (to free memory). Then calls `assure_small_families()` in a loop until stable.

**`assure_small_families()` (private)**
Traverses the ancestry tree from `h.rootAncestry`. For any node with more than `max_children = 35` children, creates chunk Things (named `parentTitle.1`, `parentTitle.2`, ...) and re-parents children into chunks. Re-runs until no changes. Returns `true` if any change was made.

**`shrink_dict(dict)` (deprecated)**
Removes keys: `Type`, `Link`, `Description`, `parent 1 link`, `data types import`. Not currently called — `trait.dict = {}` is used instead.

**`cleanup_lost_and_found()` (async, not currently used)**
Organizes lost-and-found children into `'leaves'` (no grandchildren) and `'crowds'` (has grandchildren) sub-nodes.

### T_Pivot_Fields enum

Maps Airtable field names (encoded as property names) to integer ordinals. Fields include: `Title`, `parent_1_link`, `Custom_Tags_$$Local$`, `Societal_Sectors`, `Wheel_of_Co$$$Creation_Sectors`, `Data_Subtypes`, `Main_Data_Type`, `Link`, `data_types_import`, `name`, `All_Local_Tags_$$folder_names$`, `Description`, `Parent_2_tags`, `parent_2_link` through `Parent_Link_5`, `Parent_6_Tags`, `Source_Created_Date`, `Domain`, `Custom_Tags`, `Privacy_Field_of_record`, `Type`, `Ignore_for_Sync`, `Ready_to_Sync`, `Last_Synced`, `User_Curators`.

---

## Configuration.ts

Class `Configuration`, singleton exported as `c`. Entry point for app startup sequence.

### Fields

```ts
queryStrings = new URLSearchParams(window.location.search);
w_device_isMobile = writable<boolean>(false);
erase_recents = false;
erase_preferences = false;
erasePreferences = 0;    // appears to be a leftover; erase_preferences is what's used
eraseDB = 0;             // countdown: each subsystem that checks it decrements by 1
```

### `configure()`

Strict order matters — comments in the source say "DO NOT CHANGE THE ORDER OF THESE CALLS":

1. `debug.apply_queryStrings(q)`
2. `colors.restore_preferences()`
3. `search.setup_defaults()`
4. `this.apply_queryStrings(q)` — must run before prefs and db
5. `features.apply_queryStrings(q)`
6. `g.restore_preferences()`
7. `databases.apply_queryStrings(q)`
8. `show.restore_preferences()` — must run before prefs
9. `radial.restore_radial_preferences()`
10. `p.restore_preferences()`
11. `show.apply_queryStrings(q)`
12. `e.setup()`

### `apply_queryStrings(queryStrings)`

Reads `?erase=` query param, splits on comma. Recognized options:
- `'data'` → sets `eraseDB = 4`
- `'recents'` → sets `c.erase_recents = true`
- `'settings'` → sets `c.erase_preferences = true`

### Computed properties

**`device_isMobile`** — uses `MobileDetect` library on `window.navigator.userAgent`. Returns boolean.

**`isServerLocal`** — checks hostname against `localhost`, `127.0.0.1`, `0.0.0.0`.

**`siteTitle`** — builds title string: `"Seriously (local|remote, <t_database>, <idBase>, <browserType>, α)"`.

**`browserType`** — detects `T_Browser`: `explorer`, `chrome`, `firefox`, `opera`, `orion`, `safari`, `unknown` via regex on `navigator.userAgent`.

---

## Core.ts

Class `Core`, singleton exported as `core`. Minimal — holds only two app-wide writables that other managers subscribe to.

### Fields

```ts
w_t_startup = writable<T_Startup>(T_Startup.start);
w_hierarchy = writable<Hierarchy>();
```

**`w_t_startup`** — startup state machine. `T_Startup.start` is initial value. Other managers (Search, Radial, Preferences) subscribe to this and wait for `T_Startup.ready` before performing their startup work.

**`w_hierarchy`** — holds the current `Hierarchy` instance. Used to signal that a new hierarchy is available.

No methods. No other state. Acts as the app's startup signal bus.

---

## Geometry.ts (`g`)

Class `Geometry`, singleton exported as `g`. Manages all spatial state for the graph view: tree depth, scale, view rect, user pan offset, layout dispatch, breadcrumbs layout.

Note: the prompt referenced this as "Core.ts" containing `g` — the actual `g` singleton lives in `Geometry.ts`, not `Core.ts`. `Core.ts` only holds `core`.

### Tree state

```ts
w_depth_limit         = writable<number>(3);
w_branches_areChildren = writable<boolean>(true);
```

`w_depth_limit` — how many levels of the tree to display. Persisted under `T_Preference.levels`. Overridable via `?levels=N` query string.

`w_branches_areChildren` — whether branches show children (`true`) or parents (`false`). Drives `Preferences.focus_key` and `expanded_key`.

### Graph view spatial state

```ts
w_user_graph_center = writable<Point>();
w_user_graph_offset = writable<Point>();
w_rect_ofGraphView  = writable<Rect>();
w_scale_factor      = writable<number>(1);
```

`w_rect_ofGraphView` — the bounding rectangle of the graph canvas (origin below controls, right of details panel).

`w_user_graph_offset` — pan offset applied by the user. Persisted under `T_Preference.user_offset`.

`w_user_graph_center` — computed as `rect_ofGraphView.center + w_user_graph_offset`. Used as the reference point for radial distance calculations.

`w_scale_factor` — display scale. `set_scale_factor()` is currently fully commented out (zoom is disabled).

### Preferences restore

**`restore_preferences()`**
- Reads `T_Preference.levels` → `w_depth_limit`
- Calls `update_rect_ofGraphView()`
- Calls `set_scale_factor(T_Preference.scale ?? 1)` — currently a no-op
- Calls `renormalize_user_graph_offset()` — reads `T_Preference.user_offset`
- Sets `--css-body-width` CSS variable from `windowSize.width`

### Layout methods

**`grand_build()`** — calls `signals.signal_rebuildGraph_fromFocus()`. Full rebuild.

**`grand_sweep()`** — calls `layout()` then `grand_build()`. Used when graph type changes.

**`layout()`** — dispatches to `g_graph_radial.layout()` or `g_graph_tree.layout()` based on `show.inRadialMode`. Then calls `signals.signal_reposition_widgets_fromFocus()`. Schedules `hits.recalibrate()` after 100ms.

**`grand_adjust_toFit()`** — computes best scale factor to fit all widgets into the graph view. Updates `w_user_graph_center`, `w_user_graph_offset`, calls `set_scale_factor` and `layout()`.

### Graph view rect

**`update_rect_ofGraphView()`**
Recomputes the graph view rect based on:
- Whether secondary controls are below primary (tree mode + search or tree graph)
- Width of details panel when visible (`k.width.details`)
- Window size minus separator thickness

Sets `w_rect_ofGraphView` and updates `w_user_graph_center`. Schedules `hits.recalibrate()`.

### User pan offset

**`set_user_graph_offsetTo(user_offset: Point)`** — updates `w_user_graph_offset` and `w_user_graph_center`. Persists to `T_Preference.user_offset` if change > 1px. Schedules `hits.recalibrate()`.

**`renormalize_user_graph_offset()`** — restores persisted offset.

**`persisted_user_offset`** — reads `T_Preference.user_offset` from prefs, constructs `Point`.

### Mouse/vector helpers

**`mouse_vector_ofOffset_fromGraphCenter(offset?)`** — computes vector from `w_user_graph_center` to scaled mouse location.

**`vector_fromScaled_mouseLocation_andOffset_fromGraphCenter(mouse_location, offset?)`** — lower-level version of the above.

**`mouse_distance_fromGraphCenter`** — magnitude of above vector.

**`mouse_angle_fromGraphCenter`** — angle of above vector.

**`ancestry_isCentered(ancestry)`** — checks if `ancestry.center_ofTitle` is within 1px of `w_user_graph_center + w_user_graph_offset`.

**`ancestry_place_atCenter(ancestry)`** — sets `w_user_graph_offset` so the ancestry title is centered.

### Window / scale

```ts
get windowSize(): Size   // inner size / scale_factor
get inner_windowSize(): Size  // window.innerWidth / innerHeight
get windowScroll(): Point
```

**`scaled_rect_forElement(element)`** — gets element rect via `Rect.rect_forElement`, divides by `w_scale_factor`.

### Controls / breadcrumbs geometry

```ts
get glows_banner_height(): number  // 32 on mobile, 20 on desktop
get controls_boxHeight(): number   // glows_banner_height + k.height.segmented
get breadcrumbs_top(): number      // windowSize.height - controls_boxHeight
```

**`layout_breadcrumbs(ancestries, centered, left, thresholdWidth)`** — computes which breadcrumbs fit within `thresholdWidth`, their individual widths, and left offsets. Returns `[crumb_ancestries, widths, lefts, parent_widths]`. `parent_widths` is an encoded integer (each width packed as two decimal digits) used to trigger reactive redraws.

---

## Components.ts

Class `Components`, singleton exported as `components`. Registry for `S_Component` instances, keyed by `T_Hit_Target` type and ancestry HID (hash ID).

### Internal storage

```ts
private components_dict_byType_andHID: Dictionary<Dictionary<S_Component>> = {};
```

Two-level dict: outer key is `T_Hit_Target` type string, inner key is `hid` (integer hash of ancestry ID).

### Lookup / create

**`component_forAncestry_andType(ancestry, type)`** — looks up existing `S_Component`. Returns `null` if not found.

**`component_forAncestry_andType_createUnique(ancestry, type)`** — looks up, creates if absent via `new S_Component(ancestry, type)`, registers, returns.

**`dummy`** — lazy singleton `S_Component` with `null` ancestry and `T_Hit_Target.none`. Used as a safe fallback.

### Registration (private)

**`component_register(s_component)`** — inserts into `components_dict_byType_andHID[type][hid]`. Only registers if both `hid` and `type` are non-null.

### What Components does NOT do

- No deregistration method exists
- No signal emission on register
- No direct Svelte store writables

Components is purely a lookup table for `S_Component` objects that manage state outside Svelte's reactive system (noted in comments: "state managed outside svelte").

---

## Elements.ts

Class `Elements`, singleton exported as `elements`. Registry for all UX element state objects: `S_Element` (hover/focus/general), `S_Widget`, `S_Mouse`, and `S_Element` instances for controls.

### Internal storage

```ts
private s_element_dict_byType_andID: Dictionary<Dictionary<S_Element>> = {};
private s_widget_dict_byAncestryID: Dictionary<S_Widget> = {};
private s_control_dict_byType: Dictionary<S_Element> = {};
private s_element_dict_byName: Dictionary<S_Element> = {};
private s_mouse_dict_byName: Dictionary<S_Mouse> = {};
mouse_responder_number = 0;
s_focus!: S_Element;
```

### Name format

**`name_from(identifiable, type, subtype)`** — returns `"${type}(${subtype}) (id '${identifiable.id}')"`. This is the key into `s_element_dict_byName`.

### Mouse responder numbering

**`next_mouse_responder_number`** — increments `mouse_responder_number` and returns the new value. Used to assign unique mouse handler IDs.

### Lookup / create

**`s_mouse_forName(name)`** — returns existing `S_Mouse` or creates `S_Mouse.empty()`. Keyed in `s_mouse_dict_byName`.

**`s_element_forName_andType(name, type, subtype)`** — looks up by name in the per-type dict (`s_element_dict_byType_andID[type]`). Creates via `s_element_for` if absent.

**`s_control_forType(t_control)`** — creates or returns an `S_Element` for a named control type. Sets hover color to `'white'` for `T_Control.details`, `colors.default` for others. Sets cursor to `'pointer'`.

**`s_element_for(identifiable, type, subtype)`** — creates or returns `S_Element` keyed by name. Inserts into `s_element_dict_byName`.

**`s_widget_forAncestry(ancestry)`** — creates or returns `S_Widget` keyed by `ancestry.id` in `s_widget_dict_byAncestryID`.

**`assure_forKey_inDict<T>(key, dict, closure)`** — generic create-if-absent. Used by all the above methods.

### Focus management

**`s_element_set_focus_to(s_element, on?)`**
- If `on = false`: blurs element, sets `isFocus = false`.
- If `on = true`: iterates all elements in `s_element_dict_byName`, blurs and clears focus on all except the target, then focuses target, sets `this.s_focus = s_element`, sets `s_element.isFocus = true`.

**`element_set_focus_to(html_element, on?)`** — finds the `S_Element` whose `html_element` matches, delegates to `s_element_set_focus_to`.

**`s_focus`** — direct reference to the currently focused `S_Element`.

---

## Features.ts

Class `Features`, singleton exported as `features`. Flat bag of feature flags, all set at startup.

### Flags

| Field | Default | Description |
|---|---|---|
| `theme` | `T_Theme.standalone` | Active theme |
| `has_zoom_controls` | `false` | Hidden — not implemented |
| `has_details_button` | `true` | Show details panel button |
| `has_every_detail` | `true` | Show all detail rows |
| `has_rubber_band` | `true` | Rubberband selection enabled |
| `allow_graph_editing` | `true` | Allow graph structure edits |
| `allow_title_editing` | `true` | Allow title edits |
| `allow_h_scrolling` | `true` | Allow horizontal scrolling |
| `allow_tree_mode` | `true` | Allow switching to tree mode |
| `allow_autoSave` | `true` | Auto-save enabled |
| `allow_search` | `true` | Search enabled |

### `apply_queryStrings(queryStrings)`

Reads `?disable=` (comma-separated) and `?theme=` (comma-separated) from URL.

**disable options:**
- `'editGraph'` → `allow_graph_editing = false`
- `'editTitles'` → `allow_title_editing = false`
- `'details'` → `has_details_button = false`
- `'horizontalScrolling'` → `allow_h_scrolling = false`
- `'tree_mode'` → `allow_tree_mode = false`
- `'auto_save'` → `allow_autoSave = false`
- `'search'` → `allow_search = false`

**theme options:**

- `'bubble'` — sets `theme = T_Theme.bubble`, sets `show.w_show_countsAs` to `T_Counts_Shown.numbers`, and disables: `allow_graph_editing`, `allow_title_editing`, `allow_h_scrolling`, `allow_autoSave`, `has_rubber_band`, `has_every_detail`, `has_details_button`.

No persistence — all flags are derived fresh from query strings at each page load.

---

## Styles.ts

Class `Styles`, singleton exported as `styles`. Pure color/style computation — no state. Takes `S_Snapshot` (component state) and returns CSS strings.

### `get_widgetColors_for(ss, thing_color, background_color)`

Returns `{ color, background_color, border }` for a widget (title + dot area).

Logic (priority order):
1. `ss.isEditing` → background = `background_color`, border = dashed `thing_color`, color = black if light else `thing_color`
2. `ss.isGrabbed` → color = white, background = `thing_color`; if also hovering and not mouse down → dashed faint border
3. `ss.isFocus && !ss.isHovering` → color = `thing_color`, background = `background_color`, solid `thing_color` border
4. `ss.isHovering` → background = faint blend, border from `border_for(t_hover_target, thing_color)`
5. hover target is `T_Hit_Target.drag` and ancestry matches → medium border
6. else → transparent

### `get_dotColors_for(ss, element_color, thing_color, background_color, hoverColor)`

Returns `{ fill, stroke, svg_outline_color }` for the dot SVG.

`color_isInverted = (ss.isInverted ?? false) !== ss.isHovering` (XOR).

- Inverted → fill = `hoverColor`, stroke = `background_color`
- Not inverted → fill = `background_color`, stroke = `element_color`

Outline:
- Not grabbed, not editing → `thing_color`
- Grabbed, not editing → `background_color`
- Editing → black if light else `hoverColor`

### `get_buttonColors_for(ss, element_color, background_color, hoverColor, disabledTextColor, border_thickness, has_widget_context?, thing_color?)`

Returns `{ fill, stroke, border }` for buttons.

Fill:
- `ss.isDisabled` → transparent
- `ss.isSelected` → lightblue
- `color_isInverted` → `hoverColor`
- else → `background_color`

Stroke:
- `ss.isDisabled` → `disabledTextColor`
- `color_isInverted` → `background_color`
- else → `element_color`

Border: if `has_widget_context && thing_color != ''`:
- editing → dashed `thing_color`
- focus + radial mode → solid `thing_color`
- else → `border_style`

### Helper methods

**`background_for(t_hover_target, background_color)`** — returns `'transparent'` for `T_Hit_Target.reveal`, else `background_color`.

**`border_for(t_hover_target, thing_color)`** — returns `'solid <color> 1px'`. Color depends on target:
- `T_Hit_Target.title` → `thing_color`
- `T_Hit_Target.reveal` → transparent
- `T_Hit_Target.drag` → no-opacity blend
- default → light-opacity blend

---

## Preferences.ts

Class `Preferences`, singleton exported as `p`. All user preferences stored in and retrieved from `localStorage`. Keys are namespaced by database type.

### Preference keys (T_Preference enum, inferred from spec_dict_byType)

| Key | Enum value | Default | Type |
|---|---|---|---|
| `auto_adjust` | `T_Preference.auto_adjust` | `null` | `T_Auto_Adjust_Graph \| null` |
| `show_countsAs` | `T_Preference.show_countsAs` | `T_Counts_Shown.numbers` | `T_Counts_Shown` |
| `tree` | `T_Preference.tree` | `T_Kinship.children` | `T_Kinship` |
| `graph` | `T_Preference.graph` | `T_Graph.tree` | `T_Graph` |
| `countDots` | `T_Preference.countDots` | `[]` | array |
| `show_details` | `T_Preference.show_details` | `false` | boolean |
| `show_related` | `T_Preference.show_related` | `false` | boolean |
| `other_databases` | `T_Preference.other_databases` | `false` | boolean |
| `thing` | `T_Preference.thing` | `'default'` | string |
| `font` | `T_Preference.font` | `'Times New Roman'` | string |
| `detail_types` | `T_Preference.detail_types` | `[T_Detail.actions, T_Detail.data]` | array |
| `levels` | `T_Preference.levels` | 12 (from restore) | number |
| `scale` | `T_Preference.scale` | 1 (from restore) | number |
| `user_offset` | `T_Preference.user_offset` | `{x:0, y:0}` (from restore) | Point |
| `ring_angle` | `T_Preference.ring_angle` | 0 (from restore) | number |
| `ring_radius` | `T_Preference.ring_radius` | `k.radius.ring_minimum` (from restore) | number |
| `recents` | `T_Preference.recents` | — | serialized S_Items |
| `paging` | `T_Preference.paging` | — | dict of G_Pages |
| `search_text` | `T_Preference.search_text` | — | string |
| `expanded_children` | `T_Preference.expanded_children` | — | Ancestry paths |
| `expanded_parents` | `T_Preference.expanded_parents` | — | Ancestry paths |
| `focus_forChildren` | `T_Preference.focus_forChildren` | — | Ancestry path |
| `focus_forParents` | `T_Preference.focus_forParents` | — | Ancestry path |

### Key namespacing

**`db_keyFor(key)`** — prefixes key with `databases.db_now.t_database` using `k.separator.generic`: `"${t_database}${separator}${key}"`. Returns `null` if no DB type available.

**`keyPair_for(key, sub_key)`** — combines two keys: `"${key}${separator}${sub_key}"`.

### Read/write

**`get_forKey(key)`** — reads from `localStorage[key]`, calls `parse()`.

**`write_key<T>(key, value)`** — stringifies via `u.stringify_object`, checks size < 3MB, writes to `localStorage[key]`.

**`readDB_key(key)`** — calls `db_keyFor` then `get_forKey`.

**`writeDB_key<T>(key, value)`** — calls `db_keyFor` then `write_key`.

**`read_key(key: T_Preference)`** — reads from localStorage, validates against enum if spec has `enum_type`, falls back to `spec.defaultValue` (and persists the default).

**`writeDB_keyPairs_forKey(key, sub_key, value)`** — two-level keyed storage: stores value under `db_keyFor(key) + separator + sub_key`, and maintains an index array of sub-keys under `db_keyFor(key)`.

**`readDB_keyPairs_forKey(key)`** — reads the sub-key index, then fetches each value. Returns array.

**`parse(key)`** — returns `null` if undefined/`'undefined'`, else `JSON.parse(key)`.

### Dynamic key selection

```ts
get focus_key(): string   // T_Preference.focus_forChildren or focus_forParents
get expanded_key(): string // T_Preference.expanded_children or expanded_parents
```

Both branch on `get(g.w_branches_areChildren)`.

### restore_preferences()

Called on startup (after `c.erase_preferences` check). Restores:
- `show.w_t_auto_adjust_graph` ← `T_Preference.auto_adjust`
- `show.w_show_countsAs` ← `T_Preference.show_countsAs`
- `x.w_thing_title` ← `T_Preference.thing`
- `x.w_thing_fontFamily` ← `T_Preference.font`

Then calls `reactivity_subscribe()`.

### restore_expanded()

Checks `c.eraseDB` (decrements if > 0, resets `x.si_expanded`). Otherwise reads paths from `readDB_key(expanded_key)` (falls back to `'expanded'` for backwards compat), converts to `Ancestry` objects, sets `x.si_expanded.items`. Subscribes to `x.si_expanded.w_items` to write back on change (after 100ms delay).

### restore_recents()

Serialize format: `{ focus: pathString, grabs: string[], grabIndex: number, depth: number }`. Reads up to 10 recent items from `T_Preference.recents`. Deserializes path strings back to `Ancestry` objects. Falls back to root ancestry if empty. Subscribes to `x.si_recents.w_items` to write back (after 100ms, max 10 items).

### restore_paging()

Reads `T_Preference.paging` dict, passes to `radial.createAll_thing_pages_fromDict`.

### reset_preferences()

Nulls out all `T_Preference` keys except `'local'`.

### reset_recents()

Replaces `x.si_recents` with a single entry containing current focus, grabs, and depth.

### reactivity_subscribe()

Subscribes to stores and writes back to localStorage on change:
- `show.w_t_trees` → `T_Preference.tree`
- `show.w_t_countDots` → `T_Preference.countDots`
- `show.w_t_details` → `T_Preference.detail_types`
- `show.w_t_auto_adjust_graph` → `T_Preference.auto_adjust`
- `show.w_show_countsAs` → `T_Preference.show_countsAs`
- `g.w_depth_limit` → `T_Preference.levels`

Also calls `show.reactivity_subscribe()`.

### Ancestry serialization helpers

**`ancestries_writeDB_key(ancestries, key)`** — maps to `pathString` array, writes under DB-namespaced key.

**`ancestries_readDB_key(key)`** — reads path strings, resolves each via `h.ancestry_isAssured_valid_forPath`, returns `Ancestry[]`.

---

## Details.ts

Class `Details`, singleton exported as `details`. Model for the details panel — tracks which detail banners are visible and what they show.

### State

```ts
s_banner_hideables_dict_byType: Dictionary<S_Banner_Hideable> = {};
t_storage_need = T_Storage_Need.direction;
show_properties = false;
```

On construction, creates one `S_Banner_Hideable` per `T_Detail` value and stores it in `s_banner_hideables_dict_byType`.

### Ancestry for details

The "ancestry for details" is actually computed in `UX.ts` (`x.w_ancestry_forDetails`, `x.ancestry_forDetails`), not in `Details.ts`. Priority order:
1. Search-selected ancestry (if search active and result selected)
2. Current grab
3. Current focus

### Detail types (T_Detail)

Based on usage: `T_Detail.actions`, `T_Detail.data`, `T_Detail.tags`, `T_Detail.traits`, `T_Detail.selection`.

### Methods

**`details_toggle_visibility()`** — flips `show.w_show_details`.

**`redraw()`** — currently a stub (two commented-out lines). Called to force details re-render.

**`select_next(banner_id, selected_title)`**
Navigates within a banner. `selected_title` is compared against `T_Direction.next`.
- `T_Detail.traits` → `x.select_next_thingTrait(next)`
- `T_Detail.tags` → `x.select_next_thing_tag(next)`
- `T_Detail.selection` → `x.grab_next_ancestry(next)`

**`banner_title_forDetail(t_detail, passedGrabs?, passedGrabIndex?)`**
Computes the display title for a detail section header.

- `T_Detail.tags` → uses `si_items.title('tag', 'tags', title)` — count-aware label
- `T_Detail.traits` → uses `si_items.title('trait', 'traits', title)`
- `T_Detail.selection` → complex logic:
  - Search active with multiple results → `si_found.title('search result', 'focus', title)` (e.g. "3 of 7 search results")
  - Multiple grabs → `grabIndex.of_n_for_type(grabs.length, 'selected', '')` (e.g. "1 of 3 selected")
  - Single grab → `'selection'`
  - No grabs → `'focus'`
- Other → `T_Detail[t_detail]` (raw enum name)

`si_items` for tags and traits comes from `s_banner_hideables_dict_byType[t_detail].si_items`.

---

## Controls.ts

Class `Controls`, singleton exported as `controls`. Handles high-level user actions from the control bar.

### Help

**`open_tabFor(url)`** — `window.open(url, 'help-webseriously')?.focus()` — opens in a named tab.

**`showHelp_home()`** — opens `k.help_url.local` or `k.help_url.remote` depending on `c.isServerLocal`.

**`showHelp_for(t_action, column)`** — builds URL from `e.help_page_forActionAt(t_action, column)`, opens in help tab.

### Popup

**`togglePopupID(id: T_Control)`** — if `show.w_id_popupView` currently equals `id`, sets to `null`; else sets to `id`. Toggle pattern.

### Alteration

**`toggle_alteration(ancestry, t_alteration, predicate)`** — if `x.w_s_alteration` is currently set, clears it (`null`). Otherwise creates a new `S_Alteration(ancestry, t_alteration, predicate)` and sets it.

### Segmented controls

**`handle_segmented_choices(segmented_name, choices)`** — dispatches on `segmented_name`:
- `'search'` → `search.w_t_search_preferences.set(choices[0] as T_Search_Preference)`
- `'tree'` → `g_graph_tree.set_tree_types(choices as Array<T_Kinship>)`
- `'graph'` → `show.w_t_graph.set(choices[0] as T_Graph)`

### Graph type toggle

**`toggle_graph_type()`** — switches `show.w_t_graph` between `T_Graph.tree` and `T_Graph.radial`. Calls `g.grand_sweep()` after.

---

## Search.ts

Class `Search`, singleton exported as `search`. Full-text search over all Things. Uses a suffix-tree index (`Search_Node`).

### State

```ts
use_AND_logic: boolean = false;         // multi-word: AND vs OR
search_words: string[] = [];            // current query split into words
search_text: string | null = null;      // raw current query (lowercased)
private root_node: Search_Node;         // suffix-tree index root

w_search_results_found   = writable<number>(0);
w_search_results_changed = writable<number>(0);   // timestamp, triggers re-render
w_t_search               = writable<T_Search>();
w_t_search_preferences   = writable<T_Search_Preference>();
```

### T_Search states

- `T_Search.off` — search inactive
- `T_Search.enter` — search open, no query or no results
- `T_Search.results` — results found, none selected
- `T_Search.selected` — a result row is selected

### Setup

Constructor sets a 1ms timeout, then:
1. Calls `this.setup()`
2. Subscribes to `databases.w_t_database` to re-call `setup()` on DB switch

**`setup()`** — subscribes to `core.w_t_startup`. When `T_Startup.ready`:
- Reads `T_Preference.search_text` from `p.readDB_key`
- Calls `buildIndex(h.things)`
- Triggers `w_search_results_changed`

**`setup_defaults()`** — sets `w_t_search = T_Search.off`, `w_t_search_preferences = T_Search_Preference.title`.

### Index

**`buildIndex(things: Thing[])`** — rebuilds `root_node` from scratch. For each Thing: lowercases `thing.title`, splits on space. For each word, inserts all suffixes via `root_node.insert_wordFor(suffix, thing)`. This is a suffix-tree approach enabling substring matching.

### Activation

**`activate()`** — sets `show.w_show_search_controls = true`, calls `search_for(this.search_text)`.

**`deactivate()`** — resets `w_search_results_found = 0`, sets `w_t_search = T_Search.off`, hides search controls, calls `details.redraw()`.

### Search execution

**`search_for(query)`** — main entry point. Lowercases and trims query.
- Empty query: resets `x.si_found`, sets count to 0, state to `T_Search.enter`.
- Non-empty: splits into `search_words`, runs `root_node.search_for(search_words, use_AND_logic)`, stores in `x.si_found.items`, updates `w_search_results_found` and `w_t_search`. Resets `x.si_found.index = -1` if results changed.
- Always updates `w_search_results_changed` to `Date.now()`.

**`update_search()`** — rebuilds index then calls `update_search_for`.

**`update_search_for(query)`** — lighter version: does not rebuild index, just re-runs query.

### Result navigation

**`selected_row` (get/set)** — `x.si_found.index`. Setting also moves `w_t_search` to `T_Search.selected`.

**`selected_ancestry`** — returns `x.si_found.items[selected_row]?.ancestry` if search controls are showing.

**`next_row(up)`** — increments/decrements `selected_row` with wraparound via `row.increment(up, count)`.

**`deactivate_focus_and_grab()`** — makes `selected_ancestry` the focus and grab, then deactivates search.

### Results fingerprint (private)

**`results_fingerprint`** — joins all result Thing IDs with `'|'`. Used to detect whether results actually changed (to decide whether to reset row index).

---

## Radial.ts

Class `Radial`, singleton exported as `radial`. Manages all state for radial graph mode: rotation, ring resize, paging, zone detection, and mouse drag handling.

### State

```ts
s_paging_dict_byName: Dictionary<S_Rotation> = {};
g_pages_dict_byThingID: Dictionary<G_Pages> = {};
cursor = k.cursor_default;
zone = T_Radial_Zone.miss;
s_resizing!: S_Resizing;
s_rotation!: S_Rotation;
s_paging!: S_Rotation;
last_action = 0;

w_rotate_angle  = writable<number>(0);
w_g_paging      = writable<G_Paging>();
w_g_cluster     = writable<G_Cluster | null>(null);
w_resize_radius = writable<number>(k.radius.ring_minimum);
```

`s_resizing` — state for the resize interaction (dragging the inner circle).
`s_rotation` — state for the rotate interaction (dragging the ring arc).
`s_paging` — default paging state (not cluster-specific).
`s_paging_dict_byName` — one `S_Rotation` per named cluster (for per-cluster paging).
`g_pages_dict_byThingID` — paging geometry (`G_Pages`) keyed by Thing ID.
`last_action` — timestamp of last action, used for rate-limiting (500ms resize, 75ms rotate).

### Computed

```ts
get ring_radius(): number       // get(w_resize_radius)
get isDragging(): boolean       // any of s_resizing, s_rotation, s_pagings has isDragging true
get s_pagings(): S_Rotation[]   // all values of s_paging_dict_byName
get s_hit_targets(): S_Rotation[] // [s_resizing, s_rotation, ...s_pagings]
```

### Constructor

Subscribes to `core.w_t_startup`. When `T_Startup.ready`, subscribes to `x.w_ancestry_focus` and calls `reset()` on focus change.

### Ring zone detection

**`T_Radial_Zone`** values: `miss`, `resize`, `rotate`, `paging`.

**`ring_zone_atVector_relativeToGraphCenter(mouse_vector)`**
Zone is determined by distance from graph center (`mouse_vector.magnitude`):
- `< inner` (`ring_radius`) → `T_Radial_Zone.resize`
- `< inner + k.thickness.radial.arc` AND inside cluster thumb → `T_Radial_Zone.paging`
- `<= inner + k.thickness.radial.ring` → `T_Radial_Zone.rotate`
- else → `miss`

**`ring_zone_atMouseLocation`** — delegates via `g.mouse_vector_ofOffset_fromGraphCenter()`.

**`ring_zone_atScaled(scaled: Point)`** — delegates via `g.vector_fromScaled_mouseLocation_andOffset_fromGraphCenter(scaled)`.

**`cursor_forRingZone`** — returns cursor string based on `ring_zone_atMouseLocation` (resize, rotate, paging cursors come from their respective `s_*` state objects).

### Mouse drag handling

**`handle_mouse_drag()`**
Rate-limited, priority-ordered:

1. **Resize** (checked first — takes priority when both resize and rotate are dragging):
   - Computes `magnitude = mouse_vector.magnitude - resize.basis_radius`
   - Clamps between `k.radius.ring_minimum` and `ring_minimum * 3`
   - Rate limit: 500ms and >1px change
   - Updates `w_resize_radius`, calls `g.layout()`

2. **Rotate** (only if resize not dragging):
   - Rate limit: 75ms, no signals in flight
   - Sets `w_rotate_angle` to `mouse_angle - rotate.basis_angle` (normalized)
   - Calls `g.layout()`

3. **Paging** (cluster drag):
   - Computes `delta_angle = active_angle - mouse_angle` (normalized around zero)
   - Calls `g_cluster.adjust_paging_index_byAdding_angle(delta_angle)`
   - If index changed, calls `g.layout()`

During any drag: calls `window.getSelection()?.removeAllRanges()` to prevent text selection.

### Paging

**`s_paging_forName_ofCluster(name)`** — creates or returns an `S_Rotation` for a named cluster, sets `cluster_name` and `id`. Uses `elements.assure_forKey_inDict`.

**`g_pages_forThingID(id)`** — creates or returns `G_Pages` for a Thing ID.

**`createAll_thing_pages_fromDict(dict)`** — called by `p.restore_paging()`. Iterates dict values, calls `G_Pages.create_fromDict` for each, stores in `g_pages_dict_byThingID`.

### Reset

**`reset()`** — initializes `s_paging`, `s_resizing`, `s_rotation` if not yet set. Calls `.reset()` on each. Resets all named pagings. Sets `cursor` to default, `w_g_cluster` to null, `last_action` to 0.

### Fill colors

**`update_fill_colors()`** — calls `update_fill_color()` on `s_paging`, `s_rotation`, `s_resizing`. Triggered by hover changes via `hits.w_s_hover` subscription (set up in `restore_radial_preferences`).

### Preference persistence

**`restore_radial_preferences()`** — called from `c.configure()`:
- Restores `w_rotate_angle` from `T_Preference.ring_angle`
- Restores `w_resize_radius` from `T_Preference.ring_radius` (clamped to `ring_minimum`)
- On `T_Startup.ready`: subscribes to write back `ring_angle` and `ring_radius` on change
- Subscribes to `hits.w_s_hover` → `update_fill_colors()`
- Subscribes to `w_g_paging` → writes `T_Preference.paging` dict, triggers layout for paging changes

---

## UX.ts (`x`)

Class `S_UX`, singleton exported as `x`. Not listed in the original prompt but is the primary UX state object referenced throughout the managers above.

### Key state it holds

```ts
si_expanded  = new S_Items<Ancestry>([]);
si_recents   = new S_Items<S_Recent>([]);
si_found     = new S_Items<Thing>([]);

w_s_title_edit      = writable<S_Title_Edit | null>(null);
w_s_alteration      = writable<S_Alteration | null>();
w_rubberband_grabs  = writable<Ancestry[]>([]);
w_thing_title       = writable<string | null>();
w_order_changed_at  = writable<number>(0);
w_thing_fontFamily  = writable<string>();
```

**Derived stores (computed from `si_recents`):**
- `w_ancestry_focus` — current focus ancestry (from `si_recents.item.focus`)
- `w_grabs` — current grabs (from `si_recents.item.si_grabs.items`, with rubberband override)
- `w_grabIndex` — current grab index
- `w_si_grabs` — current `S_Items<Ancestry>` for grabs
- `w_ancestry_forDetails` — computed priority: search-selected → grab → focus

`si_found` is used by both `Search` (writes results) and `Details` (reads for banner title computation).
