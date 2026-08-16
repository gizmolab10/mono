---
kind: design
title: "Sections"
description: "A stack owns the gaps between its sections, and a separator stands centred in each one."
tags: [active, program, proposal, UX]
date: 2026-08-15
---
# Sections

Everything about sections: what they are, how a stack spaces them, what a caller writes, and what is left to convert.

## The one idea

The gap belongs to the stack, not to the section. A separator is drawn centred in a gap, so both of its sides are equal by construction — nothing anywhere subtracts half a thickness.

A section used to own a separator and the gaps on both sides of what it shows, every gap measured from that separator's middle. Ten props, four measurements, twelve tests, and a whole afternoon of arguing about one row that read too tall.

## The words

```text
stack        a run of sections, a gap between each pair, a separator centred in every gap.
             It owns every measurement in the app's spacing.

section      one thing in a stack. Plain markup. It names what it shows, the word riding
             the separator above it, and whether it is folded — nothing else.

subsection   a section of a stack that is itself a section of another stack.

separator    a drawn line that can carry words at its ends or its middle.

fold         to put a section's own pieces out of sight. Its opposite is unfold.
```

A section that answers a press does so itself, the way every other control already does.

Separators go between sections and nowhere else — never below the last. One above the first is drawn only where whatever holds the stack draws no boundary there.

## Success

1. A run of sections is written as a stack, with one number saying how far apart they stand.
2. A separator stands centred in each gap. Whatever it is drawn at, the distance from its middle to the section above and to the section below is the same.
3. Nothing on screen moves.
4. `Sectioning.ts` and its four measurements go, along with their twelve tests.

## What a stack is told

Four of the five have an answer already, so most callers say one thing or nothing at all.

```text
sections    the sections, in the order they stand.

gap         how far apart two sections stand, said once for all of them.
            The usual gap unless the caller says otherwise.

thickness   how thick the separator in each gap is drawn. The heavy one unless said
            otherwise; browse's picking rows ask for the ordinary one.

leads       words for a separator above the first section, where whatever holds the
            stack draws no boundary there. Nothing, unless the caller hands them over.

over        how thick the separator is that whatever holds this stack draws above it.
            Nothing, where it draws none.
```

And two the stack says back, on every section: how much of the gap above it and how much of the gap below it belong to that section. A section that answers a press reads those and reaches out over them, so the whole slot answers rather than the content alone.

`over` is the one that should not exist. It is there because the thing holding browse's picking rows is still an old section drawing its own heavy separator, and everything here is measured middle to middle. It goes the moment what holds a stack is itself a stack.

## How the spacing works out

Every distance is measured middle to middle.

- **A pair of sections** stands the stack's own gap apart, with the separator between them at its middle — half above, half below.
- **A separator carrying something at its middle** takes `--gap-big` above and below, since that thing hangs past the separator on both sides. Only a thing actually built counts: a clearing pill with nothing to clear is named but never made, and the gap stays ordinary.
- **A folded section** shows nothing and stands whatever height puts the separator below it exactly `--gap × 2` from the one above it. That span takes the accent with a hairline down its exact middle, and one number answers for every fold on every screen.
- **The foot** — the last section folded with the one above it open: the stack closes itself with the heavy separator where that fold's band ends. Both of the last two folded: no closing separator, the last fold shows no band and takes no height, and the stack gives back a whole gap.

## How the drawing is done

- The separator is hung off its section's top edge and pulled back half its own height, which puts its middle where it was told to stand whatever it is drawn at.
- That pulling back is a transform, and a transform makes a layer of its own — so whatever the separator sets inside it cannot rise above anything outside. The layer is said on the wrapper that stands among the bands.
- Three layers, all from the ladder: the accent band at the bottom, its hairline above that, the separator and its word on top.
- Nothing is set on the run itself. How far one section stands from the one above it is that pair's own.

## Answering a press on bare space

Five sections do it, and each grows its own: one outer element in its own file, carrying the same target action the section used to carry for it. Four say the same thing — resume browse — and all four wear that name, so whichever the cursor is on lights every one of them.

Done: browse's tags, and the editor's three — its words, its kinds, its tags. Each reaches out over its own half of the gaps around it, so the whole slot answers.

Still on its section: [Search.svelte:198](../../src/lib/svelte/content/Search.svelte#L198), which carries the way out's press and now says so.

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

## What is built

[Stack.svelte](../../src/lib/svelte/support/Stack.svelte) and [Stacked.ts](../../src/lib/ts/types/Stacked.ts). Two stacks so far:

- **Browse's three picking rows** — [Browse_Filters.svelte:298](../../src/lib/svelte/content/Browse_Filters.svelte#L298). Browse's count row now draws its own separator only while the tags row is open.
- **The editor's label form** — [Editor_Filters.svelte:317](../../src/lib/svelte/content/Editor_Filters.svelte#L317). Three sections: the words, the kinds, the tags. The kinds no longer stand inside the label rows; each answers for itself.

## Still on the old section

Five of the ten: the search, browse's count row, the details column's folding things, and the two whole-block sections that hold the new stacks. `Sectioning.ts`, its four measurements and its twelve tests all stand until those are converted.

[Search.svelte](../../src/lib/svelte/content/Search.svelte), [Browse.svelte](../../src/lib/svelte/main/Browse.svelte), [Hideable.svelte](../../src/lib/svelte/support/Hideable.svelte), [Sectioning.ts](../../src/lib/ts/utilities/Sectioning.ts), [Section.svelte](../../src/lib/svelte/support/Section.svelte)

## Two words the lexicon has wrong

[lexicon.md:28-29](../guides/pre-flight/lexicon.md#L28-L29) still says a section is "a line across the top, then whatever it holds, with equal gap above and below it" — the old definition, which the stack took away. And it bans *separator* in favor of *line*, which is the opposite of what is said now.

Both want rewriting once this is finished.
