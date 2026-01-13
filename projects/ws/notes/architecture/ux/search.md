# Search Functionality Architecture

Instant search. Type a single letter and the matches appear instantly. Type more or choose one and done. economical use of screen real estate.

## Table of Contents
- [Overview](#overview)
- [Stores](#stores)
- [Search States (T_Search)](#search-states-t_search)
- [Search Preferences (T_Search_Preference)](#search-preferences-t_search_preference)
- [Search Index](#search-index)
- [Search Algorithm](#search-algorithm)
- [Integration with UX](#integration-with-ux)
- [Activation/Deactivation](#activationdeactivation)
- [Persistence](#persistence)
- [Performance](#performance)
- [Design Notes](#design-notes)
- [Related Components](#related-components)
- [Usage](#usage)

## Overview

Search manager provides full-text search across Things with indexing for performance. Supports searching by title, traits, tags, and multiple search modes.

## Stores

| Store                      | Writable Type         | Purpose                       |
| -------------------------- | --------------------- | ----------------------------- |
| `w_s_search`               | `T_Search`            | off, enter, results, selected |
| `w_search_results_found`   | `number`              | Count                         |
| `w_search_results_changed` | `number`              | Re-render search results      |
| `w_search_preferences`     | `T_Search_Preference` | title, traits, tags           |

## Search States (T_Search)

```typescript
enum T_Search {
    off,        // Search not active
    enter,      // Entering search text
    results,    // Showing results
    selected    // Result selected
}
```

## Search Preferences (T_Search_Preference)

```typescript
enum T_Search_Preference {
    title,      // Search thing titles only
    traits,     // Search trait values
    tags,       // Search tag names
    all         // Search all fields
}
```

## Search Index

Uses `Search_Node` tree structure for efficient searching:

```typescript
class Search {
    private root_node: Search_Node = new Search_Node();

    buildIndex(things: Thing[]) {
        this.root_node = new Search_Node();
        for (const thing of things) {
            this.root_node.add_thing(thing);
        }
    }
}
```

Rebuilt on:
- Startup (`T_Startup.ready`)
- Database change
- Hierarchy changes

## Search Algorithm

```typescript
search_for(text: string) {
    this.search_words = text.split(' ').filter(w => w.length > 0);
    const results = this.root_node.search(
        this.search_words,
        this.use_AND_logic,
        get(this.w_search_preferences)
    );

    x.si_found.items = results;
    this.w_search_results_found.set(results.length);
    this.w_search_results_changed.set(Date.now());
    this.w_s_search.set(T_Search.results);
}
```

**Multi-word search**:
- `use_AND_logic = true`: All words must match
- `use_AND_logic = false`: Any word matches (OR logic)

## Integration with UX

Search results stored in `x.si_found --> S_Items<Thing>`

```typescript
get selected_ancestry(): Ancestry | null {
    const row = this.selected_row;
    if (row !== null && show.w_show_search_controls) {
        const thing = x.si_found.items[row];
        return thing?.ancestry ?? null;
    }
    return null;
}
```

When search is active, UX manager:
1. Updates `x.si_grabs` to match search results
2. Shows selected result in details panel (first priority)
3. Syncs on search state changes

## Activation/Deactivation

```typescript
activate() {
    x.save_grabs();                          // Save current selection
    show.w_show_search_controls.set(true);
    this.search_for(this.search_text);       // Direct call, not via subscription
}

deactivate() {
    x.save_grabs(false);                     // Restore saved selection
    this.w_search_results_found.set(0);
    this.w_s_search.set(T_Search.off);
    show.w_show_search_controls.set(false);
    details.redraw();
}
```

**Grabs save/restore**: Search temporarily overwrites `si_grabs` with matched ancestries. On deactivate, the original selection (items and index) is restored from `si_saved_grabs`.

## Persistence

Search text saved to preferences:
```typescript
this.search_text = p.readDB_key(T_Preference.search_text);
```

Restored on page load.

## Performance

- **Indexed search**: Pre-built tree structure for O(log n) lookup
- **Lazy rebuild**: Only on database changes or startup
- **Incremental updates**: Can add/remove individual things

## Design Notes

**Direct causation over subscription indirection**: When an action needs to trigger behavior, call it directly rather than through store subscriptions.

*Anti-pattern*:
```typescript
// In setup():
this.w_s_search.subscribe((state) => {
    if (state !== T_Search.off) this.search_for(text);  // Reactive trigger
});

// In activate():
this.w_s_search.set(T_Search.enter);  // Indirect: relies on subscription
```

*Correct pattern*:
```typescript
// In activate():
this.search_for(this.search_text);  // Direct call
```

Subscriptions are for *reacting* to external changes, not for triggering side effects from your own actions. The anti-pattern causes infinite loops when `search_for()` sets store values that re-trigger the subscription.

## Related Components

- **UX manager**: Owns `si_found` collection
- **Visibility**: Controls `w_show_search_controls`
- **Details**: Re-renders on search changes
- **Features**: `allow_search` flag enables/disables

## Usage

```typescript
import { search } from '../managers/Search';

// Activate search
search.activate();

// Perform search
search.search_text = 'keyword';
search.update_search();

// Select result
search.selected_row = 0;

// Deactivate
search.deactivate();
```
