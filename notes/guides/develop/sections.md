---
kind: specify
title: "Sections"
description: "A stack owns the gaps between its sections, and a separator stands centred in each one."
tags: [keep, program, proposal, UX]
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

## Properties

Five of the six have an answer already, so most callers say one thing or nothing at all.

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

foot        who draws the separator at the stack's foot.

            'stack'  the stack itself, and only where its last fold needs
                     something to end against. The default.
            'below'  whatever stands under the stack, always. The stack draws
                     none, and its last fold still gets its accent and hairline.
            'none'   nobody. A last fold has nothing to end against, so it comes
                     down to its own separator and nothing else.

            The details column says 'below', since it draws that line itself
            whether its last section is open or folded.
```

And two the stack says back, on every section: how much of the gap above it and how much of the gap below it belong to that section. A section that answers a press reads those and reaches out over them, so the whole slot answers rather than the content alone.

`over` is the one that should not exist. It is there because the thing holding browse's picking rows is still an old section drawing its own heavy separator, and everything here is measured middle to middle. It goes the moment what holds a stack is itself a stack.

## Gap size algorithm

### Every distance is measured middle to middle

- **A pair of sections** stands the stack's own gap apart, plus the separator's own thickness — its body takes the middle of that space, so the gap a caller asks for is the empty space it sees on each side.
- **A separator carrying something at its middle** takes `--gap-fat` above and below, since that thing hangs past the separator on both sides. Only a thing actually built counts: a clearing pill with nothing to clear is named but never made, and the gap stays ordinary.
- **The foot** — the stack closes itself with the heavy separator when its last section is folded and the one above it is open, and leaves half a gap below its last section either way. Two folds running to the foot need no separator, and a caller can say the stack never draws one. Where a run ends with nothing folded, whatever holds the stack draws that boundary itself.

### A folded section

Three rules, and nothing else decides it.

1. The distance between the centre of a folded section's own separator and the centre of the next one is always `k.height.small`. The section's height is whatever makes that so — the folded distance with the half gap above and the half gap below taken out of it — and no caller names it.
2. A hairline appears exactly halfway between those two centres, so it is drawn half of `k.height.small` below the fold's own separator.
3. The last folded section closes against the separator on the stack's bottom edge — the stack's own or one drawn below it — so nothing at all is below it and only the half gap above comes out of its height. Where no separator is drawn down there at all, the fold has no span: it comes down to its own separator and nothing else — no content, no accent, no hairline, no height.

The accent fills the whole span between the two separators, with the hairline down its exact middle.

In code, one function says the height and one says whether the fold vanishes:

```ts
function height_of(at: number): number {
    if (vanishes(at)) { return 0; }
    const last = at === sections.length - 1;
    return FOLDED - spacing(at) / 2 - (last ? 0 : spacing(at + 1) / 2);
}

function vanishes(at: number): boolean {
    return at === sections.length - 1 && !!sections[at].folded && !add_end_separator;
}
```

### Variants

Three ways the space above a section's content is arrived at, and two below. Every one of them is half of some pair's spacing, except where a caller adds its own.

```text
above     first section, stack draws its own separator   half the first pair's spacing,
                                                         below a separator standing
                                                         (gap × 1.5 − half of what is
                                                         drawn above the stack) down

          first section, nothing drawn above it          nothing at all; whatever holds
                                                         the stack provides the space

          every other section                            half that pair's spacing

below     not the last section                           half the next pair's spacing

          the last section                               half a gap, whatever is below
