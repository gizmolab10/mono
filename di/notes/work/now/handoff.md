# Code-Debt Handoff

**Date:** 2026-05-07
**Work stream:** items from [code.debt.md](./code.debt.md), one item at a time. Per-session detail in [work journal](./work%20journal.md).

## Open items

- **Validation-error overlay placement after the rename refactor.** Hop two of the rename refactor moved the validation overlay from inside the parts list panel to the parent details panel. The overlay now lives at the bottom of the details column, below all the panel banners, rather than tucked inside the parts banner. This was not visually confirmed in a running browser. Worth a one-minute visual confirmation: trigger a name-validation error and check that the red-bordered message appears in a sensible spot whether the parts list panel is open or collapsed. If the placement looks off when the parts list is collapsed, the overlay can be repositioned without changing any of the wiring.
- **One stray trace log left from the formula-bug investigation.** A single console.log inside the algebra constraints file announces an aborted cycle walk. Pull it (or convert it into a real status-strip warning) before the next feature pass. The renderer's many logs are part of the topology rewrite and should be left alone.
- **Delete on a non-repeater grandchild leaves the part still listed.** Jonathan reports: select a child of a child of root, press delete, the selection clears but the part stays in the parts table. Static analysis ruled out the repeater-regeneration angle and the early-return paths. Most likely cause is an exception thrown between selection-clear and the parts-list rewrite — the formula-reference walker is the most fragile step. Need a console error message or a small repro scene to pin the failing step.
- **Up/down arrow in the parts table skips two rows per press on Jonathan's scene.** Could not reproduce from reading the code. Need more detail about the scene before a fix can be made.
- **Identity-based formula storage.** A targeted rename helper closed the immediate bug, but the deeper fix is to store formula references by part identity rather than by a snapshot of the part's name. Recorded as a future structural refactor.
- **Mothballed: residual child-drag drift.** Parked in [milestone 33](../milestones/33.drag/handoff.md). Pick back up if Jonathan wants to revisit drag work.
- **Mothballed: allocation-cluster and string-key performance bullets.** Deferred in [bottlenecks.md](../milestones/done/32.facets/slow/bottlenecks.md). Revisit only if profiling points back at allocation pressure.

---

## Proposal: keep the details column's content width steady when a scrollbar appears

**The item.** The side details column gets a vertical scrollbar when its stack of panels grows tall enough to need one. The scrollbar takes some pixels of width away from the inside of the column. The visible content area shrinks by the scrollbar's width, so everything inside shifts and reflows. The fix is to make the content area stay the same width whether or not the scrollbar is present.

**Two ways to make the content width steady.**

1. Always reserve space for the scrollbar. The column keeps its outer width constant, and a thin strip on the right is always reserved for a scrollbar. When there is no scrollbar to show, the strip is just unused space. Modern browsers expose this as a one-line style declaration on the scrolling container. Smaller-blast-radius change. Slight cost: a small permanent gutter on the right even when not needed.

2. Make the column itself grow wider by the scrollbar's width when the scrollbar appears, and shrink back when it goes away. Content area stays fixed; column outer width swings. Matches the wording of the ask exactly. Requires either a script that watches overflow and toggles a width class, or a more elaborate layout that lets the column borrow width from a sibling. More code, more places to break.

Evidence: the scrolling container is the side details column at [Details.svelte](../../../src/lib/svelte/details/Details.svelte) inside the styles block — the rule that sets vertical overflow to auto.

**Recommended approach.** Option one. A single style declaration on the scrolling container that asks the browser to always reserve scrollbar space. Wide browser support today. The user-facing result is identical to option two — content never jumps when the scrollbar appears or disappears. The only visible difference is whether there is always a thin empty gutter (option one) or no gutter ever and a wider column when the scrollbar shows up (option two). Most users will not notice a permanent thin gutter; most users will notice the whole column resizing.

