# Rendering Design Spec — ws Svelte Components

Source: `/Users/sand/GitHub/mono/ws/src/lib/svelte/`
Date: 2026-02-20

---

## Component Tree Overview

```
SeriouslyApp
  └─ Panel
       ├─ Primary_Controls
       │    ├─ Button (details-toggle, easter-egg, builds, help)
       │    ├─ Segmented (graph-type)
       │    ├─ Search_Toggle
       │    ├─ Next_Previous (recents, scale)
       │    ├─ Separator
       │    └─ Breadcrumbs
       │         └─ Breadcrumb_Button → Button
       ├─ Details (conditional on w_show_details)
       │    ├─ Banner_Hideable × N → Glows_Banner → Glow_Button
       │    ├─ D_Header
       │    ├─ D_Preferences → Segmented, Slider, Color → Portal
       │    ├─ D_Actions → Buttons_Table → Buttons_Row → Button
       │    ├─ D_Selection → Text_Table, Color → Portal
       │    ├─ D_Tags
       │    ├─ D_Traits → Text_Editor → Clickable_Label
       │    └─ D_Data → Buttons_Row, Text_Table, Segmented, Button
       ├─ Secondary_Controls
       │    ├─ Search → Segmented
       │    └─ Tree_Controls → Segmented, Slider, Separator
       └─ main div (graph area)
            ├─ Spinner (busy state)
            ├─ Search_Results (search active)
            └─ Graph
                 ├─ Tree_Graph (T_Graph.tree)
                 │    ├─ Widget (focus node)
                 │    └─ Tree_Branches (recursive)
                 │         ├─ Tree_Line
                 │         ├─ Widget
                 │         │    ├─ Widget_Title
                 │         │    ├─ Widget_Drag
                 │         │    └─ Widget_Reveal
                 │         └─ Tree_Branches (depth - 1, recursive)
                 └─ Radial_Graph (T_Graph.radial)
                      ├─ Radial_Rings
                      │    └─ Radial_Cluster × N
                      │         ├─ Curved_Text
                      │         └─ Cluster_Pager
                      └─ Widget × N (focus + necklace)
```

Popup overlays (mounted inside Panel, keyed on `w_id_popupView`):
- `BuildNotes` — build changelog modal
- `Import` — hidden file input
- `Preview` — file preview modal

---

## Module: main

### SeriouslyApp.svelte

**Purpose:** Root mount point. Calls `c.configure()` and renders `Panel`.

**Props:** none

**Stores read:** none (delegates to Panel)

**Renders:** `<Panel/>`

**Parent:** App entry point (SvelteKit `+page.svelte` or equivalent)

---

### Panel.svelte

**Purpose:** Full-screen layout shell. Owns popup routing, spinner, and graph/search area switching.

**Props:** none

**Stores read:**
- `e.w_t_startup` — gates rendering until `T_Startup.ready`
- `g.w_rect_ofGraphView` — graph area rect, drives layout and reattachment
- `databases.w_t_database` — triggers reattachment on database change
- `show.w_id_popupView` — routes to `BuildNotes`, `Import`, `Preview`, or normal layout
- `show.w_show_details` — shows/hides `Details` panel
- `colors.w_separator_color` — spinner stroke color
- `search.w_search_results_found` — switches graph area to `Search_Results`
- `busy.isDatabaseBusy` + `h.db.isRemote` — shows `Spinner`

**Key reactive state:**
- `reattachments` — incremented when hierarchy is assembled; used in `{#key}` to force full remount
- `spinner_rect` — computed from graph view size

**Renders:**
- `<Box>` as outer frame with fillets
- Fixed `.panel` div at `0,0`, full window size
- Popup branch: `BuildNotes` | `Import` | `Preview`
- Normal branch:
  - `Primary_Controls`
  - `Details` (if `$w_show_details`)
  - `Secondary_Controls`
  - `.main` div positioned at `$w_rect_ofGraphView`
    - `Spinner` (remote DB busy)
    - `Search_Results` (search active)
    - `Graph` (default)

**Event handlers:**
- `ignore_wheel` — consumes wheel events
- `handle_spinner_angle` — receives `angle` custom event from `Spinner`, stores `spinnerAngle`

**Parent → children:** `Primary_Controls`, `Secondary_Controls`, `Details`, `Graph`, `Spinner`, `Search_Results`, `BuildNotes`, `Import`, `Preview`, `Box`

---

### Graph.svelte

**Purpose:** Switches between tree and radial graph views. Manages layout cycle, CSS custom properties for graph position, and rubberband selection overlay.

**Props:** none

**Stores read:**
- `show.w_t_graph` — selects `Radial_Graph` or `Tree_Graph`
- `g.w_rect_ofGraphView` — drives div size and CSS variables `--graph-x`, `--graph-y`
- `g.w_user_graph_offset` — pan offset, triggers `actual_content_rect` recalc
- `x.w_ancestry_focus` — triggers full layout+reattach on change
- `x.w_s_title_edit` — triggers `actual_content_rect` recalc
- `x.w_expanded.w_items` — triggers layout+reattach on expansion change
- `g.w_depth_limit` — triggers layout+reattach
- `hits.w_s_hover` — triggers style update
- `hits.w_dragging` — adds `rubberband-active` class; skips layout during rubberband drag
- `hits.w_rotate_angle`, `hits.w_resize_radius` — trigger `actual_content_rect` recalc
- `core.w_t_startup` — gates rendering

**Key reactive state:**
- `reattachments` — incremented by `grand_layout_andReattach()`; drives `{#key reattachments}`
- `style` — computed absolute position/size string for draggable div
- `actual_content_rect` — `g.user_offset_toGraphDrawing`, used for debug overlay

**Functions:**
- `grand_layout_andReattach()` — calls `g.layout()`, updates `actual_content_rect`, increments `reattachments`
- `update_style()` — sets CSS variables `--graph-x`, `--graph-y`; rebuilds `style` string

**Renders:**
- `.draggable` div — absolute, overflow hidden, touch-action none, z-index `T_Layer.graph`
  - `Radial_Graph` or `Tree_Graph`
  - Debug green-border overlay (if `debug.graph`)
  - `Rubberband` (bounds = draggable rect)
- `.bottom-controls` div — `Button` for builds number + `Button` for help (`?`)

**Interactions:**
- Build button: `e.handle_s_mouseFor_t_control(s_mouse, T_Control.builds)`
- Help button: `e.handle_s_mouseFor_t_control(s_mouse, T_Control.help)`

**Global CSS:** `.rubberband-active` on `body` → `cursor: crosshair`, `user-select: none`

---

### Details.svelte

**Purpose:** Left-side panel showing details for selected thing. Scrollable column of `Banner_Hideable` sections. Positioned below controls; height adjusts based on secondary controls visibility.

**Props:** none

**Stores read:**
- `show.w_t_graph` — affects `secondary_isVisible` and `details_top`
- `show.w_show_search_controls` — affects `secondary_isVisible`
- `x.si_found.w_index` (`w_found`) — triggers `w_count_details++`
- `search.w_t_search` — triggers rerender
- `x.si_thing_tags.w_description` — triggers rerender
- `x.si_thing_traits.w_description` — triggers rerender
- `x.w_grabs` — triggers rerender
- `x.w_ancestry_forDetails` — triggers rerender
- `e.w_count_details` — drives `{#key}` for full remount

**Key reactive state:**
- `secondary_isVisible` — `$w_show_search_controls || $w_t_graph == T_Graph.tree`
- `details_top` — `g.controls_boxHeight + (secondary_isVisible ? g.controls_boxHeight - 5 : 0)`
- `details_height` — `g.windowSize.height - details_top`

**Renders:**
- `.details-stack` — absolute flex column, overflow-y auto, no scrollbar visible
  - `Banner_Hideable` wrapping `D_Header` (always)
  - `Banner_Hideable` wrapping `D_Preferences` (if `features.has_every_detail`)
  - `Banner_Hideable` wrapping `D_Actions`
  - `Banner_Hideable` wrapping `D_Selection`
  - `Banner_Hideable` wrapping `D_Tags` (if `features.has_every_detail`)
  - `Banner_Hideable` wrapping `D_Traits` (if `features.has_every_detail`)
  - `Banner_Hideable` wrapping `D_Data`
- `Separator` — vertical line to the right of panel at `k.width.details`

---

### Import.svelte

**Purpose:** Hidden file input that auto-clicks on mount to open OS file picker.

**Props:**
- `accept: string` — default `'.' + files.format_preference`
- `multiple: string` — default `k.empty` (empty = single file)

**Stores read:**
- `show.w_id_popupView` — set to `null` on dismiss

**Functions:**
- `dismiss_popup()` — sets `$w_id_popupView = null`
- `handle_selection(event)` — reads `files[0]`, calls `h.fetch_andBuild_fromFile()`, resets input value, sets `details.t_storage_need`, calls `g.grand_build()`, dismisses

**Event handlers:**
- `on:change` → `handle_selection`
- `on:cancel` → `dismiss_popup`

**Renders:** hidden `<input type='file'>` — display none

**Interactions:** `onMount` triggers `.click()` on the input element

---

### Preview.svelte

**Purpose:** Modal overlay to preview files (image or text). Supports download and copy path for filesystem DB.

**Props:** none

