# Code-Debt Handoff

**Date:** 2026-05-07
**Work stream:** items from [code.debt.md](./code.debt.md), one item at a time. Per-session detail in [work journal](./work%20journal.md).

---

## Next

The first unchecked code-debt item is "move single visible part up 6 px". Pick that up next.

## Open items

- **Visual confirmation for the parts banner count.** The parts banner title now reads "1 part" or "12 parts" or — when the scene is empty — plain "parts". Type-check is clean and the test suite is green, but the title has not been visually confirmed in a running browser. Worth a one-minute visual confirmation: open a scene with a few parts including at least one repeater, and check that the banner reads what you expect. Specifically: a wall set up as a repeater with five spawned studs should add one to the count, not six. Adding a child should bump the count by one. Deleting a child should drop it by one. An empty scene should fall back to plain "parts" with no number.
- **Validation-error overlay placement after the rename refactor.** Hop two of the rename refactor moved the validation overlay from inside the parts list panel to the parent details panel. The overlay now lives at the bottom of the details column, below all the panel banners, rather than tucked inside the parts banner. This was not visually confirmed in a running browser. Worth a one-minute visual confirmation: trigger a name-validation error and check that the red-bordered message appears in a sensible spot whether the parts list panel is open or collapsed. If the placement looks off when the parts list is collapsed, the overlay can be repositioned without changing any of the wiring.
- **One stray trace log left from the formula-bug investigation.** A single console.log inside the algebra constraints file announces an aborted cycle walk. Pull it (or convert it into a real status-strip warning) before the next feature pass. The renderer's many logs are part of the topology rewrite and should be left alone.
- **Delete on a non-repeater grandchild leaves the part still listed.** Jonathan reports: select a child of a child of root, press delete, the selection clears but the part stays in the parts table. Static analysis ruled out the repeater-regeneration angle and the early-return paths. Most likely cause is an exception thrown between selection-clear and the parts-list rewrite — the formula-reference walker is the most fragile step. Need a console error message or a small repro scene to pin the failing step.
- **Up/down arrow in the parts table skips two rows per press on Jonathan's scene.** Could not reproduce from reading the code. Need more detail about the scene before a fix can be made.
- **Identity-based formula storage.** A targeted rename helper closed the immediate bug, but the deeper fix is to store formula references by part identity rather than by a snapshot of the part's name. Recorded as a future structural refactor.
- **Mothballed: residual child-drag drift.** Parked in [milestone 33](../milestones/33.drag/handoff.md). Pick back up if Jonathan wants to revisit drag work.
- **Mothballed: allocation-cluster and string-key performance bullets.** Deferred in [bottlenecks.md](../milestones/done/32.facets/slow/bottlenecks.md). Revisit only if profiling points back at allocation pressure.

## Notes for future sessions

- Code-debt items are unrelated. One short propose-then-build cycle per item. Do not batch.
- Slow-render handoff: `di/notes/work/milestones/done/32.facets/slow/handoff.md` (bottleneck file sits next to it).
- Drag handoff (mothballed): `di/notes/work/milestones/33.drag/handoff.md`.
- The `handoff` and `hands` shorthands point at this file.
- The Next line above is auto-rewritten on every adherence build by `tools/sync-next.mjs` from the first unchecked code-debt entry. Do not hand-edit it; edit `code.debt.md` instead.
- Tumble instrumentation is wired but silent. Flip the on-flag at the top of the engine file, uncomment the per-second summary block in the render loop, reload, and the console prints timings and counters.

---

## Built — trash, eyeball, lock now turn white on hover

**What changed.** Each of the trash, eyeball, and lock characters in the parts and givens tables now carries the invisible text-presentation marker right after the symbol. The browser draws them as monochrome line glyphs that respect the surrounding text color. A new hover rule on each icon cell sets the text color to white. When the cursor sits on the cell, the icon turns crisp white.

**What it looks like at rest.** The icons draw as flat outlined glyphs in the current text color, not the colored emoji you saw before. Same goes for the eyeball in the visibility column and the eyeball that shows when a parent's children are unhidden. The hyphen used for the off state and the leaf-count number were already plain text and look unchanged.

**The cell tint stays as it was.** When the cursor enters an icon cell, the cell still tints to the medium-hover background. The new behavior is on top of that — icon turns white at the same moment.

Evidence: variation marker added next to each icon character in the markup of [D_Parts.svelte](../../../src/lib/svelte/details/D_Parts.svelte) and [D_Givens.svelte](../../../src/lib/svelte/details/D_Givens.svelte); the hover rule in each file's styles block now also sets the text color.

**Needs visual confirmation.** Type-check clean. In the running app, look at the parts table — the eyeball and trash icons should draw in flat outline at rest. Hover any icon cell — icon turns white, cell tints. Same in the givens table for the lock and trash. The hyphen and number indicators stay readable.

---

## Built — vertically center the trash, eyeball, and lock icons

**What changed.** Each icon's container — the inner span for the eye columns of the parts table, the inner button for the trash and lock cells — is now a tiny flex container that fills its cell vertically and centers its content. The icons sit in the geometric middle of their cells regardless of font baseline quirks. The cells themselves stay normal table cells, so column widths are unchanged.

**Side cleanup.** A pre-existing dead piece of code in the side details column was caught by the type-checker on this build — a derived helper that nothing uses anymore. Pulled along with its three now-unused imports. The build passes clean.

