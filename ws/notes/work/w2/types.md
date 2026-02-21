# Types, Enumerations, and Global Imports — Design Spec

Source files documented here:
- `ws/src/lib/ts/common/Global_Imports.ts`
- `ws/src/lib/ts/common/Enumerations.ts`
- `ws/src/lib/ts/types/Types.ts`
- `ws/src/lib/ts/types/Coordinates.ts`
- `ws/src/lib/ts/types/Angle.ts`
- `ws/src/lib/ts/types/Search_Node.ts`
- `ws/src/lib/ts/types/Seriously_Range.ts`
- `ws/src/lib/ts/managers/Styles.ts`

---

## Global_Imports.ts

**Pattern:** Single import point. Every file in the codebase imports from `'../common/Global_Imports'` (or the equivalent relative path) instead of from individual modules. This keeps import lines short and makes it trivial to move a class between files without hunting down every consumer.

### Singleton/manager instances

| Export | Type | Source module | What it is |
|--------|------|---------------|------------|
| `h` | `Hierarchy` instance | `managers/Hierarchy` | The graph data store. Owns all Things, Relationships, Predicates. Central namespace for graph data access. |
| `k` | constants object | `common/Constants` | All magic numbers and string constants — sizes, colors, opacity levels, empty string, etc. |
| `x` | `UX` instance | `managers/UX` | User experience state — current interaction mode, what is selected/focused, UI state. |
| `g` | `Geometry` instance | `managers/Geometry` | Geometry computations for layout — positions, sizes, radial math. |
| `u` | `Utilities` instance | `utilities/Utilities` | General-purpose utility methods (string, math, DOM helpers). |
| `e` | `Events` instance | `signals/Events` | Svelte writable stores for reactive state (w_mouse_button_down, w_ancestry_focus, etc.). |
| `c` | `Configuration` instance | `managers/Configuration` | App-level configuration (database URL, environment). |
| `p` | `Preferences` instance | `managers/Preferences` | User preferences read/write. Keyed by `T_Preference`. |
| `core` | `Core` instance | `managers/Core` | App startup and initialization orchestration. |
| `features` | `Features` instance | `managers/Features` | Feature flags. |
| `show` | `Visibility` instance | `managers/Visibility` | Derived booleans: `inRadialMode`, `inTreeMode`, what panels are visible. |
| `controls` | `Controls` instance | `managers/Controls` | Control bar state — which controls are active/disabled/visible. |
| `elements` | `Elements` instance | `managers/Elements` | DOM element registry — maps component IDs to HTMLElements. |
| `hits` | `Hits` instance | `managers/Hits` | Hit-target tracking. Owns `w_s_hover` store; resolves what the mouse is over. |
| `signals` | `Signals` instance | `signals/Signals` | Signal dispatch and subscription system. |
| `colors` | `Colors` instance | `utilities/Colors` | Color utilities — luminance, blending, theme colors. |
| `search` | `Search` instance | `managers/Search` | Search index and query execution. |
| `details` | `Details` instance | `managers/Details` | Details panel state — which detail types are shown. |
| `radial` | `Radial` instance | `managers/Radial` | Radial graph layout computations. |
| `databases` | `Databases` instance | `database/Databases` | Database connection and selection. |
| `svgPaths` | `SVG_Paths` instance | `utilities/SVG_Paths` | SVG path string builders for shapes. |
| `components` | `Components` instance | `managers/Components` | Svelte component registry. |
| `debug` | `Debug` instance | `debug/Debug` | Debug logging, conditional output. |
| `print` | `Print` instance | `utilities/Print` | Formatted console output. |
| `busy` | `S_Busy` instance | `state/S_Busy` | Async busy state tracking. |
| `files` | `Files` instance | `files/Files` | File import/export operations. |
| `builds` | `Builds` instance | `common/Builds` | Build notes and version info. |
| `g_graph_tree` | `G_TreeGraph` instance | `geometry/G_TreeGraph` | Singleton geometry object for the tree graph layout. |
| `g_graph_radial` | `G_RadialGraph` instance | `geometry/G_RadialGraph` | Singleton geometry object for the radial graph layout. |

### Classes (value types, persistables, runtime)

| Export | Source module | What it is |
|--------|---------------|------------|
| `Point` | `types/Coordinates` | 2D point (x, y). |
| `Size` | `types/Coordinates` | 2D size (width, height). |
| `Rect` | `types/Coordinates` | Rectangle (origin Point + Size). |
| `Angle` | `types/Angle` | Angle wrapper with quadrant/orientation helpers. |
| `Direction` | `types/Angle` | Enum of cardinal directions as angle values. |
| `Seriously_Range` | `types/Seriously_Range` | Text selection range (start, end). |
| `Thing` | `persistable/Thing` | Core graph node — has title, type, color, traits. |
| `Trait` | `persistable/Trait` | Named typed attribute attached to a Thing. |
| `Tag` | `persistable/Tag` | Tag attached to a Thing. |
| `Predicate` | `persistable/Predicate` | Typed edge label (contains, appreciates, etc.). |
| `Relationship` | `persistable/Relationship` | Directed edge between two Things via a Predicate. |
| `Persistable` | `persistable/Persistable` | Base class for all persisted objects. |
| `User` | `persistable/User` | User identity record. |
| `Access` | `persistable/Access` | Access control record. |
| `Ancestry` | `runtime/Ancestry` | Runtime path from root to a Thing; represents a unique node position in the graph. |
| `Hierarchy` | `managers/Hierarchy` | The manager class (exported alongside the `h` singleton). |
| `Debug` | `debug/Debug` | The Debug class (exported alongside the `debug` singleton). |
| `ErrorTrace` | `debug/ErrorTrace` | Structured error with stack trace. |
| `Mouse_Timer` | `signals/Mouse_Timer` | Timer for distinguishing click types (long press, double click). |