**Stores read:**
- `show.w_id_popupView` — dismiss sets to null
- `files.w_preview_content` — the content to show (URL or text)
- `files.w_preview_type` — `'image'` or `'text'`
- `files.w_preview_filename` — displayed in title bar
- `colors.w_background_color` — modal background

**Functions:**
- `dismiss_popup()` — clears popup and preview content
- `downloadFile()` — `h.db.downloadFile(thing.id)` (filesystem only)
- `copyPath()` — `h.db.copyPath(thing.id)`, shows feedback `'Copied!'` / `'Failed'`
- `handleKeydown(event)` — Escape key → `dismiss_popup()`

**Event handlers:**
- `svelte:document on:keydown` → `handleKeydown`
- Overlay `on:click` → `dismiss_popup`
- Content `on:click|stopPropagation` — prevents bubble-close

**Renders:**
- `.preview-overlay` — fixed full-screen semi-transparent overlay
  - `.preview-content` — centered modal, max 80vw/80vh
    - `.top-bar` with filename title
    - `Close_Button` (top-right corner)
    - `.button-bar` with `Copy Path` + `Download` (filesystem DB only)
    - `.preview-body` — `<img>`, `<pre>`, or `<p>` based on `w_preview_type`

---

### BuildNotes.svelte

**Purpose:** Modal overlay showing build changelog, paginated in groups of 10.

**Props:** none

**Stores read:**
- `show.w_id_popupView` — set null to dismiss
- `show.w_t_directionals` — `[canGoBack, canGoForward]` for stepper visibility
- `colors.w_background_color` — modal background

**Key local state:**
- `notesIndexed` — `Object.entries(builds.notes).reverse()`
- `notesIndex` — current page start, 0-based, steps by 10
- `notes` — current slice of 10 entries
- `title` — display title with `(10 most recent)` suffix when at start

**Functions:**
- `updateNotes()` — slices `notesIndexed`, updates `title`
- `hit_closure(pointsUp, isLong)` — moves `notesIndex` by ±10 or jumps to start/end on long press; updates `$w_t_directionals`
- `handle_key_down(event)` — Escape → `$w_id_popupView = null`
- `handle_visit_click()` — opens `docs.webseriously.org/work/deliverables.html` in new tab

**Event handlers:**
- `svelte:document on:keydown` → `handle_key_down`
- Overlay `on:click` → dismiss

**Renders:**
- `.notes-modal-overlay` — fixed full-screen, semi-transparent
  - `.notes-modal-content` — 500px wide modal
    - `Steppers` (up/down navigation)
    - Title text
    - `Close_Button`
    - `Button` ("deliverables" → visit URL)
    - `<table>` — Build / Date / Note columns, 10 rows max

---

## Module: tree

### Tree_Graph.svelte

**Purpose:** Root of tree layout. Positions the entire tree at the user pan offset with scale transform. Renders the focus widget and its child branches.

**Props:** none

**Stores read:**
- `g.w_depth_limit` — passed to `Tree_Branches` as `depth`
- `g.w_scale_factor` — CSS `transform: scale()`
- `g.w_rect_ofGraphView` — div width/height
- `g.w_user_graph_offset` — top/left positioning
- `x.w_ancestry_focus` — root ancestry to render

**Key reactive state:**
- `reattachments` — incremented by signal handler; drives `{#key reattachments}`

**Signal handling:**
- `signals.handle_anySignal_atPriority(3, $w_ancestry_focus, T_Hit_Target.tree, ...)` — increments `reattachments`

**Lifecycle:**
- `onMount` — returns `() => s_component.disconnect()`

**Renders:**
- `{#if g_graph_tree.reset_scanOf_attached_branches() && !!$w_ancestry_focus}`
  - `.tree-graph` div — absolute, `z-index: T_Layer.graph`, scaled
    - `Widget` for focus ancestry's `g_widget`
    - `Tree_Branches` (if `$w_ancestry_focus.shows_branches`)

**Parent → children:** `Widget`, `Tree_Branches`

---

### Tree_Branches.svelte

**Purpose:** Recursive component. For each child ancestry of a given parent, renders its connecting line, its widget, and (recursively) its own branches.

**Props:**
- `ancestry: Ancestry` — the parent ancestry whose children to render
- `depth: number` — remaining recursion depth; stops rendering at 0

**Stores read:**
- `show.w_show_related` — shows bidirectional lines when depth > 1

**Key reactive state:**
- `reattachments` — incremented by signal; drives inner `{#key reattachments}`

**Signal handling:**
- `signals.handle_anySignal_atPriority(2, ancestry, T_Hit_Target.branches, ...)` — increments `reattachments`

**Lifecycle:**
- `onMount` → `s_component.disconnect()` on unmount

**Renders (if `depth > 0`):**
- Debug dot at `g_childBranches.origin_ofLine` (if `debug.lines`)
- `{#key reattachments}` block:
  - `{#each ancestry.branchAncestries as branchAncestry}`
    - `Tree_Line` for `branchAncestry.g_widget.g_line`
    - `Widget` for `branchAncestry.g_widget`
    - `Tree_Branches` (recursive) if `branchAncestry.shows_branches && !g_graph_tree.branch_isAlready_attached(branchAncestry)`
  - If `$w_show_related && depth > 1`: bidirectional `Tree_Line` for each `g_widget.g_bidirectionalLines` where `depth_ofLine < (depth + 2)`

---

### Tree_Line.svelte

**Purpose:** Renders a single SVG curved line connecting a child node to its parent. Solid or dashed depending on whether bidirectional.

**Props:**
- `g_line: G_TreeLine` — geometry object carrying path, rect, stroke_width, curve type

**Stores read:**
- `colors.w_thing_color` — reactive; triggers reattachment when the line's thing color changes

**Key reactive state:**
- `reattachments` — driven by `signals.handle_reposition_widgets_atPriority` and thing color change; drives `{#key reattachments}`
- `stroke_color` — `ancestry?.thing?.color`; opacitized to 0.7 for bidirectional
- `svg_dasharray` — `k.dasharray.relateds` for bidirectional; empty otherwise

**Signal handling:**
- `signals.handle_reposition_widgets_atPriority(2, ancestry, T_Hit_Target.line, ...)` — increments `reattachments`

**Renders:**
- `<svg>` — absolutely positioned at `g_line.origin`, sized to `g_line.size` + stroke padding
  - `<path>` — `d={g_line.linePath}`, stroke color, optional dasharray
- Debug dot at `g_line.rect.extent` (if `debug.lines`)

---

## Module: widget

### Widget.svelte

**Purpose:** Core interactive node. Renders a labeled, clickable, draggable rectangle for one `Ancestry`. Contains `Widget_Title`, optionally `Widget_Drag` and `Widget_Reveal`. Handles grab, focus, and edit entry.

**Props:**
- `g_widget: G_Widget` — geometry + state for this node

**Stores read:**
- `hits.w_s_hover` — updates style reactively
- `colors.w_thing_color` — triggers style update
- `x.w_ancestry_focus` — triggers style update
- `x.w_grabs` — triggers layout + style
- `x.w_s_title_edit` — triggers layout
- `show.w_show_catalist_details` — set true on double-click
- `e.w_count_mouse_up`, `e.w_shift_on_mouse_up` — reactive

**Key reactive state:**
- `showing_reveal` — `(!ancestry.isFocus || !show.inRadialMode) && ancestry.showsReveal_forPointingToChild(...)`
- `showing_drag` — `(!ancestry.isFocus || !show.inRadialMode) && (!ancestry.isRoot || show.inRadialMode)`
- `widget_style` — background, color, border, position, size string
- `width_ofWidget`, `height`, `top`, `left`, `border_radius`

**Signal handling:**
- `signals.handle_anySignal_atPriority(1, ancestry, T_Hit_Target.widget, ...)`:
  - `T_Signal.reattach` → calls `final_layout()` + `tick()`
  - `T_Signal.reposition` → calls `layout_maybe()`

**Lifecycle:**
- `onMount` — registers `s_widget` HTML element; sets up `doubleClick_callback`; sets `mouse_detection = T_Mouse_Detection.none`
- `onDestroy` — `hits.delete_hit_target(s_widget)`

**Double-click behavior:**
- If thing has a `link` trait → `window.open(link, '_blank')`
- Otherwise → `$w_show_catalist_details = true`

**Functions:**
- `final_layout()` — computes position/size from `g_widget.origin`, `g_widget.offset_ofWidget`; calls `update_style()`
- `update_style()` — rebuilds `widget_style` string; reads `s_widget.background`, `s_widget.color`, `s_widget.border`
- `z_index()` — `T_Layer.frontmost` if radial focus, else `T_Layer.widget`

**Renders:**
- `.widget` div — absolute, pointer cursor, styled by `widget_style`
  - `.widget-components` div — contains sub-widgets
    - `Widget_Title`
    - `Widget_Drag` (if `showing_drag`)
    - `Widget_Reveal` (if `showing_reveal`)

---

### Widget_Title.svelte

**Purpose:** Inline editable title for a widget. Manages text input focus, selection range persistence, live width measurement via ghost span.

**Props:**
- `s_title: S_Element` — element state for the title hit target
- `fontSize: string` — default `${k.font_size.common}px`

