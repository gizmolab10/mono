# Component Architecture

**Synopsis**: Webseriously's component system has two layers: (1) **Svelte components** organized into 11 directories by purpose (controls, details, draw, main, mouse, radial, search, text, tree, widget, experimental), and (2) **Components manager** that tracks S_Component state objects for complex interactive components that need state persistence across recreation. Simple interactive elements use S_Element (see Elements manager), while complex components like pagers and breadcrumbs use S_Component for additional behavior management.

## Table of Contents
- [Component Organization](#component-organization)
  - [Overview](#overview)
  - [Directory Structure](#directory-structure)
  - [Organizing Principles](#organizing-principles)
- [Component Categories](#component-categories)
  - [controls/ - Graph Controls](#controls---graph-controls)
  - [details/ - Detail Panels](#details---detail-panels)
  - [draw/ - SVG Primitives](#draw---svg-primitives)
  - [experimental/ - WIP Components](#experimental---wip-components)
  - [main/ - Core Application](#main---core-application)
  - [mouse/ - Interactive Elements](#mouse---interactive-elements)
  - [radial/ - Radial Graph](#radial---radial-graph)
  - [search/ - Search Interface](#search---search-interface)
  - [text/ - Text Rendering](#text---text-rendering)
  - [tree/ - Tree Graph](#tree---tree-graph)
  - [widget/ - Widget System](#widget---widget-system)
- [Component Patterns](#component-patterns)
  - [Pattern 1: Stateless Presentation](#pattern-1-stateless-presentation)
  - [Pattern 2: State Object + Reactive Props](#pattern-2-state-object--reactive-props)
  - [Pattern 3: Hit Testing + Click Handling](#pattern-3-hit-testing--click-handling)
  - [Pattern 4: Manager Coordination](#pattern-4-manager-coordination)
- [State Management](#state-management)
  - [State Objects (S_*)](#state-objects-s_)
  - [Reactive Stores](#reactive-stores)
  - [Computed Properties](#computed-properties)
- [Components Manager](#components-manager)
  - [Purpose](#purpose)
  - [S_Component vs S_Element](#s_component-vs-s_element)
  - [Data Structure](#data-structure)
  - [Core Methods](#core-methods)
  - [S_Component Class](#s_component-class)
  - [Component Types (T_Hit_Target)](#component-types-t_hit_target)
  - [Usage Pattern](#usage-pattern)
  - [Lifecycle](#lifecycle)
  - [Dummy Component](#dummy-component)
  - [Dictionary Structure Example](#dictionary-structure-example)
  - [Performance](#performance)
- [Naming Conventions](#naming-conventions)
  - [File Names](#file-names)
  - [Component Prefixes](#component-prefixes)
- [Best Practices](#best-practices)
- [Related Documents](#related-documents)

---

## Component Organization

### Overview

Component organization follows these principles:
- **By purpose** - Components grouped by what they do, not how they work
- **Clear boundaries** - Each directory has a single responsibility
- **Reusability** - Shared components in appropriate directories
- **Progressive complexity** - Simple components in `draw/`, complex in `main/`

### Directory Structure

```
src/lib/svelte/
├── controls/        # Primary/secondary controls, breadcrumbs, tree controls
├── details/         # Detail panels (actions, data, header, preferences, selection, tags, traits)
├── draw/            # SVG primitives (boxes, circles, gradients, portals, separators, spinners)
├── experimental/    # Work-in-progress components
├── main/            # Core app (SeriouslyApp, Panel, Graph, Details, Import, BuildNotes)
├── mouse/           # Interactive elements (buttons, sliders, rubberband, steppers, color pickers)
├── radial/          # Radial graph (clusters, rings)
├── search/          # Search interface and results
├── text/            # Text rendering (angled, curved, editors, tables)
├── tree/            # Tree graph (branches, lines)
└── widget/          # Widget system (drag, reveal, title)
```

### Organizing Principles

1. **Purpose over Implementation** - Group by what components do (controls, details), not how (React, Vue)
2. **Single Responsibility** - Each directory owns one domain
3. **Complexity Gradient** - Simple (draw/) → Medium (mouse/) → Complex (main/)
4. **Clear Dependencies** - main/ uses all others, draw/ uses none

---

## Component Categories

### controls/ - Graph Controls
**Purpose**: Top-level control buttons and navigation

**Components**:
- `Breadcrumbs.svelte` - Ancestry navigation breadcrumbs
- `Primary_Controls.svelte` - Main control buttons (zoom, mode, etc.)
- `Secondary_Controls.svelte` - Additional controls
- `Tree_Controls.svelte` - Tree-specific controls

**State**:
- Uses `controls` manager
- `S_Element` for hit testing
- Reactive to `x.w_ancestry_focus`

**Example**:
```svelte
<!-- Breadcrumbs.svelte -->
<script>
  import { x } from '$lib/ts/common/Global_Imports';
  
  $: ancestry = $x.w_ancestry_focus;
  $: breadcrumbs = ancestry?.breadcrumbs ?? [];
</script>

{#each breadcrumbs as crumb}
  <Breadcrumb_Button {crumb} />
{/each}
```

---

### details/ - Detail Panels
**Purpose**: Tabbed detail panels for focused Thing

**Components**:
- `Banner_Hideable.svelte` - Collapsible banner header
- `D_Actions.svelte` - Action buttons (browse, focus, add, delete, move)
- `D_Data.svelte` - Thing data editor
- `D_Header.svelte` - Detail panel header
- `D_Preferences.svelte` - Per-thing preferences
- `D_Selection.svelte` - Selection/grab management
- `D_Tags.svelte` - Tag assignment
- `D_Traits.svelte` - Trait key-value editor

**State**:
- Uses `details` manager
- `w_tab` for active tab
- `w_visible` for panel visibility
- Reactive to `x.w_ancestry_focus`

**Example**:
```svelte
<!-- D_Actions.svelte -->
<script>
  import { x, h } from '$lib/ts/common/Global_Imports';
  
  $: thing = $x.w_ancestry_focus?.thing;
  
  function browse_left() {
    const sibling = h.sibling_left_forThing(thing);
    if (sibling) x.ancestry_focus_set(h.ancestry_forThing(sibling));
  }
</script>

<Button on:click={browse_left}>←</Button>
```

---

### draw/ - SVG Primitives
**Purpose**: Reusable SVG drawing components

**Components**:
- `Box.svelte` - Rectangles with fill/stroke
- `Circle.svelte` - Circles (dots, widgets)
- `Gull_Wings.svelte` - Gull wing decorations
- `Portal.svelte` - Portal rendering
- `Printable.svelte` - Print-friendly wrappers
- `SVG_D3.svelte` - D3.js integration layer
- `SVG_Gradient.svelte` - Gradient definitions
- `Separator.svelte` - Visual separators
- `Spinner.svelte` - Loading spinners
- `Transparent_Circle.svelte` - Hit-testable transparent circles

**State**:
- Stateless presentation components
- Props for geometry and colors
- No direct store subscriptions

**Example**:
```svelte
<!-- Circle.svelte -->
<script>
  export let cx: number;
  export let cy: number;
  export let r: number;
  export let fill: string = 'white';
  export let stroke: string = 'black';
</script>

<circle {cx} {cy} {r} {fill} {stroke} />
```

---

### experimental/ - WIP Components
**Purpose**: Components under active development

**Note**: Components here may be incomplete, unstable, or experimental. Not used in production until moved to appropriate directory.

---

### main/ - Core Application
**Purpose**: Top-level application structure

**Components**:
- `SeriouslyApp.svelte` - Root application component
- `Panel.svelte` - Main panel container
- `Graph.svelte` - Graph viewport
- `Details.svelte` - Detail panel container
- `Import.svelte` - Data import interface
- `BuildNotes.svelte` - Build notes display

**State**:
- Uses `core` manager
- `w_t_startup` for app lifecycle
- Coordinates all other components

**Example**:
```svelte
<!-- SeriouslyApp.svelte -->
<script>
  import { core, features } from '$lib/ts/common/Global_Imports';
  
  $: startup = $core.w_t_startup;
</script>

{#if startup === T_Startup.loading}
  <Spinner />
{:else if startup === T_Startup.ready}
  <Panel />
  {#if features.standalone_UI}
    <Details />
  {/if}
{/if}
```

---

### mouse/ - Interactive Elements
**Purpose**: Mouse-driven UI components

**Components**:
- `Breadcrumb_Button.svelte` - Clickable breadcrumb chips
- `Button.svelte` - Generic button with autorepeat/long-click
- `Buttons_Row.svelte` - Horizontal button group
- `Buttons_Table.svelte` - Button grid layout
- `Clickable_Label.svelte` - Clickable text labels
- `Close_Button.svelte` - Close/dismiss buttons
- `Cluster_Pager.svelte` - Radial cluster paging controls
- `Color.svelte` - Color picker
- `Glow_Button.svelte` - Glowing interactive buttons
- `Glows_Banner.svelte` - Banner with glow effects
- `Next_Previous.svelte` - Next/previous navigation
- `Rubberband.svelte` - Rubberband selection
- `Segmented.svelte` - Segmented control
- `Slider.svelte` - Value slider
- `Steppers.svelte` - Increment/decrement steppers
- `Triangle_Button.svelte` - Triangle-shaped buttons

**State**:
- Uses `hits` manager for click detection
- `S_Element` for each interactive element
- `mouse_detection` for autorepeat/long-click/double-click

**Example**:
```svelte
<!-- Button.svelte -->
<script>
  import { elements, hits } from '$lib/ts/common/Global_Imports';
  import { T_Mouse_Detection } from '$lib/ts/common/Enumerations';
  
  export let mouse_detection: T_Mouse_Detection = T_Mouse_Detection.none;
  export let handle_s_mouse: (s_mouse: S_Mouse) => boolean;
  
  const s_element = elements.s_element_for(...);
  let element: HTMLElement;
  
  onMount(() => {
    s_element.set_html_element(element);
    s_element.handle_s_mouse = handle_s_mouse;
    s_element.mouse_detection = mouse_detection;
  });
  
  onDestroy(() => {
    hits.delete_hit_target(s_element);
  });
</script>

<div bind:this={element}>
  <slot />
</div>
```

---

### radial/ - Radial Graph
**Purpose**: Radial graph visualization components

**Components**:
- `Radial_Cluster.svelte` - Cluster of widgets in radial layout
- `Radial_Graph.svelte` - Radial graph container
- `Radial_Rings.svelte` - Concentric rings for depth levels

**State**:
- Uses `radial` manager
- `G_RadialGraph` for layout
- `G_Cluster` for cluster positioning
- Reactive to `x.w_ancestry_focus`

**Example**:
```svelte
<!-- Radial_Cluster.svelte -->
<script>
  import { g, radial } from '$lib/ts/common/Global_Imports';
  
  export let ancestry: Ancestry;
  
  $: cluster = radial.cluster_for(ancestry);
  $: widgets = cluster?.widgets ?? [];
</script>

{#each widgets as widget}
  <Widget {widget} />
{/each}
```

---

### search/ - Search Interface
**Purpose**: Search functionality and results display

**Components**:
- `Search.svelte` - Search input and controls
- `Search_Results.svelte` - Search result list
- `Search_Toggle.svelte` - Show/hide search panel

**State**:
- Uses `search` manager
- `w_results` for search results
- `w_query` for current query
- `w_visible` for panel visibility

**Example**:
```svelte
<!-- Search.svelte -->
<script>
  import { search } from '$lib/ts/common/Global_Imports';
  
  let query = '';
  
  $: results = $search.w_results;
  
  function handle_search() {
    search.search(query);
  }
</script>

<input bind:value={query} on:input={handle_search} />
<Search_Results {results} />
```

---

### text/ - Text Rendering
**Purpose**: Specialized text rendering components

**Components**:
- `Angled_Text.svelte` - Text at arbitrary angles
- `Curved_Text.svelte` - Text along curved paths
- `Text_Editor.svelte` - Inline text editing
- `Text_Table.svelte` - Tabular text layout

**State**:
- Presentation components
- Props for geometry and content
- `S_Title_Edit` for editing state

**Example**:
```svelte
<!-- Curved_Text.svelte -->
<script>
  export let text: string;
  export let path: string;  // SVG path
  export let fill: string = 'black';
</script>

<defs>
  <path id="text-path" d={path} />
</defs>
<text {fill}>
  <textPath href="#text-path">
    {text}
  </textPath>
</text>
```

---

### tree/ - Tree Graph
**Purpose**: Tree graph visualization components

**Components**:
- `Tree_Branches.svelte` - Vertical branch layout
- `Tree_Graph.svelte` - Tree graph container
- `Tree_Line.svelte` - Parent-child connection lines

**State**:
- Uses `geometry` manager
- `G_TreeGraph` for layout
- `G_TreeBranches` for branch positioning
- Reactive to `x.w_ancestry_focus`

**Example**:
```svelte
<!-- Tree_Graph.svelte -->
<script>
  import { g, x } from '$lib/ts/common/Global_Imports';
  
  $: focus = $x.w_ancestry_focus;
  $: tree_layout = g.g_tree.layout_for(focus);
</script>

{#if tree_layout}
  <Tree_Branches {tree_layout} />
{/if}
```

---

### widget/ - Widget System
**Purpose**: Widget rendering and interaction

**Components**:
- `Widget.svelte` - Main widget component (circle + title)
- `Widget_Drag.svelte` - Drag dot
- `Widget_Reveal.svelte` - Reveal/hide children dot
- `Widget_Title.svelte` - Widget title text

**State**:
- Uses `elements` manager
- `S_Widget` for widget state
- `S_Element` for drag/reveal dots
- Reactive to `x.w_ancestry_focus`, `x.w_grabs`

**Example**:
```svelte
<!-- Widget.svelte -->
<script>
  import { elements, x } from '$lib/ts/common/Global_Imports';
  
  export let ancestry: Ancestry;
  
  const s_widget = elements.s_widget_forAncestry(ancestry);
  
  $: isFocus = ancestry.isEqualTo($x.w_ancestry_focus);
  $: isGrabbed = ancestry.isGrabbed;
  $: fill = s_widget.fill;
  $: stroke = s_widget.stroke;
</script>

<Circle cx={s_widget.cx} cy={s_widget.cy} r={s_widget.r} {fill} {stroke} />
<Widget_Title {s_widget} />
{#if s_widget.shows_drag}
  <Widget_Drag {s_widget} />
{/if}
{#if s_widget.shows_reveal}
  <Widget_Reveal {s_widget} />
{/if}
```

---

## Component Patterns

### Pattern 1: Stateless Presentation
**Use for**: SVG primitives, simple rendering

```svelte
<script>
  export let cx: number;
  export let cy: number;
  export let r: number;
  export let fill: string;
</script>

<circle {cx} {cy} {r} {fill} />
```

**Characteristics**:
- No state management
- Pure props → output
- No side effects
- Highly reusable

---

### Pattern 2: State Object + Reactive Props
**Use for**: Graph elements (widgets, dots)

```svelte
<script>
  import { elements } from '$lib/ts/common/Global_Imports';
  
  export let ancestry: Ancestry;
  
  const s_widget = elements.s_widget_forAncestry(ancestry);
  
  $: fill = s_widget.fill;
  $: stroke = s_widget.stroke;
</script>

<Circle cx={s_widget.cx} cy={s_widget.cy} r={s_widget.r} {fill} {stroke} />
```

**Characteristics**:
- State object from manager
- Reactive getters
- Survives component recreation
- Computed properties

---

### Pattern 3: Hit Testing + Click Handling
**Use for**: Interactive elements (buttons, controls)

```svelte
<script>
  import { elements, hits } from '$lib/ts/common/Global_Imports';
  
  const s_element = elements.s_element_for(...);
  let element: HTMLElement;
  
  onMount(() => {
    s_element.set_html_element(element);
    s_element.handle_s_mouse = (s_mouse: S_Mouse) => {
      // Handle click
      return true;
    };
  });
  
  onDestroy(() => {
    hits.delete_hit_target(s_element);
  });
</script>

<div bind:this={element}>
  <!-- Content -->
</div>
```

**Characteristics**:
- Centralized hit testing
- Click handler registration
- Lifecycle management
- Cleanup on destroy

---

### Pattern 4: Manager Coordination
**Use for**: Top-level containers, panels

```svelte
<script>
  import { core, details, x } from '$lib/ts/common/Global_Imports';
  
  $: hierarchy = $core.w_hierarchy;
  $: tab = $details.w_tab;
  $: focus = $x.w_ancestry_focus;
</script>

{#if $details.w_visible}
  {#if tab === T_Details_Tab.actions}
    <D_Actions />
  {:else if tab === T_Details_Tab.data}
    <D_Data />
  {/if}
{/if}
```

**Characteristics**:
- Multiple manager coordination
- Store subscriptions
- Conditional rendering
- State-driven UI

---

## State Management

### State Objects (S_*)
Components use state objects from managers:

```typescript
// Get or create S_Element
const s_element = elements.s_element_for(identifiable, T_Hit_Target.widget, 'my-widget');

// Get or create S_Widget
const s_widget = elements.s_widget_forAncestry(ancestry);

// Get or create S_Component
const s_component = components.component_forAncestry_andType_createUnique(ancestry, T_Hit_Target.cluster_pager);
```

**Why State Objects?**
- Persist across component recreation
- Centralized computed properties
- Shared between related components
- Manager-accessible outside component tree

---

### Reactive Stores
Components subscribe to manager stores:

```svelte
$: hierarchy = $core.w_hierarchy;
$: focus = $x.w_ancestry_focus;
$: hovering = $hits.w_s_hover;
$: tab = $details.w_tab;
```

**Store Naming**: All stores prefixed with `w_`

---

### Computed Properties
State objects provide getters:

```typescript
$: fill = s_widget.fill;        // Computed from state
$: stroke = s_widget.stroke;    // Computed from state
$: isHovering = s_widget.isHovering;  // Reactive to hits.w_s_hover
```

**Benefits**:
- Single source of truth
- No duplication
- Consistent computation
- Reactive to dependencies

---

## Components Manager

### Purpose

**State managed outside Svelte** - Complex interactive components that need state persistence across recreation:
- Debug logging coordination
- Signal management
- Style construction by type and HID
- Unique ID assignment for DOM lookups

### S_Component vs S_Element

| Aspect | S_Component | S_Element |
|--------|-------------|-----------|
| **Manager** | Components | Elements |
| **Purpose** | Complex components | Simple interactive elements |
| **Examples** | Pagers, breadcrumbs, rings | Widgets, dots, lines |
| **Factory** | `component_forAncestry_andType_createUnique` | `s_element_for` |
| **Storage** | `components_dict_byType_andHID` | Elements manager dict |
| **Behavior** | Additional state/signals | Visual properties only |

Both extend `S_Hit_Target` for unified hit testing via Hits manager.

---

### Data Structure

```typescript
class Components {
    private components_dict_byType_andHID: Dictionary<Dictionary<S_Component>> = {};
    //                                      type → (hid → S_Component)
}
```

**Two-level dictionary**:
1. **First level**: Indexed by `T_Hit_Target` type (component type)
2. **Second level**: Indexed by ancestry HID

This allows **O(1) lookup**: `components_dict[type][hid]`

---

### Core Methods

#### Factory Pattern

```typescript
component_forAncestry_andType_createUnique(
    ancestry: Ancestry | null,
    type: T_Hit_Target
): S_Component | null {
    let s_component = this.component_forAncestry_andType(ancestry, type);
    if (!s_component) {
        s_component = new S_Component(ancestry, type);
        this.component_register(s_component);
    }
    return s_component;
}
```

**Create-if-not-exists**: Ensures only one S_Component per (ancestry, type) pair.

#### Lookup

```typescript
component_forAncestry_andType(
    ancestry: Ancestry | null,
    type: T_Hit_Target
): S_Component | null {
    const dict = this.components_byHID_forType(type);
    return dict[ancestry?.hid ?? -1] ?? null;
}
```

Returns `null` if not found (doesn't create).

#### Registration

```typescript
private component_register(s_component: S_Component) {
    const type = s_component.type;
    const hid = s_component.hid;
    if (!!hid && !!type) {
        const dict = this.components_byHID_forType(type);
        dict[hid] = s_component;
    }
}
```

**Private** - only called by factory method.

---

### S_Component Class

Extends `S_Hit_Target` for hit testing:

```typescript
class S_Component extends S_Hit_Target {
    ancestry: Ancestry | null;
    type: T_Hit_Target;

    constructor(ancestry: Ancestry | null, type: T_Hit_Target) {
        super();
        this.ancestry = ancestry;
        this.type = type;
    }

    get hid(): Integer {
        return this.ancestry?.hid ?? -1;
    }
}
```

---

### Component Types (T_Hit_Target)

Examples from codebase:
- `T_Hit_Target.cluster_pager` - Radial cluster paging UI
- `T_Hit_Target.breadcrumbs` - Navigation breadcrumbs
- `T_Hit_Target.ring` - Radial ring interaction
- `T_Hit_Target.rubberband` - Selection rubberband

See `Enumerations.ts` for complete list.

---

### Usage Pattern

```typescript
import { components } from '../managers/Components';

// Get or create component
const s_component = components.component_forAncestry_andType_createUnique(
    ancestry,
    T_Hit_Target.cluster_pager
);

// Use component
s_component.set_html_element(element);  // Register for hit testing
s_component.isHovering;                 // Check hover state
```

---

### Lifecycle

1. **Creation**: Component created on first use
2. **Registration**: Automatically registered in dictionary
3. **Persistence**: Lives until page reload (not tied to Svelte component lifecycle)
4. **Reuse**: Same S_Component reused when Svelte component recreates

**Key Insight**: S_Component survives component recreation, enabling state persistence.

---

### Dummy Component

```typescript
get dummy(): S_Component {
    if (!this._dummy) {
        this._dummy = new S_Component(null, T_Hit_Target.none);
    }
    return this._dummy;
}
```

**Singleton dummy** for default/fallback cases. Not registered in dictionary.

---

### Dictionary Structure Example

```typescript
components_dict_byType_andHID = {
    'cluster_pager': {
        '123': S_Component(ancestry_123, cluster_pager),
        '456': S_Component(ancestry_456, cluster_pager)
    },
    'breadcrumbs': {
        '789': S_Component(ancestry_789, breadcrumbs)
    }
}
```

---

### Performance

- **O(1) lookup**: Two-level dictionary with direct indexing
- **Lazy creation**: Only created when needed
- **No cleanup**: Components persist (small memory footprint)
- **Shared instances**: Multiple Svelte components can share same S_Component

---

## Naming Conventions

### File Names
- `PascalCase.svelte` for components
- Descriptive, not abbreviated
- Prefix indicates category

**Examples**:
- `Breadcrumb_Button.svelte` (not `BC_Btn.svelte`)
- `Radial_Cluster.svelte` (not `RC.svelte`)
- `D_Actions.svelte` (detail panel for actions)

---

### Component Prefixes

| Prefix | Type | Example |
|--------|------|---------|
| `D_` | Detail panels | `D_Actions.svelte` |
| `G_` | Geometry/layout (TypeScript) | `G_TreeGraph.ts` |
| `S_` | State classes (TypeScript) | `S_Widget.ts` |
| `T_` | Type/enum definitions (TypeScript) | `T_Hit_Target` |

---

## Best Practices

### ✅ DO

**Component Organization**:
- Place components by purpose (controls in controls/, details in details/)
- Keep presentation stateless (SVG primitives pure props)
- Name descriptively (`Radial_Cluster.svelte`, not `RC.svelte`)

**State Management**:
- Use state objects from managers (`elements.s_element_for()`)
- Subscribe to manager stores (`$core.w_hierarchy`)
- Use S_Component for complex components, S_Element for simple ones

**Hit Testing**:
- Register hit targets (`s_element.set_html_element()` in `onMount`)
- Clean up in `onDestroy` (unregister hit targets, cancel subscriptions)
- Use centralized hit testing (not DOM event handlers)

**Factory Pattern**:
- Use `component_forAncestry_andType_createUnique` for complex components
- Use `elements.s_element_for` for simple elements
- Let managers control resource creation

---

### ❌ DON'T

**Component Organization**:
- Mix concerns (tree components in radial/, mouse handling in draw/)
- Abbreviate file names (`BC_Btn.svelte` instead of `Breadcrumb_Button.svelte`)
- Duplicate interactive logic (use `Button.svelte` or `Glow_Button.svelte`)

**State Management**:
- Create state objects directly (bypass managers)
- Store manager references (import from Global_Imports every time)
- Forget cleanup (memory leaks from unregistered hit targets)

**Hit Testing**:
- Use DOM event handlers (use centralized hit testing)
- Register manually (factory handles it)
- Mix S_Component and S_Element use cases

**Factory Pattern**:
- Create S_Component directly (use factory)
- Assume component exists (check for null)
- Bypass managers for state creation

---

## Related Documents

- [managers.md](./managers.md) - Manager pattern architecture (includes Components manager)
- [state.md](./state.md) - State management patterns (S_Element, S_Widget, S_Component)
- [hits.md](./hits.md) - Hit testing and click handling (S_Hit_Target base class)

