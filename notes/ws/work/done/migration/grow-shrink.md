# Migration: Grow/Shrink Buttons to Next_Previous

*Extracted from architecture/ux/controls.md*

## Current Implementation

The grow/shrink buttons are currently implemented as separate `Button` components:
- **Grow button**: Uses `T_Control.grow`, custom SVG path `svgPaths.t_cross(size_big, 2)`
- **Shrink button**: Uses `T_Control.shrink`, custom SVG path `svgPaths.dash(size_big, 4)`
- **Positioning**: Separate `lefts[2]` and `lefts[3]` indices
- **Handler**: `e.handle_s_mouseFor_t_control(s_mouse, T_Control.grow/shrink)`
- **No autorepeat**: Currently requires repeated clicks

## Target Implementation

Replace with `Next_Previous` component to:
- **Gain autorepeat**: Built-in autorepeat functionality for continuous scaling
- **Unify pattern**: Consistent with recents control pattern
- **Reduce code**: Single component instead of two separate buttons
- **Better UX**: Autorepeat allows smooth continuous scaling

## Challenges

1. **Custom SVG Icons**: `Next_Previous` uses `T_Direction.previous/next` arrows, but grow/shrink need `t_cross` and `dash` icons
2. **Icon Mapping**: Need to map grow → "next" (increase) and shrink → "previous" (decrease) conceptually
3. **Positioning**: `Next_Previous` uses `origin` (single point), while current uses separate `center` points
4. **Handler Interface**: `Next_Previous` closure receives `column: number` (0=previous, 1=next), needs adapter for `T_Control` enum
5. **Visual Styling**: May need to adjust size/styling to match current appearance

## Migration Steps

### Option A: Extend Next_Previous Component (Recommended)

1. **Add custom icon support to `Next_Previous.svelte`**:
   - Add optional prop: `custom_icons?: { previous: string, next: string }` (SVG path data)
   - Modify SVG path generation to use custom icons when provided
   - Fall back to `T_Direction` paths when not provided

2. **Update `Primary_Controls.svelte`**:
   - Remove the two separate `Button` components (lines 120-149)
   - Add single `Next_Previous` component:
     ```svelte
     <Next_Previous name='scale'
       size={size_big}
       has_title={false}
       origin={Point.x(lefts[2])}
       custom_icons={{
         previous: svgPaths.dash(size_big, 4),
         next: svgPaths.t_cross(size_big, 2)
       }}
       closure={(column) => {
         const t_control = column === 0 ? T_Control.shrink : T_Control.grow;
         // Create synthetic S_Mouse event or call handler directly
         e.handle_s_mouseFor_t_control(/* ... */, t_control);
       }}/>
     ```

3. **Update `left_widths`**:
   - Combine indices 2 and 3 into single index for scale control
   - Adjust width to accommodate both buttons in `Next_Previous` layout

4. **Handler Adapter**:
   - Create adapter function that converts `Next_Previous` closure pattern to `T_Control` pattern
   - Or modify `handle_s_mouseFor_t_control` to accept direct calls

### Option B: Create Scale_Controls Component

1. **Create new component** `Scale_Controls.svelte` based on `Next_Previous.svelte`:
   - Copy structure from `Next_Previous`
   - Replace `T_Direction` icons with `t_cross` and `dash`
   - Customize for grow/shrink specific needs

2. **Use in `Primary_Controls.svelte`**:
   - Replace Button components with new `Scale_Controls` component
   - Maintain same positioning and handler interface

## Considerations

- **Autorepeat behavior**: Ensure autorepeat works correctly for scaling operations
- **Visual consistency**: Maintain current button appearance (size, stroke, colors)
- **Positioning**: `Next_Previous` uses `origin` (left edge), may need adjustment for centering
- **Handler compatibility**: See detailed analysis below
- **Testing**: Verify autorepeat doesn't cause performance issues with frequent scale updates
- **Feature flag**: Keep `features.has_zoom_controls` check for conditional rendering

## Handler Interface Analysis: Synthetic S_Mouse vs Refactoring

### The Interface Mismatch

**Current State:**
- `Next_Previous` closure: `(column: number) => any`
  - Receives simple integer: `0` = previous (shrink), `1` = next (grow)
  - Called during autorepeat with no mouse context
  - Stores `autorepeat_events[index]` (MouseEvent) internally

