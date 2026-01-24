# Focus Initialization Path

Tracked down why w_ancestry_focus was undefined during G_TreeGraph initialization. Module load order got me - G_TreeGraph subscribes at load time before the initialization sequence runs. Added proper seeding and safeguards.

## Overview

`w_ancestry_focus` is a Svelte writable store that tracks the currently focused ancestry in the application. It is derived from the `si_recents` history index, which serves as the single source of truth for focus state.

## Initialization Sequence

The initialization of `w_ancestry_focus` follows a specific sequence that ensures `si_recents` is populated before reactive subscriptions are activated.

### Entry Points

Initialization occurs in two main paths:

1. **Hierarchy.wrapUp_data_forUX()** (primary path)
   - Called during hierarchy data assembly
   - Sequence: `restore_fromPreferences()` → `restore_focus()` → `setup_subscriptions()`

2. **DB_Common.hierarchy_setup_fetch_andBuild()** (alternate path)
   - Similar sequence during database setup

### Step-by-Step Flow

#### 1. `restore_fromPreferences()` (`Hierarchy.ts:1725`)
```1725:1731:src/lib/ts/managers/Hierarchy.ts
	restore_fromPreferences() {
		// this.stop_alteration();
		p.restore_grabbed();	// must precede restore_focus (which alters grabbed and expanded)
		p.restore_paging();
		p.restore_expanded();
		p.restore_focus();
	}
```

#### 2. `restore_focus()` (`Preferences.ts:111`)
This method determines which ancestry should be focused and seeds `si_recents`:

```111:145:src/lib/ts/managers/Preferences.ts
	restore_focus() {
		let ancestryToFocus = h?.rootAncestry ?? null;
		if (c.eraseDB > 0) {
			c.eraseDB -= 1;
			// Direct set removed: becomeFocus() below will handle focus setting and add to history
		} else {
			const focusPath = p.readDB_key(this.focus_key) ?? p.readDB_key('focus');
			if (!!focusPath) {
				const focusAncestry = h?.ancestry_remember_createUnique(focusPath) ?? null;
				if (!!focusAncestry) {
					ancestryToFocus = focusAncestry;
				}
			}
		}
		if (!!ancestryToFocus) {
			if (!ancestryToFocus.thing) {
				const lastGrabbedAncestry = x.ancestry_forDetails?.parentAncestry;
				if (!!lastGrabbedAncestry) {
					ancestryToFocus = lastGrabbedAncestry;
				}
			}
			// becomeFocus() will set focus via subscription from si_recents index and add to history
			ancestryToFocus.becomeFocus();
		} else {
			// Ensure si_recents is always seeded, even if ancestryToFocus is null
			// Use rootAncestry as fallback to seed history
			const rootAncestry = h?.rootAncestry;
			if (!!rootAncestry) {
				rootAncestry.becomeFocus();
			}
		}
		x.w_ancestry_focus.subscribe((ancestry: Ancestry) => {
			p.writeDB_key(this.focus_key, !ancestry ? null : ancestry.pathString);
		});
	}
```

**Key behaviors:**
- Defaults to `h.rootAncestry` if no persisted focus path exists
- Attempts to restore focus from database (using `focus_key` or legacy `'focus'` key)
- Validates restored ancestry has a thing; falls back to last grabbed ancestry if invalid
- **Critical**: Always calls `becomeFocus()` to seed `si_recents`, even if `ancestryToFocus` is null (uses `rootAncestry` as fallback)
- Sets up subscription to persist focus changes to database

#### 3. `becomeFocus()` (`UX.ts:128`)
This method adds the ancestry to `si_recents`, which triggers the reactive update:

```128:142:src/lib/ts/managers/UX.ts
	becomeFocus(ancestry: Ancestry): boolean {
		const priorFocus = get(this.w_ancestry_focus);
		const changed = !priorFocus || !ancestry.equals(priorFocus!);
		if (changed) {
			const pair: Identifiable_S_Items_Pair = [ancestry, this.si_grabs];
			this.si_recents.remove_all_beyond_index();
			this.si_recents.push(pair);
			// this.double_check(ancestry);
			x.w_s_alteration.set(null);
			ancestry.expand();
			this.update_ancestry_forDetails();
			hits.recalibrate();
		}
		return changed;
	}
```

