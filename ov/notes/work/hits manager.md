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

## id naming rules

Every target says its own name, and the manager keeps one target per name — a repeat throws the
older one away, leaving a control that answers nothing. So the names have to be unique across
whatever is on screen at once.

**`where.what[.which]`** — lowercase, dots between.

- **where** — the drawing that owns it, in the app's own word: `controls`, `browse`, `editor`,
    `list`, `filters`, `search`, `status`, `report`, `builds`.
- **what** — the control, in the word already on screen or in its own class: `controls.hamburger`,
    `editor.delete`, `filters.fold.tags`, `list.folders`.
- **which** — added only where more than one of the same thing can show at once, and taken from
    something the thing already owns: a guide's address, a tag area's name, a row's line number.
    Never a running count — a narrowed list renumbers, and every name would move.

A pair of steppers is handed its own `where.what` by whoever draws it; the pair adds `.back` and
`.forward` itself.

Every set of segments holds many at once, so each takes a third part from what it already is:

- `list.picking.any` / `.all` / `.but` — the three ways of narrowing
- `list.picking.clear` / `.invert`, and `editor.picking.clear` / `.invert`
- `list.project.<name>` — one per project
- `list.kind.<name>` — one per kind, the unlabeled one included
- `editor.kind.<name>` — the editor's own six
- `pill.<area>.<tag>` — one per tag inside an area

The soft pointers in a file's own words are the third kind of target, so their **where** is `page`:

- `page.fold.<line>` — the pointer beside the heading that begins on that line of the file. A
    piece's place in the run is a count and moves when a fold changes what is drawn; the line it
    begins on does not, and every drawn piece already carries it. One file is open at a time, so
    nothing names the file.
- `page.fold.all` — the top heading's own pointer, which folds every section at once and belongs
    to no one section.
- `page.task.<line>` — a thing to be done that holds a list of its own. Same mark, different job,
    so it takes its own word.

The manager says so in the log when a name repeats. That is the whole guard: a test cannot see
names written across the drawings.

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

## implement for segments

Twelve of them, in four sets: the three that say how the picked tags narrow, the projects, the
kinds twice over, and the tags inside a pill. Plus four presses standing among them — clear and
invert, in the list and in the editor — and the six kind picks in the editor's own form.

Every one is a `<button>` already carrying its own press, its own hint and a `:hover` rule, so the
same four steps a plain button took apply unchanged. Three things are different.

### 1. a segment has a state, and a press has none

A picked segment wears `current` and answers nothing — `cursor: default`, and the fill it takes is
the accent rather than the hover. So its fill under the cursor is already written as "not picked,
not empty": `.segment:not(.current):not(.empty):hover`. That becomes `[data-hit]` in the same
shape, and the picked one keeps its own rule.

The presses among them (clear, invert) also take a stronger fill while held — `:active`. Nothing
in the manager says "held right now"; the target hears the press and the release and nothing
between. Either a second stamp is added for that, or the stronger fill goes.

### 2. a segment that would empty the list answers nothing

A segment wearing `empty` is grayed and dead. A dead one still needs a rectangle — it stands in the
run and the ones beside it must not answer for its space — so it registers with no press and no
words, the same way a dead step mark does.

### 3. names

Every set holds many at once, so each takes its own third part. The names are in the id naming
rules above.

### what has to be told

A tag area opening slides its neighbors along the row over the whole of a slide, so every rectangle
in that row is wrong until it settles. The row already measures itself when the picks change and
when it changes shape; that is where the manager is told, once the sliding stops.

## implement for soft pointers

Every other control is written in the markup, so the action can be put on it. A soft pointer is
not: the app builds each one in code and pushes it into the drawn page, then throws every one away
and builds them again whenever a fold moves or the words change.

### 1. one place makes them, so one place wires them

`one_mark` already takes the words and the press. It gains the name, and inside it makes the
target, hands over the element, watches the manager's hover to stamp the element, and drops its own
press listener. The `:hover` rule on a mark becomes a `[data-hit]` rule.

### 2. unmaking is the part this has to do by hand

The action does its own tidying when its element goes; a mark made in code has nobody to do that.
Every mark is thrown away and built afresh on each fold, so the line that clears them must also
take each target out of the manager and stop its watching. Otherwise every fold leaves a dead
rectangle standing where a mark used to be, still answering the cursor. One list, held beside the
marks, saying what to undo.

### 3. two things to settle first

A press on a mark stops the press reaching the words behind it, since a press on those words opens
that piece for changing. The manager hands a press to one target only, so that stopping is no
longer needed — but only once the words themselves are a target, and they are not one yet.

In the editor's file content area scrolling calls `hits.recalibrate`.

## implement for md blocks

Each piece of a drawn file — a paragraph, a heading, a list, a code block — answers a press by
opening in a box holding the file's own words for those lines. That press is watched by the whole
words area at once rather than by each piece, and which piece was pressed is worked out from what
the press landed on.

### the proposal

- **Each outermost piece becomes a target of its own**, named `page.block.<line>` by the line it
    begins on — the number it already carries. A press on it opens that piece.
- **The words area keeps one target of its own**, `page.words`, standing behind them all. It is the
    section kind rather than the control kind, so a piece always wins the press; what reaches the
    area itself is a press on the gap between pieces, which is what closes an open box.
- **Nothing inside a piece is a target.** A link is answered by the browser, and a thing to be done
    has its own box beside it — both stand inside the piece and would take the press from it. They
    keep watching for themselves until each is given a target of its own.
- **The targets are made where the marks are.** The same walk that puts a soft pointer beside a
    heading knows every piece and its line, so both are made and unmade together, in one list.

### what a block has to tell the manager

The words scroll, so the box holding them says so on every scroll — the same one line the list
carries. Opening a piece for changing swaps its height, which moves every piece below it: that is
told once the box is drawn.

## implement for a section

hit empty space is obsolete, just prioritize controls over sections and page