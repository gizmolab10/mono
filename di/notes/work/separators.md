# Work

Separator is cumbersome to use, this is not acceptable

- [x] describe current design of Separator.svelte
- [x] eliminate the need for end and gap in separator
- [ ] add radius (flare) and thickness (bar) to props
- [ ] auto compute thickness to behave like a spacer
    - [ ] larger fatter separators, play with over doing it
        - [ ] bottom of details
            - [ ] a. lot when all closed
        - [ ] around the centered groups
- [x] revise Separator simplify its css footprint

---

- [ ] add a sep -> graph (for sliders, build notes)
    - [ ] eliminate crumbs

## current design

### props

| Prop | Default | Purpose |
|------|---------|---------|
| `kind` | `'content'` | Picks thickness: `content` (3.3px), `banners` (5.5px), `main` (6.6px) |
| `vertical` | `false` | Orientation — swaps width/height and margin axes |
| `margin` | `11` | Negative offset at the **start** (left or top) — pulls separator into adjacent space |
| `end` | `1` | Negative offset at the **end** (right or bottom) — same idea, opposite side |
| `length` | `0` | Fixed pixel length for vertical separators; when 0, uses `align-self: stretch` instead |
| `title` | — | Centered label text, 60% opacity, full on hover when clickable |
| `onclick` | — | Makes it a clickable button (via `hit_target` action) |
| `z_layer` | `T_Layer.layout` | z-index control |

`kind` maps to a CSS variable indirection: the component sets `--th` to one of `--th-content-sep`, `--th-thin-sep`, or `--th-sep`, which are defined globally in App.svelte from `k.thickness.separator.*`. All three derive from `common_size` (33).

### rendering

A `<button>` element with two SVG **flares** — one at each end.

**Flares** are quarter-circle arc pairs (`svg_paths.flares(r)`) that create a concave pinch where the separator meets perpendicular structure. The radius `r = thickness × 3`, the SVG width `w = r × 7/3`. The second flare is `rotate(180)` (vertical) or `rotate(±90)` (horizontal) to mirror the first.

A `::before` pseudo-element extends behind the flares as a backdrop strip (same background color). On horizontal separators it extends `calc(-1 * var(--r))` left and right; on vertical it just fills the element bounds.

### css mechanics

The separator's actual rendered size exceeds its logical slot through negative margins:

```
horizontal:
  margin:  4px  calc(-1 * var(--e))  4px  calc(-1 * var(--m))
  width:   calc(100% + var(--m) + var(--e))
  height:  var(--th)

vertical:
  margin:  calc(-1 * var(--m))  4px  calc(-1 * var(--e))
  width:   var(--th)
  height:  stretch (or fixed via `length` prop)
```

`--m` = `margin` prop (px), `--e` = `margin + end` prop (px). The 4px lateral margins give breathing room on the non-extension axis.

The negative-margin + overcalculated-width trick makes the separator bleed past its container edges so the flares land centered on intersecting separators (same idea as the overlap rule in aesthetics.md).

### usage patterns

**Controls** (heavy usage) — passes `margin`, `end`, `kind="main"`, `length`, `z_layer` explicitly. Uses separator length calculations and fractional margins (`margin * 0.9`). Most complexity lives here.

**Details panels** (light usage) — bare `<Separator />` with all defaults. These are simple content dividers at 3.3px thickness, no flares visible at that small radius, no click behavior.

### pain points (why this is cumbersome)

1. `end` and `margin` are confusing — they're both "how far to extend past the container" but on opposite sides, with `end` getting `margin` added to it again in the style binding (`margin + end`), so the caller has to mentally subtract
2. The negative-margin overflow trick requires the caller to know the layout context — what's adjacent, how far to bleed
3. `length` only applies to vertical, `align-self: stretch` only kicks in when `length` is 0 — two different sizing modes in one component
4. Flare radius is derived from thickness (`× 3`) then width from radius (`× 7/3`) — hard to predict visually without running it
5. The `::before` backdrop extension is a second layer of overflow logic on top of the negative margins

### proposal to reduce / eliminate the pain points

**1. Kill `end` and `margin` — let the separator own its own bleed**

Right now every caller does the math: "the container has padding X on the left and gap Y on the right, so pass `margin={X}` and `end={Y}`." That's layout knowledge leaking into every call site.

Instead: a single `bleed` prop (default `true`) that tells the separator to extend past its parent using a fixed overshoot derived from `kind`. The separator already knows its thickness and flare radius — it can compute its own overshoot. For the rare case where asymmetric extension is needed (Controls has `margin * 0.9`), accept an optional `bleed` override as a number (px) or `{start, end}` object.

Eliminates: `margin`, `end`, the `--m`/`--e` CSS variables, and the `margin + end` double-add confusion.

**2. Replace negative-margin overflow with CSS `overflow: visible` on the parent**

The negative-margin trick exists because the separator needs to visually exceed its flex slot. But if the parent allows `overflow: visible` (which it already does in most cases — checked Controls and details panels), the separator can just be its natural size and let the flares overflow. The colored bar stays within the slot; only the flares (already absolutely positioned SVGs) extend beyond.

This means the separator's `width` becomes simply `100%` (horizontal) or `height: 100%` / fixed (vertical), no calc. The `::before` backdrop pseudo-element goes away entirely — it only exists to fill the gap created by the negative margin extension.

**3. Collapse the two sizing modes into one**

Currently vertical separators have two paths: `length` prop (fixed px) vs `align-self: stretch`. Instead: always use `align-self: stretch` by default, and let the parent constrain height through its own layout. The `length` prop in Controls exists because `separator_length = k.height.controls + 2` — but Controls could just as easily set a fixed height on the separator's flex container or use `align-items: stretch` on the row. One fewer prop, one fewer conditional.

**4. Move flare geometry into CSS or constants**

`r = thickness × 3` and `w = r × 7/3` are magic. Two options:
- a. Add `flare_radius` and `flare_width` to `k.thickness.separator` so they live next to the thickness values and can be tuned by hand
- b. Make flare size a ratio in Constants (`flare_scale: 3`) and derive the rest — at least the magic has a name

Either way the SVG dimensions become readable: `width={k.thickness.separator[kind].flare_width}` instead of `width={k.thickness.separator[kind] * 3 * 7 / 3}`.

**5. Net result for call sites**

Before (Controls):
```svelte
<Separator kind="main" margin={margin} end={k.layout.gap_small} />
<Separator vertical kind="main" length={separator_length} margin={-5} z_layer={T_Layer.layout} />
```

After:
```svelte
<Separator kind="main" />
<Separator vertical kind="main" z_layer={T_Layer.layout} />
```

Details panels already use bare `<Separator />` — they don't change at all.

