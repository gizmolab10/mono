---
kind: analyze
title: "Drive"
description: "The one proposal being decided and implemented; it dissolves into truth when done."
tags: [now, driving]
date: 2026-09-03
---
# Drive

## quick review

1. **Success criteria.** Every filter row sits where it does today, confirmed on screen. No row writes a margin or repeats `--over` / `--under`. svelte-check clean.
2. **The fault.** A row's vertical space comes from three layers (stack half-gaps, section padding, row padding), and one padding value does two jobs at once: the reach that lets hover and press cover the half-gaps, and the breathing gap that shows.
3. **The scheme.** One shared `.reaches` rule per filter file does the reach and reads two tokens, `--pad-top` and `--pad-bottom`, or one `--pad` for both. Each row sets only that number. Rows that never answer the cursor keep plain padding.
4. **Scope.** Choice 1, recommended first: the rule in Browse_Filters and Editor_Filters each. Choice 2, later: hoist it to a shared stylesheet.
5. **Where it is now.** Awaiting go on choice 1. Open: whether Section.svelte's own reach joins the scheme.
## the filter rows' gap: one number each, one place for the reach

**Success criteria.** Every filter row sits exactly where it does today, confirmed on screen. No row writes a margin or repeats `--over` / `--under`. `yarn svelte-check` clean.

**The fault.** The vertical space around each filter row is assembled from three layers, and single CSS properties carry more than one of them at once. The Stack sets `--over` and `--under` on every row (half the gap each side). The Section adds its own top and bottom padding around the whole block. Each row then adds padding of its own. Worse, each reaching row's padding does two jobs in one value: the reach — negative margin against equal padding, so the hover fill and the press cover the half-gaps — and the breathing gap, folded into the same padding as `calc(var(--under) + var(--gap))`. No single number means what it says, and a hand-tweak like the tags top margin now reading `calc(+ var(--gap) - var(--over))` breaks a cancellation the next reader cannot see.

**The scheme.** Separate the two jobs. One shared rule per filter file does the reach and reads two tokens that default to zero:

```css
.reaches {
    margin  : calc(var(--over) * -1) calc(var(--gap) * -1) calc(var(--under) * -1);
    padding : calc(var(--over) + var(--pad-top, var(--pad, 0px)))
              var(--gap)
              calc(var(--under) + var(--pad-bottom, var(--pad, 0px)));
}
```

Each reaching row then sets one number: `--pad` for equal top and bottom, or `--pad-top` / `--pad-bottom` for one side. No row writes a margin. No row repeats `--over` or `--under`. The tags top hack becomes `--pad-top: var(--gap)`. Rows that never answer the cursor — `.paired-rows`, `.information-rows` — keep plain `padding-top` / `padding-bottom` and no reach; their gap was never tangled.

**Scope.** Two choices. Choice 1, recommended first: the `.reaches` rule in each of Browse_Filters and Editor_Filters. Minimal, ends the quagmire inside each file. Choice 2, later: hoist `.reaches` to a shared stylesheet so the reach lives in one place across the whole app; bigger, since Svelte scopes styles per component.

Where it is now: the drive, awaiting go on scope choice 1 before building. The reach also lives in Section.svelte's own `.section-body`; whether that folds into the same scheme is open.
