# Graph

Main canvas area for 3D visualization.

## Location

`src/lib/svelte/layout/Graph.svelte`

## Purpose

Hosts the WebGL/2D canvas for rendering quaternion rotation visualization. Handles resize events to keep canvas buffer in sync with container size.

## Props

None.

## State

| Name | Type | Description |
|------|------|-------------|
| `canvas` | `HTMLCanvasElement` | Canvas element reference |
| `container` | `HTMLDivElement` | Container div reference |
| `initialized` | `boolean` | Tracks first init |

## Lifecycle

1. `onMount` — creates ResizeObserver on container
2. First resize — calls `init(canvas)` from Render.test.ts
3. Subsequent resizes — calls `render.resize(width, height)`
4. Cleanup — disconnects observer

## Styling

- Background: `colors.w_background_color`
- Canvas inherits background
- Cursor: `grab` / `grabbing` on drag

## CSS Classes

| Class | Purpose |
|-------|---------|
| `.graph` | Container, 100% width/height |
| `.graph canvas` | Canvas, fills container, block display |

## Dependencies

- `render` singleton — handles rendering
- `init()` from Render.test.ts — initializes scene
- `colors` — theming

## Resize Strategy

Uses `ResizeObserver` (not window resize) to track container size. This allows the canvas to respond to layout changes, not just window changes.
