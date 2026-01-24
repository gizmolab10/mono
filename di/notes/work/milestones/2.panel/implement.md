# Panel

## Implement using industry best practices

I am keen to avoid the newbie pitfalls that the webseriously code suffers from. Before proceeding, I want us to be well up to speed on industry best advice for Svelte and gl.

I also want us to write a design description file for each component we create. Place that file in notes/designs, and keep it up to date.

## Tasks

- [x] research the svelte community and docs ✅
  - [x] write a short list of the most important points made ✅
- [x] implement panel, empty but with boilerplate ✅
  - [x] write milestones/2.panel/architecture.md ✅
    - [x] describe what you built ✅
    - [x] include all class names ✅
    - [x] diagram of the layout ✅
    - [x] identifying each class ✅
  - [x] work with me to mold it as needed
    - [x] specify position and sticky edges
  - [x] Graph, Details, Controls
  - [x] Separator
  - [x] Fillets
  - [x] Box
  - [x] Preferences.ts
  - [x] incorporate Box and Separator into Main
- [x] rinse and repeat until I am happy with it ✅


---

## Svelte 5 Best Practices (Research Summary)

### Runes — The New Reactivity Model

| Rune | Purpose | Replaces |
|----|----|----|
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

* Use native DOM attributes: `onclick`, `oninput` (not `on:click`)
* Pass callback props instead of `createEventDispatcher`

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

* Runes track dependencies at runtime (more reliable than Svelte 4)
* `$derived` is memoized — only recalculates when dependencies change
* Smaller bundles (15-30% reduction over Svelte 4)
* No virtual DOM — compiles to direct DOM manipulation

### Avoid

* Don't mutate state inside `$derived` (infinite loop)
* Don't use `$effect` for derived values
* Don't use `<svelte:component>` in runes mode (deprecated)
* Stores still work but aren't necessary — prefer runes


---

## First set of components

These seven components form the backbone of the UX.

### Layout/Structure

| Component | Purpose |
|----|----|
| `Main.svelte` | Root layout — orchestrates regions with Box container |
| `Box.svelte` | Bordered container with Separators on all four sides |
| `Separator.svelte` | Visual dividers with optional fillets and titles |
| `Fillets.svelte` | Decorative curved corners for separators |
| `Details.svelte` | Left sidebar region |
| `Controls.svelte` | Top toolbar region |
| `Graph.svelte` | Main canvas region |
