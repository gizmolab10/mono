# Aesthetics

Visual design constants and patterns.

## Separators

Separators create visual boundaries between regions. They consist of:
1. A colored bar (the separator itself)
2. Fillets at the ends (where they meet other separators)

| Constant | Value | Usage |
|----------|-------|-------|
| `k.thickness.separator.main` | 5 | Gap width, stroke thickness |
| `k.radius.fillets.thick` | 14 | Fillet arc radius |
| `k.radius.fillets.thin` | 8 | Smaller fillet option |
| `k.radius.fillets.ultra_thin` | 5 | Minimal fillet option |

### Separator Overlap Rule

**Key insight:** Separators extend `thickness/2` beyond their logical endpoints so that fillets align with the *centers* of intersecting separators.

```
                    ┃ ← intersecting separator (thickness = 5)
                    ┃
    ════════════════╮ ← fillet center aligns with separator center
                    ┃
                    ┃
```

**Implementation:**
- Length: `logicalLength + thickness` (extends `thickness/2` past each end)
- Offset: `-thickness/2` (starts at center of intersecting separator)

Example:
```typescript
// Extend by thickness/2 on each side
let hSeparatorLength = $derived(innerWidth + thickness);

// Offset negatively to reach intersecting separator center
<div style:margin-left = '{-thickness / 2}px'>
```

This ensures fillets sit centered on the intersecting separator rather than offset by half the thickness.

## Fillets

Quarter-circle arcs that smooth the corners where separators meet.

**Props:**
| Prop | Default | Purpose |
|------|---------|---------|
| `radius` | `k.radius.fillets.thick` (14) | Arc size |
| `thickness` | `k.thickness.separator.main` (5) | Stroke width |
| `color` | `w_separator_color` | Fill and stroke color |
| `direction` | — | Which way the arc curves (up/down/left/right) |

**Rendering:** Two connected quarter arcs forming a half-circle wing shape. The SVG viewBox is expanded by `thickness` to prevent stroke clipping.

**Separator props:**
| Prop | Default | Purpose |
|------|---------|---------|
| `hasFillets` | `true` | Show fillets at ends |
| `hasDoubleFillet` | `true` | Show fillets at both ends (vs. just start) |

## Box Component

Box uses absolute positioning with strategic separator placement:

- **Horizontal separators** (top/bottom): Full width, no fillets
- **Vertical separators** (left/right): 
  - Start at `y = thickness/2` (center of top separator)
  - End at `y = height - thickness/2` (center of bottom separator)
  - Have fillets at both ends

This ensures vertical fillet centers align with horizontal separator centers.

## Colors

Reactive color stores:

| Store | Default | Purpose |
|-------|---------|---------|
| `w_background_color` | `#F9E4BE` | Region backgrounds (peach) |
| `w_text_color` | `black` | Text color |
| `w_separator_color` | `#c55622ff` | Separator/fillet color (rust) |

Static colors:

| Property | Value | Purpose |
|----------|-------|---------|
| `background` | `white` | App window background |
| `thin_separator_line_color` | `#999999` | Optional divider lines |

## Layout

The panel fills the viewport with a Box container that has separators on all edges. Interior regions are separated by additional separators with fillets.

```
┌─────────────────────────────────────┐
│            Controls                 │
├──────────────╮╭────────────────────┤
│              ││                     │
│   Details    ││       Graph         │
│              ││                     │
└──────────────╯╰────────────────────┘
```

The fillets (╮╭╯╰) create smooth rounded transitions at separator intersections.

## Design Principles

1. **Consistent thickness** — Separators and fillet strokes share `k.thickness.separator.main`
2. **Overlap for alignment** — Separators extend `thickness/2` past endpoints to center fillets on intersections
3. **Substantial fillets** — Use `k.radius.fillets.thick` for prominent visual effect
4. **Unified color** — Separators and fillets both use `w_separator_color`
