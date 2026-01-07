# Gull Wings

Decorative curved corners for separators.

## Location

`src/lib/svelte/layout/Gull_Wings.svelte`

## Purpose

Draws curved SVG arcs at the ends of separators. Creates a "gull wing" shape — two quarter-circle arcs forming a half-circle that curves opposite to the direction.

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
| `color` | `string` | `'black'` | Fill/stroke color |
| `center` | `Point` | `Point.zero` | Position offset |
| `direction` | `Direction` | `Direction.right` | Which way separator extends |

## State

None — purely presentational.

## Rendering

Uses `svg_paths.gull_wings()` to generate the SVG path string. The path consists of two quarter-circle arcs that form a half-circle wing shape.

Path generation (from `SVG_Paths.ts`):
1. Calculate `baseAngle = direction + Angle.half` (opposite to direction)
2. Compute three points at `leftEndAngle`, `baseAngle`, and `rightEndAngle`
3. Draw: start → arc to middle → arc to end → line back to start

## Dependencies

- `Point` — coordinate class
- `Direction` — enum with angle values (up, down, left, right)
- `Angle` — angle constants
- `svg_paths` — singleton from `draw/SVG_Paths.ts`

## Related Files

| File | What it provides |
|------|------------------|
| `ts/draw/SVG_Paths.ts` | `svg_paths.gull_wings()` and `svg_paths.gull_wings_bounds()` |
| `ts/types/Angle.ts` | `Direction` enum, `Angle` constants |
| `ts/types/Coordinates.ts` | `Point` class with `fromPolar()` and `offsetBy()` |
