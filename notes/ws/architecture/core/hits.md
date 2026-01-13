# Hits Design

Only one element in the app can react to the mouse. The **Hits** spatial index knows which one. It's the **single source of truth** for hover and click dispatch. Consistent behavior everywhere.

For timing logic (autorepeat, long-click, double-click), see [timers.md](../internals/timers.md).

## Table of Contents
- [Overview & Status](#overview--status)
  - [Overview](#overview)
  - [Status](#status)
  - [Benefits](#benefits)
- [Architecture](#architecture)
  - [Hits Manager](#hits-manager)
  - [Click Detection Flow](#click-detection-flow)
  - [S_Hit_Target](#s_hit_target)
  - [Component Pattern](#component-pattern)
  - [S_Mouse](#s_mouse)
- [Migration Guide](#migration-guide)
  - [Step 1: Add S_Element](#step-1-add-s_element-for-components-without-one)
  - [Step 2: Set handle_s_mouse](#step-2-set-handle_s_mouse-for-components-with-existing-s_element)
  - [Step 3: Remove DOM handlers](#step-3-remove-dom-handlers)
- [Component Status](#component-status)
  - [Migrated](#migrated-)
  - [Pending](#pending)
- [Rubberband](#rubberband)
- [Testing](#testing)
  - [Setup](#setup)
  - [Terms](#terms)
  - [Regression](#regression)
- [Reference](#reference)
  - [Hit Target Type Getters](#hit-target-type-getters)
  - [Component Complexity](#component-complexity)

---

## Overview & Status

### Overview

Centralized click handling using the Hits spatial index to dispatch `handle_s_mouse` to the component under the mouse. Eliminates per-component DOM event handlers.

### Status

- [x] **Complete** — Core hit detection and dispatch
- [x] **Complete** — All mouse timing centralized (see [timers.md](../internals/timers.md))
- [ ] Remaining work
  - [ ] `Search_Results.svelte` — complex (dynamic rows, may be too granular)
  - [ ] breadcrumb button — not yet migrated to centralized autorepeat
  - [ ] close button — does not yet use Button

### Benefits

- **Single source of truth**: one manager dispatches all clicks and hover
- **Consistent precedence**: dots > widgets > rings > controls > rubberband
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
2. Select topmost target using priority: dot → widget → ring → control → other
3. Invoke `target.handle_s_mouse(s_mouse)` if defined
4. Hits handles timing centrally (see [timers.md](../internals/timers.md))

```
mousedown → Events.ts → hits.handle_click_at(point, s_mouse)
                              ↓
                     targets_atPoint(point)
                              ↓
                     select topmost target
                              ↓
                     target.handle_s_mouse(s_mouse)
```

### S_Hit_Target

The superclass of all element and component UX state objects (`S_Element` and `S_Component`).

#### Hit Rect

Hits uses a highly performant RBush index that takes a mouse position (x, y) and returns hit targets enclosing that point. Each hit target is assigned a rect. The rect must be kept current — updated when graph is altered or details toggled.

**Registration:**

The `rect` setter **always** calls `hits.add_hit_target(this)` unconditionally:
```ts
set rect(value: Rect | null) {
    this.element_rect = value;
    hits.add_hit_target(this);  // Always called
}
```

**Clipping:**

Hit rects for graph elements (dots, widgets, rings) are clipped to the visible graph view:
```ts
update_rect() {
    if (!!this.html_element) {
        let rect = g.scaled_rect_forElement(this.html_element);
        if (rect && (this.isADot || this.isAWidget || this.isRing)) {
            const graph_bounds = get(g.w_rect_ofGraphView);
            if (graph_bounds) {
                rect = rect.clippedTo(graph_bounds);
            }
        }
        this.rect = rect;
    }
}
```

#### Click Handler

Optional `handle_s_mouse` method:
```ts
handle_s_mouse?: (s_mouse: S_Mouse) => boolean;
```

### Component Pattern

Components register a handler on their hit target:
```ts
s_element.handle_s_mouse = (s_mouse: S_Mouse): boolean => {
    // handle click, return true if consumed
    return handle_s_mouse(s_mouse);
};
```

DOM `on:mouse*` handlers are removed — only centralized `Events.ts` listeners remain.

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

**Deprecated patterns:**

| Old | New |
|----|-----|
| `elements.s_mouse_forName(name)` | Fresh `S_Mouse` instances each time |
| `S_Mouse.clicks` | `S_Hit_Target.clicks` |
| `detect_autorepeat` boolean | `mouse_detection` enum |

---

## Migration Guide

### Step 1: Add S_Element (for components without one)

```ts
const s_element = elements.s_element_for(new Identifiable(name), T_Hit_Target.button, name);
let element: HTMLElement;

onMount(() => {
    s_element.set_html_element(element);
    s_element.handle_s_mouse = handle_s_mouse;
});

onDestroy(() => {
    hits.delete_hit_target(s_element);
});
```

```svelte
<div bind:this={element}>...</div>
```

### Step 2: Set handle_s_mouse (for components with existing S_Element)

```ts
s_element.handle_s_mouse = (s_mouse: S_Mouse): boolean => {
    return handle_s_mouse(s_mouse);
};
```

### Step 3: Remove DOM handlers

```diff
- on:pointerdown={handle_pointerDown}
- on:pointerup={handle_pointerUp}
```

---

## Component Status

### Migrated ✅

| Component | Notes |
|-----------|-------|
| `Button.svelte` | S_Element + handle_s_mouse, supports all timing modes |
| `Glow_Button.svelte` | S_Element + handle_s_mouse + hover via hits |
| `Next_Previous.svelte` | Array of S_Elements for multiple buttons |
| `Widget_Title.svelte` | s_title + s_widget handle_s_mouse |
| `Radial_Rings.svelte` | s_rotation + s_resizing handle_s_mouse |
| `Cluster_Pager.svelte` | s_pager handle_s_mouse for thumbs |
| `Radial_Cluster.svelte` | s_paging handle_s_mouse for paging arcs |
| `Rubberband.svelte` | Catch-all for empty graph space |
| `Close_Button.svelte` | Fixed handler setup and RBush entry management |
| `Widget_Drag.svelte` | Responds on `isDown` |
| `Widget_Reveal.svelte` | Responds on `isDown` |
| `Segmented.svelte` | Changed to `on:mousedown` |
| `Breadcrumb_Button.svelte` | Responds on `isDown` |
| `D_Actions.svelte` | All actions autorepeat |
| `Steppers.svelte` | Passed to `Triangle_Button` |
| `Triangle_Button.svelte` | Wraps Button |
| `Buttons_Row.svelte` | Uses Button |
| `Buttons_Table.svelte` | Uses `Buttons_Row` |

### Pending

| Component | Issue |
|-----------|-------|
| `Search_Results.svelte` | Each row would need its own S_Element — too granular |

---

## Rubberband

Rubberband handles clicks on "empty" graph space. Registers directly as a catch-all hit target instead of Graph.svelte delegating.

**Why Rubberband, not Graph?**
- Rubberband actually needs the click
- Graph just passes through — unnecessary middleman
- Rubberband already has `bounds` prop

**Implementation:**

```ts
const s_element = elements.s_element_for(new Identifiable('rubberband'), T_Hit_Target.rubberband, 'graph');

onMount(() => {
    s_element.set_html_element(rubberband_hit_area);
    s_element.handle_s_mouse = handle_s_mouse;
});
```

```svelte
<div class='rubberband-hit-area' bind:this={rubberband_hit_area}
     style='position:absolute; top:0; left:0; width:{bounds.size.width}px; height:{bounds.size.height}px; pointer-events:none;'/>
```

Meta key forces rubberband target for graph dragging.

---

## Testing

### Setup

All tests assume a **widget is selected** in the graph or list view.

### Terms

| Term | Definition |
|------|------------|
| **details panel** | Stack of buttons opening panels. Tap details toggle (three bars, top left) to show. |
| **actions panel** | Details panel showing action buttons in seven categories. |
| **re-render** | Svelte destroys/recreates component. `S_Hit_Target` persists. |

### Regression

1. **Normal-click buttons work normally**
   - [x] Single click works, no delays or repeats
   - [x] breadcrumbs — fixed (responds on `isDown`)
   - [x] details toggle — fixed (responds on `isDown`)
   - [x] search — fixed (handler setup improved)
   - [x] close search — fixed (handler setup, removed stale RBush entries)
   - [x] widget drag/reveal buttons — fixed (respond on `isDown`)
   - [x] segmented controls — fixed (changed to `on:mousedown`)

For timing tests (autorepeat, double-click, long-click), see [timers.md](../internals/timers.md#testing).

---

## Reference

### Hit Target Type Getters

| Getter | Includes |
|--------|----------|
| `isAControl` | `T_Hit_Target.control`, `T_Hit_Target.button` |
| `isAWidget` | `T_Hit_Target.widget`, `T_Hit_Target.title` |
| `isRing` | `T_Hit_Target.ring`, `T_Hit_Target.paging` |
| `isADot` | `T_Hit_Target.dot` |

### Component Complexity

| Component | Notes |
|-----------|-------|
| `Rubberband.svelte` | Catch-all, lowest priority |
| `Search_Results.svelte` | Too granular for per-row S_Element |
| `Breadcrumb_Button.svelte` | Dual state: `S_Widget` for colors, separate `S_Element` for hit target |
