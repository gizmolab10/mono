---
kind: specify
title: "hits manager"
description: "The hits manager after two faults were mended: what went wrong, why it went unseen, and the one danger left."
tags: [program, soon]
date: 2026-08-12
---
# hits manager

## elements to alter

- [ ] section
- [ ] clickable title
- [ ] button
- [ ] row
- [ ] segmented control
- [ ] input
- [ ] md block

## id naming rules

Every target says its own name, and the manager keeps one target per name — a repeat throws the older one away, leaving a control that answers nothing. So the names have to be unique across whatever is on screen at once.

**`where.what[.which]`** — lowercase, dots between.

- **where** — the drawing that owns it, in the app's own word: `controls`, `browse`, `editor`,
    `list`, `filters`, `search`, `status`, `report`, `builds`.
- **what** — the control, in the word already on screen or in its own class: `controls.hamburger`,
    `editor.delete`, `filters.fold.tags`, `list.folders`.
- **which** — added only where more than one of the same thing can show at once, and taken from
    something the thing already owns: a guide's address, a tag area's name, a row's line number.
    Never a running count — a narrowed list renumbers, and every name would move.

A pair of steppers is handed its own `where.what` by whoever draws it; the pair adds `.back` and `.forward` itself.

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

The manager says so in the log when a name repeats. That is the whole guard: a test cannot see names written across the drawings.

## implementation

### implement for a control — button

#### 1. feed the mouse in, once, at the top of the app

Nothing does this yet. Without it no target ever hears anything.

```svelte
<svelte:window
    onmousemove={(e) => hits.handle_mouse_movement_at(new Point(e.clientX, e.clientY))}
    onmousedown={(e) => hits.handle_s_mouse_at(new Point(e.clientX, e.clientY), S_Mouse.down(e, null))}
    onmouseup={(e)   => hits.handle_s_mouse_at(new Point(e.clientX, e.clientY), S_Mouse.up(e, null))} />
```

#### 2. in the button's svelte file, make its target once and register the element

```svelte
const target = new S_Hit_Target(T_Hit_Target.control, 'dispatcher');
target.handle_s_mouse = (s_mouse) => { if (s_mouse.isUp) { restart(); } return true; };

let element = $state<HTMLElement | null>(null);
$effect(() => { target.set_html_element(element); });
```

`set_html_element` measures the rectangle and registers it. Nothing else registers it.

#### 3. draw it, and read its hover from the one place

```svelte
<button bind:this={element} class:lit={$w_s_hover?.hasSameID_as(target)}>dispatcher</button>
```

Its own `onclick`, `onmouseenter` and `:hover` rule all go — that is the point.

#### 4. two things it has to be told

- Anything that moves or resizes: `hits.recalibrate()`, or `hits.defer_recalibrate()` to wait for the drawing first.
- The button leaving the screen: `hits.delete_hit_target(target)`.

The rectangle is measured once and remembered; nothing re-measures on its own.

### implement for segments

Twelve of them, in four sets: the three that say how the picked tags narrow, the projects, the kinds twice over, and the tags inside a pill. Plus four presses standing among them — clear and invert, in the list and in the editor — and the six kind picks in the editor's own form.

Every one is a `<button>` already carrying its own press, its own hint and a `:hover` rule, so the same four steps a plain button took apply unchanged. Three things are different.

#### 1. a segment has a state, and a press has none

A picked segment wears `current` and answers nothing — `cursor: default`, and the fill it takes is the accent rather than the hover. So its fill under the cursor is already written as "not picked, not empty": `.segment:not(.current):not(.empty):hover`. That becomes `[data-hit]` in the same structure, and the picked one keeps its own rule.

The presses among them (clear, invert) also take a stronger fill while held — `:active`. Nothing in the manager says "held right now"; the target hears the press and the release and nothing between. Either a second stamp is added for that, or the stronger fill goes.

#### 2. a segment that would empty the list answers nothing

A segment wearing `empty` is grayed and dead. A dead one still needs a rectangle — it stands in the run and the ones beside it must not answer for its space — so it registers with no press and no words, the same way a dead step button does.

#### 3. names

Every set holds many at once, so each takes its own third part. The names are in the id naming rules above.

#### what has to be told

A tag area opening slides its neighbors along the row over the whole of a slide, so every rectangle in that row is wrong until it settles. The row already measures itself when the picks change and when it changes shape; that is where the manager is told, once the sliding stops.

### implement for soft pointers

Every other control is written in the markup, so the action can be put on it. A soft pointer is not: the app builds each one in code and pushes it into the drawn page, then throws every one away and builds them again whenever a fold moves or the words change.

