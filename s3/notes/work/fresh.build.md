# Fresh Build Plan

Option 3 + A + di CSS. Vertical slice first — something visible by phase 3, interactive by phase 4. ~21 sessions total.

Spec refs: see [index.md](./index.md) for the full design spec.

---

## Milestones

| Phase | Milestone |
|----|----|
| 3 | **First visible** — static tree renders from hardcoded data |
| 4 | **First interactive** — click to focus, expand/collapse, arrow keys |
| 6 | **First real data** — DB_Test loads via store; startup state machine |
| 7 | **Firebase** — real user data from cloud |
| 8 | **Full input** — rbush hit detection, all keyboard shortcuts |
| 9–10 | **Full UX** — details panel, controls, search |
| 11 | **Radial** — alternate graph mode |
| 12–14 | **Parity** — extra DBs, preferences, tests |

---

## Phase 1 — Scaffold + Types

1 session. New project. All vocabulary. Zero logic.

- [x] SvelteKit + Svelte 5 project (`w2/`), TypeScript, Vite, Vitest
- [x] Establish `src/lib/` layout: `store/`, `entities/`, `db/`, `nav/`, `geometry/`, `svelte/`
- [x] Drop dead deps: React, Framework7, Two.js, rxdb/rxjs, typed-signals
- [x] Keep: Firebase, Dexie, rbush
- [x] Port all `T_*` enums from `Enumerations.ts` — every member, names unchanged — spec: [types.md](./types.md)
- [x] `Coordinates.ts` — `Point`, `Size`, `Rect`, `Polar` with full API
- [x] `Angle.ts` — `Angle`, `Direction`, `T_Quadrant`
- [x] `Constants.ts` — all `k.*` constants (dot_size=14, row_height=16, font sizes, etc.)
- [x] `Extensions.ts` — String and Number prototype extensions
- [x] `yarn dev` → blank page

---

## Phase 2 — Store + Entities + Seed

1 session. The normalized store is simple: just `$state` Maps + mutations. Build it now, load hardcoded seed, prove data flows before touching UI.

Spec: [entities.md](./entities.md), [hierarchy.md](./hierarchy.md) §Entity Store

- [x] Lean entity classes — `Thing`, `Relationship`, `Predicate`, `Trait`, `Tag` as plain TS classes with data only (no navigation, no `h.*` calls)
- [x] Normalized store: one `$state(new Map<string, T>())` per entity type
- [x] Mutations per type: `remember(entity)`, `forget(hid)`, `forget_all()`
- [x] Derived indexes: `children_of(parentId)`, `parents_of(childId)` from relationships table
- [x] Hardcoded seed: ~15 Things + Relationships forming a small graph
- [x] `store.load_seed()` called at startup
- [x] Unit test: add thing → `children_of` updates → passes
- [x] No UI yet, `yarn test` green

---

## Phase 3 — UI Shell + Static Tree ✦ FIRST VISIBLE

1 session. Something on screen. Static render from seed, no clicks yet.

Spec: [rendering.md](./rendering.md) §main, §tree, §widget, [geometry.md](./geometry.md) §G_Widget

### UI shell

- [x] `SeriouslyApp.svelte` — top level
- [x] `Panel.svelte` — outer div, `background-color` = separator color, `padding` = gap
- [x] Three flex children: graph region, details region, controls bar — all `border-radius: var(--radius)`, `overflow: hidden`
- [x] `Colors` — `$state` for background/separator/thing color, hardcode defaults for now
- [x] `yarn dev` → three colored regions visible

### Minimal Ancestry (no cache, no HID yet)

- [x] `Ancestry` — id = joined relationship-ID path string, `thing` lookup from store, `depth` = path length, `parentAncestry` = strip last ID, `branchAncestries` = children from store
- [x] `rootAncestry` = empty path

### Minimal Geometry

- [x] `G_Widget` — `center: Point`, hardcoded `width=120`, `height=16`, `center_ofReveal` = center + right offset
- [x] `G_TreeBranches` — stack children vertically at `k.height.row`, no curves

### Tree render

- [x] `Tree_Graph.svelte` — renders focus Widget + `Tree_Branches`, re-mounts on `$state` change
- [x] `Tree_Branches.svelte` — `{#each ancestry.branchAncestries as branch}` → `Widget` + recurse `depth - 1`, stop at `depth == 0`
- [x] `Widget.svelte` — title label only, positioned absolutely via `G_Widget.center`
- [x] `Widget_Title.svelte` — plain text, no editing yet
- [x] Focus hardcoded to `rootAncestry`
- [x] ✦ **Tree renders. Seed data visible as a positioned node tree.**