- `handle_s_mouseFor_t_control`: `(s_mouse: S_Mouse, t_control: T_Control) => void`
  - Requires full `S_Mouse` object with `isDown`, `event`, `element`
  - Only acts when `s_mouse.isDown === true`
  - Currently receives `S_Mouse` from Button component's mouse handler

**The Gap:**
`Next_Previous` provides `column` number and stored `MouseEvent`, but `handle_s_mouseFor_t_control` expects a complete `S_Mouse` object.

### Approach A: Create Synthetic S_Mouse Events (Recommended)

#### Implementation

Create an adapter closure that constructs `S_Mouse` instances from `Next_Previous`'s callback:

```typescript
// In Primary_Controls.svelte
function handle_scale_control(column: number) {
	// Get the stored autorepeat event from Next_Previous's internal state
	// This requires accessing Next_Previous's autorepeat_events array
	// OR: Modify Next_Previous to pass event to closure
	
	// For initial click (isDown):
	const s_mouse_down = S_Mouse.down(autorepeat_event, button_element);
	const t_control = column === 0 ? T_Control.shrink : T_Control.grow;
	e.handle_s_mouseFor_t_control(s_mouse_down, t_control);
	
	// For autorepeat (isRepeat):
	const s_mouse_repeat = S_Mouse.repeat(autorepeat_event, button_element);
	e.handle_s_mouseFor_t_control(s_mouse_repeat, t_control);
}
```

#### Challenge: Accessing Autorepeat Event

`Next_Previous` stores `autorepeat_events[index]` internally but doesn't expose it to the closure. Two solutions:

**Solution A1: Modify Next_Previous to Pass Event**
```typescript
// In Next_Previous.svelte
s_element.autorepeat_callback = () => {
	if (autorepeat_events[index]) {
		closure(index, autorepeat_events[index], button_elements[index]); // Pass event and element
	}
};

// Update closure signature
export let closure: (column: number, event: MouseEvent | null, element: HTMLElement | null) => any;
```

**Solution A2: Store Events in Parent Component**
```typescript
// In Primary_Controls.svelte
let scale_autorepeat_events: (MouseEvent | null)[] = [null, null];

function handle_scale_control(column: number, event: MouseEvent | null, element: HTMLElement | null) {
	scale_autorepeat_events[column] = event;
	const t_control = column === 0 ? T_Control.shrink : T_Control.grow;
	
	if (event) {
		// Determine if this is initial down or repeat
		// Next_Previous calls closure on initial down AND during autorepeat
		// Need to distinguish: first call = down, subsequent = repeat
		const isFirstCall = !scale_autorepeat_events[column]; // Simplified check
		const s_mouse = isFirstCall 
			? S_Mouse.down(event, element)
			: S_Mouse.repeat(event, element);
		e.handle_s_mouseFor_t_control(s_mouse, t_control);
	}
}
```

#### Pros of Approach A

- ✅ **Minimal changes**: Works with existing `handle_s_mouseFor_t_control` signature
- ✅ **Type safety**: Uses existing `S_Mouse` type system
- ✅ **Consistency**: Maintains same handler pattern as other controls
- ✅ **Future-proof**: If handler needs more `S_Mouse` properties later, they're available
- ✅ **Separation of concerns**: Handler doesn't need to know about `Next_Previous` internals

#### Cons of Approach A

- ❌ **Event tracking complexity**: Need to track which call is first vs repeat
- ❌ **Element reference**: Need to get button element reference (may require Next_Previous modification)
- ❌ **Synthetic nature**: Creating events that didn't come from actual mouse interaction feels artificial

#### Implementation Details

**Distinguishing Initial vs Repeat:**
```typescript
let scale_last_call_time: [number | null, number | null] = [null, null];
const REPEAT_THRESHOLD_MS = 100; // Time between initial and first repeat

function handle_scale_control(column: number, event: MouseEvent | null, element: HTMLElement | null) {
	if (!event) return;
	
	const now = Date.now();
	const lastTime = scale_last_call_time[column];
	const isRepeat = lastTime !== null && (now - lastTime) < REPEAT_THRESHOLD_MS;
	
	scale_last_call_time[column] = now;
	
	const s_mouse = isRepeat 
		? S_Mouse.repeat(event, element)
		: S_Mouse.down(event, element);
	
	const t_control = column === 0 ? T_Control.shrink : T_Control.grow;
	e.handle_s_mouseFor_t_control(s_mouse, t_control);
}
```

