# Controls

Top bar component with title.

## Location

`src/lib/svelte/layout/Controls.svelte`

## Purpose

Displays application title. Will eventually hold primary controls (search, settings, etc.).

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `'Design Intuition'` | Title text |

## State

None.

## Styling

- Background: `colors.w_background_color`
- Text: `colors.w_text_color`
- Height: fills parent (48px from Main)
- Padding: `0 1rem`

## CSS Classes

| Class | Purpose |
|-------|---------|
| `.controls` | Container, flex, centered vertically |
| `.controls h1` | Title, 1.25rem, weight 300 |

## Future

- Search input
- Settings button
- View toggles