#### 1. one place makes them, so one place wires them

`one_mark` already takes the words and the press. It gains the name, and inside it makes the target, registers the element, watches the manager's hover to stamp the element, and drops its own press listener. The `:hover` rule on a mark becomes a `[data-hit]` rule.

#### 2. unmaking is the part this has to do by hand

The action does its own tidying when its element goes; a mark made in code has nobody to do that. Every mark is thrown away and built afresh on each fold, so the line that clears them must also take each target out of the manager and stop its watching. Otherwise every fold leaves a dead rectangle standing where a mark used to be, still answering the cursor. One list, held beside the marks, saying what to undo.

#### 3. two things to settle first

A press on a mark stops the press reaching the words behind it, since a press on those words opens that piece for changing. The manager hands a press to one target only, so that stopping is no longer needed — but only once the words themselves are a target, and they are not one yet.

In the editor's file content area scrolling calls `hits.recalibrate`.

### implement for md blocks

Each piece of a drawn file — a paragraph, a heading, a list, a code block — answers a press by opening in a box holding the file's own words for those lines. That press is watched by the whole words area at once rather than by each piece, and which piece was pressed is worked out from what the press landed on.

#### the proposal

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

#### what a block has to tell the manager

The words scroll, so the box holding them says so on every scroll — the same one line the list carries. Opening a piece for changing swaps its height, which moves every piece below it: that is told once the box is drawn.

### implement for a section

hit empty space is obsolete, just prioritize controls over sections and page

## Post-mortem

### Improvements and not-so-greats

1. **Size: it costs more lines than it saved.** The manager and its four companions are 711 lines. What went was one 79-line rule and its 63-line test, plus roughly one handler, one hint and one hover rule from each of 62 controls — call it 150 lines of markup and styling. The trade is about 700 lines added for 300 removed.
2. **Clutter: each control got smaller and more alike.** 62 things now say one thing — their name, what a press does, and their words. `use:tip` is down to 2 uses from 49; `:hover` is down to 4 from about 40, and 34 rules read the stamp instead. Every `event.stopPropagation()` in a control went, because a press reaches one thing.
3. **Complexity: one question replaced many.** Before, "what is under the cursor" was answered by the browser for the fill, by a walk up the page for the press, by a third watcher for the hint — three answers that disagreed, which is what the fill-lit-everywhere and press-worked-nowhere bug was. It is one answer now, and its precedence is written down and testable.

The honest cost: rectangles are measured once and remembered, so eight places must now say when something moves — and every fault this session came from one of them being missed.

### Loss of performance

three places. I have not measured frame time — the analysis is from reading the code.

