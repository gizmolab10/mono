---
kind: specify
title: "Sections spec"
description: "Everything needed to build the stack in another project, in the order it has to be done."
tags: [port, refactor, soon]
date: 2026-08-16
---
# Sections spec

Follow this top to bottom to put overview's stack into di, ji or ws. Every number, every rule and every trap is here; nothing has to be read out of overview's own code.

The design behind it is [sections](sections.md). This file is the doing.

## What a stack is

A run of sections, one under another, with a line drawn centred in every gap between them.

The gap belongs to the stack. A line centred in a gap has equal space on both sides by construction, so nothing anywhere subtracts half a thickness. A section names what it shows, the words riding the line above it, and whether it is folded — nothing else.

```text
stack        a run of sections, a gap between each pair, a separator centred in every gap
section      one thing in a stack
subsection   a section of a stack that is itself a section of another stack
separator    a drawn line that can carry words at its ends or its middle
fold         to put a section's own pieces out of sight
```

## Step 1 — check what the project already has

The stack leans on five things. All five must exist before anything is moved.

```text
Separator.svelte   a horizontal line, height = a thickness prop, that can hold
                   elements at its left end, its middle and its right end
Action             what a word riding a separator is: the built element, and
                   which of the three places it stands at
Constants          k.gap.*, k.thickness.*, k.height.small
Hits               a manager told to measure again when anything moves
Debug              one line written to a log
```

If `Separator.svelte` cannot carry elements, that goes first — the stack is useless without it.

## Step 2 — check the ladder

Four rungs are read by name:

```text
k.gap.normal      the ordinary gap between two sections
k.gap.fat         the wider gap around a line carrying something at its middle
k.thickness.huge  the heavy line, the default a stack draws
k.height.small    the folded distance — see the floor rule below
```

**The floor.** `k.height.small` is the distance from a folded section's own line to the next one, and the two half gaps around that fold come out of it. So it can never be smaller than the widest pair's spacing on any screen in the project:

```text
spacing = gap + thickness            for a plain line
        = k.gap.fat + thickness      for a line carrying something at its middle
```

Work out that number for every stack the project will have and take the largest. Set `k.height.small` to it or above. Below the floor a fold's height comes out negative, the browser draws it at nothing, and that one pair reads wider than every other — which looks like a spacing fault and is not.

In overview the widest is the details column: `k.gap.big` 9.72 + `k.thickness.huge` 7.78 = 17.50, so `k.height.small` is 17.50.

## Step 3 — check the page variables

The styling reads six names:

```text
--gap  --accent  --black  --z-controls  --z-common  --z-frontmost
```

Any the project does not push onto the page must be added where it pushes the rest. **One missing name kills the whole declaration it stands in**, not just itself — a `calc()` naming one undefined variable makes the browser drop the entire property and fall back, which reads as a wildly wrong layout somewhere else entirely.

## Step 4 — write the two files

### `src/lib/ts/types/Stacked.ts`

```ts
import type { Snippet } from 'svelte';
import type Action from './Action';

// Who draws the separator at a stack's foot. The stack itself, and only where its last fold
// needs something to end against; whatever stands below it, always; or nobody at all — in which
// case a last fold has nothing to end against and comes down to its own separator and nothing else.
export type T_Foot = 'stack' | 'below' | 'none';

export type Stacked = {
    rides?       : Action[] | null;   // things standing on the separator above it
    subsection   : Snippet;           // what this section shows; nothing while it is folded
    folded?      : boolean;           // folded: nothing is drawn, and the two lines around it become one
};
```

### `src/lib/svelte/support/Stack.svelte`

Copy overview's [Stack.svelte](../../src/lib/svelte/support/Stack.svelte) whole, then mend the five imports at its top. Change nothing else. Every number in it is worked out from the props and the four ladder rungs.

## Step 5 — the properties a caller writes

Five of the six have an answer already.

```text
sections    the sections, in the order they stand. The only one always written.

gap         how far apart two sections stand, said once for all of them.
            k.gap.normal unless said otherwise.

thickness   how thick the line in each gap is drawn. k.thickness.huge unless
            said otherwise; a run of picking rows wants the ordinary one.

leads       words for a line above the first section, where whatever holds the
            stack draws no boundary there. Nothing unless handed over.

over        how thick the line is that whatever holds the stack draws above it.
            Nothing where it draws none. Read only when `leads` is given.

foot        who draws the line at the stack's foot: 'stack' (the default),
            'below', or 'none'. See step 8.
```

And two the stack says back on every section, as page variables: `--over` and `--under`, how much of the gap above and below belongs to that section. A section that answers a press reads those and reaches out over them, so the whole slot answers rather than the content alone.

## Step 6 — the measurements, so a wrong one can be recognised

Every distance is middle to middle.

