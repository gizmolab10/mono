---
kind: design
title: "Mouse UX"
description: "What a press means when the thing under the cursor changes between pressing and letting go."
tags: [now, proposal, UX, program]
date: 2026-08-14
---
# Mouse UX

The manager asks what is under the cursor twice — once on the way down, once on the way up — and keeps neither answer. Everything below follows from that.

## Conclusion

Keep both. Remember the thing you pressed, and see where you let go.

Then every press has one plain rule:

- **A button** does its thing only if you let go on the same thing you pressed. Slide off, let go, nothing happens.
- **A drag** does its thing where you let go. That is the whole point of a drag.

Nothing else has to be decided. Three faults today all came from the app knowing only where you let go, never what you pressed — and each one was patched on its own. Knowing both makes all three patches unnecessary.

[Hits.ts:76-79](../../src/lib/ts/events/Hits.ts#L76-L79)

## Three faults, one cause

All three turned up on 14 August 2026, each mended on its own before the shared cause was named.

**The step marks stepped twice.** The manager said the press and started the repeating, and the repeating begins with a beat at once. Where the second step arrived back at the first, it read as doing nothing.

**A folder opened and then shut.** The mark acted on the way down, the row on the way up. The mark's shape turns when its folder does, so it moved out from under the cursor and the row turned the folder straight back.

**A held press stopped repeating.** The first beat drew the next file, which replaced the mark's element; letting go of a target that has left the page says nothing is hovered, and that killed the patter before the 800ms wait was over.

Everything in the list now acts when the press is let go, and the repeating ignores the hover. Both are workarounds for the one unanswered question.

## Sticky

The thing under the cursor when the button goes down owns the press, whatever is redrawn underneath.

**For.** It settles all three at once, and says what a person means: you press a thing, that thing is what you pressed. Two of the mends stop being mends, and the repeating loses its exception.

**Against.** It hides a second decision — what letting go somewhere else means. Every desktop app cancels; ownership alone would act. So the rule is two-part: the pressed thing owns the press, **and** the release must be on it to count. The fill and the press also become different questions, disagreeing while held and slid away. And a drag wants the thing under the cursor at release, the opposite; the browser's own carries that today, but any drag of our own needs a way out.

## Both

The pressed thing **and** where the button came up, each reported, each caller saying which it means.

**For.** It answers both questions rather than picking one: a button wants what you pressed, a drop wants where you let go. The release-outside question then settles itself — a button acts only when the two agree, a drop acts on the second. It costs two fields and one comparison, since what one press did already carries its element and its event, and the double-press already remembers a target across a press.

[S_Mouse.ts:8-29](../../src/lib/ts/events/S_Mouse.ts#L8-L29), [Hits.ts:43-44](../../src/lib/ts/events/Hits.ts#L43-L44)

**Against.** Every caller must know which it wants, so silence becomes a choice. The three controls changed today should go back to acting on the press — a second pass over the very code just changed. And nothing on screen says which a control uses: a press that acts and a press that cancels look the same until it happens.

[Files_List.svelte:427-437](../../src/lib/svelte/content/Files_List.svelte#L427-L437), [Steppers.svelte:43-49](../../src/lib/svelte/support/Steppers.svelte#L43-L49)

## Undecided

1. What a target that says nothing gets. Naming that default is the whole of the last argument against.
2. Whether the three controls changed today go back to acting on the press.
3. What the reader sees while a press is held and the cursor has slid away.
