# Details Panel Architecture

The details panel shows info about whatever's currently selected or in focus. Collapsible sections, coordinated with UX manager. Also, how how the sections track what to show?

## Table of Contents
- [Overview](#overview)
- [Key Classes](#key-classes)
- [Architecture](#architecture)
  - [Details Manager](#details-manager)
  - [Detail Types (T_Detail)](#detail-types-t_detail)
  - [S_Banner_Hideable](#s_banner_hideable)
- [Integration with UX Manager](#integration-with-ux-manager)
- [Banner System](#banner-system)
  - [Banner Visibility](#banner-visibility)
  - [Toggle Logic](#toggle-logic)
  - [Banner Titles](#banner-titles)
- [Navigation](#navigation)
  - [Section Navigation](#section-navigation)
- [Detail Components](#detail-components)
  - [D_Header.svelte](#d_headersvelte)
  - [D_Selection.svelte](#d_selectionsvelte)
  - [D_Tags.svelte](#d_tagssvelte)
  - [D_Traits.svelte](#d_traitssvelte)
  - [D_Actions.svelte](#d_actionssvelte)
  - [D_Preferences.svelte](#d_preferencessvelte)
  - [D_Data.svelte](#d_datasvelte)
- [Reactivity Pattern](#reactivity-pattern)
- [Hit Testing Integration](#hit-testing-integration)
- [Visibility Store Integration](#visibility-store-integration)
- [Constants](#constants)
- [Layout Flow](#layout-flow)
- [Edge Cases](#edge-cases)
- [Performance](#performance)
- [Comparison: Focus vs Details](#comparison-focus-vs-details)
- [Related Managers](#related-managers)
- [Best Practices](#best-practices)
- [Usage Example](#usage-example)

## Overview

The Details panel displays information about the current ancestry, integrating with UX manager to show context-appropriate content. It consists of multiple collapsible sections (banners) that can be toggled independently.

## Key Classes

| Class | File | Purpose |
|-------|------|---------|
| `Details` | `managers/Details.ts` | Manages banner state and navigation |
| `S_Banner_Hideable` | `state/S_Banner_Hideable.ts` | State for collapsible detail sections |
| `Banner_Hideable.svelte` | `svelte/details/` | Generic collapsible banner wrapper |
| Detail components | `svelte/details/D_*.svelte` | Individual detail section implementations |

## Architecture

### Details Manager

Coordinates detail panel state and provides navigation between sections:

```typescript
class Details {
    s_banner_hideables_dict_byType: Dictionary<S_Banner_Hideable> = {};
    t_storage_need = T_Storage_Need.direction;
    show_properties = false;

    constructor() {
        for (const t_detail of Object.values(T_Detail) as T_Detail[]) {
            this.s_banner_hideables_dict_byType[t_detail] = new S_Banner_Hideable(t_detail);
        }
    }
}
```

Creates one `S_Banner_Hideable` per detail type at initialization.

### Detail Types (T_Detail)

```typescript
enum T_Detail {
    header,       // Title/header display (no banner)
    actions,      // Action buttons
    selection,    // Selected ancestry details
    tags,         // Tags for current thing
    traits,       // Traits for current thing
    preferences,  // User preferences
    data,         // Additional data (bottom banner)
}
```

### S_Banner_Hideable

State for each collapsible detail section:

```typescript
class S_Banner_Hideable {
    slot_isVisible = false;
    t_detail!: T_Detail;
    hasBanner = false;      // header has no banner
    isBottom = false;       // data section is at bottom

    get si_items(): S_Items<any> {
        switch (this.t_detail) {
            case T_Detail.selection: return x.si_grabs;
            case T_Detail.tags:      return x.si_thing_tags;
            case T_Detail.traits:    return x.si_thing_traits;
            default:                 return S_Items.dummy;
        }
    }
}
```

Links detail sections to their data sources via UX manager.

## Integration with UX Manager

Details panel relies heavily on UX manager for data:

```typescript
// From Details components
const { w_ancestry_forDetails } = x;  // What to display
const { w_items: w_grabbed } = x.si_grabs;  // Selections
const { w_item: w_tag } = x.si_thing_tags;  // Current tag
const { w_item: w_trait } = x.si_thing_traits;  // Current trait
```

**Key insight**: Details panel displays `w_ancestry_forDetails`, which prioritizes:
1. Search selected result (if search active)
2. Current grab (if grabs exist)
3. Current focus

See [UX Manager documentation](../core/ux.md) for details.

## Banner System

### Banner Visibility

Controlled by `show.w_t_details` store (array of visible detail types):

```typescript
// From Visibility manager
w_t_details = writable<Array<T_Detail>>([]);

// Restore from preferences
this.w_t_details.set(p.read_key(T_Preference.detail_types) ??
    [T_Detail.actions, T_Detail.data]);
```

Default: Shows `actions` and `data` sections.

### Toggle Logic

```typescript
async function toggle_hidden(t_detail: string) {
    let t_details = $w_t_details;
    if (t_details.includes(t_detail)) {
        t_details = u.remove_fromArray_byReference(t_detail, t_details);
    } else {
        t_details.push(t_detail);
    }
    $w_t_details = t_details;
    await tick();
    hits.recalibrate();  // Update hit testing
}
```

### Banner Titles

Dynamic titles based on content and state:

```typescript
banner_title_forDetail(t_detail: T_Detail): string {
    const si_items = this.s_banner_hideables_dict_byType[t_detail].si_items;
    let title = T_Detail[t_detail];

    switch (t_detail) {
        case T_Detail.tags:
            title = si_items.title('tag', 'tags', title);
            break;
        case T_Detail.traits:
            title = si_items.title('trait', 'traits', title);
            break;
        case T_Detail.selection:
            if (search_active && multiple_results) {
                title = si_found.title('search result', 'focus', title);
            } else if (grabbed) {
                title = si_items.title('selected', 'focus', title);
            }
            break;
    }
    return title;
}
```

Examples:
- "1 tag" / "3 tags" / "tags"
- "search result 2/5" / "selected 1/3"

## Navigation

### Section Navigation

```typescript
select_next(banner_id: string, selected_title: string) {
    const next = T_Direction.next === selected_title;
    const t_detail = T_Detail[banner_id];

    switch (t_detail) {
        case T_Detail.traits:    x.select_next_thingTrait(next); break;
        case T_Detail.tags:      x.select_next_thing_tag(next); break;
        case T_Detail.selection: x.grab_next_ancestry(next); break;
    }
}
```

Delegates to UX manager for actual navigation logic.

## Detail Components

### D_Header.svelte

Header display showing thing title with color background:

```typescript
// Reactive to ancestry changes
$: ancestry = $w_ancestry_forDetails;
$: background_color = ancestry.thing?.color ?? 'transparent';
```

No banner (not collapsible).

### D_Selection.svelte

Most complex detail component - shows:

**Characteristics table**:
- Modified date
- Color picker (if editable)
- Children count
- Parents count
- Relateds count
- Progeny count

**Relationships table**:
- Tags count
- Traits count
- Depth
- Order

**Properties table** (collapsible):
- ID
- Ancestry ID
- Kind
- Type

```typescript
characteristics = [
    ['modified', thing.persistence.lastModifyDate.toLocaleString()],
    ['color',    ancestry.isEditable ? k.empty : 'not editable'],
    ['children', ancestry.children.length.supressZero()],
    ['parents',  thing.parents.length.supressZero()],
    ['relateds', thing.relatedRelationships.length.supressZero()],
    ['progeny',  ancestry.progeny_count().supressZero()],
];
```

**Color picker integration**: Uses Portal to render color picker at table cell location.

**Properties toggle**: Separator with gull wings controls `details.show_properties` flag.

### D_Tags.svelte

Simple tag display:

```typescript
const { w_item: w_tag } = x.si_thing_tags;

{#if !!$w_tag}
    {$w_tag?.type}
{:else}
    no tags
{/if}
```

### D_Traits.svelte

Similar to tags, displays current trait from `x.si_thing_traits`.

### D_Actions.svelte

Action buttons for thing manipulation (implementation in separate file).

### D_Preferences.svelte

User preferences controls (implementation in separate file).

### D_Data.svelte

Additional data display (implementation in separate file).

## Reactivity Pattern

Details components use reactive triggers to minimize re-renders:

```typescript
let trigger = k.empty;

$: {
    update_forAncestry();
    trigger = `${u.descriptionBy_title($w_grabbed)}
        :::${$w_ancestry_focus?.title}
        :::${$w_thing_title}
        :::${$w_ancestry_forDetails?.title}
        :::${$w_relationship_order}`;
}

{#key trigger}
    <!-- Component content -->
{/key}
```

Trigger combines multiple dependencies into single string. Only re-renders when combined string changes.

## Hit Testing Integration

Detail banners support hit testing for hover effects:

```typescript
<Glows_Banner
    titles={titles}
    width={k.width.details}
    toggle_hidden={toggle_hidden}
    banner_id={T_Detail[t_detail]}
    font_size={k.font_size.banners}
    isSelected={hideable_isVisible}
    height={g.glows_banner_height}/>
```

Hit testing recalibrated after visibility changes:

```typescript
async function toggle_hidden(t_detail: string) {
    // ... toggle logic ...
    await tick();
    hits.recalibrate();
}
```

## Visibility Store Integration

Details panel visibility controlled by `show.w_show_details`:

```typescript
// From Details manager
details_toggle_visibility() {
    show.w_show_details.update(n => !n);
}

// From Visibility manager
w_show_details = writable<boolean>(true);

// Restored from preferences
this.w_show_details.set(p.read_key(T_Preference.show_details) ?? false);
```

## Constants

```typescript
// From Constants.ts
k.width.details = 200;           // Panel width
k.height.empty = 30;             // Empty state height
k.font_size.details = 11;        // Detail text size
k.font_size.banners = 9;         // Banner text size
k.font_size.info = 8;            // Info text size
k.thickness.separator.details = 1.5;  // Separator thickness
```

## Layout Flow

1. **UX Manager** determines `w_ancestry_forDetails`
2. **Details Manager** creates `S_Banner_Hideable` instances
3. **Visibility Manager** controls which banners are visible
4. **Banner Components** (D_*.svelte) subscribe to ancestry changes
5. **Banner_Hideable.svelte** wraps each section with collapse logic
6. **Hit Testing** updated after visibility changes

## Edge Cases

1. **No ancestry**: Components show "nothing to show" message
2. **Search active**: Selection banner shows search result count
3. **Non-editable ancestry**: Color picker disabled
4. **Empty collections**: Show "no tags" / "no traits"
5. **Properties toggle**: Separator controls visibility of additional properties

## Performance

- **Reactive triggers**: Only re-render when combined dependencies change
- **Lazy rendering**: Collapsed sections use `{#if hideable_isVisible}`
- **Hit recalibration**: Only after visibility changes (not on every update)
- **S_Items integration**: Reuses UX manager's collections instead of duplicating

## Comparison: Focus vs Details

| Aspect | Focus | Details |
|--------|-------|---------|
| Purpose | Navigation target | Display target |
| Source | Latest in recents history | Prioritized selection |
| Priority | N/A | Search → Grabs → Focus |
| Store | `x.w_ancestry_focus` | `x.w_ancestry_forDetails` |
| Usage | Drives graph layout | Drives details panel |

This separation allows searching/multi-selecting while maintaining stable focus.

## Related Managers

- **UX**: Provides `w_ancestry_forDetails` and all S_Items collections
- **Visibility**: Controls banner visibility via `w_t_details`
- **Preferences**: Persists detail visibility and properties state
- **Hits**: Recalibrated when banners expand/collapse
- **Colors**: Provides color picker for selection details

## Best Practices

✅ **DO**:
- Use `w_ancestry_forDetails` for display (not `w_ancestry_focus`)
- Recalibrate hits after visibility changes
- Use reactive triggers to combine dependencies
- Check for null ancestry before rendering

❌ **DON'T**:
- Directly mutate `w_t_details` array (use toggle logic)
- Forget to call `hits.recalibrate()` after layout changes
- Duplicate S_Items from UX manager (reference them)
- Assume ancestry exists (check for null)
- Mix focus and details concepts

## Usage Example

```typescript
import { details } from '../managers/Details';
import { x } from '../managers/UX';

// Get current details ancestry
const ancestry = get(x.w_ancestry_forDetails);

// Navigate to next tag
details.select_next('tags', T_Direction.next);

// Toggle banner visibility
details.s_banner_hideables_dict_byType[T_Detail.traits].slot_isVisible = !slot_isVisible;

// Get banner title
const title = details.banner_title_forDetail(T_Detail.selection);

// Toggle entire details panel
details.details_toggle_visibility();
```