```text
a pair of sections          gap + thickness. The line's body takes the middle
                            of that space, so the gap a caller asks for is the
                            empty space it sees on each side.

a line carrying something   k.gap.fat + thickness. That thing hangs past the
at its middle               line on both sides. Only a thing actually built
                            counts — a clearing pill with nothing to clear is
                            named but never made, and the gap stays ordinary.

the leading line            k.height.small − half of what is drawn above the
                            stack, measured from the stack's own top.

a folded section            k.height.small from its own line to the next one,
                            always. Its height is what is left of that once the
                            half gap above and the half gap below come out.

the last folded section     nothing at all is below it, so only the half gap
                            above comes out of its height.

the foot                    the stack leaves half a gap below its last section,
                            and nothing at all where that section is folded.
```

Three rules decide a fold, and nothing else:

1. Its own line to the next is always `k.height.small`. No caller names it.
2. A hairline is drawn exactly halfway between those two, so half of `k.height.small` below the fold's own line.
3. The accent fills that whole span, with the hairline down its exact middle.

## Step 7 — how the pieces are placed

- A line is hung off its section's top edge and pulled back half its own height, which puts its middle where it was told to stand whatever it is drawn at.
- **That pulling back is a transform, and a transform makes a layer of its own** — so whatever the line sets inside it cannot rise above anything outside. The layer is said on the wrapper that stands among the accents, never on the line itself.
- Three layers, all from the ladder: the accent at the bottom, its hairline above that, the line and its word on top.
- Nothing is set on the run itself. How far one section stands from the one above it is that pair's own, since a line carrying something at its middle takes more space than a plain one.

## Step 8 — who draws the line at the foot

```text
'stack'   the stack draws it, and only where its last section is folded and the
          one above it is open. That lone fold needs something to end against;
          two folds running to the foot need none, since the run of accent is
          boundary enough. The default.

'below'   whatever stands under the stack draws it, always. The stack draws
          none, and its last fold still gets its accent and hairline.

'none'    nobody draws one. A last fold has nothing to end against, so it comes
          down to its own line and nothing else — no content, no accent, no
          hairline, no height.
```

**Never let both draw it.** Where something below already has a line at that spot, hand over `'below'` and leave it there.

**A line drawn below the stack must be pulled up half its own thickness.** Everything in a stack is measured middle to middle, and the stack leaves its bottom edge exactly where that line's middle belongs — a line drawn below starts there instead. In markup:

```css
.foot {
    margin-top : calc(var(--thick-huge) / -2);
    flex       : 0 0 auto;
}
```

## Step 9 — convert one run, and only one

1. **Find a run.** Two or more things standing one above another with a line between them. Anything standing alone is not a stack and stays as it is.
2. **Write one snippet per thing** in the run.
3. **Write the array**: what it shows, the words riding the line above it, whether it is folded.
4. **Say what is above.** Where the thing holding the stack draws its own line, hand over how thick it is as `over`. Where nothing is drawn above, hand over `leads` instead — the words for a line of the stack's own.
5. **Say who draws the foot.** Step 8.
6. **Give each section its own press.** Anything that used to answer for a section's bare space grows its own target, reaching out over the half gaps the stack names on it:

```css
.answers {
    margin  : calc(var(--over) * -1) calc(var(--gap) * -1) calc(var(--under) * -1);
    padding : var(--over) var(--gap) var(--under);
}
```

7. **Take away what the run no longer needs** — the old component's props at that site, and any hand-drawn strip or hairline the stack now draws.
8. **Look at the screen** before starting the next run. Every fault in overview's conversion was a spacing one, and every one of them showed at a glance.

## Step 10 — the traps, all of them

Each of these cost a full turn in overview. None shows up as an error.

1. **A word lent to a line has to be given back.** A caller builds its fold word out of sight and the separator takes it and puts it on the line. When that line goes — a fold, a redraw — the separator must return the element to where it was built. Left off the page, the hits manager lets its target go for good and nothing ever registers it again: the word then sits on screen answering nothing at all.
2. **Two rows of the same control on one screen must not register the same names.** Every target name wants the row it belongs to at the front.
3. **A missing page variable kills the whole declaration.** See step 3.
4. **`k.height.small` below the floor** makes one pair read wider than the rest. See step 2.
5. **A line drawn below the stack sits half a thickness too low** unless pulled up. See step 8.
6. **A folded last section must leave no gap below it.** A fold ends exactly on the line below, so any space there shows as a strip of page color between the accent and the line.
7. **A folded section's line carries nothing at its middle.** A thing there hangs down into the fold, which is a run of accent and no longer a place to stand. The ends keep whatever they had, the fold word among them.
8. **A fold moving means every rectangle the hits manager holds is stale.** The stack asks it again on every fold change; a project whose manager is asked some other way has to be given the same call.

## Step 11 — prove it

Ask the app to report what it drew, then read the log. Overview's own report is [Separator_Spacing.ts](../../src/lib/ts/utilities/Separator_Spacing.ts):

```ts
report_line_spacing('the details', column);
```

It gathers every line inside the box handed to it and says the distances middle to middle. **Hand over the box** — two columns side by side otherwise read as one run and every distance between them is wrong.

What to expect: in a run of folds every distance is `k.height.small`, to the hundredth. Anything else is a fault, and the number itself says which one — a pair reading wider than the rest is the floor (step 2), a last pair reading half a thickness wide is the foot (step 8).
