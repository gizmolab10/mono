# Migration: Merge Steppers into Next_Previous

**Status:** Proposal

## Discovery

`Steppers.svelte` is used by `BuildNotes.svelte` — the modal that displays build notes with paging.

## Goal

Eliminate `Steppers.svelte` by extending `Next_Previous.svelte` to handle both horizontal and vertical layouts.

## Proposed Changes

### Next_Previous.svelte — New props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `vertical` | boolean | false | Stack buttons vertically instead of horizontally |
| `visibility` | [boolean, boolean] | [true, true] | Per-button visibility control |
| `metaKey_in_closure` | boolean | false | Include metaKey in callback |

### Updated closure signature

```typescript
// Current (Next_Previous)
closure(column: number, event?: MouseEvent, element?: HTMLElement, isFirstCall?: boolean)

// Proposed unified
closure(index: number, options: {
    event?: MouseEvent,
    element?: HTMLElement,
    isFirstCall?: boolean,
    metaKey?: boolean
})
```

Or simpler — keep current signature, add optional `metaKey` parameter:
```typescript
closure(column: number, event?: MouseEvent, element?: HTMLElement, isFirstCall?: boolean, metaKey?: boolean)
```

### CSS changes

```svelte
<div class='{name}-next-previous'
    style='
        ...
        flex-direction: {vertical ? "column" : "row"};
        ...'>
```

### Visibility

Replace always-show-both with:
```svelte
{#each row_titles as title, index}
    {#if visibility[index]}
        <button ...>
```

### Migration path

1. Add `vertical`, `visibility` props to Next_Previous
2. Update Steppers' parent to use Next_Previous with:
   ```svelte
   <Next_Previous
       vertical={true}
       visibility={$w_t_directionals}
       closure={(index, event, element, isFirstCall) => {
           hit_closure(index === 0, event?.metaKey);
       }}
       origin={new Point(19, 29)}
       size={20}
       name="steppers"
   />
   ```
3. Test paging behavior
4. Delete Steppers.svelte

## Files affected

- `src/lib/svelte/mouse/Next_Previous.svelte` — add props
- `src/lib/svelte/mouse/Steppers.svelte` — delete
- `src/lib/svelte/main/BuildNotes.svelte` — update to use Next_Previous

## Spec

- `has_title` is horizontal-only (ignored when `vertical=true`)
- Keep using Triangle_Button for rendering (don't inline SVG paths)
- Hover highlighting doesn't need to match exactly — use Next_Previous's existing style
