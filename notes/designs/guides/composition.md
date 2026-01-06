# Component Composition in Svelte 5

Props-down, events-up. Slots for flexible content. Compound components for complex UIs. i wanted to document the pattern and see where we could use it better.

## Table of Contents
- [Svelte Composition Patterns](#svelte-composition-patterns)
  - [Key Principles](#key-principles)
  - [Props Best Practices](#props-best-practices)
  - [State Management](#state-management)
  - [Composition Strategies](#composition-strategies)
- [Downside](#downside)
- [Summary](#summary)

## Svelte Composition Patterns

### Key Principles

Based on Svelte 5 best practices:

1. **Props down, events up**: Parent components pass data via props, children emit events to communicate back
2. **Component composition over prop soup**: Break complex components into smaller composable pieces instead of adding endless props
3. **Slots for flexibility**: Use slots when you need the consumer to control markup/layout
4. **$state() for internal, $props() for external**: Component owns its own state, receives props from parent
5. **Default values in destructuring**: `let { name = "default" } = $props()` provides fallbacks

### Props Best Practices

**Use $props() rune:**
```typescript
let { title, count = 0, onClick } = $props();
```

**Type your props:**
```typescript
let { title, count = 0 }: { title: string; count?: number } = $props();
```

**Two-way binding with $bindable():**
```typescript
let { value = $bindable(0) } = $props();
```

### State Management

**Internal state with $state():**
```svelte
<script lang='ts'>
	let count = $state(0);
	let items = $state<string[]>([]);
</script>
```

**Derived values with $derived():**
```svelte
<script lang='ts'>
	let count = $state(0);
	let doubled = $derived(count * 2);
	let isEven = $derived(count % 2 === 0);
</script>
```

**Side effects with $effect():**
```svelte
<script lang='ts'>
	let count = $state(0);
	
	$effect(() => {
		console.log(`count changed to ${count}`);
	});
</script>
```

**Event handlers (lowercase, no colon):**
```svelte
<button onclick={handleClick}>Click</button>
<input oninput={handleInput} />
```

### Composition Strategies

**Bad - Prop soup:**
```svelte
<Card 
  title="..."
  subtitle="..."
  body="..."
  imageUrl="..."
  badgeText="..."
  buttonLabel="..."
  onButtonClick={...} />
```

**Good - Compound components:**
```svelte
<Card>
  <CardHeader title="..." subtitle="..." />
  <CardImage src="..." />
  <CardBody>{content}</CardBody>
  <CardFooter>
    <Button>Click me</Button>
  </CardFooter>
</Card>
```

**When to refactor**: If a component has 3-4+ props for layout/content, consider breaking into compound components.

## Downside

The design of components sometimes combines concerns. This reduces the number of components, which is important, even at the cost of prop soup and difficulty in testing.

**Why fewer components matters:**

Every component adds overhead - file to navigate, imports to manage, mental model to maintain. Sometimes a fat component with 7-8 props is better than splitting into 4 smaller components.

**Trade-offs i'm willing to make:**
- Prop soup is fine if the component stays under ~200 lines
- Mixed concerns are fine if they're tightly related (e.g., banner + content in Banner_Hideable)
- Harder testing is fine if the component is stable and rarely changes

**When NOT to split:**
- Component is used in exactly one place
- The "sub-components" would never be used independently
- Splitting would create more boilerplate than it removes
- The concerns are tightly coupled (changing one always requires changing the other)

**Composition is a tool, not a religion.**

Use it when it clarifies. Skip it when it adds complexity for no gain.

## Summary

**Svelte 5 runes cheatsheet:**

| Rune | Purpose | Example |
|------|---------|---------|
| `$props()` | Receive props from parent | `let { title } = $props()` |
| `$state()` | Reactive internal state | `let count = $state(0)` |
| `$derived()` | Computed values | `let doubled = $derived(count * 2)` |
| `$effect()` | Side effects | `$effect(() => { ... })` |
| `$bindable()` | Two-way binding | `let { value = $bindable() } = $props()` |

**Key composition takeaways:**

1. Props-down, events-up
2. Use slots for flexible content injection
3. Break up prop soup with compound components
4. But don't over-engineer — composition is a tool, not a religion
