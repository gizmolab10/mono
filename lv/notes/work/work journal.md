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
- **Menu mark and fold triangle are drawn, not typed.** The three-bar menu mark and the fat-cornered fold triangle are the same shapes the di project uses. Their drawing math was copied into this project and stripped of di's geometry helpers, so this project stays independent. The triangle points right when a folder is folded and turns a quarter-turn to point down when it opens. Both take their colour from the surrounding text.
- **Type checker includes only imported types.** The checker was pulling in every shared type package in the monorepo and warning about one with no definitions. It now includes only the types the code actually imports, which clears the warning without changing any behaviour.
- **Image embeds can carry a size.** After the bar in an image embed, a plain number sets the width and a number-by-number sets width and height — the same shorthand Obsidian uses. The picture is then drawn at that size. Any other text after the bar is still treated as the caption.
- **Tests live in their own folder.** The unit tests moved out from beside the code they check into a single `test` folder next to the code folders, with their links to the code repointed to match.

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

## Sources

- [@portaljs/remark-wiki-link on npm](https://www.npmjs.com/package/@portaljs/remark-wiki-link)
- [remark-callout on npm](https://www.npmjs.com/package/remark-callout)
- [remark-obsidian on GitHub (heavycircle)](https://github.com/heavycircle/remark-obsidian)
- [remark-obsidian on GitHub (alfredoperez)](https://github.com/alfredoperez/remark-obsidian)
- [remark-obsidian-callout on npm](https://www.npmjs.com/package/remark-obsidian-callout)

