# Layout Algorithm

A component-based model for panel layout with rounded regions.

## Visual Model

```
╭─────────────────────────────────────╮  ← Box: outer separator + fillets
│  ╭─────────────────────────────╮    │
│  │        Controls             │    │  ← peach region
│  ╰─────────────────────────────╯    │
│  ════════════════════════════════   │  ← interior separator + fillets
│  ╭──────────╮  ╭───────────────╮    │
│  │          │  │               │    │
│  │ Details  ║  │    Graph      │    │  ← interior separator + fillets
│  │          │  │               │    │
│  ╰──────────╯  ╰───────────────╯    │
╰─────────────────────────────────────╯  ← Box: outer separator + fillets
```

## Component Hierarchy

| Component | Made of | Visual Effect |
|-----------|---------|---------------|
| **Box** | 4 separators + 4 corner fillets | Rounded frame around entire app |
| **Interior Separator** | Bar + 2 end fillets | Divides regions, rounds their corners |
| **Region** | Content area | Peach fill, corners rounded by adjacent fillets |
| **Fillet** | Quarter-circle arc | Curves into region at separator intersection |

## Key Insight

Every rounded corner on a region is created by a fillet belonging to an adjacent separator (either Box edge or interior separator). Regions themselves have no corner logic — their apparent rounded corners emerge from the fillets around them.

## Component Relationships

```
Box
├── Separator (top)
├── Separator (bottom)
├── Separator (left) + Fillets
├── Separator (right) + Fillets
└── Content
    ├── Region (controls)
    ├── Separator (horizontal) + Fillets
    └── Row
        ├── Region (details)
        ├── Separator (vertical) + Fillets
        └── Region (graph)
```

## Separator Anatomy

A separator consists of:
1. **Bar** — colored rectangle (`w_separator_color`)
2. **Fillets** — quarter-circle arcs at ends (0, 1, or 2)

```
Single fillet:     Double fillet:
    ╭                  ╭
    ║                  ║
    ║                  ║
    ║                  ╯
```

## Fillet Placement Rule

Fillets curve **into** the regions they touch, **away** from the separator they belong to.

```
Separator extends right → Fillet curves left (into region)

    Region A  ║  Region B
              ╮
    ══════════╯
              ↑
         Fillet curves into Region A
```

## Overlap Rule

Separators extend `thickness/2` beyond their logical endpoints so fillets align with the centers of intersecting separators.

```
                    ┃ ← intersecting separator (thickness = 5)
                    ┃
    ════════════════╮ ← fillet center aligns with separator center
                    ┃
```

**Implementation:**
- Length: `logicalLength + thickness`
- Offset: `-thickness/2`

## Layout Algorithm (Draft)

1. **Define regions** — rectangles with position and size
2. **Identify gaps** — spaces between adjacent regions become separators
3. **Place separators** — fill gaps, extend by `thickness/2` at ends
4. **Add fillets** — at separator ends where they meet other separators
5. **Render order** — regions first (peach), then separators (rust), fillets inherit from separator

## Constants

| Constant | Value | Usage |
|----------|-------|-------|
| `k.thickness.separator.main` | 5 | Separator/fillet thickness |
| `k.radius.fillets.thick` | 14 | Fillet arc radius |

## Open Questions

- [ ] How to specify which separators get fillets (Box edges vs interior)?
- [ ] How to handle T-junctions (3-way intersections)?
- [ ] Should regions know about their corner radii for hit testing?
