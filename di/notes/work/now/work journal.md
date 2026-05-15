# Session logs

Record work performed during chat sessions, in reverse chronological order.

---

## Session — 2026-05-14 — hover-name popup in the drawing area

A small white pill-shaped label now appears near the cursor when the user hovers over a part in the drawing area. The label shows the hovered part's name. It follows the cursor while the hover lasts and disappears as soon as the cursor leaves the part.

Three reactive sources came together to drive this with no new state: the existing hover-result store from the hit-test module, the existing global cursor-location store from the events module (updated on every mouse move), and the part's name from the hover result itself. The drawing-area component adds an absolutely-positioned overlay element whose visibility and position track those three sources.

The popup uses fixed positioning with the cursor's viewport coordinates plus a small offset (12 pixels right, 12 pixels down) so it does not sit directly under the pointer. Pointer events on the popup are disabled so it does not interfere with clicks below it.

Two refinements after first visual review. First, the popup did not appear when hovering over the already-selected part — the hover store had been deliberately nullified on the selected face. The mouse-move handler was changed to set the hover store unconditionally; the renderer already had its own guards against drawing hover highlights on the selected face, so the visual selection-vs-hover separation continued to work. Second, the code-debt entry had asked for the popup to be suppressed when the names-on-faces decoration was active, but on visual review Jonathan reversed that — the popup should appear regardless. The names-gating logic and its imports were removed.

Files: [Graph.svelte](../../../src/lib/svelte/main/Graph.svelte) — imported the events module, destructured the hover store and the cursor-location store, added the conditional popup element, added one CSS rule for the pill. [Events_3D.ts](../../../src/lib/ts/events/Events_3D.ts) — changed one line in the mouse-move handler so the hover store gets set even when the hovered face is the selected one.

Verification. svelte-check: 0 errors, 0 warnings. Visual: popup appears on any hovered part, follows the cursor, disappears on un-hover, also shows on the selected part, shows regardless of whether names-on-faces is active.

---

## Session — 2026-05-14 — drawing area split into three rows

The drawing area used to be a single full-bleed white panel with the canvas filling it edge-to-edge. The build button floated at bottom-left, a vertical guides slider floated at bottom-right, and the scaling slider lived up top in the main controls bar.

It now reads as three stacked rows. The top row has the accent color as its background and holds the scaling slider stretched across, centered. The middle row is the canvas — a white card with all four corners rounded. The bottom row also has the accent color as its background and holds the build button on the left and the guides slider on the right; the guides slider switched from vertical to horizontal.

A small gap, matching the standard layout-separator thickness, sits between each band and the canvas card so all four rounded corners on the card are visible.

The scaling slider moved out of the main controls bar entirely — its snippet, three responsive render sites, the related state and handlers, the unused import, and the leftover CSS rule are all gone there. The slider's state and handlers moved into the drawing-area component. The resize observer that drives canvas sizing now watches the inner canvas card instead of the whole region.

Files: [Graph.svelte](../../../src/lib/svelte/main/Graph.svelte) — restructured the template into a flex column with three rows; added scaling-slider state and handlers; observer rewired; new styles for the bands and the canvas card; the guides slider switched from vertical to horizontal; the build button and guides slider moved out of the canvas overlay. [Controls.svelte](../../../src/lib/svelte/main/Controls.svelte) — removed the scaling-slider snippet, all three render sites, scale-related state and handlers, the Slider import, and the leftover styling.

Verification. svelte-check: 0 errors, 0 warnings. Visual: three bands as designed, all four canvas corners visibly rounded, scaling slider on top, build button + horizontal guides slider on bottom.

---

## Session — 2026-05-14 — confirmation popup before any delete action

Every delete in the app now goes through a single shared confirmation dialog. Three call sites were rewired: the trash icon on a parts-table row, the trash icon on a givens row, and the keyboard Delete or Backspace key. Each one wraps its original action in a request to the shared confirm helper. The user sees a centered modal with a message naming what is about to be deleted, a "don't ask again" checkbox, and yes/no buttons.

Confirming with the checkbox flipped saves a persistent preference; future deletes skip the dialog and go through silently. Confirming without the checkbox leaves the preference unchanged. Cancelling — by clicking no, clicking the dark backdrop, or pressing Escape — closes the dialog without doing anything. Pressing Enter is shorthand for clicking yes.

The dialog is mounted at the top level of the main layout, sitting above everything else with a semi-transparent backdrop that absorbs clicks behind it.

Files: new manager [Confirm.ts](../../../src/lib/ts/managers/Confirm.ts) holding the request store and the ask/commit/cancel helpers. New component [Confirm.svelte](../../../src/lib/svelte/main/Confirm.svelte) rendering the dialog. [Preferences.ts](../../../src/lib/ts/managers/Preferences.ts) — added the skip-confirm preference key. [managers/index.ts](../../../src/lib/ts/managers/index.ts) — exported the new helper. [Main.svelte](../../../src/lib/svelte/main/Main.svelte) — mounted the dialog. [D_Parts.svelte](../../../src/lib/svelte/details/D_Parts.svelte), [D_Givens.svelte](../../../src/lib/svelte/details/D_Givens.svelte), and [Events.ts](../../../src/lib/ts/events/Events.ts) — three call sites now route through the helper.

Verification. svelte-check: 0 errors, 0 warnings. Visual: all eight scenarios (parts trash, givens trash, keyboard delete, Escape, Enter, backdrop click, "don't ask again" path, and reload persistence) confirmed.

---

## Session — 2026-05-14 — parts table selection and hover get a pill shape

The selected row in the parts table used to show its highlight as a flat-rectangle band stretching across the row. The hover state did the same. Both now show as pill-shaped bands with rounded outer corners — the same rounded look as the banners and slots above and below the table.

The trick is that table rows themselves do not respect border-radius, but individual cells do (and the table here already uses the separate-cells layout that makes per-cell radius possible). The selection background moved off the row and down to the cells; the leftmost cell rounds its left side and the rightmost cell rounds its right side. Same change applied to the hover state, with the existing not-while-hovering-an-icon clause preserved so the pill only appears when the row itself is showing the hover background.

The code-debt entry asked only for the selected state; Jonathan extended the work to the hover state on visual confirmation.

Files: [D_Parts.svelte](../../../src/lib/svelte/details/D_Parts.svelte) only — three new rules for the selection state, three new rules for the hover state. Existing flat-rectangle backgrounds were removed.

Verification. svelte-check: 0 errors, 0 warnings. Visual: selection highlight is a rounded pill, hover highlight is a rounded pill, both share the common-radius token used by the rounded banners in the same column.

---

## Session — 2026-05-14 — selection banner now disappears entirely when nothing is selected

The day before, the selection banner had a "disabled" state — when nothing was selected, the banner stayed visible reading "nothing selected" while the slot below it was suppressed. Jonathan reviewed and decided to simplify: the entire banner should just disappear when nothing is selected.

Two parts to the change. First, the disabled-state machinery on the Hideable widget was removed — the prop is gone along with the three behaviors it gated (early-return in the click handler, the slot-rendering guard, the hover-highlight CSS override). The widget is back to its simple form. Second, the selection Hideable in the details column is now wrapped in a conditional render: when nothing is selected, it does not render at all; when something is selected, it comes back.

Net effect: no special states. The banner either exists (something selected) or it doesn't (nothing selected). Simpler than the disabled approach.

Files: [Hideable.svelte](../../../src/lib/svelte/details/Hideable.svelte) — removed the `disabled` prop, the early-return in `toggle`, the `class:disabled` flag, the slot-render guard, and the two `.banner.disabled` CSS rules. [Details.svelte](../../../src/lib/svelte/details/Details.svelte) — removed the `disabled` attribute from the selection Hideable usage and wrapped it in `{#if $w_selection_name}`.

Verification. svelte-check: 0 errors, 0 warnings. Visual: banner vanishes when nothing is selected and reappears when a part is selected.

---

## Session — 2026-05-14 — selection banner finished, plus the rest of the code-debt session

Two pieces of work today.

First, the selection banner was finished. The three remaining sub-items collapsed into two changes. (1) The banner title now follows live typing in any of the three rename inputs — parts-list inline, selection-panel always-visible name, or the face-label drawn on the cube. All three inputs now write the typed text into the part's saved name on every keystroke (mirroring the face-label's existing sync behavior), so every UI that reads the saved name follows the typing live: the banner title, the parts-list row, the drawn face name. (2) When nothing is selected, the banner reads "nothing selected", does nothing on click or hover, and the slot under it hides — only the banner stays visible.

The path through the proposal pivoted once. The first plan added an in-flight rename text store on the parts module and routed the banner through it, with the goal of making the parts-list and selection-panel inputs write the saved name only on commit. Jonathan reviewed and said he wanted live updates throughout instead — the face-label's pattern applied to the other two, not the other way around. The in-flight store was ripped out and a small live-rename helper was added on the parts module instead. The helper writes so.name, re-emits the all-parts store, and re-emits the selections store — same three calls the face-label sync routine already does. Both rename inputs call the helper on every keystroke.

The disabled state on the banner is a new prop on the hideable widget. When set, it makes the click handler an early return, hides the slot regardless of the open-state flag, suppresses the hover-highlight via a CSS override, and changes the cursor to default. The selection banner passes the prop true when no selection exists.

A pre-existing use-before-declaration error in the details column was fixed along the way — the parts-leaf-count derived now sits above the parts-title derived that references it.

Files: [Parts.ts](../../../src/lib/ts/managers/Parts.ts) — added `live_rename` helper. [Hideable.svelte](../../../src/lib/svelte/details/Hideable.svelte) — added `disabled` prop with three gated behaviors plus CSS override. [Details.svelte](../../../src/lib/svelte/details/Details.svelte) — passed `disabled` to the selection hideable, fixed the pre-existing parts-leaf-count ordering. [D_Parts.svelte](../../../src/lib/svelte/details/D_Parts.svelte) and [D_Selection.svelte](../../../src/lib/svelte/details/D_Selection.svelte) — added one-line on-input handlers that call the live-rename helper.

Second, hook infrastructure got a major overhaul. The di project's settings file at `di/.claude/settings.json` had been silently inactive — the Claude Code extension only reads hooks from the workspace root, not from subdirectories. Evidence: the snapshot-before-edit hook had been writing to a directory that did not exist (it would have been created on first invocation). All five di hook entries (inject-always, snapshot-before-edit, check-ts, plus two new ones added today: bash-command-check for blocking npx and git-worktree, and banned-words-check plus phrase-check for catching vernacular and habit-pattern violations in assistant output) were moved into the mono root settings file. The di settings file was deleted to remove the duplicate registration. After a VSCode window reload, all the di hooks are now actually firing.

The two new Stop hooks (banned-words-check, phrase-check) catch specific words and phrase patterns in assistant text and force a rewrite when matched. Each turn logs one line per hook to `di/.claude/hooks/log.jsonl` recording timestamp, action, violations, and the tail of the scanned text.

Verification. svelte-check: 0 errors, 0 warnings throughout. Stop hooks run in ~0.3 seconds against the live transcript. Live rename verified visually for all three input paths.

---

## Session — 2026-05-14 — parse error fix in the details column

Tiny fix. The details component had an in-progress edit that left a stray semicolon inside a derived-value expression — the parser tripped on the semicolon since it sat where the closing paren of the expression belonged. Removed the semicolon.

The constants-merge proposal from yesterday's session became stale: the code-debt item that triggered it has been reorganized out of the file, so the proposal was dropped from the handoff without being applied.

Jonathan's own in-progress edits added a dynamic title to the selection banner (showing the selected part's name, or "nothing selected" when nothing is). The remaining sub-items under the selection-banner work — making the title react live during name editing, ignoring click and hover when nothing is selected, and auto-hiding the panel when nothing is selected — are the subject of today's proposal in the handoff.

Files: [Details.svelte](../../../src/lib/svelte/details/Details.svelte) — one-character fix (semicolon removed).

---

## Session — 2026-05-13 — axis indicator arrows moved to the frontmost corner of the most camera-facing face

One code-debt item, visually confirmed after three iterations.

The three small arrows that label X, Y, and Z directions used to draw on the three BACK-facing planes of the box (the planes tucked behind the model). They now draw on the face — front-facing or back-facing — whose normal is most aligned with the camera direction in absolute value, anchored at THAT face's own corner closest to the camera.

The path to that final form took three rounds.

Round one: flip the front-vs-back tests in three spots so the arrows draw on the front-facing planes instead of the back ones. Local variables renamed from "back" to "front", and the file-top comment updated to match. Worked, but on tumble Jonathan noticed the arrow anchors were near the back-most corner of each face, not the front-most.

Round two: flip the "which end of the face's edge" pick so it lands closer to the box's front-most corner instead of farther from it. The perp-edge pick was also flipped to favor the perp side near the front-most corner instead of the outermost-on-screen side. Better, but in some orientations the X arrow appeared nearly edge-on — its front-facing face was barely front-facing, while the opposite back-facing face was much more face-on.

Round three: drop the "front-facing only" filter and rank candidate faces by the absolute value of the forward-pointing component of their normal. A back-facing face is now eligible when it's more face-on than any front-facing candidate. Initial cut anchored at the corner closest to the box's front-most corner, which for a back-facing face placed the arrow on the FAR side of the box (the corner directly under the box's front-most corner sits at the back of a back-facing face). Final cut: for each picked face, walk the four corners, rotate each by the tumble orientation, and anchor at the corner whose rotated forward-component is largest — i.e., the face's own corner closest to the camera. For front-facing faces this is the same corner as before; for back-facing faces it is now the visible corner of that face, not the hidden one.

Files: [R_Axes.ts](../../../src/lib/ts/render/R_Axes.ts) only.

Verification. svelte-check: 0 errors, 0 warnings. Visual: arrows land on the most face-on plane for each axis and anchor at that plane's front-most corner across tumble.

---

## Session — 2026-05-12 — banner-appearance reversal tried and reverted

One code-debt item explored and decided against.

The code-debt item asked for banners to reverse their appearance (including hover) when their section is open. We implemented the simplest version: hide the gradient overlay when open (banner appears flat light), bring it back on hover. Two CSS rules added to the hideable component.

After visual review, Jonathan decided the reversal was not an improvement — it removed the at-rest visual cue and made open banners look less anchored. Reverted the change.

Files: [Hideable.svelte](../../../src/lib/svelte/details/Hideable.svelte) — reverted to the original stylesheet (no functional change).

Decision logged in [code.debt.paid.md](../done/code.debt.paid.md) so the item does not resurface.

---

## Session — 2026-05-12 — user-guide "← Back" text button swapped for the reusable circular-X widget

One code-debt item, visually confirmed.

The user-guide overlay's top bar used to carry a small "← Back" text button on the right. It now carries the same circular-X widget that the build-notes overlay already uses. The hamburger stays on the left. The widget sits inside the top bar, anchored at its right edge, vertically centered. Hovering inverts its fill colors; clicking dismisses the overlay.

How. The user-guide overlay imports the reusable close-button widget and places it inside the top bar. The top bar got "position: relative" so the absolutely-positioned widget anchors to it. The bar's right padding (which had been stripped earlier to line up the old text button with the help button's right edge in the main view) was restored to symmetric padding. The text button's stylesheet rules were removed because nothing else uses them.

Jonathan tuned the widget's size to match the hamburger height (using the same shared button-height value) and pulled it tight to the corner — one pixel in from the top and right — so it visually balances against the hamburger.

Files: [UserGuide.svelte](../../../src/lib/svelte/main/UserGuide.svelte) only — imported the widget, swapped the text button for it, restored symmetric bar padding, added "position: relative" to the bar, dropped the unused text-button stylesheet rules.

Verification. svelte-check: 0 errors, 0 warnings. Visual: circular X at the right end of the top bar, vertically centered, hover inverts colors, clicking closes the overlay.

---

## Session — 2026-05-12 — guides slider moved into the drawing area as a vertical control

One code-debt item, visually confirmed.

The small grid-opacity slider used to sit at the top of the screen in the main controls bar, with a small "guides" label next to it. It now lives inside the drawing area itself, docked at the bottom-right corner, running up-and-down. The word "guides" sits horizontally directly below the slider. The slider's visual look — thin track, small round thumb — is unchanged from the horizontal version. Value 0 sits at the bottom, max at the top.

To make this work, a new optional vertical mode was added to the shared slider component. When that mode is on, the outer box swaps its width and height (slim and tall instead of long and short), and the inner range input is rotated a quarter-turn counterclockwise with CSS. The drawing-area component now hosts the slider plus the label in an absolutely-positioned column in the bottom-right corner. The old slider, its three render calls (one per responsive layout), its handler, the label styling, and the unused store import were all removed from the main controls bar.