```

And two multipliers on a pair's spacing itself:

```text
plain separator                     gap + thickness
separator with a thing at its middle    --gap-fat + thickness
```

On top of all that, a caller can hold its own space inside the section's own markup. Two do: the editor's first section holds `--gap-small` above its content, and its tags section holds the same below — neither is the stack's.

## Element placement algorithm

- The separator is hung off its section's top edge and pulled back half its own height, which puts its middle where it was told to stand whatever it is drawn at.
- That pulling back is a transform, and a transform makes a layer of its own — so whatever the separator sets inside it cannot rise above anything outside. The layer is said on the wrapper that stands among the bands.
- Three layers, all from the ladder: the accent band at the bottom, its hairline above that, the separator and its word on top.
- Nothing is set on the run itself. How far one section stands from the one above it is that pair's own.

## Active background of sections

Five sections do it, and each grows its own: one outer element in its own file, carrying the same target action the section used to carry for it. Four say the same thing — resume browse — and all four wear that name, so whichever the cursor is on lights every one of them.

Done: browse's tags, and the editor's three — its words, its kinds, its tags. Each reaches out over its own half of the gaps around it, so the whole slot answers.

Still on its section: [Search.svelte:198](../../src/lib/svelte/filter/Search.svelte#L198), which carries the way out's press and now says so.

## Eliminations, and why

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

Eleven props become six, five of which have an answer already.

## What is built

[Stack.svelte](../../src/lib/svelte/support/Stack.svelte) and [Stacked.ts](../../src/lib/ts/types/Stacked.ts). Three stacks so far:

- **Browse's three picking rows** — [Browse_Filters.svelte:298](../../src/lib/svelte/filter/Browse_Filters.svelte#L298). Browse's count row now draws its own separator only while the tags row is open.
- **The editor's label form** — [Editor_Filters.svelte:317](../../src/lib/svelte/filter/Editor_Filters.svelte#L317). Three sections: the words, the kinds, the tags. The kinds no longer stand inside the label rows; each answers for itself. With its tags open the stack draws no closing line, so the form draws its own — the same as the details column does.
- **The details column** — [Details.svelte:88](../../src/lib/svelte/main/Details.svelte#L88). Two sections, and `Hideable.svelte` is gone: it built a fold word and handed it to its own section, which the stack does now. It says `foot='below'` and draws that boundary itself, open or folded.

## Still on the old section

Four of the ten: the search, browse's count row, and the two whole-block sections that hold the picking rows and the label form. `Sectioning.ts`, its four measurements and its twelve tests all stand until those are converted.

[Search.svelte](../../src/lib/svelte/filter/Search.svelte), [Browse.svelte](../../src/lib/svelte/main/Browse.svelte), [Sectioning.ts](../../src/lib/ts/utilities/Sectioning.ts), [Section.svelte](../../src/lib/svelte/support/Section.svelte)

## Porting to other projects (ws, di and ji)

Two files carry the whole of it, and neither knows anything about overview.

### What travels

```text
src/lib/svelte/support/Stack.svelte     the run of sections and every measurement
src/lib/ts/types/Stacked.ts             what one section names
```

They lean on four things every project already has, and on nothing else:

```text
Separator.svelte     the drawn line, with words at its ends or middle
Action.ts            what a word riding a separator is
Constants.ts         k.gap.*, k.thickness.*, k.height.small and k.layer.*
Hits.ts              told to measure again whenever a fold moves
Debug.ts             the one diagnostic line
```

### Steps

1. **Move both files across**, keeping the same two folders. Mend the five imports at the top of `Stack.svelte` to the receiving project's own paths.
2. **Check the ladder.** `k.gap.normal`, `k.gap.fat`, `k.thickness.huge` and `k.height.small` must all exist. Where a project's ladder uses other names, change the four uses in `Stack.svelte` and nothing else.
3. **Check the page variables.** The styling reads `--gap`, `--accent`, `--black`, `--z-controls`, `--z-common` and `--z-frontmost`. Any that a project does not push onto the page has to be added where it pushes the rest — and a name that is missing kills the whole declaration it stands in, not just itself.
4. **Find every run of sections.** One place where two or more things stand one above another with a line between them. That is a stack; anything standing alone is not, and stays as it is.
5. **Convert one run**, and only one, before looking at the screen. For each thing in the run write a snippet, then one array: what it shows, the word riding the separator above it, whether it is folded.
6. **Say what is above.** Where the thing holding the stack draws its own line, hand over how thick it is. Where nothing is drawn above, hand over the words for a separator of the stack's own instead.
7. **Give each section its own press.** Anything that used to answer for a section's bare space grows its own target, reaching out over the half-gaps the stack names on it.
8. **Look at the screen** before converting the next run. Every fault in overview's conversion was a spacing one, and every one of them showed at a glance.
9. **Take away what the run no longer needs** — the old section component's props at those sites, and any hand-drawn strip or hairline the stack now draws.

### What to expect

- The gap a caller asks for is the empty space it sees, and the separator's own thickness is added on top. A stack drawn with the heavy line and a small gap has almost no space at all until this is right.
- A folded section is `k.height.small` from its own separator to the next, whatever the gaps around it measure. The accent fills that span, with a hairline down its middle. A last fold with no separator below it shows only its own separator.
- The stack closes itself with the heavy separator when its last section is folded and the one above it is open. Where something below already draws that boundary, hand over `foot='below'` and leave it to draw its own — never let both, and never leave a last fold with nothing to end against.
- Two rows of the same control on one screen must not register the same names. Every target name wants the row it belongs to at the front.
- A line drawn below the stack has to be pulled up half its own thickness. Everything in a stack is measured middle to middle, and the stack leaves its bottom edge exactly where that line's middle belongs — a line drawn below starts there instead.
- The folded distance has a floor: the two half gaps around a fold come out of it, so it can never be less than the widest pair's spacing. Below that a fold's height goes negative, the browser draws it at nothing, and that one pair reads wider than the rest.
- A word handed to a separator is only lent to it. When the fold takes that separator away, the word has to go back to where it was built — off the page altogether, the hits manager lets its target go for good, and nothing ever registers it a second time. That word then sits on screen answering nothing.