1. **Every mouse move wakes every target.** The hovered target is written to a store on each move with no guard against it being the same one — `this.w_s_hover.set(!match ? null : match);` at [Hits.ts:268](../../../src/lib/ts/events/Hits.ts#L268) — and each target subscribes to that store to stamp its own element ([Hit_Target.ts:36](../../../src/lib/ts/events/Hit_Target.ts#L36)). With roughly 75 targets on screen that is ~75 callbacks and DOM attribute calls per move, where the browser's own `:hover` cost nothing. **One guard fixes it**: return early when the match is the one already held.
2. **Scrolling re-measures everything.** `recalibrate` builds a new tree and reads every target's rectangle — [Hits.ts:149-159](../../../src/lib/ts/events/Hits.ts#L149-L159) — and it runs on every scroll event of the list ([Files.svelte:207](../../../src/lib/svelte/content/Files_List.svelte#L207)) and of the file's words ([Markdown_Editor.svelte:867](../../../src/lib/svelte/content/Markdown_Editor.svelte#L867)). Each rectangle read forces the browser to settle layout. This is the heaviest thing in the change.
3. **Arriving costs N².** Each target asks for a full rebuild one drawing after it mounts — [Hit_Target.ts:78](../../../src/lib/ts/events/Hit_Target.ts#L78) — so opening a list of 40 rows runs 40 rebuilds of 40 rectangles each. One rebuild for the whole batch would do.

The gains are small by comparison: about 120 fewer element-level listeners, and one hit test where there used to be three answers.

### Proposal — reduce the losses

three changes, each in one place.**

1. **Say the hover only when it changes.** `set_asHovering` returns early when the match is the one already held — [Hits.ts:267](../../../src/lib/ts/events/Hits.ts#L267). Every move across one control then wakes nothing; a move between two wakes the whole set once. Cheapest of the three, and it needs no other change.

2. **One rebuild per batch, not one per target.** `defer_recalibrate` sets a flag and returns if a rebuild is already waiting; the waiting one clears it — [Hits.ts:143](../../../src/lib/ts/events/Hits.ts#L143). Forty rows arriving then cost one rebuild rather than forty. **The catch:** callers that want a rebuild _after_ something they are about to do still get one, since the flag clears when it runs.

3. **Scrolling moves rectangles by a known amount, so nothing needs re-measuring.** A scroll shifts everything in that box by the distance scrolled; the manager could shift those targets' rectangles rather than reading each one from the browser. **The catch:** it has to know which targets sit in which scrolling box, which nothing tracks today. The plain alternative is to keep re-measuring but only once per drawing — hold the scroll handler's request until the next frame, so a fast scroll costs one rebuild rather than one per event.

**Order.** 1 and 2 are small and independent. 3's plain form is small too; its exact form is a piece of work on its own. Say which.

### Re-analyze performance

All three were made. Read from the code, not profiled.

1. **Steady hovering is now a wash or slightly better.** Per move: one search of the structure, then nothing at all unless the answer changed. What went the other way was heavier — the old code walked up the page building a list of class names on every move, in four places. The browser's own `:hover` was free; that walk was not.
2. **Two costs remained, both real.** A hover _change_ still woke every target, since each one listened to the store itself — so crossing from one control to the next ran ~75 callbacks where two elements changed. And scrolling still rebuilt every rectangle once a frame, where before it measured nothing at all.
3. **Net at that point:** better than before the three changes, still a loss against the old per-control wiring while scrolling, and even the rest of the time.

### Second proposal

Two more, each in one place. Both were made.

1. **The manager stamps the two elements that changed.** It knows which target the cursor left and which it reached, so it takes the stamp off one and puts it on the other — and nothing listens for the hovered target any more. A hover change costs two attribute calls rather than one per target. The three places that clear the hover by hand all go through the same one line, so a target going while the cursor is on it leaves no stamp standing.
2. **A scroll moves rectangles by the distance scrolled.** The box says how far it went; every target inside it is shifted by exactly that, and nothing is read from the browser. Asking which targets are inside walks up from each element, which costs nothing — unlike reading a rectangle, which makes the browser settle its layout first. The two scrolling boxes each remember where they last told the manager they stood.

**What is left.** A watcher that fires many times over — a run of tags re-wrapping, the list's own box resizing — still asks for a full rebuild, held to one per frame. That is the last place a rectangle is read for anything but a real change of shape.

### More changes

Both plain fixes are in. 356 tests pass, 0 type errors.

1. **The manager stamps the two elements that changed** — [Hits.ts:283-286](../../../src/lib/ts/events/Hits.ts#L283-L286). Nothing listens for the hovered target any more, so a hover change costs two attribute calls instead of one per target. Clearing the hover, resetting, and a target going while the cursor is on it all run through that same line.
2. **A scroll shifts rectangles by the distance scrolled** — [Hits.ts:181-192](../../../src/lib/ts/events/Hits.ts#L181-L192), asked by the list ([Files.svelte:209-217](../../../src/lib/svelte/content/Files_List.svelte#L209-L217)) and the file's words ([Markdown_Editor.svelte:66-72](../../../src/lib/svelte/content/Markdown_Editor.svelte#L66-L72)). Nothing is read from the browser; asking which targets are inside a box walks up from each element, which forces no layout.

## the risk

Every rectangle is measured once and remembered. The manager never looks at the page to answer a question — it answers from what it was last told. The whole design rests on one thing: every part of the app that moves something must say so.

**That is the true price, not the milliseconds.** All three faults in the wiring session were this one fault wearing different clothes:

- a run of tags measured before the browser had laid it out, so four areas' tags claimed one strip
- a shut area's tags keeping their full size inside a box of no width, holding places on the page
    they could not be seen on
- a folder's triangle handing its press to the manager while the row behind it went on firing its
    own, since nothing told the row

**What makes it dangerous.** A stale rectangle looks like nothing at all. The screen is drawn correctly, the checker is silent, the tests pass — and a control simply answers for a strip of the page it no longer occupies, or stops answering for the one it does. Nothing points at the cause; the only way in is to make the app say what it found at the point pressed.

**What holds it down today.** Eleven places say when something moves: a word moved onto a line, a fold, a tag area settling, two scrolling boxes, three watchers, the window resizing, and every target as it arrives. Adding a twelfth kind of movement and forgetting to say so is the standing danger, and nothing catches it.

**What would catch it.** The manager could check itself — once a second while the cursor is still, read the hovered target's rectangle afresh and say so in the log if it has moved. That costs one read a second, and it would have named all three faults in the moment they appeared.

## Proposal — manage this risk

the manager reading the hovered target's rectangle afresh once a second and saying so in the log if it moved.