**Stores read:**
- `hits.w_s_hover` — style update
- `colors.w_thing_color` — color update
- `x.w_ancestry_focus` — style update
- `x.w_grabs` — style update (grabbed state adjusts top/left)
- `x.si_expanded.w_items` — style update
- `x.w_s_title_edit` — edit state machine
- `x.w_thing_title` — propagated title during live edit
- `x.w_thing_fontFamily` — font
- `e.w_mouse_location` — cursor offset calculation
- `e.w_mouse_button_down` — style trigger
- `databases.w_t_database` — filesystem mode routing

**Key reactive state:**
- `title_width` — measured from ghost span
- `top`, `left` — small positional adjustments based on grab/focus/radial state
- `color` — `s_widget.color`
- `title_binded` — bound to input value

**Signal handling:**
- `signals.handle_anySignal_atPriority(0, ancestry, T_Hit_Target.title, ...)` → `updateInputWidth()`

**Event handlers on `<input>`:**
- `on:blur` → `handle_blur` — stops edit, persists
- `on:focus` → `handle_focus` — immediate blur if not in editing state
- `on:input` → `handle_input` — updates `thing.title`, triggers layout after 400ms debounce
- `on:keydown` → `handle_key_down`:
  - `Enter` → `stop_andPersist()`
  - `Tab` → `stop_andPersist()`, then `h.ancestry_edit_persistentCreateChildOf`
- `on:cut`, `on:paste` → `extractRange_fromInput_toThing()`
- `on:mouseover` → consumed

**Mouse handler (`handle_s_mouse`):**
- Down in filesystem mode → `ancestry.grabOnly()`; optionally `files.show_previewOf_file`
- Down while editing → extract range
- Down with Shift → toggle grab
- Down on grabbed+editable (not deferred double-click) → `ancestry.startEdit()`

**Renders:**
- `.title-wrapper` div — absolute, `width: title_width`, `height: k.height.row`
  - `<span class='ghost'>` — off-screen for width measurement
  - `<input type='text'>` — absolutely positioned inside wrapper; cursor switches between pointer/text based on editing state

---

### Widget_Reveal.svelte

**Purpose:** The "reveal dot" — indicates expand/collapse state and child count. Clickable to toggle expansion or change focus.

**Props:**
- `s_reveal: S_Element` — element state for reveal hit target
- `pointsTo_child: boolean` — direction of reveal (default `true`)
- `zindex: number` — default `T_Layer.dot`

**Stores read:**
- `hits.w_s_hover` — color update
- `colors.w_thing_color`, `colors.w_background_color` — color updates
- `show.w_t_countDots` — dot type selection
- `show.w_show_countsAs` — `T_Counts_Shown.numbers` or `T_Counts_Shown.dots`
- `x.w_grabs`, `x.si_expanded.w_items`, `x.w_thing_title` — trigger updates

**Key reactive state:**
- `center` — `g_widget.center_ofReveal`, repositioned by signal
- `fill_color`, `svg_outline_color`, `counts_color` — from `s_reveal` state
- `svgPathFor_revealDot` — main reveal dot path
- `svgPathFor_tiny_outer_dots` — count dots (arc of small circles)
- `svgPathFor_fat_center_dot` — bulk alias or depth-hidden indicator

**Signal handling:**
- `signals.handle_reposition_widgets_atPriority(2, ancestry, T_Hit_Target.reveal, ...)` → updates `center`

**Click behavior (set in `$: if (!!element)`):**
- In radial mode → `ancestry.becomeFocus()` + `grabOnly()`
- In tree mode:
  - `h.ancestry_toggle_expansion(ancestry)` if has children
  - Adjusts focus if hidden by depth limit
  - Calls `x.ungrab_invisible_grabs()`

**Renders:**
- `.reveal-wrapper` — absolute square at `center`, `size × size`, cursor pointer
  - `.reveal-dot` div with `role='button'`, `tabindex='0'`
    - Main `SVG_D3` for `svgPathFor_revealDot`
    - `.fat_center-dot` `SVG_D3` (if bulk alias or depth hidden)
    - `.reveal-count` div:
      - Number div (if `T_Counts_Shown.numbers` and `show_reveal_count`)
      - `<svg>` with tiny outer dots (if `T_Counts_Shown.dots` and path exists)

---

### Widget_Drag.svelte

**Purpose:** The "drag dot" — left or right of title, initiates grab/drag. Also shows parent count ellipses, related indicator, and focus arrow.

**Props:**
- `s_drag: S_Element` — element state for drag hit target
- `reveal_isAt_right: boolean` — determines which side drag dot sits on

**Stores read:**
- `colors.w_thing_color`, `colors.w_background_color` — color updates
- `hits.w_s_hover`, `hits.w_dragging` — hover state and drag gating
- `show.w_t_countDots`, `show.w_show_countsAs` — dot visibility
- `x.w_grabs`, `x.w_ancestry_focus`, `x.w_ancestry_forDetails` — color triggers

**Key reactive state:**
- `center` — `g_widget.center_ofDrag`
- `fill_color`, `svg_outline_color`, `parents_color`, `thing_color` — colors from `s_drag` state
- `svgPathFor_dragDot` — oval
- `svgPathFor_ellipses` — parent count dots (if `count > 1 && show.parent_dots`)
- `svgPathFor_related` — related indicator dot (if `thing.hasRelated && show.related_dots`)
- `arrow_fill_color`, `arrow_stroke_color` — for focus arrow

**Signal handling:**
- `signals.handle_signals_atPriority([T_Signal.alteration], 0, ancestry, T_Hit_Target.drag, ...)` → updates `s_drag.isInverted`, recomputes colors

**Click behavior (set in `$: if (!!element)`):**
- Down (not already dragging): calls `e.handle_singleClick_onDragDot(shiftKey, ancestry)`
- Shift+click: sets `x.dragDotJustClicked = true` for 100ms

**Renders:**
- `.drag-wrapper` — absolute square at `center`
  - `<button>` — transparent background, `z-index: T_Layer.dot`
    - `SVG_D3` — oval drag dot
    - `SVG_D3` — parent ellipses (conditional)
    - `SVG_D3` — related dot (conditional)
    - `SVG_D3` — left-pointing arrow (if focus and not showing dots)

---

## Module: radial

### Radial_Graph.svelte

**Purpose:** Root of radial layout. Translates entire graph to user offset. Renders rings, focus widget, and necklace of child widgets.

**Props:** none

**Stores read:**
- `g.w_rect_ofGraphView` — div width/height
- `g.w_user_graph_offset` — CSS `translate(x, y)`
- `x.w_ancestry_focus` — focus widget rendered at center; paging trigger
- `radial.w_g_paging` — paging state; triggers reattachment when active thing matches

**Key reactive state:**
- `reattachments` — driven by two signal handlers and paging change; drives `{#key reattachments}`

**Signal handling:**
- `signals.handle_signals_atPriority([T_Signal.reattach], 0, null, T_Hit_Target.radial, ...)` → `reattachments++`
- `signals.handle_signals_atPriority([T_Signal.reposition], 2, null, T_Hit_Target.radial, ...)` → `reattachments++`

**Lifecycle:**
- Constructor: calls `g.layout()`
- `onMount` → `s_component.disconnect()` on unmount

**Renders:**
- `.radial-graph` div — absolute, translate-transformed
  - `Radial_Rings`
  - `{#key reattachments}`:
    - `Widget` for focus ancestry `g_widget`
    - `.necklace-of-widgets` div — `z-index: T_Layer.necklace`
      - `Widget` for each `g_graph_radial.g_necklace_widgets`

---

### Radial_Rings.svelte

**Purpose:** SVG rings (resize + rotate annulus) at graph center. Dispatches resize and rotate gesture beginnings. Hosts `Radial_Cluster` components for each cluster arc.

**Props:** none

**Stores read:**
- `hits.w_s_hover` — triggers fill color update after 100ms delay
- `colors.w_thing_color` — updates `color` when focus thing color changes
- `x.w_ancestry_focus`, `x.w_s_title_edit`
- `radial.w_g_cluster` — active paging cluster
- `radial.w_rotate_angle` — affects resize path computation
- `radial.w_resize_radius` — drives all radius-dependent SVG paths
- `e.w_count_mouse_up` — triggers `s_reset()` on mouse up

**Key reactive state:**
- `outer_radius`, `middle_radius`, `outer_diameter` — computed from `$w_resize_radius` + `ring_width`
- `viewBox` — updated from outer dimensions
- `resize_svgPath` — `svgPaths.circle(...)` at resize_radius
- `rotate_svgPath` — `svgPaths.annulus(...)` for the outer ring
- `resize_fill`, `rotate_fill` — hover colors
- `reattachments` — driven by reposition signal

**Signal handling:**
- `signals.handle_reposition_widgets_atPriority(2, null, T_Hit_Target.rings, ...)` → `reattachments++`

**Mouse handlers (set in `onMount`):**
- `radial.s_rotation.handle_s_mouse` → `handle_s_mouse_forRotation` — records basis angles
- `radial.s_resizing.handle_s_mouse` → `handle_s_mouse_forResize` — records basis radius delta

**Renders:**
- `.rings` div → `.ring-paths` div — absolute, square, z-index `T_Layer.ring`
  - `<svg>` with `viewBox`:
    - `<path class='resize-path'>` — inner circle, bound to `resize_element`
    - `<path class='reticle-path'>` — debug crosshair (if `debug.reticle`)
    - `<path class='rotate-path'>` — annulus, bound to `rotate_element`
