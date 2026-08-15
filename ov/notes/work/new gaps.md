---
kind: design
title: "New gaps"
description: "The gap belongs to the stack, not to the section — and a line stands centred in it."
tags: [active, program, proposal, UX]
date: 2026-08-14
---
# New gaps

A section owns a line and the gaps on both sides of what it shows, and every gap is measured from that line's middle — so every gap gives back half a thickness. Ten props, four measurements, twelve tests, and a whole afternoon of arguing about one row that read too tall.

## The one idea

The gap belongs to the stack, not to the section. A line is drawn centred in a gap, so both of its sides are equal by construction.

## Success

1. A stack of things is written as a stack, with one number saying how far apart they stand.
2. A line stands centred in each gap. Whatever it is drawn at, the distance from its middle to the thing above and to the thing below is the same, and nothing subtracts a half-thickness anywhere.
3. Nothing on screen moves.
4. `Sectioning.ts` and its four measurements go, along with their twelve tests.

## Two things instead of one

```text
Stack     a run of children, one gap between each pair, a line centred in every gap.
          It owns every measurement in the app's spacing.

Line      unchanged: a drawn line that can carry words at its ends or middle.
```

A child is plain markup. A child that answers a press does so itself, the way every other control already does.

Lines go between children and nowhere else — never above the first, never below the last. Whatever holds a stack draws its own boundary. A line at an end has one side, so it cannot be centred in anything, and the whole rule falls over.

A folded child is drawn as nothing, and the two lines around it become one, in the accent and thicker. That is exactly what is on screen today: a gap of accent with a half-pixel hair down its exact middle.

## What that removes, and why each one goes

```text
gap                 the stack says it once for all its children
gap_at_foot         a centred line makes both sides equal, so there is no second number
holds_subsections   a nested stack is a stack; nothing needs to know it holds one
extra_when_folded    ┐ the two lines around a folded child become one, and one line has
folded               ┘ one height — so nothing needs telling how tall a fold stands
edge                a stack has no ends to bound, so nothing says "no line here"
onbare, bare_says   the child answers its own press
fills_when_bare     the child fills itself
onhover             the child says so
```

Eleven props become one.

## The four that answer a press on bare space

Each grows its own, and it is the move it already looks like: all four are one outer element in their own file, so the same target action goes there unchanged. Two of the four say the same thing — close me — so they share one small piece.

[Search.svelte:198](../../src/lib/svelte/content/Search.svelte#L198) and [Editor_Filters.svelte:300](../../src/lib/svelte/content/Editor_Filters.svelte#L300) both close. [Browse_Filters.svelte:352](../../src/lib/svelte/content/Browse_Filters.svelte#L352) and [Editor_Filters.svelte:331](../../src/lib/svelte/content/Editor_Filters.svelte#L331) both toggle every tag area.

## Where it stands

Ten sections across five files, and `Sectioning.ts` with its four measurements and twelve tests. `folded_height` goes with them, and so do the two rules that paint a fold at [Section.svelte:144-162](../../src/lib/svelte/support/Section.svelte#L144-L162).

[Browse_Filters.svelte](../../src/lib/svelte/content/Browse_Filters.svelte), [Editor_Filters.svelte](../../src/lib/svelte/content/Editor_Filters.svelte), [Search.svelte](../../src/lib/svelte/content/Search.svelte), [Browse.svelte](../../src/lib/svelte/main/Browse.svelte), [Hideable.svelte](../../src/lib/svelte/support/Hideable.svelte), [Sectioning.ts](../../src/lib/ts/utilities/Sectioning.ts), [Section.svelte:17-45](../../src/lib/svelte/support/Section.svelte#L17-L45)
