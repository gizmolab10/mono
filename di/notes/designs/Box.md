# Box

Bordered container with separators on all sides.

## Location

`src/lib/svelte/layout/Box.svelte`

## Purpose

Wraps content with separator borders on any combination of sides. Used for grouping related UI elements with visual boundaries.

## Visual

```
╭──────────────────────────╮
│                          │
│         content          │
│                          │
╰──────────────────────────╯
```

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number` | required | Box width |
| `height` | `number` | required | Box height |
| `showTop` | `boolean` | `true` | Show top separator |
| `showBottom` | `boolean` | `true` | Show bottom separator |
| `showLeft` | `boolean` | `true` | Show left separator |
| `showRight` | `boolean` | `true` | Show right separator |
| `thickness` | `number` | `8` | Separator thickness |
| `cornerRadius` | `number` | `6` | Gull wing radius |
| `children` | `Snippet` | — | Content to wrap |

## State

None — purely presentational.

## Styling

- Uses separators for borders (not CSS borders)
- Content area fills remaining space

## CSS Classes

| Class | Purpose |
|-------|---------|
| `.box` | Container, relative position |
| `.box-content` | Inner content area, flex: 1 |

## Children

- `Separator` components for each visible edge
- User-provided content via `children` snippet

## Simplifications from webseriously

- Removed: absolute positioning (`top`, `left`, `zindex`)
- Removed: `name` prop for class naming
- Uses snippets instead of slots
- Simplified structure — no nested wrapper divs
