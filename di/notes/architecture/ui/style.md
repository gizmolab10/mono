# DI UI Style Guide

Background rule: everything is `var(--c-white)` / `var(--bg)` by default. The active/selected state is the exception.

## Repetitive patterns of usage

### Button / control base (10+ files)

Every interactive control shares this core:

- `border: var(--th-border) solid currentColor`
- `border-radius: var(--corner-common)` (pill — buttons, select, action) or `var(--corner-input)` (box — input field, SO selector)
- `height: var(--h-button-common)`
- `font-size: var(--h-font-common)`
- `z-index: var(--z-action)`
- `cursor: pointer`
- `color: inherit`
- `background: var(--c-white)`
- `box-sizing: border-box`
- hover rules declared after active rules so hover always wins

### Hover / active state (8+ files)

- hover → `background: var(--selected)`, `color: var(--c-black)`
- active (pressed/selected) → same colors, kept on
- inactive → `opacity: 0.5`
- active = stands out by simplicity — no heavy highlight colors, just `var(--selected)` vs plain white
- hit target system (`[data-hit]`) drives most of these; native `:hover` only where hit system isn't wired

### Flex row with gap (15+ files)

- `display: flex; align-items: center; gap: var(--l-gap)`
- variant: `gap: var(--l-gap-small)` for tighter groups

### Input focus (8+ files)

- `outline: var(--focus-outline)`
- `outline-offset: -1.5px`
- `background: var(--c-white); color: var(--c-black)`

### Table cell / cell input (5 files)

- `font-size: var(--h-font-small); border-collapse: collapse; width: 100%`
- cell input: `box-sizing: border-box; background: var(--c-white); border: none; outline: none; padding: 0 4px`

### Range input thumb (3 files — Slider, P_Angles, P_Repeat)

- `border-radius: 50%; width: var(--h-slider); height: var(--h-slider)`
- `background: var(--c-thumb)` (or custom `--thumb-color`)
- `border: 1px solid rgba(0,0,0,0.4)`
- duplicated for `-webkit-slider-thumb` and `-moz-range-thumb`

### Flex column panel (6 files)

- `display: flex; flex-direction: column; padding: var(--l-gap); box-sizing: border-box`

### Z-index stacking (everywhere)

- `var(--z-action)` — all interactive controls (15+ uses)
- `var(--z-layout)` — structural panels
- `var(--z-frontmost)` — overlays, menus

### Heights

- buttons are only one of two sizes
    - common — all buttons for now
    - small — for controls that should "feel less important"
- segments use button constants
- table cells all have the same height

### Layout

- margins around groups and content of details
- padding around text in buttons
- gaps between controls in the same group

## CSS pipeline

ts -> svelte -> style -> css -> UX

**Design tokens** — named constants for visual decisions (eg, `k.height.font.common`). Defined once, consumed everywhere via CSS vars. Changing a token updates the whole UI.

**Flow top-down** — values originate in TS, get injected into CSS, and are consumed by components. Components never push values back up the chain; they only read what was given to them.

---

### ts

- **Constants.ts** (`k.*`)
    - measurements
    - z-index
    - thresholds
    - all derived from `common_size`
- **Colors.ts** (`colors.*`)
    - static colors (border, thumb, focus…)
    - reactive stores (accent, bg, text, selected)

### svelte

- **App.svelte onMount** — `root.setProperty('--x', …)` injects everything onto `:root`

### style

- **scoped `<style>` blocks** — `var(--x)` for all design tokens
- **`inline style:`** — for values that change at runtime (computed dimensions, reactive colors), or to protect static values from shorthand overrides

### css

- **`[data-hit]` attribute** — set by hit target system; CSS responds with attribute selectors for hover/press

No external `.css` files. Everything scoped inside `.svelte` components.
