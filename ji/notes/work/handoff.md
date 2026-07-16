# Handoff

**Status:** active. One always-on screen: a short top bar (hamburger + help), then a live filter (a joined tag pill with an all/any toggle, and a "search by name" box), a rule, and the documents table. The table's own column labels double as the controls — hovering "document name" or "tags" reveals "add a document" / "add a tag", and clicking opens that add flow below the rule; a click on the empty background closes it. An empty store leads straight with the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](done/db/db%20spec.md) / [db proposal](done/db/db%20proposal.md), status in [db handoff](db%20handoff.md).

## Proposal — next: the far-right per-row buttons

Each document row ends with a single "edit tags" text button ([Documents.svelte](../../src/lib/svelte/main/Documents.svelte) — the `.edit` cell). This item turns that last column into a small row of icon buttons, all with no border and a see-through background, so they read as quiet actions rather than filled buttons.

**Three buttons per row:**

1. **View (an eye).** Reads the document's bytes back and shows them. What "show" means depends on the type: a picture type goes in a picture tag; a pdf goes in a frame; a text type (plain text, markdown, html, rich text) shows as text. Types a browser can't show — Word doc, docx, tiff — disable the eye button. The viewer needs to know which types are stored as plain text and which as wrapped bytes; that knowledge lives in the drop code today and should move somewhere both can read.
2. **Edit tags (a pencil, ✏️ U+270F).** Same as today's button — opens the inline tag editor under the row — just shown as the pencil instead of the words "edit tags".
3. **Trash (a bin).** Deletes the document. The store already removes a document and everything pointing at it in one call (`delete_document`, which cascades its tag links and relationships).

**Decisions, folded in:**

- **Trash asks first.** — Clicking the bin shows a confirm (no undo), the way the whole-store erase does — a small "sure?" in the row, not a big dialog.
- **Trashing a folder takes everything inside.** — Today `delete_document` removes only the one document; a folder needs a cascade — walk its contents down and delete every document under it, plus the folder. That's a small store addition (a delete-subtree that follows the "contains" links). Must also delete any relationship that refers to the deleted item.
- **The eye does not show on a folder row.** — becoming a blank space.
- **The view opens in the Documents view.**  — this is a new op "view document"

**The pieces:** a store cascade-delete that follows the "contains" links; the text-vs-wrapped-bytes knowledge moved to a shared spot both the drop and the viewer read; a new viewer overlay that reads a document's bytes and shows them by type (or the "can't show" message); and the row's last cell rebuilt as three borderless icon buttons with the inline trash confirm.

Method that worked, and should hold: one at a time, prove it before the next. Every silent breakage this session came from a path I changed without re-running the proof — the word-swapper sat dead for hours that way, and the new ending-carry mark quietly killed every swap until the check caught it.

## Later (from code debt)

Remote support (supabase, person id, authorization), the front page, a stipulations file, and the "wendy" signals work — all tracked in [code debt](code%20debt.md).