### State classes (S_*)

| Export | What it is |
|--------|------------|
| `S_Rotation` | State for a rotation interaction in progress. |
| `S_Resizing` | State for a resize interaction in progress. |
| `S_Component` | State snapshot for a Svelte component. |
| `S_Hit_Target` | Describes what the mouse is currently over (type + ancestry). |
| `S_Alteration` | Describes a pending add or delete alteration. |
| `S_Title_Edit` | State for an in-progress title edit. |
| `S_Items` | Generic ordered collection of items (wraps an array with selection support). |
| `S_Mouse` | Mouse event state snapshot (position, button state, target). |
| `S_Widget` | State for a widget (grabbed, focused, hovering, etc.). |
| `S_Element` | State for a DOM element's layout position/size. |
| `S_Snapshot` | Frozen state snapshot used for color/style computations. |

### Geometry classes (G_*)

| Export | What it is |
|--------|------------|
| `G_Cluster` | Geometry for a cluster of child widgets in radial layout. |
| `G_RadialGraph` | Geometry for the full radial graph. |
| `G_Cluster_Pager` | Geometry for paging through cluster children. |
| `G_Widget` | Geometry for a single widget's position and size. |
| `G_TreeLine` | Geometry for a tree connector line. |
| `G_TreeBranches` | Geometry for all branches of a tree node. |
| `G_Repeater` | Geometry for a repeating layout element. |

### Third-party re-exports

| Export | Package | What it is |
|--------|---------|------------|
| `interact` | `interactjs` | Drag/resize interaction library. |
| `transparentize` | `color2k` | Color utility — reduce alpha of a color string. |

### Enum types (T_* exported from Enumerations and other modules)

All `T_*` enums are documented in the Enumerations section below. They are all re-exported from Global_Imports, making this the single place to import them.

Additional enums imported from non-Enumerations modules:

| Export | Source |
|--------|--------|
| `T_Quadrant` | `types/Angle` |
| `T_Orientation` | `types/Angle` |
| `T_Edit` | `state/S_Title_Edit` |
| `T_Timer` | `signals/Mouse_Timer` |
| `T_Debug` | `debug/Debug` |

---

## Enumerations.ts

All enums defined here use string values (except `T_Layer`, `T_Mouse_Detection`, `T_Order`, `T_Startup`, `T_Search`, `T_Detail`, `T_Action` which use implicit integer values starting at 0). The file comment says the order of the first group matters; the rest do not.

### T_Order
Integer enum. Order of children in a relationship.

| Member | Value | Meaning |
|--------|-------|---------|
| `child` | 0 | The child ordering. |
| `other` | 1 | Other/alternative ordering. |

### T_Startup
Integer enum. App initialization phase.

| Member | Value | Meaning |
|--------|-------|---------|
| `start` | 0 | Starting up. |
| `fetch` | 1 | Fetching data from persistence. |
| `empty` | 2 | Data fetched, database is empty. |
| `ready` | 3 | Ready to use. |

### T_Search
Integer enum. State of the search UI.

| Member | Value | Meaning |
|--------|-------|---------|
| `off` | 0 | Search not active. |
| `enter` | 1 | User is typing a search query. |
| `results` | 2 | Results are being shown. |
| `selected` | 3 | User has selected a result. |

### T_Detail
Integer enum. Which panel is shown in the details view.

| Member | Value | Meaning |
|--------|-------|---------|
| `header` | 0 | Header section. |
| `actions` | 1 | Action buttons section. |
| `selection` | 2 | Selection info section. |
| `tags` | 3 | Tags section. |
| `traits` | 4 | Traits section. |
| `preferences` | 5 | Preferences section. |
| `data` | 6 | Raw data section. |

### T_Action
Integer enum. Actions available in the details panel.

| Member | Value | Meaning |
|--------|-------|---------|
| `browse` | 0 | Browse to a thing. |
| `focus` | 1 | Focus on a thing. |
| `show` | 2 | Show/reveal a thing. |
| `center` | 3 | Center graph on a thing. |
| `add` | 4 | Add a child. |
| `delete` | 5 | Delete the thing. |
| `move` | 6 | Move the thing. |

### T_Layer
Integer enum. Z-index layer ordering. Lower value = further back. Used to assign CSS z-index classes to components.

| Member | Value | Meaning |
|--------|-------|---------|
| `common` | 0 | Base layer, shared elements. |
| `graph` | 1 | Graph background. |
| `paging` | 2 | Paging controls. |
| `ring` | 3 | Radial ring. |
| `necklace` | 4 | Necklace layout layer. |
| `line` | 5 | Connector lines. |
| `widget` | 6 | Widget bodies. |
| `dot` | 7 | Reveal dots. |
| `text` | 8 | Text labels. |
| `details` | 9 | Details panel. |
| `stackable` | 10 | Elements that stack. |
| `action` | 11 | Action buttons. |
| `hideable` | 12 | Elements that can be hidden. |
| `rubberband` | 13 | Rubberband selection rectangle. |
| `frontmost` | 14 | Always on top. |

### T_Graph
String enum. Which graph layout is active.

