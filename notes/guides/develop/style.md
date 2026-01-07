# Style Guide: Codebase Idiosyncrasies

This document comprehensively addresses all idiosyncrasies found in the webseriously codebase. Follow these patterns strictly to maintain consistency.

## Table of Contents
- [Names](#names)
  - [Prefixes](#prefixes)
  - [Variable Naming](#variable-naming)
  - [Function Naming](#function-naming)
  - [Class Naming](#class-naming)
  - [Enum Naming](#enum-naming)
- [Formatting](#formatting)
  - [Indentation](#indentation)
  - [Alignment](#alignment)
  - [Spacing](#spacing)
  - [Quotes](#quotes)
  - [Svelte-Specific Formatting](#svelte-specific-formatting)
  - [Template Styles: Props and Style Attributes](#template-styles-props-and-style-attributes)
  - [Boolean Coercion](#boolean-coercion)
  - [Comments](#comments)
- [Ordering of Variables & Lists/Functions](#ordering-of-variables--listsfunctions)
  - [Length-Based Ordering Principle](#length-based-ordering-principle)
  - [Import Order](#import-order)
  - [Class Property Order](#class-property-order)
  - [Function/Method Order](#functionmethod-order)
  - [Array/List Ordering](#arraylist-ordering)
  - [Enum Value Ordering](#enum-value-ordering)
  - [Case Statement Ordering](#case-statement-ordering)
- [Miscellaneous](#miscellaneous)
  - [Unique Symbols for Getters](#unique-symbols-for-getters)
  - [Writable Store Patterns](#writable-store-patterns)
  - [Type Assertions](#type-assertions)
  - [Equality Operators](#equality-operators)
  - [Optional Chaining](#optional-chaining)
  - [Array Methods](#array-methods)
  - [String Methods](#string-methods)
  - [Object Patterns](#object-patterns)
  - [Async/Await](#asyncawait)
  - [Svelte Reactive Statements](#svelte-reactive-statements)
  - [File Organization](#file-organization)
  - [Constants Usage](#constants-usage)
  - [Manager Instance Access](#manager-instance-access)
  - [Error Handling](#error-handling)
  - [Comments in Code](#comments-in-code)
  - [Svelte Component Structure](#svelte-component-structure)
  - [Type Definitions](#type-definitions)
  - [Generic Types](#generic-types)

## Names

### Prefixes

**Critical**: All prefixes must be followed exactly as specified.

| Prefix | Purpose | Example | Notes |
|--------|---------|---------|-------|
| `T_` | Type/Enum | `T_Graph`, `T_Detail`, `T_Startup` | Always uppercase, used for enums and type identifiers |
| `O_` | Object | `O_Scene` | Data object interfaces |
| `w_` | Writable Store | `w_hierarchy`, `w_ancestry_focus`, `w_t_graph` | Svelte writable stores |
| `S_` | State Class | `S_Alteration`, `S_Widget`, `S_Element` | State management classes |
| `G_` | Geometry | `G_Point`, `G_Rectangle`, `G_Cluster` | Geometry-related classes |
| `k` | Constants | `k.empty`, `k.hashLength`, `k.width.details` | Single lowercase letter, instance of Constants class |
| `h` | Hierarchy | `h.thing_forHID()` | Single lowercase letter, Hierarchy manager instance |
| `s` | Stores | `s.w_thing_title` | Single lowercase letter, global Stores instance |
| `x` | UX | `x.update_grabs_forSearch()` | Single lowercase letter, UX manager instance |
| `g` | Geometry Manager | `g.layout()` | Single lowercase letter, Geometry manager instance |
| `p` | Preferences | `p.read_key()` | Single lowercase letter, Preferences manager instance |
| `u` | Utilities | `u.cumulativeSum()` | Single lowercase letter, Utilities instance |
| `e` | Events | `e.handle_s_mouseFor_t_control()` | Single lowercase letter, Events instance |
| `c` | Configuration | `c.w_device_isMobile` | Single lowercase letter, Configuration instance |

### Variable Naming

- DO NOT USE ABBREVIATIONS OR ACRONYMS (mention exceptions here)
- **snake_case** for most variables: `w_t_cluster_pager`, `w_show_details`, `ancestry_dict_byHID`
- **camelCase** for some specific cases (typically when following external library conventions)
- **Boolean flags**: Use descriptive prefixes:
  - `has_`: `has_zoom_controls`, `has_details_button`, `has_every_detail`
  - `is_`: `isAssembled`, `isShowing_countDots_ofType`
  - `allow_`: `allow_graph_editing`, `allow_tree_mode`, `allow_autoSave`
  - `show_`: `show_details`, `show_related`, `show_other_databases`
- **IDs**: End with `_id` or `ID`: `thing_id`, `ancestryHID`, `rootID`
- **Counts**: Start with `count_`: `count_details`, `count_rebuild`
- **Dictionaries/Maps**: Use pattern `{type}_dict_by{Key}`: `thing_dict_byHID`, `ancestry_dict_byKind_andHID`, `si_relationships_dict_byParentHID`
- **Arrays/Lists**: Use plural nouns: `things`, `relationships`, `predicates`, `ancestries`
- **S_Items collections**: Prefix with `si_`: `si_things`, `si_traits`, `si_tags`, `si_ancestries_dict_byThingHID`

### Function Naming

- **snake_case** for all functions: `thing_remember()`, `ancestry_edit_persistentAddAsChild()`, `restore_preferences()`
- Pattern: `{noun}_{verb}_{modifiers}()`: `thing_forget_all()`, `relationships_translate_idsFromTo_forParents()`
- Getters: Use `get` prefix or property syntax: `get hasRoot()`, `get children_dots()`
- Static methods: Include class name or be clear: `Identifiable.newID()`, `remove_item_byHID()`

### Class and Interface Naming

- **Snake_Case** for `ts` classes: `Search_Node`, `Visibility`, `Hierarchy`
- **State classes**: Prefix with `S_`: `S_Widget`, `S_Element`, `S_Alteration`
- **Geometry classes**: Prefix with `G_`: `G_Point`, `G_Rectangle`, `G_Cluster`
- **Export pattern**: Export singleton instance with lowercase: `export const x = new S_UX(); export const show = new Visibility();`

### Enum Naming

- **PascalCase** with `T_` prefix: `T_Graph`, `T_Detail`, `T_Startup`
- Enum values: **camelCase** or **string literals**: `T_Graph.radial`, `T_Graph.tree`, `T_Thing.generic`

## Formatting

### Indentation

- **Tabs only** (not spaces) for indentation
- Tab width appears to be standard (typically 4 spaces equivalent)

### Alignment

- **Align equals signs** in property declarations, attributes, and props when in a group:
```typescript
w_t_cluster_pager		= writable<T_Cluster_Pager>(T_Cluster_Pager.sliders);
w_t_breadcrumbs			= writable<T_Breadcrumbs>(T_Breadcrumbs.ancestry);
w_t_auto_adjust_graph	= writable<T_Auto_Adjust_Graph | null>(null);
w_show_details			= writable<boolean>(true);
w_show_tiny_dots		= writable<boolean>(true);
```

- Align types and colons when in a group or switch statement and within that, group types together:

![[Screenshot 2026-01-07 at 1.26.15 AM.png]]
### Spacing

- **Single space** after keywords: `if (condition)`, `for (const item of items)`
- **Spaces** around all colons everywhere
- **Spaces around operators**: `a + b`, `x === y`, `flag ? value1 : value2`
- **No space** before commas: `[a, b, c]`, `function(a, b, c)`
- **Space after commas**: `[a, b, c]`, `function(a, b, c)`

### Quotes

- **Single quotes** for strings in TypeScript: `'string'`, `'key'`
- **Single quotes** in Svelte script tags: `<script lang='ts'>`
- **Single quotes** in Svelte style attributes:
```svelte
style='
	position: absolute;
	top: {top}px;
	left: {left}px;
'
```

### Svelte-Specific Formatting

#### Element and Component Structure

- **Opening tag on its own line**, first attribute indented on the next line
- **Align equals signs** with spaces on both sides: `attr = {value}`
- **Closing `>`** stays on the same line as the last attribute (never alone)
- **Self-closing `/>`** may be on its own line

**Elements with content:**
```svelte
<div
	class            = 'controls'
	style:color      = {$w_text_color}
	style:background = {$w_background_color}>
	<h1>{title}</h1>
</div>
```

**Self-closing components:**
```svelte
<Separator
	length       = {innerWidth}
	hasGullWings = {true}
	hasBothWings = {true}
	isHorizontal = {true}
	thickness    = {separatorThickness}
/>
```

**Single-attribute elements:**
```svelte
<div
	class = 'box-middle'>
	...
</div>
```

#### CSS in Style Blocks

- **Align colons** with space on both sides
- **Order by length** (shortest first)

```svelte
<style>
	.controls {
		width       : 100%;
		height      : 100%;
		display     : flex;
		padding     : 0 1rem;
		align-items : center;
		box-sizing  : border-box;
	}

	.controls h1 {
		margin      : 0;
		font-size   : 1.25rem;
		font-weight : 300;
	}
</style>
```

### Template Styles: Props and Style Attributes

#### Component Props Ordering

**Props passed to components** are ordered by **length of prop statement** (shortest first), with aligned equals signs:

```svelte
<Separator
	length       = {width}
	hasGullWings = {true}
	hasBothWings = {true}
	isHorizontal = {true}
	thickness    = {separatorThickness}
/>
```

**Note**: When props are grouped logically (e.g., all boolean flags together), length-based ordering applies within each group.

#### Style Attribute Ordering

**CSS properties** are ordered by **length** (shortest first) with aligned colons:

```svelte
<style>
	.panel {
		top         : 0;
		left        : 0;
		position    : fixed;
		font-family : system-ui, sans-serif;
	}
</style>
```

**Benefits of length-based ordering**:
- Creates visual alignment when using tabs
- Makes it easier to scan and find specific properties
- Maintains consistent formatting across the codebase
- Groups similar-length items together naturally

### Boolean Coercion

- Use `!!` for boolean coercion: `if (!!thing)`, `return !!other && this.id == other.id`
- Use `??` for nullish coalescing: `p.read_key(T_Preference.show_details) ?? false`

### Comments

- **Block comments** for section headers:
```typescript
//////////////////////////////////////////////
//											//
//	reattaches components on/changes to:	//
//											//
//		signal_rebuildGraph					//
//		w_ancestry_focus					//
//											//
//////////////////////////////////////////////
```
- **Inline comments** for clarification: `// NB: hidden until implemented`
- **JSDoc comments** for public APIs with `@param` and `@returns`

## Ordering of Variables & Lists/Functions

### Length-Based Ordering Principle

**Critical**: Items are ordered by **length of statement** (or variable name), not alphabetically. Shorter items come first, longer items come later. This enables visual alignment with tabs and creates a clean, readable hierarchy.

- **Within import statements**: Items are ordered by the length of their identifier
- **Class properties**: Ordered by the length of the variable name
- **Function parameters**: When listed, ordered by length
- **Array elements**: When manually ordered, shorter items first

This pattern allows for tab-based alignment where the `=` signs or other delimiters line up visually, making the code easier to scan and maintain.

### Import Order

**Import statement groups** follow this order (by category):

1. **Geometry classes** (G_*)
2. **State classes** (S_*)
3. **Persistable/Runtime classes** (Thing, Ancestry, etc.)
4. **Type imports from Enumerations** (T_*)
5. **Side-effect imports** (`import './Extensions'`)
6. **Manager instances** (k, g, h, s, u, x, etc.)
7. **Utility imports** (builds, busy, files, etc.)
8. **Type imports** (`import type { Dictionary }`)
9. **External library imports** (`import { get, writable } from 'svelte/store'`)
10. **Local relative imports** (`import { x } from '../managers/UX'`)

**Within each import statement**, items are ordered by **length** (shortest first):

Example:
```typescript
import { T_Graph, T_Detail, T_Kinship, T_Startup, T_Breadcrumbs } from '../common/Global_Imports';
// Ordered by length: T_Graph (7), T_Detail (8), T_Kinship (9), T_Startup (9), T_Breadcrumbs (12)

import { T_Preference, T_Cluster_Pager, T_Auto_Adjust_Graph } from '../common/Global_Imports';
// Ordered by length: T_Preference (12), T_Cluster_Pager (14), T_Auto_Adjust_Graph (18)

import { g, k, p, s, g_graph_tree, features } from '../common/Global_Imports';
// Ordered by length: g (1), k (1), p (1), s (1), g_graph_tree (12), features (8)
```

### Class Property Order

1. **Private dictionaries/maps** (ordered by length of variable name, shortest first)
2. **Public properties** (ordered by length of variable name, shortest first)
3. **Constructor**
4. **Static readonly symbols** (if any, interspersed with related methods)
5. **Getters** (grouped with related functionality)
6. **Methods** (grouped by functionality)

**Property ordering example** (by length):
```typescript
export class Visibility {
	// Properties ordered by length of variable name:
	w_t_graph				= writable<T_Graph>(T_Graph.tree);				// 10 chars
	w_t_details				= writable<Array<T_Detail>>([]);					// 12 chars
	w_t_trees				= writable<Array<T_Kinship>>();					// 10 chars
	w_t_countDots			= writable<Array<T_Kinship>>();					// 14 chars
	w_id_popupView			= writable<string | null>();						// 15 chars
	w_show_details			= writable<boolean>(true);						// 15 chars
	w_show_related			= writable<boolean>(false);						// 16 chars
	w_t_breadcrumbs			= writable<T_Breadcrumbs>(T_Breadcrumbs.ancestry);	// 16 chars
	w_show_tiny_dots		= writable<boolean>(true);						// 17 chars
	w_t_directionals		= writable<boolean[]>([false, true]);				// 17 chars
	w_t_cluster_pager		= writable<T_Cluster_Pager>(T_Cluster_Pager.sliders);	// 19 chars
	w_show_search_controls	= writable<boolean>(false);						// 21 chars
	w_t_auto_adjust_graph	= writable<T_Auto_Adjust_Graph | null>(null);		// 21 chars
	w_show_save_data_button	= writable<boolean>(false);						// 22 chars
	w_show_other_databases	= writable<boolean>(true);						// 23 chars
	debug_cursor			= false;											// 12 chars
}
```

Note: The alignment tabs are used to line up the `=` signs, creating a visual column that makes scanning easier.

Example structure:
```typescript
export class Visibility {
	// Private dictionaries first (ordered by length)
	private thing_dict_byHID: Record<Integer, Thing> = {};
	private si_ancestries_dict_byThingHID: Record<Integer, S_Items<Ancestry>> = {};
	
	// Public properties (ordered by length of variable name)
	w_t_graph				= writable<T_Graph>(T_Graph.tree);
	w_show_details			= writable<boolean>(true);
	w_t_cluster_pager		= writable<T_Cluster_Pager>(T_Cluster_Pager.sliders);
	
	// Constructor
	constructor() {
		// ...
	}
	
	// Getters (ordered by length)
	get children_dots(): boolean { return this.isShowing_countDots_ofType(T_Kinship.children); }
	
	// Methods (ordered by length)
	apply_queryStrings(queryStrings: URLSearchParams) {
		// ...
	}
}
```

### Function/Method Order

1. **Constructor** (always first)
2. **Static methods** (if any)
3. **Getters** (grouped by related functionality, ordered by length of method name within groups)
4. **Core methods** (public API, ordered by length of method name)
5. **Helper/private methods** (internal implementation, ordered by length of method name)

**Note**: Within each category, methods are typically ordered by the length of their name (shortest first), though logical grouping may take precedence for related functionality.

### Array/List Ordering

- **Enum arrays**: Maintain enum definition order when possible
- **Control arrays**: Use numeric keys for explicit ordering (see `left_widths` pattern)
- **Sorted arrays**: Use `.sort()` with explicit comparator when order matters
- **Dictionary keys**: No guaranteed order (use explicit ordering when needed)
- **Manual ordering**: When manually ordering array elements or object properties, order by length (shortest first) unless semantic ordering is required

Example of explicit ordering:
```typescript
const left_widths = {
	0: features.has_details_button ? 18  : -7,	// details
	1: 11,										// recents
	2: features.allow_tree_mode ? 54 : 0,		// graph type
	3: features.has_zoom_controls ? 100 : 34,	// plus
	// ...
};
lefts = u.cumulativeSum(Object.values(left_widths));
```

### Enum Value Ordering

**Enum values** are ordered by **length of the enum key name** (shortest first), unless order is semantically critical or explicitly documented otherwise.

- **Critical enums**: Order matters (documented with comments):
```typescript
// DO NOT change the order of the following
export enum T_Order {
	child,
	other,
}
```

- **Non-critical enums**: Order is unimportant (documented), but still follows length-based ordering:
```typescript
// the order of the following is unimportant
export enum T_Graph {
	radial = 'radial',
	tree   = 'tree',
}
```

- **Length-based ordering example**:
```typescript
export enum T_Search {
	off,		// 3 chars
	enter,		// 5 chars
	results,	// 7 chars
	selected,	// 8 chars
}

export enum T_Action {
	add,		// 3 chars
	show,		// 4 chars
	move,		// 4 chars
	focus,		// 5 chars
	browse,		// 6 chars
	center,		// 6 chars
	delete,		// 6 chars
}
```

**Note**: Enum ordering generally follows length, but may have logical grouping within similar lengths (e.g., related concepts grouped together).

### Case Statement Ordering

**Case statements in switch blocks** are ordered by **length of the case value** (shortest first), enabling visual alignment and easier scanning:

```typescript
switch (name) {
	case 'details':					// 7 chars
		this.w_show_details.set(flag);
		break;
	case 'related':					// 7 chars
		this.w_show_related.set(flag);
		break;
	case 'parents':					// 7 chars
		const mode = flag ? T_Kinship.parents : T_Kinship.children;
		g_graph_tree.set_tree_types([mode]);
		break;
}
```

```typescript
switch (disableOption) {
	case 'search':				// 6 chars
		this.allow_search = false; break;
	case 'details':				// 7 chars
		this.has_details_button = false; break;
	case 'editGraph':			// 9 chars
		this.allow_graph_editing = false; break;
	case 'tree_mode':			// 9 chars
		this.allow_tree_mode = false; break;
	case 'auto_save':			// 9 chars
		this.allow_autoSave = false; break;
	case 'editTitles':			// 10 chars
		this.allow_title_editing = false; break;
	case 'horizontalScrolling':	// 20 chars
		this.allow_h_scrolling = false; break;
}
```

**Note**: When case statements have the same length, they may be grouped logically or ordered alphabetically within that length group.

## Miscellaneous

### Unique Symbols for Getters

Use `static readonly _____NAME: unique symbol;` pattern before getters that need symbol-based identity:

```typescript
static readonly _____ROOT: unique symbol;

get hasRoot(): boolean { return !!this.root; }
```

### Writable Store Patterns

- **Initialize with type**: `writable<T_Graph>(T_Graph.tree)`
- **Nullable types**: `writable<string | null>(null)`
- **Array types**: `writable<Array<T_Detail>>([])`
- **Boolean defaults**: `writable<boolean>(true)` or `writable<boolean>(false)`

### Type Assertions

- Use `as` for type assertions: `types as Array<T_Kinship>`
- Prefer type guards when possible: `if (thing instanceof Thing)`

### Equality Operators

- Use `==` for value equality (TypeScript strict mode handles type coercion)
- Use `===` when explicit type checking is needed
- Use `!=` and `!==` accordingly

### Optional Chaining

- Use `?.` for safe property access: `ancestry?.thing`, `this.root?.id ?? null`
- Use `??` for default values: `p.read_key(T_Preference.show_details) ?? false`

### Array Methods

- Prefer `.map()`, `.filter()`, `.forEach()` over traditional loops when appropriate
- Use `.includes()` for membership checks: `selected.includes(title)`
- Use spread operator for array copying: `[...selected, title]`

### String Methods

- Use custom extensions: `.removeWhiteSpace()`, `.unCamelCase()`, `.hash()`
- Use template literals for multi-line strings
- Use `.join(k.comma)` for comma-separated lists

### Object Patterns

- Use `Object.fromEntries()` for creating objects from arrays
- Use `Object.entries()` for iterating over objects
- Use `Object.values()` when order matters (with numeric keys)

### Async/Await

- Use `async/await` for asynchronous operations
- Use `Promise` patterns when needed
- Handle errors appropriately (check for `NotReadyError` specifically in catch blocks)

### Svelte Reactive Statements

- Use `$:` for reactive statements
- Use descriptive variable names in reactive blocks: `const _ = $w_t_graph;`
- Group related reactive updates together

### File Organization

- **One class per file** (typically)
- **Export singleton instance** at bottom: `export const show = new Visibility();`
- **Type exports** before class exports when in same file

### Constants Usage

- Access via `k` instance: `k.empty`, `k.width.details`, `k.font_size.info`
- Use constants for magic numbers and strings
- Group related constants in objects: `k.thickness.separator.details`

### Manager Instance Access

- Import from `Global_Imports`: `import { g, k, p, s, x } from '../common/Global_Imports'`
- Access properties/methods directly: `g.layout()`, `k.empty`, `s.w_hierarchy`
- Destructure when needed: `const { w_t_graph } = show;`

### Error Handling

- Check for specific error types: `if (error.constructor.name != 'NotReadyError')`
- Log errors with context: `debug.log_draw('message')`
- Use console.warn for non-fatal issues

### Comments in Code

- Use `// NB:` for important notes: `// NB: hidden until implemented`
- Use block comments for section headers (see Formatting section)
- Use JSDoc for public APIs
- Inline comments for complex logic clarification

### Svelte Component Structure

1. `<script lang='ts'>` block
2. Imports
3. Component props (`export let`)
4. Local constants/variables
5. Reactive statements (`$:`)
6. Functions
7. Template
8. `<style>` block (if needed)

### Type Definitions

- Use `type` for aliases: `type Dictionary<K, V> = { [key: K]: V }`
- Use `interface` for object shapes (when extending is needed)
- Use `enum` for fixed sets of values (with `T_` prefix)

### Generic Types

- Use descriptive single letters: `<T>`, `<K, V>`
- Use constraints when needed: `<T extends Identifiable>`
- Use `Array<T>` instead of `T[]` for consistency

### Control Flow

- Do not use short-circuit flow, eg, `if (such is true) return;`

---

## Markdown Files

### Vertical Whitespace

Keep it tight. No excessive gaps.

- Title + metadata on consecutive lines (no blank between)
- Single blank line before `##` sections
- No blank line between heading and its content
- Avoid `---` separators unless marking major divisions
- No multiple consecutive blank lines

**Compact:**
```markdown
# Title
**Timeline:** date | **Status:** in progress

## Goal
What we set out to do.

## What we did
### First thing
Content here.
```

**Too gappy:**
```markdown
# Title

**Timeline:** date
**Status:** in progress

---

## Goal

What we set out to do.

---

## What we did

### First thing

Content here.
```

---

## Links

### Obsidian-Style Wiki Links

Use `[[page]]` syntax for internal links, not markdown `[text](path.md)`. Obsidian is the primary authoring environment—wiki links work natively there. The publishing system handles conversion for other formats.

- ✅ `[[project]]`, `[[svelte]]`
- ❌ `[project](../../designs/architecture/project.md)`

---

**Remember**: Consistency is key. When in doubt, look at existing similar code and match its patterns.

