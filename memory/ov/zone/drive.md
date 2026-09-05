---
kind: analyze
title: "Drive"
description: "The one proposal being decided and implemented; it dissolves into truth when done."
tags: [now, weighed]
date: 2026-09-03
---
# Drive

## synopsis

1. **Success criteria.** Every filter row sits where it does today, confirmed on screen. No row writes a margin or repeats `--over` / `--under`. svelte-check clean. Every foldable section, starved and unfolded, keeps the bottom edge of the separator below it as far from the separator above as when folded; browse's tags keep the heavy line either way.
2. **The fault.** A row's vertical space comes from three layers (stack half-gaps, section padding, row padding), and one padding value does two jobs at once: the reach that lets hover and press cover the half-gaps, and the breathing gap that shows.
3. **The scheme.** One shared `.reaches` rule per filter file does the reach and reads two tokens, `--pad-top` and `--pad-bottom`, or one `--pad` for both. Each row sets only that number. Rows that never answer the cursor keep plain padding.
4. **Scope.** Choice 1, recommended first: the rule in Browse_Filters and Editor_Filters each. Choice 2, later: hoist it to a shared stylesheet.
5. **Where it is now.** Choice 1 is built in both files, svelte-check clean, awaiting the look at the screen. One flag: the browse search row's bottom number is `var(--under)`, the stack's half-gap, not a rung. Open: choice 2, and whether Section.svelte's own reach joins the scheme.

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
