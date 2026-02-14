# Details

### File structure

```
svelte/details/
  Details.svelte      — layout shell, banner-zone, three Hideables
  Hideable.svelte     — generic collapsible: banner button + slot
  D_Preferences.svelte — units, precision, line thickness, colors
  D_Selection.svelte   — name field, add-child button
  D_Library.svelte     — import/export buttons
```

### Details.svelte

Thin shell. Sets CSS vars (`--accent`, `--bg`) and wraps three `<Hideable>` in a `.banner-zone` div. No business logic — all content lives in D_* components.

### Hideable.svelte

- Banner: pill-shaped button (22px tall, `border-radius: 11px`, no border)
- `::before` pseudo-element for radial gradient glow
- Hover (`[data-hitting]`): gradient replaced with `var(--bg)` (panel background)
- Slot: panel background, 11px border-radius, appears below banner when open
- Wired to `hit_target` system, `hits.recalibrate()` on toggle

### Banner-zone styling

- `background: var(--accent)` fills gaps between pill banners
- `::after` pseudo-element: 11px tall, `var(--bg)` background, `border-radius: 11px 11px 0 0` — rounded footer below last hideable
- Last hideable's slot gets `border-bottom: 3px solid var(--accent)`

### Visibility

Each hideable backed by a persistent `Writable<boolean>` store (`w_show_preferences`, `w_show_selection`, `w_show_library`) saved to localStorage via `T_Preference` enum keys.