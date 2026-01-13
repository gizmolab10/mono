# Radial Paging System Architecture

Three clusters of widgets nestle around the radial ring. Often enough, there's not enough room. So, we show only a page at a time. The user can adjust the page. Lots of ghastly geometry goes into making it feel comfortable.

## Table of Contents
- [Overview](#overview)
- [Key Classes](#key-classes)
- [Architecture](#architecture)
  - [G_Pages](#g_pages)
  - [G_Paging](#g_paging)
  - [G_Cluster_Pager](#g_cluster_pager)
- [Layout Flow](#layout-flow)
- [Page Navigation](#page-navigation)
- [Paging UI](#paging-ui)
- [Constants](#constants)
- [Integration Points](#integration-points)
- [Edge Cases](#edge-cases)
- [Performance](#performance)
- [Related Files](#related-files)

## Overview

The radial graph supports paging when clusters have too many widgets to display comfortably. Three geometry classes coordinate to provide paging UI and state management.

## Key Classes

| Class | File | Purpose |
|-------|------|---------|
| `G_Paging` | `geometry/G_Paging.ts` | Paging calculations per predicate direction |
| `G_Pages` | `geometry/G_Pages.ts` | Page state management per Thing |
| `G_Cluster_Pager` | `geometry/G_Cluster_Pager.ts` | Paging arc geometry and UI |

## Architecture

### G_Pages

Tracks which page is currently visible for each Thing:

```typescript
class G_Pages {
    private pages_dict: Dictionary<number> = {};  // thingHID → page number

    get_page_forThingHID(hid: string): number {
        return this.pages_dict[hid] ?? 0;
    }

    set_page_forThingHID(hid: string, page: number) {
        this.pages_dict[hid] = page;
    }
}
```

Stored in Radial manager: `radial.g_pages`

### G_Paging

Computes paging for a specific predicate direction (contains, related, etc.):

```typescript
class G_Paging {
    page: number;               // Current page number
    count_pages: number;        // Total pages
    count_perPage: number;      // Widgets per page
    offset_first: number;       // Index of first widget on page

    constructor(
        count_total: number,    // Total widgets in cluster
        page: number            // Current page
    ) {
        this.count_perPage = k.count_perPage;  // From Constants
        this.count_pages = Math.ceil(count_total / this.count_perPage);
        this.page = Math.min(page, this.count_pages - 1);
        this.offset_first = this.page * this.count_perPage;
    }

    get count_onPage(): number {
        return Math.min(this.count_perPage, count_total - this.offset_first);
    }
}
```

### G_Cluster_Pager

Provides geometry for paging arc UI:

```typescript
class G_Cluster_Pager {
    arc: G_Arc;                 // Paging arc geometry
    thumb_angle: number;        // Current page indicator angle
    label_position: G_Point;    // Position for page label

    constructor(
        cluster: G_Cluster,
        g_paging: G_Paging
    ) {
        // Calculate arc spanning cluster
        this.arc = new G_Arc(
            cluster.start_angle,
            cluster.end_angle,
            cluster.radius_outer
        );

        // Calculate thumb position
        const thumb_fraction = g_paging.page / g_paging.count_pages;
        this.thumb_angle = this.arc.angle_at_fraction(thumb_fraction);

        // Calculate label position
        this.label_position = this.arc.point_at_angle(this.thumb_angle);
    }
}
```

## Layout Flow

1. **G_RadialGraph.layout()** iterates clusters
2. For each cluster with paging:
   ```typescript
   const page = radial.g_pages.get_page_forThingHID(thing.hid);
   const g_paging = new G_Paging(cluster.count_widgets, page);
   cluster.g_paging = g_paging;
   ```
3. **G_Cluster.layout()** uses `g_paging.offset_first` and `g_paging.count_onPage` to determine visible widgets
4. If `count_pages > 1`, create `G_Cluster_Pager` for UI
5. **Svelte components** render paging arc and controls

## Page Navigation

```typescript
// In Radial manager or cluster interaction
function next_page(thing: Thing) {
    const current = radial.g_pages.get_page_forThingHID(thing.hid);
    const total_pages = cluster.g_paging.count_pages;
    const next = (current + 1) % total_pages;
    radial.g_pages.set_page_forThingHID(thing.hid, next);
    g.grand_build();  // Rebuild graph with new page
}
```

## Paging UI

**Slider mode** (T_Cluster_Pager.sliders):
- Draggable thumb on arc
- Shows current page / total pages
- Drag to change page

**Stepper mode** (T_Cluster_Pager.steppers):
- Previous/next buttons
- Page indicator
- Click to increment/decrement

Controlled by `show.w_t_cluster_pager` store.

## Constants

```typescript
// In Constants.ts
class Constants {
    count_perPage = 10;  // Default widgets per page
}
```

Can be overridden per cluster based on cluster size or user preference.

## Integration Points

- **Radial manager**: Owns `g_pages` instance
- **G_Cluster**: Uses `g_paging` to filter visible widgets
- **G_RadialGraph**: Creates `G_Paging` instances during layout
- **Visibility**: Controls pager UI mode (`w_t_cluster_pager`)
- **Geometry manager**: Triggers rebuild on page change (`g.grand_build()`)

## Edge Cases

1. **Single page**: No pager UI shown
2. **Last page**: May have fewer widgets than `count_perPage`
3. **Page out of bounds**: Clamped to valid range
4. **Empty cluster**: No paging needed
5. **Dynamic cluster size**: Pages recalculated on data changes

## Performance

- **Paging state**: O(1) lookup by thingHID
- **Page calculation**: O(1) per cluster
- **No re-indexing**: Pages stable until cluster size changes
- **Lazy rebuild**: Only recalculates on page change

## Related Files

- `src/lib/ts/geometry/G_Paging.ts`
- `src/lib/ts/geometry/G_Pages.ts`
- `src/lib/ts/geometry/G_Cluster_Pager.ts`
- `src/lib/ts/managers/Radial.ts`
- `src/lib/svelte/radial/Cluster_Pager.svelte`
