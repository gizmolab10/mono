# Separator

A small visual divider used between sections inside a panel. Either a horizontal bar or a vertical bar.

## Location

`src/lib/svelte/mouse/Separator.svelte`

## What it shows

A flat bar of fixed thickness in the project's accent color. Each end of the bar carries four corner fillets (quarter-circle arcs) that smooth the transition into the surrounding panel.

## Two sizes

- **content.** The thinner kind, used inside panels between sections (the parts panel between sub-panels, the preferences panel between rows).
- **main.** The thicker kind, used between top-level layout regions when a heavier separator is wanted.

The thickness and fillet radius for each size live in the constants module.

Citation: `src/lib/ts/common/Constants.ts` — `thickness.separator.content`, `thickness.separator.main`, `radius.content`, `radius.main`.

## Props

- **vertical.** When set, the separator is a vertical bar instead of a horizontal one.
- **spacer.** When set, the separator becomes a flexible spacing element instead of a visible bar — used inside flex rows to push content apart.
- **z_layer.** Which layer to render on. Defaults to the layout layer.
- **kind.** Either `content` (default) or `main` — picks the size.

## What it does NOT do

It does not register itself as a clickable target. The user does not interact with separators directly.

## CSS shape

The bar uses `position: relative` so the four corner-fillet SVGs can be absolutely positioned at its ends. The bar's background is the accent color so it blends into the panel header strip. The fillets are filled with the same accent color so they appear as smooth carved-out corners against whatever sits next to the bar.

## Related files

- `src/lib/ts/common/Constants.ts` — sizes and radii.
- `src/lib/ts/utilities/Colors.ts` — the accent color the separator picks up.
- `src/lib/ts/types/Enumerations.ts` — the layer enum used by the `z_layer` prop.