Evidence: flex rules on the icon-glyph span and the trash button in [D_Parts.svelte](../../../src/lib/svelte/details/D_Parts.svelte); flex rules on the lock and trash buttons in [D_Givens.svelte](../../../src/lib/svelte/details/D_Givens.svelte); the dead-code removal in [Details.svelte](../../../src/lib/svelte/details/Details.svelte).

**Needs visual confirmation.** Type-check clean. In the running app, look at any row with an icon and confirm the icon sits vertically centered in the cell, side by side with the part name. Hover behavior unchanged from before.

---

## Proposal (superseded): vertically center the trash, eyeball, and lock icons in their cells

**The item.** The trash, eyeball, and lock icons in the parts table and the givens table do not sit visually centered top-to-bottom in their cells. After the swap to text-form glyphs they ride a little high or a little low depending on the row, because text-form glyphs follow the font's baseline rather than being a fixed-height picture. The fix is to place each icon in the geometric middle of its cell.

**What is going on today.** Each icon cell already sets the table-cell vertical alignment to middle, and the buttons inside set the same. That mechanism centers based on the line-of-text rules, which works for most text but does not give a clean geometric center for these particular glyphs. The icons sit just above or just below the line of the row's name text. The slight offset is more visible now that the icons draw as flat outlined glyphs instead of as colored pictures with their own internal vertical bias.

Evidence: the cell rules sit in the styles block of [D_Parts.svelte](../../../src/lib/svelte/details/D_Parts.svelte) (eye and remove cells, plus the inner remove-button) and [D_Givens.svelte](../../../src/lib/svelte/details/D_Givens.svelte) (lock and remove cells, plus the inner lock-button and remove-button).

**Recommended approach.** Switch each icon's container to a flex layout that centers its child both horizontally and vertically. That means adding three lines to each container — set it to flex, center its contents on the cross-axis, and center on the main-axis. For the eye cells in the parts table the flex container is the existing icon-glyph span. For the trash and lock cells in both tables the flex container is the existing button. This treatment ignores font-metric quirks and just puts the glyph in the geometric center of the box.

In plain terms: instead of relying on text-line rules to center the icon, ask the layout engine to place the icon at the middle of its box, like a button label.

**Why a wrapping span and not the cell itself.** Setting flex on the table cell breaks the table's column-width behavior. Setting flex on a small wrapper inside the cell keeps the table happy and the icon centered.

**Test plan.** Open a scene with a few parts including some children. Look at the row for any non-leaf — the eyeball icon should sit dead center of the row's vertical span, side by side with the part name. Same for the trash on every row. In the givens table, the lock and the trash should sit dead center of the cell. The hyphen used for the off state should also sit center. Hover behavior unchanged.

No cons found. The change is local, reversible, and visual only.

---

## Proposal (superseded): turn the trash, eyeball, and lock icons white on hover

**The item.** When the cursor is on a trash cell, an eyeball cell, or a lock cell — in either the parts table or the givens table — the icon inside the cell should turn white. Today these cells tint with a medium beige on hover, and the icon itself does not change. The ask is the other way around: leave the cell as it sits, change the icon color.

**The catch.** The trash, eyeball, and lock symbols today are colored emoji — wastebasket, eye, padlock, and so on. By default the browser draws them with their built-in color presentation, and a plain CSS color rule does not reach into them. So "color the icon white" needs one of these moves to actually take effect:

1. Append a text-presentation marker — the invisible character at codepoint U+FE0E — after each emoji. That tells the browser to draw the symbol as a monochrome glyph that does respect the surrounding CSS color. Then a hover rule sets that color to white. Works for the eye and the lock; the wastebasket at U+1F5D1 also has a text presentation that browsers tend to honor.
2. Drop the emoji entirely and use a non-emoji symbol or a small SVG. More work, more consistent across browsers.
3. Apply a CSS filter on hover that washes the colored emoji out to white-ish. Cheap to apply but never gives a true crisp white — it tints the whole emoji shape, including any internal detail.

Evidence: the icon characters and their cell containers in the parts table are at the row block of [D_Parts.svelte](../../../src/lib/svelte/details/D_Parts.svelte) (eye column, hide-children eye, trash column); in the givens table at [D_Givens.svelte](../../../src/lib/svelte/details/D_Givens.svelte) (lock column, trash column).

**Recommended approach.** Option one — append the text-presentation marker after each of the trash, eye, and lock characters in the markup, then add a hover rule on each cell that sets `color: white`. This keeps the icon a normal text glyph that responds to CSS, and the rule is one short block. Existing cell-background hover behavior stays as it is.

In plain terms: tell the browser to draw the symbols as text instead of as colored emoji; then a normal "make this white" rule does the right thing.

**Tradeoffs.** Option one gives crisp, consistent white. The visual tradeoff: when the cursor is not on the cell, the icon also draws as a monochrome text glyph rather than as the colored emoji it is today. That changes the resting look of the icons across both tables. If keeping the colored emoji at rest matters, option three (the CSS filter) is the only option that lets the emoji stay colorful when not hovered and wash out only on hover; the tradeoff is that the hover white is approximate, not pure.

**Test plan.** In the parts table, hover the eyeball, the hide-children eye when present, and the trash — the icon turns white. In the givens table, hover the lock and the trash — the icon turns white. The cell hover-tint and the row hover-tint behave as before. Empty cells stay flat. Click behavior is unchanged.

I AM GUESSING that option one is the right tradeoff for this project — the icons are small and the resting style change is mild. If you disagree, redirect to option three.
