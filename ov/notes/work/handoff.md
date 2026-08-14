---
kind: specify
title: "Handoff"
description: "My resume point for overview: the one thing to do next"
tags: [proposal]
date: 2026-08-13
---
# Handoff

My resume point for overview: the one thing to do next.

Everything still owed is in [code debt](code%20debt.md). The [work journal](work%20journal.md) file has what's finished, and the [[current context]] you can't read off the code.

## The details column's banners become lines with words on them

The details column has two things that fold: preferences and repair. Each wears a banner of its own — a full-width block with the title inside it, a fill that arrives under the cursor, and a rounded shape drawn behind — while every other folding thing in the app is a line across, with the word standing on it and masking it.

### Success

1. Both fold behind a word on a line, the same one every other section uses.
2. Each holds its own gap the way a section does, so nothing in the column sets a margin of its own to line itself up.
3. Which one is open is still remembered between visits, and the press still turns one over.
4. The banner's own drawing goes — the block, the shape behind it, and its fill.

### Where it stands

Both are drawn by [Hideable.svelte](../../src/lib/svelte/support/Hideable.svelte), asked for twice by [Details.svelte:44-49](../../src/lib/svelte/main/Details.svelte#L44-L49). Its banner is a target of the manager already, named by its own title.

Every other folding thing in the app does this with a section and an action: the caller builds its own word out of sight and hands the line the made element with the end it stands at. [Search.svelte](../../src/lib/svelte/content/Search.svelte) is the smallest one to read.

### Settled

Both take the heavy line above their own word.

Below the second one, the same question the filters' kinds and tags rows already answer: with both folded away, nothing stands open at the foot of the column, so the last one stands flat and whatever follows draws no line — two lines with nothing between them read as one thick one. With the first open, the second stands as it is, folded or not. That question is already written down and proved: `foot_is_all_folds` in [Filters.ts](../../src/lib/ts/managers/Filters.ts), with four tests.

**What will not get done.** The rest of the debt list. This is its first unchecked item.
