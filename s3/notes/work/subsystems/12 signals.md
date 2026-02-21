12 # Signals, Events, Mouse, and Hit Detection — Design Spec

Sources read: `Signals.ts`, `Events.ts`, `Mouse_Timer.ts`, `S_Component.ts`, `S_Mouse.ts`, `S_Hit_Target.ts`, `Hits.ts`, `Enumerations.ts`, `Constants.ts`, `Types.ts`.

---

## 1. Signals.ts

### Overview

`Signals` is a typed priority pub/sub system built on top of `typed-signals` (`Signal<Signal_Signature>`). A single `signal_emitter` instance carries all signal traffic. Signals are multiplexed by `T_Signal` type and by integer priority. The exported singleton is `signals`.

### Signal_Signature (from Types.ts)

```ts
type Signal_Signature = (t_signal: T_Signal, priority: number, value: any) => void;
```

Every emission carries all three fields. Handlers filter on both `t_signal` and `priority`.

### T_Signal enum values

Defined in `Enumerations.ts`:

| Value | String | Scope / notes |
|---|---|---|
| `T_Signal.rebuild` | `'rebuild'` | Full graph rebuild |
| `T_Signal.reattach` | `'reattach'` | Re-attach widgets to DOM |
| `T_Signal.reposition` | `'reposition'` | Widget repositioning only |
| `T_Signal.alteration` | `'alteration'` | Blink cycle for alteration mode |
| `T_Signal.thing` | `'thing'` | Thing-level change |

### Priority system

`highestPriorities: Dictionary<number>` — one entry per `T_Signal`, set at handler-registration time.

When a signal is sent, the loop runs:

```ts
for (let priority = 0; priority <= highestPriority; priority++) {
    this.signal_emitter.emit(t_signal, priority, value);
}
```

Priorities fire in ascending order (0 first, highest last). This means lower-priority handlers run before higher-priority ones. Each handler registered at a specific priority receives only the emit whose `signalPriority == priority`.

`adjust_highestPriority_forSignal(priority, t_signal)` — called at subscription time; only raises the ceiling, never lowers it.

`adjust_highestPriority_forAllSignals(priority)` — raises the ceiling for all four tracked signals: `thing`, `rebuild`, `reposition`, `alteration`.

### In-flight guard

`signals_inFlight_dict_byT_Signal: Dictionary<boolean>` — one flag per `T_Signal`.

`anySignal_isInFlight` — `true` if any flag is set. A second `signal()` call while any signal is in flight is silently dropped (logged as `NOT SEND`).

Additional suppression rule: if `rebuild` is in flight, `reposition` signals are suppressed.

### Named send methods

| Method | Signal sent | Value |
|---|---|---|
| `signal_rebuildGraph_from(value, component)` | `rebuild` | arbitrary |
| `signal_rebuildGraph_fromFocus(component)` | `rebuild` | `get(x.w_ancestry_focus)` |
| `signal_blink_forAlteration(value, component)` | `alteration` | arbitrary |
| `signal_reattach_widgets_from(value, component)` | `reattach` | arbitrary |
| `signal_reposition_widgets_from(value, component)` | `reposition` | arbitrary |
| `signal_reattach_widgets_fromFocus(component)` | `reattach` | `get(x.w_ancestry_focus)` |
| `signal_reposition_widgets_fromFocus(component)` | `reposition` | `get(x.w_ancestry_focus)` |

All delegate to `signal(t_signal, value, s_component)`.

### Subscribe methods

#### `handle_signals_atPriority(t_signals, priority, ancestry, type, onSignal)`

- Subscribes to a specific array of `T_Signal` values at one priority.
- Calls `components.component_forAncestry_andType_createUnique(ancestry, type)` to create/retrieve an `S_Component`.
- Connects to `signal_emitter`; the connection closure filters by both `t_signal` membership and `signalPriority == priority`.
- Calls `s_component.assure_hasConnection_atPriority(priority, connection)` to register the connection on the component.
- Returns the `S_Component` (or `null` if creation failed).

#### `handle_anySignal_atPriority(priority, ancestry, type, onSignal)`

- Subscribes to all signal types at a given priority.
- Same pattern as above but only filters on `signalPriority == priority`, not on `t_signal`.

#### `handle_reposition_widgets_atPriority(priority, ancestry, type, onSignal)`

- Convenience wrapper: calls `handle_signals_atPriority([T_Signal.reposition], ...)`.

### Logging

Controlled by two objects:

```ts
log_isEnabledFor_t_signal = {
    alteration: false,
    reposition: false,
    reattach:   false,
    rebuild:    true,
    thing:      false,
}

log_isEnabled_forDirection = {
    handling: true,
    sending:  false,
}
```

`debug_log_signal` on `S_Component` checks both before logging.

---

## 2. S_Component.ts

### Inheritance

`S_Component extends S_Hit_Target`. It is both a signal subscriber and a hit-testable object.

### Signal connection storage

```ts
signal_handlers: SignalConnection_atPriority[] = [];
```

Where:

```ts
type SignalConnection_atPriority = {
    t_signal: T_Signal,
    priority: number,
    connection: SignalConnection | null
};
```

### `assure_hasConnection_atPriority(priority, connection)`

Iterates `signal_handlers`; for any handler whose `priority` matches, replaces its `connection`. This is called immediately after the `signal_emitter.connect()` call in `Signals`.

### `disconnect()`

Iterates all `signal_handlers`, calls `handler.connection?.disconnect()`, sets `connection = null`. This is the teardown path — called when a component is destroyed or re-created.

### Component ID

```ts
get component_id(): string {
    return `${this.type}-${!a ? 'no-ancestry' : (a.kind + '-' + a.titles)}`;
}
```

Used as the `id` field, which `S_Hit_Target.hasSameID_as()` uses for identity comparison.

### Per-type logging flags

`isComponentLog_enabled` checks a hardcoded map:

```ts
{
    breadcrumbs: false,
    branches:    false,
    radial:      false,
    reveal:      false,
    widget:      false,
    title:       false,
    drag:        false,
    line:        false,
    none:        false,
    tree:        false,
    app:         false,
}
```

All currently false. Guards all `debug_log_*` methods.

---

## 3. S_Hit_Target.ts

### Role

Base class for all user-interactable objects. Subclasses: `S_Component`, `S_Widget`, `S_Element`, `S_Rotation`, `S_Resizing`.

### Fields

| Field | Type | Purpose |
|---|---|---|
| `type` | `T_Hit_Target` | Category; drives precedence logic |
| `id` | `string` | `"type-identifiable.id"` |
| `html_element` | `HTMLElement \| null` | Bound DOM element |
| `element_rect` | `Rect \| null` | Scaled rect in graph coords; used for rbush index |
| `mouse_detection` | `T_Mouse_Detection` | Bitmask; controls which click types are active |
| `handle_s_mouse` | `(s_mouse) => boolean` | Primary mouse handler, set by subclass |
| `longClick_callback` | `(s_mouse) => void` | Only called if `detects_longClick` |
| `doubleClick_callback` | `(s_mouse) => void` | Only called if `detects_doubleClick` |
| `autorepeat_callback` | `() => void` | Only called if `detects_autorepeat` |
| `containedIn_rect` | `(rect) => boolean` | Rubberband containment |
| `contains_point` | `(point) => boolean` | Shape refinement for hit detection |
| `autorepeat_id` | `number` | Identifies the autorepeat session |
| `autorepeat_event` | `MouseEvent` | Survives component recreation |
| `clicks` | `number` | Click counter for double-click detection |
| `defaultCursor` | `string` | CSS cursor string |
| `hoverCursor` | `string` | `'pointer'` for dots, else default |

### T_Mouse_Detection (bitmask)

```ts
enum T_Mouse_Detection {
    autorepeat = 4,
    doubleLong = 3,
    double     = 1,
    long       = 2,
    none       = 0,
}
```

Computed getters:
- `detects_longClick`: `(mouse_detection & T_Mouse_Detection.long) !== 0`
- `detects_doubleClick`: `(mouse_detection & T_Mouse_Detection.double) !== 0`
- `detects_autorepeat`: `mouse_detection === T_Mouse_Detection.autorepeat`

### Rect registration

Setting `this.rect = value` (via the setter) automatically calls `hits.add_hit_target(this)`. This is how targets self-register when their DOM element bounds are known.

`update_rect()` reads from `g.scaled_rect_forElement(html_element)`. For dots, widgets, and rings, it clips to `g.w_rect_ofGraphView`.

### T_Hit_Target enum values

```ts
enum T_Hit_Target {
    breadcrumbs, rubberband, database, resizing, rotation,
    details, control, action, button, cancel, paging,
    reveal, search, widget, title, trait, drag, glow,
    line, none, tag
}
```