| Member | Value | Meaning |
|--------|-------|---------|
| `radial` | `'radial'` | Radial (hub-and-spoke) graph. |
| `tree` | `'tree'` | Tree (hierarchical) graph. |

### T_Direction
String enum. Paging direction.

| Member | Value | Meaning |
|--------|-------|---------|
| `previous` | `'<'` | Go to previous page. |
| `next` | `'>'` | Go to next page. |

### T_Alteration
String enum. Type of data alteration.

| Member | Value | Meaning |
|--------|-------|---------|
| `delete` | `'delete'` | Deleting a node or relationship. |
| `add` | `'add'` | Adding a node or relationship. |

### T_File_Operation
String enum. Direction of a file operation.

| Member | Value | Meaning |
|--------|-------|---------|
| `import` | `'import'` | Import/persist data from a file. |
| `export` | `'export'` | Export/fetch data to a file. |

### T_Theme
String enum. Visual theme.

| Member | Value | Meaning |
|--------|-------|---------|
| `standalone` | `'standalone'` | Full-page standalone app. |
| `bubble` | `'bubble'` | Embedded bubble widget mode. |

### T_Counts_Shown
String enum. How child counts are rendered on widgets.

| Member | Value | Meaning |
|--------|-------|---------|
| `numbers` | `'numbers'` | Show numeric count label. |
| `hidden` | `'hidden'` | Hide counts entirely. |
| `dots` | `'dots'` | Show count as dots. |

### T_Auto_Adjust_Graph
String enum. Graph auto-adjustment behavior.

| Member | Value | Meaning |
|--------|-------|---------|
| `selection` | `'center the selection'` | Pan to center the selected thing. |
| `fit` | `'exactly fit'` | Scale to fit all nodes. |
| `ignore` | `'ignore'` | Do not auto-adjust. |

### T_Button_SVG
String enum. Shape of a button's SVG indicator.

| Member | Value | Meaning |
|--------|-------|---------|
| `triangle` | `'triangle'` | Triangle shape. |
| `arrow` | `'arrow'` | Arrow shape. |
| `none` | `'none'` | No SVG indicator. |

### T_Search_Preference
String enum. Which field to search in.

| Member | Value | Meaning |
|--------|-------|---------|
| `title` | `'title'` | Search thing titles. |
| `trait` | `'trait'` | Search trait values. |
| `tags` | `'tags'` | Search tags. |

### T_Widget
String enum. Widget variant.

| Member | Value | Meaning |
|--------|-------|---------|
| `radial` | `'radial'` | Widget in radial graph. |
| `focus` | `'focus'` | Focus/hub widget. |
| `tree` | `'tree'` | Widget in tree graph. |

### T_Tree_Line
String enum. Shape of a tree connector line.

| Member | Value | Meaning |
|--------|-------|---------|
| `flat` | `'flat'` | Horizontal flat line. |
| `down` | `'down'` | Line going down. |
| `up` | `'up'` | Line going up. |

### T_Create
String enum. How a persistable object is being created.

| Member | Value | Meaning |
|--------|-------|---------|
| `isFromPersistent` | `'isFrom'` | Reconstructed from stored data. |
| `getPersistentID` | `'getID'` | Creating new, requesting a persistent ID. |
| `none` | `''` | No special creation context. |

### T_Storage_Need
String enum. What aspect of storage needs attention.

| Member | Value | Meaning |
|--------|-------|---------|
| `direction` | `'direction'` | Storage direction (read/write). |
| `format` | `'format'` | Data format. |
| `busy` | `'busy'` | Busy/in-progress state. |

### T_Persistence
String enum. Where data is persisted.

| Member | Value | Meaning |
|--------|-------|---------|
| `remote` | `'remote'` | Remote/cloud database. |
| `local` | `'local'` | Local storage. |
| `none` | `'none'` | No persistence. |

### T_Kinship
String enum. Direction of a relationship viewed from a Thing.

| Member | Value | Meaning |
|--------|-------|---------|
| `children` | `'children'` | Things this thing contains/parents. |
| `related` | `'related'` | Things related laterally. |
| `parents` | `'parents'` | Things that contain this thing. |

### T_Drag
String enum. Current drag interaction type.

| Member | Value | Meaning |
|--------|-------|---------|
| `rubberband` | `'rubberband'` | Rubber-band selection rectangle drag. |
| `widget` | `'widget'` | Drag-and-drop of a widget node. |
| `graph` | `'graph'` | Repositioning the entire graph. |
| `none` | `'none'` | No drag in progress. |

### T_Radial_Zone
String enum. Which interaction zone of a radial widget was hit.

| Member | Value | Meaning |
|--------|-------|---------|
| `resize` | `'resize'` | Resize handle zone. |
| `paging` | `'paging'` | Paging control zone. |
| `rotate` | `'rotate'` | Rotation handle zone. |
| `miss` | `'miss'` | No zone hit. |

### T_Oblong
String enum. Which part of an oblong (pill-shaped) widget.

| Member | Value | Meaning |
|--------|-------|---------|
| `middle` | `'middle'` | Middle section. |
| `right` | `'right'` | Right cap. |
| `left` | `'left'` | Left cap. |
| `full` | `'full'` | Full width (no caps split). |

### T_Mouse_Detection
Integer enum (explicit values). Type of mouse event detected.

| Member | Value | Meaning |
|--------|-------|---------|
| `none` | 0 | No special detection. |
| `double` | 1 | Double click. |
| `long` | 2 | Long press. |
| `doubleLong` | 3 | Double long press. |
| `autorepeat` | 4 | Auto-repeat (held). |