Two gotchas worth keeping. First attempt used the browser's built-in vertical-writing setting on the range input. That produced the wrong look: the styled thin track and small round thumb were lost, the browser fell back to its default vertical-slider chrome. Switched to a CSS rotation of the input element instead — the rotation preserves the original styling exactly, just flips orientation. Second issue surfaced after that: the slider had height zero in vertical mode. Cause: the input element carried an inline style attribute setting "flex grow" and "position relative" — inline styles win over stylesheet rules, so the vertical mode's "position absolute" never took effect, and the input collapsed. Fix: the input's inline style is now conditional on the vertical flag — vertical mode emits a minimal style that does not fight the stylesheet's positioning.

Files: [Slider.svelte](../../../src/lib/svelte/mouse/Slider.svelte) (new vertical mode for single-thumb sliders via CSS rotation; input's inline style is conditional on vertical so the rotation's absolute positioning is not overridden); [Graph.svelte](../../../src/lib/svelte/main/Graph.svelte) (vertical guides slider with horizontal "guides" label, anchored bottom-right); [Controls.svelte](../../../src/lib/svelte/main/Controls.svelte) (guides slider snippet, three render calls, handler, store import, and related CSS removed).

Verification. svelte-check: 0 errors, 0 warnings. Visual: slider sits in the bottom-right of the drawing area, runs vertically, drags update the background grid opacity, label reads horizontally below the slider, main controls bar no longer carries the slider at the top.

---

## Session — 2026-05-11 — help and return-to-app buttons docked at the right edge, face buttons highlight from first paint

Two code-debt items, both visually confirmed.

First item: button placement. The round question-mark button in the main toolbar used to sit on the left right after the hamburger; it now sits at the far right of the toolbar in all three responsive layouts (phone-wrap, mobile-wrap, desktop). The hamburger stayed on the left. In each layout the help button was lifted out of its old spot and dropped in as the last child of the row, after the trailing flexible space. The "← Return to Design Intuition" button at the top of the user-guide page used to sit on the left right after its own hamburger; it now sits at the far right of that page. Two small style tweaks were needed to make the return button's right edge land at the same screen position as the help button's right edge in the main view: the user-guide bar's right padding was removed, and a leftward offset baked into the button's styling was stripped.

Second item: face buttons at launch. None of the six face buttons (bottom, top, left, right, back, front) showed as highlighted when the app started, even though the saved view points at a definite face. Cause: the number that tracks "which face is facing you" starts as "nothing", and the routine that would update it depends on geometry data built during drawing. At startup the routine fires once BEFORE the first paint, finds the data missing, and stashes "nothing yet" as the last seen value. After the paint clears the dirty flag, the routine never gets another chance. Fix: a tiny pure helper computes which face is facing you directly from an orientation — apply the inverse of the orientation to the camera-forward direction, then read off which of the resulting vector's three components has the largest absolute value (which names the axis) and the sign of that component (which picks the face on that axis). At app start, the helper is called once with the orientation that just loaded from saved preferences, and the highlight is set. The tick loop continues to update during tumbles after that.

Friction during the second item. The proposal walked through three framings before landing on the right one. First framing imagined an order swap in the tick loop so the front-most-face routine ran AFTER the paint instead of before. The user redirected to the simpler approach: don't read the cache at all, derive the answer from the orientation directly. Second framing then over-described the math as "rotate each of the six fixed face arrows by the orientation and pick the largest Z". The user pushed back — the math is trivial, no loop, just dot products. The final form is what landed: one library call to transform the camera-forward direction by the inverse orientation, then a max-of-three with a sign check. Five lines.

