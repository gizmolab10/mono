# Lessons about svelte

One day, I edited some code and later, i ran the app. Ack, i get this cryptic error.

           `if_block.p is not a function`

 I asked AI to investigate, resolve and then summarize.

# Nested `{#if}` Race Conditions

**A store in an `{#if}` clause can create race conditions inside the clause.** When reactive stores change rapidly, nested `{#if}` blocks can be in transitional states (being created/destroyed) while the parent block tries to update them, causing this error:
## Table of Contents
- [Problem: Nested Blocks](#problem-nested-blocks)
- [Solution: Flatten Nested Blocks](#solution-flatten-nested-blocks)
- [Safe Patterns](#safe-patterns)
- [Best Practices](#best-practices)
- [Reference](#reference)
- [Subscription Loops](#subscription-loops)

## Problem: Nested Blocks

Store `$A` is in the outer block, and condition `B` is in the inner block. When `$A` changes rapidly, the inner block can be in a transitional state (being created/destroyed) while the parent block tries to update it. The error really means "if_block is undefined."

**Before (problematic):**
```svelte
{#if !$A}
    {#if B && ancestry.points_right}
        <div class='numerical-count'>...</div>
    {/if}
{:else if !!svgPathFor_tiny_outer_dots}
    <svg>...</svg>
{/if}
```

## Solution: Flatten Nested Blocks

Flattening eliminates parent-child update coordination, allowing Svelte to update one block directly.

**After (fixed):**
```svelte
{#if !$A && B && ancestry.points_right}
    <div class='numerical-count'>...</div>
{:else if $A && !!svgPathFor_tiny_outer_dots}
    <svg>...</svg>
{/if}
```

## Safe Patterns

```svelte
<!-- Single level -->
{#if condition1 && condition2}
    ...
{/if}

<!-- Computed variable -->
<script>
    $: showContent = condition1 && condition2;
</script>
{#if showContent}
    ...
{/if}
```

## Best Practices

1. Flatten nested `{#if}` blocks when stores are involved
2. Use computed variables for complex conditions
3. Test mode switches and rapid state transitions

## Reference

`src/lib/svelte/widget/Widget_Reveal.svelte` (lines 166-198) - triggered when switching to radial mode

# Subscription Loops

**A store subscription that calls a function which sets the same (or related) store causes an infinite loop.**

## Table of Contents
- [Problem: Indirect Reactivity](#problem-indirect-reactivity)
- [Solution: Direct Causation](#solution-direct-causation)
- [Variations](#variations)
- [Best Practices](#best-practices)

## Problem: Indirect Reactivity

Subscription to store A calls function X. Function X sets store A (or store B, which has a subscription that sets A). → Infinite loop.

**Before (problematic):**
```typescript
// In setup():
this.w_s_search.subscribe((state) => {
    if (state !== T_Search.off) {
        this.search_for(text);  // search_for sets w_s_search!
    }
});

// In activate():
this.w_s_search.set(T_Search.enter);  // Triggers subscription → loop
```

The intent was "when search activates, run the search." But the implementation creates a cycle.

## Solution: Direct Causation

When an action needs to trigger behavior, call it directly.

**After (fixed):**
```typescript
// In activate():
show.w_show_search_controls.set(true);
this.search_for(this.search_text);  // Direct call
```

No subscription needed. `activate()` does what it needs to do.

## Variations

### Mutual Recursion

```typescript
search_for(query: string) {
    if (query.length === 0) {
        this.activate();  // activate() calls search_for()!
    }
}

activate() {
    this.search_for(this.search_text);
}
```

**Fix:** Replace `this.activate()` with the specific state change needed.

### Indirect via Related Store

```typescript
// Store A subscription
w_show_search_controls.subscribe(() => {
    g.layout();  // layout() eventually sets w_show_details
});

// Store B subscription  
w_show_details.subscribe(() => {
    // ... which eventually sets w_show_search_controls
});
```

**Fix:** Remove unnecessary subscriptions. Not every store change needs a reactive cascade.

## Best Practices

1. **Subscriptions are for reacting to external changes**, not for triggering side effects from your own actions
2. **If you set a store and want something to happen**, call it directly in the same function
3. **Audit subscription chains** — trace what each subscription calls and what stores those functions set
4. **Transient UI state** (like search visibility) often doesn't need subscriptions at all — just set it directly in activate/deactivate

