---
kind: specify
title: "Handoff"
description: "My resume point for overview: the one thing to do next"
tags: [proposal]
date: 2026-08-17
---
# Handoff

My resume point for overview: the one thing to do next.

Everything still owed is in [code debt](code%20debt.md). The [work journal](work%20journal.md) file has what's finished, and the [[current context]] you can't read off the code.

## Placeholder words and struck-through words read as ink

A field with nothing typed in it shows what it is for, and a done item's words are drawn with a line
through them. Both are meant to read as quieter than real words, and neither says so — they take
whatever color the words around them take.

### Success

1. A field showing what it is for draws that in the light gray, and the words typed into it stay the
   text color.
2. A done item's words and the line through them both draw in the light gray.
3. Every place doing this reads one name from the ladder; no file writes a color of its own.
4. Nothing else on screen changes color.

### Where it stands

The light gray is already pushed to the page as `--lightgray`, beside the other fixed inks:
[Configuration.ts:109](../../src/lib/ts/common/Configuration.ts#L109).

The fields are the editor's own — the title, the brief, the date, and the file's name in the top
row: [Editor_Filters.svelte](../../src/lib/svelte/filter/Editor_Filters.svelte).

The strike is drawn by the reader, on a done item: [Markdown_Editor.svelte](../../src/lib/svelte/content/Markdown_Editor.svelte).

### Open

1. Whether the placeholder and the strike want the same gray, or the strike wants something darker
   so the words can still be read.
2. Whether browse's search field counts — it shows what it is for too, and it is not the editor's.

**What will not get done.** The rest of the debt list. This is its first unchecked item.
