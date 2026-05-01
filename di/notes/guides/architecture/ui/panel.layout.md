# Panel Architecture

## Overview

Panel is the root layout component for the di application. It provides a fixed, full-viewport container with three distinct regions: controls (top), graph (main content), and details (right sidebar).

## Layout Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         .controls                               │
│                        (48px height)                            │
├═══════════════════════════════════════════════════════════════╮─┤
│                    Separator (horizontal, 8px)                ╯ │
├─────────────────╦═══════════════════════════════════════════════┤
│                 ║                                               │
│                 ║                                               │
│    .details     ║                    .graph                     │
│   (280px width) ║               (flex: 1, fills)                │
│                 ║                                               │
│                 ║  Separator                                    │
│                 ║  (vertical, 8px)                              │
│                 ║                                               │
│                 ║                                               │
└─────────────────╩═══════════════════════════════════════════════┘
                              .panel
                    (fixed, full viewport)
```

## DOM Structure

```
Main.svelte (.panel)
├── .region.controls      ← top bar
│   └── Controls.svelte
├── Separator             ← horizontal, below controls
├── .main                 ← flexbox container
│   ├── .region.details   ← left sidebar (if showDetails)
│   │   └── Details.svelte
│   ├── Separator         ← vertical, between details/graph (if showDetails)
│   └── .region.graph     ← main content area
│       └── Graph.svelte
```

## Components

| Component | Location | Purpose |
|-----------|----------|--------|
| `Main.svelte` | `layout/` | Root layout, manages regions, renders children |
| `Controls.svelte` | `layout/` | Top bar with title |
| `Graph.svelte` | `layout/` | Canvas with ResizeObserver, 3D rendering |
| `Details.svelte` | `layout/` | Left sidebar, properties panel |
| `Separator.svelte` | `layout/` | Visual divider with optional fillets |
| `Fillets.svelte` | `layout/` | SVG curved corner decorations |
| `Box.svelte` | `layout/` | Bordered container using separators |

### Managers

| Component | Location | Purpose |
|-----------|----------|--------|
| `Preferences.ts` | `managers/` | localStorage read/write for persistent settings |

## CSS Classes

| Class | Element | Purpose |
|-------|---------|---------|
| `.panel` | Root `<div>` | Fixed position, full viewport, flex column, theming vars |
| `.main` | Content wrapper | Flex row container for graph + details |
| `.region` | All content areas | Shared: relative position, overflow hidden |
| `.controls` | Top bar | Full width, bottom border, fixed height |
| `.graph` | Main content | Flex grow, fills available space |
| `.details` | Left sidebar | Fixed width, right border |

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
| Left | `.details` sticks to left edge |
| Right | `.graph` fills to right edge |
| Bottom | `.main` fills to bottom |

## Future Considerations

- Resizable details panel (drag border)
- Collapsible details (toggle `showDetails`)
- Multiple control bars (primary/secondary)
- Breakpoints for mobile (hide details on narrow screens)
