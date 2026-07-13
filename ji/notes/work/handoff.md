# Handoff

**Status:** active. Layout frame (Intersection) with a collapsible details region, an Activity region that switches on the operation (add / browse / arrival), and a build-notes popup. Accent picker themes the page live. **Document store built and wired to the screen:** dropping files on the add view saves them; the browse view lists saved names live; the details region's data panel shows counts and a storage switcher. Design in [db spec](db%20spec.md) / [db proposal](db%20proposal.md); store status in [db handoff](db%20handoff.md).

## Proposal — next: more file types (pdf, jpg) + show type in browse

Today the drop saves only text; images and pdfs are skipped. This adds them and shows each file's type in the browse list.

1. **Binary bytes.** The blob seam holds a string. Read a non-text file as a data-URL (its bytes base64-wrapped) and store that string; on open, hand the data-URL straight to an image tag or a pdf frame. This is the "binary blobs" decision made concrete — no seam change.
2. **Stop skipping.** The kind detector already maps pdf and jpg; drop the text-only guard in the drop handler so those save too.
3. **Show the type in browse.** The browse list becomes name + type (each Document already carries its kind). Reads for a small table layout — the code-debt line calls it a browse table.
4. **Open question for Jonathan:** store the whole data-URL, or just the base64 with the kind kept separately? Data-URL is simplest to show; raw base64 is smaller but needs the kind to rebuild it.

## Later (from code debt)

The categories UI and search, plus the deferred store work — disk-file blobs and the firestore storage — tracked in [db handoff](db%20handoff.md).
