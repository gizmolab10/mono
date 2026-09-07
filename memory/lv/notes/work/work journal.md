---
kind: analyze
title: "Journal — design decisions and stack"
description: "Not in scope for the first pass"
tags: [keep, now]
date: 2026-08-23
---
# Journal — design decisions and stack

## Decisions

- **Home page source.** The home address renders one md file — the one named after the project today, "Little Cloud Vineyard".
- **Many md files, one page at a time.** The address bar names which md file shows. Wiki-links between md files behave like normal navigation.
- **Page navigation behavior.** A click on a sidebar entry or a wiki-link swaps the content without a full reload. The address bar updates to match. Sidebar state — scroll position, which sections are collapsed, whether the sidebar is shown or hidden — survives the swap.
- **Sidebar source.** Built at runtime from every md file's top settings; there is no hand-written sidebar file. Each page contributes one entry, labelled by its file name (the home page by its pretty title).
- **Order in the sidebar.** Home first, then the other top-level pages alphabetically, then one section per folder. Folders are listed alphabetically, each holding its pages alphabetically.
- **Section headings in the sidebar.** Match subfolder names of the md folder, character for character. Children sit indented underneath. Each section is collapsible. Depth beyond one level of subfolder is TBD until the site grows.
- **Home entry in the sidebar.** Sits above all other entries, in bold, with a divider underneath. The bold and the divider are produced by the builder. The home page is the one whose top settings include a `home: true` flag.
- **Active sidebar entry.** The entry for the current page shows a slightly darker, pill-shaped background behind its label.
- **Active state when the current page is not in the sidebar.** Nothing is highlighted.
- **Every md file appears.** Every page in the md folder shows in the sidebar. A page present but not the home page still gets an entry; its URL renders the file as usual.
- **No home flag found.** If no page is marked home, the sidebar lists every page alphabetically with no pinned entry and no divider.
- **Empty md folder.** Out of scope; assume the folder is not empty.
- **Sidebar visibility.** Optionally hidden behind a toggle. On mobile, two modes — sidebar plus status, or content plus status — and the toggle switches between them.
- **Toggle button.** Lives at the top left of every page as its own component, owned by the page shell — not by the sidebar component. Persists even when the sidebar is hidden, so the reader can always bring the sidebar back.
- **Status line.** A blank strip at the bottom of the page. When a click hits a sidebar link whose md file is missing on disk, the status line shows a broken-link error. The next successful click clears it.
- **Wiki-links.** Look and behave like normal links — same colour, same hover, same click-to-navigate. Open the target page.
- **External links.** Open in a new tab.
- **Frontmatter scope.** Allowed entries: pretty title, redirect, subtitle, author, date, and a `home` flag that marks the home page. The sidebar reads the title and the home flag today; behaviour of the rest is TBD.
- **The order a gallery is shown in.** It belongs to the folder, in one list — `order.md` beside the pictures, naming them one to a line. A file's line is its place, so nothing is numbered and no picture is rewritten to reorder it. A folder with no list is in file-name order; the first move writes the list whole.
- **The caption belongs to the picture**, inside the file, as it always has — so a picture away from this site still says what it is.
- **Images.** Pulled from the assets folder. The loader searches the assets root and all its subfolders. Image filenames are unique by guarantee.
- **Embedded md files.** Supported by the parser but not expected to come up.
- **Math, code-block highlighting, body-tag syntax.** Out of scope for the first pass; listed under "Deferred" below.
- **Centered line.** Written as a `> [!center]` callout. The single styling file strips the box, border, icon, and padding for the `center` type, and centres the text inside. Other callout types keep their default boxed look.
- **Single styling file.** Every look-and-feel rule for the site lives in one styling file: typography, sidebar layout, status line position, callout overrides (including the `[!center]` strip-and-center treatment), active-entry pill, home-entry treatment. The file is imported once at the app's entry point and applies to every page.
- **CSS folder location.** A new `css/` folder lives directly under `src`, sibling to `md` and `assets`. The single styling file lives inside that folder. This keeps look-and-feel sitting at the same level as content (`md`, `assets`) rather than alongside implementation code (`lib`).
- **Parser stack — markdown-it dropped.** `markdown-it` and `markdown-it-task-lists` were already in `package.json` from earlier work. We dropped both and committed to the unified/remark stack named in "Stack chosen" below. The two markdown-it packages will be removed; the seven remark packages will be added.
- **Wiki-link handling — string preprocessor instead of `@portaljs/remark-wiki-link`.** The plugin crashed at runtime because its dependencies pin it to micromark v2 but the rest of the stack runs micromark v4. Every wiki-link plugin in the ecosystem (`remark-wiki-link`, `remark-wiki-link-plus`, `remark-obsidian-link`) shares the same pinning. Instead of holding the stack back to micromark v2, we wrote a small preprocessor that turns `![[name.png]]` and `[[Other Note]]` (and the `[[Target|Display]]` alias form) into standard markdown image and link syntax, using the name-resolver to fill in URLs. Standard `remark-parse` then handles the result. Trade-off: the preprocessor runs on the raw string rather than the parsed tree, so wiki-link syntax inside fenced code blocks gets transformed too. Edge case is not expected to come up; can be fixed later by walking the tree instead.
- **Relaxed link form: spaces inside standard `[Label](URL)` allowed.** Standard markdown stops the URL at the first space, so `[Home](Little Cloud Vineyard)` would normally render as plain text. The preprocessor finds the relaxed form and replaces internal spaces with `%20` before the parser sees it. The legitimate `[Label](url "title")` form is left alone because the regex excludes the quote characters that mark a title.
- **Sidebar state remembered across reloads.** The browser's local storage holds two small things: whether the sidebar is shown, and whether each folder is open or folded (kept by folder name). Both load at startup and save on change. A first-time visitor, or a browser with storage turned off, falls back to shown and open.
- **Menu and fold triangle buttons are drawn, not typed.** The three-bar menu decoration and the fat-cornered fold triangle are the same shapes the di project uses. Their drawing math was copied into this project and stripped of di's geometry helpers, so this project stays independent. The triangle points right when a folder is folded and turns a quarter-turn to point down when it opens. Both take their colour from the surrounding text.
- **Type checker includes only imported types.** The checker was pulling in every shared type package in the monorepo and warning about one with no definitions. It now includes only the types the code actually imports, which clears the warning without changing any behaviour.
- **Image embeds can carry a size.** After the bar in an image embed, a plain number sets the width and a number-by-number sets width and height — the same shorthand Obsidian uses. The picture is then drawn at that size. Any other text after the bar is still treated as the caption.
- **Tests live in their own folder.** The unit tests moved out from beside the code they check into a single `test` folder next to the code folders, with their links to the code repointed to match.

