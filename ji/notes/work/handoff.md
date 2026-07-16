# Handoff

**Status:** active. One always-on screen: a short top bar (hamburger + help), then a live filter (a joined tag pill with an all/any toggle, and a "search by name" box), a rule, and the documents table. The table's own column labels double as the controls — hovering "document name" or "tags" reveals "add a document" / "add a tag", and clicking opens that add flow below the rule; a click on the empty background closes it. An empty store leads straight with the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](done/db/db%20spec.md) / [db proposal](done/db/db%20proposal.md), status in [db handoff](db%20handoff.md).

## Proposal — next: flesh out the document viewer (needs your read)

The row buttons landed, including a first document viewer ([View_Document.svelte](../../src/lib/svelte/actions/View_Document.svelte)): it reads a document's bytes and shows pictures in an image, pdfs in a frame, and text types as raw text, with a close button. It's deliberately basic, and the next item is to flesh it out.

Before I design, I need your read on what "fleshed out" means to you — likely candidates:

- **Text types shown better.** Markdown rendered instead of raw, rich text shown readably, html shown as a page rather than its source (html-as-page is an injection surface — worth a note before doing it).
- **Getting the file out.** A download button to save the original back to disk.
- **Moving between documents.** Previous / next through the list without closing.
- **Fit and zoom.** For images and pdfs — fit-to-width, actual size, zoom.

Tell me which of these (or others) you want, and I'll propose the specific build.

Method that worked, and should hold: one at a time, prove it before the next. Every silent breakage this session came from a path I changed without re-running the proof — the word-swapper sat dead for hours that way, and the new ending-carry mark quietly killed every swap until the check caught it.

## Later (from code debt)

Remote support (supabase, person id, authorization), the front page, a stipulations file, and the "wendy" signals work — all tracked in [code debt](code%20debt.md).
