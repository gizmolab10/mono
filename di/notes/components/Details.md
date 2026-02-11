# Details

Left sidebar for properties and actions.

## Location

`src/lib/svelte/layout/Details.svelte`

## Purpose

Displays contextual information about selected objects. Will eventually show properties, actions, tags, traits, etc.

## Props

None (placeholder).

## State

None (placeholder).

## Styling

- Background: `colors.w_background_color`
- Text: `colors.w_text_color`
- Padding: `1rem`
- Width: fills parent (280px from Main)

## CSS Classes

| Class | Purpose |
|-------|---------|
| `.details` | Container, padding, fills parent |
| `.details h2` | Section header |
| `.details p` | Placeholder text, reduced opacity |

## Future

Will contain:
- Header with selected item info
- Actions section
- Selection details
- Tags
- Traits
- Preferences
- Data view

Structure from webseriously:
- `D_Header`
- `D_Actions`
- `D_Selection`
- `D_Tags`
- `D_Traits`
- `D_Preferences`
- `D_Data`
