# Aesthetics

Visual design constants and patterns.

## Separators

Separators create visual boundaries between regions. They consist of:
1. A transparent gap (the separator itself)
2. Fillets at the ends (where they meet content regions)

| Constant | Value | Usage |
|----------|-------|-------|
| `k.thickness.separator.main` | 5 | Gap width, stroke thickness |
| `k.radius.fillets.thick` | 14 | Fillet arc radius |
| `k.radius.fillets.thin` | 8 | Smaller fillet option |
| `k.radius.fillets.ultra_thin` | 5 | Minimal fillet option |

## Fillets

Quarter-circle fillets that smooth the corners where separators meet content.

**Anatomy:**
- `radius` — arc size (default: `k.radius.fillets.thick` = 14)
- `thickness` — stroke width (default: `k.thickness.separator.main` = 5)
- `color` — matches separator color

**Visual effect:** The stroke adds bulk around the filled arc, creating a substantial fillet that visually connects the separator to adjacent regions.

## Colors

Reactive color stores in `Colors.ts`:

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
2. **Substantial fillets** — Use `k.radius.fillets.thick` for prominent visual effect
3. **Transparent separators** — Let app window background (white) show through
4. **Colored fillets** — Fillets use `w_separator_color` to mark boundaries
