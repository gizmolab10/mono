---
kind: design
title: "New gaps"
description: "The gap belongs to the stack, not to the section — and a line stands centred in it."
tags: [active, program, proposal, UX]
date: 2026-08-15
---
# New gaps

A section used to own a separator and the gaps on both sides of what it shows, and every gap was measured from that separator's middle — so every gap gave back half a thickness. Goal: replace 10 props, 4 measurements, 12 tests, and in the future avoid a whole afternoon of arguing about one row that read too tall.

## The one idea

The gap belongs to the stack, not to the section. A separator is drawn centred in a gap, so both of its sides are equal by construction.

## Success

1. A run of sections is written as a stack, with one number saying how far apart they stand.
2. A separator stands centred in each gap. Whatever it is drawn at, the distance from its middle to the section above and to the section below is the same, and nothing subtracts a half-thickness anywhere.
3. Nothing on screen moves.
4. `Sectioning.ts` and its four measurements go, along with their twelve tests.

## Two things instead of one

```text
Stack       a run of sections, a gap between each pair, a separator centred in every gap.
            It owns every measurement in the app's spacing.

Separator   unchanged: a drawn line that can carry words at its ends or middle.
```

A section is plain markup. A section that answers a press does so itself, the way every other control already does. A section that is itself a stack holds subsections.

Separators go between sections and nowhere else — never below the last. One above the first is drawn only where whatever holds the stack draws no boundary there.

## Configuration variables

What a stack is told, as built. Four of the five have an answer already, so most callers say one thing or nothing at all.

```text
sections    the sections, in the order they stand. Each names what it shows, the word
            riding the separator above it, and whether it is folded — nothing else.

gap         how far apart two sections stand, said once for all of them.
            The usual gap unless the caller says otherwise.

thickness   how thick the separator in each gap is drawn. The heavy one unless said
            otherwise; browse's picking rows ask for the ordinary one.

leads       words for a separator above the first section, where whatever holds the
            stack draws no boundary there. Nothing, unless the caller hands them over.

over        how thick the separator is that whatever holds this stack draws above it.
            Nothing, where it draws none.
```

`over` is the one that should not exist. It is there because the thing holding browse's picking rows is still an old section drawing its own heavy separator, and everything here is measured middle to middle. It goes the moment what holds a stack is itself a stack.

## How the spacing works out

Every distance is measured middle to middle.

- **A pair of sections** stands the stack's own gap apart, with the separator between them at its middle — half above, half below.
- **A separator carrying something at its middle** takes `--gap-big` above and below, since that thing hangs past the separator on both sides. Only a thing actually built counts: a clearing pill with nothing to clear is named but never made, and the gap stays ordinary.
- **A folded section** shows nothing and stands whatever height puts the separator below it exactly `--gap × 2` from the one above it. That span takes the accent with a hairline down its exact middle, and one number answers for every fold on every page.
- **The foot** — the last section folded with the one above it open: the stack closes itself with the heavy separator where that fold's band ends. Both of the last two folded: no closing separator, the last fold shows no band and takes no height, and the stack gives back a whole gap.

## What that removes, and why each one goes

```text
gap                 the stack says it once for all its sections
gap_at_foot         a centred separator makes both sides equal, so there is no second number
holds_subsections   a nested stack is a stack; nothing needs to know it holds one
extra_when_folded    ┐ one number says how far apart the separators around a fold stand,
folded               ┘ so nothing needs telling how tall a fold stands
edge                a stack has no ends to bound, so nothing says "no separator here"
onbare, bare_says   the section answers its own press
fills_when_bare     the section fills itself
onhover             the section says so
```

Eleven props become five, four of which have an answer already.

## The four that answer a press on bare space

Each grows its own, and it is the move it already looks like: all four are one outer element in their own file, so the same target action goes there unchanged. Two of the four say the same thing — close me — so they share one small piece.

[Search.svelte:198](../../src/lib/svelte/content/Search.svelte#L198) and [Editor_Filters.svelte:300](../../src/lib/svelte/content/Editor_Filters.svelte#L300) both close. Browse's tags row is done: it answers its own press, fills its own background, and reaches out to the box's own edges. [Editor_Filters.svelte:331](../../src/lib/svelte/content/Editor_Filters.svelte#L331) still toggles every tag area through its section.

## What is built

[Stack.svelte](../../src/lib/svelte/support/Stack.svelte) and [Stacked.ts](../../src/lib/ts/types/Stacked.ts). Browse's three picking rows are its first stack — [Browse_Filters.svelte:298](../../src/lib/svelte/content/Browse_Filters.svelte#L298) — and browse's count row now draws its own separator only while the tags row is open.

## Not yet using the new Section feature
Seven of the ten: the editor's two filter rows, the search, browse's count row, the details column's folding things, and the whole-filters block that holds the new stack. `Sectioning.ts`, its four measurements and its twelve tests all stand until those are converted.

[Editor_Filters.svelte](../../src/lib/svelte/content/Editor_Filters.svelte), [Search.svelte](../../src/lib/svelte/content/Search.svelte), [Browse.svelte](../../src/lib/svelte/main/Browse.svelte), [Hideable.svelte](../../src/lib/svelte/support/Hideable.svelte), [Sectioning.ts](../../src/lib/ts/utilities/Sectioning.ts), [Section.svelte](../../src/lib/svelte/support/Section.svelte)
