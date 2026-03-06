# Repeaters

Automagic clone generation. a parent SO with a repeater config produces copies of its first child (the template) along a chosen axis. studs, joists, stairs, and ramps are all the same mechanism — what varies is the template shape, parent rotation, and constraints.

## Files

- `src/lib/ts/render/Engine.ts` — `sync_repeater()`, the core engine logic
- `src/lib/svelte/details/P_Repeat.svelte` — repeater controls UI
- `src/lib/ts/render/R_Dimensions.ts` — fireblock dimensional rendering

## Data model

The `repeater` field on Smart_Object:

| Field | Type | Purpose |
|-------|------|---------|
| `run_axis` | `0 \| 1` | which axis clones march along (never 2) |
| `gap_min` / `gap_max` | `number?` | constrained spacing range in mm (stairs) |
| `spacing` | `number?` | discrete spacing in mm (studs: 304.8 / 406.4 / 609.6 for 12/16/24") |
| `firewall` | `boolean?` | add horizontal fire blocks between clones |
| `is_diagonal` | `boolean?` | UI-only flag for straight vs diagonal button state |
| `is_repeating` | `boolean?` | true when actively repeating |

Clones are never serialized. only the parent (with repeater config) and the template (first child) are saved. on load, `propagate_all()` triggers `sync_repeater` on every repeater, regenerating all clones.

## Engine: sync_repeater

The workhorse. called after any propagation that touches a repeater SO.

### Count resolution

- **gap constraints** (stairs): `resolve_gap(gap_length, gap_min, gap_max)` — finds count where `total / count` falls within [min, max], prefers even division
- **spacing** (studs): `count = floor((parent_length - template_dim) / spacing)`
- **bookend**: if the envelope extends past the last clone, a bookend clone is placed at the end. if the remaining space is less than the template thickness but more than zero, the last regular clone is shoved back to make room (tight bookend), and the fireblock between them shrinks to fit

### Clone placement

Each clone gets an offset along the repeat axis: `step * (i + 1)` from the template position. bookend clones use `bookend_offset` instead. shoved clones use `shoved_offset`.

### Diagonal (stairs)

When `gap_axis !== repeat_axis`, the engine offsets clones along two axes simultaneously:

- `step` along the run axis (distributes treads horizontally)
- `gap_step` along the gap axis (distributes treads vertically)

the staircase is emergent — the engine doesn't know about "stairs." it just sees that the gap constraint axis differs from the repeat axis.

### Fireblocks

Horizontal members inserted between clones at mid-height. sized to the bay gap (distance between adjacent clone faces). the last bay may be shorter if there's a tight bookend — its fireblock is sized accordingly.

## Display

`P_Repeat.svelte` shows:

- clone count (natural counting — includes the template, so 7 identical studs = "7 repeats")
- fireblock count
- straight/diagonal mode buttons
- spacing slider (studs: sticky at 12, 16, 24 inches)
- rise range dual-thumb slider (stairs: gap_min / gap_max)
- axis toggle (x / y)

## Dimensionals integration

Repeater clones skip dimensionals to avoid visual clutter. exceptions:

- **template** (first child): gets all axes, like any normal SO
- **first fireblock**: gets repeat-axis dimensional only (so you can see the bay spacing)
- **last fireblock**: gets repeat-axis dimensional only if it's shortened (different length than the first fireblock, indicating a tight bookend bay)

Fireblocks are identified by comparing their repeat-axis length to the template's — they differ because fireblocks span the bay, not the stud width.

## Use cases

| Thing | Template | Parent rotation | Constraint |
|-------|----------|-----------------|------------|
| Stairs | step (wide, shallow) | atan(h/l) on repeat_axis | gap_min/gap_max (rise range) |
| Studs | stud (tall, narrow) | none | spacing (12/16/24 OC) |
| Floor joists | joist (long, shallow) | none | spacing (12/16/24 OC) |
| Roof joists | joist (long, shallow) | pitch angle | spacing (12/16/24 OC) |