**Test plan.** Open the app with a few panels — content sits at its natural width. Open enough panels for the column to overflow and force the scrollbar to appear — content does not shift left or right. Scroll up and down — no reflow. Close panels until the scrollbar disappears — content still does not shift. Resize the window to be very tall (no scrollbar) and then short (scrollbar) — content stays put.

I AM GUESSING that browser support is fine on a recent macOS running a recent browser. If the property is not honored, the fallback is the current behavior — content shifts when scrollbar appears, but nothing breaks.

---

## Proposal: option two — make the details column itself widen when its scrollbar appears

**The item.** Same goal as the previous proposal: keep the content area of the side details column at a constant width whether or not a vertical scrollbar is present. The user has chosen the second of the two options described — make the column's outer width grow by the scrollbar's width when the scrollbar appears, and shrink back when it goes away. This proposal lays out how that grow-and-shrink would work.

**How the layout sits today.** The page is split into two side-by-side regions: the side details column on one edge and the graph fills the rest. The column's width is computed from a layout constant. The graph's width is computed as the window width minus the column width and the gaps. The details column scrolls vertically when its content overflows. When a scrollbar appears inside the column, the visible content area shrinks by the scrollbar's width because the scrollbar is drawn inside the column.

Evidence: the layout math is at [Main.svelte:29-35](../../../src/lib/svelte/main/Main.svelte#L29-L35) (column width and graph width are both computed from the window width and a constant); the column's scrollable container is [Details.svelte](../../../src/lib/svelte/details/Details.svelte) (the rule that sets vertical overflow to auto).

**Recommended approach.**

1. The details panel measures the scrollbar's pixel width once at startup. It does this by creating a hidden, off-screen scrolling element and reading the difference between its outer width and its inside width. The result is cached as a number — zero on systems with overlay scrollbars (scrollbars that float over content without taking width), or fifteen-ish on systems with classic scrollbars.
2. The details panel watches its own overflow state with a resize observer. When the inside content gets taller than the outer container, an "overflowing" flag turns on; when it gets shorter, the flag turns off.
3. The flag flows up to the layout math in the parent. The column's outer width becomes the existing constant plus the scrollbar's pixel width when overflowing, and the existing constant when not. The graph's outer width is recomputed from the same numbers, so the graph automatically gives back exactly that many pixels.
4. The result: the visible content area inside the details column is always the same width. When the scrollbar appears, the whole column slides outward by the scrollbar's width, and the graph slides over to make room. When the scrollbar goes away, the column slides back and the graph reclaims the space.

**Why a measurement, not a hardcoded number.** Scrollbar width varies by operating system and by user preference. macOS users can set scrollbars to "always show" (classic style, takes width) or "automatic" (overlay style, takes no width). On overlay-scrollbar systems the measured width is zero — the grow-and-shrink does nothing because there's nothing to compensate for, which is the right behavior.

**Why a resize observer, not a scroll event.** The trigger is "did the content height change relative to the container height", not "did the user scroll". Resize observer fires precisely when those heights change. A scroll event would also fire on every wheel tick, doing extra work.

**Test plan.** Open the app with the column not overflowing. Record the column's outer width and the graph's outer width. Open enough panels for the column to start needing a scrollbar — the column should grow wider by exactly the scrollbar's width, and the graph should shrink by the same amount. The visible content inside the column should not shift, reflow, or change width. Close panels until the scrollbar disappears — column and graph should return to their starting widths. On macOS with overlay scrollbars (the default "automatic" setting), the grow-and-shrink should be a no-op — column and graph stay at the same widths regardless of overflow, because the measured scrollbar width is zero. Resize the window — math reflows correctly.

**Cons.** The whole column visibly resizes when overflow toggles. On a tall screen with content that grows just past the threshold, the user may see the column "jump" wider as the last panel pushes things over the edge. Option one (always reserve gutter) does not have this jump because nothing ever moves. The grow-and-shrink approach is the most literal match to the wording but may feel jumpy in practice.

I AM GUESSING about how the jump feels in real use. If it reads as distracting, falling back to option one is one CSS line away.

---

## Done: option two grow-and-shrink, plus a styled scrollbar

**Outcome.** Visually confirmed in the running browser. The column widens by exactly the scrollbar's pixel width when its contents overflow, and shrinks back when they don't. The graph slides over to give back the same number of pixels. The visible content area inside the column never changes width, so panels and rows do not reflow when the scrollbar appears or disappears.

**Scrollbar look.** The scrollbar itself was styled to match the rest of the side panel rather than show the browser default.

- The channel behind the moving handle, the channel above and below the handle, the small end-button areas at the top and bottom, and the corner zone are all painted with the accent purple. Together this means there is no white frame, no white triangle in the corner, and no white line surrounding the scrollbar.
- The moving handle itself uses the dedicated thumb color, with a hairline outline in the default text color and rounded half-circle ends at top and bottom.

Evidence: the rules are in the styles block of [Details.svelte](../../../src/lib/svelte/details/Details.svelte) just below the `.details` rule.

**Test plan, run.** Confirmed in Chrome on macOS: the scrollbar channel and end areas show accent purple; the moving handle shows the thumb color with a thin outline and rounded ends; the surrounding white frame is gone.

I AM GUESSING that other browsers (Safari, Firefox) will show the system default scrollbar instead of these custom colors, because the rules used here are Chrome/Edge-only. If matching the styled look on Safari and Firefox matters, a follow-up pass with the standard scrollbar-color and scrollbar-width properties would close the gap.

---

## Done: a divider strip between the visible content and the scrollbar

**Outcome.** When the side column needs to scroll, a vertical divider strip now sits between the visible content area and the scrollbar. The strip uses the project's standard divider component at the main-divider thickness, so it visually matches the dividers used elsewhere in the app. When the column does not need to scroll, the strip is not rendered.

**How the layout grows.** When the scrollbar appears, the column widens by two amounts at once: the scrollbar's pixel width, and the divider's pixel width. The visible content area stays exactly the same width as before the scrollbar appeared, the divider sits to the right of the content in its own dedicated strip, and the scrollbar sits to the right of the divider in its own dedicated strip. The graph beside the column shrinks by the same combined amount, so the rest of the page math keeps working without changes.

Evidence: the wiring is in [Details.svelte](../../../src/lib/svelte/details/Details.svelte). The column report-back to the parent now sends scrollbar-width plus divider-width when overflowing, the inner content area gains a right padding equal to the divider width when overflowing, and a positioned overlay places the divider exactly between the content's right edge and the scrollbar's left edge.

**Color and edge cases.** Two visual hazards came up while putting this together and were both resolved.

- The first was a tiny white sliver showing on the right edge of the scrollbar in Safari, because the scroll container's own background was white and the scrollbar paint did not reach the very last pixel. The fix was to paint the scroll container's background with the accent color whenever the scrollbar is visible, and revert it to the regular page background when the scrollbar is hidden — otherwise the empty area below the last banner would also show accent.
- The second was a thin white line at the bottom of the divider on Safari, caused by the divider's own height computing one pixel short of the surrounding container under sub-pixel rounding. The fix was to give the divider an explicit full height inside the overlay and a thin accent ring around it, both scoped to this overlay only so other uses of the divider in the app are unaffected.

**Test plan, run.** Confirmed in Chrome and Safari on macOS: when the column overflows, the divider sits between the content and the scrollbar, the visible content width does not change as the scrollbar appears or disappears, no white slivers appear around the scrollbar or divider, and the area below the last banner shows the regular page background when the column is short enough not to scroll.

**Scrollbar width.** Pinned to a fixed pixel width on the styled scrollbar so the moving handle and the channel behind it have a consistent feel regardless of the system's default scrollbar width. The current value is set on the rule that styles the scrollbar widget itself.
