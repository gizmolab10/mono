# Handoff

Resume point for next chat.

## Active task

Firefox bugs in ws app. 5 identified, 3 fixed:

1. **Next/previous buttons not visible** — IN PROGRESS
   - Issue is in `ws/src/lib/svelte/draw/SVG_D3.svelte` lines 50-51
   - `width={width}px` and `height={height}px` is invalid SVG syntax
   - Should be `width="{width}px"` or just `width={width}`
   - Chrome lenient, Firefox strict — ignores malformed attributes
   - **Fix not yet applied**

2. **Reveal dots not visible** — NOT STARTED (likely same SVG_D3 issue)

3. **Levels slider incorrectly drawn** — FIXED
   - `ws/src/lib/svelte/mouse/Slider.svelte`
   - Changed `border-radius: 50%` to `16px` in `::-moz-range-track` and `::-ms-fill-*`

4. **Preferences accent color dot border broken** — FIXED
   - `ws/src/lib/svelte/mouse/Color.svelte`
   - Added Firefox detection, adjusted top offset by 1px for Firefox only

5. **Details banners hover wrong for traits and data** — NOT STARTED

## Other completed this session

- Fixed rubberband selection bug (state extraction to S_Rubberband.ts)
- Fixed infinite loop in Graph.svelte (guard against layout during rubberband)
- Fixed shift-click deselection (added return true after ungrab)
- Fixed empty rubberband deselects on mouse-up
- Created `notes/guides/pre-flight/always.md` — read every response
- Updated CLAUDE.MD: every response reads always.md + scans keywords.md

## Files touched

- `ws/src/lib/ts/state/S_Rubberband.ts` — created
- `ws/src/lib/svelte/mouse/Rubberband.svelte` — refactored
- `ws/src/lib/svelte/main/Graph.svelte` — added rubberband guard
- `ws/src/lib/svelte/widget/Widget_Title.svelte` — shift-click fix
- `ws/src/lib/svelte/mouse/Slider.svelte` — Firefox border-radius fix
- `ws/src/lib/svelte/mouse/Color.svelte` — Firefox top offset fix
- `notes/guides/pre-flight/always.md` — created
- `notes/guides/pre-flight/index.md` — updated
- `CLAUDE.MD` — updated pre-flight instructions
