# Steppers Component

**File:** `src/lib/svelte/mouse/Steppers.svelte`

## What it does

A vertical pair of up/down triangle buttons for stepping through pages.

- Renders two triangle buttons stacked vertically (up above, down below)
- Used for paging/stepping through clustered items (alternative to sliders)
- Supports autorepeat — holding fires repeatedly
- Conditionally shows each button based on `w_t_directionals` store (hides when at min/max)

## Key features

- Uses `Triangle_Button` component for each arrow
- Hover highlighting (blended background color)
- Passes `pointsUp` boolean and `metaKey` to `hit_closure` on press
- Positioned absolutely at a fixed origin (19, 29)
- Button size: 20px

## Props

- `hit_closure` — callback fired with `(pointsUp: boolean, metaKey: boolean)`

## Visibility

- `$w_t_directionals[0]` controls up button visibility
- `$w_t_directionals[1]` controls down button visibility
