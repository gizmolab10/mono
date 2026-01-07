# Gull Wings

Decorative curved corners for separators.

## Location

`src/lib/svelte/layout/Gull_Wings.svelte`

## Purpose

Draws curved SVG arcs at the ends of separators. Creates a "gull wing" shape — two quarter-circle arcs facing opposite directions.

## Visual

```
Direction: right     Direction: left
    ╭                    ╮
    ╰                    ╯

Direction: down      Direction: up
    ╮╭                   ╯╰
```

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `radius` | `number` | `6` | Arc radius |
| `thickness` | `number` | `1` | Stroke width |
| `direction` | `Direction` | `Direction.right` | Which way wings point |
| `color` | `string` | `'black'` | Fill/stroke color |
| `center` | `Point` | `Point.zero` | Position offset |

## State

None — purely presentational.

## Rendering

Uses SVG `<path>` with arc commands. Path is computed from:
- `radius` — size of the arcs
- `direction` — rotation angle (from `Direction` enum)
- `center` — position offset

## Dependencies

- `Point` — coordinate class
- `Direction` — enum with angle values (up, down, left, right)
- `Angle` — angle constants

## Simplifications from webseriously

- Removed: `T_Layer` z-index
- Removed: `svgPaths.gull_wings()` helper (inline the path logic)
- Cleaner: compute path directly in component
