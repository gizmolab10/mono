
i want separators that play well, with no weird visual side effects, like unexpected clipping


## current design

**shape:** `flares(r)` — one SVG path, wide top (`w = r*7/3`), narrow bottom (`r/3`), concave quarter-circle sides. pure function, zero app dependencies.

### **data flow:**

```text
kind prop → k.thickness.separator[kind] (px) → r = th * 3.2 → w = r * 7/3
                                                      ↓
                                              svg_paths.flares(r) → path string
```

static. computed once at init, never reactive.

### **four flares from one path:**

| position | transform | SVG anchor |
| --- | --- | --- |
| vertical top | none | `top:0` centered on bar |
| vertical bottom | `rotate(180, w/2, r/2)` | `bottom:0` centered on bar |
| horizontal left | `rotate(-90, w/2, r/2)` | `left:-w/4` centered on bar |
| horizontal right | `rotate(90, w/2, r/2)` | `right:-w/4` centered on bar |

all four SVGs sit **on** the bar end, not outside it. wide end overflows away via `overflow:visible`. fill is `--accent` (blends with bar) or `--bg` (carves a notch). `::before` covers the bar only — no extensions needed.

### hit system

when `onclick` is provided, the separator registers as an `S_Hit_Target` (type: control) with a random uid. mouse-up triggers the callback. cleanup on unmount via `hits.delete_hit_target`.

### where it's used

- **controls** — vertical seps between button groups (thickness: `separator.main`, ~6.6px). horizontal seps between wrapped rows. the ham↔other separator uses `margin={7}` to extend upward into the controls bar edge.
- **details panels** — default horizontal seps (thickness: `separator.content`, ~3.3px) between sections in preferences, parts, and library.