### 2026-08-21 — editing from the published site

**Proved on the live site: a photo added, a caption written, both showing.**

- **A page cannot write to disk, and the published site has no server**, so three small pieces of code run at Netlify: change a caption, add a file, delete a file. Each checks a passphrase, does the work against GitHub, and commits. Netlify sees the commit and rebuilds.
- **The page picks its own doorway** by where it is running — the dev server while `yarn dev` runs, Netlify on the live site.
- **The passphrase is the only guard.** Typed once, remembered in that browser, forgotten when it is wrong. Netlify holds the real one, and the key to the repository, and the page holds neither.
- **A file added from the live site travels in the request**, which Netlify caps at about five megabytes. A photo fits; a movie is a job for the dev server. The refusal is said twice — by the page before it sends, and by the function if it arrives anyway.
- **The commit is made the long way** — a blob, a tree, a commit, then the branch moved — since that path takes a file of any size where the short one stops at a megabyte.
- **`lv.technical` says three things now**: unset, and there is no edit button at all; false, and the table shows without the drop box; true, and a file may be added.
- **A caption's words are not its language.** exifr hands a title back as a pair — the language and the words — and the first read took the language, so every jpeg's caption read `x-default`. The words are taken now, in every shape a title arrives in.
- **A file thrown away leaves the working files only.** Every commit that held it still holds it, so deleting frees nothing in the repository.

### 2026-08-21 — the photo gallery

