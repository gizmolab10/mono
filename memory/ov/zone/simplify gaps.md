---
kind: specify
title: "Drive"
description: "The one proposal being decided and implemented; it dissolves into truth when done."
tags: [now, weighed]
date: 2026-09-03
---
# Simplify gaps

## synopsis

1. **Success criteria.** Every filter row sits where it does today, confirmed on screen. No row writes a margin or repeats `--over` / `--under`. svelte-check clean. Every foldable section, starved and unfolded, keeps the bottom edge of the separator below it as far from the separator above as when folded; browse's tags keep the heavy line either way.
2. **The fault.** A row's vertical space comes from three layers (stack half-gaps, section padding, row padding), and one padding value does two jobs at once: the reach that lets hover and press cover the half-gaps, and the breathing gap that shows.
3. **The scheme.** One shared `.reaches` rule per filter file does the reach and reads two tokens, `--pad-top` and `--pad-bottom`, or one `--pad` for both. Each row sets only that number. Rows that never answer the cursor keep plain padding.
4. **Scope.** Choice 1, recommended first: the rule in Browse_Filters and Editor_Filters each. Choice 2, later: hoist it to a shared stylesheet.
5. **Where it is now.** Choice 1 is built in both files, svelte-check clean, awaiting the look at the screen. One flag: the browse search row's bottom number is `var(--under)`, the stack's half-gap, not a rung. Next: the slot owns the reach, the last section of this file, decided and not yet built. Open: choice 2, and whether Section.svelte's own reach joins the scheme.

## the filter rows' gap

one number each, one place for the reach

### **Success criteria**

Every filter row sits exactly where it does today, confirmed on screen. No row writes a margin or repeats `--over` / `--under`. `yarn svelte-check` clean. Every foldable section, starved and unfolded, keeps the bottom edge of the separator below it as far from the separator above as when folded. Browse's tags keep the heavy line below them either way; the stack is told its thickness as `under`, and a shut last section gives back the extra a heavy line takes below the stack's bottom edge.

### **The fault**

The vertical space around each filter row is assembled from three layers, and single CSS properties carry more than one of them at once. The Stack sets `--over` and `--under` on every row (half the gap each side). The Section adds its own top and bottom padding around the whole block. Each row then adds padding of its own. Worse, each reaching row's padding does two jobs in one value: the reach — negative margin against equal padding, so the hover fill and the press cover the half-gaps — and the breathing gap, folded into the same padding as `calc(var(--under) + var(--gap))`. No single number means what it says, and a hand-tweak like the tags top margin now reading `calc(+ var(--gap) - var(--over))` breaks a cancellation the next reader cannot see.

### **The scheme**

Separate the two jobs. One shared rule per filter file does the reach and reads two tokens that default to zero:

```css
.reaches {
    margin  : calc(var(--over) * -1) calc(var(--gap) * -1) calc(var(--under) * -1);
    padding : calc(var(--over) + var(--pad-top, var(--pad, 0px)))
              var(--gap)
              calc(var(--under) + var(--pad-bottom, var(--pad, 0px)));
}
```

Each reaching row then sets one number: `--pad` for equal top and bottom, or `--pad-top` / `--pad-bottom` for one side. No row writes a margin. No row repeats `--over` or `--under`. The tags top hack becomes `--pad-top: var(--gap)`. Rows that never answer the cursor — `.paired-rows`, `.information-rows` — keep plain `padding-top` / `padding-bottom` and no reach; their gap was never tangled.

### **Scope**

Two choices. Choice 1, recommended first: the `.reaches` rule in each of Browse_Filters and Editor_Filters. Minimal, ends the quagmire inside each file. Choice 2, later: hoist `.reaches` to a shared stylesheet so the reach lives in one place across the whole app; bigger, since Svelte scopes styles per component.

Where it is now: choice 1 is built in Browse_Filters and Editor_Filters, svelte-check clean, awaiting the look at the screen. `--over` and `--under` are written in each file's one `.reaches` rule and nowhere else, except the browse search row, whose bottom number is `var(--under)` rather than a rung — swap it for one with a look at the screen. The reach also lives in Section.svelte's own `.section-body`; whether that folds into the same scheme is open, as is choice 2.

### **Bugs**

- [x] tags
    - [x] editor top gap too big. why?
    - [x] browse when unfolded but starved, section is way too big:
        - [x] success criterion -> when starved, do the following
        - [x] fold and unfold tags -> the sep line below tags does not move

### tags use case

Every place in the code that sizes browse's tags section: its height, its `padding`, and its contents' `margin` and `padding`. By layer, outermost first. The numbers are today's rungs.

**The slot the stack gives the section** — [Stack.svelte](../../../core/src/lib/svelte/support/Stack.svelte) (core-support):

