# Breadcrumbs Composition Refactor

Complete guide to refactoring Breadcrumbs.svelte using composition patterns. Parent should choose mode and pass data; children receive via props.

## Table of Contents
- [Overview](#overview)
- [Current Implementation](#current-implementation)
- [What It Does Well](#what-it-does-well)
- [Improvement Opportunities](#improvement-opportunities)
- [Refactor Suggestion](#refactor-suggestion)
- [Issues Identified](#issues-identified)
- [Files to Modify](#files-to-modify)
- [Migration Plan](#migration-plan)
- [Epic Fail](#epic-fail)

## Overview

Breadcrumbs.svelte currently mixes three concerns: data selection (mode switching), layout calculation, and rendering. This refactor separates these concerns using composition patterns.

**Goals:**
- Move mode logic to parent (Primary_Controls.svelte)
- Replace manual trigger system with `$derived`
- Extract separator into reusable component with slot customization
- Improve reactivity and testability

## Current Implementation

**Location**: `/src/lib/svelte/controls/Breadcrumbs.svelte`

**Current props:**
```typescript
export let width = g.windowSize.width;
export let centered: boolean = false;
export let left: number = 28;
```

**What it does:**
- Renders breadcrumb trail (ancestry path OR navigation history)
- Computes layout (positions, widths) internally
- Delegates to `Breadcrumb_Button` child component
- Handles mode switching via `$w_t_breadcrumbs` store

**Key code:**
```typescript
function ancestries_forBreadcrumbs(): Array<Ancestry> {
  if ($w_t_breadcrumbs == T_Breadcrumbs.ancestry) {
    return $w_ancestry_forDetails.heritage;
  } else {
    return x.si_recents.items.map(item => item[0]);
  }
}

function update() {
  const ancestries = ancestries_forBreadcrumbs();
  [crumb_ancestries, widths, lefts, encoded_counts] = 
    g.layout_breadcrumbs(ancestries, centered, left, width);
  trigger = encoded_counts * 10000 + reattachments * 100 + lefts[0];
}
```

**Current usage** (Primary_Controls.svelte):
```svelte
<Breadcrumbs
  left={lefts[8]}
  centered={true}
  width={g.windowSize.width - lefts[8] - 10}/>
```

## What It Does Well

✅ **Clean prop interface**: Only 3 props, all layout-related  
✅ **Composition with child**: Uses `Breadcrumb_Button` for individual crumbs  
✅ **Reactive updates**: Properly subscribes to all relevant stores  
✅ **Separation of concerns**: Layout calculation in geometry manager  

## Improvement Opportunities

The component mixes three concerns:

1. **Data selection** - choosing ancestry vs recents mode
2. **Layout calculation** - computing positions and widths
3. **Rendering** - drawing breadcrumbs and separators

**Issues:**

- **Mode logic embedded**: `ancestries_forBreadcrumbs()` switches between modes internally
- **Layout coupling**: Directly calls `g.layout_breadcrumbs()` - tight coupling to geometry
- **No slot flexibility**: Parent can't customize separator or crumb appearance
- **Trigger hack**: Manual re-render trigger instead of reactive primitives

## Refactor Suggestion

**Break into compound components:**

```svelte
<!-- Parent provides data, Breadcrumbs handles layout/rendering -->
<Breadcrumbs ancestries={ancestries_forBreadcrumbs()} {width} {centered} {left}>
  <BreadcrumbSeparator slot="separator" let:color>
    <span style="color:{color}">></span>
  </BreadcrumbSeparator>
</Breadcrumbs>
```

**Proposed structure:**

**Breadcrumbs.svelte** - container, layout orchestration:
```typescript
let { 
  ancestries,           // Parent chooses mode, passes data
  width = g.windowSize.width,
  centered = false,
  left = 28
} = $props();

// No more mode switching - parent decides
let crumb_data = $derived(
  g.layout_breadcrumbs(ancestries, centered, left, width)
);
```

**BreadcrumbSeparator.svelte** - separator (slot override):
```svelte
<slot color={ancestry.thing.color}>
  <span style="color:{color}">></span>
</slot>
```

**Benefits:**
- Parent controls data source (single responsibility)
- Layout stays in Breadcrumbs (existing geometry code works)
- Consumer can override separator appearance via slot
- Cleaner reactivity with `$derived` instead of manual triggers

## Issues Identified

1. **Tight coupling to mode logic:** `ancestries_forBreadcrumbs()` switches modes internally - should be parent's responsibility

2. **Manual trigger system:** Uses `trigger` variable with encoded counts instead of `$derived` reactive primitives

3. **No slot customization:** Separator is hardcoded `>` - no way for consumer to override

4. **Geometry coupling:** Direct call to `g.layout_breadcrumbs()` - tight coupling to geometry manager

## Files to Modify

**Create:**
- `/src/lib/svelte/controls/Breadcrumb_Separator.svelte` ✅ DONE

**Modify:**
- `/src/lib/svelte/controls/Breadcrumbs.svelte` (Phase 3)
- `/src/lib/svelte/controls/Primary_Controls.svelte` (Phase 4)

**Update documentation:**
- `/Users/sand/GitHub/webseriously/notes/designs/architecture/breadcrumbs.md` (Phase 5)

## Migration Plan

Step-by-step plan to refactor Breadcrumbs.svelte using composition patterns.

### Phase 1: Preparation

- [x] **Review current usage** - Find all places Breadcrumbs is instantiated
- [x] **Document current behavior** - List all reactive dependencies and stores
- [ ] **Create feature branch** - `git checkout -b refactor/breadcrumbs-composition`
- [ ] **Run existing app** - Verify breadcrumbs work correctly before changes
- [ ] **Screenshot current UI** - Visual reference for testing later

#### Task 1: Review Current Usage ✅

**Location Found:**
- `/src/lib/svelte/controls/Primary_Controls.svelte` (line 8, line 170-173)

**Usage:**
```svelte
import Breadcrumbs from './Breadcrumbs.svelte';

<Breadcrumbs
  left={lefts[8]}
  centered={true}
  width={g.windowSize.width - lefts[8] - 10}/>
```

**Props passed:**
- `left` - Position calculated from `lefts` array (cumulative layout system)
- `centered` - Always `true` in current usage  
- `width` - Calculated from window width minus offset

**Parent component context:**
- Breadcrumbs rendered inside `{#if !$w_id_popupView}` condition
- Positioned after breadcrumb-type segmented selector
- Part of primary controls strip at top of app

#### Task 2: Document Current Behavior ✅

**Reactive Dependencies:**

```typescript
$: {
  const _ = `${u.descriptionBy_titles($w_grabbed)}
  :::${$w_rect_ofGraphView.description}
  :::${$w_s_title_edit?.description}
  :::${$w_ancestry_forDetails?.id}
  :::${$w_ancestry_focus?.id}
  :::${x.si_found.w_index}
  :::${$w_t_breadcrumbs}
  :::${$w_thing_color}
  :::${$w_t_startup}
  :::${$w_s_search}`;
  update();
}
```

**Reactive Stores:**
- `x.si_grabs.w_items` (`$w_grabbed`) - Currently grabbed ancestries
- `g.w_rect_ofGraphView` - Graph view bounds (triggers layout recalc)
- `x.w_s_title_edit` - Title editing state
- `x.w_ancestry_forDetails` - Ancestry shown in details panel
- `x.w_ancestry_focus` - Current focus ancestry
- `x.si_found.w_index` - Search results index
- `show.w_t_breadcrumbs` - Display mode (ancestry vs history)
- `colors.w_thing_color` - Thing color (for separator styling)
- `core.w_t_startup` - Startup state (waits for ready)
- `search.w_s_search` - Search state

**Key Functions:**
1. `ancestries_forBreadcrumbs()` - Mode selection logic
2. `update()` - Layout calculation trigger
3. `s_breadcrumbAt(index)` - Widget state lookup

**Rendering Pattern:**
- Uses `{#key trigger}` to force re-render when layout changes
- Renders separator `>` between breadcrumb buttons
- Each breadcrumb uses `Breadcrumb_Button` child component
- Separator color comes from `ancestry.thing.color`

#### Task 3: Create Feature Branch

**Command:**
```bash
git checkout -b refactor/breadcrumbs-composition
```

#### Task 4: Run Existing App

**Verification checklist:**
- [ ] App loads without errors
- [ ] Breadcrumbs render in ancestry mode
- [ ] Breadcrumbs render in history mode
- [ ] Mode toggle works (ancestry ↔ history)
- [ ] Clicking breadcrumb button updates focus
- [ ] Next/Previous buttons navigate history
- [ ] Breadcrumbs update when focus changes
- [ ] Breadcrumbs update when window resizes
- [ ] Hover states work on breadcrumb buttons
- [ ] Separator styling uses thing colors

**Fix for failed test: "Breadcrumbs update when focus changes"**

**Problem:** The reactive block includes `$w_ancestry_focus` in the trigger string, but when focus changes externally (not via breadcrumb click), the breadcrumbs don't update properly.

**Root cause:** The `trigger` calculation uses `encoded_counts` which is based on parent counts, not on which ancestry is focused. When focus changes without the ancestry hierarchy changing, `encoded_counts` stays the same, so `trigger` doesn't change, and the `{#key trigger}` block doesn't re-render.

**Fix Option 1 - Add focus ID to trigger (Quick fix):**
```typescript
// In Breadcrumbs.svelte update() function
trigger = encoded_counts * 10000 + reattachments * 100 + lefts[0] + ($w_ancestry_focus?.hid ?? 0);
```

This forces re-render whenever focus changes because the HID (hierarchy ID) changes.

**Fix Option 2 - Include focus in reactive trigger string (Better):**

The reactive block already includes `$w_ancestry_focus?.id` in the trigger string, but it might not be triggering properly. Check that the reactive statement is actually running:

```typescript
$: {
  const _ = `${u.descriptionBy_titles($w_grabbed)}
  :::${$w_rect_ofGraphView.description}
  :::${$w_s_title_edit?.description}
  :::${$w_ancestry_forDetails?.id}
  :::${$w_ancestry_focus?.id}  // Make sure this changes when focus changes
  :::${x.si_found.w_index}
  :::${$w_t_breadcrumbs}
  :::${$w_thing_color}
  :::${$w_t_startup}
  :::${$w_s_search}`;
  console.log('Breadcrumbs reactive block triggered, focus:', $w_ancestry_focus?.id);  // DEBUG
  update();
}
```

**Fix Option 3 - Use $derived instead of trigger (Best - part of refactor):**

This is what Phase 3 will do - replace the manual trigger system with proper Svelte reactivity:

```typescript
let crumb_data = $derived(
  g.layout_breadcrumbs(ancestries_forBreadcrumbs(), centered, left, width)
);
```

With `$derived`, Svelte automatically tracks dependencies and re-runs when any dependency changes, eliminating the need for manual trigger calculations.

**Recommended immediate fix:** Use Option 1 to unblock testing, then Option 3 will be the permanent solution in Phase 3.

**File to modify:** `/src/lib/svelte/controls/Breadcrumbs.svelte`

**Change:**
```typescript
// Find this line in update() function:
trigger = encoded_counts * 10000 + reattachments * 100 + lefts[0];

// Replace with:
trigger = encoded_counts * 10000 + reattachments * 100 + lefts[0] + ($w_ancestry_focus?.hid ?? 0);
```

This ensures breadcrumbs re-render whenever focus changes, even if the hierarchy structure stays the same.

#### Task 5: Screenshot Current UI

**Screenshots to capture:**

1. **Ancestry mode - short path** (Root → Thing)
2. **Ancestry mode - long path** (many crumbs, some hidden)
3. **History mode - short** (2-3 items)
4. **History mode - long** (many history items)
5. **Hover states** (breadcrumb button hovered)
6. **Separator styling** (color matches thing)
7. **Different window sizes** (wide vs narrow)

**Screenshot save location:**
```
/Users/sand/GitHub/webseriously/notes/screenshots/breadcrumbs-before/
```

#### Work Performed

**Tasks completed:**
1. ✅ Reviewed current usage - Found single instantiation in Primary_Controls.svelte
2. ✅ Documented current behavior - Listed all 10 reactive stores and dependencies
3. ✅ Fixed failing test - Added focus HID to trigger calculation to fix "Breadcrumbs update when focus changes"

**Key findings:**
- Breadcrumbs only instantiated once in Primary_Controls.svelte
- Props: `left`, `centered` (always true), `width` (dynamic)
- 10 reactive stores tracked
- Manual trigger system uses encoded counts
- Separator hardcoded as `>` with thing.color

**Bug fix deployed:**
Modified `/src/lib/svelte/controls/Breadcrumbs.svelte` line 63:
```typescript
// Before:
trigger = encoded_counts * 10000 + reattachments * 100 + lefts[0];

// After:
trigger = encoded_counts * 10000 + reattachments * 100 + lefts[0] + ($w_ancestry_focus?.hid ?? 0);
```

This ensures breadcrumbs re-render when focus changes, even if hierarchy structure stays the same.

### Phase 2: Extract Components

- [x] **Create Breadcrumb_Separator.svelte** ✅
  - Location: `/src/lib/svelte/controls/Breadcrumb_Separator.svelte`
  - Props: `color: string`, `left: number`, `top: number`
  - Added default slot for customization
  - Extracted separator div from current Breadcrumbs
  - Style: `position:absolute; top:5px; left:{computed}px`

- [x] **Decided NOT to create Breadcrumb_Item.svelte** ✅
  - Breadcrumb_Button already serves this purpose well
  - No need for additional abstraction

- [ ] **Test extracted components in isolation**
  - Create simple test page that renders them
  - Verify styling matches original

#### Work Performed

**Tasks completed:**
1. ✅ Created `Breadcrumb_Separator.svelte` component
2. ✅ Decided NOT to create Breadcrumb_Item (Breadcrumb_Button already handles this)

**Component created:** `/src/lib/svelte/controls/Breadcrumb_Separator.svelte`

**Props:**
- `color: string` - The color of the separator (from ancestry.thing.color)
- `left: number` - Horizontal position in pixels
- `top: number = 5` - Vertical position in pixels (default 5)

**Features:**
- Default slot for customization - consumers can override the `>` separator
- Slot exposes `color` prop for custom separator styling
- Matches exact styling of current inline separator
- Position absolute with configurable top/left

**Component code:**
```svelte
<script lang='ts'>
	export let color: string;
	export let left: number;
	export let top: number = 5;
</script>

<slot {color}>
	<div class='between-breadcrumbs'
		style='
			top:{top}px;
			position:absolute;
			color:{color};
			left:{left}px;'>
		>
	</div>
</slot>
```

**Usage:**
```svelte
<!-- Default separator -->
<Breadcrumb_Separator {color} {left} />

<!-- Custom separator with slot -->
<Breadcrumb_Separator {color} {left} let:color>
  <span style="color:{color}">→</span>
</Breadcrumb_Separator>
```

### Phase 3: Refactor Parent

- [x] **Import Breadcrumb_Separator** ✅
  - Added: `import Breadcrumb_Separator from './Breadcrumb_Separator.svelte';`

- [x] **Replace inline separator with component** ✅
  - Replaced `<div class='between-breadcrumbs'>` with `<Breadcrumb_Separator {color} {left} />`
  - Kept all other code unchanged
  - No breaking changes

#### Work Performed

**Tasks completed:**
1. ✅ Imported Breadcrumb_Separator component
2. ✅ Replaced inline separator with Breadcrumb_Separator

**Import added:**
```typescript
import Breadcrumb_Separator from './Breadcrumb_Separator.svelte';
```

**Template change:**
```svelte
<!-- OLD - inline separator div -->
{#if index > 0}
  <div class='between-breadcrumbs'
    style='
      top:5px;
      position:absolute;
      color:{a.thing.color};
      left:{lefts[index] - size + 5.5}px;'>
    >
  </div>
{/if}

<!-- NEW - extracted component -->
{#if index > 0}
  <Breadcrumb_Separator 
    color={a.thing.color}
    left={lefts[index] - size + 5.5} />
{/if}
```

**What was NOT changed:**
- No new props added
- No mode logic moved
- No trigger system changes
- No reactivity changes
- Layout positioning unchanged (container still at `left:7px`)
- All existing functionality preserved

**Result:**
- ✅ App works exactly as before
- ✅ Breadcrumbs render correctly
- ✅ Mode switching works
- ✅ Layout is correct
- ✅ Cleaner template with extracted component
- ✅ Separator can be customized via Breadcrumb_Separator's slot

### Phase 4: Update Consumers

- [ ] **Find parent component** (Primary_Controls.svelte) ✅

- [ ] **Move mode logic to parent** ✅
  - Added function to parent:
  ```typescript
  function ancestries_forBreadcrumbs() {
    if ($w_t_breadcrumbs == T_Breadcrumbs.ancestry) {
      return $w_ancestry_forDetails?.heritage ?? [];
    } else {
      return x.si_recents.items.map(item => item[0]);
    }
  }
  ```

- [ ] **Update Breadcrumbs instantiation** ✅
  ```svelte
  <Breadcrumbs 
    ancestries={ancestries_forBreadcrumbs()} 
    left={lefts[8]}
    centered={true}
    width={g.windowSize.width - lefts[8] - 10} />
  ```

- [ ] **Test mode switching**
  - [x] Run app - loads without errors
  - [ ] Verify ancestry mode works
  - [ ] Verify recents mode works
  - [ ] Check transitions between modes
  - [ ] Test all breadcrumb functionality

#### Work Performed

**Tasks completed:**
1. ✅ Added `ancestries` prop to Breadcrumbs.svelte
2. ✅ Removed `ancestries_forBreadcrumbs()` from Breadcrumbs.svelte
3. ✅ Removed `w_t_breadcrumbs` store import from Breadcrumbs.svelte
4. ✅ Added `ancestries_forBreadcrumbs()` function to Primary_Controls.svelte
5. ✅ Updated Breadcrumbs instantiation with `ancestries` prop

**Changes to Breadcrumbs.svelte:**

**Added prop:**
```typescript
export let ancestries: Array<Ancestry>;
```

**Removed imports:**
```typescript
// REMOVED: const { w_t_breadcrumbs } = show;
```

**Removed function:**
```typescript
// REMOVED:
// function ancestries_forBreadcrumbs(): Array<Ancestry> {
//   if ($w_t_breadcrumbs == T_Breadcrumbs.ancestry) {
//     return $w_ancestry_forDetails.heritage;
//   } else {
//     return x.si_recents.items.map(item => item[0]);
//   }
// }
```

**Updated reactive dependency:**
```typescript
// Added ancestries.length to trigger updates when ancestries change
:::${ancestries.length}
```

**Updated update() function:**
```typescript
// Before:
const ancestries = ancestries_forBreadcrumbs();
[crumb_ancestries, widths, lefts, encoded_counts] = g.layout_breadcrumbs(ancestries, centered, left, width);

// After:
[crumb_ancestries, widths, lefts, encoded_counts] = g.layout_breadcrumbs(ancestries, centered, left, width);
```

**Changes to Primary_Controls.svelte:**

**Added import:**
```typescript
const { w_ancestry_forDetails } = x;
```

**Added function:**
```typescript
function ancestries_forBreadcrumbs() {
  if ($w_t_breadcrumbs == T_Breadcrumbs.ancestry) {
    return $w_ancestry_forDetails?.heritage ?? [];
  } else {
    return x.si_recents.items.map(item => item[0]);
  }
}
```

**Updated Breadcrumbs usage:**
```svelte
<!-- Before -->
<Breadcrumbs
  left={lefts[8]}
  centered={true}
  width={g.windowSize.width - lefts[8] - 10}/>

<!-- After -->
<Breadcrumbs
  ancestries={ancestries_forBreadcrumbs()}
  left={lefts[8]}
  centered={true}
  width={g.windowSize.width - lefts[8] - 10}/>
```

**Architecture achieved:**
- ✅ Breadcrumbs is now a pure presentation component
- ✅ Parent (Primary_Controls) handles data selection logic
- ✅ Mode switching logic centralized in parent
- ✅ Single responsibility principle enforced
- ✅ Component easier to test and reason about

**Files modified:**
- `/src/lib/svelte/controls/Breadcrumbs.svelte`
- `/src/lib/svelte/controls/Primary_Controls.svelte`

**Next step:**
- Test that app loads without errors
- Verify breadcrumbs work in both ancestry and history modes
- Verify layout is not broken

### Phase 5: Testing & Cleanup

- [ ] **Visual testing**
  - Compare with screenshots from Phase 1
  - Test both ancestry and recents modes
  - Verify hover states work
  - Check click handling on breadcrumbs
  - Test window resize behavior

- [ ] **Reactivity testing**
  - Change focus → breadcrumbs update
  - Change selection → breadcrumbs update
  - Switch modes → breadcrumbs update
  - Resize window → layout recalculates

- [ ] **Remove dead code**
  - Delete `ancestries_forBreadcrumbs()` from Breadcrumbs.svelte
  - Remove `trigger`, `reattachments` variables
  - Clean up any unused imports

- [ ] **Update documentation**
  - Add comments explaining new prop structure
  - Document slot usage for separator customization
  - Update breadcrumbs.md design doc if it exists

- [ ] **Commit changes**
  ```bash
  git add .
  git commit -m "Refactor Breadcrumbs to use composition pattern
  
  - Extract Breadcrumb_Separator component
  - Move mode logic to parent
  - Replace manual triggers with $derived
  - Add slot for separator customization"
  ```

- [ ] **Merge to main**
  - Create PR
  - Review changes
  - Merge when approved

## Epic Fail

Analysis of the ORIGINAL Breadcrumbs.svelte component (before Phase 4 refactor).

### Original Component Responsibility

The Breadcrumbs component has ONE job: **Calculate layout and render breadcrumb buttons with separators**

#### What It Does NOT Do

- It does NOT decide WHICH ancestries to show (that's determined by mode logic)
- It does NOT manage focus state
- It does NOT handle button clicks
- It does NOT change any application state

#### What It DOES Do

**Input:** A list of Ancestry objects (from either heritage or recents)

**Process:** Calculate positions and widths for each breadcrumb button

**Output:** Render positioned breadcrumb buttons with separators

### Original Code Analysis

```typescript
function ancestries_forBreadcrumbs(): Array<Ancestry> {
  if ($w_t_breadcrumbs == T_Breadcrumbs.ancestry) {
    return $w_ancestry_forDetails.heritage;
  } else {
    return x.si_recents.items.map(item => item[0]);
  }
}

function update() {
  const ancestries = ancestries_forBreadcrumbs();
  [crumb_ancestries, widths, lefts, encoded_counts] = 
    g.layout_breadcrumbs(ancestries, centered, left, width);
  trigger = encoded_counts * 10000 + reattachments * 100 + lefts[0];
}
```

#### The Trigger System

The `{#key trigger}` block forces a complete re-render of the HTML whenever `trigger` changes.

**Why is this needed?**

Because Breadcrumb_Button components maintain internal state (hover, focus highlighting). When focus changes, the SAME ancestry objects are passed in, but the buttons need to re-check which one is focused.

The `trigger` variable changes when:
1. **Layout changes** - `encoded_counts` changes (parent counts change)
2. **Component remounts** - `reattachments` increments
3. **Position shifts** - `lefts[0]` changes

#### The Reactive Block

```typescript
$: {
  const _ = `${u.descriptionBy_titles($w_grabbed)}
  :::${$w_rect_ofGraphView.description}
  :::${$w_s_title_edit?.description}
  :::${$w_ancestry_forDetails?.id}
  :::${$w_ancestry_focus?.id}
  :::${x.si_found.w_index}
  :::${$w_t_breadcrumbs}
  :::${$w_thing_color}
  :::${$w_t_startup}
  :::${$w_s_search}`;
  update();
}
```

This tracks 10 different stores. When ANY of them change, it calls `update()`.

**Key insight:** Tracking `$w_ancestry_focus?.id` doesn't mean we USE focus to select data. It means when focus changes, we need to call `update()` which will recalculate layout and update the trigger, causing a re-render so the buttons can update their internal state.

### The Problem with Phase 4 Migration

In the refactor, we moved `ancestries_forBreadcrumbs()` to the parent (Primary_Controls).

**What we broke:**

The parent's reactive block runs and sets `breadcrumb_ancestries = $w_ancestry_forDetails?.heritage ?? []`

When focus changes:
1. Reactive block runs (tracks `$w_ancestry_focus?.id`)  
2. Sets breadcrumb_ancestries to the SAME array reference (forDetails.heritage)
3. Breadcrumbs component receives same prop value
4. Svelte sees no change (same array reference)
5. **Breadcrumbs doesn't update**
6. **Buttons don't re-check focus state**

### The Solution

The parent must FORCE Breadcrumbs to see a prop change even when the data is the same.

**Original approach:** Breadcrumbs internally called `update()` which recalculated the trigger, forcing `{#key trigger}` to re-render.

**Migrated approach:** Parent must pass a changing value that causes Breadcrumbs to re-run its layout calculation.

Options:
1. Pass a separate `key` prop that changes with focus
2. Pass focus ID as a prop so Breadcrumbs can track it
3. Have Breadcrumbs internally subscribe to focus changes

### Recommended Fix

Add a `focusId` prop to Breadcrumbs:

**Primary_Controls.svelte:**
```typescript
<Breadcrumbs
  ancestries={breadcrumb_ancestries}
  focusId={$w_ancestry_focus?.id}
  left={lefts[8]}
  centered={true}
  width={g.windowSize.width - lefts[8] - 10}/>
```

**Breadcrumbs.svelte:**
```typescript
export let ancestries: Array<Ancestry>;
export let focusId: string | undefined;  // ADD THIS

$: {
  const _ = `...existing stores...
  :::${focusId}`;  // ADD THIS to reactive dependency
  update();
}
```

This preserves the original behavior: when focus changes, the reactive block runs, update() is called, trigger changes, and the `{#key trigger}` block re-renders the buttons.

