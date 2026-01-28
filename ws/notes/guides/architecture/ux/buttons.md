# Button Components Analysis

These just cropped up, ad-hoc, at the beginning of the project. Might give it a sanity check.

## Table of Contents
- [Overview](#overview)
- [Component Hierarchy](#component-hierarchy)
  - [Base Component: `Button.svelte`](#base-component-buttonsvelte)
  - [Specialized Variants](#specialized-variants)
- [SVG Configuration Data Flow](#svg-configuration-data-flow)
  - [Path Generation System](#path-generation-system)
  - [Rendering Components](#rendering-components)
  - [Complete Data Flow Example: Buttons_Row](#complete-data-flow-example-buttons_row)
  - [Complete Data Flow Example: Triangle_Button](#complete-data-flow-example-triangle_button)
- [State Management](#state-management)
- [Key Patterns](#key-patterns)
  - [1. **Closure Pattern** (Buttons_Row, Buttons_Table)](#1-closure-pattern-buttons_row-buttons_table)
  - [2. **Reactive Style Updates**](#2-reactive-style-updates)
  - [3. **SVG Conditional Rendering**](#3-svg-conditional-rendering)
- [Reference](#reference)

## Overview

Webseriously uses a hierarchy of button components, from a base `Button` component to specialized variants. All buttons use `S_Element` for state management and support SVG icons through a centralized path generation system.

## Component Hierarchy

### Base Component: `Button.svelte`

The foundation for all button types. Handles:
- **State Management**: Uses `S_Element` (`s_button`) for persistent state (hover, grab, disabled, inverted, editing)
- **Mouse Handling**: Supports multiple detection modes (none, single, double, long, autorepeat)
- **Styling**: Computes styles reactively from `s_button` properties (fill, stroke, cursor)
- **Layout**: Supports both `origin` and `center` positioning with left/right alignment

**Key Props:**
- `s_button: S_Element` - State object (owns stroke, fill, cursor)
- `handle_s_mouse: (s_mouse: S_Mouse) => boolean` - Click handler
- `mouse_detection: T_Mouse_Detection` - Detection mode
- `center | origin: Point` - Position
- `height, width, font_size` - Dimensions
- `border_thickness, border_color` - Border styling

**Slot Content**: Text or SVG icons (rendered as children)

### Specialized Variants

#### 1. **Triangle_Button.svelte**
Wraps `Button` with triangle SVG icon.

**Features:**
- Uses `SVG_D3` component for rendering
- Supports optional `extraPath` for nested shapes
- `hover_closure` callback for dynamic color changes
- Reactive path generation based on `size` and `angle`

**SVG Flow:**
```
angle → svgPaths.fat_polygon(size, angle) → trianglePath → SVG_D3
```

#### 2. **Glow_Button.svelte**
Standalone button with gradient background and optional icon.

**Features:**
- Uses `SVG_Gradient` for background glow effect
- Icon lookup via `svgPaths.fat_polygon_path_for(title)`
- Supports autorepeat detection
- Inline SVG rendering (not using SVG_D3)

**SVG Flow:**
```
title → svgPaths.fat_polygon_path_for(title) → icon_path → inline <svg>
```

#### 3. **Breadcrumb_Button.svelte**
Text-only button for breadcrumb navigation.

**Features:**
- Wraps base `Button` with breadcrumb-specific styling
- No SVG icons (text-only)
- Reactive color updates based on grab/hover state

#### 4. **Buttons_Row.svelte**
Container for horizontal button arrays.

**Features:**
- Optional row title (with or without separator)
- Generates `S_Element` instances per button column
- Uses `G_Repeater` for layout calculations
- Conditional SVG rendering via `has_svg` prop

**SVG Flow:**
```
title → svgPaths.fat_polygon_path_for(title, svg_size) → inline <svg> in slot
```

#### 5. **Buttons_Table.svelte**
Container for multiple `Buttons_Row` instances.

**Features:**
- Manages rows of buttons
- Delegates to `Buttons_Row` for each row
- Visibility control via closure

#### 6. **Next_Previous.svelte**
Specialized pair of buttons with custom SVG support.

**Features:**
- Two buttons (previous/next) with triangle arrows
- Supports `custom_svgPaths` for override (e.g., dash/cross for zoom)
- Autorepeat enabled by default
- Custom transform/color logic for different icon types

**SVG Flow:**
```
title → get_path_for(title, index) → {
  custom_svgPaths? → custom path + fat_polygon
  default → svgPaths.fat_polygon_path_for(title, size)
} → inline <svg>
```

## SVG Configuration Data Flow

### Path Generation System

All SVG paths flow through `svgPaths` utility (`SVG_Paths.ts`):

#### 1. **Name-Based Lookup** (`fat_polygon_path_for`)
```
Button Title/Name → Angle.angle_from_name(name) → fat_polygon(size, angle) → SVG path string
```

**Used by:**
- `Buttons_Row`: `svgPaths.fat_polygon_path_for(title, svg_size)`
- `Glow_Button`: `svgPaths.fat_polygon_path_for(title)`
- `Next_Previous`: `svgPaths.fat_polygon_path_for(String(title), size)`

**Angle Names**: Maps string names (e.g., "up", "down", "left", "right") to angles via `Angle.angle_from_name()`

#### 2. **Direct Angle** (`fat_polygon`)
```
size + angle → fat_polygon(size, angle) → SVG path string
```

**Used by:**
- `Triangle_Button`: `svgPaths.fat_polygon(size, angle)`
- `Widget_Reveal`: `svgPaths.fat_polygon(k.height.dot, direction_ofReveal)`

**Parameters:**
- `size: number` - Icon size
- `angle: number` - Rotation angle in radians
- `onCenter: boolean` - Center offset (default false)
- `vertices: number` - Polygon vertices (default 3 for triangles)

#### 3. **Custom Paths**
Some components accept custom SVG paths directly:
- `Next_Previous`: `custom_svgPaths: { up?: string, down?: string }`
- `Primary_Controls`: Custom dash/cross paths for zoom controls

### Rendering Components

#### **SVG_D3.svelte**
Reusable SVG component used by `Triangle_Button`:
```
svgPath (string) → SVG_D3 → <svg><path d={svgPath}/></svg>
```

**Props:**
- `svgPath: string` - SVG path data
- `stroke, fill` - Colors
- `width, height` - Dimensions
- `viewBox_width, left, top` - Positioning

#### **Inline SVG**
Used by `Buttons_Row`, `Glow_Button`, `Next_Previous`:
```
path string → <svg><path d={path}/></svg>
```

### Complete Data Flow Example: Buttons_Row

```
1. Component receives: title="up", has_svg=true, svg_size=16

2. SVG Path Generation:
   title → svgPaths.fat_polygon_path_for("up", 16)
   → Angle.angle_from_name("up") → angle (e.g., Math.PI/2)
   → svgPaths.fat_polygon(16, angle)
   → "M x,y C ... Z" (SVG path string)

3. Rendering:
   <Button>
     <svg class='svg-button-path-for-up'>
       <path d={path_string} fill='white'/>
     </svg>
   </Button>

4. Button applies styling:
   s_button.fill → background-color
   s_button.stroke → color (text/SVG stroke)
   s_button.cursor → cursor style
```

### Complete Data Flow Example: Triangle_Button

```
1. Component receives: angle=Math.PI/2, size=24

2. SVG Path Generation:
   angle + size → svgPaths.fat_polygon(24, Math.PI/2)
   → "M x,y C ... Z" (SVG path string)

3. State Updates:
   $w_s_hover → isHovering → hover_closure(isHovering)
   → [fillColor, extraColor] (dynamic colors)

4. Rendering:
   <Button>
     <SVG_D3 svgPath={trianglePath} stroke={strokeColor} fill={fillColor}/>
     {#if extraPath}
       <SVG_D3 svgPath={extraPath} fill={extraColor}/>
     {/if}
   </Button>
```

## State Management

All buttons use `S_Element` for persistent state:

**State Properties:**
- `fill, stroke, cursor` - Visual styling
- `isHovering, isGrabbed, isDisabled, isInverted, isEditing` - State flags
- `handle_s_mouse` - Mouse event handler
- `mouse_detection` - Detection mode
- `autorepeat_callback, autorepeat_event` - Autorepeat support

**State Flow:**
```
User Interaction → Hits.ts (centralized) → s_button.handle_s_mouse()
→ Component's handle_s_mouse prop → Business logic
→ s_button state update → Reactive style recomputation
```

## Key Patterns

### 1. **Closure Pattern** (Buttons_Row, Buttons_Table)
Buttons use closure functions for configuration:
```typescript
closure: (t_request: T_Request, s_mouse: S_Mouse, column: number) => boolean
```

Handles:
- `T_Request.handle_click` - Click action
- `T_Request.is_disabled` - Disabled state
- `T_Request.is_inverted` - Inverted state
- `T_Request.name` - Button name

### 2. **Reactive Style Updates**
All buttons recompute styles reactively:
```svelte
$: {
  const _ = `${$w_background_color}:::${$w_s_hover?.id}:::${s_button.fill}`;
  recompute_style();
}
```

### 3. **SVG Conditional Rendering**
Buttons conditionally render SVG vs text:
```svelte
{#if has_svg && !!svgPaths.fat_polygon_path_for(title)}
  <svg><path d={svgPath}/></svg>
{:else}
  {title}
{/if}
```

## Reference

- **Base**: `src/lib/svelte/mouse/Button.svelte`
- **Variants**: `Triangle_Button`, `Glow_Button`, `Breadcrumb_Button`, `Buttons_Row`, `Buttons_Table`, `Next_Previous`
- **SVG Utilities**: `src/lib/ts/utilities/SVG_Paths.ts`
- **Angle Mapping**: `src/lib/ts/types/Angle.ts` (`angle_from_name`)
- **State Objects**: `src/lib/ts/state/S_Element.ts`