### T_Request
String enum. Request types components can handle via the signal system.

| Member | Value | Meaning |
|--------|-------|---------|
| `handle_s_mouse` | `'handle_s_mouse'` | Process a mouse state snapshot. |
| `is_disabled` | `'is_disabled'` | Query whether element is disabled. |
| `is_inverted` | `'is_inverted'` | Query whether element colors are inverted. |
| `is_visible` | `'is_visible'` | Query whether element is visible. |
| `is_hit` | `'is_hit'` | Query whether element is hit. |
| `name` | `'name'` | Query element name. |

### T_Signal
String enum. Signal types dispatched through the signal system.

| Member | Value | Meaning |
|--------|-------|---------|
| `alteration` | `'alteration'` | Data was added or deleted. |
| `reposition` | `'reposition'` | Widget position changed (widgets only). |
| `reattach` | `'reattach'` | Widget re-attached to a new DOM parent. |
| `rebuild` | `'rebuild'` | Graph needs a full rebuild. |
| `thing` | `'thing'` | A thing's data changed. |

### T_Persistable
String enum. Which collection a persistable belongs to (maps to database collection names).

| Member | Value | Meaning |
|--------|-------|---------|
| `relationships` | `'Relationships'` | Relationship records. |
| `predicates` | `'Predicates'` | Predicate records. |
| `things` | `'Things'` | Thing records. |
| `traits` | `'Traits'` | Trait records. |
| `access` | `'Access'` | Access control records. |
| `users` | `'Users'` | User records. |
| `tags` | `'Tags'` | Tag records. |

### T_Predicate
String enum. Semantic type of a relationship edge.

