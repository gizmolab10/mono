# Journal — design decisions and stack

## Decisions

- **Home page source.** The home address renders one md file — the one named after the project today, "Little Cloud Vineyard".
- **Many md files, one page at a time.** The address bar names which md file shows. Wiki-links between md files behave like normal navigation.
- **Page navigation behavior.** A click on a sidebar entry or a wiki-link swaps the content without a full reload. The address bar updates to match. Sidebar state — scroll position, which sections are collapsed, whether the sidebar is shown or hidden — survives the swap.
- **Sidebar source file.** Hand-written in `Sidebar.md` (capital S) at the top of the md folder. Uses standard markdown link syntax — `[Label](Target)` — so the writer picks the label per entry. The target is the file name without the `.md` extension. Section headings, dividers, and any emphasis are written directly in the file.
- **Sidebar entry text.** Whatever appears inside the square brackets of each link in `Sidebar.md`.
- **Section headings in the sidebar.** Match subfolder names of the md folder, character for character. Children sit indented underneath. Each section is collapsible. Depth beyond one level of subfolder is TBD until the site grows.
- **Home entry in the sidebar.** Sits above all sections, styled bolder and larger, with a divider underneath. The styling and the divider are hand-written in `Sidebar.md` (using emphasis markers and a horizontal-rule line).
- **Active sidebar entry.** The entry for the current page shows a slightly darker, pill-shaped background behind its label.
- **Active state when the current page is not in the sidebar.** Nothing is highlighted.
- **Unlisted md files.** An md file present in the md folder but not listed in `Sidebar.md` does not appear in the sidebar. Its URL still renders the file.
- **Empty or missing `Sidebar.md`.** The sidebar shows only the home md file.
- **Empty md folder.** Out of scope; assume the folder is not empty.
- **Sidebar visibility.** Optionally hidden behind a toggle. On mobile, two modes — sidebar plus status, or content plus status — and the toggle switches between them.
- **Toggle button.** Lives at the top left of every page as its own component, owned by the page shell — not by the sidebar component. Persists even when the sidebar is hidden, so the reader can always bring the sidebar back.
- **Status line.** A blank strip at the bottom of the page. When a click hits a sidebar link whose md file is missing on disk, the status line shows a broken-link error. The next successful click clears it.
- **Wiki-links.** Look and behave like normal links — same colour, same hover, same click-to-navigate. Open the target page.
- **External links.** Open in a new tab.
- **Frontmatter scope.** Five allowed entries: pretty title, redirect, subtitle, author, date. Behaviour of each is TBD.
- **Images.** Pulled from the assets folder. The loader searches the assets root and all its subfolders. Image filenames are unique by guarantee.
- **Embedded md files.** Supported by the parser but not expected to come up.
- **Math, code-block highlighting, body-tag syntax.** Out of scope for the first pass; listed under "Deferred" below.
- **Centered line.** Written as a `> [!center]` callout. The single styling file strips the box, border, icon, and padding for the `center` type, and centres the text inside. Other callout types keep their default boxed look.
- **Single styling file.** Every look-and-feel rule for the site lives in one styling file: typography, sidebar layout, status line position, callout overrides (including the `[!center]` strip-and-center treatment), active-entry pill, home-entry treatment. The file is imported once at the app's entry point and applies to every page.
- **CSS folder location.** A new `css/` folder lives directly under `src`, sibling to `md` and `assets`. The single styling file lives inside that folder. This keeps look-and-feel sitting at the same level as content (`md`, `assets`) rather than alongside implementation code (`lib`).

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
3. `@portaljs/remark-wiki-link` for `[[Other Note]]` and the embed form `![[name.png]]`
4. `remark-callout` for `> [!note]` blocks
5. `remark-rehype` plus `rehype-stringify` to produce HTML

**Composable** — any piece can be swapped without rewriting the others. The wiki-link library accepts a name-resolver, so links route through the loader's map. The pieces are stable rather than freshly maintained — last releases range from 14 to 32 months ago — which fits the maturity of the underlying syntax.

**Ruled out** — all-in-one alternatives like `remark-obsidian` (less recent releases than the composed pieces) and the `markdown-it` family (its Obsidian-flavoured plugins look less recently updated than the remark equivalents).

## Sources

- [@portaljs/remark-wiki-link on npm](https://www.npmjs.com/package/@portaljs/remark-wiki-link)
- [remark-callout on npm](https://www.npmjs.com/package/remark-callout)
- [remark-obsidian on GitHub (heavycircle)](https://github.com/heavycircle/remark-obsidian)
- [remark-obsidian on GitHub (alfredoperez)](https://github.com/alfredoperez/remark-obsidian)
- [remark-obsidian-callout on npm](https://www.npmjs.com/package/remark-obsidian-callout)