Groupings used by `Hits` for precedence and hover logic:
- **Dots**: `drag`, `reveal`
- **Rings**: `rotation`, `resizing`
- **Paging**: `paging`
- **Controls**: `control`, `button`, `glow`
- **Widget**: `widget`

### Color system

- `element_color` setter caches an explicit override and auto-computes `_hoverColor_override`.
- For dots without an override: `element_color` returns `ancestry.thing.color`.
- `hoverColor` is `colors.background_special_blend(element_color, k.opacity.medium)`.

### Hover state

`isHovering` getter: `this.hasSameID_as(get(hits.w_s_hover))`.
`isHovering` setter: calls `hits.w_s_hover.set(isHovering ? this : null)`.

---

## 4. S_Mouse.ts

### Purpose

Immutable value object. Encapsulates which mouse event phase occurred plus modifiers. Passed through the entire hit-detection and component handler pipeline.

### Fields

| Field | Type | Notes |
|---|---|---|
| `event` | `MouseEvent \| null` | `null` for movement-originated states |
| `element` | `HTMLElement \| null` | `null` for global responders |
| `isDown` | `boolean` | mousedown phase |
| `isUp` | `boolean` | mouseup phase |
| `isDouble` | `boolean` | double-click |
| `isLong` | `boolean` | long-click |
| `isMove` | `boolean` | mouse movement |
| `isRepeat` | `boolean` | autorepeat tick |
| `clicks` | `number` | unused on the value object; click counter lives on `S_Hit_Target` |

### Static factories

| Factory | isDown | isUp | isDouble | isLong | isMove | isRepeat |
|---|---|---|---|---|---|---|
| `S_Mouse.empty()` | false | true | — | — | — | — |
| `S_Mouse.up(event, element)` | false | true | — | — | — | — |
| `S_Mouse.down(event, element)` | true | false | — | — | — | — |
| `S_Mouse.long(event, element)` | false | false | false | true | false | false |
| `S_Mouse.repeat(event, element)` | false | false | false | false | false | true |
| `S_Mouse.double(event, element)` | false | false | true | false | — | — |
| `S_Mouse.clicks(event, element, n)` | false | false | n>1 | false | — | — |

`notRelevant`: true when all flags are false. Guards no-op paths.

---

## 5. Events.ts

### Overview

`Events` (singleton `e`) owns all DOM event subscriptions, keyboard dispatch, action dispatch, mouse-to-hits routing, and alteration blink management. Exported as `e`.

### Writable stores (observable state)

| Store | Type | Updated by |
|---|---|---|
| `w_count_details` | `number` | details toggle |
| `w_count_rebuild` | `number` | (observed externally) |
| `w_count_window_resized` | `number` | `handle_window_resize` |
| `w_count_mouse_down` | `number` | `handle_mouse_down` |
| `w_count_mouse_up` | `number` | `handle_mouse_up` |
| `w_shift_on_mouse_up` | `boolean` | `handle_mouse_up` — captures `event.shiftKey` |
| `w_control_key_down` | `boolean` | `handle_key_down` / `handle_key_up` |
| `w_mouse_button_down` | `boolean` | `handle_mouse_down` / `handle_mouse_up` |
| `w_scaled_movement` | `Point \| null` | `handle_mouse_move` (delta); `null` on mouse_up |
| `w_mouse_location` | `Point` | `handle_mouse_move` (raw) |
| `w_mouse_location_scaled` | `Point` | `handle_mouse_move` (scaled) |

### Subscription setup

`setup()` is called once:
1. Subscribes to `x.w_s_alteration` → calls `handle_s_alteration`.
2. Subscribes to `c.w_device_isMobile` → calls `subscribeTo_events()`.

`subscribeTo_events()` re-registers all event listeners (clearing old ones first via `clear_event_subscriptions()`). Both document and window listeners use `{ passive: false }`.

### DOM event bindings

Always registered (document):
- `wheel` → `handle_wheel`
- `keyup` → `handle_key_up`
- `keydown` → `handle_key_down`
- `orientationchange` → `handle_orientation_change`

Always registered (window):
- `resize` → `handle_window_resize`

Mobile only (document):
- `touchstart` → `handle_touch_start`
- `touchmove` → `handle_touch_move`
- `touchend` → `handle_touch_end`

Desktop only (document):
- `mousedown` → `handle_mouse_down`
- `mouseup` → `handle_mouse_up`
- `mousemove` → `handle_mouse_move`

### Mouse event flow

