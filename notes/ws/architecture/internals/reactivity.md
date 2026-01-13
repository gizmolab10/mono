# Svelte 4 State Management

How reactivity works in Svelte 4. Not about stores, not about Svelte 5 runes. Just plain old component state.

## The Problem

i keep seeing confusing patterns in our codebase. Sometimes we use `let`, sometimes `const`, sometimes reactive statements. When does Svelte actually track changes? When do components re-render?

Needed a guide to clarify how Svelte 4 reactivity actually works.

## Svelte 4 Basics

There's no `$state` in Svelte 4. That's Svelte 5. In Svelte 4, reactivity is simpler (and weirder).

### Component State

**Top-level `let` is reactive:**
```svelte
<script>
let count = 0;  // Reactive!
</script>

<button on:click={() => count += 1}>
  {count}
</button>
```

Svelte compiles this and watches `count`. When it changes, the component re-renders.

**Nested properties are NOT reactive:**
```svelte
<script>
let user = { name: 'Jonathan' };

function updateName() {
  user.name = 'Jon';  // Does NOT trigger re-render!
}
</script>
```

Need to reassign the whole object:
```svelte
function updateName() {
  user = { ...user, name: 'Jon' };  // This works
}
```

Or use the assignment trick:
```svelte
function updateName() {
  user.name = 'Jon';
  user = user;  // Force Svelte to notice
}
```

### Props

**Props are reactive inputs:**
```svelte
<script>
export let title;      // Prop
export let count = 0;  // Prop with default
</script>

<h1>{title}</h1>
<p>{count}</p>
```

When parent changes the prop, child re-renders automatically.

**Don't mutate props:**
```svelte
<script>
export let items = [];

// BAD - mutates prop
function addItem(item) {
  items.push(item);
}

// GOOD - create new array
function addItem(item) {
  items = [...items, item];
}
</script>
```

### Reactive Statements

**The magic `$:` label:**
```svelte
<script>
let count = 0;

$: doubled = count * 2;  // Re-runs when count changes
</script>

<p>{count} doubled is {doubled}</p>
```

**Reactive blocks:**
```svelte
<script>
let firstName = 'Jonathan';
let lastName = 'Sand';

$: {
  console.log('Name changed!');
  const fullName = `${firstName} ${lastName}`;
}
</script>
```

**Dependencies are implicit:**
Svelte analyzes your code and tracks what variables you read:
```svelte
$: result = a + b;  // Depends on a and b
```

**The trick we use everywhere:**
```svelte
$: {
  const _ = `${$w_grabbed}:::${$w_ancestry_focus}`;
  update();
}
```

This forces Svelte to track stores by reading them. The `_` variable is thrown away, but Svelte sees the dependencies.

### Stores

**Stores are external reactive values:**
```svelte
<script>
import { writable } from 'svelte/store';

const count = writable(0);

// Subscribe manually
const unsubscribe = count.subscribe(value => {
  console.log(value);
});

// Or use $ prefix (auto-subscribe)
$: console.log($count);
</script>

<button on:click={() => $count += 1}>
  {$count}
</button>
```

The `$` prefix creates an auto-subscription. Svelte unsubscribes when component unmounts.

### When Components Re-render

**Svelte re-renders when:**
1. A reactive variable changes (top-level `let`)
2. A prop changes (parent updates)
3. A store updates (via `$` subscription)
4. A reactive statement's dependencies change

**Svelte does NOT re-render when:**
1. Nested object properties change (unless you reassign)
2. Array methods mutate in place (unless you reassign)
3. You change a `const` variable (impossible anyway)
4. You update DOM directly (don't do this)

## Patterns in Our Codebase

### Pattern 1: Manual Trigger

We use this all over:
```svelte
let trigger = 0;

$: {
  const _ = `${$store1}:::${$store2}`;
  update();
}

function update() {
  // ... recalculate stuff ...
  trigger = someValue;  // Change to force re-render
}
```

Then wrap template in `{#key trigger}`:
```svelte
{#key trigger}
  <div>...</div>
{/key}
```

This forces a complete re-render when trigger changes.

**Why we do this:** Sometimes child components have internal state that needs to reset. The `{#key}` block destroys and recreates everything inside.

### Pattern 2: Store Destructuring

```svelte
const { w_t_breadcrumbs } = show;
const { w_ancestry_focus } = x;
```

Destructure stores once, then use `$w_t_breadcrumbs` everywhere.

**Benefit:** Cleaner code, fewer imports.

### Pattern 3: Reactive Dependency Tracking

```svelte
$: {
  const _ = `${u.descriptionBy_titles($w_grabbed)}
  :::${$w_rect_ofGraphView.description}
  :::${$w_ancestry_focus?.id}`;
  update();
}
```

Build a string with all dependencies. Forces Svelte to track everything. Then call update function.

**Why the string?** Because Svelte only tracks variables you READ in the reactive block. If update() reads stores internally, Svelte won't see them. So we force it by reading them here.

### Pattern 4: Const for Non-Reactive

```svelte
const size = k.height.button;
const hamburger_path = svgPaths.hamburgerPath(size);
```

Use `const` when the value never changes. Clear signal to other developers: "This won't be reactive."

## Common Mistakes

### Mistake 1: Forgetting Reassignment

```svelte
let items = [];

// WRONG
function addItem(item) {
  items.push(item);  // Mutates, doesn't trigger re-render
}

// RIGHT
function addItem(item) {
  items = [...items, item];  // New array, triggers re-render
}
```

### Mistake 2: Nested Reactivity

```svelte
let state = {
  user: { name: 'Jonathan' },
  count: 0
};

// WRONG
state.count += 1;  // Doesn't re-render

// RIGHT
state = { ...state, count: state.count + 1 };
```

### Mistake 3: Missing Dependencies

```svelte
let a = 1;
let b = 2;

$: result = a + b;  // Correct - depends on a and b

$: result = calculate();  // WRONG if calculate() uses a or b
                          // Svelte can't see inside functions
```

Fix:
```svelte
$: result = calculate(a, b);  // Pass dependencies as params
```

Or:
```svelte
$: {
  const _ = `${a}:::${b}`;  // Read them explicitly
  result = calculate();
}
```

### Mistake 4: Store Without $

```svelte
const count = writable(0);

// WRONG
{count}  // Displays "[object Object]"

// RIGHT
{$count}  // Displays the value
```

## Svelte 4 vs Svelte 5

**Svelte 4:** Reactive variables, `$:` statements, `$` store prefix
**Svelte 5:** `$state()`, `$derived()`, `$props()` runes

We're on Svelte 4. No runes yet. When we upgrade, reactivity will work differently.

**What stays the same:** Props, stores, lifecycle (mostly)
**What changes:** Component state becomes explicit with runes

## Summary

Svelte 4 reactivity:
- Top-level `let` is reactive
- Nested changes need reassignment
- `$:` creates reactive statements
- `$store` auto-subscribes
- `{#key}` forces re-render

Our patterns:
- Manual triggers for child component resets
- Store destructuring for cleaner imports
- Explicit dependency strings for complex reactivity
- `const` for non-reactive values

The weirdness:
- Implicit dependency tracking (Svelte analyzes your code)
- Nested mutations don't work (need reassignment)
- Can't track inside function calls (need explicit reads)

When in doubt, reassign the whole thing. Svelte will notice.
