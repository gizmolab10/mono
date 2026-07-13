# Handoff

**Status:** active. Layout frame (Intersection) with a collapsible details region, an Activity region that switches on the operation (add / browse / arrival), and a build-notes popup. Accent picker themes the page live. **Document store built and wired to the screen:** dropping files on the add view saves them; the browse view lists saved names live; the details region's data panel shows counts and a storage switcher. Design in [db spec](db%20spec.md) / [db proposal](db%20proposal.md); store status in [db handoff](db%20handoff.md).

## Proposal — next: the tags UI

The store already holds tags and the tag↔document link; this is UI over that. Three code-debt pieces: create a tag, choose tags, and show/edit a document's tags in browse.

1. **Create a tag** (`add_tags.svelte`) — a name field + add; on submit call the store's add-tag. Show the existing tags so a duplicate is obvious.
2. **Choose tags** (`tags.svelte`) — a multi-select over the store's tags, shared between the add flow (tag a document) and search (filter). Emits the chosen tag ids.
3. **In browse** — beside each document's name, show its tags and an "edit tags" button that opens the chooser; picking calls the store's add-tagging / a remove.
4. **Placement** — The chooser
    1. above the drop box, in place of 'add tags goes here'
    2. is for the whole drop batch

## Later (from code debt)

Search (the `share with search` line), plus the deferred store work — disk-file blobs and the firestore storage — tracked in [db handoff](db%20handoff.md).
