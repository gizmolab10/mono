# Next_Previous Component

**File:** `src/lib/svelte/mouse/Next_Previous.svelte`

## What it does

A reusable previous/next button pair component.

- Renders two arrow buttons (previous/next) in a horizontal row
- Supports autorepeat — holding a button fires repeatedly
- Calls `closure(column, event, element, isFirstCall)` on each press/repeat

## Key features

- Uses SVG paths for arrows (triangles by default, or custom via `custom_svgPaths`)
- Hover highlighting via `w_s_hover` store
- Visual feedback when held (0.95 scale transform)
- Integrates with the hit detection system (`S_Element`, `T_Hit_Target.button`)
- Tracks `isFirstCall` to distinguish initial press from repeats

## Props

- `closure` — callback fired on button press
- `origin` — position offset
- `size` — button size (default 24)
- `name` — identifier for CSS classes
- `custom_svgPaths` — optional custom up/down icons

## State

```typescript
interface S_Button {
    s_element: S_Element | null;
    event: MouseEvent | null;
    isFirstCall: boolean;
}

let s_buttons: S_Button[] = [
    { s_element: null, event: null, isFirstCall: true },
    { s_element: null, event: null, isFirstCall: true }
];

let html_elements: HTMLElement[] = [];  // transient single source of truth, for bind:this
```

## Changes

- [x] eliminate has_title
- [x] consolidate parallel arrays into S_Button objects
- [x] remove element from S_Button, use s_element.html_element instead
- [ ] add two new props: show_numbers:boolean, source_of_truth:S_Item
	- [ ] if true separate the two triangles to make room for a label
	- [ ] label is two numbers, one above the other, separated by a thin h line
	- [ ] top number is the current index (provided by source of truth)
	- [ ] bottom number is the length (also provided by source of truth)
