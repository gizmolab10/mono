# Details

The left sidebar. Three collapsible panels inside a banner-zone.

### File structure

```
svelte/details/
  Details.svelte       — layout shell, banner-zone, three Hideables
  Hideable.svelte      — generic collapsible: banner button + slot
  D_Preferences.svelte — units, precision, line thickness, colors
  D_Selection.svelte   — SO name, bounds table, rotation angles
  D_Library.svelte     — import/export
```

### Details.svelte

Thin shell. Reads reactive color stores (`w_text_color`, `w_background_color`, `w_accent_color`) and sets CSS vars (`--accent`, `--bg`). Wraps three `<Hideable>` in a `.banner-zone` div. No business logic — all content lives in D_* components.

### Hideable.svelte

Visibility is driven by a bitmask — `w_t_details` store holds a `T_Details` enum, and each Hideable XORs its bit on toggle. One store, one bitmask, replaces three separate boolean stores.

- Banner: pill-shaped button (22px tall, `border-radius: 11px`, no border)
- `::before` pseudo-element for `colors.banner` radial gradient
- Hover (`[data-hitting]`): gradient replaced with `var(--bg)`
- Slot: panel background, 11px border-radius, appears below banner when open
- Wired to `hit_target` system, `hits.recalibrate()` on toggle
- Z-index layering via `T_Layer.common` and `T_Layer.hideable`

### D_Selection.svelte

The meat of the sidebar. Shows details for the selected SO (or root if nothing selected).

- **Name field** — editable input, syncs with `face_label` editor for inline canvas rename. Focus/blur/keydown handlers manage the `T_Editing` state machine.
- **Bounds table** — nine rows (x/X/w, y/Y/h, z/Z/d). Each row shows:
  - Label (attribute name)
  - Invariant marker (cross icon, clickable to pin which attribute stays fixed during drag)
  - Formula cell (editable, e.g. `B.w + 10`)
  - Value cell (editable, formatted per current unit system and precision)
- **Rotation angles** — three rows (x/y/z), degrees with half-degree rounding. Editable.
- **Rotation lock** — cross marker on one axis, constraining rotation to that axis.
- **Add child** button — calls `engine.add_child_so()`

### D_Preferences.svelte

- **Unit system** — select dropdown (`T_Units`: imperial, metric, etc.)
- **Precision** — segmented control. Imperial: foot → 1/64". Decimal: whole → 3 places. Auto-clamps if switching systems.
- **Line thickness** — range slider, 0.5–4px in 0.5 steps
- **Colors** — accent and edge color pickers

### D_Library.svelte

Buttons: import, save, clear. Save calls `scenes.add_to_library()` (IDB + download).

### Banner-zone styling

- `background: var(--accent)` fills gaps between pill banners
- `::after` pseudo-element: 11px tall, `var(--bg)` background, `border-radius: 11px 11px 0 0` — rounded footer below last hideable
- Last hideable's slot gets `border-bottom: 3px solid var(--accent)`