Files: [Controls.svelte](../../../src/lib/svelte/main/Controls.svelte) (help button moved to the right end of all three layouts); [UserGuide.svelte](../../../src/lib/svelte/main/UserGuide.svelte) (return button anchored at the right edge, bar's right padding removed, leftward button offset stripped); [Hits_3D.ts](../../../src/lib/ts/events/Hits_3D.ts) (new pure helper `front_most_face_from_orientation` alongside the existing front-most-face routine); [Engine.ts](../../../src/lib/ts/render/Engine.ts) (one-shot call in setup, right before the animation loop starts).

Verification. svelte-check: 0 errors, 0 warnings. Visual: both button moves confirmed; face buttons highlight from the very first paint and match the loaded view.

---

## Session — 2026-05-11 — seven red browser-driven tests rewritten against the painted-pixel silhouette, grid and axes suppressed during print, pre-existing Playwright URL-resolution blocker surfaced

Carried the seven-test rewrite proposal from the handoff to done. The proposal had been written earlier, the user chose the "suppress the grid" option for test six, and asked to implement.

The renderer side first. Rule 66 says the background grid and the origin axes are not painted during print, so the canvas of an empty scene stays transparent and so a heavily-decorated scene shows just the picture itself on the printed page. Render.ts already had a print-mode flag for the dashed wireframe; the same flag now gates render_back_grid and render_axes. A duplicate `is_print` declaration that crept in during the first hop was collapsed to a single declaration at the top of the render() method.

The test side. Three new helpers added to the spec file: read_painted_silhouette walks the canvas pixels and returns the bounding rectangle of non-transparent pixels (the same shape the production handler computes); expected_transform_from_silhouette runs the production fit-and-centre math against a known silhouette in drawing-pixel coordinates; setup_for_pixel_silhouette opens the test page, runs a caller-supplied scene-setup callback, activates print media (which fires the renderer's print-mode flag and triggers the production handler via the matchMedia listener), and waits for layout-and-paint to settle. Then the seven tests were rewritten one by one. Test one — single box — sets up the scene through the helper, reads the painted silhouette from the canvas, derives the expected transform, compares to the actual. Tests two through five follow the same shape. Test two (two boxes) keeps the sanity check that the two-box scale is smaller than the one-box scale. Test three (off-frame box) now asserts that the silhouette stays inside the canvas drawing surface — that is the painted-only-what-is-visible claim. Tests four and five compare the with-extra-but-suppressed silhouette to the ALPHA-only silhouette pixel-bounds, then verify the resulting transform. Test six (empty scene) now passes because rule 66 makes the canvas truly empty during print; the handler returns early and the canvas stays untouched. Test seven (the diagnostic) was deleted — the silhouette-stability test already covers determinism, and the projection-based comparison no longer matches the painted-pixel contract. The two now-unused helpers from the old corner-projection era, corners_of and expected_transform_for, were removed alongside the vec4 import that only they used.

When I first tried to verify the rewrites end-to-end, every test failed with "Cannot navigate to invalid URL". I traced it through the runner's source: the address-stitching helper merges the path argument with the configured base address by feeding both to the standard URL constructor; if the constructor throws (which happens when the base address is missing), the helper returns the path unchanged, and the browser then refuses to navigate to a bare path. So the base address was reaching the runner as missing. I then ran the runner with the `--list` flag, no other arguments, and the output named unit-test files from `src/lib/ts/tests/` — files that are not in the configured tests directory. That ruled out the config being read at all. The cause was operator error on my part: invoking the runner directly while inside `e2e/` shifted Yarn back to the project root and the runner found no nearby config. The project already has a `yarn e2e` script that points the runner at the right config; using that script makes the smoke test pass and the runner picks up exactly the right specs. No code change needed.

With the runner invoked correctly, the six rewrites still failed for real reasons that took five rounds of bisecting to peel apart. Round one: the renderer was not redrawing when print media activated, so grid and axes pixels from the on-screen render stayed on the canvas. Fix: the renderer now subscribes to print-media changes and flags the canvas out of date on every flip. Round two: even with the redraw firing, the empty-scene test still picked up a thousand opaque pixels. Bisecting the render method by pixel-count probes between phases showed the selection-feedback step was painting dots from a stale selection that survived clear_scene. Fix: selection and hover dots are gated on print media along with grid and axes — every UI helper is now suppressed during print. Round three: the print handler's CSS transform from its first stale-pixel read was persisting when the second clean read found no silhouette. Fix: the handler now clears the CSS transform when nothing is painted. Round four: the painted-scene tests now showed a non-null silhouette but no box pixels at all. SOs added via the test write-hook had no faces, so the solid-mode renderer (which paints by face, not by edge) had nothing to draw. Fix: the test hook now attaches a cube's twelve edges and six canonical-winding faces to every SO it creates. Round five: ALPHA's vertices were projecting at twice their world coordinates because the test hook called set_bound before wiring the SO's scene reference, so bounds were stored as absolute, then read back as parent-relative-plus-stored = doubled. Fix: the hook now wires the scene reference first, then sets bounds. Along the way I also added test hooks for orientation, scale, and decorations so the test setup can reset every store that affects projection, and rewrote tests two, four, and five to use an invisible ROOT container so the renderer's "centre the root SO at canvas origin" behaviour positions the test boxes within a shared frame.

A real-browser visual pass turned up three more issues. First, hover and selection dots showed up on the printed sheet even after the gates were added. The cause: the print event fires before the print media query flips on, so the canvas the print handler read still had the on-screen render with helpers on it. Fix: the print handler now asks the renderer for a fresh, synchronous, helper-suppressed paint before reading the canvas. Second, the colour and bolded thickness applied to the part the cursor was on (or that was selected) also showed up on the printed sheet — the edge-drawing code styles selected and hovered parts with bold strokes and a hover colour, and that path was not gated on print. Fix: edges drawn under print mode use the regular stroke colour and the regular line width regardless of selection or hover. Third — and this took the longest to find — after a series of source-file saves during the session, clicks on a part were running the click-on-background deselect branch on mouse-up. The probe showed mousedown finding the part correctly but mouseup seeing no drag target. The cause: every hot reload during the session ran the canvas setup again, and the setup attached a fresh mouseup listener without removing the previous one. On mouseup, all the accumulated listeners ran end_drag in turn — the first run cleared the drag target, the next runs found no target and triggered the deselect-by-root branch. Fix: the setup now keeps a reference to each listener it attaches, removes the previous one before attaching a new one, and does the same for the print-media subscription the renderer added.

Files: [Render.ts](../../../src/lib/ts/render/Render.ts) (grid, axes, and root-bottom helper gated on print media; selection and hover dots gated on print media; edge stroke colour and width ignore selection and hover under print media; renderer subscribes to print-media flips and flags itself out of date — and now removes the previous subscriber before adding a new one; a new method paints synchronously under a print-mode override flag so the print handler reads clean canvas pixels; the three is_print declarations collapsed to one); [App.svelte](../../../src/App.svelte) (print handler asks the renderer for a synchronous print-mode paint before reading the canvas, and clears the CSS transform when no silhouette is found); [Events_3D.ts](../../../src/lib/ts/events/Events_3D.ts) (the canvas setup now records each mouse listener and removes the previous one before attaching a new one, so hot reloads and scene switches don't accumulate duplicates that would otherwise cause mouseup to deselect through the click-on-background branch); [Debug.ts](../../../src/lib/ts/common/Debug.ts) (test write hook now wires scene reference before bounds, attaches faces alongside edges, and exposes set_orientation, set_scale, set_decorations); [print-notifications.spec.ts](../../../e2e/tests/print-notifications.spec.ts) (setup_print_page resets orientation, scale, and decorations; setup_for_pixel_silhouette waits long enough for the renderer to redraw under print media and re-fires the print event so the handler reads the settled canvas; tests two, four, and five now use an invisible ROOT container; three new helpers; one diagnostic test deleted; two old corner-projection helpers removed); [stipulations.md](../../guides/project/development/stipulations.md) (rule 66 broadened to cover every UI helper, including hover and selection dots, and to mention the renderer's repaint on media flip); [handoff.md](./handoff.md) (the seven-test proposal removed, no new open items).

Verification. svelte-check: 0 errors, 0 warnings. Unit tests: 680 pass. E2e: 23 of 23 pass — every test in every spec file. Visual confirmation: the printed sheet shows just the picture, hover and selection feedback do not appear on it, and clicking parts in the editor selects them and keeps them selected through mouseup.

---

## Session — 2026-05-11 — print polish, vernacular cleanup, details column reshaped as pills

A continuation arc out of the print fix. Several pieces of related work, all driven by code-debt items and one-line user asks.

Print pipeline polish. A half-inch default margin on every side of the printed sheet, done via body padding plus border-box sizing rather than via the page-area margin rule — the page-area rule was inconsistent across browsers, the body-padding approach applies uniformly. The 2D drawing context now opts in to fast pixel readback, so the print silhouette scan is cheap on the actual print event. The dashed wireframe that the renderer draws for invisible objects is suppressed during print, so helper bounds do not appear on the printed sheet. A new rule 65 in the catalog states the default half-inch margin. The rule-63 prose was updated to say the drawing area fills the printable area (page minus margin) rather than the full page. Tests for rules 63 and 65 pass.

Vernacular bans. Three rounds of banned-substitution rules went into the vernacular file. First, "ship" in both senses — use "done" / "complete" for finished work, "write code" for the act of producing or submitting code. Second, "land" in both senses — use "add" / "insert" / "write" / "update" for content arrival, "do" / "perform" / "can be done" for action completion. Third, "absorb" in any sense — use "place" / "include" / "inserted" instead. After the rules went in, a full sweep through every notes prose file replaced "land" / "landed" / "lands" / "landing" everywhere outside the vernacular file's own rule statement. About 120 instances reduced to zero. Two test names in source code that used the word were also rewritten, plus their stipulations references, so the strings still match.

Two new entries in the di learn file. Entry four says to wire diagnostics and read them before writing more code, especially for fixes that need real-browser confirmation; entry five says confidence levels are set too high and the bar for writing code should be real data plus a short verifiable reasoning chain. Both cite the print arc as the case study. The vernacular file mirrors these two entries plus the three earlier ones (don't act on guesses, stop speculating about what's on screen, never pad a pac) under a working-discipline section, so the vernacular file doubles as a one-stop reference for collaborator discipline.

CLAUDE-file infrastructure. The mono-root CLAUDE file and the di-project CLAUDE file were both updated to spell out two learn files at session start — one at the mono root for cross-project mistakes, one at the di project's notes folder for project-specific mistakes. The mono CLAUDE file's old path that pointed at the wrong learn-file location was corrected.

Details column reshaped. Two code-debt items addressed. First: the empty area below the last visible panel was painted accent (then briefly reverted to regular background after a misread of the ask, then put back at the user's request). Second: a background-coloured "lip" pseudo-element with rounded top corners that sat at the end of banner-zone was removed, so the accent area reaches the bottom of the last panel on a flat edge. Then the design revision: every element in the column is a div sharing the same corner-radius and the same width, with margins zeroed and 5-pixel gaps applied via flex on both the hideable container (banner-to-slot) and the banner-zone container (hideable-to-hideable). Two visibility flavors — banners always shown, hideable shown only when the banner says so. Same look as before, simpler structure. A self-acknowledged guess (a flatten-bottom-corner rule on the last hideable) was caught by the user and removed; the lesson is captured in the work journal and learn file.

Handoff trim. The handoff went from 101 lines to roughly 50. Removed two superseded proposals (the older "accent below the last hideable" proposal and the older pill proposal with three open questions), the duplicated print-rule-39 open-items bullet, the "bundled work" paragraph from the test proposal, the no-cons line, and the test-plan sentence on the pill proposal. The remaining content: open items plus the rewrite-the-seven-red-tests proposal plus the simple pill proposal.

Files: [App.svelte](../../../src/App.svelte) (body-padding margin, dashed-wireframe suppression, no diagnostic logs); [Render.ts](../../../src/lib/ts/render/Render.ts) (willReadFrequently on the 2D context, print-mode skip on the dashed-wireframe phase); [Details.svelte](../../../src/lib/svelte/details/Details.svelte) (banner-zone is a flex column with 5-pixel gap, accent background on the column, pseudo-element fillet gone); [Hideable.svelte](../../../src/lib/svelte/details/Hideable.svelte) (hideable is a flex column with 5-pixel gap, banner and slot margins both zero); [stipulations.md](../../guides/project/development/stipulations.md) (rule 65 added, rule 63 prose refined); [vernacular.md](../../guides/project/development/vernacular.md) (three new banned-substitution rows plus a working-discipline section); [learn.md](./learn.md) (entries four and five); [handoff.md](./handoff.md) (trimmed); [mono CLAUDE.md](../../../../CLAUDE.md) and [di CLAUDE.md](../../../CLAUDE.md) (cross-project learn paths spelled out).

Verification. Tests: 20-of-23 e2e green; six rule-39 corner-projection tests still red (tracked as the open follow-up in the handoff). Visual: print preview shows the picture filling the page along the limiting side, centred on the other, with a half-inch white border. Details column visually unchanged from before the pill restructure — same look, simpler innards.

---

## Session — 2026-05-10 — print pipeline brought to completion, silhouette computation re-anchored on painted pixels

Spent a long arc on the print feature, eventually arriving at a working solution after several wrong turns. The final result: the printed page now shows the picture correctly filling the page along its limiting side and centred on the other side, in the real browser, on the user's actual scene. Visually confirmed.

How the bug presented. The picture was small in a corner of the page. Several rounds of fixes shifted the picture around but did not fix the underlying issue. Each round looked plausible on paper but failed against the real browser.

The first wrong turn — animation-frame defer. The print handler was reading the canvas's CSS dimensions when the print event fired, but the print stylesheet had not yet resized the canvas to the page area. The handler computed a transform for the on-screen size and the canvas was bigger by the time the printer captured. Adding a one-frame delay didn't help; the canvas still hadn't resized. The fix was a guess, didn't pin behaviour, and didn't work.

The second wrong turn — resize observer. Watching the canvas for size changes and re-applying the transform on every change. This was correct in principle but didn't fix the visible bug, because the canvas wasn't actually being told to grow to the full page area in the first place. Another guess.

The third turn — body-height anchor. The user provided a diagnostic log of every container's height during print. The chain from html down to the canvas showed: html and body were the page area, but the next div (the application's mount point, an unnamed div in `index.html`) had collapsed to zero height. The fix added `html, body, #app { height: 100% }` to the print stylesheet. The chain now resolved all the way down. The picture became centered, but stayed too small.

The fourth turn — leaf filter. The silhouette computation was including parent containers whose own bounds extended past their visible content, pushing the silhouette to canvas edges via the post-loop clamp. Filtering to leaves only (objects with no visible descendants) reduced the silhouette but not enough — the user's scene still had leaves whose corners projected to extreme pixel positions because they sat near the camera plane.

The fifth turn — softer threshold. Skipping projections more than five canvas-widths past the canvas edge. Fixed nothing for the user's scene; pushed the silhouette to the right half of the canvas instead of the full canvas. Still small.

The wedge break — pixel scan. The user finally pushed back hard: stop guessing, derive what stipulations and tests are missing. The honest answer: the rule said "smallest rectangle containing every visible block's projection" but what the user actually wanted, and what the rest of the print math assumed, is the bounding rectangle of the painted content. Those two things diverge for perspective scenes because the renderer clips lines and shapes at the camera's near plane and the canvas edges before painting; the silhouette computation walking world-space corners was unaware of this clipping. The rule was based on a false premise and the implementation that followed could never produce what the user wanted on a complex scene.

The fix that was done. Replace the silhouette computation with a direct read of the canvas's painted pixels: walk every pixel, find the bounding rectangle of non-transparent pixels, return that as the silhouette. Bypasses all the projection-math edge cases. The painted pixels are what the printer actually captures, so the silhouette derived from them is by construction the right rectangle to fit to the page. Visually confirmed in the user's real browser on the real scene: picture fills the page along the limiting side, centred on the other.

What was added to the catalog. Two new rules earlier in the same session for the body-height fix (rule 63: drawing area's CSS box fills the page on both directions during print; rule 64: body height equals the page area's height during print). Rule 39's prose was rewritten to match the painted-pixel approach: silhouette is the smallest rectangle containing every painted pixel of the picture, not the smallest rectangle containing every projected corner.

Production code now. The compute-silhouette function does a getImageData call against the 2D canvas, walks the pixel data, and returns the bounding rect of non-transparent pixels. The fit-and-centre math is unchanged. The diagnostic logs that filled the console during the debug arc have been removed.

Open follow-ups. Six of the existing browser-driven tests for rule 39 were written against the corner-projection contract and now fail against the painted-pixel rule. They need to be rewritten to read canvas pixels and compute expected silhouette from those, or replaced with sanity-checks that pin the new contract. Not done in this session; the production code and the catalog are correct and the visual confirmation is in hand, so the test debt is logged here for the next pass.

Files: [App.svelte](../../../src/App.svelte) (compute_silhouette rewritten as pixel scan, diagnostic logs removed, html/body/#app height anchor added to print stylesheet); [stipulations.md](../../guides/project/development/stipulations.md) (rule 39 prose rewritten; rules 63 and 64 added); [working features.md](./working%20features.md) (adherence row updated to 64 rules total).

Verification. Visual: the print preview in real Chrome shows the picture filling the page along its limiting side, centred on the other. Tests: the structural tests (rules 61, 63, 64, the centring rule, the diagnostic) all pass; six rule-39 tests need rewriting against the painted-pixel contract and are tracked as follow-up.

Post-print cleanup. After the print work was done, three meta-changes followed in the same session. First, two new entries went into the di project's learn file capturing the lessons of the print arc: entry four says to wire diagnostics and read them before writing more code, especially for fixes that need real-browser confirmation; entry five says confidence levels are set too high and the bar for writing code should be real data plus a short verifiable reasoning chain. Second, the vernacular file got a new banned-substitution entry: never use the verb "ship" in either sense; write "done" or "complete" for finished work and "write code" for the act of producing or submitting code. The corresponding memory file was extended to cover both senses. Third, the mono root CLAUDE file and the di project CLAUDE file were both updated to spell out two learn files at session start — one at the mono root for cross-project mistakes, one at the di project's `notes/work/now/learn.md` for project-specific mistakes — and the mono CLAUDE file's old path that pointed at the wrong location was corrected.

Files (post-print): [learn.md](./learn.md) (two new entries about evidence and confidence); [vernacular.md](../../guides/project/development/vernacular.md) (new "write code" verb entry and banned-substitution row); [mono CLAUDE.md](../../../../CLAUDE.md) (cross-project learn path added, di learn path corrected); [di CLAUDE.md](../../../CLAUDE.md) (new LEARN: line pointing at both files).

---

## Session — 2026-05-08 (continued) — silhouette-based print scaling via corner projection

After the print-stylesheet first cut was done, the printed page showed the drawing centred but small — the drawing area scaled to the page, but the picture inside the drawing area only occupied a sub-rectangle of the surface, and that sub-rectangle stayed small after the surface fit the paper. The next pass scaled to the picture's silhouette instead of to the drawing surface.

The proposal at the time. The drawing surface is a rectangle whose pixel dimensions match the on-screen drawing area. Inside that rectangle, the picture itself (the projected scene with its lines, faces, and labels) occupies some sub-rectangle, surrounded by background. The current print rule scaled the whole rectangle to the page, so the sub-rectangle ended up scaled by the same factor as the empty room. What was needed: two extra numbers — how much bigger to scale (so the silhouette, not the drawing surface, filled the page) and how much to slide left or up (so the silhouette was centred on the page rather than offset by the empty room).

Three ways were considered. Project the corners of every smart object through the camera — fast, exact, no rendering needed. Scan the picture pixels of the drawing surface — slower, but engine-independent. Move the camera to frame the silhouette and re-render — most code, most quality, most engine touching. The recommended path was option one: corner projection.

What was done. A small handler runs once just before the print preview is built. It walks every smart object in the scene, takes each object's eight world-space corner points, runs them through the camera's view-and-projection matrices, and converts each result to a pixel coordinate on the drawing surface. The smallest rectangle that contains all those projected pixel coordinates is the silhouette. The handler computes a scale factor (the largest factor that still fits the silhouette inside the page area while preserving aspect ratio) and a slide offset (so the silhouette's centre lines up with the page's centre) and applies a single transform to the drawing surface. When printing finishes, a second handler clears that transform.

The print stylesheet was also told to crop anything that extends outside the page area, and to pin the drawing surface at its native pixel size with no auto-fit. The handler's transform then does all the scaling and positioning in plain pixel space.

A separate patch was needed for an initial print-blank issue. The first cut of the silhouette work used auto-sized dimensions on the drawing surface during print, which collapsed it to nothing in some browsers and produced a blank page. The patch pinned the drawing surface to its own pixel dimensions before applying the scale-and-translate transform, and computed the transform from those pixel dimensions rather than from the surrounding region.

Files: [App.svelte](../../../src/App.svelte) (silhouette handler and print-event listeners added to the script; canvas pinned to native pixel size in the print stylesheet).

I AM GUESSING that this two-step approach (silhouette fills drawing surface, drawing surface fits page) leaves a small margin around the silhouette when the page aspect differs from the drawing-surface aspect, since the drawing surface is letterboxed inside the page. The follow-up that fixed that and several other bugs is described in the 2026-05-10 session entry.

---

## Session — 2026-05-08 — print stylesheet first cut: hide chrome, let the drawing area fill the page

First pass on the print feature. When the user printed the page (the keyboard print shortcut, or "save as PDF" through the system print dialog), they got whatever the browser captured of the live screen — the side column with all its banners, the top strip with the menu and edit and save buttons, and the graph squeezed into whatever space was left over. The goal was for printing to produce just the drawing area, by itself, scaled up to fill the printable area of the chosen paper size.

Two paths were on the table. A print stylesheet — add a small block of styles that only apply when the browser is printing, that hide the top strip and the side column, make the drawing area fill the page, and ask the browser to skip page margins. The browser does the rest. Smallest possible change. The drawback: the drawing surface keeps the same pixel dimensions it had on screen — meaning at print resolution it would look softer than the actual screen rendering, especially on high-resolution print output. Or a print button that re-renders the graph at print resolution into a fresh off-screen drawing surface — cleaner output, more code, more places to break, and it would touch the rendering engine, which was being rewritten at the time.

The path chosen was the print stylesheet. Smallest change, does the feature today, gives the user a usable result immediately.

What was done. A print-only block of styles at the top of the app's global styles. When the browser is printing (or the user is "saving as PDF" through the print dialog), the top strip with the menu and buttons is hidden, the side column with the detail panels is hidden, the small overlays inside the drawing area (the build button, the breadcrumbs trail, the status strip at the bottom) are hidden, the outer page frame loses its fixed positioning and padding so it can flow into a normal page, and the drawing area expands to fill the entire printable region of the chosen paper. The drawing surface inside the drawing area is told to scale to fit while preserving its aspect ratio, so the picture is not stretched out of shape — if the paper is a different shape than the drawing surface, the surface fits inside with a thin band of white on the long sides rather than warping. The page margins are pulled to zero in the same block so the drawing fills edge to edge.

Files: [App.svelte](../../../src/App.svelte) (print-only block added to the styles section).

I AM GUESSING that the printed lines may look softer than the on-screen lines because the drawing surface keeps its on-screen pixel resolution and scales up — this is the documented drawback of the simple option chosen here. If the softness bites, the follow-up path (a separate print action that re-renders the scene at print resolution into a fresh off-screen surface) was described in the proposal above and remains untouched by this work.

---

## Session — 2026-05-09 — stipulations vocabulary refresh, redundant rule removed, file renumbered end-to-end

The catalog of load-bearing rules was overhauled to retire the old "cell" / "value" wording in favor of "attribute", "field", "SO", and "formula" — the words the rest of the project now uses.

Driver document. Jonathan dropped a small spreadsheet in the active-work folder listing every rule that needed a new short name, a new word, or both. The spreadsheet had a few rules listed twice with conflicting instructions; the second entry was treated as the final word in those cases.

What changed in the catalog. Seven rules got new short names: the three flavours-of-attribute rules (plain number, locked number, formula-driven), the "a change to one slot never quietly changes a slot on a different smart object" rule, the "named values can be referenced by formulas" rule, the "an error written on a rule stays put until cleared" rule, and the "changing precision snaps every plain-number slot to the new grid" rule. Eight rules got plain-English wording swaps: "cell" became "attribute" or "SO" or "formula" depending on the rule's subject, and "value" became "attribute" where the spreadsheet asked for it.

One rule was removed. The "a locked named value is protected from reverse propagation" rule was identified as redundant — the more general "a locked slot is protected from reverse propagation" rule already covers the same ground.

End-to-end renumber. After the removal and the section reordering Jonathan did during the pass, the rule numbers were a tangle (gaps, duplicates, misaligned headings). Walked the whole file top to bottom and renumbered every rule so the sequence is now 1 through 62 with no gaps and no duplicates.

Header coverage line refreshed. Now reads: fifty-eight of sixty-two rules are directly covered. Fifty-four are pinned by unit tests; four are pinned by browser-driven tests. The remaining four (the drawing-silhouette rule plus the three printing rules) are not yet test-backed.

Stale references chased down. The rule-name list lives in two places: the catalog itself and the per-test-file index in `testing.md`. Eight bullets in the test-file index referenced old short names; all updated to the new names. The "locked named value is protected" reference in the test-file index was removed when its rule was removed. A grep across the whole project (notes, source, browser tests) confirmed no other docs or code held onto the old names.

Cleanup the linter flagged. Two paste-artifact tails on rule pointer lines were removed; two pointer lines that were missing their closing markdown link bracket were closed; one Preferences-layer pointer was pointing at the wrong source file (the algebra constraints file) and was redirected back at the preferences manager. Two double-blank-line gaps the linter flagged were collapsed to single blanks.

The driver spreadsheet was deleted by Jonathan once the renames were done. No notes or code linked to it, so nothing broke.

Verification: grep for every old short name across the whole repository returns no matches outside the (now deleted) spreadsheet. Type-check and tests not re-run since this pass touched only documentation.

Files: [stipulations.md](../../guides/project/development/stipulations.md) (renames, prose swaps, redundant rule removed, renumbered, header refreshed, link tails repaired); [testing.md](../../guides/project/development/testing.md) (eight short-name updates, removed reference, coverage summary refreshed); [working features.md](./working%20features.md) (adherence row updated to 58 of 62 with TBD callout).

---

## Session — 2026-05-07 (continued, second) — parts row height stays constant during inline rename

When the user clicked a part name in the parts list and the row went into edit mode, the row used to grow a few pixels taller than its neighbours. The fix needed five passes before it actually held.

**Pass one — lock the row.** Set the row to a fixed height taken from the cell-height value the project already uses elsewhere. The bug shrank but did not disappear. A row's height in a table is treated as a minimum, not an absolute — so the row was honoring the locked value as a floor and then stretching upward to fit a still-too-tall input.

**Pass two — lock the input.** Apply the same cell-height value to the input itself. The input now had no slack to stretch with. The bug shrank further but the row was still a hair taller during edit.

**Pass three — push the focus ring inside the input.** I had blamed the focus halo (a thin ring drawn around the input). Rendered outside the input's box, the ring extends a couple of pixels above and below — looks like a height gain even though the layout is unchanged. Pushed the ring inward so it draws inside the input. No improvement to the actual measured height. The halo theory was wrong.

**Pass four — zero the cell padding.** The two cells holding eye icons in the same row had their padding zeroed out long ago, but the cell holding the part name did not. So the name cell carried the browser's default vertical cell padding, which wrapped the input with a small extra band of space on top and bottom. Zeroed that padding to match the eye cells. Got better, but the editing row was still a tiny bit taller.

**Pass five — change the input from inline-block to block, lock its line-height to the cell height, and turn off platform-rendered widget styling.** A text input is by default inline-block, which means it participates in the parent line's calculation. The line is allowed to grow to fit any inherited line-height plus the input's own height — which can be taller than the input box itself. Switching the input to block removes it from the line entirely. Locking line-height to the cell height kills any internal stretching. Turning off the platform-default appearance overrides any browser-reserved extra room for native form-widget chrome.

After all five passes, the editing row holds the same height as its neighbours.

A separate change was done alongside, in the constants file. The cell-height value used to be the common size multiplied by half — for the project's common size of 33, that came out to a half-pixel value of 16.5. Half-pixel sizes are a common source of off-by-one rendering bugs because the browser has to round them. Wrapped the expression with a rounding step that always rounds up, so the value is done on a whole pixel (17). The change ripples through every place that uses the cell-height value — most visibly the always-visible name editor in the selection panel — by half a pixel.

Lessons worth carrying forward.

- Locking a table row to a height keeps it from shrinking, not from growing. Pin the tallest child too.
- A text input is inline-block by default. To stop it from stretching the surrounding line, switch it to block.
- Half-pixel sizes will quietly bite. Round at the source.
- The browser's developer tools, used early, would have shortened this from five passes to one. Worth reaching for sooner next time.

Files: [D_Parts.svelte](../../src/lib/svelte/details/D_Parts.svelte) (multiple style additions on .hierarchy-row, .hierarchy-name, and .name-input); [Constants.ts](../../src/lib/ts/common/Constants.ts) (cell-height now rounded up with a ceiling function).

Verification: type-check shows zero errors and zero warnings. Tests still all pass. The editing row was visually confirmed to match the height of its neighbours.

---

## Session — 2026-05-07 (continued) — count of parts in the parts banner title

The parts banner title used to read "parts" — three lowercase letters in the centre of the strip — regardless of how many parts the scene held. Now it reads "1 part" or "12 parts" or any other count, agreeing in singular and plural with the number. When the count is zero (a brand-new file with nothing in it), the title falls back to plain "parts" with no number — keeps the strip from shouting "0 parts" before any work has happened.

The count rule. A part counts when it is a leaf — nothing parented under it — with one exception: a repeater is itself counted as one leaf, and everything inside the repeater (the template the user dropped in plus all the spawned duplicates) is hidden from the count. So a wall set up as a repeater holding a master stud and five auto-spawned studs reads as one part — the wall — not six. A standalone box with no children counts as one. A box with two non-repeater children counts as two (the children, not the box). An empty scene with nothing loaded shows plain "parts".

Where the work was done. The count is derived in the parent details panel, where the live list of parts is already on hand. The parts banner wrapper takes its title as a prop and was not touched. A small tidy-up alongside: the clone-detection helper that was duplicated as a local function in the parts list panel was lifted up to the parts manager file so both panels can share it. The parts list panel now calls into the manager's version. (The count rule itself does not need the clone-check — the "inside a repeater" check excludes both the master and the clones in one pass — but the cleanup is good either way.)

Files: [Details.svelte](../../src/lib/svelte/details/Details.svelte) (new derived for the leaf count and the title phrase, dynamic title passed to the parts banner), [Parts.ts](../../src/lib/ts/managers/Parts.ts) (new shared clone-check), [D_Parts.svelte](../../src/lib/svelte/details/D_Parts.svelte) (local clone-check removed; callers switched to the shared one).

Verification: type-check shows zero errors and zero warnings. All six hundred seventy-three tests across thirty test files still pass. Visual check in the running app left for the user.

---

## Session — 2026-05-07 — adherence dashboard rewrite, parts list trim, rename helpers shared

A long session that started with a complaint about the adherence dashboard being uninformative and ended with a chunk of cleanup across the parts list and the selection panel.

### The dashboard rewrite

The right-side adherence dashboard used to show four green sections that all read zero whenever everything was clean. The complaint was fair: the dashboard had little to say about robustness. After several rounds of proposing and reverting, we anchored on a clear purpose for the page — draw attention to action needed right now, nothing else — and rewrote the layout to match.

The dashboard is now a headline plus a single list. When nothing needs attention it reads "All clear — no action needed" and shows a date stamp. When anything needs attention the headline reads "Action needed: N items" and a flat bullet list follows, each bullet with a sentence on what is wrong, a sentence on what to do, and one word for the owner. All of the older per-section blocks are gone — test binding, orphan tests, build-gate health, the coverage table when green, the migration dial when complete, plus a depth experiment that got tried and removed because it added noise instead of signal.

A new save-and-load test was added along the way. It puts a formula on a child cell that reads the parent's width, saves the scene, loads it back, slides the parent sideways, and checks that the child holds its absolute position because width does not move when the parent slides. The first draft of the test failed for the wrong reason — it was reading a stored offset that always matched, regardless of whether the formula actually re-evaluated. Once the assertion was rewritten in absolute terms, the test passes and verifies that the formula network really does come back to life after a round trip.

Files: [extract-adherence.mjs](../../notes/tools/extract-adherence.mjs) (new headline-and-action-list layout, removed depth and per-section blocks), [adherence dashboard.md](../../notes/guides/project/development/adherence%20dashboard.md) (regenerated), [Save_Load.test.ts](../../src/lib/ts/tests/Save_Load.test.ts) (new formula round-trip test).

### The parts list trim

The leftmost column of the parts list — a small dim number on each row showing the row's position among its siblings — was removed. With drag-and-drop reparenting in place, the dim index was no longer how anyone reasoned about row order. The cell, the row index that fed it, and its style block all came out. The part name column now sits flush at the leftmost edge of each row.

While that was open, sixteen pre-existing type-check warnings and errors got cleaned out of the same neighbourhood. Eight unused style rules and three unused import lines came out of the parts list panel. Six unused declarations and one unused helper came out of the parts list, the selection panel, and the attributes panel. One unused style rule came out of the selection panel. The type-checker dropped from eighteen warnings and nine errors to two errors, both pointing at one specific gap.

### The rename refactor

The two errors that were left came from the selection panel calling two name-editing helpers that did not exist there. They lived in the parts list panel, where the same kind of inline rename runs. The fix took two passes.

Hop one moved the rename state — which part is being renamed, what its original name was, what validation error is currently showing — and the pure-logic helpers — start a rename, commit a new name, cancel, dismiss, react to keystrokes — into the parts manager file. Both panels now call into the same machinery. They cannot disagree about whether a rename is in flight or what error is showing.

Hop two lifted the validation-error overlay markup and its styles out of the parts list panel and into the parent details panel. Before, an error raised from the selection panel was only visible because the parts list happened to be mounted; the overlay rendered from there. Now the overlay lives on the shared parent and renders whether the parts list is open or collapsed.

Files: [Parts.ts](../../src/lib/ts/managers/Parts.ts) (new rename store and helpers), [D_Parts.svelte](../../src/lib/svelte/details/D_Parts.svelte) (rename state and overlay removed; calls into the manager), [D_Selection.svelte](../../src/lib/svelte/details/D_Selection.svelte) (name input now wired through the manager), [Details.svelte](../../src/lib/svelte/details/Details.svelte) (overlay markup and styles lifted up).

Verification: type-check shows zero errors and zero warnings. All six hundred seventy-three tests across thirty test files still pass.

---

## Session — 2026-05-05 (continued, third) — invert the radial gradient on the panel banners

The bars at the top of each section that you click to hide or reveal the section now show the user's accent color in the middle and white at the outside. Before the change they showed the panel background in the middle and the accent color at the edges. Banner text is already black and stays that way. The press-state rule was left alone — a pressed banner still flattens to the light panel background, which reads as the "pressed" feedback.

The wide action button (factory reset, reinstall library) and the round plus button (new scene, add child) were briefly flipped during this pass and then reverted. They keep their original look — the panel background in the middle fading to the accent at the edges — per the user's correction "the banners only! do not touch the buttons IN the banners."

One overlay style block edited in [Hideable.svelte](../../src/lib/svelte/details/Hideable.svelte) for the panel banner. Type-check clean. Visual confirmation in the browser is up to the user.

---

## Session — 2026-05-05 (continued, second) — two separators and two small gaps on the right-side panel

A small follow-up cluster of layout polish on the right-side details panel.

- A thin horizontal separator was added above the show/hide-givens toggle inside the attributes panel.
- A matching separator was added above the divide-and-duplicate button row inside the parts panel.
- A standard gap was added between the divide and duplicate buttons so they no longer touch.
- A tiny gap was added between that button row and the separator just above it so the row breathes.

Both panels now use the same separator component used everywhere else on the right side of the screen.

Files: [P_Attributes.svelte](../../src/lib/svelte/details/P_Attributes.svelte) (added the separator import and the separator above the givens toggle row), [D_Parts.svelte](../../src/lib/svelte/details/D_Parts.svelte) (added the separator above the duplicate button row, gap between the two buttons, top margin above the row).

Verification: type-check clean; full test suite still six hundred seventy-two green; adherence chain green.

---

## Session — 2026-05-05 (continued) — cut a smart object in half

A long pass on the next code-debt item: cutting a selected part in half along its longest direction. Worked back and forth with the user to nail down the spec (several rounds of edits to the code-debt list answered the open guesses). Wrote the rule into the catalog first, wrote the tests next, then implemented the engine routine and the toolbar button. All checks green.

### Thread one — the new rule

A new line in the rules catalog (rule 59, "Cutting a smart object in half") names every detail of the feature: the longest direction is chosen by the stored length value; the original keeps the lower half and a new sibling holds the upper half; the new sibling becomes the selected part with a numeric-suffix name. Five refusal cases — root, clone, template, has-children-not-repeater, two longest tied — each post a red message in the on-screen status strip and leave the scene untouched. Repeaters are an exception to the has-children refusal: a cut on a repeater produces two repeaters, each carrying its own copy of the template. Formula behavior on the cut direction depends on which attribute the invariant points at (the spec text spells out each of the three cases). Formulas on the two non-cut directions are copied unchanged.

### Thread two — the tests

A new test file at `src/lib/ts/tests/Cut.test.ts` carries thirty-nine tests across nine groups: longest-direction selection, equal halves, selection and naming after the cut, the five refusal cases, the repeater exception, formula behavior per invariant case (three groups — invariant on length, invariant on start, invariant on end), formulas on the non-cut directions, and the can-cut flag the details panel uses to decide whether to render the cut button. Several tests caught real bugs in the first implementation pass and pushed the code toward the spec text rather than my initial guesses about what the spec meant.

### Thread three — the engine routine

The existing duplicate routine was refactored: its inner clone-and-rename work was extracted into a private helper that the cut routine now reuses. The cut routine builds on top of that helper. The flow is: refusal block → pick the longest direction by stored length → snapshot history → clone the subtree as a sibling → write the cut overrides on the cut direction (the writes depend on the invariant case) → propagate → refresh the parts list → select the new sibling → tick → save.

### Thread four — the cut button

A new "cut" button sits to the left of the existing "duplicate" button on the selected-part panel. The button is hidden when the selection is in any of the refusal cases — root, clone, template, part-with-children-and-not-a-repeater, or two longest tied. Visibility is driven by a new derived flag in the parts component that calls a new `engine.can_cut_selected()` helper.

### Files touched — 2026-05-05 (continued)

- New stipulation added to [stipulations.md](../../guides/project/development/stipulations.md), in a new section "Cutting a smart object in half." Coverage summary at the top updated to fifty-nine total, fifty-five unit-pinned, four browser-driven.
- New test file [Cut.test.ts](../../src/lib/ts/tests/Cut.test.ts) — thirty-nine tests, all green.
- Engine refactor and new routines at [Engine.ts](../../src/lib/ts/render/Engine.ts) — extracted `clone_subtree_as_sibling`; added `can_cut_selected()` and `cut_selected_so()`.
- Cut button and derived flag added to [D_Parts.svelte](../../src/lib/svelte/details/D_Parts.svelte).
- Areas list at [areas.json](../../guides/project/development/areas.json) — bumped the Cutting area from zero to one module.
- Testing index at [testing.md](../../guides/project/development/testing.md) — Cut entry now describes the real test groups instead of pending todos. Coverage summary updated.

### Verification — 2026-05-05 (continued)

- `yarn vitest run`: thirty files pass, six hundred seventy-two tests, all green.
- `yarn svelte-check`: zero errors, zero warnings.
- `yarn adherence`: extractor + docs build green; dashboard reports fifty-nine stipulations total, fifty-nine matched, all areas at one hundred percent or higher.

### Notes

- The "leave the invariant formula alone" rule in the spec is honored case by case in the routine. For invariant-on-length, only end and start are written. For invariant-on-start, length and end are written on the original (the new sibling's start derives from its end and the halved length). For invariant-on-end, length is written on both halves and start is written on the new sibling (the original's end derives from its start and the halved length).
- The geometry assumes no user-typed formula on the derived (invariant) attribute. If the user types a formula on the derived attribute, the formula evaluates and may pin the value away from the geometric expectation — this matches the design choice the user made on 2026-05-05 about the contradiction in the length-invariant case.
- The code-debt item still shows the sub-bullets unchecked in [code.debt.md](../now/code.debt.md). The user marks them off when they're satisfied.

---

## Session — 2026-05-05 — help slice finished, parts plus button refined, mono guides folder renamed

A short pass that closed out the help-overlay slice, tightened the parts panel's plus-button behavior, and renamed the shared-guides folder. Six threads.

### Thread one — help-overlay slice step four

The help overlay now remembers the last visited page across reloads. A new persistent preference holds the page id; the help component reads from and writes to it; a one-time fix-up at mount resets the stored id to the walkthrough if the stored page no longer exists. The previous local rune-state for the active page was replaced with the persistent store everywhere so there's a single source of truth.

### Thread two — parts banner plus button

Two behavior changes when the user clicks the plus button at the right of the parts panel banner:

- The parts panel auto-opens if it was collapsed. A small wrapper helper sets the parts bit in the visibility bitmask using OR (idempotent) before calling the engine routine.
- The newly-added child becomes the selected part. The engine routine that adds a child now sets the selection to the new child after wiring it into the scene; the previous "keep parent selected" comment flipped to "select the new child".

### Thread three — refuse to add a child to a repeater or a clone

The engine routine that adds a child now refuses when the would-be parent is a repeater (its own repeater flag is on) or a clone (its grand-parent is a repeater and it is not the first child of that grand-parent — which is what makes a part a clone). On refusal the user sees the message "cannot add a child to a repeater or its clone" in the on-screen status strip, in red. The history snapshot moved below the new check so the no-op click does not record an empty undo step.

### Thread four — hide the plus button when selection is a repeater or a clone

The plus button at the right of the parts panel banner now disappears when the selected part is a repeater or a clone. The details component reads the current selection reactively and recomputes a flag using the same repeater-or-clone test the engine routine uses. The flag re-evaluates on selection changes and on scene state changes. Without an active button the user cannot try the refused action; the on-screen status message is reserved for the rare cases where the engine routine is reached via a different path.

### Thread five — Next section is auto-generated

A new tiny script reads the code-debt list, finds the first unchecked item, and rewrites the handoff's Next section to match. It is wired into the adherence chain so every build refreshes the Next section. The script finds the section by its heading and replaces everything until the next heading or separator. The replacement is plain English: a single sentence that names the first unchecked item.

### Thread six — mono guides folder renamed: design → hub

The shared-guides folder at `notes/guides/design/` is now `notes/guides/hub/`. Folder renamed; the contents listing in the parent index updated; the heading inside the section's index page updated to match; the shared vitepress sidebar entry updated for both the section text and the link paths; the keyword-trigger references in the pre-flight keywords table updated. A leftover reference inside `ga/notes/design/file.layout.md` was left alone — it documents ga's own intended folder layout, not mono's guides path.

### Files touched — 2026-05-05

- New persistent preference key for the active help page id added to [Preferences.ts](../../src/lib/ts/managers/Preferences.ts).
- New persistent store added to [Stores.ts](../../src/lib/ts/managers/Stores.ts) next to the existing help-sidebar visibility line.
- [UserGuide.svelte](../../src/lib/svelte/main/UserGuide.svelte) replaced its previous local rune-state for the active page with the persistent store everywhere; added a one-time fix-up for stale stored ids at mount.
- [Details.svelte](../../src/lib/svelte/details/Details.svelte) gained a small wrapper helper for the parts plus button (panel auto-open + add-child) and a new derived flag that decides whether to render the plus button at all.
- [Engine.ts](../../src/lib/ts/render/Engine.ts) gained the repeater-or-clone refusal at the top of the add-a-child routine, with the status-strip message; the history snapshot moved below the refusal check; the post-add comment flipped from "keep parent selected" to "select the new child".
- New tooling: [sync-next.mjs](../../tools/sync-next.mjs). The adherence chain in package.json now runs sync-next first.
- The shared-guides folder was renamed; the cross-references in the parent index, the section's index, the vitepress sidebar, and the pre-flight keywords table were updated.

### Verification — 2026-05-05

- `yarn svelte-check`: zero errors, zero warnings.
- `yarn build`: green.
- `yarn adherence` (extractor + docs build): green.

---

## Session — 2026-05-04 (continued) — help overlay improvements

A long second pass through the day's work focused on the help overlay (the full-screen page that opens from the question-mark button on the toolbar). Three threads.

### Thread one — sidebar can be hidden

A new hamburger button was added to the help overlay's top bar, to the left of the "← Return" button. Clicking it toggles the navigation column on the left. When the column is hidden, the page content widens to fill the space; the vertical separator hides too. The choice survives reloads via a new persistent preference. Default is "shown" so a fresh visitor still sees the navigation.

### Thread two — corner-clipping bug found and fixed

The hamburger's top-left bar was being clipped by the help overlay wrapper's rounded corner. The wrappers in the main toolbar and in the help overlay both ask for the same corner-radius value, but the browser shrinks corners that are too big to fit on a short edge. The main toolbar wrapper is short (about one toolbar tall), so its radius gets shrunk to half that height. The help wrapper is full-screen tall, so the radius renders at its full requested size. The bigger curve eats further into the corner and clips the hamburger.

Fix: tell the help wrapper to use a radius equal to half the toolbar height instead of the shared full radius. The visual rounded corner stays — it just renders at the toolbar's curve size, not the larger one. Both wrappers now look the same at their top corners.

### Thread three — reference-guide links work, sidebar is curated

The "What to read next" links in the walkthrough page pointed at pages inside the manual's `reference guide/` subfolder. None of them worked because of three independent problems stacked together. All five fixes shipped together:

- Folder renamed: `src/manual/reference guide/` → `src/manual/reference-guide/` (no space, so markdown actually parses the link).
- Walkthrough page links updated to use the new folder name.
- Help overlay's page glob widened from one-level to recursive, so subfolder pages are picked up.
- Page id calculation now uses the path under the manual folder, so a top-level file and a subfolder file with the same name don't collide.
- Click handler rewritten to resolve link URLs relative to the active page's location, and the slash-rejection that prevented multi-segment ids was removed. Outside-overlay links (with `..` segments leading out of the manual root) still fall through to the browser.

Three stray pages that the recursive glob picked up — two leftover index files inside the `images/` folder and the reference-guide section's own index — are filtered out of the sidebar.

A new constant near the top of the help overlay component sets the sidebar's order by hand. Pages whose id appears in the constant sort by their position in it; any page not in the constant falls to the end alphabetically, so a freshly-added file remains discoverable until it gets a slot.

The vitepress dead-link checker started flagging some source-file references in the handoff that had been dormant; the ignore list grew a small new pattern so these no longer fail the docs build.

### Files touched — 2026-05-04 (continued)

- New persistent preference key for the help-sidebar visibility added to [Preferences.ts](../../src/lib/ts/managers/Preferences.ts).
- New persistent store added to [Stores.ts](../../src/lib/ts/managers/Stores.ts) next to the existing details-panel show flag.
- The help overlay component picked up the hamburger button, the conditional sidebar rendering, the recursive page glob, the new id calculation, the URL-based click resolution, the stray-page filter, and the hand-set order constant: [UserGuide.svelte](../../src/lib/svelte/main/UserGuide.svelte).
- The wrapper radius override added to [Main.svelte](../../src/lib/svelte/main/Main.svelte).
- The reference-guide folder was renamed; the five walkthrough links were updated; the overview map and the file layout were updated to reflect the rename and the new help component.
- `.vitepress/config.mts` ignore-list grew one pattern to cover handoff entries that link into source files.

### Verification — 2026-05-04 (continued)

- `yarn svelte-check`: zero errors, zero warnings.
- `yarn build`: green.
- `yarn adherence` (extractor + docs build): green.

---

## Session — 2026-05-04 — adherence dashboard built; rules catalogue fully migrated

A long autonomous run that built an adherence-tracking system from scratch, then walked every rule in the catalogue through the migration to the new format.

### Thread one — dashboard build, ten steps

The "logic driven design" guide had a ten-step plan for a small dashboard that scores the project against the development process. All ten shipped:

1. Catalogue and test-index format — added a Format section to each file showing the expected shape.
2. Extractor — `notes/tools/extract-adherence.mjs` reads both files, cross-joins, returns matched / uncovered / orphan / malformed lists.
3. Metrics — coverage by area, test binding, orphan tests, build-gate.
4. Dashboard markdown — generated at `notes/guides/project/development/adherence dashboard.md` with a top-of-page badge and one section per metric.
5. Build wiring — new `yarn adherence` script chains the extractor and a build-with-status wrapper that records the build's exit code so the next run can read it.
6. Thresholds and badge — green when all four metrics meet their targets; red lists the failing metrics.
7. Tracking policy — dashboard and status file are not gitignored. Hand-recorded log lives alongside with three append-only sections.
8. Publishing — sidebar gained a Project section; project index calls out the dashboard; layout map and overview map list the new files.
9. End-to-end validator — `notes/tools/validate-adherence.mjs` builds two in-memory fixtures and asserts the cross-join's counts.
10. Hand-written guide — `notes/guides/project/development/dashboard guide.md` walks through every section, the red-value action table, and "when the dashboard is wrong".

### Thread two — overall health line and migration progress moved to the top

Added an at-a-glance line below the badge that surfaces the legacy count, then moved the full Migration progress section up to sit right under the badges so the migration status is the first thing the eye reaches.

### Thread three — rules catalogue migrated, all fifty-eight

Walked every area in twelve passes, applying the per-rule recipe each time: pick the next un-audited area, give each rule a short stable name, find the proving test in its file, find the proving code line, add the back-pointer on the test entry, set the area's module count in `areas.json`, run the extractor, run the validator. Final state: zero rules on the old "Covered:" shape, fifty-eight matched, zero uncovered, zero orphan, zero malformed. Twenty-six areas audited; coverage runs from one rule per module up to three rules per module, all green.

Four new browser-driven test entries went into the test index — for the editing-lock, view-mode-switch, rotation-snap, and drag-versus-tumble user flows — so the four user-flow rules have somewhere to point back from.

### Drifts surfaced during the migration

1. The rule "each direction has three attributes" says three; the code defines four (the angle is the unrecorded fourth). The proving test only checks for three, so the rule and the test agree; the code is the odd one out. Logged in the adherence log.
2. The rule "user-altered invariant causes reverse propagation" did not match the cited tests (which prove forward enforcement that overwrites the user's value). Surfaced mid-migration; Jonathan rewrote the rule to align with the tests, then the migration resumed.

### Files touched — 2026-05-04

- New tools: [extract-adherence.mjs](../../tools/extract-adherence.mjs), [build-with-status.mjs](../../tools/build-with-status.mjs), [validate-adherence.mjs](../../tools/validate-adherence.mjs).
- New guides: [adherence dashboard.md](../../guides/project/development/adherence%20dashboard.md) (generated), [adherence log.md](../../guides/project/development/adherence%20log.md), [dashboard guide.md](../../guides/project/development/dashboard%20guide.md).
- Edited: [stipulations.md](../../guides/project/development/stipulations.md), [testing.md](../../guides/project/development/testing.md), [logic driven design.md](../../guides/project/development/logic%20driven%20design.md), `notes/guides/project/development/areas.json`, [development index](../../guides/project/development/index.md), [project index](../../guides/project/index.md), [guides.layout.md](../../guides/guides.layout.md), [overview map.md](../../guides/project/overview/map.md), `.vitepress/config.mts`, `package.json`.

### Verification — 2026-05-04

- `yarn adherence`: every gated metric green; legacy count zero; zero malformed; build green.
- `node notes/tools/validate-adherence.mjs`: both fixture passes green.

---

## Session — 2026-05-01 — guides cleanup, screenshots, URL flag, App.svelte slimming

A long session that closed out the guide-update arc and started chipping at code-debt items.

### Thread one — guides finished

The guide tree was pushed through the last of its long sweep: distilled the working-process file into a permanent instructions page; filled in the user manual feature by feature (eight new pages — selection, re-parenting, formulas, library, build notes, undo and redo, units, save and load); added a key-paths page covering every keyboard shortcut grouped by context. The working file `update.guides.md` graduated from "now" to "done" once everything had been done. Builds stayed green throughout.

### Thread two — first-steps page with screenshots

A new walk-through page for a brand-new user covers their first few minutes: the URL, the bundled drawer that loads on first visit, turning on dimensions, the read-only lock, turning on editing, stretching, editing a dimension, starting a fresh design from the library, and adding an empty box.

The page started without screenshots. After deciding the assistant would do the captures (full automation), a Playwright script and a separate config was placed at `e2e/screenshots/`. The script clicks the hamburger to hide the side panel, then drives the app through eight scripted journeys, capturing one PNG per step into the manual's image folder. Wired as `yarn shoot`.

The image folder name had to change from `first.steps` to `first-steps` because the period in the folder name confused Obsidian's relative-path renderer. The eight markdown image references and the script's output path were updated; the docs build stayed green.

### Thread three — launch defaults flipped

Two preference defaults flipped on first launch: editing now starts on (lock open), the rotation-snap magnet now starts off. Two single-character edits in the persistent-flag setup. Existing users keep whatever they last toggled, since the change touches only the fresh-visitor default.

### Thread four — URL-flag handling brought across from ws

The ws project's pattern for URL flags was lifted into di. Configuration gained a query-strings field captured at construction time, an `apply_queryStrings` method, a `configure` step that wires each manager's apply method in order, and a side-effect call at module load. Preferences gained an `apply_queryStrings` of its own that handles the new flag.

The flag is `?clear=preferences`. When present, the preferences-reset helper runs before any persistent store reads its initial value. The result: a fresh launch on the next page render. Scene and library are preserved (matching the existing factory-reset button's behavior).

`main.ts` imports Configuration first so the side-effect runs before App.svelte's transitive imports trigger the persistent stores to read.

### Thread five — App.svelte slimming

Two big chunks of one-time setup code moved out of `App.svelte` into Configuration.

The first chunk — the long block of static design tokens that injects CSS variables onto the document root — moved into a new `configure_css` method.

The second chunk — the `?test=1` test-hook attachment — folded into Configuration's `apply_queryStrings` (since it is itself a URL-flag-driven action).

A third method, `configure_reactive_colors`, takes the four reactive color values as parameters and pushes them onto the document root. App.svelte's `$effect` now just forwards the four values to that method.

After all three moves, App.svelte's script block is a handful of lines: import Configuration, run `c.configure()` on mount, watch the four color stores via `$effect`, hand them to Configuration on each change.

### Thread six — memories saved

Several rules were codified:

- "move" always means relocate (copy plus delete), never just copy.
- "chime" means a brief plain-English analysis of recent changes, not an audible sound.
- The chime should lead with completions, optionally suggest a next step, and skip the plumbing detail.
- All pre-existing errors and warnings get fixed without approval, and without a report afterwards.
- Never ask permission to read a file or run a read-only check; just do it.
- Every substantive answer in the di project becomes a new section in `handoff.md`; the assistant picks the section title.

### Files touched

- Documentation: many under `notes/guides/` (new pages, indexes, the layout map, the lessons file, the updating-guides instructions). The map page picked up entries it had been missing.
- The working-notes file `update.guides.md` graduated to `work/done/`.
- Source: [Configuration.ts](di/src/lib/ts/common/Configuration.ts), [Preferences.ts](di/src/lib/ts/managers/Preferences.ts), [Stores.ts](di/src/lib/ts/managers/Stores.ts) (the two default flips), [App.svelte](di/src/App.svelte), [main.ts](di/src/main.ts).
- New screenshot capture: [playwright.config.ts](di/e2e/screenshots/playwright.config.ts), [first-steps.spec.ts](di/e2e/screenshots/first-steps.spec.ts), `package.json` gained a `shoot` script.

### How it was checked

- Type-checker: clean after every intermediate step.
- Test suite: six hundred thirty-three checks pass.
- Docs build: green.
- Screenshot run: eight passes in about thirty seconds.

---

## Session — 2026-04-30 — drill-down clicks, multi-select, parts-table drag-and-drop

Several threads.

### Thread one — drill-down click on the drawing area

A click on the drawing area now picks the front-most part by default, but on the second click the selection moves one part deeper into the stack. Each click builds a fresh ordered list of every part the click ended up on, front to back. If the currently selected part is in that list, the new selection is the part right after it on the list, wrapping back to the front when the current part is at the end. If the current selection is not in the list (or nothing is selected), the new selection is the front-most. The rule is stateless — the click handler keeps no memory between clicks; the input is just "what is the cursor over" plus "what is currently selected."

### Thread two — skip non-eligible parts in the click stack

The click stack now skips two kinds of parts. Parts whose visibility flag is off are excluded so a hidden part cannot be reached by a click — drill-down moves straight past it to the next one behind. Repeater clones are also excluded — only the master in a repeater group can be hovered or clicked, since the parts table treats clones as derived and does not list them. The drawing area still draws all parts as before; the click stack is just smaller.

### Thread three — multi-selection

The single-selected-part data shape became a list of selected parts. Empty list means nothing is selected. One item means the selected part, identical to the prior single-selection behavior. Two or more means multi-select. A small backwards-compat reader called "the only selected part" returns the single item when the list has exactly one, otherwise nothing — so every existing call site that reads "the selected part" keeps working without modification.

A plain click on a part replaces the list with that one part. A command-click on a part toggles that part's membership in the list. The same rule applies in the parts table for row clicks. The parts table marks every row whose part is in the list, and the canvas draws the bold outline on every part in the list. When more than one is selected, the three-tab segmented control in the details panel (and the rest of the per-selection editing widgets) hides.

### Thread four — parts-table drag-and-drop re-parenting

Rows in the parts table can now be dragged onto each other to change the tree. Each row is draggable; while a drag is in progress the cursor's vertical position inside the row over decides the drop mode. The middle of a row drops as a child of that row. The top edge of a row, when the row above is a sibling, drops as a sibling inserted between them. The bottom edge of a row, when the row below is a sibling, drops as a sibling inserted between them. When the cursor is on the line between two rows that are NOT siblings, only the upper of the two is highlighted and the drop becomes a child of that upper row. The empty area below the last row drops as child of root, last in order. Drops onto self, descendants, or onto a part that has a repeater set up are rejected with no highlight.

The visual cue during a valid hover is a soft blue tint on the affected row (or both rows when sibling-mode) plus a thin blue line at the drop edge.

On drop, the dragged part's six absolute world bounds are snapshotted, the part is re-parented in the scene tree, the master order is reshuffled so the parts table sibling order matches, and the bounds are written back so the drawing-area position does not move. Formulas are not touched, per the user's instruction. History is snapshotted before the move so the action is undoable.

### Thread five — small fix: scroll on the side panel keeps buttons clickable

The right-side panel that holds preferences, library, and parts now refreshes the click-detector's record whenever the user scrolls inside it. Without this, scrolled rows was placed at new on-screen positions while the record still pointed at the old positions, so clicks missed. The mount-time refresh got a small cleanup at the same time — the wrapping setTimeout was unnecessary because the existing deferred-refresh helper already waits one layout pass.

### Thread six — eye cells in the collapsed details view

When the parts list is hidden and only the selected part is shown, the row that holds the part's name now also shows the two eye cells (the hide-children eye and the visibility eye) on the right of the name input. They use the same click handlers as the rows in the full parts list — clicking one flips the matching flag on the selected part. The first cell only paints when the selected part has children and is not root; the second cell always paints with either the eye glyph or a dash. The cells re-paint on every click because their displayed values are read through three small reactive views that depend on the global change-tick the toggle handlers bump after each mutation.

### Thread seven — pre-existing unused-import cleanup

The toolbar component had an unused configuration import left over from earlier work; it has been removed. The Svelte type check now reports zero errors across the project.

### Thread eight — formula commit kept the space inside a multi-word name

A formula like "structure.main beam.e" was committed as "structure.mainbeam.e" — the space between "main" and "beam" was being lost. The text was being tokenized into two separate references — one for "structure.main" and one for "beam.e" — and the joiner that follows only knew how to merge bare-name references that follow the form "foo bar.x". When the first reference is itself a dotted path (because the part lives inside another part), the joiner left the two references separate, and the un-tokenizer concatenated them with no separator. The same bug also caused the "did you mean: main beam" suggestion button to look like it was being ignored — the suggestion's corrected text went through the same commit pipeline and the space was lost the second time too. Fix: extend the joiner so two adjacent dotted references also collapse into one, with the merged path holding the space inside its last name segment.

### Thread nine — attributes table dropped its first column below an error overlay

When a formula error overlay appears, the attributes table is split into two physical tables with the overlay in between. The left-most column of the table holds a single letter (s, l, or e) that spans three rows in agnostic mode. If the split fell in the middle of one of those three-row groups, the spanned cell was rendered only in the top table — so every row below the overlay was missing its left-most column and the rest of the row drifted left. Fix: when the bottom table starts in the middle of a three-row group, render the letter cell on its first row with a row-span sized to cover only the rows that remain in that group.

### What was added — 2026-04-30

- A drill-down click rule that uses the current selection plus the click stack. No internal state in the click handler.
- A visibility-and-clone filter on the click stack.
- A list-based selection store with backwards-compat single-selection reader, a "toggle membership" method, and a "contains this part" check.
- A canvas-side command-click branch that toggles the picked part instead of replacing the selection.
- A parts-table-side command-click branch that does the same for rows.
- A multi-row highlight in the parts table driven by the selection list.
- A canvas multi-part bold-outline driven by the same list.
- A details-panel gate that hides the three-tab segmented control (and the rest of the per-selection widgets) when more than one part is selected.
- A new helper that re-parents a part to a new target with three modes (child of, sibling-before, sibling-after), preserving the on-screen position by rewriting the dragged part's stored offsets.
- A new method on the scene module that moves a single entry to any spot in the master order — drives sibling reorder.
- Drag handlers on each parts-table row plus a table-level handler for the empty area below.
- Visual-feedback styles (soft blue background; thin blue top or bottom line) on rows during a drag.
- A scroll listener on the side panel that refreshes the click-detector record on each scroll.
- Two clickable eye cells alongside the name input in the collapsed details view, with three small reactive views that re-paint them on every click.
- Removal of an unused configuration import from the toolbar component.
- An extension of the formula token-joiner so spaces inside multi-word part names survive the tokenize-and-rebuild round trip — fixes both the typed-input and the "did you mean" suggestion-button paths.
- A row-span-aware split of the attributes table's left-most letter column, so the column does not vanish below a formula error overlay.

### Files touched — 2026-04-30

- Click stack, drill-down rule, visibility-and-clone filter: [Hits_3D.ts](di/src/lib/ts/events/Hits_3D.ts).
- Selection model: [Selection.ts](di/src/lib/ts/managers/Selection.ts), [Face_Label.ts](di/src/lib/ts/editors/Face_Label.ts).
- Canvas command-click branch: [Events_3D.ts](di/src/lib/ts/events/Events_3D.ts).
- Multi-part bold outline: [Render.ts](di/src/lib/ts/render/Render.ts).
- Parts-table multi-row highlight, command-click, drag-and-drop wiring, drag-style CSS, collapsed-view eye cells: [D_Parts.svelte](di/src/lib/svelte/details/D_Parts.svelte).
- Re-parent helper: [Engine.ts](di/src/lib/ts/render/Engine.ts).
- Master-order move helper: [Scene.ts](di/src/lib/ts/render/Scene.ts).
- Side-panel scroll refresh and mount-time cleanup: [Details.svelte](di/src/lib/svelte/details/Details.svelte).
- Toolbar unused-import cleanup: [Controls.svelte](di/src/lib/svelte/main/Controls.svelte).
- Formula token-joiner extension for multi-word names: [Tokenizer.ts](di/src/lib/ts/algebra/Tokenizer.ts).
- Attributes-table split-row letter column: [P_Attributes.svelte](di/src/lib/svelte/details/P_Attributes.svelte).
- Code-debt list: [code.debt.md](./code.debt.md) — parts-table drag-and-drop is now off the list.

### Verification — 2026-04-30

- The Svelte type check now reports zero errors across the project after the unused-import cleanup.
- The unit-test suite has not been re-run this session.
- The drill-down click, the multi-select, the collapsed-view eye cells, the multi-word-name formula commit, and the attributes-table split row were all exercised by the user in the running app. The drag-and-drop wiring is in place but the user has not yet exercised it.

---

## Session — 2026-04-29 (continued, fifth) — sliders moved into the toolbar; resolver write-path lock check

Two threads.

### Thread one — resolver write-path lock check

The drag's write path already refuses to write through a locked target — that is the path real drags travel. A second write path sits one level lower, used by the resolver. It did not refuse locked targets. No production code calls it today, but a future test or new caller could happen on it and behave inconsistently with the drag path. Added a one-line refusal at the same shape as the drag-side check: look up the target, bail if it is locked. No new behavior reaches end users from this change.

### Thread two — sliders moved out of the drawing area and into the toolbar

The zoom slider used to float at the top-right of the drawing area, taking half the drawing width. The guides slider used to sit in the lower-right corner of the drawing area as a small vertical bar with the word "guides" beneath it. Both have moved into the toolbar at the top of the screen.

Layout decisions, all from the user:

- The zoom slider lives in all three responsive layouts (phone, mobile, desktop), keeps its end-cap step buttons, and flexes into whatever toolbar room is left after the buttons. The user set the upper limit at six hundred pixels wide. No minimum width.
- The guides slider also lives in all three layouts and was rotated from vertical to horizontal. Its "guides" label sits directly above the slider track. The label is nudged five pixels upward so it reads cleanly above without crowding the row.
- In the desktop layout, the buttons sit in one flex row on the left and the zoom slider sits in a second flex area on the right. The zoom slider's right edge is flush with the right edge of the toolbar — a negative right margin pulls it past the toolbar's own horizontal padding, and an automatic left margin pushes it to the right end of its area.
- The new buttons wrapper carries an explicit flex layout so its spacers behave and its segmented blocks do not force line breaks.

The drawing area no longer carries any slider markup, any slider styles, or any of the store handles or handler functions that drove them.

### What was added — 2026-04-29 (continued, fifth)

- A one-line locked-target refusal in the resolver-level write path of the constraints manager.
- The slider import, two store handles, and three handler functions on the toolbar component.
- Two new toolbar snippets (one for the zoom slider, one for the guides slider) and four new style classes (the buttons row, the slider area, the guides block, the scale block) plus a small styling rule for the guides label.
- Removal of the slider import, the store handles, the three handler functions, the two markup blocks, and four style classes from the drawing-area component.

### Files touched — 2026-04-29 (continued, fifth)

- Resolver write-path lock check: [Constraints.ts](di/src/lib/ts/algebra/Constraints.ts).
- Toolbar additions: [Controls.svelte](di/src/lib/svelte/main/Controls.svelte).
- Drawing-area removals: [Graph.svelte](di/src/lib/svelte/main/Graph.svelte).
- Code-debt list: [code.debt.md](./code.debt.md) — the slider-move item is now off the list.

### Verification — 2026-04-29 (continued, fifth)

- I AM GUESSING the unit-test suite still passes — it has not been re-run this session.
- The user iterated visually on the toolbar layout in the running app across several rounds.

---

## Session — 2026-04-29 (continued, fourth) — center-letter closed in browser; browser-driven tests running

Two threads.

### Thread one — center-letter feature confirmed in the browser

The user exercised the formula editor in the running app and confirmed the "cannot drag a center" alert appears at the bottom of the canvas in red on a refused drag. With that confirmed, the temporary helper that exposed the status helper to the browser console (the one named `di_status`) was removed from the page-startup code. Center is now done end to end with no leftover scaffolding.

### Thread two — browser-driven tests running

The browser-driven test setup that was deferred earlier is now in place. Four test files cover the four user-interface rules that the unit-test runner could never reach:

- The editing-lock blocks clicks. Three checks: the lock starts on by default; a click on the canvas while the lock is on does not pick a part; toggling the lock off lets a click pick a part.
- The view-mode toggle saves and restores the camera angle. One check: toggling from 3D to 2D and back restores the angle to within a small numerical tolerance of where it started.
- The rotation-snap toggle settles on a face-aligned orientation. One check: a tumble drag with rotation-snap on settles on an angle whose quaternion has a near-±1 component (one of the six face-aligned forms).
- The drag-versus-tumble decision. Two checks: an empty-canvas drag changes the camera angle; a drag with a selection in place leaves the selection intact.

Plus a small smoke test that confirms the page loads and the read hooks attach.

The setup uses Playwright as the runner. A small read-only set of hooks gated by the URL query parameter `?test=1` lets the tests inspect internal state without exposing any write path. The hooks live in the page-startup code; they attach only when the parameter is present, so a normal user session sees no extra surface on the page.

The browser tests run with `yarn e2e`. The runner starts the development server if one is not already running, otherwise reuses the running one. One browser is enough — Chromium covers all the flows.

### What was added — 2026-04-29 (continued, fourth)

- A new browser-driven test directory at `di/e2e/` with four user-flow test files plus a smoke test, all passing.
- A Playwright config that reuses the running development server when present.
- A small read-only set of hooks on the page, gated by the URL parameter `?test=1`.
- A new `e2e` script in the package.json.
- Removal of the temporary console helper (the `di_status` window assignment).
- Catalog and testing-guide updates: rules fifty-three through fifty-six now point at the new browser-test files; the count line at the top reads "all fifty-eight rules directly covered."

### Files touched — 2026-04-29 (continued, fourth)

- New test files: [`smoke.spec.ts`](di/e2e/tests/smoke.spec.ts), [`editing-lock.spec.ts`](di/e2e/tests/editing-lock.spec.ts), [`view-mode-switch.spec.ts`](di/e2e/tests/view-mode-switch.spec.ts), [`rotation-snap.spec.ts`](di/e2e/tests/rotation-snap.spec.ts), [`drag-vs-tumble.spec.ts`](di/e2e/tests/drag-vs-tumble.spec.ts).
- New config: [`playwright.config.ts`](di/e2e/playwright.config.ts).
- Page-startup script: [`App.svelte`](di/src/App.svelte) — temporary console helper removed; read-only test hooks added gated by `?test=1`.
- Package manifest: [`package.json`](di/package.json) — added Playwright as a development dependency and an `e2e` script.
- Catalog: [stipulations.md](../../guides/project/development/stipulations.md).
- Testing guide: [testing.md](../../guides/project/development/testing.md).

### Verification — 2026-04-29 (continued, fourth)

- Unit tests: twenty-nine files, six hundred thirty-one checks, all passing.
- Browser-driven tests: eight checks across five files, all passing.
- Type-check: zero errors, zero warnings.

---

## Session — 2026-04-29 (continued, third) — center-letter phase three done

One thread. Phase three of the center-letter milestone is done: a small observability touch.

### Phase three changes

- A new debug-summary method on every SO that returns a multi-line text block. Each direction gets a line with its start, end, length, and center. The center is computed from start and end at call time — no stored value.
- Two small unit tests in the center test file: a multi-line summary contains every direction's center alongside its start, end, and length; after editing the start of a direction, the next summary call shows the updated center.

### What was deferred from phase three

The optional hover tooltip is still future work. No real caller wires the new debug method into the running app — it is a tool for any developer who wants to inspect an SO's full numerical state. The placeholder console-exposed caller from phase zero is still in place; it can come out at any time.

### Milestone status after phase three

All four phases are done. The feature is complete end to end. The next concrete pieces of work, when chosen:

- A real exercise of the formula editor in the browser to confirm the message appears at the bottom of the canvas in red.
- Removal of the placeholder console-exposed caller, once the in-app exercise above confirms the feature works.
- The browser-driven test setup, deferred earlier; that work begins when the center-letter milestone is fully closed.

### What was added — 2026-04-29 (continued, third)

- A debug-summary method on every SO showing each direction's start, end, length, and center.
- Two new unit tests; full suite passes at twenty-nine files, six hundred thirty-one checks; type-check clean.
- Catalog rule fifty-eight extended to mention the debug summary.
- Testing guide entry extended to mention the debug summary.

### Files touched — 2026-04-29 (continued, third)

- The Smart_Object class (the new debug-summary method): [Smart_Object.ts](di/src/lib/ts/runtime/Smart_Object.ts).
- The center test file (two new tests): [Center.test.ts](di/src/lib/ts/tests/Center.test.ts).
- Catalog: [stipulations.md](../../guides/project/development/stipulations.md).
- Testing guide: [testing.md](../../guides/project/development/testing.md).

### Verification — 2026-04-29 (continued, third)

- Test suite: twenty-nine test files, six hundred thirty-one checks, all passing.
- Type-check: zero errors, zero warnings.

---

## Session — 2026-04-29 (continued) — center-letter phase two done

One thread. Phase two of the center-letter milestone is complete: the silent refusal of phase one is now wired to the status strip from phase zero with the visible message "cannot drag a center."

### What was added

- An import of the status helper into the constraints manager.
- A publish call inside the upstream walker — when the walker enters a center reference and finds no underlying number to walk into, it posts the refusal message to the status strip. This is the path real drags take when the formula on the dragged cell reads a center.
- A publish call inside the resolver-level write path (defensive — the path does not fire in normal flow but is now consistent).
- A publish call inside the free-constant write path (defensive — same shape).
- Five new unit tests in the center test file: the walker publishes when it encounters a center, the resolver-level write publishes, the free-constant write publishes, repeat refusals do not fill the queue (the strip's dedup catches them), and a drag whose formula does not read a center publishes nothing.

### Visual snap-back

I AM GUESSING the corner the user grabbed snaps back to where it started automatically — the underlying numbers never change because the writes are refused, and the renderer reads from those numbers on every paint. Phase two does not add any explicit snap-back code. If a real drag in the running app shows visual lag, a follow-up can add an up-front check at drag-start.

### What does not happen in phase two

Phase three (optional observability polish — debug logs and an optional hover tooltip) is still future work. The placeholder console-exposed caller from phase zero is still active; it can come out at any time after the center-letter feature is exercised in the running app.

### Status of the center-letter milestone

Phase zero, phase one, and phase two are all done. The feature reaches end users now. Phase three is optional and can be deferred.

### What was added — 2026-04-29 (continued)

- Three refusal points in the constraints manager publish "cannot drag a center" to the status strip.
- Five new unit tests; full suite passes at twenty-nine files, six hundred twenty-nine checks; type-check clean.
- Catalog rule fifty-eight extended to mention the visible alert.
- Testing guide entry extended to mention the alert and the additional tests.

### Files touched — 2026-04-29 (continued)

- Constraints manager (the upstream walker, the resolver-level write, the free-constant write): [Constraints.ts](di/src/lib/ts/algebra/Constraints.ts).
- Center test file (five new tests): [Center.test.ts](di/src/lib/ts/tests/Center.test.ts).
- Catalog: [stipulations.md](../../guides/project/development/stipulations.md).
- Testing guide: [testing.md](../../guides/project/development/testing.md).

### Verification — 2026-04-29 (continued)

- Test suite: twenty-nine test files, six hundred twenty-nine checks, all passing.
- Type-check: zero errors, zero warnings.
- A run in the browser to confirm the message appears at the bottom of the canvas in red is still pending.

---

## Session — 2026-04-29 — center-letter phase one shipped

One thread. Phase one of the center-letter milestone was done: the read-only side of the new letter end to end, with a silent refusal of any drag whose formula reads a center.

### What was done

- The bare-name table that today knows three letters (start, end, length) gained a fourth letter for the center. Each direction's concrete center name is the direction prefix plus `_center` (so `x_center`, `y_center`, `z_center`).
- The accepted-letter list the parser uses to reject unknown letters gained the new letter.
- The bind step that turns letter shorthand into concrete cell references now recognizes the new letter at every entry point — when a user types a formula, when a saved file is loaded, and when a part is renamed.
- The resolver gained a branch: when asked for a center, it returns start-plus-end-over-two on the named direction. The value is computed fresh on every read; nothing is stored.
- Both write paths — the resolver-level write and the free-constant write — refuse any write to a center. The read-only contract holds end to end.
- A small self-loop check at edit time: a formula on a start, end, or length cell that references the center of the same direction on the same SO is rejected before the formula commits. The existing chain detector is unchanged.
- The translation table loop was extended so the new letter survives round-tripping between the concrete form and the axis-agnostic form.
- One small piece of cleanup along the way: a half-finished show-position-versus-show-size feature in the parts panel was deleted (a state, two helpers, a format function, a type, and the preference key that fed it). Removing it brought the type-check fully clean.

### What gets tested

Seventeen new tests in [Center.test.ts](di/src/lib/ts/tests/Center.test.ts) cover:

- Forward reads: cross-direction reads, cross-SO reads via the part's identifier, with-literal arithmetic, mixed-form sums, and freshness on changes (no stale cache).
- Self-loop rejection: starts, ends, and lengths that reference the same-direction same-SO center are rejected; the qualified-self form is also rejected.
- Self-loop acceptance: cross-direction same-SO is accepted; cross-SO same-direction is accepted.
- Drag through center: both write paths refuse to write — the resolver-level path and the free-constant path.
- Save and reparse round trip: the formula text containing the center letter survives a re-compile.
- Formula text preserves the bare letter — no rewrite to start-plus-end happens at save time.
- Translation round trip: a center-using formula survives the concrete-to-agnostic round trip and back.

### What does not happen in phase one

The visible alert on a refused drag, the snap-back animation, and any change to the parts panel are explicitly out of scope. Those happen in phase two.

Phase one is reviewable and revertable on its own as a code-change unit. It is **not** user-shippable on its own — the silent refusal of a drag is a usability gap that phase two closes. The two phases reach end users together.

### What shipped — 2026-04-29

- A new bare letter in formulas with a read-only resolver branch and a self-loop check at edit time.
- Seventeen new unit tests; full suite passes at twenty-nine files, six hundred twenty-four checks; type-check clean.
- A new rule in the catalog (the fifty-eighth), pointing at the new test file.
- A new index entry for the test file in the testing guide.
- A small cleanup of half-finished parts-panel code that was clouding the type-check.

### Files touched — 2026-04-29

- New test file: [Center.test.ts](di/src/lib/ts/tests/Center.test.ts).
- Constraints manager (the bare-name table, translation maps, resolver, write paths, self-loop check): [Constraints.ts](di/src/lib/ts/algebra/Constraints.ts).
- Accepted-letter list: [Errors.ts](di/src/lib/ts/algebra/Errors.ts).
- Catalog: [stipulations.md](../../guides/project/development/stipulations.md).
- Testing guide: [testing.md](../../guides/project/development/testing.md).
- Cleanup of unused parts-panel code: [D_Parts.svelte](di/src/lib/svelte/details/D_Parts.svelte), [P_Attributes.svelte](di/src/lib/svelte/details/P_Attributes.svelte), [Preferences.ts](di/src/lib/ts/managers/Preferences.ts).

### Verification — 2026-04-29

- Test suite: twenty-nine test files, six hundred twenty-four checks, all passing.
- Type-check: zero errors, zero warnings.
- Manual exercise of the formula editor in the running app is still pending; phase two will exercise the editor end to end via the refusal-with-message flow.

---

## Session — 2026-04-28 — rules catalog and test catalog locked in step

Six threads.

### Thread one — wrote the missing tests

The rules file listed thirty-three load-bearing rules at the start of the day. Walking the list against the existing tests, fourteen rules had no direct test, partial coverage, or only "probably covered by a big nearby test file." Wrote tests one rule at a time, then verified each. Several rules turned out to be already covered by tests in unrelated files; those got their pointers in the rules file relabelled rather than getting a new test. The work was done across a handful of files: a new file that pins down rotation, a new file that pins down named values that formulas can reference, a new file that pins down the snap-to-grid drag rounding, plus added test groups in the data-layout file, the units file, the formula-and-constraints file, the errors file, and the save-and-load file. The catalog summary at the top of the rules file now reads "all directly covered by tests."

### Thread two — added more rules to the catalog

After the missing tests were added, a second pass through the codebase looked for rules the catalog did not name yet. Ten rules were added in a first round (rotation, internal millimeters, named values, cycle detection, single writable target, visibility, drag snap, redo, repeater spacing, and fire-block cross direction). Then the user-interface rule about the user typing into a locked cell was removed and the remaining rules renumbered. Then a third pass found seven more rules with direct evidence in the code: setting a formula clears a cell's lock, the bare-name resolver walks up the parent chain and picks the first match, repeater duplicates are excluded from the saved snapshot, locked named values are protected the same way locked cells are, every SO is shaped like a box with eight corners and twelve edges and six faces, the camera has two viewing modes (3D and 2D), and an error reported on a cell stays there until cleared. Each new rule got a test alongside its catalog entry. Net: forty-nine rules in the catalog, all directly covered by tests.

### Thread three — restructured the testing guide

The testing guide had two overlapping sections: an alphabetical index of test files with one-liner descriptions, and a longer prose section that described the same fourteen tests inside two of those files in detail. Merged them: the longer prose now sits as nested bullets under the two file entries in the index. The standalone duplicate section is gone. The "stipulation coverage" subsection at the bottom of the testing guide was reduced to one short paragraph that points at the rules file (where the per-rule pointers now live).

### Thread four — restructured the rules catalog

Each rule in the rules file now carries an annotation line directly under it: "Covered: filename" plus optional detail. The bird's-eye summary moved to the top of the file as a one-line counts paragraph. The dedicated "stipulation coverage" section that used to live in the testing guide is now folded into this per-rule annotation, so a reader checking a rule and a reader checking coverage both end up in the same place.

### Thread five — quieted the markdown linter

Adding rules forty through forty-nine triggered a linter warning on every numbered rule across the file: the linter wanted ordered-list numbers to restart at one inside each section, but the catalog uses continuous numbering across sections so the rules can be cited by stable identifier. Added one line to the project's markdown-linter config that turns off the offending rule for every markdown file in the project. The other config entries are unchanged.

### Thread six — fixed a dead link, established a wording convention

The docs build had been failing on one dead link inside the handoff file: a reference to the docs config file written as a markdown link, which the build's link checker tried to verify and could not find. Changed that one entry to plain text with the path in inline code, leaving the path visible to the reader without the build trying to verify it. The build is green again.

A wording convention was also established for new content about this project: write "SO" or "smart object" rather than "block." The convention applies to new content only — existing prose was not swept. Saved as a persistent note so it carries across future sessions.

### What shipped — 2026-04-28

- Twenty new tests across new and existing test files. Twelve files now collectively pin down all forty-nine load-bearing rules. Twenty-five test files, five hundred eighty-seven checks, all green.
- The rules catalog grew from thirty-three rules to forty-nine, with one user-interface rule removed mid-session and the rest renumbered. Every rule now carries a pointer to the test that pins it down.
- The testing guide and the rules catalog are now in lock-step; their previously overlapping sections have been merged into one canonical place for each kind of information.
- The markdown linter no longer warns about the catalog's continuous numbering.
- The docs build is green again after one dead link was rewritten.
- A persistent wording convention: SO or smart object, not block.

### Files touched — 2026-04-28

- New tests: [Rotation.test.ts](di/src/lib/ts/tests/Rotation.test.ts), [Givens.test.ts](di/src/lib/ts/tests/Givens.test.ts), [Snap.test.ts](di/src/lib/ts/tests/Snap.test.ts).
- Test files extended with new groups: [Data_Layout.test.ts](di/src/lib/ts/tests/Data_Layout.test.ts), [Units.test.ts](di/src/lib/ts/tests/Units.test.ts), [Constraints.test.ts](di/src/lib/ts/tests/Constraints.test.ts), [Errors.test.ts](di/src/lib/ts/tests/Errors.test.ts), [Save_Load.test.ts](di/src/lib/ts/tests/Save_Load.test.ts), [Camera.test.ts](di/src/lib/ts/tests/Camera.test.ts), [Hierarchy.test.ts](di/src/lib/ts/tests/Hierarchy.test.ts), [Root.test.ts](di/src/lib/ts/tests/Root.test.ts).
- Catalog: [stipulations.md](../../guides/project/development/stipulations.md).
- Testing guide: [testing.md](../../guides/project/development/testing.md).
- Markdown-linter config: `di/.markdownlint.json`.
- Dead-link fix in this handoff (docs config reference).

### Verification — 2026-04-28

- Test suite: twenty-five test files, five hundred eighty-seven checks, all passing.
- Docs build: green after the dead-link fix; previously failing on the handoff's broken docs-config link.
- Markdown linter: no warnings on the rules catalog after the project-wide config update.

---

## Session — 2026-04-28 (continued) — rules audit, eight more rules, center-letter proposal, status-strip phase zero

Three threads, all design work. No code shipped beyond the testing additions in the earlier session today.

### Thread one — audit of the codebase for missing rules

A walk through the source folders looking for load-bearing behavior the rules catalog did not yet name. Two passes. First pass turned up ten candidates and they were added as rules thirty-three through forty-two — rotation, internal millimeters, named values, cycle detection, single writable target, visibility, drag snap, redo, repeater spacing, fire-block cross direction. The user-interface rule about typing into a locked cell got removed in the same step and the catalog renumbered. Second pass — driven by reading the managers, editors, events, and render folders — turned up eight more rules: identifier stability, default scene on first launch, selection saved with the scene, auto-save after most user actions, deletion cascade with formula cleanup, the precision setting snapping every plain-number cell, the editing-lock toggle blocking clicks, the two-dimensional / three-dimensional view-mode swap, the rotation-snap toggle behavior, drag-with-versus-without selection, and the preferences layer that persists across reloads. Eight of those were added as rules fifty through fifty-seven. Tests came along with each rule that was reachable in the unit-test runner; four rules that need real mouse events or the running animation loop got marked as not unit-testable. Catalog ends at fifty-seven rules, fifty-three directly covered, four queued for browser-driven tests.

### Thread two — the center-letter design

The user proposed adding a new bare letter to the formula vocabulary that means "the midpoint between the start and the end of a direction." After several rounds of pros-and-cons and locking decisions one at a time, the design settled on:

- The letter is read-only. There is no path that writes through a center reference.
- Reverse propagation that would be done on a center reference is refused, with a visible message — "cannot drag a center" — on a new on-screen status strip.
- The cycle detector runs at the moment a formula is set, and knows that a center reference depends on both the start and the end of the same direction. Loops through the new letter are caught at edit time, not at run time.
- Center sits outside the existing invariant mechanism. The user's choice of which storage cell is the recomputed one stays at three options, not four. The save format is unchanged. Formulas containing the new letter are stored as the letter literally — not as the equivalent expansion in terms of start and end.
- The work breaks into four phases: phase zero (the strip itself), phase one (read-only center plus silent refusal), phase two (wire the silent refusal to the strip), phase three (optional — add center to the parts panel and debug logs).

The full proposal — including risk assessment with three high-stakes questions all answered, the four phases with what happens and what gets tested in each, and a phase-zero implementation plan — is in [16.formulas.md](../milestones/done/16.formulas.md).

### Thread three — phase-zero details for the status strip

The status strip is a small new on-screen surface that displays brief transient messages. The design was done in one round:

- Lives at the bottom of the graph region, between the build-notes button on the left and the guides slider on the right.
- Height matches the standard common-button height. Empty space below the strip and on each side equals one standard layout gap.
- Invisible by default. A message stays until the user clicks anywhere on the page; that click both dismisses the message and performs whatever else the click would normally do.
- Subsequent messages queue in order; each one surfaces when the previous is dismissed.
- Error-kind messages render in red text. Other messages render in the default text color. All messages are horizontally centered.
- The implementation plan: a new strip component, a small status store with show, dismiss, and clear helpers, a click hook that drives the dismiss step, and a two-line wiring change in the graph component. A temporary placeholder caller goes in during the phase and comes out before merging.

### What shipped — 2026-04-28 (continued)

- The rules catalog grew from forty-nine to fifty-seven rules. Eight new rules were added (with seven tests) plus a renumber-and-remove pass.
- Twenty new tests across two new files (the engine-behavior file and the preferences file) and several extensions to existing files. Test count moved from five hundred fifty-three to five hundred ninety-five, all green.
- A full design proposal for the center-letter feature, with phased implementation plan and risk assessment, sits in 16.formulas.md.

### Files touched — 2026-04-28 (continued)

- Catalog: [stipulations.md](../../guides/project/development/stipulations.md).
- Testing guide: [testing.md](../../guides/project/development/testing.md).
- New tests: [Engine_Behaviors.test.ts](di/src/lib/ts/tests/Engine_Behaviors.test.ts), [Preferences.test.ts](di/src/lib/ts/tests/Preferences.test.ts).
- Test extensions: [Data_Layout.test.ts](di/src/lib/ts/tests/Data_Layout.test.ts).
- Center-letter and status-strip proposal: [16.formulas.md](../milestones/done/16.formulas.md).

### Verification — 2026-04-28 (continued)

- Test suite: twenty-seven test files, five hundred ninety-five checks, all passing.

---

## Session — 2026-04-24 — parts eyeball coupling, dead-link sweep, formula-doesn't-refresh fixed

Five threads.

### Thread one — working-features summary edits

Two small touch-ups to the running feature list. Added "row numbers" and "persistent hide list" to the parts row to match what had already shipped. Trimmed "(font now large)" out of the editing row — the parenthetical read as a dated marker; the current font size is just the size.

### Thread two — dead-link fixes inside the notes tree

A first-pass sweep prompted by Jonathan's report of dead links. Real fixes that was done: the cadence link in the work index pointed to a file that had been moved into the now folder; the selection-algorithm link in the milestones index pointed to a sibling that actually lives in the now folder; the facets and lessons links in the same milestones index used a workspace-root path that breaks when the renderer resolves it relative to the current file; a checkbox in the code-debt list was wrapped as a link to a non-existent file. All five fixed.

### Thread three — dead-link sweep driven by the deploy build

The deploy log had eighty-five dead-link errors. Triaging them showed three real classes plus one false-positive class. Two ignore patterns were added to the docs-build config — one catches links to source-code files (which the docs site cannot route to anyway), the other catches links into the workspace's parent-level notes folder and the workspace-config command files. Inside the markdown, the workspace-root-style paths used in the milestone-32 facets folder and the current-work handoff were rewritten to proper relative paths. A handful of links lost track of subfolder reorganisations (the facets folder split into a designs subfolder and a use-cases subfolder); those got their subfolder names back. The "note on historical paths" framing at the top of the slow-handoff file was removed since preserving the old path text inside link labels is no longer the goal — labels were tightened to just the file name.

### Thread four — explained the click-on-dimensional bug

Jonathan reported that clicking on a dimensional number on the canvas was being ignored — the input box did not appear. Walked the click handler and surfaced the most likely cause: the editing-lock toggle is on, which makes the click handler bail out before any hit-type check runs. With the lock on, the cursor stays as the open-grab-hand even when over a dimensional, and clicks just possibly deselect the current selection. Fix is for the user to flip the lock — the small toolbar button at the top of the canvas. No code change.

### Thread five — built the parts-table eyeball coupling, then opened the formula-doesn't-refresh investigation

Coupling: clicking the self-visibility eye on a row that has children now also flips the other column's block-children flag. After the click, exactly one of the two eyes shows. Leaf rows and root row unchanged. One line added in the parts-table click handler.

Investigation, fixed: Jonathan reported that typing a new formula on a cell did not make the shape on screen update. The value column also did not refresh. Tracing logs were added across the whole chain — the attributes-panel commit handler, the compile-and-write step inside the constraints manager, the start and end of the propagate routine, the after-hook that fires when propagate finishes, and the canvas-out-of-date flip on the renderer. The logs proved every link in the chain fires end to end. The fault sat one step in front of the invariant pass: a small helper inside the constraints manager was running on every formula edit and writing the new length value into the end-of-axis bound, regardless of which cell the axis's invariant marker pointed at. On art's y-axis, where the invariant marker is the start, the helper overwrote y_max with a value computed from the old y_min plus the new depth — the formula on y_max (which says "track parent's end") was silently stomped — and then the invariant pass that ran immediately after used that polluted y_max to compute a new y_min, which cancelled out to the same old y_min. Net: every cell wrote back the value it already had. The fix: delete the helper and its six call sites. The invariant pass alone is enough to keep an axis consistent. The UI gate that disables the formula slot on the invariant cell, plus the scene-load step that clears any formula that somehow got onto an invariant cell, together guarantee the invariant pass never has to deal with a formula on the invariant cell — which is the only situation the helper could ever have been useful for. Caveat: existing scenes may carry corrupted bound values from prior runs of the helper; a one-time scene reload triggers a full re-evaluation and clears them.

### What shipped — 2026-04-24

- Formula-doesn't-refresh bug fixed: the redundant length-syncing helper was deleted along with its six call sites. The invariant pass now keeps each axis consistent on its own.
- The two-eyeball coupling on parent rows in the parts table.
- The "Cadence" jump and four other broken markdown links inside the notes tree.
- The docs-build config now ignores source-file links and parent-workspace links; many workspace-root-style paths inside the milestone-32 facets folder and the current-work handoff were rewritten to relative paths; subfolder names were restored on a handful of intra-facets links; the historical-paths header on the slow-handoff file was dropped.
- Working-features summary trimmed and topped up to match the latest shipped state.
- Tracing logs across the full constraints-and-render chain — used to find the formula-doesn't-refresh bug. Still wired; should be pulled in a small clean-up pass.

### Files touched — 2026-04-24

- Eyeball coupling: [D_Parts.svelte](di/src/lib/svelte/details/D_Parts.svelte).
- Working features: [working features.md](./working%20features.md).
- Dead-link fixes (first pass): [work index](../index.md), [milestones index](../milestones/index.md), [code-debt list](./code.debt.md).
- Dead-link sweep (second pass): docs config `di/.vitepress/config.mts`, [26.lacemaker.md](../milestones/done/26.lacemaker.md), [32.facets.md](../milestones/done/32.facets/32.facets.md), [theory.md](../milestones/done/32.facets/designs/theory.md), [32.facets handoff](../milestones/done/32.facets/handoff.md), [32.facets history](../milestones/done/32.facets/history.md), [bottlenecks](../milestones/done/32.facets/slow/bottlenecks.md), [slow handoff](../milestones/done/32.facets/slow/handoff.md), [current work handoff](./handoff.md), [road map](./road.map.md).
- Tracing logs (still wired): [P_Attributes.svelte](di/src/lib/svelte/details/P_Attributes.svelte), [Constraints.ts](di/src/lib/ts/algebra/Constraints.ts), [Engine.ts](di/src/lib/ts/render/Engine.ts), [Render.ts](di/src/lib/ts/render/Render.ts).
- Propagate-skip guard removed: [Constraints.ts](di/src/lib/ts/algebra/Constraints.ts) — the loop in propagate no longer skips the edited object. Useful side fix during the investigation.
- Length-syncing helper deleted along with its six call sites: [Constraints.ts](di/src/lib/ts/algebra/Constraints.ts). The invariant pass alone keeps each axis consistent.

### Verification — 2026-04-24

- Formula-doesn't-refresh: confirmed in the running app. After the helper was deleted, depth edits on art produced visible y-axis movement and the value column updated.
- Type-checker: should be re-run after the trace logs are pulled.
- Test suite: should be re-run after the trace logs are pulled.
- The eyeball-coupling change was reasoned through by trace, not run-tested in the browser yet.

---

## Session — 2026-04-20 — repeater template button, sibling-only names, formula rename, key-paths reference

Five threads in sequence.

### Thread one — add-template button for repeaters

Code-debt item shipped: when you select a part that has no children and open the repeat panel, the panel used to show only a small grey hint saying "need one child for the template". It now shows a real button labelled "add template". Clicking it creates one child sized identically to the parent — same width, depth, and height, placed at the parent's origin so it fills the parent exactly — names the new child "template", selects the new child, and re-renders the panel into the straight-or-diagonal chooser. The new child is always visible regardless of the parent's visibility flag.

### Thread two — sibling-only name uniqueness

The name-validation rule used to reject any name that any other part anywhere in the scene already had. The user reported wanting to use the same name on parts under different parents — for example, "drawer" inside a cabinet and "drawer" inside a kitchen layout. The validator was changed to scope the duplicate check to siblings of the part being renamed: cousins under different parents may now share names. Givens stay globally unique. Two new tests pin both directions of the new rule. The formula resolver was already scope-aware (it walks up the parent chain looking only at siblings at each level), so writer and reader are now consistent.

### Thread three — investigated a delete-not-removing-part bug

Jonathan reported: selecting a non-repeater grandchild and pressing delete clears the selection but the part stays in the parts table. Walked the delete routine in detail, ruled out the repeater-regeneration theory and the early-return paths, and arrived at the most likely remaining culprit — an exception thrown between the selection-clear step and the parts-list rewrite step, with the formula-reference walker being the most fragile candidate. Could not pin the failing step from static analysis alone. Open in the open-items section above; needs a console error message or a small repro scene.

### Thread four — formula rename helper, plus a structural-direction note

Jonathan reported: rename a part that another part's formula references; the formula text still shows the old name. Traced the cause: formulas hold reference tokens whose object field is the referenced part's name, not its identity. The compiled form binds names to identities at compile time, so evaluation kept giving correct numbers, but the displayed text and the on-disk save kept the old name — and a reload would fail to re-bind because the saved text held a name no part in the scene had any more.

Two routes were laid out. The targeted route mirrors the existing given-rename helper: walk every formula in the scene, rewrite reference tokens whose object equals the old name, recompile, re-bind. The structural route — store reference tokens by identity, not by name — was analysed in pros-and-cons and recorded as a future structural direction (see open items). The targeted route was done today: a new tokeniser helper that rewrites the object field of reference tokens, a new constraints helper that uses it across the whole scene, and a call from the part-rename flow right after assigning the new name.

A small clean-up went with it: the template-child creator was simplified to always name the new child "template" (no uniquify loop) and its now-unused argument was removed from the definition and its one caller — aligned with the new sibling-only uniqueness rule.

### Thread five — key-paths reference doc

A two-column table of every keyboard binding in the app, grouped by the context the key fires in. Keys mean different things on the canvas, inside a value cell, inside a name cell, inside a dimension or angle input, and inside the build-notes modal. Lives at [key paths.md](../../guides/architecture/ui/key%20paths.md).

### What shipped — 2026-04-20

- "Add template" button in the repeat panel for parts without children, plus the engine and runtime helpers behind it. New child is sized identically to its parent, named "template", and selected.
- The sibling-only name-uniqueness rule, with two new tests pinning the cousin-allowed and sibling-rejected directions.
- Formula reference tokens now follow part renames: a new tokeniser helper, a new constraints helper, and a call from the part-rename flow.
- A small reference document listing every keyboard binding by context.

### Files touched — 2026-04-20

- New child-creator: [di/src/lib/ts/runtime/Smart_Object.ts](di/src/lib/ts/runtime/Smart_Object.ts).
- New engine wrapper for the add-template flow: [di/src/lib/ts/render/Engine.ts](di/src/lib/ts/render/Engine.ts).
- Repeat panel button: [di/src/lib/svelte/details/P_Repeat.svelte](di/src/lib/svelte/details/P_Repeat.svelte).
- Sibling-only name rule and its tests: [di/src/lib/ts/algebra/Errors.ts](di/src/lib/ts/algebra/Errors.ts), [di/src/lib/ts/tests/Errors.test.ts](di/src/lib/ts/tests/Errors.test.ts).
- Token-rename helper: [di/src/lib/ts/algebra/Tokenizer.ts](di/src/lib/ts/algebra/Tokenizer.ts). Constraints helper that uses it: [di/src/lib/ts/algebra/Constraints.ts](di/src/lib/ts/algebra/Constraints.ts). Called from: [di/src/lib/svelte/details/D_Parts.svelte](di/src/lib/svelte/details/D_Parts.svelte).
- New reference doc: [key paths.md](../../guides/architecture/ui/key%20paths.md).
- Code-debt list: [code.debt.md](./code.debt.md).

### Verification — 2026-04-20

- Type-checker: zero errors, zero warnings after each step.
- Test suite: now five hundred eighteen tests, two more than at the end of the prior session, all green.

---

## Session — 2026-04-19 — manager split, parts-triangle hit area, banner action buttons

Three threads ran in sequence.

### Thread one — manager split

The big shared "stores" file had grown into two unrelated jobs: it held both the parts-tree machinery and the current selection. I pulled each out into its own file. The parts-tree file owns the collapsed-rows set, the tree walks, the show-hide generations, and a small toggle helper. The selection file owns the current selection, exposed as a paired reader and writer under one short name so callers can read with a property reference and assign with the same property reference. The big "stores" file is now back to general session and persistent values only.

The pass-through getter and setter that used to live on the hit-testing helper for the current selection were removed too. Every place in the codebase that used to read or write the selection through the hit-testing helper was redirected to talk to the new selection file directly.

### Thread two — parts-triangle hit area

A long thread of UI-pointer debugging. The visible triangle on each row had been drawn with a normal text character at a much-larger font size, sitting on a row whose own line height was set to zero. Two symptoms followed: the cursor over the visible triangle was the open-hand drag cursor of the canvas behind the panel rather than the pointing-hand cursor of a real button, and sliding the cursor across the title text of any row made the row below light up the moment the cursor crossed where the lower row's triangle would be drawn.

After several attempts that traded one symptom for another, the working layout is: the triangle button is a small fixed-size block sized to a line of the small body text. The painted character lives in a wrapper inside that block. The wrapper ignores the pointer entirely. So the visible character can grow on hover and poke above its row, but the part of the character outside the block is silent to the mouse — no row bleed, no flicker. On hover, the painted character grows to the largest preset size, fully opaque.

### Thread three — banner action buttons

A code-debt item shipped: the factory-reset button moved out of the bottom of the preferences panel, and the reinstall button moved out of the bottom of the library panel. Both now sit at the far-left end of their respective glow-banner headers, mirroring the small plus button on the far-right end. The shared glow-banner component grew a second slot for buttons on the left side that mirrors the existing right-side slot. The center-aligned title is unaffected by either slot.

The reinstall handler was lifted into the scenes manager as a one-call helper that wipes the user-saved files and bumps the library refresh signal. The library panel's refresh effect now also clears the highlighted row if it points to a file that no longer exists, so the wipe behaves the same as the in-panel button used to.

A small shared font-size constant for these buttons was added in the constants table; the app root now publishes it as a style variable so the banner buttons can refer to it. A polish followed: eight pixels of empty space above and below the separator inside the library panel.

### What shipped — 2026-04-19

- A new parts-tree manager file, holding nine generation-walking helpers and the collapsed-rows set.
- A new selection manager file, holding the current selection, with a property-style read and a property-style write.
- The pass-through selection getter and setter on the hit-testing helper were removed and every caller across the project (renderer, drag tool, scene save, mouse handlers, parts panel, several details panels) now talks to the new selection file directly.
- A redesigned hit area for the parts-table triangle that no longer bleeds across rows or interacts with the canvas behind the panel.
- A second slot on the shared glow-banner component for left-side buttons.
- The factory-reset and reinstall buttons moved into their respective banners and resized to a smaller form.
- A new one-call scenes helper that wipes user files and refreshes the library list.
- The library panel auto-clears its highlighted row when a refresh removes that file.
- A new published style variable for the smaller "reset"-class font.
- Eight-pixel separator gap inside the library panel.

### Files touched — 2026-04-19

- New: [Parts.ts](di/src/lib/ts/managers/Parts.ts), [Selection.ts](di/src/lib/ts/managers/Selection.ts).
- Trimmed: [Stores.ts](di/src/lib/ts/managers/Stores.ts).
- Manager re-exports: [managers/index.ts](di/src/lib/ts/managers/index.ts).
- Selection callers across the project: [Hits_3D.ts](di/src/lib/ts/events/Hits_3D.ts), [Hits.ts](di/src/lib/ts/events/Hits.ts), [Events.ts](di/src/lib/ts/events/Events.ts), [Events_3D.ts](di/src/lib/ts/events/Events_3D.ts), [Face_Label.ts](di/src/lib/ts/editors/Face_Label.ts), [Drag.ts](di/src/lib/ts/editors/Drag.ts), [Engine.ts](di/src/lib/ts/render/Engine.ts), [Render.ts](di/src/lib/ts/render/Render.ts), [R_Grid.ts](di/src/lib/ts/render/R_Grid.ts), [Scenes.ts](di/src/lib/ts/managers/Scenes.ts), [Graph.svelte](di/src/lib/svelte/main/Graph.svelte), [D_Parts.svelte](di/src/lib/svelte/details/D_Parts.svelte), [P_Angles.svelte](di/src/lib/svelte/details/P_Angles.svelte), [P_Repeat.svelte](di/src/lib/svelte/details/P_Repeat.svelte), [P_Attributes.svelte](di/src/lib/svelte/details/P_Attributes.svelte).
- Triangle hit area: [D_Parts.svelte](di/src/lib/svelte/details/D_Parts.svelte).
- Banner left slot: [Hideable.svelte](di/src/lib/svelte/details/Hideable.svelte), [Details.svelte](di/src/lib/svelte/details/Details.svelte). Removed buttons from [D_Preferences.svelte](di/src/lib/svelte/details/D_Preferences.svelte) and [D_Library.svelte](di/src/lib/svelte/details/D_Library.svelte). Helper added in [Scenes.ts](di/src/lib/ts/managers/Scenes.ts).
- Constants and root variables: [Constants.ts](di/src/lib/ts/common/Constants.ts), [App.svelte](di/src/App.svelte).
- Code-debt list: [code.debt.md](./code.debt.md).

### Verification — 2026-04-19

- Type-checker: zero errors, zero warnings after each step.

---

## Session — 2026-04-19 (continued) — file rename, face labels, undo/redo fix, build-notes table

Five smaller threads ran after the earlier session, each closing a code-debt item or a polish target.

### Thread one — rename of the canvas-stale helper file

Walked through the naming options in a short pros-and-cons cycle: render-gate, an interface-style prefix, stall-render, and finally the bare word "dirty". Picked the bare word — it matches the existing one-word file-naming pattern in the project, it is the long-standing software term for "modified, needs re-processing", and it leaves room for any future second consumer that wants to react to changes. Renamed the file, redirected the ten consumer files that imported it, and updated the file-map note.

### Thread two — face-label font

Bumped the on-canvas face name labels from a hard-coded ten-pixel size to the project's preset large size — about twenty-two pixels. The white background plate behind each label and the recorded clickable footprint each derive from the new font size, so the box still hugs the text and the labels are still hittable.

### Thread three — undo and redo

Investigated the long-standing redo question on the code-debt list. Found that the redo machinery was fully built — the stack, the method, the keyboard chord — but a single shared call inside both step-back and step-forward asked the scene-load routine to wipe history every time either ran. The doc comment on the scene-load routine already said the call should not wipe in this case; the code did not match the comment. Two-character fix in the engine. After the fix you can step back many times and step forward to undo each step back, and the chain holds together.

A small focused test was done alongside: it pretends the scene-capture call returns whatever marker we hand it, snapshots five marker values, walks back five steps, then walks forward five steps, and asserts the chain returns to where it started. A second test pins the existing rule that taking a fresh snapshot after stepping back wipes the forward chain.

### Thread four — attribute-table cross thickness

The little X marker that signals an invariant in the attributes table was too faint to read. Each diagonal line was drawn half a pixel wide, which the browser anti-aliases to a soft grey hairline. Bumped the offset to draw three-pixel-wide lines instead, in two steps. The hover-time variant was proposed (also draw the cross on hover, darker and thicker), discussed, and rejected as not needed.

### Thread five — build-notes table

Walked the git history from the previous build-notes entry through today, separated significant feature shipments from cosmetic tweaks, bug fixes, and mothballed branches, and added twenty-four new entries to the build-notes table. The bundler reads that markdown file at build time and turns each row into a small entry the in-app build-notes panel renders.

A couple of small clean-ups along the way: removed an unused separator import from the attributes panel that was a leftover from a prior edit; renamed a font-size constant the user had switched from one purpose name to another so the two consumers and the published style variable stayed aligned.

### What shipped — 2026-04-19 (continued)

- The canvas-stale helper file is renamed to a one-word concept name; the ten consumers and the file-map note follow.
- The on-canvas face name labels render at twenty-two pixels instead of ten; the white plate and the click footprint scale with the font.
- Undo and redo now keep the history alive across each step-back and step-forward; you can step many times in either direction.
- Two new tests pin the back-and-forward chain inside the history machinery and the rule that fresh snapshots wipe the forward chain.
- The attribute-table invariant cross is now drawn three pixels wide per diagonal instead of half a pixel.
- The build-notes table grew by twenty-four entries covering work from late February through today.

### Files touched — 2026-04-19 (continued)

- File rename: [Dirty.ts](di/src/lib/ts/common/Dirty.ts) (was Stale_Writable.ts). Imports updated in [Hits_3D.ts](di/src/lib/ts/events/Hits_3D.ts), [Units.ts](di/src/lib/ts/types/Units.ts), [Engine.ts](di/src/lib/ts/render/Engine.ts), [Stores.ts](di/src/lib/ts/managers/Stores.ts), [Selection.ts](di/src/lib/ts/managers/Selection.ts), [Angular.ts](di/src/lib/ts/editors/Angular.ts), [Face_Label.ts](di/src/lib/ts/editors/Face_Label.ts), [Drag.ts](di/src/lib/ts/editors/Drag.ts), [Dimension.ts](di/src/lib/ts/editors/Dimension.ts), [Colors.ts](di/src/lib/ts/utilities/Colors.ts). File map: [map.md](../../guides/project/overview/map.md).
- Face label font: [Render.ts](di/src/lib/ts/render/Render.ts).
- Undo/redo fix: [Engine.ts](di/src/lib/ts/render/Engine.ts). New test: [History.test.ts](di/src/lib/ts/tests/History.test.ts).
- Cross thickness: [P_Attributes.svelte](di/src/lib/svelte/details/P_Attributes.svelte). Unused import removed in the same file.
- Build notes: [builds.md](di/src/lib/md/builds.md).
- Constants and root variables: [Constants.ts](di/src/lib/ts/common/Constants.ts), [App.svelte](di/src/App.svelte).
- Code-debt list: [code.debt.md](./code.debt.md).

### Verification — 2026-04-19 (continued)

- Type-checker: zero errors, zero warnings after each step.
- Test suite: now five hundred sixteen tests, two more than before this session, all green.

---

## Session — 2026-04-18 — generational triangles, hide-count, performance second pass, measurement

Big session. Three threads ran in sequence:

### Thread one — generational triangles and the hide list

I shipped the full generational behavior for the parts-table triangles. A click reveals one more generation outward; holding option while clicking hides one more outermost generation; the triangle points right only when no descendants of that row are currently showing; if option-click on a row that has nothing visible below it, the collapse "bubbles up" and the row's parent is collapsed instead, with the selection moving up accordingly. The hide list is now saved to the browser between reloads. Arrow-left and arrow-right on the selected row mirror the two click modes. Changing collapse state does not mark the render as stale unless the selection actually moves; changes that only affect the parts table do not trigger a repaint.

The data model stayed the same on purpose — one flat list of identifiers where each entry means "the children of this row are hidden". The new logic interprets that list at different relative depths to step layer by layer.

### Thread two — the render pipeline, second pass

I audited where each paint spends its time, found five proposals, and wrote them into the bottlenecks file. Three shipped, two deferred. The full-status entries for each are in that file.

### Thread three — measurement

Instrumentation was wired in so we could see where the paint actually spends its time. The numbers, over a scene of roughly one hundred parts during tumble, showed that the dominant cost was the cross-object intersection compute. The pooled clipper saved about fifteen to twenty percent. The remaining cost is structural — dense scenes generate too many face-pair intersections to clip at interactive rates, and the outer bounding-box prune is useless when every part's box overlaps every other. Jonathan chose to accept the current limit rather than take on the risks of a further rewrite. The instrumentation is now silent but left in place for the next time we need to measure.

### What shipped this session

- Five parts-table code-debt items.
- A generational collapse model, wired through click, option-click, right arrow, left arrow, and the reveal-on-select behavior.
- A persistent hide list.
- A file-level rollback switch for the pooled edge-vs-face clipper.
- Pooled scratch lists and records for the inner occluder loop.
- Named scratch math objects for nine hot allocation sites.
- A light-weight variant of the clipper used by the dashed-grey invisible-part pass.
- A per-paint timer, phase breakdown, and counters for the cross-object pair loop, currently silent behind a top-of-file constant.
- Updates to the bottlenecks file with the second-pass status and the measurement findings.
- The leftmost small-number column in the parts table now shows each row's position in the visible list instead of its sibling index within its parent. Root is blank.
- The little "X of Y" label above the selected part's name (visible when the parts table is hidden) now reports the row's position in the visible list and the total count of visible rows, matching the first column.

### Files touched this session

- Render loop and paint code: [Render.ts](di/src/lib/ts/render/Render.ts).
- Engine loop and timer: [Engine.ts](di/src/lib/ts/render/Engine.ts).
- Stores (generational helpers, persistent hide list): [Stores.ts](di/src/lib/ts/managers/Stores.ts).
- Preferences (new key and set-persistence helper): [Preferences.ts](di/src/lib/ts/managers/Preferences.ts).
- Parts table component (triangle click, hide-children count, parts-count): [D_Parts.svelte](di/src/lib/svelte/details/D_Parts.svelte).
- Events (keyboard arrows defer to generational helpers): [Events.ts](di/src/lib/ts/events/Events.ts).
- Bottlenecks write-up: [bottlenecks.md](../milestones/done/32.facets/slow/bottlenecks.md).
- Code-debt list ticking items off: [code.debt.md](./code.debt.md).

### Verification

- Type-checker: zero errors, zero warnings across every intermediate step.
- Test suite: five hundred fourteen of five hundred fourteen tests pass.
- Real-world tumble measured on a roughly hundred-part scene before handing back.
