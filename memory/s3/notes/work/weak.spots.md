# Weak Spots

Issues in the s3 subsystem specs — vague areas, spec-vs-reality drift, and genuinely unclear designs. Future-phase features excluded.

---

## Spec drift: ws specs misrepresenting s3

These files describe ws's architecture. s3 diverged intentionally. They're useful as aspirational references but misleading as current truth.

| Spec file | ws description | s3 reality |
|---|---|---|
| `5 hierarchy.md` | 100+ method god object, 8 responsibilities, orphan recovery, bulk aliases | Thin `$state` Map holder with remember/forget/query. No god object. |
| `9 ux.md` | `S_Items<T>`, `S_Alteration`, `S_Widget`, `S_Element`, `S_Snapshot`, `S_Rotation`, `S_Rubberband` | Simple `S_UX` class: focus, grabs, expansion, editing. No generic collections. |
| `12 signals.md` | Priority-based pub/sub signal system, 5 `T_Signal` types | No signals. Svelte 5 reactivity (`$state`, `$derived`, `$effect`) replaces pub/sub entirely. |
| `13 managers.md` | 12-step startup, Configuration, Components registry, Elements registry, Styles, Radial state | Minimal startup. No component registry. No elements manager. No styles manager. |

**Risk:** A new collaborator reading these specs would build the wrong mental model.

---

## Database layer (11 database.md)

- **No error recovery documented.** What happens when Firebase fetch fails? Snapshot deferral error handling unspecified. No timeout, no retry, no fallback.
- **Echo suppression relies on object equality.** `remoteThing.isEqualTo(this.addedThing)` — timing-dependent. If network is slow and echo arrives after reference is cleared, suppression fails.
- **Snapshot deferral pattern fragile.** Sets `deferSnapshots = true`, then `addDoc`, then `handle_deferredSnapshots` — if addDoc throws, deferred snapshots never flush.

---

## Geometry (7 geometry.md)

- **Widget width has magic numbers.** Formula includes hardcoded `- 1`, `- 4`, `+ 18` offsets without explanation.
- **Scale factor disabled.** `set_scale_factor()` is entirely commented out — zoom via CSS transform works, but geometry-level scaling is broken.
- **No performance analysis for large trees.** `subtreeHeight` is recursive with no memoization. Deep trees with many branches could be expensive.

---

## Ancestry (8 ancestry.md)

- **Depth limit has overlapping checks.** `hidden_by_depth_limit` and `children_hidden_by_depth_limit` are near-redundant conditions — easy to use the wrong one.
- **Path validation edge cases sparse.** `containsMixedPredicates` and `containsReciprocals` — when exactly do they fail? What's the recovery path?

---

## Entities (4 entities.md)

- **`trait_forType` ignores its argument.** Marked as "likely a stub" in spec but still referenced.
- **`T_Order` dual-slot system unclear.** Comment in spec says "need two orders, so .... ???" — design intent never resolved.
- **Reversed relationship ID asymmetry.** Short IDs get reversed; long IDs get fresh IDs. No rationale documented.

---

## Hit detection (12 signals.md)

- **Double-click state machine edge case.** If a third click arrives during the double-click timer window, behavior undefined.
- **Autorepeat and long-click thresholds hardcoded.** 800ms long-click, 400ms double-click, 150ms autorepeat — no customization, no rationale for values.

---

## Types (3 types.md)

- **String vs integer enum choice inconsistent.** Some `T_*` enums use strings, others use integers starting at 0. No rationale documented for which approach applies where.
- **Singleton lifecycle undocumented.** 25+ global singleton exports — instantiation order and initialization sequence not specified.

---

## Utilities (10 utilities.md)

- **SVG arc path math undocumented.** `arc_partial`, `startOutAt` — radius, flags, coordinates all implicit. Would require reverse-engineering to modify.
- **Constants has 40+ magic numbers.** Values like `tiny_outer_dots.diameter = 20`, `controls_boxHeight` — no explanation for why these specific numbers.
