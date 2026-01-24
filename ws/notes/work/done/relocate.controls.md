# Relocate Controls

## Problem

Two segmented controls were positioned inline with other controls instead of at the far right edge.

## Goal

Move breadcrumb-type (focus/selection/recents) and focus-response-type (static/dynamic) to far right of their respective control bars.

## Work Performed

### Primary_Controls.svelte

Moved breadcrumb-type Segmented from `lefts[6]` to `width - 80 - 6`:

```svelte
<!-- Before -->
origin={Point.x(lefts[6])}

<!-- After -->
origin={Point.x(width - 80 - 6)}
```

### Tree_Controls.svelte

Moved focus-response-type Segmented from `lefts[2]` to `g.windowSize.width - 50 - 22`:

```svelte
<!-- Before -->
origin={new Point(lefts[2], 5)}

<!-- After -->
origin={new Point(g.windowSize.width - 50 - 22, 5)}
```

### Search.svelte

Moved search-filter Segmented (title/trait) to far right:

```svelte
<!-- Before -->
left={60}
origin={new Point(-12, 1)}

<!-- After -->
origin={new Point(graph_width() - width - 22, 1)}
```

## Status

✅ Complete - verify visually