**mousedown**:
1. Check `colors.w_color_picker_isOpen` — bail if open.
2. Compute `scaled = location / g.w_scale_factor`.
3. Call `hits.handle_s_mouse_at(scaled, S_Mouse.down(event, null))`.
4. Set `hits.disable_hover = true`.
5. Update `w_count_mouse_down`, `w_scaled_movement = Point.zero`, `w_mouse_button_down = true`.

**mouseup**:
1. Compute scaled location.
2. Call `hits.handle_s_mouse_at(scaled, S_Mouse.up(event, null))`.
3. `hits.disable_hover = get(colors.w_color_picker_isOpen)`.
4. Set `w_scaled_movement = null`, `w_shift_on_mouse_up = event.shiftKey`, `w_mouse_button_down = false`.

**mousemove**:
1. Compute scaled location and delta from prior.
2. If delta magnitude > 1: update `w_scaled_movement`.
3. Always update `w_mouse_location` and `w_mouse_location_scaled`.
4. Call `hits.handle_mouse_movement_at(scaled)`.

**wheel** (desktop only):
- Consumes event.
- Reads `g.w_user_graph_offset`, applies `delta = (-deltaX, -deltaY)`.
- Only updates offset if `features.allow_h_scrolling` and `delta.magnitude > 1`.

**touch**:
- `touchstart`: on two-finger touch, records `initialTouch` from `touches[0]`.
- `touchmove`: on two-finger touch, computes `(deltaX, deltaY)` from `initialTouch`, calls `g.set_user_graph_offsetTo`.
- `touchend`: clears `initialTouch`.

### Keyboard dispatch (`handle_key_down`)

Guards: skips if `x.w_s_title_edit.isActive` (title edit mode active). Modifier keys (`alt`, `meta`, `shift`, `control`) are ignored as standalone keys.

Modifier flags extracted: `OPTION = altKey`, `SHIFT = shiftKey`, `COMMAND = metaKey`, `EXTREME = SHIFT && OPTION`.

#### Search mode keys (when `search.w_t_search != T_Search.off`)

| Key | Action |
|---|---|
| `enter` | `search.deactivate_focus_and_grab()` |
| `escape` | `search.deactivate_focus_and_grab()` |
| `arrowright` | `search.deactivate_focus_and_grab()` |
| `arrowleft` | consume + `search.activate()` |
| `arrowup` | consume + `search.next_row(false)` |
| `arrowdown` | consume + `search.next_row(true)` |
| `tab` | `search.selected_row = 0` |
| `f` | `search.activate()` |

#### Normal mode, editing allowed, title editing allowed

| Key | Action |
|---|---|
| `enter` | `ancestry.startEdit()` |
| `d` | `h.thing_edit_persistentDuplicate(ancestry)` |
| `space` | `h.ancestry_edit_persistentCreateChildOf(ancestry)` |
| `-` (no COMMAND) | `h.thing_edit_persistentAddLine(ancestry)` |
| `tab` | `h.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry)` |

#### Normal mode, editing allowed (all)

| Key | Action |
|---|---|
| `delete` | `h.ancestries_rebuild_traverse_persistentDelete(w_grabs)` |
| `backspace` | `h.ancestries_rebuild_traverse_persistentDelete(w_grabs)` |

#### Normal mode, navigation (requires ancestry)

| Key | Action |
|---|---|
| `/` | `ancestry.becomeFocus()` → sets `graph_needsSweep` |
| `arrowleft` | consume + `h.ancestry_rebuild_persistentMoveRight(ancestry, false, SHIFT, OPTION, EXTREME, false)` |
| `arrowright` | consume + `h.ancestry_rebuild_persistentMoveRight(ancestry, true, SHIFT, OPTION, EXTREME, false)` |

#### Normal mode, global keys (no ancestry requirement)

| Key | Action |
|---|---|
| `f` | `search.activate()` |
| `]` | `x.recents_go(true)` |
| `[` | `x.recents_go(false)` |
| `a` | consume (no-op) |
| `!` | `g.grand_adjust_toFit()` |
| `?` | `controls.showHelp_home()` |
| `m` | `controls.toggle_graph_type()` |
| `p` (no COMMAND) | `u.print_graph()` |
| `c` | `g.set_user_graph_offsetTo(Point.zero)` |
| `>` | `g_graph_tree.increase_depth_limit_by(1)` |
| `<` | `g_graph_tree.increase_depth_limit_by(-1)` |
| `s` | `h.persist_toFile(T_File_Extension.json)` |
| `o` | `h.select_file_toUpload(T_File_Extension.json, shiftKey)` |
| `/` (no ancestry) | `h.rootAncestry?.becomeFocus()` |
| `escape` | stop alteration if active; `search.deactivate()` |
| `arrowup` | consume + `h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe(true, SHIFT, OPTION, EXTREME)` |
| `arrowdown` | consume + `h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe(false, SHIFT, OPTION, EXTREME)` |

