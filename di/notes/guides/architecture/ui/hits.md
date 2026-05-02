# Hits Design

Only one element in the app can react to the mouse. The **Hits** spatial index knows which one. It's the **single source of truth** for hover and click dispatch. Consistent behavior everywhere.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
  - [Hits Manager](#hits-manager)
  - [Click Detection Flow](#click-detection-flow)
  - [S_Hit_Target](#s_hit_target)
  - [use:hit_target Action](#usehit_target-action)
  - [S_Mouse](#s_mouse)
- [Patterns](#patterns)
  - [Hover Detection in Components](#hover-detection-in-components)
  - [Component Pattern](#component-pattern)
- [Reference](#reference)
  - [Hit-target types](#hit-target-types)

---

## Overview

Centralized click handling using the Hits spatial index to dispatch `handle_s_mouse` to the component under the mouse. Eliminates per-component DOM event handlers.

**Benefits:**

- **Single source of truth**: one manager dispatches all clicks and hover
- **Consistent precedence**: controls > banners > graph elements
- **Cleaner components**: register handler, receive callbacks
- **Consistent behavior**: all hovering and clicking works the same way

---

## Architecture

### Hits Manager

The manager is the single point of truth regarding which element is reactive to hover and click. It uses the bounding rects of ALL registered elements to determine which one contains the current mouse position. It then calls `handle_s_mouse` on that element for mouse up and down events, and sets `hits.w_s_hover` for mouse entering or leaving the bounding rect.

Some elements have a shape very different than a rectangle. `S_Hit_Target` provides an optional hook that can refine the enter/leave boundary.

### Click Detection Flow

On `mousedown`/`mouseup` at the document level (Events.ts):
1. Call `hits.targets_atPoint(point)` to find targets under cursor
2. Select topmost target using priority: control > banner > graph > other
3. Invoke `target.handle_s_mouse(s_mouse)` if defined
4. Hits handles timing centrally for autorepeat, long-click, double-click

```text
mousedown → Events.ts → hits.handle_s_mouse_at(point, s_mouse)
                              ↓
                     targets_atPoint(point)
                              ↓
                     select topmost target
                              ↓
                     target.handle_s_mouse(s_mouse)
```

### S_Hit_Target

The superclass of all element and component UX state objects.

#### Hit Rect

Hits uses a highly performant RBush index that takes a mouse position (x, y) and returns hit targets enclosing that point. Each hit target is assigned a rect. The rect must be kept current — updated when layout changes.

**Registration:**

The `rect` setter **always** calls `hits.add_hit_target(this)`:
```ts
set rect(value: Rect | null) {
    this.element_rect = value;
    hits.add_hit_target(this);
}
```

#### ID Prefixing

The constructor prefixes the id with the target type:
```ts
constructor(type: T_Hit_Target, id: string) {
    this.id = type + '-' + id;
    this.type = type;
}
```

This means if you pass `id: 'close-button'` with `type: T_Hit_Target.control`, the stored id becomes `"control-close-button"`. Any external comparison against `w_s_hover?.id` must account for this prefix.

#### Click Handler

Optional `handle_s_mouse` method:
```ts
handle_s_mouse?: (s_mouse: S_Mouse) => boolean;
```

### use:hit_target Action

The Svelte action in `Hit_Target.ts` is the standard way to register hit targets. It handles everything: creates `S_Hit_Target`, wires callbacks, registers the element rect, subscribes to hover, and cleans up on destroy.

**Configuration:**
```ts
use:hit_target={{ id: 'some-id', onpress: fn, onrelease: fn, onlong: fn, ondouble: fn, onautorepeat: fn, hoverCursor: '...', type: T_Hit_Target.control }}
```

Only `id` is required. `type` defaults to `T_Hit_Target.control`.

**What it does on mount:**
1. Creates `S_Hit_Target(type, id)` — prefixes the id as `type + '-' + id`
2. Wires callbacks: sets `mouse_detection` flags based on which callbacks are provided, wires `handle_s_mouse` to call `onpress`/`onrelease`
3. Calls `target.set_html_element(element)` — grabs bounding rect, inserts into rbush

**On update:** re-wires callbacks and recalculates the rect.

**On destroy:** unsubscribes from `w_s_hover` and calls `hits.delete_hit_target`.

**Do not mix with manual S_Hit_Target.** Using both `use:hit_target` and a manually created `S_Hit_Target` on the same element creates two targets — the action's target gets a double-prefixed id and the manual target's cleanup won't cover the action's target. Pick one approach.

### Click timing — long click, double click, autorepeat

The dispatch flow above runs once per mouse-down or mouse-up. Three other things can happen on top of a normal click, all driven by timers that the manager owns. The thresholds that govern them all live in one place.

Citation: thresholds at `src/lib/ts/common/Constants.ts` lines 79-82.

- **Autorepeat** — used by buttons that should keep firing while held. Eight hundred milliseconds after the press starts, the manager begins firing the autorepeat callback every one hundred and fifty milliseconds. The release stops it; moving the mouse off the target stops it; mousing onto a different target also stops it.
- **Long click** — fires once, eight hundred milliseconds after the press, on targets that registered a long-click callback. After it fires the click count resets, so the release does not also fire a press.
- **Double click** — when a target carries both a single-click handler and a double-click handler, the manager waits four hundred milliseconds before delivering the single click. A second press inside the window cancels the wait and fires the double click instead.
- **Alteration** — used by sticky-mode buttons that need to toggle a state every five hundred milliseconds while a condition holds. Less common; lives in the same timer.

Citation: timer wiring at `src/lib/ts/events/Mouse_Timer.ts` (the four timer types, the autorepeat start with its long-click warm-up, the timeout-start helper); manager calls at `src/lib/ts/events/Hits.ts` lines 256-322 (the start, cancel, and stop helpers for each).

### S_Mouse

A **transient value object** encapsulating current mouse-relevant information:

- **What happened**: `isDown`, `isUp`, `isLong`, `isDouble`, `isRepeat`, `isMove`
- **Where**: `element` (the target HTMLElement)
- **Raw data**: `event` (the original MouseEvent)

Static factories:
```ts
S_Mouse.down(event, element)    // user pressed
S_Mouse.up(event, element)      // user released
S_Mouse.long(event, element)    // held past threshold
S_Mouse.double(event, element)  // second click within threshold
S_Mouse.repeat(event, element)  // autorepeat tick
```

---

## Patterns

### Hover Detection in Components

When a component needs to react to hover on its own `use:hit_target`, build the expected id the same way the constructor does:

```ts
const isHovering = $derived($w_s_hover?.id === T_Hit_Target.control + '-' + name);
```

Do **not** create a separate `S_Hit_Target` instance just to get the id — that registers a second target in the rbush.

### Component Pattern

Components register a handler on their hit target:
```ts
s_element.handle_s_mouse = (s_mouse: S_Mouse): boolean => {
    return handle_s_mouse(s_mouse);
};
```

DOM `on:mouse*` handlers are removed — only centralized `Events.ts` listeners remain.

---

## Reference

### Hit-target types

The hit-target enum carries three values:

- `T_Hit_Target.control` — the default for buttons and clickable rows.
- `T_Hit_Target.banner` — folding-section header pills.
- `T_Hit_Target.graph` — the canvas itself.

Citation: `src/lib/ts/types/Enumerations.ts` lines 3-7.
