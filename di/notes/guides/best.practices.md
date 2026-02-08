# Best Practices

Svelte 5 patterns and choices for the di project, based on research and implementation experience.

## Runes

| Rune | Purpose | Use When |
|------|---------|----------|
| `$state()` | Mutable reactive state | Component-local values that change |
| `$derived()` | Computed values (memoized) | Values calculated from other state |
| `$effect()` | Side effects (browser only) | DOM manipulation, subscriptions, logging |
| `$props()` | Component props | Receiving data from parent |
| `$bindable()` | Two-way binding props | Forms, input fields |

**Key rule:** Use `$derived` for computing values, `$effect` for actions. Never use `$effect` when `$derived` will do.

## Props with TypeScript

```typescript
let {
	title = 'Default',
	width,
	height = 100
}: {
	title?: string;
	width: number;
	height?: number;
} = $props();
```

## Event Handlers

Use native DOM attributes, not Svelte's old `on:` syntax:

```svelte
<!-- ✅ Svelte 5 -->
<button onclick={handleClick}>

<!-- ❌ Old syntax -->
<button on:click={handleClick}>
```

Pass callback props instead of `createEventDispatcher`.

## Snippets vs Slots

Slots are deprecated. Use snippets for content injection:

```svelte
<!-- Parent -->
<Box>
	{#snippet header()}
		<h1>Title</h1>
	{/snippet}
</Box>

<!-- Child -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	let { header }: { header?: Snippet } = $props();
</script>

{@render header?.()}
```

**Our choice:** We tried snippets, then removed them. YAGNI — we weren't reusing the layout with different content. Direct children are simpler.

## Component Structure

Order within a `.svelte` file:

1. `<script lang="ts">` — imports, props, state, derived, effects, functions
2. Template markup
3. `<style>` (if needed)

## Shared State

For state across components, use `.svelte.ts` files:

```typescript
// state.svelte.ts
export const appState = $state({
	count: 0,
	user: null
});
```

**Our choice:** Not yet needed. State lives in Main.svelte for now.

## ResizeObserver over Window Events

For container-relative sizing:

```typescript
onMount(() => {
	const observer = new ResizeObserver((entries) => {
		const { width, height } = entries[0].contentRect;
		// handle resize
	});
	observer.observe(container);
	return () => observer.disconnect();
});
```

**Our choice:** Graph.svelte uses ResizeObserver to size the canvas to its container, not to window dimensions.

## YAGNI Principle

"You Aren't Gonna Need It" — don't build flexibility until you need it.

**Applied:**
- Removed snippet-based Panel in favor of direct children in Main
- No abstract "region" system — just the three regions we actually use
- No configuration props for layout dimensions yet — hardcoded until needed

## Composition Decisions

| Pattern | When to Use | When to Skip |
|---------|-------------|--------------|
| Snippets | Multiple consumers with different content | Single use, known children |
| Separate components | Reusable, testable, complex logic | Simple, single-use markup |
| Props | Configurable behavior | Fixed behavior |

**Our structure:**
```
App.svelte (global styles)
└── Main.svelte (layout + state + children)
    ├── Controls.svelte
    ├── Details.svelte
    └── Graph.svelte
```

No intermediate abstractions. Main owns the layout directly.

## Avoid

- Mutating state inside `$derived` (infinite loop)
- Using `$effect` for derived values
- `<svelte:component>` in runes mode (deprecated)
- Premature abstraction (snippets, generic layouts)
- Calling functions in template expressions that mutate state