1. The gap between sections, `spacing = gap + thickness`, line 51. Browse hands it `gap.big` 9.72 and `thickness.normal` 1.11 at [Browse_Filters.svelte:446](../../../ov/src/lib/svelte/filter/Browse_Filters.svelte#L446), so 10.83.
2. `margin-top` of the tags slot, one spacing, line 192.
3. `--over` and `--under`, half a spacing each, 5.42, lines 189 and 190, written on the slot for the row's reach to read.
4. The slot's `height` while shut, folded or starved, line 193, from `height_of` at line 147: `FOLDED − over − extra`, where FOLDED is `height.small` 17.5, line 57, and `extra` is what the line below exceeds 1.11 by, line 154. Open, the slot has no stated height.
5. The stack's `margin-bottom`, `foot_gap`, line 175: 0 while the last section is shut, else half a gap 4.86, line 116.
6. The fold's accent fill, FOLDED tall, line 198, folded only.

**The line below** — [Browse.svelte](../../../ov/src/lib/svelte/main/Browse.svelte) (ov): the count section's edge, thin 1.11 while tags are folded, heavy 7.78 while open, line 94, handed to the filters as `under` at line 102.

**The section's own box** — [Section.svelte](../../../core/src/lib/svelte/support/Section.svelte) (core-support): the filters section holds subsections, so its top and bottom `padding` are 0, lines 54, 55, 101 and 102, by [Sectioning.ts:45](../../../core/src/lib/ts/utilities/Sectioning.ts#L45). Left and right, ±gap, lines 141 to 144. And the filters wrapper pulls itself up one gap, [Browse_Filters.svelte:490](../../../ov/src/lib/svelte/filter/Browse_Filters.svelte#L490).

**The row's reach and gap** — [Browse_Filters.svelte](../../../ov/src/lib/svelte/filter/Browse_Filters.svelte) (ov-filter):

7. `.reaches`, lines 501 to 503: `margin` −over, −gap, −under. `padding` over + pad-top, gap, under + pad-bottom.
8. `.bare-answers`, line 520: `--pad-top: gap-small` 4.32. No bottom number, so 0.

**The contents** — same file:

9. `.tags`, line 652: the run's `height` is stated, and a change of it is animated, line 653. `gap` between pills one gap 7.78, line 654, both across and between wrapped rows.
10. The stated height comes from [Smooth_Height.ts:49](../../../core/src/lib/ts/utilities/Smooth_Height.ts#L49) to 60: the lowest child's bottom.
11. `.tags.named`, line 647: `margin-top` one gap 7.78, only while a tagset's name rides above the top row.
12. `.pill-slot`, line 632, inline-flex, adds nothing.
13. Each pill, [Big_Pill.svelte:187](../../../core/src/lib/svelte/support/Big_Pill.svelte#L187): `height` 21.88 and `padding` gap-micro 1.3. Its name rides above at line 384, `top: −2px − gap-faint`.

**The starved case:** nothing renders inside the slot, so 7 to 13 are absent. Item 4 is the whole height.

## the slot owns the reach

### **Slot: success criteria**

Nothing on screen moves, confirmed by Jonathan on both screens. No row writes a negative margin; the reaches left are the stack's slots, Section.svelte's body, and the editor's whole form block. No filter file names `--over` or `--under`. The riding-name measurement is gone from both filter files. svelte-check clean, core's tests pass, ov's tests pass.

### **Slot: the fault**

Every row reaches out over the stack's half-gaps so its hover fill and press cover the whole slot. That one choice makes the stack export `--over` and `--under`, makes each filter file carry a `.reaches` rule, folds every breathing gap into a calc, and leaves the search row a bottom number that is not a rung. Separately, the tags run measures whether a name rides above its top row and toggles a margin, with a ResizeObserver in each filter file.

### **Slot: the scheme**

1. The stack puts the half-gaps inside each slot as the slot's own `padding`, not as a margin plus two exported variables. A slot's box then runs from the middle of the line above to the middle of the line below, and its separator sits on its top edge. A shut slot is FOLDED tall, border-box, less what a heavy line below adds.
2. A section that answers the cursor says so in its `Stacked` entry — the hit target's id, type, press or release, tip, and whether it is highlighted — and the stack puts the hit target and the fill on the slot itself. No row reaches anywhere.
3. A row's breathing gap is plain `padding-top` and `padding-bottom` in a rung.
4. The tags run always holds the name's headroom above itself, one small gap, whether or not a name rides.

### **What goes**

Stack: `over_of`, `under_of`, the exported `--over` and `--under`. Both filter files: `.reaches`, the reaches on `.bare-answers`, `.label-rows` and `.search-rows`, the `--pad` tokens, the `var(--under)` bottom number, `names_riding`, `look_for_names`, the ResizeObserver effects, and `.named`. Tag_Rows' `names_ride_in` and `placements_of` lose their last callers: reported, not removed.

### **What stays**

`under` and its give-back. The fold's accent fill. `smooth_height` on the tags run. The editor's way-out highlighting, now a highlighted flag the section hands the stack.

### **Order**

1. Stack: padding-based slots, hit target and fill on the slot, the answering fields on Stacked. Core's tests.
2. Browse_Filters: rows to plain padding, sections declare what they answer. Screen check.
3. Editor_Filters: the same. Screen check.
4. Headroom held always, both files. Screen check.

Where it is now: all four stages are built, core's tests, ov's tests and svelte-check clean. The stack's slot holds its half-gaps as padding and carries the target and the fill. Browse's and the editor's rows have plain padding and name no variable. Browse is confirmed on screen through stage 3. One number changed there: the search row's bottom gap is the small rung, 4.32, where it was the half-gap, 5.42. In the editor the four way-out sections answer and highlight through the slot, and the tags section's press is the slot's. Stage 4: both tags runs hold a small gap of margin above themselves always; `names_riding`, `look_for_names`, the ResizeObserver effects and `.named` are gone from both files, and the editor's tags measurement log with them. Tag_Rows and its test have no caller left: reported, not removed. Both screens await the check of stage 4.
