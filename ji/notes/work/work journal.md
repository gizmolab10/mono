# Work journal

Reverse chronological log of finished work on ji (the Jeff intersection project).

## 2026-07-14 — more file types a drop keeps

- **Seven more formats.** A drop now also saves markdown, html, rich text, and svg (kept as their plain text), plus webp images and Word doc / docx files (kept as wrapped bytes). The specific text types are matched before the plain-text catch-all so markdown and html aren't flattened to plain text. Tiff was left out — a browser can't show one, so there'd be no preview later; Word files store the same way but we accepted them anyway. The "accepted types" hint under the drop box lists them all straight from the type list, so it stays current on its own.

## 2026-07-14 — cutting the di leftovers

- **Trimmed the saved settings.** The settings list came over whole from di, carrying dozens of keys ji never touches (edge thickness, grid opacity, view mode, orientation, help sidebar, and more). Cut every key with no reader — the list is down to the seven ji actually uses (the details toggle, the current add-mode, the active store, the more/less choice, and the accent and text colors). Also renamed the saved-settings name-tag from "di:" to "ji:", so old di-era settings are ignored and everything starts fresh.
- **Cut the unused colors.** ji copied di's whole color engine — slider thumb/track/tick, focus halo, selection, and an edge color that fed 3D-part tints. Nothing on ji's screen reads any of those. Removed them and the machinery that derived and published them; only the accent, its lightened background, the hover shade, and the text color remain, and the color publisher now sets just the four page-variables something reads.

## 2026-07-14 — a diagnostic log that lives in a file

- **One log address for every project.** The hub's little log server used to answer a separate address per topic (only di's, hard-wired to one file). It now answers a single address and reads the file name from the request — send `where=intersection` and it writes `logs/intersection.log`. The name is checked so it can't point outside the logs folder. di's two log senders moved to the new address; the old one is gone.
- **ji writes to its own log now.** A tiny helper sends each line to that address (overwrites once at the start of a session, appends the rest), so a whole session's reasoning ends up in one file you can read afterward instead of only in the browser console.
- **Every log line ji already prints now goes to the file.** Swapped all the console prints over to the helper (the two failure warnings left as-is). Confirmed end-to-end: lines land in `logs/intersection.log`, the first one truncates and the rest append, and a bad file name is refused.

## 2026-07-14 — the table headers become the controls

