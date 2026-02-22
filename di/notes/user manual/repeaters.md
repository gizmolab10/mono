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

1. **Create a block** representing the staircase, with one end at the starting position.
2. **Pin that end** (start of stairs).
3. **Drag the other end** to the destination — this sets the staircase angle naturally. The block becomes the hypotenuse.
4. **Add one child** — the template step. Size it to one tread: `w=3', d=8", h=1.5"`. The repeater overrides positioning, so rough is fine.
5. **Click "repeat"** on the parent.

### Repeater settings

1. **Axis** — set repeat_axis to the direction steps march along (x or y). This is the hypotenuse direction.
2. **Constraint → range** — activates gap_min / gap_max. Defaults: 6" (152.4 mm) min, 9" (228.6 mm) max — standard residential rise range.

No "gap along" selector needed — the engine derives rise from the parent's rotation angle.

### How it resolves

The engine detects the parent's axis angle. Rise = `parent_length × sin(angle)`. It calls `resolve_gap(total_rise, gap_min, gap_max)` to find a count where each rise falls in range. Steps repeat linearly along the hypotenuse. Each clone counter-rotates by `-parent_angle` to keep treads level.

The readout shows: `count × rise (rise) = total`. Example: `16 × 7½" (rise) = 10'` — 16 risers, 7½" each, spanning 10' total rise.

## Validation — phantom stairs

extend the stair pattern by one in each direction. step[-1] should sit just below floor. step[count] should land just beyond the top. if both match, the geometry is right.
