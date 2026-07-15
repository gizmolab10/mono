# Handoff

**Status:** active. One always-on screen: a short top bar (hamburger + help), then a live filter (a joined tag pill with an all/any toggle, and a "search by name" box), a rule, and the documents table. The table's own column labels double as the controls — hovering "document name" or "tags" reveals "add a document" / "add a tag", and clicking opens that add flow below the rule; a click on the empty background closes it. An empty store leads straight with the drop box. Details region (preferences + data panels) collapses from the hamburger; build opener + credit pinned to the frame's bottom-left. **Document store** built and wired — design in [db spec](done/db/db%20spec.md) / [db proposal](done/db/db%20proposal.md), status in [db handoff](db%20handoff.md).

## Proposal — next: remove unused preferences and colors

ji's Preferences and Colors were ported whole from di, so both carry a pile of keys and colors ji never touches (edge thickness, grid opacity, dimension count, view mode, orientation, scale, parts tabs, help-sidebar, and so on). Cut what ji doesn't use.

1. **Preferences.** For each `T_Preference` key, search ji for a read or write. ji really uses only a handful — the details toggle, the current add-mode, the active storage, the more/less choice, and the theme colors. Delete every key with no reference, and drop the matching saved-value handling. (Also: the storage prefix is still `di:` — rename to `ji:` while here, or leave — Jonathan's call.)
2. **Colors.** Same pass over the ported color definitions: keep the ink, the theme tokens the app actually pushes (`--bg`, `--accent`, `--hover`, `--black`, …), and remove any color that nothing reads.
3. **Verify.** A clean `svelte-check` after each deletion catches anything still referenced; delete in small batches so a missed use surfaces immediately.

## Later (from code debt)

Move di's hooks into mono, remote support (supabase, person id, authorization), more file formats (md, html, tiff, webp, svg, rtf), the front page, a stipulations file, and the "wendy" signals work — all tracked in [code debt](code%20debt.md).