After dispatch: if `graph_needsSweep`, calls `g.grand_sweep()`. If `features.allow_autoSave` and db is dirty, persists with 1ms defer.

### Action dispatch (`handle_action_clickedAt`)

Called with `(s_mouse, t_action, column, name)`. Only runs if `!e.w_control_key_down` and `ancestry` exists and action is not disabled. If control key is held, routes to help instead.

#### T_Action.browse

| Column (key) | Method |
|---|---|
| `browse.up` (1) | `h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe(true, false, false, false)` |
| `browse.down` (2) | `h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe(false, false, false, false)` |
| `browse.left` (0) | `h.ancestry_rebuild_persistentMoveRight(ancestry, false, false, false, false, false)` |
| `browse.right` (3) | `h.ancestry_rebuild_persistentMoveRight(ancestry, true, false, false, false, false)` |

#### T_Action.focus

| Column | Method |
|---|---|
| `focus.selection` (0) | `ancestry.becomeFocus()` |
| `focus.parent` (1) | `ancestry.collapse()` + `ancestry.parentAncestry?.becomeFocus()` |

#### T_Action.show

| Column | Method |
|---|---|
| `show.selection` (0) | no-op |
| `show.list` (1) | `h.ancestry_rebuild_persistentMoveRight(ancestry, !ancestry.isExpanded, false, false, false, true)` |
| `show.graph` (2) | `g.grand_adjust_toFit()` |

#### T_Action.center

| Column | Method |
|---|---|
| `center.focus` (0) | `g.ancestry_place_atCenter(w_ancestry_focus)` |
| `center.selection` (1) | `g.ancestry_place_atCenter(ancestry)` |
| `center.graph` (2) | `g.set_user_graph_offsetTo(Point.zero)` |

#### T_Action.add

| Column | Method |
|---|---|
| `add.child` (0) | `h.ancestry_edit_persistentCreateChildOf(ancestry)` |
| `add.sibling` (1) | `h.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry)` |
| `add.line` (2) | `h.thing_edit_persistentAddLine(ancestry)` |
| `add.parent` (3) | `controls.toggle_alteration(ancestry, T_Alteration.add, Predicate.contains)` |
| `add.related` (4) | `controls.toggle_alteration(ancestry, T_Alteration.add, Predicate.isRelated)` |

#### T_Action.delete

| Column | Method |
|---|---|
| `delete.selection` (0) | `h.ancestries_rebuild_traverse_persistentDelete(w_grabs)` |
| `delete.parent` (1) | `controls.toggle_alteration(ancestry, T_Alteration.delete, Predicate.contains)` |
| `delete.related` (2) | `controls.toggle_alteration(ancestry, T_Alteration.delete, Predicate.isRelated)` |

#### T_Action.move

| Column | Method |
|---|---|
| `move.up` (1) | `h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe(true, false, true, false)` |
| `move.down` (2) | `h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe(false, false, true, false)` |
| `move.left` (0) | `h.ancestry_rebuild_persistentMoveRight(ancestry, false, false, true, false, false)` |
| `move.right` (3) | `h.ancestry_rebuild_persistentMoveRight(ancestry, true, false, true, false, false)` |

### Disable logic (`isAction_disabledAt`)

Returns `true` (disabled) under these conditions:

| Action | Column | Disabled when |
|---|---|---|
| browse.left | 0 | `is_root` |
| browse.up | 1 | `no_siblings` |
| browse.down | 2 | `no_siblings` |
| browse.right | 3 | `no_children` |
| focus.selection | 0 | `ancestry.isFocus` |
| focus.parent | 1 | no parent or parent is focus |
| show.selection | 0 | `ancestry.isVisible` |
| show.list | 1 | `no_children \|\| is_root \|\| (radialMode && isFocus)` |
| show.graph | 2 | always enabled |
| center.focus | 0 | focus is already centered |
| center.selection | 1 | selection is already centered |
| center.graph | 2 | offset magnitude < 1 |
| add.child | 0 | `is_altering` |
| add.sibling | 1 | `is_altering \|\| is_root` |
| add.line | 2 | `is_altering \|\| is_root` |
| add.parent | 3 | `is_root` |
| add.related | 4 | never |
| delete.selection | 0 | `is_altering \|\| is_root` |
| delete.parent | 1 | no contains-parents |
| delete.related | 2 | no isRelated-parents |
| move.left | 0 | `is_root` |
| move.up | 1 | `no_siblings \|\| is_root` |
| move.down | 2 | `no_siblings \|\| is_root` |
| move.right | 3 | `no_children \|\| is_root` |

