# Repeaters

a repeater automagically adds/removes repeated elements — stairs (rise range), studs (building code spacing), joists, ramps. no modes: it's all linear repeat with different template shapes and constraints.

## What distinguishes use cases

| Thing        | Template shape        | Parent rotation          | Constraint                      |
| ------------ | --------------------- | ------------------------ | ------------------------------- |
| Stairs       | step (wide, shallow)  | atan(h/l) on repeat_axis | gap_min/gap_max (rise range)    |
| Studs        | stud (tall, narrow)   | none                     | spacing (discrete: 12/16/24 OC) |
| Floor joists | joist (long, shallow) | none                     | spacing (discrete: 12/16/24 OC) |
| Roof joists  | joist (long, shallow) | pitch angle              | spacing (discrete: 12/16/24 OC) |

## Configuring stairs

### Setup

1. **Create the stair envelope** — a parent SO sized to the full staircase. Width = tread width, one horizontal axis = total run, the other = total rise. Example: `w=2', d=8', h=10'`.
2. **Add one child** — the template step. Size it to one tread: `w=2', d=10", h=7"`. The repeater overrides positioning, so rough is fine.
3. **Click "repeat"** on the parent. Count is determined by the constraint — no formula needed.

### Repeater settings

4. **Axis** — set repeat_axis to the direction steps march along (x or y). This is the run direction.
5. **Constraint → range** — activates gap_min / gap_max. Defaults: 6" (152.4 mm) min, 8" (203.2 mm) max — standard residential rise range.
6. **Gap along** — set to `z` if rise is vertical, or leave on `repeat` if the constraint dimension matches the march direction. For stairs where steps go horizontally but rise vertically, pick `z`.

### How it resolves

The engine calls `resolve_gap(parent_dim_along_gap_axis, gap_min, gap_max)` to find a count where each gap falls in range, preferring the midpoint. Each clone offsets by `parent_run / count` along repeat_axis **and** `parent_height / count` along gap_axis — producing the diagonal stair pattern. No rotation needed.

The readout shows: `count × gap (axis) = total`. Example: `14 × 6 3/4" (y) = 8'` — 14 steps, 6 3/4" rise each, spanning 8' total along y.

## Validation — phantom stairs

extend the stair pattern by one in each direction. step[-1] should sit just below floor. step[count] should land just beyond the top. if both match, the geometry is right.