**Key behaviors:**
- Creates a pair `[ancestry, si_grabs]` and pushes it to `si_recents`
- Removes all entries beyond current index (truncates forward history)
- The `si_recents.push()` operation updates `si_recents.w_index` and `si_recents.w_items`
- However, `w_ancestry_focus` is NOT updated here directly (it's updated via subscription)

#### 4. `setup_subscriptions()` (`UX.ts:39`)
After `si_recents` is seeded, subscriptions are set up:

```39:71:src/lib/ts/managers/UX.ts
	setup_subscriptions() {
		// Assert that si_recents is seeded before subscriptions are active
		// restore_focus() should have been called first to populate recents
		if (typeof console !== 'undefined' && console.assert) {
			console.assert(
				this.si_recents.length > 0,
				'si_recents should be seeded before setup_subscriptions() is called',
				{ recentsLength: this.si_recents.length }
			);
		}
		
		this.w_ancestry_focus.subscribe((ancestry: Ancestry) => {
			this.update_grabs_forSearch();
			this.update_ancestry_forDetails();
		});
		// keep w_ancestry_focus derived from recents history index
		this.si_recents.w_index.subscribe(() => {
			this.update_focus_from_recents();
		});
		this.si_recents.w_items.subscribe(() => {
			this.update_focus_from_recents();
		});
		databases.w_data_updated.subscribe((count: number) => {
			this.update_grabs_forSearch();
		});
		search.w_s_search.subscribe((state: number | null) => {
			this.update_grabs_forSearch();
		});
		this.si_found.w_index.subscribe((row: number | null) => {
			this.update_grabs_forSearch();
		});
		this.update_grabs_forSearch();
	}
```

**Key subscriptions:**
1. **`w_ancestry_focus.subscribe()`**: Reacts to focus changes, updates grabs and details
2. **`si_recents.w_index.subscribe()`**: Derives focus from recents index changes
3. **`si_recents.w_items.subscribe()`**: Derives focus from recents items changes

#### 5. `update_focus_from_recents()` (`UX.ts:73`)
This private method synchronizes `w_ancestry_focus` from `si_recents`:

```73:80:src/lib/ts/managers/UX.ts
	private update_focus_from_recents() {
		// derive focus ancestry from si_recents index; does not mutate history
		let [focus, _] = this.si_recents.item as [Ancestry, S_Items<Ancestry> | null];
		const current = get(this.w_ancestry_focus) ?? h.rootAncestry;
		if (!focus?.equals(current)) {
			this.w_ancestry_focus.set(focus);
		}
	}
```

**Key behaviors:**
- Extracts ancestry from `si_recents.item[0]` (the current item at index)
- Uses fallback to `h.rootAncestry` if no focus is currently set
- Only updates `w_ancestry_focus` if the ancestry has changed (prevents unnecessary updates)

## Critical Invariants

1. **`si_recents` must be seeded before `setup_subscriptions()` is called**
   - Assertion added at line 43-47 of `UX.ts` to verify this
   - Ensured by `restore_focus()` always calling `becomeFocus()` (with `rootAncestry` fallback)

2. **`w_ancestry_focus` is always derived from `si_recents.index`, never set directly**
   - The subscription from `si_recents.w_index` and `si_recents.w_items` ensures synchronization
   - `becomeFocus()` only manipulates `si_recents`, not `w_ancestry_focus` directly

3. **Initial focus state is established synchronously**
   - `restore_focus()` → `becomeFocus()` → `si_recents.push()` all complete before subscriptions activate
   - The first `update_focus_from_recents()` call happens when subscriptions are set up, ensuring focus is synced

## Timeline

```
1. Hierarchy.wrapUp_data_forUX()
   └─> restore_fromPreferences()
       └─> restore_focus()
           ├─> Determines ancestryToFocus (from DB or rootAncestry)
           └─> ancestryToFocus.becomeFocus()
               └─> si_recents.push([ancestry, si_grabs])
                   └─> si_recents.w_index updates
                       └─> (subscription not yet active, so no reaction)
   └─> setup_subscriptions()
       ├─> Assert si_recents.length > 0 ✓
       ├─> Set up si_recents.w_index subscription
       │   └─> Calls update_focus_from_recents()
       │       └─> w_ancestry_focus.set(focus) ✓
       └─> Set up w_ancestry_focus subscription
           └─> Calls update_grabs_forSearch() and update_ancestry_forDetails()
```

## Edge Cases Handled

1. **No persisted focus path**: Uses `rootAncestry` as default
2. **Invalid restored ancestry (no thing)**: Falls back to last grabbed ancestry
3. **Null ancestryToFocus**: Still seeds `si_recents` using `rootAncestry` fallback
4. **Empty si_recents during subscription**: `update_focus_from_recents()` uses `h.rootAncestry` as fallback

## Broken: Why Tree Graph First Encounters `w_ancestry_focus` as Undefined

The `G_TreeGraph` class encounters `w_ancestry_focus` as `undefined` during its initialization, creating a timing issue that can cause problems if layout is called before focus is properly initialized.

### Root Cause

`G_TreeGraph` is instantiated at **module load time** (not during the initialization sequence):

```107:107:src/lib/ts/geometry/G_TreeGraph.ts
export const g_tree = new G_TreeGraph();
```

When the constructor runs, it immediately subscribes to `w_ancestry_focus`:

```8:14:src/lib/ts/geometry/G_TreeGraph.ts
	constructor() {
		x.w_ancestry_focus.subscribe((focus: Ancestry) => {
			if (!!focus) {
				this.focus = focus;
			}
		});
	}
```

### The Problem Sequence

1. **Module Load Time** (earliest possible moment):
   - `G_TreeGraph.ts` is imported, causing `export const g_tree = new G_TreeGraph()` to execute
   - Constructor runs and calls `x.w_ancestry_focus.subscribe(...)`
   - At this point, `w_ancestry_focus` is initialized as `writable<Ancestry>()`, which has an initial value of `undefined`

2. **Immediate Subscription Fire**:
   - Svelte stores **fire subscriptions immediately** when you call `subscribe()`
   - The callback receives `undefined` as the initial value
   - The `if (!!focus)` check prevents `this.focus` from being set
   - `this.focus` remains in its uninitialized state (declared but not assigned: `focus!: Ancestry`)

3. **Later, During Proper Initialization**:
   - `restore_focus()` → `becomeFocus()` → `setup_subscriptions()` → `update_focus_from_recents()` runs
   - `w_ancestry_focus.set(focus)` is called, triggering the subscription again
   - Now `this.focus` is properly set

### Why This Causes Issues

The `layout()` method has protection against undefined focus:

```16:25:src/lib/ts/geometry/G_TreeGraph.ts
	layout() {
		const rect_ofGraphView = get(g.w_rect_ofGraphView);
		const depth_limit = get(g.w_depth_limit) ?? 1;
		if (!!rect_ofGraphView && !!this.g_focus) {
			this.layout_focus_ofTree(rect_ofGraphView); 
			this.g_focus.layout_each_generation_recursively(depth_limit);
			this.g_focus.layout_each_bidirectional_generation_recursively(depth_limit);
			this.adjust_focus_ofTree(rect_ofGraphView);
		}
	}
```

However, `layout_focus_ofTree()` uses `this.focus` directly without additional null checks:

```87:103:src/lib/ts/geometry/G_TreeGraph.ts
	private layout_focus_ofTree(rect_ofGraphView: Rect) {
		const y_offset = rect_ofGraphView.origin.y;
		const subtree_size = this.focus.size_ofVisibleSubtree;
		const x_offset_ofFirstReveal = (this.focus.thing?.width_ofTitle ?? 0) / 2 - 2;
		const y_offset_ofFirstBranches = (k.height.dot / 2) -(subtree_size.height / 2) - 5;
		const x_offset_ofFirstBranches = -8 - k.height.dot + x_offset_ofFirstReveal;
		const x_offset = (get(show.w_show_details) ? -k.width.details : 0) + 5 + x_offset_ofFirstReveal - (subtree_size.width / 2) - (k.height.dot / 2.5);
		const origin_ofFocusReveal = rect_ofGraphView.center.offsetByXY(x_offset, -y_offset);
		if (c.device_isMobile) {
			origin_ofFocusReveal.x = 25;
		}
		// need this for laying out branches, but it is wrong for final positioning
		// TODO: dunno why, must fix
		if (!!this.g_focus) {
			this.g_focus.origin_ofWidget = origin_ofFocusReveal.offsetByXY(x_offset_ofFirstBranches, y_offset_ofFirstBranches);
		}
	}
```

While the `!!this.g_focus` check on line 19 of `layout()` should prevent `layout_focus_ofTree()` from being called when focus is undefined, there's a potential race condition:

- If `g.layout()` is called **before** `w_ancestry_focus` is properly initialized (i.e., before `restore_focus()` completes)
- And `this.g_focus` somehow evaluates to truthy (e.g., if `g_widget` exists but `this.focus` is still undefined)
- Then `layout_focus_ofTree()` would access `this.focus.size_ofVisibleSubtree` on line 89, causing a runtime error

### The Real Issue

The subscription handler only sets `this.focus` when it receives a truthy value. This means:
- On first subscription fire (with `undefined`), `this.focus` remains uninitialized
- There's a window where `layout()` could be called before the second subscription fire (when focus is actually set)
- TypeScript's `focus!: Ancestry` declaration doesn't guarantee the value is defined at runtime

### Potential Solutions

1. **Initialize `this.focus` in constructor with current store value**:
   ```typescript
   constructor() {
       this.focus = get(x.w_ancestry_focus) ?? h?.rootAncestry;
       x.w_ancestry_focus.subscribe((focus: Ancestry) => {
           if (!!focus) {
               this.focus = focus;
           }
       });
   }
   ```

2. **Use `get()` in the subscription to handle initial undefined**:
   ```typescript
   constructor() {
       x.w_ancestry_focus.subscribe((focus: Ancestry) => {
           this.focus = focus ?? h?.rootAncestry ?? get(x.w_ancestry_focus);
       });
   }
   ```

3. **Add defensive checks in `layout_focus_ofTree()`** (current approach relies on `!!this.g_focus` check, which may not be sufficient in all cases)

The current code appears to work because `layout()` is typically called after initialization completes, but the undefined state creates a fragile initialization window.

## Can `w_ancestry_focus` Be Converted to a Derived Store?

**Short answer: Yes, with some considerations.**

### Current Implementation

Currently, `w_ancestry_focus` is a `writable<Ancestry>()` that's manually synchronized via subscriptions:

```73:80:src/lib/ts/managers/UX.ts
	private update_focus_from_recents() {
		// derive focus ancestry from si_recents index; does not mutate history
		let [focus, _] = this.si_recents.item as [Ancestry, S_Items<Ancestry> | null];
		const current = get(this.w_ancestry_focus) ?? h.rootAncestry;
		if (!focus?.equals(current)) {
			this.w_ancestry_focus.set(focus);
		}
	}
```

This method:
1. Extracts focus from `si_recents.item` (which depends on `si_recents.w_items` and `si_recents.w_index`)
2. Uses `h.rootAncestry` as fallback if focus is undefined
3. Only updates if the ancestry has changed (using `.equals()` check)

### Proposed Derived Store Implementation

`w_ancestry_focus` could be converted to a derived store that automatically updates when `si_recents.w_items` or `si_recents.w_index` change:

```typescript
import { derived } from 'svelte/store';

// In S_UX class:
w_ancestry_focus = derived(
	[this.si_recents.w_items, this.si_recents.w_index],
	([items, index], set) => {
		const pair = items[index] as Identifiable_S_Items_Pair | undefined;
		const focus = pair?.[0] as Ancestry | undefined;
		set(focus ?? h?.rootAncestry);
	},
	h?.rootAncestry // initial value
);
```

### Benefits

1. **Eliminates manual subscription management**: No need for `update_focus_from_recents()` or subscriptions to `si_recents.w_index`/`si_recents.w_items`
2. **Explicit derivation**: Makes the dependency on `si_recents` clear and automatic
3. **Reduces code complexity**: Removes the `update_focus_from_recents()` method entirely
4. **Prevents bugs**: Can't forget to update focus when recents change
5. **Fixes initialization timing**: Derived stores handle initial values correctly, potentially solving the `G_TreeGraph` undefined issue

### Challenges & Considerations

1. **Initial value timing**: 
   - Derived stores need an initial value, but `h.rootAncestry` may not exist when the store is created
   - Could use `undefined` initially and handle in subscribers, or use a `Readable<Ancestry | undefined>`

2. **Equality checking**:
   - Current implementation uses `focus?.equals(current)` to avoid unnecessary updates
   - Derived stores use reference equality by default
   - Since `becomeFocus()` reuses the same ancestry object reference (doesn't create new ones), this should work fine
   - However, if the ancestry object is replaced (same value, different reference), derived store would fire unnecessarily

3. **Initialization sequence**:
   - Current code explicitly calls `update_focus_from_recents()` during `setup_subscriptions()` to sync state
   - With derived store, this happens automatically, but timing of when subscriptions are set up matters
   - Need to ensure `si_recents` is seeded before any code subscribes to `w_ancestry_focus`

4. **Store type**:
   - Currently: `writable<Ancestry>()` (can be set, though it shouldn't be)
   - Would become: `Readable<Ancestry | undefined>` or `Readable<Ancestry>` with fallback
   - This prevents accidental direct sets (which is good, since focus should only come from recents)

5. **Fallback handling**:
   - The `?? h?.rootAncestry` fallback in the derived function would need to handle the case where `h` is not yet initialized
   - May need to use a getter function or handle undefined gracefully

### Recommended Approach

**Yes, convert to derived store**, but with careful handling:

```typescript
w_ancestry_focus = derived(
	[this.si_recents.w_items, this.si_recents.w_index],
	([items, index]) => {
		if (items.length === 0) {
			return h?.rootAncestry; // fallback during initialization
		}
		const pair = items[index] as Identifiable_S_Items_Pair | undefined;
		const focus = pair?.[0] as Ancestry | undefined;
		return focus ?? h?.rootAncestry;
	}
) as Readable<Ancestry | undefined>;
```

**Changes required:**
1. Remove `update_focus_from_recents()` method
2. Remove subscriptions to `si_recents.w_index` and `si_recents.w_items` from `setup_subscriptions()`
3. Update type from `writable<Ancestry>()` to `Readable<Ancestry | undefined>`
4. Handle `undefined` case in all subscribers (or use `?? h.rootAncestry` pattern)
5. Update `Preferences.restore_focus()` subscription - it can still subscribe to derived store, but can't write to it

**This conversion would:**
- Simplify the codebase (remove ~10 lines of subscription management)
- Fix the `G_TreeGraph` undefined issue (derived stores handle initial state better)
- Make the derivation explicit and maintainable
- Prevent accidental direct sets (type safety)

## Related Files

- `src/lib/ts/managers/UX.ts` - Store definition and subscription setup
- `src/lib/ts/managers/Preferences.ts` - Focus restoration logic
- `src/lib/ts/managers/Hierarchy.ts` - Initialization orchestration
- `src/lib/ts/runtime/Ancestry.ts` - `becomeFocus()` method delegation
- `src/lib/ts/tests/UX_initialization.test.ts` - Initialization verification tests
- `src/lib/ts/geometry/G_TreeGraph.ts` - Tree graph that subscribes to focus at module load time