- `.paging-arcs` div — z-index `T_Layer.paging`
  - `Radial_Cluster` for each `g_graph_radial.g_clusters` (if widgets_shown > 0)

---

### Radial_Cluster.svelte

**Purpose:** One cluster arc with its pager thumb, fork line, arc slider, and curved title label. Handles paging drag start.

**Props:**
- `g_cluster: G_Cluster` — cluster geometry and paging state
- `color: string` — base color for arc elements (default `'red'`)

**Stores read:**
- `hits.w_s_hover` — thumb fill opacity
- `radial.w_g_cluster` — active cluster state
- `radial.w_resize_radius` — drives all radius computations
- `colors.w_background_color` — blending
- `x.w_thing_fontFamily` — cluster title font

**Key reactive state (all `$:`):**
- `thumbFill` — blended opacity based on hover / thumb_opacity
- `textBackground` — blended for highlighted vs normal
- `arcLength` — from title string width
- `pager_color`, `pager_font_size`, `pager_angle` — label positioning
- `radius`, `diameter`, `viewBox`, `wrapper_style` — geometry
- `curved_text_radius` — `$w_resize_radius + pager_offset`
- `start_thumb_transform`, `end_thumb_transform` — pager endpoint transforms

**Lifecycle `onMount`:**
- `s_paging.handle_s_mouse = handle_s_mouse` — starts paging on down

**Mouse handler:**
- `handle_s_mouse(s_mouse)` — records `active_angle`, `basis_angle` on `s_paging`; sets `$w_g_cluster`
- `handle_backward()` / `handle_forward()` — `g_cluster.g_paging.addTo_paging_index_for(±1)` + `g.layout()`

**Renders:**
- `.radial-cluster` → `.cluster-wrapper` div — absolute centered square
  - `<svg>`:
    - Fat arc path (hidden, `show_fat_arc = false`)
    - Fork line path
    - Arc slider path
    - Thumb arc path (if `g_cluster.isPaging && widgets_shown > 1`)
- `Curved_Text` — cluster title on arc

---

## Module: draw

### Box.svelte

**Purpose:** Rectangular frame composed of four `Separator` lines with optional sides shown/hidden.

**Props:**
- `name: string`
- `width: number`, `height: number`
- `left: number`, `top: number`
- `thickness: number` — default `k.thickness.separator.main`
- `corner_radius: number` — default `k.radius.fillets.thick`
- `showTop`, `showBottom`, `showLeft`, `showRight: boolean` — all default `true`
- `zindex: number` — default `T_Layer.details`

**Renders:**
- `.{name}-box` — absolute flex column
  - `.{name}-central-box` — horizontal flex
    - `Separator` left side (if `showLeft`)
    - `.{name}-content-box` — `<slot/>`
    - `Separator` right side (if `showRight`)
  - `Separator` top (if `showTop`)
  - `Separator` bottom (if `showBottom`)

---

### Separator.svelte

**Purpose:** A single styled line (horizontal or vertical) with optional fillets at ends, thin divider, and centered title label.

**Props:**
- `name: string`
- `isHorizontal: boolean` — default `true`
- `origin: Point`
- `length: number`
- `thickness: number`
- `corner_radius: number`
- `margin: number`
- `has_fillets: boolean` — default `true`
- `has_double_fillet: boolean` — default `true`
- `has_thin_divider: boolean` — default `false`
- `title: string | null`
- `title_left: number | null`
- `title_font_size: number`
- `zindex: number`
- `position: string` — default `'absolute'`
- `handle_mouseUp: (event) => {}` — if set, renders title as `Clickable_Label`

**Stores read:**
- `colors.w_separator_color` — line background color
- `colors.w_background_color` — title label background

**Renders:**
- Separator `<div>` — color from `$w_separator_color`, sized and positioned
- `Fillets` at start (if `has_fillets`)
- `Fillets` at end (if `has_double_fillet`)
- Thin divider `<div>` (if `has_thin_divider`)
- Title:
  - `Clickable_Label` (if `handle_mouseUp` is set)
  - Static `<div>` with background-color (otherwise)

---

### Fillets.svelte

**Purpose:** SVG corner fillet — a partial arc that rounds the end of a separator line.

**Props:**
- `radius: number`
- `direction: Direction`
- `center: Point`
- `color: string`
- `thickness: number`
- `zindex: number`

**Renders:**
- `<svg>` — pointer-events none, absolutely positioned at `svgTop/svgLeft`
  - `<path>` — `svgPaths.fillets(Point.zero, radius, direction)`, fill+stroke = `color`

---

### Gull_Wings.svelte

**Purpose:** SVG decorative "gull wings" shape — two outward arcs from a center point. Structurally similar to `Fillets` but uses `svgPaths.gull_wings`.

**Props:**
- `radius: number`
- `direction: Direction`
- `center: Point`
- `color: string`
- `thickness: number`
- `zindex: number`

**Renders:** Same structure as `Fillets` but with `svgPaths.gull_wings(...)` path.

---

### Circle.svelte

**Purpose:** Solid-border circle div for debug markers or graph decorations.

**Props:**
- `center: Point`
- `radius: number`
- `color: string`
- `thickness: number` — border width
- `name: string`
- `zindex: number`

**Renders:** Single `<div class='circle'>` — `border-radius: 50%`, `border: {thickness}px solid {color}`, positioned at `center - radius - thickness`

---

### Transparent_Circle.svelte

**Purpose:** Circle with transparent/opacitized fill for ring overlays.

**Props:**
- `center: Point`
- `radius: number`
- `color: string` — border color
- `thickness: number`
- `opacity: number` — fill opacity (0 = fully transparent)
- `color_background: string` — base for fill computation
- `zindex: number`

**Stores read:**
- `colors.w_background_color` — default `color_background`

**Renders:** Single `<div class='circle'>` — border-radius 50%, border color, background from `colors.opacitize(color_background, opacity)`

---

### SVG_D3.svelte

**Purpose:** D3-backed SVG path element. Path is applied via D3 on mount and reactively updated. Used extensively for widget dots, arrows, and decorative shapes.

**Props:**
- `svgPath: string` — D3 path `d` attribute
- `fill: string` — default `'none'`
- `stroke: string` — default `colors.default`
- `stroke_width: number` — default `k.thickness.stroke`
- `width: number`, `height: number`
- `left: number`, `top: number`
- `viewBox_width: number | undefined`
- `position: string`
- `zindex: number`
- `name: string`
- `pathElement: SVGPathElement | null` — bindable output

**Lifecycle:**
- `onMount` — `d3.select(svg).append('path')` with all attrs; exposes `pathElement`

**Reactive:**
- `$: fill` block — updates existing D3 path attrs when `fill` changes

**Renders:** `<svg>` — `preserveAspectRatio='none'`, `shape-rendering: geometricPrecision`

---

### SVG_Gradient.svelte

**Purpose:** Radial gradient SVG. Used as background fill for `Glow_Button`.

**Props:**
- `name: string` — unique gradient ID (random suffix by default)
- `path: string` — SVG path to fill with gradient
- `size: Size`
- `color: string`
- `isInverted: boolean` — center opaque→transparent vs transparent→opaque

**Renders:** `<svg>` with `<defs><radialGradient>` and `<path>` filled with `url(#name)`

---

### Portal.svelte

**Purpose:** Svelte portal — mounts slot content under a different DOM parent (e.g. `body`) to escape stacking context.

**Props:**
- `target: string | HTMLElement` — CSS selector string or element (default `'body'`)
- `id: string | undefined`
- `className: string | undefined`

**Lifecycle:**
- `portal` action: appends `el` to `targetEl`, shows it; on destroy removes from parent

**Renders:** Hidden `<div>` with `use:portal={target}` action — slot content is moved to target

---

### Printable.svelte

**Purpose:** Print layout helper. Clones a given element, scales it to fit printer page dimensions, and positions it for `@media print`.

**Props:**
- `element: HTMLElement` — source element to clone
- `rect: Rect` — content rect for scale calculation

**Key logic:**
- `configure()` — measures printer page width and DPI via temporary DOM elements
- `layout()` — computes `scaleFactor`, `final_origin` using printer aspect ratio and margins
- `$: if (!!printable)` — clones `element.cloneNode(true)` into `.printable-content`

**Renders:**
- `.printable-content` — scaled and positioned clone of source element
- `.message-box` — debug log output (visible when `log_message` is set)

---

### Spinner.svelte

**Purpose:** CSS-animated dashed circle with optional title. Used during remote database loading.

**Props:**
- `angle: number` — starting rotation in degrees
- `speed: string` — CSS animation duration (default `'1s'`)
- `diameter: number` — SVG/div size
- `strokeWidth: number` — circle stroke width
- `stroke: string` — circle color
- `number_of_dashes: number` — controls dash pattern
- `title: string | null` — optional centered text

**Exposes:** `getCurrentAngle()` — reads computed CSS transform matrix to return current rotation angle

**Renders:**
- `.spinner` div with CSS vars `--spinner-speed`, `--spinner-angle`
  - `<svg>` → `<circle class='spinner-circle'>` — CSS `animation: spin` infinite
  - `.spinner-title` div (if `title` set)

---

## Module: controls

### Primary_Controls.svelte

