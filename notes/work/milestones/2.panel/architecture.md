# Panel Architecture

## Overview

Panel is the root layout component for the di application. It provides a fixed, full-viewport container with three distinct regions: controls (top), graph (main content), and details (right sidebar).

## Layout Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         .controls                               │
│                        (48px height)                            │
├───────────────────────────────────────────────┬─────────────────┤
│                                               │                 │
│                                               │                 │
│                    .graph                     │    .details     │
│               (flex: 1, fills)                │   (280px width) │
│                                               │                 │
│                                               │                 │
│                                               │                 │
│                                               │                 │
│                                               │                 │
└───────────────────────────────────────────────┴─────────────────┘
                              .panel
                    (fixed, full viewport)
```

## DOM Structure

```
.panel
├── .region.controls      ← top bar (snippet: controls)
├── .main                 ← flexbox container
│   ├── .region.graph     ← main content area (snippet: graph)
│   └── .region.details   ← right sidebar (snippet: details)
└── [children]            ← fallback content (snippet: children)
```

## CSS Classes

| Class | Element | Purpose |
|-------|---------|---------|
| `.panel` | Root `<div>` | Fixed position, full viewport, flex column, theming vars |
| `.main` | Content wrapper | Flex row container for graph + details |
| `.region` | All content areas | Shared: relative position, overflow hidden |
| `.controls` | Top bar | Full width, bottom border, fixed height |
| `.graph` | Main content | Flex grow, fills available space |
| `.details` | Right sidebar | Fixed width, left border |

## CSS Custom Properties

| Property | Default | Purpose |
|----------|---------|---------|
| `--panel-bg` | `#1a1a2e` | Panel background color |
| `--panel-fg` | `#eee` | Panel text color |
| `--border-color` | `#333` | Border color for regions |

## State

| Variable | Type | Reactive | Purpose |
|----------|------|----------|---------|
| `width` | `number` | `$state` | Viewport width, updates on resize |
| `height` | `number` | `$state` | Viewport height, updates on resize |
| `showDetails` | `boolean` | `$state` | Toggle details panel visibility |
| `controlsHeight` | `number` | `$derived` | Fixed at 48px (configurable later) |
| `detailsWidth` | `number` | `$derived` | Fixed at 280px (configurable later) |
| `graphRect` | `object` | `$derived` | Computed {x, y, width, height} for graph region |
| `detailsRect` | `object` | `$derived` | Computed {x, y, width, height} for details region |

## Props (Snippets)

| Prop | Type | Required | Purpose |
|------|------|----------|---------|
| `controls` | `Snippet` | No | Content for top control bar |
| `graph` | `Snippet` | No | Content for main graph area |
| `details` | `Snippet` | No | Content for right sidebar |
| `children` | `Snippet` | No | Fallback content |

## Usage

```svelte
<Panel>
	{#snippet controls()}
		<h1>Title</h1>
	{/snippet}

	{#snippet graph()}
		<canvas></canvas>
	{/snippet}

	{#snippet details()}
		<aside>Properties</aside>
	{/snippet}
</Panel>
```

## Sticky Edges

| Edge | Behavior |
|------|----------|
| Top | `.controls` sticks to top (position: fixed on parent) |
| Left | `.graph` starts at x=0 |
| Right | `.details` sticks to right edge |
| Bottom | `.main` fills to bottom |

## Future Considerations

- Resizable details panel (drag border)
- Collapsible details (toggle `showDetails`)
- Multiple control bars (primary/secondary)
- Breakpoints for mobile (hide details on narrow screens)
