---
kind: design
title: "hits manager"
description: ""
tags: [active]
date: 2026-08-12
---
# hits manager

## break it down

- [ ] store
- [ ] other larger footprint
    - [ ] 
- [ ] hovering, fade
    - [ ] section
    - [ ] subsection
    - [ ] clickable title
    - [ ] button
    - [ ] row
    - [ ] segmented control
- [ ] clicks — ?

## implement for a control — button

### 1. feed the mouse in, once, at the top of the app

Nothing does this yet. Without it no target ever hears anything.

```svelte
<svelte:window
    onmousemove={(e) => hits.handle_mouse_movement_at(new Point(e.clientX, e.clientY))}
    onmousedown={(e) => hits.handle_s_mouse_at(new Point(e.clientX, e.clientY), S_Mouse.down(e, null))}
    onmouseup={(e)   => hits.handle_s_mouse_at(new Point(e.clientX, e.clientY), S_Mouse.up(e, null))} />
```

### 2. in the button's svelte file, make its target once and hand over the element

```svelte
const target = new S_Hit_Target(T_Hit_Target.control, 'dispatcher');
target.handle_s_mouse = (s_mouse) => { if (s_mouse.isUp) { restart(); } return true; };

let element = $state<HTMLElement | null>(null);
$effect(() => { target.set_html_element(element); });
```

`set_html_element` measures the rectangle and registers it. Nothing else registers it.

### 3. draw it, and read its hover from the one place

```svelte
<button bind:this={element} class:lit={$w_s_hover?.hasSameID_as(target)}>dispatcher</button>
```

Its own `onclick`, `onmouseenter` and `:hover` rule all go — that is the point.

### 4. two things it has to be told

- Anything that moves or resizes: `hits.recalibrate()`, or `hits.defer_recalibrate()` to wait for the drawing first.
- The button leaving the screen: `hits.delete_hit_target(target)`.

The rectangle is measured once and remembered; nothing re-measures on its own.

## implement for a section

