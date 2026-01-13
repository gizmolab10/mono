# Separator

Visual divider line with optional decorations.

## Location

`src/lib/svelte/layout/Separator.svelte`

## Purpose

Draws horizontal or vertical divider lines between regions. Can include gull wings (curved corners) and optional title text.

## Visual

```
Horizontal with gull wings:
    ╭────────────────────────────╮
    
Horizontal with title:
    ╭────────── Title ───────────╮

Vertical:
    ╮
    │
    │
    ╯
```

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `length` | `number` | required | Length in pixels |
| `thickness` | `number` | `8` | Line thickness |
| `isHorizontal` | `boolean` | `true` | Orientation |
| `hasGullWings` | `boolean` | `true` | Show curved ends |
| `hasBothWings` | `boolean` | `true` | Wings on both ends |
| `title` | `string \| null` | `null` | Optional centered title |
| `hasThinDivider` | `boolean` | `false` | Thin line through center |

## State

None — purely presentational.

## Styling

- Color: `colors.w_separator_color`
- Background for title: `colors.w_background_color`

## CSS Classes

| Class | Purpose |
|-------|---------|
| `.separator` | Base container |
| `.separator-horizontal` | Horizontal variant |
| `.separator-vertical` | Vertical variant |
| `.separator-title` | Centered title text |
| `.thin-divider` | Optional thin center line |

## Children

- `Gull_Wings` — curved end decorations (0, 1, or 2)

## Coordinate System

- `origin` — center point at start of separator
- Horizontal: extends right from origin
- Vertical: extends down from origin

## Simplifications from webseriously

- Removed: absolute positioning props (`position`, `zindex`)
- Removed: `corner_radius` prop (use constant)
- Removed: `Clickable_Label` integration
- Added: uses CSS for layout instead of inline styles