Default (no match): `true` (disabled).

### Alteration blink (`handle_s_alteration`)

Called whenever `x.w_s_alteration` store changes.

- If non-null: starts alteration timer → calls `signals.signal_blink_forAlteration(invert)` on each tick.
- If null: stops alteration timer, calls `signals.signal_blink_forAlteration(false)` to reset.

The `alterationTimer` is lazy-initialized via `mouse_timer_forName('alteration')`.

### Throttle utility

```ts
throttle(key, defer_for = 50, callback)
```

Fires `callback` immediately on first call; suppresses repeat calls for `defer_for` ms. Used in `Hits.handle_mouse_movement_at` for hover detection (60ms) and radial drag (80ms).

### Control click handler (`handle_s_mouseFor_t_control`)

Called on mouse-down only (`s_mouse.isDown`). Dispatches by `T_Control`:

| T_Control | Action |
|---|---|
| `help` | `controls.showHelp_home()` |
| `search` | `search.activate()` |
| `details` | `details.details_toggle_visibility()` |
| (default) | `controls.togglePopupID(t_control)` |

### Drag-dot single-click handler (`handle_singleClick_onDragDot`)

- If bidirectional and root: recurse with `h.rootAncestry`.
- If radial is dragging: no-op.
- Clears `x.w_s_title_edit`.
- If alteration active: `h.ancestry_alter_connectionTo_maybe(ancestry)` + `g.grand_build()`.
- If shift: `ancestry.toggleGrab()`.
- Otherwise: move focus (handling focus-click on focus by going to parent), then `g.grand_build()` or `g.layout()`.

---

## 6. Mouse_Timer.ts

### T_Timer enum

```ts
enum T_Timer {
    repeat = 'repeat',
    double = 'double',
    alter  = 'alter',
    long   = 'long',
}
```

### Timers held per instance

| Field | Type | Purpose |
|---|---|---|
| `autorepeat_start_timer` | `Timeout \| null` | Delay before autorepeat begins |
| `autorepeat_timer` | `Timeout \| null` | The repeating interval |
| `doubleClick_timer` | `Timeout \| null` | Window for second click |
| `alteration_timer` | `Timeout \| null` | Blink interval |
| `longClick_timer` | `Timeout \| null` | Threshold timer |
| `autorepeat_ID` | `number` | ID of active autorepeat session; `-1` when idle |

### Thresholds (from `k.threshold` in `Constants.ts`)

| Key | Value (ms) | Used by |
|---|---|---|
| `autorepeat` | 150 | `setInterval` period for autorepeat ticks |
| `double_click` | 400 | `setTimeout` window for second click |
| `alteration` | 500 | `setInterval` period for blink |
| `long_click` | 800 | `setTimeout` before long-click fires; also delay before autorepeat starts |

### Autorepeat

`autorepeat_start(id, callback)`:
1. Stops any existing autorepeat.
2. Sets `autorepeat_ID = id`.
3. Calls `callback()` immediately (first tick).
4. Starts a `setTimeout(long_click = 800ms)` that, when it fires, starts `setInterval(callback, autorepeat = 150ms)`.

`autorepeat_stop()`:
- Clears both `autorepeat_start_timer` and `autorepeat_timer`.
- Resets `autorepeat_ID = -1`.

`isAutorepeating_forID(id)`: checks if the given ID is the active session.

### Long-click

`timeout_start(T_Timer.long, callback, force_reset?)`:
- Optional `force_reset` clears any existing timer before starting.
- Creates `setTimeout(long_click = 800ms)` that calls `callback()` and nulls itself.
- Idempotent: no-op if timer already running and no force reset.

### Double-click

`timeout_start(T_Timer.double, callback, force_reset?)`:
- Creates `setTimeout(double_click = 400ms)` that calls `callback()` and nulls itself.
- Same idempotency semantics as long-click.

### Alteration blink