- **A gallery is one folder of pictures.** Each folder under `src/assets/` is a gallery, shown one picture at a time. The build already found every picture there but filed each by name alone; one more function keeps the folder as well.
- **A folder's name is matched loosely.** Case is ignored, and a space, a hyphen and an underscore all read as the same character — so `the vineyard` answers a page asking for `the-vineyard`, and a dropped picture goes into the folder already on disk rather than making a second one beside it.
- **A gallery is asked for as a callout**, `> [!gallery] the vineyard`, with `|400` after the name to draw every picture 400 tall. The first structure tried was `![[gallery: x]]`, and Obsidian read it as an embed of a note by that name, found none, and offered to make one. A callout is a shape Obsidian draws without complaint; the preprocessor catches it before the callout plugin runs, the same path the centered line takes.
- **Html cannot answer a click**, so the renderer finds each gallery's empty box in the finished html and builds a live piece inside it. Each one is taken off as the page changes: the arrow keys are heard on the window, and a window listener outlives the element that set it.
- **Movies play**, with sound and their own controls, and start on their own. A movie is not the button that steps to the next picture — its controls own every press inside it — so the arrow keys do that. Stepping away builds a fresh element, which stops the movie.
- **A picture is called by the title it carries inside itself.** JPEG keeps one in an XMP block, PNG in a `tEXt` chunk, GIF in a comment block, a movie in a `©nam` block inside its description. No browser hands a page what a file carries, so the titles are read while the site is built and handed over as a plain list. A file carrying none is called by its file name.
- **Only the jpeg goes through exifr.** exifr reads no gif and no movie at all, so those two and the png are read by hand.
- **One movie in three is refused a caption.** Writing one adds bytes inside the movie's description; where that description sits before the picture data, every offset into that data would shift and the movie would break. Where it sits last — an iPhone movie, for one — nothing moves.
- **Captions are written from the app.** A technical preference, off for everyone else, shows an edit button; pressing it turns every gallery into a box to drop a picture into, with a table under it — one row per file, its caption typeable, written into that file when the cell is left.
- **A page cannot write to disk**, so the dev server does the writing and the page asks for it. The edit button does nothing on the built site.
- **The file travels as itself.** Turning a 53 MB movie into text first made two more copies of it in the browser's own memory, and the drop died there. The bytes now go as the body, with the folder, the name and the caption riding as headers.
- **Every refusal is written to the log.** A refusal that only reaches the screen leaves the log saying nothing happened at all.
- **The titles are read again whenever a file changes.** The list is built once and held; nothing about it tells the dev server a file on disk changed, so the assets folder is watched and any file arriving, changing or leaving throws the list away.
- **Editing survives the reload** that follows a write, so a run of captions can be written one after another.
- **No scrollbars.** The sidebar and the page still scroll by wheel, trackpad and arrow key; the bars are never drawn.
- **The hamburger is out of sight** for now. Its button and its styling remain; one line in the page shell brings it back.

## Deferred — possible future features

Not in scope for the first pass. Listed for the record so they are not forgotten:

- Math expressions — `$...$` and `$$...$$`.
- Syntax-highlighted code blocks with language tags.
- Inline body tags — `#wine`.
- Wiki-links into a heading — `[[Note#Heading]]`.
- Wiki-links into a block — `[[Note^id]]`.
- The parser support that the two wiki-link forms above need: every heading gets a slug-ified ID, and `^id` markers at the end of a block become IDs on the rendered HTML. Without those, the in-page scroll cannot work.

## Stack chosen

1. `unified` plus `remark-parse` for standard markdown
2. `remark-frontmatter` for the top three-dashed block
3. A small in-house preprocessor that rewrites `[[Other Note]]` and `![[name.png]]` to standard markdown link and image syntax (using the name-resolver to fill in URLs) before the parser sees the text
4. `remark-callout` for `> [!note]` blocks
5. `remark-rehype` plus `rehype-stringify` to produce HTML

**Composable** — any piece can be swapped without rewriting the others. The wiki-link library accepts a name-resolver, so links route through the loader's map. The pieces are stable rather than freshly maintained — last releases range from 14 to 32 months ago — which fits the maturity of the underlying syntax.

**Ruled out** — all-in-one alternatives like `remark-obsidian` (less recent releases than the composed pieces) and the `markdown-it` family (its Obsidian-flavoured plugins look less recently updated than the remark equivalents).

## Implementation progress

The six steps from the proposal's "Order of work":

- [x] Step 1 — page shell with the three regions and the toggle button. CSS folder and single styling file imported at the app's entry point.
- [x] Step 2 — loader stood up. Sees every md file under `src/md/` (including pages inside folders) and every image under `src/assets/`.
- [x] Step 3 — parser plus name-resolver; render the home md file in the content region.
- [x] Step 4 — router plus click handling (link interceptor and back/forward listener).
- [x] Step 5 — status line; read `Sidebar.md` to drive the sidebar.
- [x] Step 6 — sidebar component (active-entry pill, collapsible sections, home-entry treatment) and the `[!center]` callout override.
- [x] The photo gallery — see the entry above, and [photo gallery](photo%20gallery.md) for how each piece works.
- [x] Reordering a gallery — the table shows where each file sits, a click or the up and down keys move the highlight, option with them moves the file, and the list is written by the dev server or by Netlify. Both wrap at the ends. Proved on 2026-08-23 with `yarn dev`.

## Sources

- [@portaljs/remark-wiki-link on npm](https://www.npmjs.com/package/@portaljs/remark-wiki-link)
- [remark-callout on npm](https://www.npmjs.com/package/remark-callout)
- [remark-obsidian on GitHub (heavycircle)](https://github.com/heavycircle/remark-obsidian)
- [remark-obsidian on GitHub (alfredoperez)](https://github.com/alfredoperez/remark-obsidian)
- [remark-obsidian-callout on npm](https://www.npmjs.com/package/remark-obsidian-callout)