**Purpose:** Top control bar. Contains details toggle, graph type switcher, zoom controls, search toggle, separator, and breadcrumbs. Layout computed via cumulative widths.

**Props:** none

**Stores read:**
- `g.w_rect_ofGraphView` — drives `width` recalculation
- `e.w_count_window_resized` — triggers width update
- `colors.w_background_color` — drives `{#key}` remount
- `show.w_t_graph` — drives `{#key}` on `Segmented` for graph type
- `show.w_id_popupView` — hides controls when popup active
- `show.w_show_search_controls` — affects `search_left` computation
- `search.w_t_search`

**Layout:**
- `layout_controls()` — builds `lefts` via `u.cumulativeSum` from feature-gated widths:
  - Index 0: details toggle
  - Index 1: graph type segmented
  - Index 2: scale controls
  - Index 3: search toggle
  - Index 4: easter egg button
  - Index 5: vertical separator
  - Index 6: breadcrumb type (unused slot)
  - Index 7: recents nav
  - Index 8: breadcrumbs start

**Renders:**
- `.primary-controls` div — absolute, z-index `T_Layer.frontmost`, 21px tall
  - `Next_Previous` (recents navigation)
  - `Button` (details hamburger toggle, if `features.has_details_button`)
  - `Segmented` graph-type switcher (if `features.allow_tree_mode`)
  - `Search_Toggle` (if `features.allow_search`)
  - `Next_Previous` scale controls (if `features.has_zoom_controls`)
  - `Button` easter egg (if no details button)
  - `Separator` vertical after controls
  - `Breadcrumbs`
- `Separator` horizontal bottom separator (outside `.primary-controls`)

---

### Secondary_Controls.svelte

**Purpose:** Second control bar, shown conditionally. Hosts either search input or tree preferences depending on state.

**Props:** none

**Stores read:**
- `show.w_show_search_controls` — shows `Search`
- `show.w_t_graph` — shows `Tree_Controls` when tree mode

**Key reactive state:**
- `isVisible` — `$w_show_search_controls || $w_t_graph == T_Graph.tree`

**Renders (if `isVisible`):**
- `.secondary` div — absolute, full width, z-index `T_Layer.frontmost`
  - `Search` (if search controls active)
  - `Tree_Controls` (if tree mode)
  - `Separator` bottom line (if `features.allow_tree_mode`)

---

### Breadcrumbs.svelte

**Purpose:** Row of breadcrumb buttons showing heritage path from root to current focus/selection. Positioned inside `Primary_Controls`.

**Props:**
- `width: number` — available width
- `centered: boolean` — layout mode
- `left: number` — starting position

**Stores read:**
- `x.w_grabs` — triggers update
- `g.w_rect_ofGraphView` — triggers update
- `x.w_s_title_edit` — triggers update
- `x.w_ancestry_forDetails` — depth comparison to select heritage
- `x.w_ancestry_focus` — focus ancestry heritage
- `x.si_found.w_index` — triggers update
- `colors.w_thing_color` — triggers update
- `core.w_t_startup` — gates rendering
- `search.w_t_search`

**Key reactive state:**
- `crumb_ancestries` — array of ancestries to render
- `lefts` — pixel offsets for each crumb
- `trigger` — encoded int combining counts + positions; drives `{#key trigger}`

**Signal handling:**
- `signals.handle_signals_atPriority([T_Signal.rebuild, T_Signal.reattach], 1, null, T_Hit_Target.breadcrumbs, ...)` → `update()`

**Renders:**
- `.breadcrumbs` div — absolute, left 7px, top -5.5px
  - `{#each crumb_ancestries}`:
    - `>` separator div (if index > 0)
    - `Breadcrumb_Button` for each ancestry

---

### Tree_Controls.svelte

**Purpose:** Secondary controls for tree mode: tree type selector (children/related) + depth limit slider.

**Props:**
- `zindex: number` — default `T_Layer.graph`

**Stores read:**
- `show.w_t_trees` — selected tree types; drives `{#key}` on `Segmented`
- `g.w_depth_limit` — slider value; writable
- `colors.w_separator_color` — slider thumb color

**Functions:**
- `handle_depth_limit(value)` — rounds value, updates `$w_depth_limit`, calls `x.assure_grab_isVisible()`

**Renders:**
- `.tree-preferences` div — absolute, full width, 35px tall
  - `Segmented` — tree types (children / related), `allow_multiple: true`
  - `Separator` — vertical divider
  - `Slider` — depth limit, logarithmic, max 12
  - `.depth-value` div — shows `{$w_depth_limit} level(s)`

---

## Module: details

### Banner_Hideable.svelte

**Purpose:** Wrapper for each details section. Renders a collapsible banner (`Glows_Banner`) that toggles section visibility. Tracks `w_t_details` store to know if section should be shown.

**Props:**
- `t_detail: T_Detail` — identifies which section this wraps

**Stores read:**
- `show.w_t_details` — array of shown detail type keys; drives `hideable_isVisible`
- `x.w_ancestry_forDetails` — used for selection pager
- `x.w_grabs` — count for navigation arrows
- `x.w_grabIndex`
- `si_items.w_description`, `si_items.w_extra_titles` — (for non-selection sections)

**Key reactive state:**
- `hideable_isVisible` — section shown or hidden
- `titles` — `[banner_title, ...extra_titles]`; extra titles are prev/next for selection pager

**Functions:**
- `toggle_hidden(t_detail)` — adds/removes detail type from `$w_t_details`
- `update_banner_titles(grabs, grabIndex, extra_titles)` — updates `titles` + `title`
- `update_hideable_isVisible()` — reads `$w_t_details` to compute visibility

**Renders:**
- `.{title}-dynamic-container` div — flex column, `z-index: T_Layer.stackable`
  - `{#key trigger}`
    - Banner row (if `s_banner_hideable.hasBanner`): `Glows_Banner`
    - `.hideable` div with `<slot/>` (if `hideable_isVisible`)

---

### D_Header.svelte

**Purpose:** Colored title block at top of details panel. Shows the selected thing's title on a background of its color.

**Props:** none

**Stores read:**
- `x.w_ancestry_forDetails` — provides `thing.title` and `thing.color`
- `x.w_grabs` — triggers update
- `hits.w_s_hover` — triggers update
- `colors.w_thing_color` — triggers update
- `x.si_found.w_index` — triggers update

**Key reactive state:**
- `ancestry` — current `$w_ancestry_forDetails`
- `color` — `'white'` when ancestry exists
- `background_color` — `ancestry.thing?.color`

**Renders:**
- Colored `<div>` — flex centered, `width: k.width.details`, `height: 20px`
  - Thing title clipped to 30 characters with ellipsis

---

### D_Actions.svelte

**Purpose:** Action buttons panel (browse, focus, show, center, add, delete, move). Two `Buttons_Table` groups with a cancel flow for alteration mode.

**Props:**
- `top: number` — default `2`

**Stores read:**
- `show.w_t_graph` — affects button titles
- `x.si_expanded.w_items` — triggers title update
- `x.w_grabs` — triggers title update
- `x.w_s_title_edit` — shows "no actions" message when editing
- `x.w_s_alteration` — alteration mode state
- `x.w_ancestry_forDetails` — action target
- `g.w_user_graph_offset`, `colors.w_background_color` — trigger reattachment
- `x.si_found.w_index`

**Button structure:**
- Group 0 (top table): browse, focus, show, center
  - browse: left, up, down, right
  - focus: selection, parent of selection
  - show: selection, list, entire graph
  - center: focus, selection, graph
- Group 1 (bottom table): add, delete, move
  - add: child, sibling, line, parent, related
  - delete: selection, parent, related
  - move: left, up, down, right

**Alteration mode:**
- Shows instructions text + `Button` cancel instead of button tables
- `target_ofAlteration()` → `'parent'` or `'related'` based on predicate kind

**Autorepeat:** browse and move rows support autorepeat

**Renders:**
- No-grab state: `<p>` with `k.nothing_to_show` or editing message
- Grab state:
  - Alteration mode: instructions div + cancel `Button`
  - Normal: two `Buttons_Table` blocks with `Separator` dividers

---

### D_Data.svelte

**Purpose:** Database info section. Shows current DB stats, file import/export controls, DB switcher, save/select-folder buttons.

**Props:** none

**Stores read:**
- `databases.w_t_database` — active DB
- `databases.w_data_updated` — triggers stats refresh
- `show.w_show_other_databases`, `show.w_show_save_data_button`
- `colors.w_separator_color`

**Key state:**
- `details.t_storage_need` — `direction` | `format` | `busy`; drives `Buttons_Row` content
- `storage_choice` — `import` or `export`
- `storage_details` — array of `[key, value]` pairs shown in `Text_Table`

**Functions:**
- `handle_db_selection(titles)` — `databases.grand_change_database(t_database)`
- `handle_save(s_mouse)` — `h.db.persist_all(true)` on mouse up
- `handle_selectFolder(s_mouse)` — `h.db.selectFolder()` on mouse up
- `handle_mouseUp_forColumn(s_mouse, column)` — routes import/export to `h.persist_toFile` or `h.select_file_toUpload`

**Renders:**
- `Separator` (show/hide other databases toggle, clickable)
- `Segmented` DB switcher (if `$w_show_other_databases`)
- `Text_Table` — DB stats (depth, things, relationships, traits, tags, dirty count)
- `Button` save (if dirty and not busy)
- `Button` select-folder (if filesystem DB)
- `Buttons_Row` — import/export/format action buttons
- `Separator` bottom