- **Header row on the rule.** Above the documents table sits a row of column labels — format, document name, tags, edit tags — each a pill floating on the rule (the same look as the data panel's more/less), left-aligned to its column. Format and the last one are inert; the middle two light up on hover, where their text swaps to "add a document" / "add a tag".
- **Headers open the add flows.** Clicking "document name" shows the drop box, clicking "tags" shows the new-tag field. So I pulled the old "Add a new document / tag" control out of the top bar entirely — the headers are the entry point now, and the top bar is just the hamburger and help.
- **A click on the empty background closes an add flow** back to the list, leaving the picked filters alone. The new-tag view also has its own "done".
- **Empty store leads with the drop box.** With no documents, the view opens straight to the drop box and hides the filter, the search box, and the headers — nothing to filter or list yet.
- **Tags are one joined control now.** The tag chips became a single segmented pill (still multi-select — several can be lit), used both in the filter and in a row's edit-tags picker. The all/any toggle moved inside it and hides when there are no tags, and an "add a tag" button sits just to its right.
- **Search box.** Switched it to the browser's own search field so it draws its own clear ×; gave it a set width; and made both text fields share the standard control height.
- **Tidied the folders.** Renamed the tags folder to actions, moved the drop box in beside the tag pieces, moved the documents view into main, and deleted the emptied documents folder.

## 2026-07-13 — more file types, and a hint of what's accepted

- **More types save.** A drop now keeps text, jpeg, png, gif, bmp, and pdf — text as its plain contents, the rest as a data-URL (their bytes base64-wrapped, ready to show). Anything else is skipped with a note.
- **Accepted-types hint.** Under "drop documents here" sits a smaller centered line listing the types a drop will keep, read straight from the type list so it can never go stale.
- **Browse shows the type.** The browse view is now a two-column table — each document's type beside its name.
- **Erase names the store.** The confirm reads "erase all your local data?" (or firebase), the buttons pinned left and the question centered in the space beside them.

## 2026-07-13 — a live filter, one source of truth

- **Search state in one place.** A small `Search` module now holds the picked tags, the filter text, and the all/any mode, plus one function that narrows the documents. Every view reads it, so nothing keeps its own copy.
- **All or any.** A little segmented control at the far left of the tag row switches whether a document must carry every picked tag or just one of them.
- **Filter as you type.** A "filter by name" box sits under the tags; typing narrows the list at once, alongside the tag filter.

## 2026-07-13 — the always-on layout

- **One screen, no view-switching.** Rebuilt the content area to the intersection spec: a full-width accent controls row at the top (hamburger left, "Add a new document / tag" centered, help button right), then the tag chips, a rule, and the documents table — all always shown. Clicking "add new document" swaps the table for the drop box; clicking it again returns.
- **Chips filter, all-must-match.** The tag chips at the top double as a filter — picking chips keeps only documents that carry **every** picked tag.
- **Build + credit moved to the frame.** The "Build N" opener and "built by" credit now pin to the frame's bottom-left at the frontmost layer; the details region lost its empty top banner.
- **Files reorganized.** The old `operations/` folder became `documents/`; the tag pieces moved to a `tags/` folder; Add → Add_Document, Browse → Documents. Activity and the Enumerations file are gone (the operation enum lives in Operations now).
- **A pile of hand-tweaks.** Controls row sized to its controls with no vertical gaps; documents content gets an even `--gap` margin; the drop box a `--gap-fat` inset on three sides; the tag chips centered; the storage switcher moved to the far right of its row; the divider rule made visible again after the flex-column change hid it.

## 2026-07-13 — erase, a remembered toggle, and data-panel polish

- **Erase all.** A far-left "erase" button on the switcher row wipes the active store after an inline "erase all your data? yes / no"; while it asks, the erase button and the switcher both hide. Only the active store is touched — the wipe clears every record and every blob and saves it empty. A driven test proves it stays empty after a reload.
- **Remembered more / less.** Whether the storage switcher is shown is now a saved setting, so the choice survives a reload.
- **Dropped the unsaved readout.** It always read zero — the local store saves each change the instant it happens — so it was pulled until it means something for a cloud store.
- **Layout tidy.** The switcher row got a fixed height so clicking erase no longer squashes it, the erase button was matched to the switcher's height, and the rule and the row were nudged a few pixels tighter without changing the space below.

## 2026-07-13 — the store meets the screen

- **Drop to save.** Dropping files on the add view now saves each text file into the active store — its name, its kind, its contents. Images and pdfs are skipped with a note until we decide how to hold binary bytes.
- **Browse lists names.** The browse view shows every saved file's name, live: a drop or a delete updates it at once, with a quiet "no documents yet" when empty. The browse segment shows it now; the arrival text still shows when nothing is picked.
- **A data readout.** A "data" panel in the details region reports the document, tag, and unsaved counts, plus a storage switcher tucked behind a small "more / less" label that floats on a broken rule. Only the local store is built, so the cloud segment sits dimmed until firestore.
- **One live tick.** All three stay current off a single "the store changed" signal the store nudges on every save and every switch.
- **A freeze, caught.** The browse list first locked the page — it rebuilt a brand-new list inside a repeating step, which the framework saw as "changed" and ran again, forever. Fixed by making the names and the counts derived values — pure formulas that can't retrigger themselves.

## 2026-07-13 — document store built

- **Built the database repository** from [[db spec]] and [[db proposal]]. It's the ws plugin store ported whole — a registry that swaps storages, a shared base carrying the save / load / add / delete, thin storage subclasses — but the data is ji's own: five records (documents, tags, tagging, relationships, predicates) plus the document bytes kept outside the store.
- **Records live in browser storage,** each storage under its own name so two never collide. The bytes go through a read-by-id / write-by-id seam; the local storage parks them in browser storage for now (real files on disk come later).
- **Reads run off in-memory lookups** rebuilt on load — never saved. List documents walks the parent graph from each root (a node can have many parents; the walk won't loop). Filter by tag is one lookup. An inbox lists the untagged. Delete is a cascade: drop the links and the bytes, no orphans left.
- **Only the local storage is built;** the cloud one (firestore + Google's file store) is a drop-in for later, no changes to the base. Proven with a driven test — save a document and list it back after a reload, tag and filter, ordered children under a parent, delete leaves nothing behind. Type-check clean.
- **Killed the earlier flat one-record store** — it was the wrong shape (a plugin engine, not a single localStorage call).

## 2026-07-12 — design tokens complete + ws store scouted

- **Everything is a token now.** Extended the one-source system past sizes to cover every remaining design value: paddings and the header margin, the table column widths, font weight, letter-spacing, the two ink blacks/whites/gray, the popup shadow, and the dimming opacities. Each lives once in Constants (or Colors), is mirrored to a CSS variable at startup, and read with `var(...)`. No size, color, font, weight, spacing, border, radius, inset, shadow, or opacity is hardcoded in a component anymore — only structural `100%` fills and `0` resets remain.
- **One knob for bold.** Font weight is a single base number with two derived weights (banner, title); the whole interface's weight moves with it.
- **Ink colors joined the color pattern.** `black` (`#1a1a1a`, never `#000`), `white`, and `gray` live in Colors and push through Configuration, same as the theme tokens.
- **Fonts read bolder.** Loaded the medium Montserrat weight and preload it, so the heavier text is a real face, not browser-faked. (A wider bold range would want the variable font, which isn't installed.)
- **Small UI.** The build-notes close button fills with the hover color on pointer-over.
- **Scouted ws's document store** and wrote `notes/work/db spec.md` — what the ws persistence engine does (registry, base CRUD, the kept storages, the localStorage primitive), minus airtable/bubble/hierarchy. Finding: don't port the framework (it drags in Firebase + a large engine); ji needs only the local pattern — one localStorage key holding a JSON list of records.

## 2026-07-11 — design tokens: every size derived from one base number

- **One source for all sizes.** Every hardcoded number in the components — corner radii, heights, gaps, insets, font sizes, border widths, icon sizes — now comes from a single Constants file, where almost everything is a fraction or multiple of one base "comfortable tap" size (35). Change that one number and the whole interface rescales together.
- **The bridge.** Plain stylesheets can't read the TypeScript Constants, so a startup step mirrors the values onto the page as CSS variables (stacking layers, then all the layout sizes). A small global stylesheet (`main.css`) holds the stacking-layer classes; every component reads the rest with `var(...)`. Colors already worked this way; layers, metrics, fonts, insets, thicknesses, and icon sizes now do too.
- **Swept in waves.** Went value-family by value-family (radii, heights, gaps, fonts, insets, borders, icon sizes), each time finding every occurrence, routing it through the bridge, and confirming none were left. A few values shifted a fraction of a pixel where a tidy ratio replaced a round number — intended.
- **Icons on the size scale.** The hamburger and close-cross svgs now take their drawing and render sizes from the size constants; the hamburger box was made to match its drawing, so the old "let it spill over" setting could go.
- **Small UI.** The build-notes close button now fills with the hover color on pointer-over.

## 2026-07-11 — segmented control, arrival default, font twitch

- **Renames + reshuffle.** The layout frame is now Intersection (was Main), the content region is Activity (was Content), and the details-toggle icon is Controls (was Hamburger). The operation names moved into their own file under common as a small enum (browse / add / search, stored as one-letter codes).
- **Segmented control.** The old "add" pill became one segmented control driven off a single list of the operations. It then moved into the Controls cluster, so the hamburger and the segments sit together as one fixed group at the top-left, visible whether details are open or closed.
- **Arrival default + toggle-off.** Clicking the segment that's already on clears the selection to nothing, which drops the content to the arrival landing. The app now opens with nothing selected (arrival), and a chosen operation still survives a reload.
- **Add view trim.** Removed the back arrow from the add view (and its now-dead click wiring); getting back to browse is the browse segment. The drop rectangle keeps top room so it clears the control cluster.
- **Font twitch fixed.** On refresh the segment pill twitched a few pixels because the web font swapped in after the first paint. Fixed by preloading the two Montserrat weights the instant the bundle runs, so the font is ready before first paint — no late swap, no reflow. The preload paths come from importing the same font files the CSS uses, so nothing hardcoded goes stale.

## 2026-07-10 — add-document flow (skeleton) and picker polish

- **Add flow, Phase 1.** New content-mode store (browse / add / search); an "add" pill next to the hamburger switches to add mode; the content area swaps to a new Add view with a large drop-here rectangle that logs the dropped files. Persistence, tags, and the document store are still to come.
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
