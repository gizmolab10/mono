# Fillets

Decorative curved corners for separators.

## Location

`src/lib/svelte/layout/Fillets.svelte`

## Purpose

Draws curved SVG arcs at the ends of separators. Creates a fillet shape — two quarter-circle arcs forming a half-circle that curves opposite to the direction.

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
| `radius` | `number` | `k.radius.fillets.thick` | Arc radius |
| `thickness` | `number` | `k.thickness.separator.main` | Stroke width |
| `color` | `string` | `'black'` | Fill/stroke color |
| `center` | `Point` | `Point.zero` | Position offset |
| `direction` | `Direction` | `Direction.right` | Which way separator extends |

## State

None — purely presentational.

## Rendering

Uses `svg_paths.fillets()` to generate the SVG path string. The path consists of two quarter-circle arcs that form a half-circle fillet shape.

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
| `ts/draw/SVG_Paths.ts` | `svg_paths.fillets()` and `svg_paths.fillets_bounds()` |
| `ts/types/Angle.ts` | `Direction` enum, `Angle` constants |
| `ts/types/Coordinates.ts` | `Point` class with `fromPolar()` and `offsetBy()` |
