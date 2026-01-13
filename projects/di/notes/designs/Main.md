# Main

Root layout component. Manages viewport dimensions and orchestrates child regions.

## Location

`src/lib/svelte/layout/Main.svelte`

## Purpose

Full-viewport Box container that positions Controls, Details, and Graph regions with Separator components between them. Responds to window resize.

## Layout

```
╭─────────────────────────────────────────────────────╮
│                     Controls                        │
│                     (48px)                          │
├═════════════════════════════════════════════════════┤
│            Horizontal Separator (8px)               │
├───────────────╦═════════════════════════════════════┤
│               ║                                     │
│    Details    ║              Graph                  │
│   (280px)     ║            (flex: 1)                │
│               ║                                     │
│               ║  Vertical Separator (8px)           │
│               ║                                     │
╰───────────────╩═════════════════════════════════════╯
                Box (full viewport, 8px border)
```

## Props

None.

## State

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number` | `window.innerWidth` | Viewport width |
| `height` | `number` | `window.innerHeight` | Viewport height |
| `showDetails` | `boolean` | `true` | Toggle details visibility |

## Constants

| Name | Value | Description |
|------|-------|-------------|
| `separatorThickness` | `8` | Thickness of separator bars |
| `boxThickness` | `8` | Thickness of outer Box border |

## Derived

| Name | Type | Description |
|------|------|-------------|
| `controlsHeight` | `number` | Fixed at 48px |
| `detailsWidth` | `number` | Fixed at 280px |
| `innerWidth` | `number` | `width - boxThickness * 2` |
| `innerHeight` | `number` | `height - boxThickness * 2` |
| `mainHeight` | `number` | `innerHeight - controlsHeight - separatorThickness` |
| `graphWidth` | `number` | Remaining width after details + separator |

## CSS Classes

| Class | Purpose |
|-------|---------|
| `.panel` | Root container, fixed position |
| `.main` | Flex row for details + separator + graph |
| `.region` | Shared base for all content areas |
| `.controls` | Top bar region |
| `.graph` | Main content region, flex: 1 |
| `.details` | Left sidebar region, flex-shrink: 0 |

## Children

- `Box` — outer border with gull wings on all sides
  - `Controls` — top bar
  - `Separator` (horizontal) — below controls, with gull wings
  - `Details` — left sidebar (conditional on showDetails)
  - `Separator` (vertical) — between details and graph (conditional)
  - `Graph` — main canvas area

## Events

- `svelte:window onresize` — updates width/height state