**Better: Use Next_Previous's autorepeat_isFirstCall flag:**
If `Next_Previous` exposes whether it's the first call, we can use that directly.

### Approach B: Refactor Handler Interface

#### Implementation

Create a new, simpler handler method that accepts direct control type:

```typescript
// In Events.ts
handle_t_control_direct(t_control: T_Control, isRepeat: boolean = false) {
	// Simplified handler that doesn't need S_Mouse
	switch (t_control) {
		case T_Control.grow:
			g.scaleBy(k.ratio.zoom_in);
			break;
		case T_Control.shrink:
			g.scaleBy(k.ratio.zoom_out);
			break;
		// ... other cases
	}
}

// In Primary_Controls.svelte
<Next_Previous 
	closure={(column) => {
		const t_control = column === 0 ? T_Control.shrink : T_Control.grow;
		e.handle_t_control_direct(t_control);
	}}
/>
```

#### Pros of Approach B

- ✅ **Simpler**: No need to construct `S_Mouse` objects
- ✅ **Direct**: Clear intent, no synthetic events
- ✅ **Performance**: Slightly faster (no object creation)
- ✅ **Cleaner closure**: Just maps column to control type

#### Cons of Approach B

- ❌ **Interface proliferation**: Creates second handler method alongside existing one
- ❌ **Inconsistency**: Different controls use different handler patterns
- ❌ **Limited future flexibility**: If handler needs mouse coordinates, modifiers, etc., need to add parameters
- ❌ **Breaking pattern**: Other controls use `handle_s_mouseFor_t_control`, this would be exception
- ❌ **Loss of context**: No access to `event` (for coordinates, modifiers) or `element` (for positioning)

#### Hybrid Approach B1: Overload with Optional S_Mouse

```typescript
// In Events.ts
handle_s_mouseFor_t_control(s_mouse: S_Mouse | null, t_control: T_Control) {
	if (s_mouse?.isDown || !s_mouse) { // Allow null for direct calls
		switch (t_control) {
			case T_Control.grow: g.scaleBy(k.ratio.zoom_in); break;
			case T_Control.shrink: g.scaleBy(k.ratio.zoom_out); break;
			// ...
		}
	}
}

// In Primary_Controls.svelte
<Next_Previous 
	closure={(column) => {
		const t_control = column === 0 ? T_Control.shrink : T_Control.grow;
		e.handle_s_mouseFor_t_control(null, t_control); // Pass null for S_Mouse
	}}
/>
```

This maintains interface consistency but loses mouse context.

### Recommendation: Approach A with Next_Previous Modification

**Best solution**: Modify `Next_Previous` to pass event and element to closure, then use synthetic `S_Mouse`:

1. **Update Next_Previous.svelte**:
```typescript
export let closure: (column: number, event: MouseEvent | null, element: HTMLElement | null, isFirstCall: boolean) => any;

s_element.autorepeat_callback = () => {
	if (autorepeat_events[index]) {
		closure(index, autorepeat_events[index], button_elements[index], autorepeat_isFirstCall);
		autorepeat_isFirstCall = false;
	}
};
```

2. **Use in Primary_Controls.svelte**:
```typescript
function handle_scale_control(column: number, event: MouseEvent | null, element: HTMLElement | null, isFirstCall: boolean) {
	const t_control = column === 0 ? T_Control.shrink : T_Control.grow;
	const s_mouse = isFirstCall
		? S_Mouse.down(event, element)
		: S_Mouse.repeat(event, element);
	e.handle_s_mouseFor_t_control(s_mouse, t_control);
}

<Next_Previous 
	name='scale'
	closure={handle_scale_control}
	// ... other props
/>
```

**Why this is best:**
- ✅ Maintains type safety and consistency
- ✅ Provides full mouse context when needed
- ✅ Clear distinction between initial click and repeat
- ✅ Minimal changes to existing handler interface
- ✅ Reusable pattern for other controls that might migrate to Next_Previous

## Benefits After Migration

- **Autorepeat**: Users can hold button for continuous scaling
- **Code reduction**: ~30 lines of duplicate button code eliminated
- **Consistency**: Matches pattern used by recents control
- **Maintainability**: Single component to maintain instead of two
