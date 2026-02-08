# DI UI Style Guide

Background rule: everything is **white** by default. The active/selected state is the exception.

## Buttons (Controls toolbar)

- Default: `background: white`, `border: 0.5px solid currentColor`, `border-radius: 10px`, 11px font, 20px height
- Hover: inverts — `background: black`, `color: white`
- Active (toggled on, e.g. "hide dimensions"): `background: white`, `color: black` — looks the same as default, distinguished only by label change

## Input field

- `background: white`, `border: 0.5px solid currentColor`, `border-radius: 4px`

## Unit system select (dropdown)

- `background: white`, `border: 0.5px solid currentColor`, `border-radius: 10px` (pill shape, matches toolbar buttons)
- SVG chevron as `background-image`, positioned `right 6px center`, with `18px` right padding for clearance
- Native appearance stripped (`appearance: none`)
- Hover: `background: black`, `color: white`, `background-image: none` (chevron hidden)

## Segmented control (precision)

- **Container**: `border: 0.5px solid currentColor`, `border-radius: 6px`, `overflow: hidden`, 20px height
- **Segments**: `flex: 1 1 auto`, `background: white`, flexbox centered (`display: flex; align-items: center; justify-content: center`), 9px font
- **Unselected text**: `color: rgba(0,0,0,0.5)` — dimmed text, pure white background
- **Hover**: `background: black`, `color: white`
- **Active** (selected precision): `background: transparent`, `color: black` — the container shows through, visually distinct by *not* having its own fill
- **Dividers**: `border-right: 0.5px solid currentColor`; last segment uses `transparent` border to keep equal sizing

## SO selector buttons

- `background: white`, `border: 0.5px solid currentColor`, `border-radius: 4px`
- Unselected: `opacity: 0.5` (element-level, so entire button fades)
- Selected: inverts — `background: currentColor`, `color: var(--bg, white)`

## Action buttons ("add child", "solid")

- `background: white`, pill shape (`border-radius: 10px`), hover inverts like toolbar

## Details layout

- Settings row: `display: flex; gap: 6px` — add child, solid/see-through, and unit select sit horizontally
- Action buttons inside settings row have `margin-top: 0` (overrides the default `0.75rem`)

## Canvas rendering

- **DPR scaling**: canvas buffer = logical size x `devicePixelRatio`, context scaled by dpr, CSS `width`/`height` set to logical pixels
- **SO edges**: `lineWidth: 1`, `lineCap: square`, coordinates snapped to half-pixel grid (`Math.round(x) + 0.5`) for crisp 1px lines
- **Dimensional lines**: `lineWidth: 0.5` (1 physical pixel on 2x Retina)
- **Text**: coordinates rounded to integers for crisp glyph placement

## Consistent patterns

- **Border**: `0.5px solid currentColor` everywhere — inherits from the theme's text color
- **Border-radius**: `10px` for pills (buttons, select, action), `4px` for boxes (input, SO selector), `6px` for segmented control
- **Font sizes**: 9px (segments), 11px (buttons/select), 0.875rem (input)
- **Active = stands out by simplicity** — selected segment is transparent/black while unselected ones are white/dimmed. No heavy highlight colors
- **hover** -- always black with white text
- **height** of all controls identical (including text input) -- 20px, box-sizing: border-box
- **CSS specificity**: hover rules declared after active rules so hover always wins
