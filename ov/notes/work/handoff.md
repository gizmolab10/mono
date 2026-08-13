---
kind: specify
title: "Handoff"
description: "My resume point for overview: the one thing to do next"
tags: [proposal]
date: 2026-08-12
---
# Handoff

My resume point for overview: the one thing to do next.

Everything still owed is in [code debt](code%20debt.md). The [work journal](work%20journal.md) file has what's finished, and the [[current context]] you can't read off the code.

## Fade the hover over an eighth of a second

Every hover fill arrives and goes in the same instant the cursor crosses an edge. Moving across a row of pills flashes each one in turn, which reads as the screen twitching.

### Success

1. A hover fill takes an eighth of a second to arrive and the same to go, everywhere one is drawn.
2. The length is one named number in [Constants.ts](../../src/lib/ts/common/Constants.ts), beside `fade`, `rest` and `slide` — reached for by name, never written as a number in a stylesheet.
3. Nothing else fades with it: what a press does still happens at once, and the tag areas keep their own slide.

### Where the fills are

Every rule that paints `var(--hover)`. They sit in the two filter forms, the search, the section's own background, the tag areas, the list's rows, and the editor's top row.

`grep -rn 'var(--hover)' ov/src` — the whole list

### The one judgment call

A fill that fades in also fades out, and the cursor leaves faster than it arrives. If leaving should be quicker than arriving, that is a second number; if the two are the same, it is one. Say which before it starts.

**What will not get done.** The rest of the debt list. This is its first unchecked item.