---

## Phase 4 — Ancestry + Navigation ✦ FIRST INTERACTIVE

2 sessions. Click things. Move focus. Expand/collapse. Depth limit.

Spec: [ancestry.md](./ancestry.md), [ux.md](./ux.md)

### Full Ancestry

- [x] Ancestry cache: `ancestry_remember_createUnique(path)` — one instance per path string, keyed by HID
- [x] Full getters: `isRoot`, `isExpanded` (from `$state` expanded set), `hasChildren`, `shows_children`, `shows_branches`, `siblingIndex`, `sibling_ancestries`
- [x] Depth limit: `depth_within_focus_subtree`, `global_depth_limit` (`$state` default 5), `hidden_by_depth_limit`, `children_hidden_by_depth_limit`, `isVisible_accordingTo_depth_within_focus_subtree`
- [x] `ancestry_createUnique_byStrippingBack(n)`, `incorporates(focus)`, `equals(other)`

### Focus / Grabs / Recents

- [x] `si_recents` — `$state` array of `S_Recent {focus, grabs, depth}` with current index
- [x] `w_ancestry_focus` — `$derived` from `si_recents[index].focus`
- [x] `becomeFocus(ancestry)` — push S_Recent to recents, call `expand()`
- [x] `si_grabs` — `$state` array of grabbed ancestries
- [x] `grab(ancestry)`, `grabOnly(ancestry)`, `grab_none()`, `ungrab_invisible_grabs()`
- [x] `si_expanded` — `$state` Set of expanded ancestry HIDs
- [x] `ancestry_toggle_expansion(ancestry)`
- [x] `recents_go(delta)` — navigate history (undo/redo focus)

### Interaction

- [x] Click Widget title → `grabOnly(ancestry)`
- [x] `Widget_Reveal.svelte` — reveal dot: fat center dot when `hidden_by_depth_limit`, chevron otherwise; click → `becomeFocus` or `toggle_expansion`
- [x] `SVG_D3.svelte` — generic SVG path renderer (stub: just renders the `d` attribute)
- [x] Global `keydown`: arrows → navigate, `/` → becomeFocus, Escape → grab_none, `[`/`]` → recents_go
- [x] Tree re-renders reactively on focus/expand changes
- [x] ✦ **Click to focus, expand/collapse, arrow navigation all work.**

---

## Phase 5 — Geometry

2 sessions. Replace stub layout with real math. Tree looks right.

Spec: [geometry.md](./geometry.md)

- [x] `G_Widget` full — proper `width` (DOM text measurement + dot sizes), `center_ofReveal`, `center_ofDrag`, `origin_ofTitle`, bounding rect
- [x] `G_TreeBranches` full — vertical distribution, `origin_ofLine`, line geometry per branch (column spacing = 100)
- [x] `G_TreeLine` — start/end points, three curve types (flat, up-arc, down-arc), SVG arc paths
- [x] `Tree_Line.svelte` — renders curved connecting lines via absolutely-positioned SVG
- [x] `G_TreeGraph` — `layout()` top-down, `branch_isAlready_attached` dedup, `grand_sweep()` entry point
- [x] `Persistable` + `S_Persistence` — ported from ws; entity hierarchy: Identifiable → Persistable → entities
- [x] `SVG_Paths.ts` full — `fat_polygon` (chevron), `circle_atOffset` (fat center dot), tiny outer dots (digit-decomposition sizing), `fillets`, `annulus`; Widget_Reveal wired up
- [x] `fat polygon` background color -> white
- [x] `Widget_Drag.svelte` — drag handle stub (wired in Phase 8)
- [x] `Colors.ts` full — luminance pipeline, WCAG blend logic, RGBA↔HSBA, `w_thing_color` / `w_background_color` reactive
- [x] Per-thing colors in seed data; Widget: white background + thing-colored text/borders; graph background white; `colors.thing` = `#333333`
- [x] Tree looks visually correct: proper spacing, curved connecting lines, styled reveal dots

---

## Phase 6 — DB_Test + DB_Common ✦ FIRST REAL DATA

1 session. Replace hardcoded seed with the DB abstraction. Startup state machine.

Spec: [database.md](./database.md)

