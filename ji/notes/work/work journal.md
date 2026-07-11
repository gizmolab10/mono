# Work journal

Reverse chronological log of finished work on ji (the Jeff intersection project).

## 2026-07-10 — add-document flow (skeleton) and picker polish

- **Add flow, Phase 1.** New content-mode store (browse / add / search); an "add" pill next to the hamburger switches to add mode; the content area swaps to a new Add view with a large drop-here rectangle that logs the dropped files. Persistence, categories, and the document store are still to come.
- **Color picker rebuilt.** The accent picker no longer leans on the native color swatch — the visible circle is our own element (background `--accent`, `--hover` on hover) with the real color input laid invisibly on top to catch the click. That fixed the hover the native swatch kept ignoring.
- **Polish.** The hamburger paths gained a permanent black 0.5px outline (hover changes only the fill). The add pill got a black border and `--hover` fill. The preferences banner fills `--hover` on hover.

## 2026-07-10 — auto text color

- **Text adapts to the theme.** Text flips white/black by background luminance so it stays readable at any accent. Two derived colors, computed in Colors when the accent changes: the content text from `--bg`, the details-region text from the accent (`--text-on-accent`). Wired the "Intersection" text to `--text` and the details banner to `--text-on-accent`.
- **Hamburger recolor.** On the content (details hidden) it's fixed black, turning the accent color on hover. On the accent (details shown) it flips with the accent and hovers to its opposite (`--text-on-accent-hover`). The build-notes popup is left alone — a fixed white card.

## 2026-07-09 — author credit

- **Author credit.** Added a small "author: jonathan sand" link in the content region, stacked under the "Build N" opener in the bottom-left corner — 4px gap, left-aligned, font two-thirds the opener's size. It opens jonathansand.me in a new tab and turns the accent color on hover.

## 2026-07-07 — content, hamburger, preferences

- **Content component.** Pulled the centered "Intersection" text and the "Build N" opener into their own Content component; the opener moved to Content's bottom-left corner, white background.
- **Popup takes over.** While the build-notes popup is open, the details and content regions hide (only the popup shows over the frame). Its open/closed flag lifted up to the frame so it can hide them.
- **di's hamburger.** The details toggle now draws di's exact hamburger icon (from the ported path utility) as a reusable snippet, shown at the same top-left spot whether details is open or closed; transparent background, white on hover, and an overflow fix so its left edge isn't clipped.
- **Show-details persists.** The show/hide state is now a saved preference (through the ported Preferences), so it survives a reload.

## 2026-07-07 — details toggle

- **Details region collapses.** A "details" banner atop the region hides it on click, so the content fills the full width. A fixed button in the upper-left corner (colored to match) brings it back.

## 2026-07-07 — rename

- **Renamed `in` → `ji`** across the folder, hub references, workspace list, the project's own config/package/guide, and the slash command. Re-linked the workspace and confirmed a clean type-check. Netlify base directory and the git commit left for Jonathan.

## 2026-07-06 — build notes, the cross, and theming

- **Two-line title.** Split the centered "Intersection / Hey, bro!" onto two lines.
- **Build notes popup, ported from di.** A "Build N" opener button (pill border, hover fills light gray) opens a modal listing build history, paged ten at a time with up/down arrows and a close button. The build data comes straight from a markdown table read at runtime, so editing it refreshes live. Applied the same direct-read change back to di.
- **The close cross.** Ported di's full SVG-path utility (plus its geometry and prototype-extension files) and used it to draw di's real X in the close button, inside a circular border.
- **di's color system.** Ported di's Colors plus its preferences and canvas-stale helpers, added the color2k package, and lifted just the CSS-variable setter out of di's Configuration (leaving its engine behind). Wired it so the color stores push `--bg` / `--accent` / `--hover` onto the page — the theme variables di components expect.
- **di's layout skeleton.** Rebuilt Main around di's frame: a fixed full-window frame with a details region and a content region (di's "graph", renamed), di's spacing numbers inlined.
- **Preferences banner + accent picker.** A collapsible "preferences" banner in the details region holds di's accent color picker, wired to the ported Colors — choosing an accent recolors the theme live. Fixed a "missing bottoms" report by giving the details region the accent color so the banner and body stand out against it.

## 2026-07-05 — into the hub, onto the web

- **Added the project to the hub.** New entry in the hub's ports list (port 5184), a button + keyboard shortcut in the hub page, and a dev-server line in the launcher script. Fixed a leftover port clash — the project's dev config still pointed at lv's port — and added it to the repo's workspace list.
- **Wired the public site.** Pointed intersection.lol (via Dynadot DNS) at the Netlify site, set Netlify's base directory and build, and worked through a stuck Let's Encrypt certificate by removing and re-adding the domain.