`alteration_start(callback: (invert: boolean) => void)`:
- Stops any prior alteration timer.
- Starts `setInterval(alteration = 500ms)`.
- Toggles `invert` boolean on each tick; starts at `true`.

`alteration_stop()`: clears the interval.

### `reset()` (full teardown)

Clears: `doubleClick_timer`, `longClick_timer`, calls `alteration_stop()`, calls `autorepeat_stop()`.

### Instance tracking

`timer_ID` is a unique integer per instance (via static `debug_ID` counter). Used for debugging identity.

---

## 7. Hits.ts

### Overview

`Hits` (singleton `hits`) manages a spatial index of all interactable targets (`S_Hit_Target`), resolves pointer positions to specific targets, and drives click/long-click/double-click/autorepeat state machines.

### Spatial index: rbush

```ts
rbush = new RBush<Target_RBRect>();
```

`Target_RBRect` shape:
```ts
type Target_RBRect = {
    minX: number; minY: number;
    maxX: number; maxY: number;
    target: S_Hit_Target;
}
```

All coordinates are in scaled graph space (pre-divided by `g.w_scale_factor`).

Secondary indexes:
- `targets_dict_byID: Dictionary<S_Hit_Target>` — keyed by `target.id`
- `targets_dict_byType: Dictionary<Array<S_Hit_Target>>` — keyed by `T_Hit_Target` string

### Observable state

| Store | Type | Meaning |
|---|---|---|
| `w_s_hover` | `S_Hit_Target \| null` | Currently hovered target |
| `w_longClick` | `S_Hit_Target \| null` | Target awaiting long-click fire |
| `w_autorepeat` | `S_Hit_Target \| null` | Target currently autorepeating |
| `w_dragging` | `T_Drag` | Current drag mode (`none`, `rubberband`, `widget`, `graph`) |

### Flags

| Flag | Type | Purpose |
|---|---|---|
| `disable_hover` | `boolean` | Set `true` on mouse-down; cleared on mouse-up; suppresses hover detection |
| `longClick_fired` | `boolean` | Prevents mouse-up from also firing after long-click |
| `doubleClick_fired` | `boolean` | Prevents mouse-up from also firing after double-click |

### Target registration

`add_hit_target(target)`:
1. Check `targets_dict_byType[type]`; if an entry with the same `id` exists, delete it first.
2. Insert into `targets_dict_byID` and `targets_dict_byType[type]`.
3. Call `insert_into_rbush(target, this.rbush)`.

This is called automatically from `S_Hit_Target`'s `rect` setter.

`delete_hit_target(target)`:
1. Remove from `targets_dict_byID`.
2. Splice from `targets_dict_byType[type]`.
3. Call `remove_from_rbush(target, this.rbush)`.

`rbush.remove` uses `(a, b) => a.target === b.target` for identity.

### Hover detection

`detect_hovering_at(point)` (private):
1. If `disable_hover`: return false immediately.
2. Query rbush: `targets_atPoint(point)`.
3. Select `targetOf_highest_precedence(matches)`.
4. Call `set_asHovering(match)`.

`set_asHovering(match)`:
- Sets `w_s_hover`.
- If autorepeat is active and hover has left that target: `stop_autorepeat()`.
- If long-click is pending and hover has left that target: `cancel_longClick()`.
- If double-click pending and hover has left that target: `cancel_doubleClick()`.

### Point resolution

`targets_atPoint(point)` (private):
1. rbush spatial query: `rbush.search(point.asBBox)` → all candidates.
2. Filter: `target.contains_point?.(point) ?? true` — runs shape-level refinement if provided.

### Precedence resolution

`targetOf_highest_precedence(matches)` (private):

Priority order:
1. `isADot` — `drag` or `reveal` types
2. `isAWidget` — `widget` type
3. `isRing` — `rotation` or `resizing` types
4. `isAControl` — `control`, `button`, or `glow` types
5. First match (fallback)

### Click/mouse state machine (`handle_s_mouse_at`)

Called from `Events.handle_mouse_down` and `Events.handle_mouse_up` with a resolved scaled point and an `S_Mouse`.

**COMMAND-key override**: if `event.metaKey` and target is not a control, finds a `rubberband` type target and routes directly to it.

**On mouse-down (`s_mouse.isDown`)**:
- Increment `target.clicks`.
- If `respondsTo_autorepeat`: call `handle_s_mouse`, then `start_autorepeat(target)`.
- Else if `respondsTo_longClick`: `start_longClick(target, event)`.
- Else if `respondsTo_doubleClick`:
  - If `target.clicks == 2`: reset clicks, reset click_timer, fire `doubleClick_callback(S_Mouse.double(...))`, clear pending state, set `doubleClick_fired = true`.
  - If `target.clicks == 1`: call `start_doubleClick_timer(target, event)`.
