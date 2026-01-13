# UX Manager Architecture

What's focused, what's grabbed, what's being edited, what to show in details. Stores and derived stores. Fast!

## Table of Contents
- [Overview](#overview)
- [Responsibilities](#responsibilities)
- [Stores](#stores)
  - [Primary Stores](#primary-stores)
  - [S_Items Collections](#s_items-collections)
- [Key Patterns](#key-patterns)
  - [Focus vs Details](#focus-vs-details)
  - [Derived Stores](#derived-stores)
  - [Recents Navigation](#recents-navigation)
- [Core Operations](#core-operations)
  - [Becoming Focus](#becoming-focus)
  - [Grab Management](#grab-management)
  - [Search Integration](#search-integration)
- [Details Priority](#details-priority)
- [Navigation](#navigation)
  - [Focus Navigation](#focus-navigation)
  - [Details Navigation](#details-navigation)
- [Trait and Tag Selection](#trait-and-tag-selection)
- [Initialization](#initialization)
- [Usage Frequency](#usage-frequency)
- [Related Managers](#related-managers)
- [Edge Cases](#edge-cases)
- [Design Notes](#design-notes)

## Overview

The UX manager (`x`) centralizes user interaction state, managing focus, selection, grabs, search results, and editing state. It coordinates between user actions and the application's hierarchical data structure.

## Responsibilities

1. **Focus Management** - Track current focus ancestry and navigation history
2. **Grab Management** - Multi-selection of ancestries for operations
3. **Details Display** - Determine which ancestry to show in details panel
4. **Search Integration** - Coordinate search results with grabs
5. **Editing State** - Track title editing and alteration modes
6. **Navigation** - Next/previous through focus history and selections

## Stores

### Primary Stores

| Store | Type | Purpose |
|-------|------|---------|
| `w_ancestry_focus` | `Readable<Ancestry \| null>` | Current focus ancestry (derived from recents) |
| `w_ancestry_forDetails` | `Readable<Ancestry \| null>` | Ancestry to display in details panel (prioritizes search → grabs → focus) |
| `w_s_title_edit` | `writable<S_Title_Edit \| null>` | Current title editing state |
| `w_s_alteration` | `writable<S_Alteration \| null>` | Current alteration mode (adding relationships) |
| `w_thing_title` | `writable<string \| null>` | Title being edited |
| `w_relationship_order` | `writable<number>` | Order for relationship relocations |
| `w_thing_fontFamily` | `writable<string>` | Font family for rendering |

### S_Items Collections

| Collection | Type | Purpose |
|------------|------|---------|
| `si_recents` | `S_Items<[Ancestry, S_Items<Ancestry> \| null]>` | Focus navigation history with associated grabs |
| `si_grabs` | `S_Items<Ancestry>` | Currently grabbed ancestries |
| `si_found` | `S_Items<Thing>` | Search results |
| `si_expanded` | `S_Items<Ancestry>` | Expanded nodes in tree |

## Key Patterns

### Focus vs Details

The UX manager distinguishes between **focus** (navigation target) and **details** (what's displayed in details panel):

- **Focus** (`w_ancestry_focus`): Always an ancestry, drives graph layout
- **Details** (`w_ancestry_forDetails`): Can be search result, grab, or focus (prioritized in that order)

### Derived Stores

Both `w_ancestry_focus` and `w_ancestry_forDetails` are **derived stores**, computed from other state:

```typescript
w_ancestry_focus = derived([si_recents.w_items, si_recents.w_index], ...)
w_ancestry_forDetails = derived([
    search.w_s_search,
    si_found.w_index,
    si_found.w_items,
    show.w_show_search_controls,
    si_grabs.w_items,
    si_grabs.w_index,
    w_ancestry_focus
], ...)
```

This ensures automatic reactivity when any dependent state changes.

### Recents Navigation

Focus history is stored as pairs: `[ancestry, grabs]`. This allows restoring both focus and grabs when navigating backward/forward:

```typescript
type Identifiable_S_Items_Pair = [Ancestry, S_Items<Ancestry> | null];
si_recents = new S_Items<Identifiable_S_Items_Pair>([]);
```

## Core Operations

### Becoming Focus

```typescript
becomeFocus(ancestry: Ancestry): boolean {
    const pair = [ancestry, this.si_grabs];
    this.si_recents.remove_all_beyond_index();  // Remove forward history
    this.si_recents.push(pair);                  // Add to history
    this.w_s_alteration.set(null);               // Clear alteration mode
    ancestry.expand();
    hits.recalibrate();
    return changed;
}
```

### Grab Management

**Grab** - Add ancestry to multi-selection (moves to end if already grabbed):
```typescript
grab(ancestry: Ancestry) {
    let items = this.si_grabs.items ?? [];
    const index = items.indexOf(ancestry);
    if (index != -1 && index != items.length - 1) {
        items.splice(index, 1);  // Remove from current position
    }
    items.push(ancestry);         // Add at end
    this.si_grabs.items = items;
}
```

**Ungrab** - Remove ancestry from multi-selection (defaults to root if empty):
```typescript
ungrab(ancestry: Ancestry) {
    let grabbed = this.si_grabs.items ?? [];
    const index = grabbed.indexOf(ancestry);
    if (index != -1) {
        grabbed.splice(index, 1);
    }
    if (grabbed.length == 0) {
        grabbed.push(h.rootAncestry);  // Never empty
    }
    this.si_grabs.items = grabbed;
}
```

**GrabOnly** - Replace grabs with single ancestry:
```typescript
grabOnly(ancestry: Ancestry) {
    this.si_grabs.items = [ancestry];
    h?.stop_alteration();
}
```

### Search Integration

When search is active, grabs are automatically updated to match search results:

```typescript
update_grabs_forSearch() {
    if (search.w_s_search != T_Search.off && si_found.length > 0) {
        let ancestries = si_found.items
            .map(found => found.ancestry)
            .filter(a => !!a);
        ancestries = u.strip_hidDuplicates(ancestries);
        if (this.si_grabs.descriptionBy_sorted_IDs != u.descriptionBy_sorted_IDs(ancestries)) {
            this.si_grabs.items = ancestries;
        }
    }
}
```

This runs on:
- Focus changes
- Database updates
- Search state changes
- Search result selection changes

## Details Priority

The `w_ancestry_forDetails` derived store implements priority logic:

1. **First Priority**: Search selected result (if search active and result selected)
2. **Second Priority**: Current grab (if grabs exist)
3. **Third Priority**: Current focus
4. **Fallback**: Root ancestry

This allows the details panel to show context-appropriate information while the user searches or multi-selects.

## Navigation

### Focus Navigation

```typescript
ancestry_next_focusOn(next: boolean) {
    if (si_recents.find_next_item(next)) {
        const [focus, grabs] = si_recents.item;
        focus?.expand();
        if (grabs) {
            this.si_grabs = grabs;  // Restore grabs from history
        }
    }
}
```

### Details Navigation

```typescript
grab_next_ancestry(next: boolean) {
    if (search.w_s_search > T_Search.off) {
        si_found.find_next_item(next);    // Navigate search results
    } else {
        si_grabs.find_next_item(next);    // Navigate grabs
    }
    details.redraw();
}
```

## Trait and Tag Selection

UX manager provides access to traits and tags for the current details ancestry:

```typescript
get si_thing_traits(): S_Items<Trait> {
    return this.ancestry_forDetails?.thing?.si_traits ?? new S_Items<Trait>([]);
}

get si_thing_tags(): S_Items<Tag> {
    return this.ancestry_forDetails?.thing?.si_tags ?? new S_Items<Tag>([]);
}
```

Navigation methods allow cycling through:
- `select_next_thingTrait(next)` - Traits for current details thing
- `select_next_trait(next)` - All traits in hierarchy
- `select_next_thing_tag(next)` - Tags for current details thing

## Initialization

```typescript
setup_subscriptions() {
    // Assert si_recents is seeded (restore_focus() should have been called)
    console.assert(si_recents.length > 0);

    // Setup reactive subscriptions
    w_ancestry_focus.subscribe(ancestry => update_grabs_forSearch());
    databases.w_data_updated.subscribe(() => update_grabs_forSearch());
    search.w_s_search.subscribe(() => update_grabs_forSearch());
    si_found.w_index.subscribe(() => update_grabs_forSearch());
}
```

**Critical**: `si_recents` must be populated before `setup_subscriptions()` is called, otherwise derived stores will fail.

## Usage Frequency

UX manager is heavily used throughout the codebase:
- **Ancestry.ts**: 18 references to `x.*`
- **Hierarchy.ts**: 16 references to `x.*`

Common usage patterns:
```typescript
import { x } from '../managers/UX';

// Access current focus
const focus = get(x.w_ancestry_focus);

// Grab an ancestry
x.grab(ancestry);

// Navigate focus history
x.ancestry_next_focusOn(true);  // next
x.ancestry_next_focusOn(false); // previous

// Get details ancestry
const details = x.ancestry_forDetails;
```

## Related Managers

- **Search**: Provides search state and results that UX integrates
- **Details**: Uses `w_ancestry_forDetails` to display information
- **Hierarchy**: Coordinates with UX for focus changes and alterations
- **Visibility**: Controls whether search controls are shown
- **Hits**: Recalibrates when focus changes

## Edge Cases

1. **Empty grabs**: Always defaults to root ancestry
2. **Search active**: Grabs automatically sync with search results
3. **Radial dragging**: Grab/ungrab operations are blocked during ring rotation and resize
4. **Tree mode**: Special handling for empty grabs state

## Design Notes

The UX manager uses **derived stores** instead of manual synchronization, ensuring:
- Automatic reactivity when dependencies change
- No stale state issues
- Clear dependency graph
- Minimal update logic

The separation of focus (navigation) from details (display) allows:
- Search results to be shown while maintaining focus position
- Multi-selection to work independently of focus
- Consistent graph layout while details panel shows different content