---

### D_Tags.svelte

**Purpose:** Tags display for selected thing.

**Props:** none

**Stores read:**
- `x.si_thing_tags.w_item` (`w_tag`) — current tag item

**Renders:**
- If `$w_tag`: `.tags-list` div — flex wrap centered, shows `$w_tag.type`
- If no tag: `.no-tags` div — "no tags" centered

---

### D_Traits.svelte

**Purpose:** Trait editor for selected thing. Renders a `Text_Editor` for the active trait. Link traits get clickable label to open URL/preview.

**Props:** none

**Stores read:**
- `x.si_thing_traits.w_item` (`w_trait`) — current trait
- `databases.w_t_database` — determines link behavior (filesystem preview vs. window.open)

**Event handlers:**
- `handle_click(event)` — opens trait text as URL or filesystem preview

**Renders:**
- No trait: `.no-traits` "no traits" centered div
- Has trait:
  - `.trait-editor` with `Text_Editor`:
    - `label` = `$w_trait.t_trait`
    - `label_underline` = true for link type
    - `label_color` = blue for link type
    - `handleClick_onLabel` = `handle_click` for link type
    - `handle_textChange` = `h.trait_setText_forTrait`

---

### D_Selection.svelte

**Purpose:** Selection details — shows characteristics, relationships, properties of selected thing. Includes inline color picker.

**Props:**
- `top: number` — default `6`

**Stores read:**
- `x.w_ancestry_forDetails` — primary data source
- `x.w_grabs` — triggers update
- `x.w_thing_title` — reactive to title changes
- `x.w_ancestry_focus` — triggers update
- `x.w_order_changed_at` — triggers update
- `show.w_t_details`

**Key reactive state:**
- `characteristics` — `[['modified', ...], ['color', ...], ['children', ...], ...]`
- `properties` — id, ancestry id, kind, type
- `relationships` — tags, traits, depth, order
- `color_origin` — absolute position of color cell from `characteristics_table.absolute_location_ofCellAt`

**Functions:**
- `handle_colors(result)` — updates `thing.color`, signals change, persists
- `handle_toggle_properties(event)` — toggles `details.show_properties`

**Renders:**
- No selection: `<p>` with `k.nothing_to_show`
- Has selection:
  - `.selection-container` — relative, `z-index: T_Layer.frontmost`
    - `Text_Table` — characteristics (bind for color origin)
    - `Text_Table` — relationships (absolute, right-column)
    - `Color` in `Portal` (if `color_origin` exists and ancestry editable)
    - `Text_Table` — properties (if `details.show_properties`)
  - `Separator` — "click to show/hide more" toggle

---

### D_Preferences.svelte

**Purpose:** Visual preferences: count dot display mode, tiny dot types, accent color picker.

**Props:**
- `top: number` — default `0`

**Stores read:**
- `show.w_show_countsAs` — selected count display mode
- `show.w_t_countDots` — which dot types to show
- `show.w_t_graph`
- `g.w_scale_factor` — for DOMRect scaling
- `colors.w_separator_color` — accent color; writable from color picker

**Key reactive state:**
- `show_dots` — `$w_show_countsAs == T_Counts_Shown.dots`
- `heights`/`tops` — computed layout heights, `show_dots` adds rows
- `color_origin` — measured from `color_wrapper` DOM rect

**Functions:**
- `handle_colors(color)` — clamps near-white to `'lightgray'`, sets `$w_separator_color`
- `handle_count_dots(types)` — sets `$w_t_countDots`
- `handle_counts_shown(types)` — sets `$w_show_countsAs`

**Renders:**
- `Separator` — "show list sizes as" label (clickable none)
- `Segmented` — dots / numbers / hidden options
- (If `show_dots`): `Separator` + `Segmented` for tiny-dot types
- `Separator` — "accent color"
- Color dot `<div>` with `Color` in `Portal`

---

## Module: mouse

### Button.svelte

**Purpose:** Core interactive button. Wraps `<button>` in a positioned `<div>`. Handles `S_Mouse` routing via `s_button`, including autorepeat, long-click, and double-click patterns.

**Props:**
- `s_button: S_Element` — element state (fill, stroke, cursor, border, callbacks)
- `handle_s_mouse: (s_mouse: S_Mouse) => boolean` — caller's click handler
- `name: string`
- `width: number`, `height: number`
- `origin: Point | null` — top-left position
- `center: Point | null` — alternative center-based position
- `align_left: boolean` — left vs. right edge alignment
- `font_size: number`
- `padding: string`
- `border_color: string`, `border_thickness: number`
- `color: string` — text color
- `position: string` — CSS position
- `zindex: number`
- `style: string` — override style string
- `mouse_detection: T_Mouse_Detection`

**Stores read:**
- `hits.w_s_hover` — triggers style recompute
- `hits.w_autorepeat` — (via s_button)
- `colors.w_background_color` — drives `{#key}` remount
- `g.w_rect_ofGraphView`, `g.w_user_graph_offset` — triggers style
- `e.w_control_key_down` — triggers style
- `x.w_thing_fontFamily` — font
- `s_button.isDisabled`, `s_button.isInverted`, `s_button.isGrabbed`, `s_button.isEditing`, `s_button.fill` — all trigger recompute

**Key behavior:**
- `onMount`: registers HTML element on `s_button`, installs `handle_s_mouse` wrapper
- Wrapper intercepts: autorepeat captures event on `s_button`; long/double-click handled by `Hits.ts` centrally; normal buttons fire immediately on down, confirmed on up
- `$: if (!!element && !!s_button)` — reinstalls handler on re-render (for `{#key}` parent blocks)

**Renders:**
- `{#key $w_background_color, button_style}`
  - `.button-wrapper` div — positioned, sized
    - `<button>` — flex centered, rounded, styled
      - `<slot/>` (caller-provided content)

---

### Glow_Button.svelte

**Purpose:** Banner-style button with radial gradient background when not hovered. Used in `Glows_Banner`. Supports autorepeat.

**Props:**
- `title: string` — displayed text or SVG icon key
- `width: number`, `height: number`
- `name: string`, `banner_id: string`
- `font_size: number`
- `handle_mouseUp: (title: string) => boolean`
- `detects_autorepeat: boolean`

**Stores read:**
- `hits.w_s_hover`, `hits.w_autorepeat`
- `colors.w_background_color` — updates `banner_color`

**Key behavior:**
- `icon_path = svgPaths.fat_polygon_path_for(title)` — if non-null, renders SVG triangle instead of text
- Non-autorepeat: fires `handle_mouseUp` on `isDown`
- Autorepeat: `s_element.autorepeat_callback = () => handle_mouseUp(click_title)`

**Renders:**
- `.glow-button` div — relative positioned
  - `.glow-button-background` — `SVG_Gradient` (hidden when hovering)
  - `.glow-button-title` — centered text or `<svg>` path icon

---

### Triangle_Button.svelte

**Purpose:** Triangle/polygon-shaped button. Wraps `Button` with SVG triangle path rendered via `SVG_D3`. Uses `svgPaths.isPointInPath` for precise hit testing.

**Props:**
- `size: number`
- `angle: number` — polygon orientation
- `center: Point`
- `strokeColor: string`
- `name: string`
- `handle_s_mouse: (s_mouse: S_Mouse) => boolean`
- `hover_closure: (flag: boolean) => [fillColor, extraColor]`
- `extraPath: string | null` — optional additional SVG path
- `mouse_detection: T_Mouse_Detection`

**Stores read:**
- `hits.w_s_hover` — triggers `setFillColor`
- `x.w_grabs` — triggers `setFillColor`

**Renders:**
- `Button` wrapping:
  - `SVG_D3` — triangle path, fill from `hover_closure`
  - `SVG_D3` — extra path (if provided)
  - `<slot/>`

---

### Breadcrumb_Button.svelte

**Purpose:** Single breadcrumb in the navigation bar. Styled pill button showing ancestry title with thing's color scheme.

**Props:**
- `s_breadcrumb: S_Widget` — widget state for this ancestry
- `left: number` — horizontal position
- `center: Point` — computed from left + width

**Stores read:**
- `hits.w_s_hover` — triggers color update
- `colors.w_thing_color` — thing-specific update
- `colors.w_background_color` — color update
- `x.w_grabs` — grab state affects styling
- `x.w_thing_fontFamily`

**Click behavior:**
- Meta key or ancestry outside focus subtree → `ancestry.becomeFocus()` + optional depth adjustment
- Shift key → `ancestry.toggleGrab()`
- Otherwise → `ancestry.grabOnly()`
- Always: `search.deactivate()`

**Renders:**
- `{#key reattachments + $w_background_color}`
  - `Button` — pill-shaped, custom `style` string, text = `thing.breadcrumb_title`

---

### Close_Button.svelte

**Purpose:** X button (circle with X). Used in modals (Preview, BuildNotes).

**Props:**
- `name: string`
- `size: number`
- `origin: Point`
- `closure: () => void`
- `align_left: boolean` — right vs. left edge
- `stroke_width: number`

**Stores read:**
- `hits.w_s_hover` — toggles stroke/fill between normal (gray X, white circle) and hover (white X, gray circle)

