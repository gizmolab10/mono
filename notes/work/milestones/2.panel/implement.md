# Panel

## Implement using industry best practices

I am keen to avoid the newbie pitfalls that the webseriously code suffers from. Before proceeding, I want us to be well up to speed on industry best advice for Svelte and gl.

## Tasks

- [x] research the svelte community and docs ✅
	- [x] write a short list of the most important points made ✅
- [x] implement panel, empty but with boilerplate ✅
	- [x] write milestones/2.panel/architecture.md ✅
		- [x] describe what you built ✅
		- [x] include all class names ✅
		- [x] diagram of the layout ✅
		- [x] identifying each class ✅
	- [ ] work with me to mold it as needed
		- [ ] specify position and sticky edges
	- [ ] I will then choose the next component
- [ ] implement it and incorporate it into panel
	- [ ] rinse and repeat until

---

## Svelte 5 Best Practices (Research Summary)

### Runes — The New Reactivity Model

| Rune | Purpose | Replaces |
|------|---------|----------|
| `$state()` | Mutable reactive state | `let x = 0` at top level |
| `$derived()` | Computed values (memoized) | `$: x = y * 2` |
| `$effect()` | Side effects (browser only) | `$: { doSomething() }` |
| `$props()` | Component props | `export let prop` |
| `$bindable()` | Two-way binding props | `export let value` with `bind:` |

**Key insight**: `$derived` for computing values (pure), `$effect` for actions (impure). Never use `$effect` when `$derived` will do.

### Props & TypeScript

```typescript
// Svelte 5 typed props
let { 
	width, 
	height = 100,
	children 
}: { 
	width: number; 
	height?: number;
	children?: Snippet;
} = $props();
```

### Snippets Replace Slots

Slots are deprecated. Use snippets + `{@render}`:

```svelte
<!-- Parent -->
<Box>
	{#snippet header()}
		<h1>Title</h1>
	{/snippet}
</Box>

<!-- Child (Box.svelte) -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	let { children, header }: { 
		children?: Snippet; 
		header?: Snippet;
	} = $props();
</script>

{@render header?.()}
<div class="content">
	{@render children?.()}
</div>
```

### Event Handlers

- Use native DOM attributes: `onclick`, `oninput` (not `on:click`)
- Pass callback props instead of `createEventDispatcher`

### Shared State

For state across components, use `.svelte.ts` files:

```typescript
// state.svelte.ts
export const appState = $state({
	count: 0,
	user: null
});
```

### Component Structure (Order)

1. `<script lang="ts">` — imports, props, state, derived, effects, functions
2. Template markup
3. `<style>` (if needed)

### Performance Tips

- Runes track dependencies at runtime (more reliable than Svelte 4)
- `$derived` is memoized — only recalculates when dependencies change
- Smaller bundles (15-30% reduction over Svelte 4)
- No virtual DOM — compiles to direct DOM manipulation

### Avoid

- Don't mutate state inside `$derived` (infinite loop)
- Don't use `$effect` for derived values
- Don't use `<svelte:component>` in runes mode (deprecated)
- Stores still work but aren't necessary — prefer runes

---

## First set of components

These seven components will form the backbone of the UX.

### Layout/Structure
| Component           | Purpose                                                                                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Panel.svelte`      | Main container — orchestrates everything. Routes between normal view, BuildNotes, Import, Preview. Houses Primary_Controls, Details, Secondary_Controls, and the graph area. |
| `Box.svelte`        | Bordered container with Separators on all four sides. Uses slots for content.                                                                                                |
| `Separator.svelte`  | Visual dividers with optional gull wings, titles, and thin divider lines. Horizontal or vertical.                                                                            |
| `Gull_Wings.svelte` | Decorative curved corners for separators.                                                                                                                                    |
| `Details.svelte`    | Empty                                                                                                                                                                        |
| `Controls.svelte`   | Empty                                                                                                                                                                        |
| `Graph.svelte`      | Empty                                                                                                                                                                        |

---

## Work Performed

### Panel.svelte — Initial Implementation

Created `src/lib/svelte/layout/Panel.svelte` using Svelte 5 best practices:

**Features:**
- Full viewport coverage with reactive window sizing
- Three-region layout: controls (top), graph (main), details (right)
- Snippets for content injection (not deprecated slots)
- Typed props with TypeScript
- CSS custom properties for theming

**Architecture:**
```
Panel
├── controls region (top bar, 48px)
├── main
│   ├── graph region (fills remaining space)
│   └── details region (280px right sidebar)
└── children fallback
```

**Svelte 5 patterns used:**
- `$state()` for width/height
- `$derived()` for computed regions
- `$props()` with TypeScript interface
- `{@render snippet?.()}` for content
- Native `onresize` handler

**Files created/modified:**
- `src/lib/svelte/layout/Panel.svelte` — new
- `src/App.svelte` — updated to use Panel

**Next:** Run `yarn dev` to verify, then iterate on layout/styling as needed.
