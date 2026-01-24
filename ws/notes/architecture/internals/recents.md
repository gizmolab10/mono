# Recents

recents is broken. let's start over

## I Want the app to

* Remember what i grab or when i change the focus
* Go backwards and forwards through history
* History is circular (after the last is the first)
* Remove current recent by typing "/"
* Unlimited length
* Mode to ignore all grabs (record but skip during navigation)

## Entry Structure — Single source of truth

```typescript
type S_Recent = {
    focus: Ancestry,
    si_grabs: S_Items<Ancestry>,
    depth: number
}

si_recents = new S_Items<Recent>([])
```

**Single source of truth:**

* `si_recents.item.focus` — current focus
* `si_recents.item.si_grabs.items` — current grabs
* `si_recents.item.si_grabs.index` — current grab index
* `si_recents.item.depth` — current depth level

**New entry when:** focus, grabs, or depth changes. Snapshot the whole state.

**Navigation:** Move index, apply the snapshot. No replay logic.

**Derived stores:**

```typescript
w_focus = derived(si_recents.w_item, item => item?.focus)
w_grabs = derived(si_recents.w_item, item => item?.si_grabs.items)
w_depth = derived(si_recents.w_item, item => item?.depth)
```

No separate `si_grabs`, no separate `w_ancestry_focus`. Just `si_recents`.

## Final manual regression testing

| Area | Steps | Expected |
|----|----|----|
| **Focus** |    |    |
|    | Click widget | Widget becomes focus, tree recenters |
|    | Click breadcrumb | grabOnly that ancestor |
|    | Double-click widget | Focus changes, children expand |
| **Grabs** |    |    |
|    | Click widget | Single grab, highlighted |
|    | Shift-click another | Multi-grab, both highlighted |
|    | Click elsewhere | Previous grabs cleared |
|    | Click grabbed widget | Ungrab (if toggle behavior) |
| **History** |    |    |
|    | Make 5 focus/grab changes | History accumulates |
|    | Press back 3 times | Each state restores correctly |
|    | Press forward 2 times | States restore correctly |
|    | Press back past start | Wraps to most recent (circular) |
|    | Press "/" | Current entry removed from history |
| **Search** |    |    |
|    | Grab A, then open search | A stays grabbed |
|    | Type query, get results | Grabs unchanged |
|    | Arrow through results | Details updates, grabs unchanged |
|    | Press Enter on result | Result becomes focus+grab, search closes |
|    | Press Escape | Search closes, original grabs intact |
| **Details** |    |    |
|    | Grab single widget | Details shows that widget |
|    | Multi-grab A, B, C | Details shows one (per grabIndex) |
|    | Press next/prev in details | Cycles through grabbed items |
| **Modes** |    |    |
|    | Do all above in tree mode | Works |
|    | Switch to radial mode | Grabs preserved |
|    | Do all above in radial mode | Works |
| **Depth** |    |    |
|    | Change depth slider | History entry created |
|    | Navigate back | Previous depth restored |

## Completed

**Date:** 2025-01-21

### Verdict: ✅ `x.si_recents` IS the single source of truth for both focus and grabs

**Current implementation:**

| Store | Role |
|----|----|
| `x.si_recents` | **SINGLE SOURCE OF TRUTH** |
| `x.w_ancestry_focus` | Derived from `si_recents.w_item?.focus` |
| `x.w_grabs` | Derived from `si_recents.w_item?.si_grabs?.items` |
| `x.w_grabIndex` | Derived from `si_recents.w_item?.si_grabs?.index` |

**Key changes from old system:**

* No separate `x.si_grabs` exists
* All derived stores read from `si_recents.w_item`
* Every mutation (`grab`, `ungrab`, `grabOnly`, `becomeFocus`) creates a NEW `S_Recent` snapshot with CLONED grabs
* Fixes the "reference vs copy" problem identified above

The analysis in this document is now **historical** — it describes the old architecture that has been replaced.