**Renders:**
- `.close-button` div — absolute, cursor pointer
  - `SVG_D3` — circle outline fill
  - `SVG_D3` — X cross inside

---

### Clickable_Label.svelte

**Purpose:** Text label that's optionally clickable (becomes an `<a>` tag with underline + pointer cursor).

**Props:**
- `label: string`
- `handle_mouseUp: (event) => {}` — if null, non-clickable
- `font_size: number`
- `zindex: number`
- `label_underline: boolean`
- `label_color: string`

**Stores read:**
- `colors.w_background_color` — label background

**Renders:** `<a>` — absolutely positioned, cursor pointer/default based on handler presence

---

### Rubberband.svelte

**Purpose:** Multi-select rectangle drag. Handles rubberband and graph-pan (meta+drag) interactions. Uses RBush spatial index for intersection detection.

**Props:**
- `bounds: Rect` — limits rubberband area
- `strokeWidth: number`

**Stores read:**
- `hits.w_dragging` — mode: `T_Drag.rubberband`, `T_Drag.graph`, `T_Drag.none`
- `g.w_user_graph_offset` — written during graph drag
- `g.w_scaled_movement` — delta during graph drag
- `colors.w_separator_color` — border color
- `x.w_s_title_edit` — cleared on drag start
- `e.w_count_mouse_up` — ends drag on mouse up
- `e.w_mouse_location` — updates rubberband rect

**Key behavior:**
- Down + meta → `T_Drag.graph` (pan mode)
- Down + shift → `x.grab_none()`
- Down (default, feature-gated) → `T_Drag.rubberband`, starts `s_rubberband`
- During rubberband: `detect_and_grab()` via RBush spatial search
- Mouse up: finalizes grab or resets; pushes recents snapshot

**Renders:**
- `.rubberband-hit-area` div — invisible hit zone covering full graph area
- `.rubberband` div — visible dashed rect (only when `T_Drag.rubberband` active)

**Global CSS:**
- `body.rubberband-blocking` → crosshair cursor, no selection
- `.rubberband-blocking .button`, `.controls`, `.segmented`, `.details-stack`, `.bottom-controls` → `pointer-events: none`

---

### Slider.svelte

**Purpose:** HTML range input styled as pill slider. Supports linear and logarithmic scales. Custom hit testing for thumb precision.

**Props:**
- `name: string`
- `value: number`, `max: number`
- `width: number`, `height: number`
- `origin: Point`
- `handle_value_change: (value: number) => void`
- `thumb_color: string`
- `isLogarithmic: boolean`
- `show_value: boolean`
- `divisions: number` — internal range [0..divisions]
- `isVisible: boolean`
- `title_font_size: number`

**Stores read:**
- `hits.w_s_hover` — hover state
- `e.w_mouse_button_down` — (implicit via s_element)
- `colors.w_background_color`

**Key behavior:**
- Maps `slider_value` (0..divisions) to/from `value` (linear or log10)
- `thumb_contains_point(point)` — custom hit test using scaled rect + thumb position
- `compute_andPush()` — only calls `handle_value_change` when rounded value changes

**Renders:**
- `.slider` div — relative positioned at `origin`
  - `.slider-border` — flex container with CSS vars for thumb/track color
    - `<input type='range'>` — flex 1, custom styled via `::-webkit-slider-*` and `::-moz-*`
    - Value span (if `show_value`)

---

### Segmented.svelte

**Purpose:** Pill-shaped segmented control. Supports single/multiple selection and optional deselect.

**Props:**
- `titles: string[]`
- `selected: string[]`
- `name: string`
- `width: number`, `height: number`
- `origin: Point`
- `left: number` — horizontal offset within container (default 38)
- `font_size: number`
- `allow_multiple: boolean`
- `allow_none: boolean`
- `handle_selection: (types: string[]) => void`
- `selected_color`, `hover_background_color`, `selected_text_color`, etc. — theming props

**Stores read:**
- `colors.w_separator_color` — updates `selected_color` reactively

**Key behavior:**
- `select(title)`: single → cycles or deselects; multiple → toggle; calls `handle_selection`
- `setSelected(turnTheseOn)` — DOM class manipulation to add/remove `selected` class

**Renders:**
- `.segmented` absolute div
  - `.group-of-segments` — `border-radius: 999px`, overflow hidden, flex
    - `<button class='segment'>` for each title — CSS vars for hover/selected colors

---

### Steppers.svelte

**Purpose:** Up/down triangle button pair for paginating through lists (e.g. BuildNotes). Buttons shown conditionally based on `w_t_directionals`.

**Props:**
- `hit_closure: (pointsUp: boolean, isLong: boolean) => void`

**Stores read:**
- `show.w_t_directionals` — `[showUp, showDown]` booleans

**Renders:**
- `.steppers` div — absolute, top/left 0
  - `Triangle_Button` up (if `$w_t_directionals[0]`), `T_Mouse_Detection.autorepeat`
  - `Triangle_Button` down (if `$w_t_directionals[1]`), `T_Mouse_Detection.autorepeat`

**Click handler:** reads button `name` attribute (`'up'` or `'down'`), passes `pointsUp` + meta key to `hit_closure`

---

### Color.svelte

**Purpose:** Color picker dot. Wraps `svelte-awesome-color-picker`. Opening state synced to `colors.w_color_picker_isOpen`.

**Props:**
- `color: string`
- `origin: Point`
- `color_closure: (color: string) => void`
- `picker_offset: string` — CSS left offset for picker popup
- `zindex: number`

**Stores read:**
- `colors.w_color_picker_isOpen` — written when `isOpen` changes

**Event handlers:**
- `on:input` → `handle_color_change` — extracts `event.detail.hex`, calls `color_closure`

**Renders:**
- `.color` div — absolute at `origin`
  - `ColorPicker` — from `svelte-awesome-color-picker` with CSS custom property overrides for size/z-index

---

### Next_Previous.svelte

**Purpose:** Left/right (or up/down) navigation button pair with autorepeat. Used for recents navigation and scale controls in `Primary_Controls`.

**Props:**
- `name: string`
- `size: number`
- `origin: Point`
- `top_offset: number`
- `closure: (column: number, event, element, isFirstCall) => any`
- `custom_svgPaths: { up?, down? } | null` — overrides triangle with custom icon paths (for grow/shrink)

**Key behavior:**
- Creates two `S_Element` objects on mount, sets up autorepeat callbacks
- `autorepeat_callback` calls `closure(button_id, event, element, isFirstCall)`, toggling `isFirstCall`
- Custom paths: combines custom icon with triangle; uses different stroke color

**Renders:**
- `.{name}-next-previous` flex row div
  - Two `<button>` elements — transparent background
    - `<svg>` → `<path>` — triangle or custom+triangle icon, fill changes on hover

---

### Cluster_Pager.svelte

**Purpose:** SVG `<g>` element for radial cluster forward/backward page buttons. Rendered inside `Radial_Cluster`'s SVG context.

**Props:**
- `name: string`
- `direction: string` — used as `T_Hit_Target.paging` direction
- `size: number`
- `center: Point`
- `color: string`
- `viewBox: string`
- `thumb_path_d: string`
- `thumbTransform: string`
- `handle_mouseUp: () => void`

**Stores read:**
- `hits.w_s_hover` — fill color update
- `colors.w_background_color`

**Renders:**
- `<g class='pager-group {name}'>` — pointer-events auto
  - `<path>` — `svgPaths.fat_polygon(size, 0, true)`, fill from hover state

---

### Buttons_Row.svelte

**Purpose:** One row of action buttons with optional row title (or separator title). Used by `Buttons_Table` and `D_Data`.

**Props:**
- `row_titles: string[]` — `[rowTitle, btn1, btn2, ...]` (first is title if `has_title`)
- `has_title: boolean`
- `has_seperator: boolean` — title rendered as `Separator` instead of inline div
- `name: string`, `row_name: string`
- `width: number`
- `button_height: number`
- `gap: number`, `margin: number`, `title_gap: number`
- `font_sizes: Array<number>` — `[title_size, button_size]`
- `origin: Point | null`, `center: Point | null`
- `align_left: boolean`
- `t_target: T_Hit_Target`
- `svg_size: number`
- `closure: (t_request, s_mouse, column) => boolean`
- `mouse_detection: T_Mouse_Detection`

**Key logic:**
- `G_Repeater` computes button widths/offsets with proportional sizing
- `T_Button_SVG.arrow` for browse/move rows (renders directional arrows)
- Closure called with `T_Request.is_disabled`, `T_Request.is_inverted`, `T_Request.name`, `T_Request.handle_s_mouse`

**Renders:**
- `.buttons-row` div — absolute
  - Title: `Separator` (if `has_seperator`) or `.actions-left-column` text
  - `.buttons-array` — `{#each button_titles}`: `Button` instances sized/positioned by `G_Repeater`

---

### Buttons_Table.svelte

**Purpose:** Grid of `Buttons_Row` instances. Each row's visibility gated by `closure(T_Request.is_visible, ...)`.

**Props:**
- `button_titles: string[][]` — array of rows, each row is `[rowTitle, btn1, ...]`
- `closure: (t_request, s_mouse, name, row, column) => boolean`
- `name: string`
- `width: number`
- `button_height: number`, `gap: number`, `top: number`
- `has_title: boolean`, `has_seperator: boolean`
- `row_offset: number` — adds to row index for `T_Action` lookup
- `title_gap: number`
- `font_sizes: Array<number>`
- `t_target: T_Hit_Target`
- `mouse_detection: T_Mouse_Detection`

