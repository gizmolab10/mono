---
kind: specify
title: "Handoff"
description: "My resume point for overview: the one thing to do next"
tags: [proposal]
date: 2026-08-14
---
# Handoff

My resume point for overview: the one thing to do next.

Everything still owed is in [code debt](code%20debt.md). The [work journal](work%20journal.md) file has what's finished, and the [[current context]] you can't read off the code.

## The gap between the editor's line and its search field

The search field in the editor sits under a heavy line, and the distance between them is wrong. It should be one gap — the same one every other section holds under its own line.

### Success

1. The distance from the middle of that line down to the top of the search field is one gap.
2. Nothing else in the editor moves: the label rows and the file's own words begin where they did.
3. Folding the search away leaves the line standing where it stands now.
4. Whatever sets the distance is the section's, said once — nothing beside the field sets a margin of its own to line itself up.

### Where it stands

The field is held by a section of its own, bounded above by the heavy line: [Search.svelte:184-211](../../src/lib/svelte/content/Search.svelte#L184-L211). It asks for no gap of its own, so it takes the usual one, and the arithmetic behind that lives in [Sectioning.ts](../../src/lib/ts/utilities/Sectioning.ts) — the gap under a line gives back half the line's thickness, since a gap is measured from a line's middle.

The row inside it is `.view-search`, holding the count, the step marks and the field.

### Open

Whether the distance is wrong because the section holds the wrong gap, or because the row inside it holds one of its own on top. Measure both before changing either — the two-sources-of-gap fault is the one this whole piece exists to prevent.

**What will not get done.** The rest of the debt list. This is its first unchecked item.
