# State Management Architecture

Each state object is a single source of truth. Webseriously uses a hybrid approach: **state objects** (S_* classes) for persistent, object-oriented state that survives component recreation, plus **Svelte stores** (w_* writables) for reactivity. Both are organized by manager domain. Webseriously is a tightly integrated reactive system of considerable complexity, requiring this specialized (non-standard) approach.

## Table of Contents
- [Overview](#overview)
- [The Problem](#the-problem)
- [Standard Svelte Patterns (Use These First)](#standard-svelte-patterns-use-these-first)
- [When This Pattern Makes Sense](#when-this-pattern-makes-sense)
- [State Objects (S_*)](#state-objects-s_)
- [Stores (w_*)](#stores-w_)
- [Store Inventory](#store-inventory)
- [Hybrid Pattern in Practice](#hybrid-pattern-in-practice)
- [Alternatives Considered](#alternatives-considered)
- [Best Practices](#best-practices)
- [Related Documents](#related-documents)

## Overview

**Two complementary mechanisms:**

1. **State Objects** — Persistent classes outside component tree
   - Survive component recreation
   - Computed properties via getters
   - Object-oriented (methods, inheritance)
   - Managed by domain (managers)

2. **Svelte Stores** — Reactive primitives
   - Trigger component updates
   - All prefixed `w_`
   - Built-in Svelte reactivity

**Key**: State objects provide structure/persistence, stores provide reactivity.

---

## The Problem

Svelte component state is **ephemeral** — destroyed when components recreate. In complex interactive apps with frequent recreation, you need state that:

1. Survives component destruction/recreation
2. Coordinates across related components
3. Is accessible to managers outside component tree
4. Provides centralized computed properties

**Example:**
```svelte
<!-- ❌ Component state lost on recreation -->
<script>
  let isHovering = false;  // LOST when component recreates
</script>

<!-- ✅ State object persists -->
<script>
  const s_element = elements.s_element_for(...);  // Survives recreation
</script>
```

---

## Standard Svelte Patterns (Use These First)

**95% of Svelte apps should use standard patterns:**

```svelte
<!-- 1. Component-local state -->
<script>
  let count = 0;
</script>

<!-- 2. Svelte stores -->
<script>
  const count = writable(0);
  $: value = $count;
</script>

<!-- 3. Context API -->
<script>
  setContext('key', value);
  const value = getContext('key');
</script>

<!-- 4. Props -->
<Child {value} on:change />
```

---

## When This Pattern Makes Sense

**Only use hybrid approach when you have ALL of:**

1. ✅ Components frequently recreate
2. ✅ State must survive recreation  
3. ✅ Complex object-oriented state needed (methods, getters, inheritance)
4. ✅ Managers need direct state access outside components
5. ✅ Cross-component coordination required

**Missing any?** Use standard Svelte patterns.

---

## State Objects (S_*)

### Five Key Benefits

**1. Survive Component Recreation**
```typescript
// Manager owns state objects
const s_widget = elements.s_widget_forAncestry(ancestry);
// Same instance even after component recreates ✅
```

**2. Centralized Computed Properties**
```typescript
class S_Element {
  get fill(): string {
    if (this.asTransparent) return 'transparent';
    return this.dotColors_forElement.fill;
  }
}
```

**3. Cross-Component Coordination**
```typescript
class S_Widget extends S_Element {
  s_reveal: S_Element;  // Related components share state
  s_title: S_Element;
  s_drag: S_Element;
}
```

**4. Manager Access**
```typescript
// Hits manager updates state directly
hits.set_asHovering(s_element);  // Components react automatically
```

**5. Immutable Snapshots**
```typescript
const snapshot = new S_Snapshot(s_element);  // For complex computations
```

### Hierarchy

```
S_Hit_Target (base)
├── S_Element (visual properties)
│   └── S_Widget (widget-specific)
├── S_Component (signal management)
├── S_Rotation (rotation interaction)
└── S_Resizing (resize interaction)
```

### Usage

```svelte
<script>
  const s_widget = elements.s_widget_forAncestry(ancestry);
  
  $: fill = s_widget.fill;      // Computed property
  $: stroke = s_widget.stroke;  // Computed property
</script>
```

---

## Stores (w_*)

### Organization

Each manager owns stores for its domain. All prefixed `w_`.

```typescript
// TypeScript
import { x } from '../managers/UX';
const focus = get(x.w_ancestry_focus);

// Svelte
import { x } from '$lib/ts/managers/UX';
$: focus = $x.w_ancestry_focus;
```

### Types

**Writable** — Read-write state
```typescript
const w_scale_factor = writable(1.0);
w_scale_factor.update(n => n * 1.1);
```

**Derived** — Computed from other stores
```typescript
w_item = derived([w_items, w_index], 
  ([items, index]) => items[index] ?? null
);
```

### Patterns

**Increment** — Trigger without data
```typescript
w_count_rebuild.update(n => n + 1);
```

**Update** — Standard updates
```typescript
w_ancestry_focus.set(ancestry);
```

### Naming

| Prefix | Purpose | Example |
|--------|---------|---------|
| `w_` | All stores | `w_ancestry_focus` |
| `w_count_` | Counters | `w_count_rebuild` |
| `w_s_` | State objects | `w_s_hover` |
| `w_t_` | Types/enums | `w_t_startup` |
| `w_show_` | Visibility | `w_show_details` |

---

## Hybrid Pattern in Practice

```svelte
<script>
  import { elements, x, hits } from '$lib/ts/common/Global_Imports';
  
  export let ancestry: Ancestry;
  
  // State object (persistent)
  const s_widget = elements.s_widget_forAncestry(ancestry);
  
  // Stores (reactive)
  const { w_ancestry_focus } = x;
  const { w_s_hover } = hits;
  
  // Computed from state object
  $: cx = s_widget.cx;
  $: cy = s_widget.cy;
  $: fill = s_widget.fill;
  $: stroke = s_widget.stroke;
  
  // Reactive to stores
  $: isFocus = ancestry.isEqualTo($w_ancestry_focus);
  $: isHovering = s_widget.isEqualTo($w_s_hover);
</script>

<circle {cx} {cy} r={s_widget.r} {fill} {stroke} 
        class:focus={isFocus} 
        class:hovering={isHovering} />
```

**Why this works:**
- State object survives recreation
- Getters centralize computation
- Stores provide reactivity
- Component stays simple

---
## Best Practices
### State Objects

**✅ DO:**
- Get from managers
- Use getters for computed properties
- Clean up in `onDestroy`
- Combine with stores for reactivity

**❌ DON'T:**
- Create directly (bypass managers)
- Use for simple values (use stores)

### Stores

**✅ DO:**
- Use writable for user input, preferences, counters
- Use derived for computed values
- Strongly type all stores
- Group by manager domain

**❌ DON'T:**
- Mix concerns across managers
- Create in components
- Forget to unsubscribe
- Use for complex objects (use state objects)

---
## Alternatives Considered
### 1. Svelte Stores Only ❌
- No object methods/getters
- No inheritance
- Still need objects for structure

### 2. Pinia
- ✅ Persists, has getters
- ❌ Vue-centric, external dependency

### 3. Zustand  
- ✅ Lightweight, framework-agnostic
- ❌ Store-based, not object-based

### 4. Svelte Context
- ✅ Built-in, simple
- ❌ Tied to component tree, destroyed with provider

### 5. Class Instances (Our Approach)
- ✅ Objects with methods, no dependencies, survives recreation
- ❌ Manual lifecycle, not idiomatic Svelte, not widely documented

### 6. Redux/Flux
- ✅ Predictable, well-documented
- ❌ Heavy, immutable (we need mutable getters)

### 7. MobX
- ✅ Observable objects
- ❌ External dependency, overkill

**Why our approach:** Solves specific needs (recreation + coordination + object methods) without external dependencies.

**Why not documented:** Most apps don't need it — standard Svelte patterns work for 95% of cases.

---
## Store Inventory

### UX.ts (7 stores)
User interaction tracking

- `w_s_title_edit` — Title editing
- `w_s_alteration` — Relationship creation
- `w_thing_title` — Thing title during edit
- `w_relationship_order` — Sibling relocation
- `w_thing_fontFamily` — Font family
- `w_ancestry_forDetails` — Detail panel selection
- `w_ancestry_focus` — Main focus

### Colors.ts (3 stores)
Color preferences

- `w_background_color` — Theme/mood
- `w_thing_color` — Thing color edit
- `w_separator_color` — Background shade

### Visibility.ts (14 stores)
UI visibility toggles

- `w_t_cluster_pager` — Pager type
- `w_t_breadcrumbs` — Breadcrumb type
- `w_t_auto_adjust_graph` — Auto-adjust
- `w_t_directionals` — Build notes nav
- `w_t_graph` — Graph mode
- `w_t_details` — Details visibility
- `w_t_trees` — Related trees
- `w_t_countDots` — Count types
- `w_id_popupView` — Current popup
- `w_show_save_data_button` — Debug
- `w_show_search_controls` — Search controls
- `w_show_related` — Related items
- `w_show_details` — Details panel
- `w_show_countsAs_dots` — Dots vs numbers
- `w_show_other_databases` — Database options

### Search.ts (4 stores)
Search state

- `w_search_results_found` — Results available
- `w_search_results_changed` — Re-render trigger
- `w_s_search` — Search UX
- `w_search_preferences` — Preferences

### Events.ts (10 stores)
Event tracking (mostly mouse)

- `w_count_details` — Details rebuild
- `w_count_rebuild` — Layout rebuild
- `w_count_window_resized` — Window resize
- `w_count_mouse_down` — Mouse down
- `w_count_mouse_up` — Mouse up
- `w_control_key_down` — Control key
- `w_mouse_button_down` — Mouse button
- `w_scaled_movement` — Scaled movement
- `w_mouse_location` — Raw location
- `w_mouse_location_scaled` — Scaled location

### Geometry.ts (6 stores)
Layout properties

- `w_depth_limit` — Max depth
- `w_branches_areChildren` — Branch mode
- `w_user_graph_center` — Graph center
- `w_user_graph_offset` — Pan offset
- `w_rect_ofGraphView` — Viewport bounds
- `w_scale_factor` — Zoom level

### Radial.ts (4 stores)
Radial mode

- `w_rotate_angle` — Rotation angle
- `w_resize_radius` — Resize radius
- `w_g_paging` — Paging state
- `w_g_cluster` — Cluster layout

### Core.ts (2 stores)
System state

- `w_t_startup` — Startup state
- `w_hierarchy` — Current hierarchy

### Databases.ts (2 stores)
Database state

- `w_data_updated` — Update trigger
- `w_t_database` — Database type

### Hits.ts (4 stores)
Mouse tracking

- `w_s_hover` — Hovering element
- `w_longClick` — Long-click pending
- `w_autorepeat` — Autorepeat active
- `w_dragging` — Drag in progress

### Configuration.ts (1 store)
Platform config

- `w_device_isMobile` — Mobile detection

**Total: 57 stores across 11 managers**

---
## Related Documents

- [components.md](./components.md) - Component organization and Components manager
- [managers.md](./managers.md) - Manager pattern architecture
- [hits.md](./hits.md) - Centralized hit testing with S_Hit_Target
- [styles.md](../internals/styles.md) - Centralized color computation with state objects
