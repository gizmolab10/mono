---
kind: specify
title: "Handoff"
description: "My resume point for overview: the one thing to do next"
tags: [journal, now, proposal, session]
date: 2026-08-17
---
# Handoff

My resume point for overview: the one thing to do next.

Everything still owed is in [code debt](code%20debt.md). The [work journal](work%20journal.md) file has what's finished, and the [[current context]] you can't read off the code.

## Nineteen import lines to open one file

Most of the utility files hand out loose functions rather than one thing that holds them, so every
caller has to name each function it wants, one by one. The editor's frame opens with nineteen import
lines before a word of its own, and the two managers that lean hardest on the utilities are worse.

Two of the nineteen utilities hold a class and hand out one thing: the colors and the drawn shapes.
The other seventeen hand out loose functions.

### Success

1. A caller names the file it wants, not every function inside it.
2. Every import line in the app is shorter, and the longest is a handful of names rather than a
   dozen.
3. Nothing about what the functions do changes, and every test still passes.
4. The two that already hold a class are left exactly as they are.

### Where it stands

```text
utilities/  19 files, 2 with a class     Colors, SVG_Paths
managers/    7 files, all with a class
types/       plain shapes, no functions to gather
```

The two that hold a class show the shape this would take: [Colors.ts](../../src/lib/ts/utilities/Colors.ts)
hands out one made thing, and every caller says `colors.` before the name it wants.

The editor's frame is the worst caller: [Editor.svelte:2-20](../../src/lib/svelte/main/Editor.svelte#L2-L20).

### Open

1. **A class, or one gathered object.** A class is what the managers use, and it can hold state; a
   utility holds none. One object naming the same functions would do the same for the import lines
   without inventing state that nothing needs. The two that already hold a class hold no state
   either, so whichever is chosen, those two should end up the same shape as the rest.

    `export const labels = { labels_from, label_block, has_labels, blank_guide };`

2. **Whether the name is worth the reading.** `labels_from(text)` says what it does; `labels.from(text)`
   says the same in fewer characters, and `Labels.labels_from(text)` says it twice. The gathering is
   worth having only where the caller's line gets shorter and no clearer.
3. **How far to go.** Seventeen files is the whole of it, and each one touches every caller of it.
   One file first, looked at, before the rest.

**What will not get done.** The rest of the debt list. This is its first unchecked item.