- [x] `DB_Common` abstract class — method signatures: `fetch_all`, `persist`, `delete` per entity type, `hierarchy_setup_fetch_andBuild` sequence
- [x] `T_Startup` states + `w_t_startup` (`$state`); `SeriouslyApp` gates render on `T_Startup.ready`
- [x] `Databases` singleton — `db` reference, `apply_queryStrings` URL param routing, `db_forType()`
- [x] `DB_Test` — ws seed data as structured entities; `fetch_all` → store mutations
- [x] Replace Phase 2 hardcoded seed with `DB_Test` load through `DB_Common`
- [x] `yarn dev?db=test` → loads test graph via abstraction layer

---

## Phase 7 — Hit Detection + Full Input ✦ FULL INPUT

2 sessions. rbush spatial index, full mouse pipeline, complete keyboard dispatch. Replaces the Events.ts god object with a clean table-driven system.

Spec: [signals.md](./signals.md)

### Hit detection

- [x] `S_Hit_Target` — rect, `T_Mouse_Detection` bitmask, `handle_s_mouse` callback slot
- [x] `Hits` — rbush tree keyed by `Target_RBRect {minX, minY, maxX, maxY, target}`; `add_hit_target`, `delete_hit_target`, pointer-event → ancestry resolution via precedence order
- [x] `S_Mouse` — static factories: `empty`, `up`, `down`, `long`, `repeat`, `double` with flag values
- [x] `Mouse_Timer` — autorepeat (150ms period, 800ms delay), double-click (400ms), long-click (800ms), alteration blink (500ms)
- [x] Click state machine: down → start timers → up (short → normal click, long → long-click, rapid → double-click, held → autorepeat)
- [x] Register widgets + reveal dots + drag handles as hit targets on mount; deregister on destroy
- [x] Replace Phase 4 simple click handlers with hit-target callbacks

### Keyboard + Events

- [x] Full keyboard dispatch — `Map<key+modifiers, T_Action>` lookup, all modifier combos
- [ ] All action handlers: create child/sibling, delete, edit title, relocate (persistent move), browse (non-persistent), focus parent/child, toggle expansion, undo/redo
- [ ] Disable logic per action (during edit, no grabs, at root, etc.)
- [x] Replace Phase 4 basic keydown with full table-driven dispatch
- [x] Touch: two-finger pan → `ux.user_graph_offset`, pinch zoom → `ux.scale`
- [x] Wheel → zoom
- [ ] ✦ **All keyboard shortcuts work. Hit detection is spatial.**

---

## Phase 8 — Firebase ✦ FIREBASE

2 sessions. Real user data. Persist changes.

Spec: [database.md](./database.md) §DB_Firebase

- [ ] Firebase config, env vars
- [ ] `DB_Firebase` — Firestore schema: flat predicates + `/Bulks/{idBase}/` sub-collections (things, relationships, traits, tags)
- [ ] Fetch sequence (order matters): predicates → relationships → traits → tags → things (last, for ID translation)
- [ ] Wire format classes: `PersistentThing`, `PersistentRelationship`, `PersistentTrait`, `PersistentTag`, `PersistentPredicate`
- [ ] `onSnapshot` listeners → store mutations (with `deferSnapshots` mechanism to suppress echo during initial load)
- [ ] Dexie (IndexedDB) cache — fast-load path, `hierarchy_create_fastLoad_or_fetch_andBuild` short-circuit
- [ ] `persist_all()` on startup for dirty entities; 800ms debounce per type
- [ ] Bulk alias stitching — foreign root registration, two-phase
- [ ] Anonymous auth
- [ ] ✦ **Real user data loads. Changes persist to Firestore.**

---

## Phase 9 — Details Panel

2 sessions.

Spec: [rendering.md](./rendering.md) §details, [ux.md](./ux.md) §Details

- [ ] `w_ancestry_forDetails` — `$derived`: latest grab, else focus
- [ ] `Details.svelte` — outer shell, routes by `T_Detail`
- [ ] `D_Header.svelte` — thing title (large), ancestry breadcrumb path
- [ ] `D_Actions.svelte` — create child, delete, duplicate, export buttons
- [ ] `D_Data.svelte` — traits as editable key-value table
- [ ] `D_Tags.svelte` — tag chips, add/remove
- [ ] `D_Traits.svelte` — structured trait display
- [ ] `D_Selection.svelte` — multi-grab summary (N items selected)
- [ ] `D_Preferences.svelte` — depth limit slider, dot count mode, theme
- [ ] `Banner_Hideable.svelte` — collapsible section header
- [ ] `Text_Editor.svelte` — inline title editing, `T_Edit` state machine (idle → active → confirming), cursor restore via `Seriously_Range`
- [ ] ✦ **Details panel fully functional.**

