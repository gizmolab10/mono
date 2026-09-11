# Manager Pattern Architecture

Webseriously uses 16 singleton managers to coordinate different aspects of the application. Each manager has a specific responsibility and provides a centralized API for its domain.

## Table of Contents
- [Overview](#overview)
- [Why Singleton Managers?](#why-singleton-managers)
- [Complete Manager List](#complete-manager-list)
- [Manager Responsibilities](#manager-responsibilities)
- [Access Patterns](#access-patterns)
- [Manager Lifecycle](#manager-lifecycle)
- [Cross-Manager Dependencies](#cross-manager-dependencies)
- [Best Practices](#best-practices)

## Overview

Managers are singleton instances that coordinate specific aspects of the application:
- **State coordination** - Own and manage state objects and stores
- **Centralized logic** - Single source of truth for domain operations
- **Factory methods** - Provide controlled access to resources
- **Lifecycle management** - Handle setup, cleanup, and persistence

## Why Singleton Managers?

### Problems Solved

1. **Scattered State** - Without managers, state would be distributed across components
2. **Duplication** - Common operations would be reimplemented in multiple places
3. **Tight Coupling** - Components would directly depend on each other
4. **Testing Difficulty** - Hard to mock or isolate functionality

### Benefits

- **Single Source of Truth** - Each domain has one authoritative manager
- **Centralized Control** - Easy to find and modify domain logic
- **Dependency Injection** - Managers can be mocked for testing
- **Clear Boundaries** - Each manager owns a specific responsibility
- **Easier Debugging** - Centralized logic is easier to trace

## Complete Manager List

| Manager | Global | Purpose |
|---------|--------|---------|
| `Components` | `components` | Component lifecycle management, registration |
| `Configuration` | `configuration` | App configuration, feature flags, settings |
| `Controls` | `controls` | Control panel state, button management |
| `Core` | `core` | System state (w_t_startup, w_hierarchy) |
| `Details` | `details` | Details panel management, tab switching |
| `Elements` | `elements` | DOM element tracking, S_Element factory |
| `Features` | `features` | Feature enablement/disablement flags |
| `Geometry` | `g` | Layout coordination, graph view bounds |
| `Hierarchy` | `h` | Tree data management, Thing/Trait/Tag operations |
| `Hits` | `hits` | Hit testing, hover detection, click handling |
| `Preferences` | `p` | User preferences, settings persistence |
| `Radial` | `radial` | Radial graph specific logic, cluster management |
| `Search` | `search` | Search functionality, result management |
| `Styles` | `styles` | Theme and styling, color computation |
| `UX` | `x` | User interaction state (focus, grabs, details) |
| `Visibility` | `visibility` | Component visibility control, show/hide logic |

## Manager Responsibilities

### Components
**Responsibility**: Component lifecycle and registration

**Key Methods**:
```typescript
component_register(name: string, component: any)
component_unregister(name: string)
component_get(name: string): any
```

**Use Cases**:
- Track mounted components
- Manage component instances
- Coordinate component updates

---

### Configuration
**Responsibility**: Application configuration and feature flags

**Key Methods**:
```typescript
get(key: string): any
set(key: string, value: any)
```

**Stores**:
- `w_config` - Configuration state

**Use Cases**:
- Feature toggles
- Environment settings
- Build-time configuration

---

### Controls
**Responsibility**: Control panel state and button management

**Key Methods**:
```typescript
button_for(type: T_Control): S_Element
```

**Stores**:
- `w_controls_visible` - Control panel visibility

**Use Cases**:
- Control button state
- Panel visibility
- Button interactions

---

### Core
**Responsibility**: Core system state

**Key Methods**:
```typescript
startup()
shutdown()
```

**Stores**:
- `w_t_startup` - Startup state (loading, ready, error)
- `w_hierarchy` - Current hierarchy instance

**Use Cases**:
- Application initialization
- Hierarchy switching
- Global state coordination

---

### Details
**Responsibility**: Details panel management

**Key Methods**:
```typescript
show_tab(tab: T_Details_Tab)
hide()
toggle()
```

**Stores**:
- `w_tab` - Current active tab
- `w_visible` - Details panel visibility

**Use Cases**:
- Tab switching
- Panel show/hide
- Detail content coordination

---

### Elements
**Responsibility**: DOM element tracking and S_Element factory

**Key Methods**:
```typescript
s_element_for(identifiable: Identifiable, type: T_Hit_Target, name: string): S_Element
s_widget_forAncestry(ancestry: Ancestry): S_Widget
```

**Use Cases**:
- Create/retrieve S_Element instances
- Manage element lifecycle
- Coordinate visual state

---

### Features
**Responsibility**: Feature enablement/disablement

**Properties**:
```typescript
allow_autoSave: boolean
allow_details: boolean
standalone_UI: boolean
```

**Use Cases**:
- Conditional feature rendering
- Feature flag checks
- Build-specific behavior

---

### Geometry (`g`)
**Responsibility**: Layout coordination and graph view management

**Key Methods**:
```typescript
layout()
grand_build()
grand_sweep()
update_rect_ofGraphView()
```

**Stores**:
- `w_rect_ofGraphView` - Graph viewport bounds
- `w_user_graph_offset` - User pan offset
- `w_scale_factor` - Zoom level

**Use Cases**:
- Trigger layout recalculation
- Manage graph viewport
- Coordinate tree/radial layout

---

### Hierarchy (`h`)
**Responsibility**: Tree data management

**Key Methods**:
```typescript
thing_forHID(hid: string): Thing | null
thing_create(title: string, parent?: Thing): Thing
trait_create(thing: Thing, key: string, value: string): Trait
ancestry_forThing(thing: Thing): Ancestry
```

**Stores**:
- `w_things` - All Things in hierarchy
- `w_traits` - All Traits
- `w_tags` - All Tags

**Use Cases**:
- CRUD operations on Things/Traits/Tags
- Hierarchy traversal
- Data persistence

---

### Hits
**Responsibility**: Hit testing, hover detection, click handling

**Key Methods**:
```typescript
add_hit_target(target: S_Hit_Target)
delete_hit_target(target: S_Hit_Target)
targets_atPoint(point: Point): S_Hit_Target[]
handle_click_at(point: Point, s_mouse: S_Mouse)
```

**Stores**:
- `w_s_hover` - Currently hovering target
- `w_autorepeat` - Autorepeating target
- `w_longClick` - Long-click pending target

**Use Cases**:
- Spatial indexing (RBush)
- Hover detection
- Click dispatch
- Autorepeat/long-click/double-click

---

### Preferences (`p`)
**Responsibility**: User preferences and settings persistence

**Key Methods**:
```typescript
get(key: T_Preference): any
set(key: T_Preference, value: any)
read_key(key: string): string
write_key(key: string, value: string)
```

**Use Cases**:
- Save/load user settings
- Preference defaults
- LocalStorage persistence

---

### Radial
**Responsibility**: Radial graph specific logic

**Key Methods**:
```typescript
cluster_for(ancestry: Ancestry): G_Cluster | null
```

**Use Cases**:
- Radial layout coordination
- Cluster management
- Paging control

---

### Search
**Responsibility**: Search functionality and result management

**Key Methods**:
```typescript
search(query: string)
clear()
```

**Stores**:
- `w_results` - Search results
- `w_query` - Current search query
- `w_visible` - Search panel visibility

**Use Cases**:
- Full-text search
- Result highlighting
- Search state management

---

### Styles
**Responsibility**: Theme and styling management

**Key Methods**:
```typescript
get_widgetColors_for(snapshot: S_Snapshot, thing_color: string, background_color: string)
recompute_style()
```

**Use Cases**:
- Color computation
- Theme switching
- Style coordination

---

### UX (`x`)
**Responsibility**: User interaction state

**Key Methods**:
```typescript
ancestry_focus_set(ancestry: Ancestry | null)
grab_add(ancestry: Ancestry)
grab_remove(ancestry: Ancestry)
```

**Stores**:
- `w_ancestry_focus` - Current focused ancestry
- `w_grabs` - Grabbed ancestries (selection)
- `w_details_visible` - Details panel visibility

**Use Cases**:
- Focus management
- Selection tracking
- UI state coordination

---

### Visibility
**Responsibility**: Component visibility control

**Methods**:
```typescript
show(component: string)
hide(component: string)
toggle(component: string)
```

**Use Cases**:
- Conditional rendering
- Panel show/hide
- UI state management

## Access Patterns

### Global Import
All managers are available via `Global_Imports`:

```typescript
import { h, g, x, core, hits, databases } from '../common/Global_Imports';

// Access manager methods
const thing = h.thing_forHID('abc123');
g.layout();
x.ancestry_focus_set(ancestry);
```

### Store Subscriptions
Managers expose stores for reactivity:

```typescript
import { core } from '../common/Global_Imports';

// Subscribe to hierarchy changes
$: hierarchy = $core.w_hierarchy;

// React to startup state
$: if ($core.w_t_startup === T_Startup.ready) {
    // App is ready
}
```

### Factory Methods
Managers provide factories for controlled instantiation:

```typescript
import { elements } from '../common/Global_Imports';

// Get or create S_Element
const s_element = elements.s_element_for(identifiable, T_Hit_Target.widget, 'my-widget');

// Get or create S_Widget
const s_widget = elements.s_widget_forAncestry(ancestry);
```

## Manager Lifecycle

### Initialization
Managers are initialized in `Core.startup()`:

```typescript
async startup() {
    await databases.grand_change_database(initial_db);
    features.apply_queryStrings(queryStrings);
    p.restore_preferences();
    g.update_rect_ofGraphView();
    this.w_t_startup.set(T_Startup.ready);
}
```

### Cleanup
Components should clean up manager-owned resources:

```typescript
onDestroy(() => {
    hits.delete_hit_target(s_element);
    components.component_unregister(name);
});
```

## Cross-Manager Dependencies

### Dependency Graph

```
Core
├── Databases (w_hierarchy)
├── Features (feature flags)
└── Preferences (settings)

Geometry
├── Core (w_hierarchy)
├── UX (w_ancestry_focus)
└── Visibility (details visibility)

Hits
├── Elements (s_element factory)
└── UX (hover/click coordination)

Hierarchy
├── Databases (persistence)
└── Core (w_hierarchy)

UX
├── Hierarchy (ancestry operations)
├── Details (panel coordination)
└── Geometry (layout triggers)
```

### Coordination Patterns

**Pattern 1: Event → Manager → Store → UI**
```typescript
// User clicks button
hits.handle_click_at(point, s_mouse);
  → target.handle_s_mouse(s_mouse)
  → x.ancestry_focus_set(ancestry)
  → x.w_ancestry_focus.set(ancestry)
  → $: focused = $x.w_ancestry_focus  // Component reacts
```

**Pattern 2: Store → Manager → Action**
```typescript
// Focus changes
$: if ($x.w_ancestry_focus) {
    g.layout();  // Trigger layout recalculation
}
```

**Pattern 3: Manager → Manager → Coordination**
```typescript
// Database switch
databases.grand_change_database(type)
  → core.w_hierarchy.set(new_hierarchy)
  → h = new_hierarchy
  → g.grand_build()  // Rebuild layout
```

## Best Practices

### ✅ DO

- **Use managers for domain logic** - Keep business logic centralized
- **Subscribe to manager stores** - React to manager state changes
- **Use factory methods** - Let managers control resource creation
- **Clean up in onDestroy** - Remove registrations, cancel subscriptions
- **Keep managers focused** - Each manager owns a specific domain
- **Document store purposes** - Make reactive dependencies clear

### ❌ DON'T

- **Bypass managers** - Don't directly create state objects
- **Store manager references** - Import from Global_Imports, don't cache
- **Mix manager responsibilities** - Keep domains separated
- **Mutate manager state directly** - Use provided methods/stores
- **Create circular dependencies** - Be aware of dependency graph
- **Skip cleanup** - Always unregister in onDestroy

## Examples

### Example 1: Creating a Thing
```typescript
import { h } from '../common/Global_Imports';

// Create thing via manager
const thing = h.thing_create('My Thing', parent_thing);

// Add trait
h.trait_create(thing, 'color', 'blue');

// Get ancestry
const ancestry = h.ancestry_forThing(thing);
```

### Example 2: Managing Focus
```typescript
import { x, g } from '../common/Global_Imports';

// Set focus
x.ancestry_focus_set(ancestry);

// React to focus change
$: if ($x.w_ancestry_focus) {
    console.log('Focus changed:', $x.w_ancestry_focus);
    g.layout();  // Trigger layout
}
```

### Example 3: Hit Testing
```typescript
import { hits, elements } from '../common/Global_Imports';

// Create hit target
const s_element = elements.s_element_for(identifiable, T_Hit_Target.button, 'my-button');

onMount(() => {
    s_element.set_html_element(element);
    s_element.handle_s_mouse = (s_mouse: S_Mouse) => {
        console.log('Clicked!');
        return true;
    };
});

onDestroy(() => {
    hits.delete_hit_target(s_element);
});
```

### Example 4: Preferences
```typescript
import { p } from '../common/Global_Imports';

// Save preference
p.write_key(T_Preference.theme, 'dark');

// Load preference
const theme = p.read_key(T_Preference.theme) ?? 'light';
```

## Related Documents

- [state.md](./state.md) - Why we use state objects
- [hits.md](./hits.md) - Hit testing architecture
- [databases.md](./databases.md) - Database abstraction