| Member | Value | Meaning |
|--------|-------|---------|
| `appreciates` | `'appreciates'` | Appreciation relationship. |
| `explainedBy` | `'explainedBy'` | Explanation relationship. |
| `supportedBy` | `'supportedBy'` | Support/evidence relationship. |
| `alliedWith` | `'alliedWith'` | Alliance relationship (Steve Melville's term). |
| `isRelated` | `'isRelated'` | Generic relation. |
| `contains` | `'contains'` | Containment/hierarchy (the primary tree edge). |
| `isTagged` | `'isTagged'` | Tag association. |
| `requires` | `'requires'` | Dependency relationship. |

### T_Control
String enum. Which control button in the control bar.

| Member | Value | Meaning |
|--------|-------|---------|
| `details` | `'show details view'` | Toggle details panel. |
| `builds` | `'show build notes'` | Show build notes. |
| `preview` | `'preview'` | Preview mode. |
| `recents` | `'recents'` | Show recents list. |
| `import` | `'import'` | Import data. |
| `search` | `'search'` | Open search. |
| `shrink` | `'shrink'` | Shrink graph. |
| `grow` | `'grow'` | Grow graph. |
| `help` | `'?'` | Help. |

### T_Browser
String enum. Detected browser.

| Member | Value | Meaning |
|--------|-------|---------|
| `explorer` | `'explorer'` | Internet Explorer. |
| `unknown` | `'unknown'` | Unknown browser. |
| `firefox` | `'firefox'` | Firefox. |
| `chrome` | `'chrome'` | Chrome. |
| `safari` | `'safari'` | Safari. |
| `opera` | `'opera'` | Opera. |
| `orion` | `'orion'` | Orion (WebKit browser). |

### T_File_Extension
String enum. Recognized file container formats.

| Member | Value | Meaning |
|--------|-------|---------|
| `seriously` | `'seriously'` | Native app format. |
| `cancel` | `'cancel'` | User cancelled file dialog. |
| `json` | `'json'` | JSON format. |
| `csv` | `'csv'` | CSV format. |

### T_Image_Extension
String enum. Image file extensions.

| Member | Value |
|--------|-------|
| `jpeg` | `'jpeg'` |
| `webp` | `'webp'` |
| `jpg` | `'jpg'` |
| `gif` | `'gif'` |
| `png` | `'png'` |
| `svg` | `'svg'` |

### T_Text_Extension
String enum. Text/code file extensions.

| Member | Value |
|--------|-------|
| `svelte` | `'svelte'` |
| `html` | `'html'` |
| `json` | `'json'` |
| `css` | `'css'` |
| `csv` | `'csv'` |
| `txt` | `'txt'` |
| `js` | `'js'` |
| `md` | `'md'` |
| `sh` | `'sh'` |
| `ts` | `'ts'` |

### T_Thing
String enum. The kind/type of a Thing node.

| Member | Value | Meaning |
|--------|-------|---------|
| `organization` | `'o'` | Organization. |
| `externals` | `'^'` | List of bulk Things. |
| `bookmark` | `'b'` | URL bookmark. |
| `generic` | `'-'` | Generic/untyped. |
| `person` | `'p'` | Person. |
| `folder` | `'f'` | Folder/container. |
| `found` | `'?'` | Search result placeholder. |
| `root` | `'!'` | Root node. |
| `bulk` | `'~'` | Bulk data node. |
| `meme` | `'*'` | Meme/idea. |

### T_Trait
String enum. The kind/type of a Trait.

| Member | Value | Meaning |
|--------|-------|---------|
| `consequence` | `'consequence'` | Consequence note. |
| `location` | `'location'` | Geographic or spatial location. |
| `citation` | `'citation'` | Citation/reference. |
| `comment` | `'comment'` | Comment/note. |
| `money` | `'money'` | Monetary value. |
| `phone` | `'phone'` | Phone number. |
| `quest` | `'quest'` | Quest/goal. |
| `text` | `'text'` | Plain text trait. |
| `date` | `'date'` | Date value. |
| `link` | `'link'` | URL link. |
| `note` | `'note'` | Extended note. |
| `sum` | `'sum'` | Computed sum. |

### T_Hit_Target
String enum. What the mouse cursor is over.

| Member | Value | Meaning |
|--------|-------|---------|
| `breadcrumbs` | `'breadcrumbs'` | Breadcrumb trail. |
| `rubberband` | `'rubberband'` | Rubber-band selection area. |
| `database` | `'database'` | Database selector. |
| `resizing` | `'resizing'` | Resize handle. |
| `rotation` | `'rotation'` | Rotation handle. |
| `details` | `'details'` | Details panel. |
| `control` | `'control'` | Control bar button. |
| `action` | `'action'` | Action button. |
| `button` | `'button'` | Generic button. |
| `cancel` | `'cancel'` | Cancel button. |
| `paging` | `'paging'` | Paging control. |
| `reveal` | `'reveal'` | Reveal dot. |
| `search` | `'search'` | Search input. |
| `widget` | `'widget'` | Widget body. |
| `title` | `'title'` | Widget title text. |
| `trait` | `'trait'` | Trait row. |
| `drag` | `'drag'` | Drag handle. |
| `glow` | `'glow'` | Glow/selection halo. |
| `line` | `'line'` | Connector line. |
| `none` | `'none'` | Nothing. |
| `tag` | `'tag'` | Tag element. |

### T_Preference
String enum. All preference keys used with the Preferences manager.

| Member | Value | Meaning |
|--------|-------|---------|
| `expanded_children` | `'expanded_children'` | Which children nodes are expanded. |
| `focus_forChildren` | `'focus_forChildren'` | Focus setting for children. |
| `expanded_parents` | `'expanded_parents'` | Which parent nodes are expanded. |
| `focus_forParents` | `'focus_forParents'` | Focus setting for parents. |
| `other_databases` | `'other_databases'` | List of other databases. |
| `cluster_sliders` | `'cluster_sliders'` | Cluster slider positions. |
| `show_countsAs` | `'show_countsAs'` | How to show child counts (`T_Counts_Shown`). |
| `relationships` | `'relationships'` | Which relationships are visible. |
| `detail_types` | `'detail_types'` | Which detail types show in the vertical stack. |
| `show_details` | `'show_details'` | Whether the left-side details panel is shown. |
| `show_related` | `'show_related'` | Whether related things are shown. |
| `ring_radius` | `'ring_radius'` | Radial ring radius. |
| `user_offset` | `'user_offset'` | User-set graph offset. |
| `auto_adjust` | `'auto_adjust'` | Auto-adjust graph behavior (`T_Auto_Adjust_Graph`). |
| `search_text` | `'search_text'` | Last search text. |
| `background` | `'background'` | Background color. |
| `ring_angle` | `'ring_angle'` | Ring rotation angle. |
| `auto_save` | `'auto_save'` | Auto-save on/off. |
| `countDots` | `'countDots'` | Dot count display. |
| `font_size` | `'font_size'` | Font size. |
| `separator` | `'separator'` | Separator character. |
| `base_id` | `'base_id'` | Base ID for the current database. |
| `details` | `'details'` | Visible details control. |
| `recents` | `'recents'` | Recents list. |
| `bubble` | `'bubble'` | Bubble mode setting. |
| `levels` | `'levels'` | Tree depth levels. |
| `paging` | `'paging'` | Paging state. |
| `search` | `'search'` | Search state. |
| `traits` | `'traits'` | Traits visibility. |
| `graph` | `'graph'` | Graph type (`T_Graph`). |
| `scale` | `'scale'` | Graph scale factor. |
| `local` | `'local'` | Local storage flag. |
| `thing` | `'thing'` | Currently focused thing ID. |
| `font` | `'font'` | Font family. |
| `tree` | `'tree'` | Tree layout setting. |
| `db` | `'db'` | Active database ID. |

---

## Types.ts

Type aliases and interfaces for use across the codebase.

### Primitive aliases

| Type | Definition | Meaning |
|------|------------|---------|
| `Dictionary<T>` | `Record<string, T>` | String-keyed object map. Default `T = any`. |
| `Integer` | `number & { __brand: 'integer' }` | Branded integer type (nominal typing). Not enforced at runtime. |
| `T_Preview_Type` | `'image' \| 'text' \| null` | What kind of preview is shown in the preview panel. |

### Callback/handler types

| Type | Signature | Meaning |
|------|-----------|---------|
| `Handle_Result<T, U>` | `(result: T) => U` | Generic result handler. Defaults: `T = Object`, `U = void`. |
| `Handle_S_Mouse` | `Handle_Result<S_Mouse, boolean>` | Handler that receives a mouse state snapshot and returns a boolean (was the event handled?). |
| `Async_Handle_Boolean` | `(flag: boolean) => Promise<void>` | Async handler that receives a boolean flag. |
| `Signal_Handler` | `(t_signal: T_Signal, value: any \| null) => any` | Signal subscription callback. |
| `Create_S_Mouse` | `(event: MouseEvent \| null, element: HTMLElement) => S_Mouse` | Factory for creating mouse state snapshots. |
| `Signal_Signature` | `(t_signal: T_Signal, priority: number, value: any) => void` | Signature for dispatching a signal with priority. |

### Structured types

#### `SignalConnection_atPriority`
Tracks a signal subscription alongside its priority.

```ts
{
  t_signal: T_Signal,   // which signal this connection is for
  priority: number,     // dispatch priority (lower fires first)
  connection: SignalConnection | null  // the typed-signals connection handle
}
```

#### `S_Recent`
State snapshot for "recent" navigation history.

```ts
{
  si_grabs: S_Items<Ancestry>;  // the set of grabbed/selected ancestries
  focus: Ancestry;              // the currently focused ancestry
  depth: number;                // tree depth at time of snapshot
}
```

---

## Coordinates.ts

Three geometry classes: `Polar`, `Point`, `Size`, `Rect`. All methods return new instances (immutable style). Coordinate system: browser convention — y increases downward. The `angle` getter on Point reverses y to match math convention (angles increase counter-clockwise).

### `Polar`

Polar coordinate (radius + angle in radians).

**Fields:**
- `r: number` — radius
- `phi: number` — angle in radians

**Constructor:** `new Polar(r, phi)`

**Getters:**
- `asPoint: Point` — convert to Cartesian via `Point.fromPolar`

### `Point`

2D Cartesian coordinate.

**Fields:** `x: number`, `y: number`

**Constructor:** `new Point(x = 0, y = 0)`

**Static constructors:**
- `Point.zero` — `(0, 0)`
- `Point.x(x)` — `(x, 0)`
- `Point.y(y)` — `(0, y)`
- `Point.square(length)` — `(length, length)`
- `Point.fromPolar(r, phi)` — from polar coordinates
- `Point.fromDOMRect(rect)` — `(rect.left, rect.top)`
- `Point.origin_inWindowCoordinates_for(element)` — walks offsetParent chain to get element's window-space origin

**Getters (computed properties):**
- `magnitude: number` — Euclidean length `sqrt(x²+y²)`
- `angle: number` — angle in radians, 0 = right, increases counter-clockwise (y is negated for browser)
- `isZero: boolean` — both components are zero
- `verbose: string` — `"(x.xx, y.yy)"`
- `description: string` — `"x.xx y.yy"`
- `pixelVerbose: string` — `"x.xxpx y.yypx"`
- `asBBox: BBox` — rbush bounding box with all four coords set to this point
- `asPolar: Polar` — convert to polar
- `asSize: Size` — reinterpret as Size (can be negative)
- `negated: Point` — `(-x, -y)`
- `doubled: Point` — `(2x, 2y)`
- `negatedInHalf: Point` — `(-x/2, -y/2)`
- `dividedInHalf: Point` — `(x/2, y/2)`
- `swap: Point` — `(y, x)`
- `negateY: Point` — `(x, -y)`
- `negateX: Point` — `(-x, y)`
- `abs: Point` — `(|x|, |y|)`
- `quadrant_ofPoint: T_Quadrant` — which screen quadrant (upperRight/upperLeft/lowerLeft/lowerRight) based on sign of x and y
- `orientation_ofVector: T_Orientation` — which of 4 cardinal directions this vector most points toward

**Instance methods:**
- `offsetByX(x): Point` — translate x only
- `offsetByY(y): Point` — translate y only
- `offsetEquallyBy(offset): Point` — translate both by same amount
- `offsetByXY(x, y): Point` — translate by x and y
- `offsetBy(point): Point` — translate by another Point
- `spreadByXY(x, y): Point` — scale x by x, y by y (element-wise multiply)
- `multiply_xBy(m): Point` — scale x only
- `multiply_yBy(m): Point` — scale y only
- `multipliedEquallyBy(m): Point` — scale both by m
- `dividedEquallyBy(d): Point` — divide both by d
- `vector_to(point): Point` — vector from this to point (point - this)
- `equals(other): boolean` — component equality
- `rotate_by(angle): Point` — counter-clockwise rotation, y reversed for browser
- `isContainedBy_path(path): boolean` — hit test against an SVG path string using canvas

### `Size`

2D size (non-negative by convention, though not enforced).

**Fields:** `width: number`, `height: number`

**Constructor:** `new Size(width = 0, height = 0)`

**Static constructors:**
- `Size.zero` — `(0, 0)`
- `Size.square(length)` — `(length, length)`
- `Size.width(w)` — `(w, 0)`
- `Size.height(h)` — `(0, h)`
- `Size.fromDOMRect(rect)` — `(rect.width, rect.height)`

**Getters:**
- `proportion: number` — `width / height`
- `isZero: boolean`
- `description: string` — `"w.ww h.hh"`
- `verbose: string` — `"(w.ww, h.hh)"`
- `pixelVerbose: string` — `"w.wwpx h.hhpx"`
- `center: Point` — `(width/2, height/2)`
- `asPoint: Point` — `(width, height)` — lower-right corner relative to origin
- `swap: Size` — `(height, width)`
- `negated: Size` — `(-width, -height)`
- `dividedInHalf: Size` — `(width/2, height/2)`

**Instance methods:**
- `extendedByX(delta): Size` — add to width
- `extendedByY(delta): Size` — add to height
- `extendedByXY(x, y): Size` — add x to width, y to height
- `extendedBy(delta: Point): Size` — add point components
- `reducedByX(delta): Size` — subtract from width
- `reducedByY(delta): Size` — subtract from height
- `reducedByXY(x, y): Size` — subtract x from width, y from height
- `reducedBy(shrinkage: Point): Size` — subtract point components
- `expandedEquallyBy(delta): Size` — add delta to both
- `insetEquallyBy(delta): Size` — subtract `2*delta` from both (standard inset)
- `multipliedEquallyBy(m): Size` — scale both
- `dividedEquallyBy(d): Size` — divide both
- `dividedBy(size): Size` — element-wise division
- `best_ratio_to(size): number` — `min(w/w, h/h)` — largest scale that fits this inside size
- `equals(other): boolean`

### `Rect`

Rectangle defined by origin (top-left) and size.

**Fields:** `origin: Point`, `size: Size`

**Constructor:** `new Rect(origin = Point.zero, size = Size.zero)`

**Static constructors:**
- `Rect.zero` — zero origin, zero size
- `Rect.createSizeRect(size)` — origin at zero
- `Rect.createWHRect(width, height)` — origin at zero
- `Rect.createExtentRect(origin, extent)` — from two corner points
- `Rect.createCenterRect(center, size)` — centered at point
- `Rect.createRightCenterRect(rightCenter, size)` — right-center aligned
- `Rect.createFromDOMRect(domRect)` — from DOMRect, adjusts for scroll
- `Rect.rect_forElement(element)` — from `getBoundingClientRect`
- `Rect.rect_forComponent(c)` — from Svelte component offset properties

**Getters:**
- `x: number` — `origin.x`
- `y: number` — `origin.y`
- `width: number` — `size.width`
- `height: number` — `size.height`
- `right: number` — `extent.x`
- `bottom: number` — `extent.y`
- `isZero: boolean`
- `verbose: string`
- `description: string`
- `pixelVerbose: string`
- `asBBox: BBox`
- `center: Point` — geometric center
- `extent: Point` — bottom-right corner (origin + size)
- `topRight: Point`
- `centerTop: Point`
- `bottomLeft: Point`
- `centerLeft: Point`
- `centerRight: Point`
- `centerBottom: Point`
- `dividedInHalf: Rect` — size multiplied by `-1/2` (note: negative)
- `atZero_forX: Rect` — x zeroed, y preserved
- `atZero_forY: Rect` — y zeroed, x preserved
- `atZero: Rect` — origin set to zero, size unchanged
- `normalized: Rect` — flips negative width/height to positive (mutates in place, returns self)

**Setters:** `x`, `y`, `width`, `height` — all write through to `origin` or `size`

**Instance methods:**
- `equals(other): boolean`
- `multipliedEquallyBy(m): Rect`
- `dividedEquallyBy(m): Rect`
- `centeredRect_ofSize(size): Rect` — a new rect of given size, centered in this rect
- `originMultipliedBy(ratio): Rect` — scale origin only
- `expand_sizeBy(ratio): Rect` — scale size only
- `expand_heightBy(height): Rect` — add to height
- `multiply_xBy(ratio): Rect` — scale origin.x only
- `multiply_yBy(ratio): Rect` — scale origin.y only
- `extend_widthBy(width): Rect` — add to width
- `offsetBy(delta: Point): Rect`
- `offsetByX(x): Rect`
- `offsetByY(y): Rect`
- `offsetByXY(x, y): Rect`
- `offsetEquallyBy(offset): Rect`
- `expandedBy(expansion: Point): Rect` — grows size by expansion on all sides (origin moves opposite direction)
- `contains(point): boolean` — inclusive bounds check
- `intersects(rect): boolean` — AABB intersection (handles zero-width/height as lines)
- `clippedTo(bounds): Rect` — intersection rect; zero-size if no overlap
- `corners_forAngle(angle): [Point, Point]` — two corners relevant for a given angle (used in line drawing)

---

## Angle.ts

### Enums defined in this file

#### `T_Quadrant`
Which quadrant an angle or point falls in. Counter-clockwise from 3 o'clock.

| Member | Value | Angle range |
|--------|-------|-------------|
| `upperRight` | `'ur'` | 0 to quarter (3 o'clock to 12 o'clock) |
| `upperLeft` | `'ul'` | quarter to half (12 o'clock to 9 o'clock) |
| `lowerLeft` | `'ll'` | half to three_quarters (9 o'clock to 6 o'clock) |
| `lowerRight` | `'lr'` | three_quarters to full (6 o'clock to 3 o'clock) |

#### `T_Orientation`
Cardinal direction label.

| Member | Value |
|--------|-------|
| `right` | `'right'` |
| `left` | `'left'` |
| `down` | `'down'` |
| `up` | `'up'` |

### `Angle` class

Wraps a radian angle value. Convention: 0 = 3 o'clock, increases counter-clockwise. Stored angle is not normalized (can be any float).

**Field:** `angle: number` — radians

**Constructor:** `new Angle(angle: number)`

**Static constants:**
- `Angle.zero = 0` — 3 o'clock
- `Angle.full = 2π` — full circle (normalizes to zero)
- `Angle.half = π` — 9 o'clock
- `Angle.quarter = π/2` — 12 o'clock (zenith)
- `Angle.three_quarters = 3π/2` — 6 o'clock (nadir)
- `Angle.eighth = 2π/8` — 45°
- `Angle.sixteenth = 2π/16` — 22.5° (supports octant splitting)

**Static methods:**
- `radians_from_degrees(degrees): number` — convert degrees to radians
- `angle_from_name(name): number | null` — `'up'`, `'down'`, `'left'`/`'<'`, `'right'`/`'>'` → angle in radians
- `orientation_from_name(name): T_Orientation | null` — same names → `T_Orientation`

**Getters:**
- `quadrant_ofAngle: T_Quadrant` — which of 4 quadrants (normalizes angle first)
- `orientation_ofAngle: T_Orientation` — which of 4 cardinal directions (splits each quadrant in half)
- `angle_points_down: boolean` — orientation is down
- `angle_points_right: boolean` — quadrant is lowerRight or upperRight
- `angle_points_up: boolean` — quadrant is upperLeft or upperRight
- `angle_slants_forward: boolean` — quadrant is lowerRight or upperLeft
- `quadrant_basis_angle: number` — the base angle for this quadrant (delegate to `tu.basis_angle_ofType_Quadrant`)
- `octant_ofAngle: number` — which of 8 octants (0–7)
- `cursor_forAngle: string` — CSS cursor string for resize handles (`'ns-resize'`, `'ew-resize'`, `'nesw-resize'`, `'nwse-resize'`)

### `Direction` enum

Cardinal directions expressed as radian angle values (using `Angle.*` constants). Exported from `Angle.ts`.

| Member | Value | Meaning |
|--------|-------|---------|
| `up` | `Angle.three_quarters` (= 3π/2) | Upward in browser space |
| `down` | `Angle.quarter` (= π/2) | Downward in browser space |
| `right` | `Angle.half` (= π) | Rightward |
| `left` | `Angle.zero` (= 0) | Leftward |

Note: `right` = π and `left` = 0 because the angle system begins at 3 o'clock (right) = 0, and rotates counter-clockwise, so π = 9 o'clock = left in display terms. The naming maps to visual direction on screen.

---

## Search_Node.ts

### `Search_Node` class

A trie node for prefix-based search. The trie root is also a `Search_Node`. Each node in the trie represents one character position. Paths from root spell out indexed words.

**Fields:**
- `nodes_map_byCharCode: Map<number, Search_Node>` — child nodes keyed by character code
- `items: Set<Thing>` — all Things whose indexed words pass through this node
- `isEndOfWord: boolean` — true if this node is the last character of a complete indexed word

**Getters:**
- `results: Array<Thing>` — `items` as an array, sorted by `thing.title` (locale-aware)

**Public methods:**
- `insert_wordFor(word: string, thing: Thing): void` — walk/create trie nodes for each character in word; add thing to every node's item set; mark final node as `isEndOfWord`
- `search_for(words: string[], use_AND_logic: boolean = false): Array<Thing>` — find Things matching the given words. Single word: direct lookup. Multiple words with AND: intersection of item sets. Multiple words with OR: union of item sets. Results sorted by title.

**Private methods:**
- `find_nodeFor(word: string): Search_Node | null` — walk trie from root following characters; return terminal node or null if prefix not found
- `apply_AND_logicTo(sets: Set<Thing>[]): Set<Thing>` — compute intersection of multiple Sets

---

## Seriously_Range.ts

### `Seriously_Range` class

A text selection range. Intentionally minimal — just start and end indices.

**Fields:**
- `start: number` — start index (inclusive)
- `end: number` — end index (exclusive, by convention)

**Constructor:** `new Seriously_Range(start, end)`

No methods. Used where a text cursor range needs to be passed or stored (e.g., restoring selection after a DOM update in title editing).

---

## Styles.ts (managers/Styles.ts)

### `Styles` class

Centralized color and style computation. All methods are pure functions over an `S_Snapshot` — they read state but do not mutate it. The `styles` singleton is exported at module level.

**Purpose:** Resolve what CSS color/border/fill values a component should render given its current interaction state. Avoids duplicating this logic across Svelte components.

**Dependencies used:**
- `S_Snapshot` — frozen state: `isEditing`, `isGrabbed`, `isFocus`, `isHovering`, `isInverted`, `isSelected`, `isDisabled`, `ancestry`
- `T_Hit_Target` — to branch on what the hovered target is
- `colors` — for luminance checks and blending
- `hits.w_s_hover` — Svelte store for current hover state
- `e.w_mouse_button_down` — Svelte store for mouse button state
- `k.opacity.*` — named opacity levels (medium, faint, light, none)
- `show.inRadialMode` — whether radial graph is active

**Methods:**

#### `get_widgetColors_for(ss, thing_color, background_color)`
Returns `{ color: string; background_color: string; border: string }`.

Priority order:
1. `isEditing` → dashed border, background fills
2. `isGrabbed` → white text, filled background
3. `isFocus && !isHovering` → solid border, background fills
4. `isHovering` → faint background, border from `border_for`
5. hover target is `drag` and matches ancestry → medium border
6. default → transparent

#### `get_dotColors_for(ss, element_color, thing_color, background_color, hoverColor)`
Returns `{ fill: string; stroke: string; svg_outline_color: string }`.

Computes fill/stroke for reveal dots. `color_isInverted = (ss.isInverted XOR ss.isHovering)`. Outline varies by grabbed/editing state.

#### `get_buttonColors_for(ss, element_color, background_color, hoverColor, disabledTextColor, border_thickness, has_widget_context?, thing_color?)`
Returns `{ fill: string; stroke: string; border: string }`.

Handles disabled, selected, inverted, and normal states. If `has_widget_context && thing_color` is set, border follows editing/focus state.

#### `background_for(t_hover_target, background_color): string`
Returns `'transparent'` if hover target is `reveal`, otherwise `background_color`.

#### `border_for(t_hover_target, thing_color): string`
Returns a CSS border string. Border color varies by hit target:
- `title` → `thing_color`
- `reveal` → transparent
- `drag` → blended with `k.opacity.none`
- default → blended with `k.opacity.light`

**Singleton export:** `export const styles = new Styles()`