- Else: call `target.handle_s_mouse(s_mouse)`.

**On mouse-up (`s_mouse.isUp`)**:
- `cancel_longClick()`, `stop_autorepeat()`.
- If `longClick_fired` or `doubleClick_fired`: suppress mouse-up, reset both flags, reset clicks.
- Else if not waiting for double-click: reset clicks, call `target.handle_s_mouse(s_mouse)`.
- "Waiting for double-click" = `respondsTo_doubleClick && click_timer.hasTimer_forID(T_Timer.double) && pending_singleClick_target === target`.

### Movement handler (`handle_mouse_movement_at`)

Called from `Events.handle_mouse_move`.

- If not dragging: throttle 60ms → `detect_hovering_at(point)`.
- If in radial mode: throttle 80ms → `radial.handle_mouse_drag()`.
- Radial dragging (`radial.isDragging`): skips hover detection entirely.

### Autorepeat machine

`start_autorepeat(target)`:
1. `stop_autorepeat()`.
2. `w_autorepeat.set(target)`.
3. `autorepeat_timer.autorepeat_start(id, () => target.autorepeat_callback?.())`.

First callback fires immediately; subsequent callbacks fire every 150ms after 800ms delay.

`stop_autorepeat()`: stops timer, sets `w_autorepeat = null`.

### Long-click machine

`start_longClick(target, event)`:
1. `cancel_longClick()`.
2. `w_longClick.set(target)`.
3. `click_timer.timeout_start(T_Timer.long, callback)` with 800ms timeout.
4. On fire: `longClick_fired = true`, reset `target.clicks`, call `target.longClick_callback(S_Mouse.long(...))`, clear `w_longClick`.

`cancel_longClick()`: resets timer, sets `w_longClick = null`.

### Double-click machine

`start_doubleClick_timer(target, event)`:
1. Sets `pending_singleClick_target` and `pending_singleClick_event`.
2. `click_timer.timeout_start(T_Timer.double, callback)` with 400ms timeout.
3. On fire (no second click within threshold): fires `handle_s_mouse(S_Mouse.down(...))` as a deferred single-click, resets clicks, sets `doubleClick_fired = true`, clears pending state.

Note: the deferred single-click fires as `S_Mouse.down`, not `S_Mouse.up`, because the mouse-up already occurred and was suppressed.

`cancel_doubleClick()`: resets timer, clears pending state.

### Recalibration

`recalibrate()`: rebuilds the entire rbush atomically. For every tracked target: calls `target.update_rect()`, then inserts into a fresh `RBush` instance, then swaps: `this.rbush = bush`.

### `reset()`

Clears rbush, stops autorepeat and long-click, sets `w_s_hover = null`, cancels double-click, empties both dicts, resets flags.

### Rubberband support

`rbush_forRubberband` returns a fresh `RBush` containing only `widget`-type targets.
`rbush_forTypes(types)` builds a one-off bush from `targets_forTypes(types)` without mutating the main bush.

---

## Data flow summary

```
DOM event
  → Events (scale, wrap in S_Mouse)
  → hits.handle_s_mouse_at(point, s_mouse)
      → rbush spatial query
      → targetOf_highest_precedence
      → click state machine
          → target.handle_s_mouse(s_mouse)   [normal click]
          → target.longClick_callback(...)   [long click]
          → target.doubleClick_callback(...) [double click]
          → target.autorepeat_callback()     [autorepeat tick]

mousemove
  → Events.handle_mouse_move
  → hits.handle_mouse_movement_at(point)
      → throttled detect_hovering_at
          → rbush query + shape refine
          → hits.w_s_hover updated
          → side effects: cancel pending long/double/autorepeat on leave

alteration state change (x.w_s_alteration)
  → Events.handle_s_alteration
  → Mouse_Timer.alteration_start/stop
  → signals.signal_blink_forAlteration(invert) [every 500ms]
  → signal_emitter.emit(T_Signal.alteration, priority, invert)
  → each subscribed S_Component.onSignal handler

keyboard / action button
  → Events.handle_key_down / handle_action_clickedAt
  → direct method calls on h, g, ancestry, search, controls
  → typically triggers signals.signal_rebuildGraph_from / signal_reattach / signal_reposition
```