**Renders:**
- `.buttons-table` div
  - `{#each button_titles as titles, row}` — `Buttons_Row` (if visible per closure)

---

### Glows_Banner.svelte

**Purpose:** Banner row with `Glow_Button` segments separated by thin vertical separators. Used inside `Banner_Hideable` to title each section.

**Props:**
- `titles: string[]` — first is main banner title, rest are navigation/action titles
- `width: number`, `height: number`
- `font_size: number`
- `banner_id: string`
- `isSelected: boolean`
- `toggle_hidden: (title: string) => void`

**Stores read:**
- `colors.w_background_color`

**Key logic:**
- `G_Repeater` lays out button widths proportionally
- Main title click → `toggle_hidden(banner_id)`
- Other titles → `details.select_next(banner_id, title)`

**Renders:**
- `.glows-banner` flex row div
  - `Separator` top line (thin)
  - `{#each g_repeater.titles}`:
    - `Glow_Button` — width from `G_Repeater`
    - `Separator` vertical divider (if index > 0)
  - `Separator` bottom line

---

## Module: search

### Search.svelte

**Purpose:** Search input bar with result count display and title/trait filter segmented control.

**Props:**
- `zindex: number`
- `top: number`

**Stores read:**
- `search.w_t_search` — gates input focus behavior
- `search.w_t_search_preferences` — filter type (title / trait)
- `search.w_search_results_found` — shows match count
- `g.w_rect_ofGraphView` — drives width computation
- `x.w_thing_fontFamily`

**Key behavior:**
- Input is bound to `search.search_text`; `handle_input` calls `search.search_for(text.toLowerCase())`
- When not entering: auto-focuses the search `s_element` via `elements.s_element_set_focus_to`

**Renders:**
- `.search-preferences` div — absolute, 25px tall
  - `.search-results-found` — match count text
  - `<input type='search'>` — blue text, width shrinks when text present
  - `Segmented` — title / trait filter (right side)

---

### Search_Results.svelte

**Purpose:** Full-area list of search results. Items colored by thing color; matched text highlighted.

**Props:** none

**Stores read:**
- `x.si_found.w_index` (via `results_index`) — selected row; triggers scroll-into-view
- `search.w_search_results_changed` — triggers result array refresh
- `colors.w_separator_color` — highlight color for matched text

**Functions:**
- `handle_row_selected(event, index)` — double-select deactivates; single select sets `search.selected_row`; shift → null
- `highlightMatch(title)` — wraps matched words in `<span>` with `background-color: $w_separator_color`

**Renders:**
- `.search-results` div — absolute, full area, `z-index: 100`
  - `<ul>` — list-style none
    - `{#each results}`: `<li>` — colored by `result.color`, selected state style, `@html highlightMatch(title)`

---

### Search_Toggle.svelte

**Purpose:** Small toggle button in the primary controls bar. Shows search icon when off; close X when active.

**Props:**
- `width: number`
- `left: number`
- `top: number`

**Stores read:**
- `search.w_t_search` — `T_Search.off` → show button; else → show `Close_Button`

**Renders:**
- `.search-controls` div — absolute, z-index `T_Layer.frontmost`
  - `Button` with magnifier emoji (if `T_Search.off`)
  - `Close_Button` "end-search" (if search active), `closure = search.deactivate`

---

## Module: text

### Text_Editor.svelte

**Purpose:** Textarea with a label below it. Used in `D_Traits`. Handles focus, blur, and key events. Enter stops editing; Shift+Enter inserts newline.

**Props:**
- `label: string`
- `original_text: string`
- `color: string`
- `width: number`, `height: number`
- `top: number`, `left: number`
- `label_color: string`
- `label_underline: boolean`
- `handle_textChange: (label, text) => void`
- `handleClick_onLabel: (event) => {}` — passed to `Clickable_Label`

**Stores read:**
- `x.w_thing_fontFamily`
- `x.w_s_title_edit` — set to editing on focus, stopped on blur

**Event handlers:**
- `on:focus` → `handle_focus` — sets editing state
- `on:blur` → `handle_blur` — `handle_textChange(label, null)`; stops `w_s_title_edit`
- `on:keydown` → `handle_key_down` — Enter (non-shift) → blur
- `on:keyup` → `handle_key_up` — non-exit key → calls `handle_textChange`

**Renders:**
- `.{label}` div
  - `<textarea>` — resize none, border changes on focus
  - `.clickable-label` div → `Clickable_Label`

---

### Text_Table.svelte

**Purpose:** Two-column key-value HTML table. Used in `D_Selection`, `D_Data`. Exposes `absolute_location_ofCellAt` for color picker placement.

**Props:**
- `array: [string, any][]` — rows of `[key, value]`
- `name: string`
- `font_size: number`
- `row_height: number`
- `top: number`, `left: number`
- `position: string`

**Stores read:**
- `g.w_scale_factor` — used in `absolute_location_ofCellAt` to convert DOMRect to logical coords

**Exposes:**
- `absolute_location_ofCellAt(x, y): Point` — returns scaled absolute position of table cell

**Renders:**
- `.{name}` div
  - `<table>` — two-column: `.first-column` (right-aligned, 28%) + `.second-column`

---

### Angled_Text.svelte

**Purpose:** Text span rotated to an arbitrary angle. Used for labels at non-standard orientations.

**Props:**
- `text: string`
- `center: Point` — pivot point
- `angle: number` — in radians
- `color: string`
- `font_size: string`
- `font_family: string`
- `background_color: string`
- `zindex: number`

**Stores read:**
- `colors.w_background_color` — default for `background_color`
- `x.w_thing_fontFamily` — default for `font_family`

**Renders:**
- `.angled-text` div — absolute at `center`, `transform: translate(-50%, -50%) rotate({angleDeg}deg)`
  - `<span class='text'>` — background color, font family, color

---

### Curved_Text.svelte

**Purpose:** SVG text rendered along a curved arc path. Used for cluster labels in `Radial_Cluster`.

**Props:**
- `text: string`
- `radius: number`
- `angle: number`
- `center_ofArc: Point`
- `g_cluster_pager: G_Cluster_Pager` — provides `layout_endpoints_onArc` for path computation
- `color: string`
- `font_size: string`
- `font_family: string`
- `background_color: string`
- `zindex: number`

**Stores read:**
- `colors.w_background_color` — default `background_color`
- `x.w_thing_fontFamily` — default `font_family`

**Key reactive state:**
- `arcLength` — from `u.getWidth_ofString_withSize(text, font_size) * 1.3`
- `text_path_d` — from `g_cluster_pager.layout_endpoints_onArc(radius, angle, arcLength)`

**Renders:**
- `<svg>` — absolute, full parent, pointer-events none, overflow visible
  - `<path id={text_path_id}>` — arc guide path (fill none)
  - `<text>` → `<textPath>` startOffset 50% → `<tspan>` — the label

---

## Cross-cutting Patterns

### Signal system
Components register with `signals.handle_anySignal_atPriority` or `signals.handle_reposition_widgets_atPriority`, passing their ancestry and hit target. Signals (`T_Signal.reattach`, `T_Signal.reposition`, `T_Signal.alteration`, `T_Signal.rebuild`) are dispatched centrally. Components disconnect in `onMount` cleanup.

### Hit target system
Every interactive element creates an `S_Element` via `elements.s_element_for(identifiable, T_Hit_Target, name)`. Element registers HTML node via `s_element.set_html_element(el)`. Centralized `hits` manager dispatches `S_Mouse` events. Components clean up with `hits.delete_hit_target(s_element)` in `onDestroy` or mount cleanup.

### `{#key reattachments}` pattern
Used pervasively to force Svelte to fully remount a subtree when data changes structurally (ancestry focus changes, hierarchy rebuilt). Prevents stale component state from prior render cycles.

### Store naming convention
- `w_` prefix = writable store
- `w_t_` = store holding an enum type value
- `w_s_` = store holding an `S_*` state object
- `w_rect_`, `w_ancestry_`, `w_thing_` = domain-typed stores

### `S_Component` lifecycle
Each component using signals holds `let s_component: S_Component`. Set by the signal registration call. `onMount` returns `() => s_component.disconnect()` to unsubscribe.

### `G_Widget` geometry
All widget position/size data flows through `G_Widget` objects, not directly from stores. `g_widget.origin`, `g_widget.width_ofWidget`, `g_widget.center_ofReveal`, `g_widget.center_ofDrag`, `g_widget.origin_ofTitle` are the geometry sources.

### Color blending
`colors.special_blend(color, background, opacity)` and `colors.opacitize(color, opacity)` used throughout for arc fills, hover states, and transparent backgrounds. The `w_background_color` store is referenced nearly universally for blending.

### Layer z-index (`T_Layer`)
```
T_Layer.line < T_Layer.graph < T_Layer.widget < T_Layer.dot <
T_Layer.necklace < T_Layer.ring < T_Layer.paging < T_Layer.text <
T_Layer.details < T_Layer.action < T_Layer.hideable < T_Layer.stackable <
T_Layer.rubberband < T_Layer.frontmost
```