---

## Phase 10 — Controls + Search ✦ FULL TREE UX

1 session.

Spec: [rendering.md](./rendering.md) §controls, §search

- [ ] `Primary_Controls.svelte` — graph mode toggle, depth slider, add/delete buttons
- [ ] `Secondary_Controls.svelte` — secondary actions
- [ ] `Breadcrumbs.svelte` — focus ancestry path, each crumb → `becomeFocus`
- [ ] `Tree_Controls.svelte` — branches/children toggle
- [ ] `Search.svelte` / `Search_Results.svelte` / `Search_Toggle.svelte`
- [ ] Search index: suffix-tree on all thing titles, AND/OR multi-word (`Search_Node` trie)
- [ ] `si_found` (`$state` array of Ancestry) — results navigate with arrows
- [ ] ✦ **Full feature parity in tree mode.**

---

## Phase 11 — Radial Mode ✦ RADIAL

2 sessions.

Spec: [rendering.md](./rendering.md) §radial, [geometry.md](./geometry.md) §radial

- [ ] `G_Cluster` — three-cluster equilateral layout, `angle_at_index` with wrapping
- [ ] `G_Pages / G_Paging` — `index_isVisible`, `update_index_toShow`, wrap-around
- [ ] `G_RadialGraph` — ring layout, `layout_forPaging` budget (`radius^1.5 / row_height`), smallest-cluster-first sort
- [ ] `G_Cluster_Pager` — thumb arc geometry
- [ ] `G_Repeater` — proportionate / non-proportionate column width distribution
- [ ] `Radial_Graph.svelte` — root container; zone detection: resize/rotate/paging by distance from center; 500ms/75ms rate limiting
- [ ] `Radial_Cluster.svelte`, `Radial_Rings.svelte`, `Cluster_Pager.svelte`
- [ ] Rotation + resize: angle and radius as `$state`, persisted
- [ ] Radial visibility: `isFocus || parentIsFocus || childIsFocus`
- [ ] Reveal dot radial behavior: `grabOnly` on click, `pointsTo_child` from angle
- [ ] ✦ **Radial mode fully functional.**

---

## Phase 12 — Additional Databases

2 sessions.

Spec: [database.md](./database.md)

- [ ] `DB_Filesystem` — File System Access API, depth-5 directory scan, IndexedDB handle persistence (`webseriously-files` DB, `last-folder` key), permission re-check on restore
- [ ] `DB_Local` — localStorage via preferences helpers
- [ ] `DB_Bubble` — `postMessage` protocol, `T_MID` dispatch table, `allow_response_to[]` debounce; inbound + outbound message shapes
- [ ] `DB_Airtable` — four bases, six tables, field mappings per entity type, polling-based persist (no real-time)
- [ ] `DB_Docs` — `getDocsStructure()` stub, `DocNode` shape
- [ ] `Pivot` — Airtable-format adapter; `assure_small_families()` chunks nodes with >35 children into numbered sub-groups (while loop until stable)
- [ ] `Files` — import/export: JSON, CSV, `.seriously` format; blob + anchor click write path; CSV in-quote comma handling
- [ ] `apply_queryStrings` routing to all DB types

---

## Phase 13 — Preferences, Config, Polish

1 session.

Spec: [managers.md](./managers.md)

- [ ] `Preferences` — localStorage with DB-type namespacing, 20+ keys, `$effect` write-back, enum validation with fallback to defaults
- [ ] `Configuration` — startup sequencer; `?erase=data|recents|settings`, `?disable=`, `?theme=bubble`; `eraseDB` countdown (4 → 0 across subsystems)
- [ ] `Debug` — `T_Debug` flags (35 entries), `apply_queryStrings`, `log_maybe` dispatch
- [ ] `Features` — flat flag object from query strings
- [ ] `Builds` — build number from history struct
- [ ] `Print` — Svelte component mount → `printJS`

---

## Phase 14 — Tests ✦ PARITY

1–2 sessions.

- [ ] Port: `S_Items.test.ts`, `recents_new.test.ts`, `UX_becomeFocus.test.ts`, `UX_integration.test.ts`
- [ ] Port: `Coordinates.test.ts`, `Colors.test.ts`, `Identifiable.test.ts`
- [ ] New: normalized store mutation + `$derived` query tests
- [ ] New: ancestry cache uniqueness tests
- [ ] New: depth limit visibility tests (`hidden_by_depth_limit`, `shows_children`)
- [ ] New: keyboard dispatch table coverage
- [ ] ✦ **Parity reached.**
