# Handoff

Resume point for next chat.

## Active task

Firefox bugs in ws app. 5 identified, 3 fixed:

1. **Next/previous buttons not visible** — IN PROGRESS
   * Issue is in `ws/src/lib/svelte/draw/SVG_D3.svelte` lines 50-51
   * `width={width}px` and `height={height}px` is invalid SVG syntax
   * Should be `width="{width}px"` or just `width={width}`
   * Chrome lenient, Firefox strict — ignores malformed attributes
   * **Fix not yet applied**
2. **Reveal dots not visible** — NOT STARTED (likely same SVG_D3 issue)
3. **Levels slider incorrectly drawn** — FIXED
4. **Preferences accent color dot border broken** — FIXED
5. **Details banners hover wrong for traits and data** — NOT STARTED

## Other completed this session

* Fixed rubberband selection bug (state extraction to S_Rubberband.ts)
* Fixed infinite loop in Graph.svelte (guard against layout during rubberband)
* Fixed shift-click deselection
* Fixed empty rubberband deselects on mouse-up
* Created `notes/guides/pre-flight/always.md`
* Updated [CLAUDE.MD](http://CLAUDE.MD) pre-flight instructions
