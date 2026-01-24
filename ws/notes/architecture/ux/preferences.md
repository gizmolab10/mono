# Preferences System: Store Presentation and Persistence

Okay, so I like to give people choices about looks and what have you. Of course their choices need to be remembered for them. It's a computer, for crying sake. This is a walk through how one preference flows from UI click to localStorage and back.

## Table of Contents
- [Overview](#overview)
- [Example: `w_t_auto_adjust_graph`](#example-wt_auto_adjust_graph)
  - [Store Definition](#store-definition)
  - [UI Presentation (`D_Preferences.svelte`)](#ui-presentation-d_preferencessvelte)
  - [Persistence (`Preferences.ts`)](#persistence-preferencests)
- [Complete Flow Diagram](#complete-flow-diagram)
- [Key Patterns](#key-patterns)
- [Other Examples](#other-examples)

This document describes how a preference store (e.g., `w_t_auto_adjust_graph`) is presented in the UI and persisted to localStorage.

## Overview

The preferences system uses a two-way binding pattern:
1. **Presentation**: Svelte stores are bound to a segmented svelte component inside another svelte component
2. **Persistence**: Store changes are automatically saved to localStorage via subscriptions in `Preferences.ts`

## Example: `w_t_auto_adjust_graph`

### Store Definition

The store is defined as a writable Svelte store in `Visibility.ts`:

```typescript
w_t_auto_adjust_graph = writable<T_Auto_Adjust_Graph | null>(null);
```

The `Visibility` class instance is exported as `show`, making the store accessible as `show.w_t_auto_adjust_graph`.

### UI Presentation (`D_Preferences.svelte`)

#### 1. Store Import
The store is destructured from the `show` object:
```typescript
// D_Preferences.svelte (line 23)
const { w_t_details, w_t_countDots, w_t_auto_adjust_graph, w_t_cluster_pager } = show;
```

#### 2. Handler Function
A handler function processes user selections and updates the store:
```typescript
// D_Preferences.svelte (lines 53-55)
function handle_auto_adjust(types: Array<T_Auto_Adjust_Graph | null>) {
	$w_t_auto_adjust_graph = types.length > 0 ? types[0] : null;
}
```

The `$` prefix creates a reactive binding that automatically updates the store when the handler is called.

#### 3. UI Component Binding
The `Segmented` component displays the preference with two-way binding:
```svelte
<!-- D_Preferences.svelte (lines 114-123) -->
<Segmented name='auto-adjust'
	left={106}
	allow_none={true}
	allow_multiple={false}
	width={segmented_width}
	height={segmented_height}
	origin={Point.y(tops[3])}
	selected={[$w_t_auto_adjust_graph]}
	handle_selection={handle_auto_adjust}
	titles={[T_Auto_Adjust_Graph.selection, T_Auto_Adjust_Graph.fit]}/>
```

- `selected={[$w_t_auto_adjust_graph]}`: Reactive binding reads the current store value (wrapped in array for `Segmented` component)
- `handle_selection={handle_auto_adjust}`: Callback invoked when user selects a different option

#### 4. User Interaction Flow

When a user clicks a segment:
1. `Segmented` component's `select()` function is called
2. It calls `handle_selection?.(selection)` with the new selection
3. `handle_auto_adjust()` receives the selection array
4. The store is updated: `$w_t_auto_adjust_graph = types.length > 0 ? types[0] : null`
5. The UI reactively updates to reflect the new selection

### Persistence (`Preferences.ts`)

#### 1. Restoration on Load

When preferences are restored, the store is initialized from localStorage:

```typescript
// Preferences.ts (lines 141-147)
restore_preferences() {
	show.w_t_auto_adjust_graph  .set( this.read_key(T_Preference.auto_adjust)	 ?? null);
	[...]
}
```

- `read_key(T_Preference.auto_adjust)` reads from localStorage using the key `'auto_adjust'`
- The store is set with `.set()` method
- Default value is `null` if nothing is stored

#### 2. Automatic Persistence

A subscription automatically writes changes to localStorage:

```typescript
// Preferences.ts (lines 213-215)
show.w_t_auto_adjust_graph.subscribe((auto_adjust: T_Auto_Adjust_Graph | null) => {
	this.write_key(T_Preference.auto_adjust, auto_adjust);
});
```

- The subscription is set up in `reactivity_subscribe()` method
- Whenever the store value changes, `write_key()` saves it to localStorage
- The localStorage key is `T_Preference.auto_adjust` (which equals `'auto_adjust'`)

#### 3. Storage Methods

The `Preferences` class provides low-level storage methods:

- `read_key(key: string)`: Reads and parses JSON from localStorage
- `write_key(key: string, value: T)`: Serializes and writes to localStorage
- `readDB_key(key: string)`: Reads with database prefix (for multi-database support)
- `writeDB_key(key: string, value: T)`: Writes with database prefix

## Complete Flow Diagram

```
User clicks segment
    ↓
Segmented.select() called
    ↓
handle_selection callback invoked
    ↓
handle_auto_adjust() updates store: $w_t_auto_adjust_graph = newValue
    ↓
Store subscription triggers (in Preferences.reactivity_subscribe)
    ↓
write_key() saves to localStorage['auto_adjust']
    ↓
On next page load: restore_preferences() reads from localStorage
    ↓
Store initialized: show.w_t_auto_adjust_graph.set(savedValue)
    ↓
UI reactively updates to show saved preference
```

## Key Patterns

1. **Reactive Binding**: Use `$storeName` in Svelte templates for automatic UI updates
2. **Handler Pattern**: UI components call handler functions that update stores
3. **Subscription Pattern**: Stores subscribe to changes and persist them automatically
4. **Restoration Pattern**: On initialization, stores are populated from localStorage
5. **Key Mapping**: `T_Preference` enum provides consistent localStorage keys

## Other Examples

The same pattern applies to other preferences:
- `w_t_cluster_pager` → `T_Preference.paging_style`
- `w_t_countDots` → `T_Preference.countDots`
- `w_t_details` → `T_Preference.detail_types`

Each follows the same presentation → handler → store → subscription → persistence flow.

