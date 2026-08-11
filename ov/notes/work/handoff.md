---
kind: specify
title: "Handoff"
description: "My resume point for overview: the one thing to do next"
tags: [proposal]
date: 2026-08-11
---
# Handoff

My resume point for overview: the one thing to do next.

Everything still owed is in [code debt](code%20debt.md). The [work journal](work%20journal.md) file has what's finished, and the [[current context]] you can't read off the code.

## The tags row says how it is picking

### Success

1. The tags row's `all` button becomes a segmented control reading **any of / all of / clear / invert**.
2. With `any of` picked, a file shows if it wears any picked tag — what happens today. With `all of`, it shows only if it wears every one of them.
3. `clear` drops every picked tag. `invert` picks exactly the tags that were not picked, and drops the ones that were. Those two segments only light during a click or hover.
4. The editor's own tags row gets the same segmented control with only `clear` and `invert`.
5. Which way the picking runs is remembered between visits, and a remembered value that is no longer one of the four is let go at launch.
6. The type check and the tests are clean.

### The shape of it

The narrowing already asks whether a row wears any picked tag, in one line:

    if (tags.length > 0 && !tags.some((tag) => row.tag_names.includes(tag))) { return false; }

`all of` is the same line with `some` becoming `every`. Which one runs comes from a new remembered setting, read the same way the kind and the project are.

`clear` and `invert` are not states — they are two presses that change what is picked and leave the control reading whatever it read before. So the control holds two of one kind and two of another, which is worth drawing plainly: the two states sit together at the left, the two presses at the right.

**The order.** The setting and the narrowing first, since they are the whole behaviour; then the control in the list; then the same control, minus two words, in the editor.

**What will not get done.** The kinds row and the projects row keep their single `all`. Only one kind and one project can be picked, so there is nothing for any-of and all-of to say there.

**Decision to make before starting.** With `all of` picked and a tag added that no file wears alongside the others, the list goes empty. The picking rows already gray out what would leave nothing — that guard asks its question with its own filter left out, so it will need to ask with the any-of/all-of setting applied, or a tag that empties the list will still look available.

**The risk.** The remembered setting is the third one that can outlive its own list of choices. The other two are let go at launch by a check written twice; a third copy of it is the moment to say it once.
