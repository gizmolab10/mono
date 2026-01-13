# Migrating to Svelte 5

How to upgrade from Svelte 4 to 5. The runes are coming. Reactivity works completely differently. This is going to be a project.

## Table of Contents
- [Why Upgrade](#why-upgrade)
- [What Changes](#what-changes)
- [Breaking Changes](#breaking-changes)
- [Migration Strategy](#migration-strategy)
- [Pattern Conversions](#pattern-conversions)
- [Component Examples](#component-examples)
- [Rollout Plan](#rollout-plan)

## Why Upgrade

Svelte 5 fixes a lot of weirdness:
- No more implicit reactivity (explicit `$state()` instead)
- No more `$:` reactive statements (use `$derived()` instead)
- Better TypeScript support
- Faster compilation
- More predictable behavior

But it's a breaking change. Can't just update package.json and ship.

## What Changes

### Component State

**Svelte 4:**
```svelte
<script>
let count = 0;
</script>

<button on:click={() => count += 1}>
  {count}
</button>
```

**Svelte 5:**
```svelte
<script>
let count = $state(0);
</script>

<button onclick={() => count += 1}>
  {count}
</button>
```

State is explicit now. Use `$state()` rune.

### Derived Values

**Svelte 4:**
```svelte
<script>
let count = 0;
$: doubled = count * 2;
</script>
```

**Svelte 5:**
```svelte
<script>
let count = $state(0);
let doubled = $derived(count * 2);
</script>
```

No more `$:` for derived values. Use `$derived()` rune.

### Reactive Blocks

**Svelte 4:**
```svelte
<script>
let count = 0;

$: {
  console.log('count changed:', count);
  update();
}
</script>
```

**Svelte 5:**
```svelte
<script>
let count = $state(0);

$effect(() => {
  console.log('count changed:', count);
  update();
});
</script>
```

Side effects use `$effect()` rune. Runs when dependencies change.

### Props

**Svelte 4:**
```svelte
<script>
export let title;
export let count = 0;
</script>
```

**Svelte 5:**
```svelte
<script>
let { title, count = 0 } = $props();
</script>
```

Props destructured from `$props()` rune.

### Two-way Binding

**Svelte 4:**
```svelte
<!-- Parent -->
<Child bind:value />

<!-- Child -->
<script>
export let value;
</script>
```

**Svelte 5:**
```svelte
<!-- Parent -->
<Child bind:value />

<!-- Child -->
<script>
let { value = $bindable() } = $props();
</script>
```

Bindable props must use `$bindable()` rune.

### Event Handlers

**Svelte 4:**
```svelte
<button on:click={handleClick}>
```

**Svelte 5:**
```svelte
<button onclick={handleClick}>
```

No more `on:` directive. Use lowercase native event names.

### Stores

**Svelte 4:**
```svelte
<script>
import { writable } from 'svelte/store';
const count = writable(0);
</script>

<button on:click={() => $count += 1}>
  {$count}
</button>
```

**Svelte 5:**
```svelte
<script>
import { writable } from 'svelte/store';
const count = writable(0);
</script>

<button onclick={() => $count += 1}>
  {$count}
</button>
```

Stores still work the same way! The `$` prefix still auto-subscribes. This is good news.

## Breaking Changes

### No More Implicit Reactivity

Top-level `let` is NOT reactive in Svelte 5:
```svelte
<script>
let count = 0;  // NOT REACTIVE in Svelte 5
</script>
```

Must use `$state()`:
```svelte
<script>
let count = $state(0);  // Reactive
</script>
```

### No More `$:` Labels

Reactive statements gone:
```svelte
<script>
$: doubled = count * 2;  // INVALID in Svelte 5
</script>
```

Use `$derived()` or `$effect()`:
```svelte
<script>
let doubled = $derived(count * 2);
// or
$effect(() => {
  console.log(count);
});
</script>
```

### Event Handlers Changed

```svelte
<!-- Svelte 4 -->
<button on:click={fn} on:keydown={fn}>

<!-- Svelte 5 -->
<button onclick={fn} onkeydown={fn}>
```

All event handlers use native names without `on:` prefix.

### Component Events Changed

**Svelte 4:**
```svelte
<!-- Child -->
<script>
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();
</script>
<button on:click={() => dispatch('save', data)}>

<!-- Parent -->
<Child on:save={handleSave} />
```

**Svelte 5:**
```svelte
<!-- Child -->
<script>
let { onsave } = $props();
</script>
<button onclick={() => onsave?.(data)}>

<!-- Parent -->
<Child onsave={handleSave} />
```

Component events are just callback props now.

### Lifecycle Hooks

Most stay the same, but `beforeUpdate` and `afterUpdate` are gone:
```svelte
// Svelte 4
beforeUpdate(() => {...});
afterUpdate(() => {...});

// Svelte 5 - use $effect with pre/post phases
$effect.pre(() => {...});
$effect(() => {...});
```

## Migration Strategy

### Phase 1: Audit

Count how many components we have:
```bash
find src/lib/svelte -name "*.svelte" | wc -l
```

Grep for patterns that need changing:
```bash
grep -r "export let" src/lib/svelte --include="*.svelte" | wc -l  # Props
grep -r "^\s*let " src/lib/svelte --include="*.svelte" | wc -l    # State
grep -r "\$:" src/lib/svelte --include="*.svelte" | wc -l         # Reactive
grep -r "on:" src/lib/svelte --include="*.svelte" | wc -l         # Events
```

Document the scope. How many files? Which patterns are most common?

### Phase 2: Update Dependencies

```bash
npm install svelte@5
npm install @sveltejs/kit@latest
npm install @sveltejs/vite-plugin-svelte@latest
```

Check peer dependencies. Some packages might not support Svelte 5 yet.

### Phase 3: Enable Legacy Mode

Svelte 5 has a legacy compatibility mode:
```js
// vite.config.js
export default {
  plugins: [
    svelte({
      compilerOptions: {
        compatibility: {
          componentApi: 4
        }
      }
    })
  ]
}
```

This lets Svelte 4 components run alongside Svelte 5 components.

### Phase 4: Convert Incrementally

Start with leaf components (no children). Work up the tree.

Priority order:
1. Simple presentational components
2. Buttons, inputs, basic controls
3. Complex stateful components
4. Parent/container components
5. Root layout components

Test after each conversion. Don't batch too many changes.

### Phase 5: Remove Legacy Mode

Once all components converted, remove compatibility mode:
```js
// vite.config.js - remove this
compatibility: {
  componentApi: 4
}
```

Test everything. Ship it.

## Pattern Conversions

### Our Manual Trigger Pattern

**Svelte 4:**
```svelte
<script>
let trigger = 0;

$: {
  const _ = `${$store1}:::${$store2}`;
  update();
}

function update() {
  // ... recalculate ...
  trigger = someValue;
}
</script>

{#key trigger}
  <div>...</div>
{/key}
```

**Svelte 5:**
```svelte
<script>
let trigger = $state(0);

$effect(() => {
  // Access stores to track them
  $store1;
  $store2;
  update();
});

function update() {
  // ... recalculate ...
  trigger = someValue;
}
</script>

{#key trigger}
  <div>...</div>
{/key}
```

The `{#key}` block still works! Just need to make trigger reactive with `$state()`.

### Store Destructuring

**Svelte 4:**
```svelte
<script>
const { w_t_breadcrumbs } = show;
const { w_ancestry_focus } = x;
</script>
```

**Svelte 5:**
```svelte
<script>
const { w_t_breadcrumbs } = show;
const { w_ancestry_focus } = x;
</script>
```

No change! Store destructuring still works. The `$` prefix still works.

### Reactive Dependency Tracking

**Svelte 4:**
```svelte
<script>
$: {
  const _ = `${$w_grabbed}:::${$w_ancestry_focus}`;
  update();
}
</script>
```

**Svelte 5:**
```svelte
<script>
$effect(() => {
  // Just access the stores, don't need the string trick
  $w_grabbed;
  $w_ancestry_focus;
  update();
});
</script>
```

Can simplify! Just access the variables. `$effect()` automatically tracks dependencies.

## Component Examples

### Simple Button

**Svelte 4:**
```svelte
<script>
export let text = 'Click me';
export let onClick = () => {};
let isHovered = false;
</script>

<button 
  on:click={onClick}
  on:mouseenter={() => isHovered = true}
  on:mouseleave={() => isHovered = false}>
  {text}
</button>
```

**Svelte 5:**
```svelte
<script>
let { text = 'Click me', onclick } = $props();
let isHovered = $state(false);
</script>

<button 
  {onclick}
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}>
  {text}
</button>
```

Changes:
- `export let` → `$props()`
- `let isHovered` → `$state()`
- `on:` → native event names
- `onClick` prop → `onclick` (lowercase)

### Breadcrumbs Component

**Svelte 4:**
```svelte
<script>
export let width = g.windowSize.width;
export let centered = false;
let crumb_ancestries = [];
let trigger = 0;

$: {
  const _ = `${$w_grabbed}:::${$w_ancestry_focus}`;
  update();
}

function update() {
  [crumb_ancestries, widths, lefts] = g.layout_breadcrumbs(...);
  trigger = encoded_counts * 10000 + reattachments * 100;
}
</script>

{#key trigger}
  <div>...</div>
{/key}
```

**Svelte 5:**
```svelte
<script>
let { width = g.windowSize.width, centered = false } = $props();
let crumb_ancestries = $state([]);
let trigger = $state(0);

$effect(() => {
  $w_grabbed;
  $w_ancestry_focus;
  update();
});

function update() {
  [crumb_ancestries, widths, lefts] = g.layout_breadcrumbs(...);
  trigger = encoded_counts * 10000 + reattachments * 100;
}
</script>

{#key trigger}
  <div>...</div>
{/key}
```

Changes:
- `export let` → `$props()`
- `let crumb_ancestries` → `$state()`
- `let trigger` → `$state()`
- `$:` reactive block → `$effect()`

### Banner_Hideable

**Svelte 4:**
```svelte
<script>
export let t_detail;
let hideable_isVisible = true;

$: { 
  const _ = $w_t_details;
  update_hideable_isVisible();
}

function update_hideable_isVisible() {
  let isVisible = $w_t_details?.includes(T_Detail[t_detail]) ?? false;
  if (isVisible != hideable_isVisible) {
    hideable_isVisible = isVisible;
  }
}
</script>
```

**Svelte 5:**
```svelte
<script>
let { t_detail } = $props();
let hideable_isVisible = $state(true);

$effect(() => {
  $w_t_details;
  update_hideable_isVisible();
});

function update_hideable_isVisible() {
  let isVisible = $w_t_details?.includes(T_Detail[t_detail]) ?? false;
  if (isVisible != hideable_isVisible) {
    hideable_isVisible = isVisible;
  }
}
</script>
```

Or better, use `$derived()`:
```svelte
<script>
let { t_detail } = $props();
let hideable_isVisible = $derived(
  $w_t_details?.includes(T_Detail[t_detail]) ?? false
);
</script>
```

No more manual updates! `$derived()` handles it automatically.

## Rollout Plan

### Week 1: Preparation
- [x] Document current patterns
- [ ] Audit component count
- [ ] Update dependencies
- [ ] Enable legacy mode
- [ ] Set up test plan

### Week 2-3: Leaf Components
- [ ] Convert simple components (50+ files?)
- [ ] Test each conversion
- [ ] Document issues

### Week 4-5: Middle Layer
- [ ] Convert complex stateful components
- [ ] Update parent components as needed
- [ ] Integration testing

### Week 6: Root Components
- [ ] Convert layout components
- [ ] Convert Primary_Controls
- [ ] Full app testing

### Week 7: Cleanup
- [ ] Remove legacy compatibility mode
- [ ] Fix any remaining issues
- [ ] Performance testing
- [ ] Ship it

## Gotchas

### Store Reactivity

Stores work the same, but if you manually subscribe:
```svelte
// Svelte 4 & 5 - both work
const unsubscribe = store.subscribe(value => {
  console.log(value);
});
```

The `$` prefix is just sugar. Still auto-unsubscribes on unmount.

### TypeScript

Props need explicit types:
```svelte
<script lang="ts">
let { 
  title,
  count = 0 
}: { 
  title: string;
  count?: number;
} = $props();
</script>
```

### Nested Reactivity

Still need to reassign for nested changes:
```svelte
let user = $state({ name: 'Jonathan' });

// WRONG
user.name = 'Jon';  // Doesn't trigger re-render

// RIGHT
user = { ...user, name: 'Jon' };
```

Arrays and objects still need reassignment. Svelte 5 doesn't fix this.

### Effects Run Twice

`$effect()` runs twice in dev mode (like React):
```svelte
$effect(() => {
  console.log('This logs twice!');
  return () => console.log('Cleanup');
});
```

First run: setup
Second run: cleanup + setup

This is intentional. Helps catch bugs. Only happens in dev.

## Resources

- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/runes)
- [SvelteKit 2 Docs](https://kit.svelte.dev/docs)

## Summary

Svelte 5 is a major upgrade. Explicit state, explicit reactivity, explicit everything.

**Main changes:**
- `let` → `$state()`
- `$:` → `$derived()` or `$effect()`
- `export let` → `$props()`
- `on:` → native event names
- Component events → callback props

**What stays the same:**
- Stores still work
- `$` prefix still works
- `{#key}` still works
- Lifecycle hooks mostly the same

**Migration strategy:**
- Enable legacy mode
- Convert incrementally
- Test constantly
- Remove legacy mode
- Ship it

This is doable. But it's a lot of components. Budget a month or two.

## Second Thoughts

A month or two of work. Gack!

And the amount of syntactic sugar goes sky high. All that work just to make reactivity "more explicit" - which really means more verbose.

The `$state()` and `$props()` wrappers everywhere, `$effect()` instead of clean `$:` blocks... it's a lot of ceremony for something that mostly worked fine before.

And for what? So TypeScript is happier? So reactivity is "more predictable"? We've got 100+ Svelte files. That's a LOT of repetitive mechanical changes.

The kicker: stores still work the old way. So we're mixing paradigms - old store subscriptions with new rune syntax. More cognitive load.

Maybe we just... don't upgrade? Svelte 4 isn't going anywhere soon. Unless there's a killer feature in 5 that actually solves a problem we have, might be better to stay put.

**Decision: Not upgrade for now.**

When Svelte 4 becomes unmaintained or some critical dependency forces our hand, we'll revisit. Until then, this document stays as a reference for "what if."
