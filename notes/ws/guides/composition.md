# Component Composition in Svelte

Props-down, events-up. Slots for flexible content. Compound components for complex UIs. i wanted to document the pattern and see where we could use it better.

## Table of Contents
- [Svelte Composition Patterns](#svelte-composition-patterns)
  - [Key Principles](#key-principles)
  - [Props Best Practices](#props-best-practices)
  - [Composition Strategies](#composition-strategies)
- [Component Audit Checklist](#component-audit-checklist)
- [Summary](#summary)
- [Downside](#downside)
- [Svelte 4](#svelte-4)

## Svelte Composition Patterns

### Key Principles

Based on Svelte best practices:

1. **Props down, events up**: Parent components pass data via props, children emit events to communicate back
2. **Component composition over prop soup**: Break complex components into smaller composable pieces instead of adding endless props
3. **Slots for flexibility**: Use slots when you need the consumer to control markup/layout
4. **$state() for internal, $props() for external** **(Svelte 5 only)**: Component owns its own state, receives props from parent
5. **Default values in destructuring** **(Svelte 5 only)**: `let { name = "default" } = $props()` provides fallbacks

### Props Best Practices

**Use $props() rune** **(Svelte 5 only)**:
```typescript
let { title, count = 0, onClick } = $props();
```

**Type your props:**
```typescript
let { title, count = 0 }: { title: string; count?: number } = $props();
```

**Avoid prop mutation** unless using `$bindable()` **(Svelte 5 only)**:
```typescript
let { value = $bindable(0) } = $props();  // Two-way binding
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

### Downside

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

**Example: Banner_Hideable**

We could split into:
- `<Banner />` - just the header
- `<HideableContent />` - just the show/hide logic
- `<BannerWithContent />` - composes the two

But why? The banner and content are always used together. The show/hide logic is specific to this pattern. We'd create 3 files instead of 1, and none of them would be reusable elsewhere.

Better to keep it as one component with a slot for customization.

**Composition is a tool, not a religion.**

Use it when it clarifies. Skip it when it adds complexity for no gain.

### Svelte 4

This document references Svelte 5 features that aren't available until we upgrade. Here's what we CAN'T use in Svelte 4:

**Unavailable in Svelte 4:**

1. **`$props()` rune** - Use `export let` instead
   ```svelte
   <!-- Svelte 5 -->
   let { title, count = 0 } = $props();
   
   <!-- Svelte 4 -->
   export let title;
   export let count = 0;
   ```

2. **`$state()` rune** - Use plain `let` instead
   ```svelte
   <!-- Svelte 5 -->
   let count = $state(0);
   
   <!-- Svelte 4 -->
   let count = 0;
   ```

3. **`$derived()` rune** - Use `$:` reactive statements instead
   ```svelte
   <!-- Svelte 5 -->
   let doubled = $derived(count * 2);
   
   <!-- Svelte 4 -->
   $: doubled = count * 2;
   ```

4. **`$bindable()` rune** - Use regular props with manual updates
   ```svelte
   <!-- Svelte 5 -->
   let { value = $bindable() } = $props();
   
   <!-- Svelte 4 -->
   export let value;
   // Parent uses bind:value as usual
   ```

5. **Lowercase event handlers** - Use `on:` directive instead
   ```svelte
   <!-- Svelte 5 -->
   <button onclick={handleClick}>
   
   <!-- Svelte 4 -->
   <button on:click={handleClick}>
   ```

**What DOES work in Svelte 4:**

- ✅ Props-down, events-up pattern
- ✅ Slots (default and named)
- ✅ Component composition
- ✅ `createEventDispatcher()` for component events
- ✅ Reactive statements with `$:`
- ✅ Stores with `$` prefix

**Bottom line:**

All the composition PATTERNS in this document work in Svelte 4. Just ignore the rune syntax examples. Use `export let` for props, `let` for state, and `$:` for derived values.

The principles (slots, compound components, separation of concerns) are the same. Only the syntax differs.

## Component Audit Checklist

Components that could benefit from better composition:

### High Priority - Prop Soup

- [ ] **Primary_Controls.svelte** - Manages ~10 different controls inline; could break into `<Controls.Details />`, `<Controls.Recents />`, `<Controls.Search />` compound pattern
- [ ] **D_Selection.svelte** - Multiple tables (characteristics, relationships, properties); could use `<SelectionTable.Characteristics />` sub-components
- [ ] **Radial_Cluster.svelte** - Handles widgets, paging UI, rotation, all in one file; break into `<Cluster.Widgets />`, `<Cluster.Pager />`, `<Cluster.RotationHandle />`

### Medium Priority - Mode Switching

- [ ] **Breadcrumbs.svelte** - Mode selection embedded (ancestry vs recents); parent should choose mode and pass data
- [ ] **Search_Results.svelte** - Likely mixes result rendering with search state; extract `<SearchResultItem />` component
- [ ] **Widget.svelte** - Handles title, drag, reveal, all together; could compose `<Widget.Title />`, `<Widget.DragHandle />`, `<Widget.RevealToggle />`

### Low Priority - Already Good Composition

- [ ] **Breadcrumb_Button.svelte** - Good! Single responsibility, clear props, used compositionally by parent
- [ ] **Button.svelte** - Good! Reusable, clear interface, used throughout app
- [ ] **Glow_Button.svelte** - Good! Specialized variant with focused purpose

### Slot Opportunities

- [ ] **Banner_Hideable.svelte** - Wraps content; perfect candidate for `<slot />` to let parent control banner content
- [ ] **Card components** (if any exist) - Classic slot use case for header/body/footer
- [ ] **Modal/Dialog** (if exists) - Header, body, footer slots

### Parent-Child Communication

- [ ] **Next_Previous.svelte** - Review event emission pattern; ensure using Svelte 5 event syntax **(Svelte 5 only)**
- [ ] **Segmented.svelte** - Check if using `$bindable()` **(Svelte 5 only)** for two-way binding where appropriate
- [ ] **Triangle_Button.svelte** - Verify props-down, events-up pattern

## Summary

**Key takeaways:**

1. We're already doing composition fairly well (Breadcrumb_Button, Button usage)
2. Biggest wins: break up large components (Primary_Controls, Radial_Cluster)
3. Use slots more for customization (Banner_Hideable, separator overrides)
4. Move mode/data selection to parents; children should receive data via props
5. Embrace `$derived` **(Svelte 5 only)** for computed values instead of manual update() functions

**Next steps:**

1. Start with Breadcrumbs refactor (good learning exercise, medium complexity)
2. Move to Primary_Controls (most impact)
3. Extract compound components for complex UIs
4. Add slots where consumers need customization
5. Document the pattern for future components

