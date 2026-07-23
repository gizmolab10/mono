# Hierarchy spec

What ji's tree of documents and tags should become, read against what ws already does. Nothing here is built yet — this is the map before the plan. The shape below is settled; the open questions are narrow.

## 1. Where this comes from

ji's whole store was ported from ws: five kinds of record (documents, tags, taggings, relationships, predicates) and the idea of a **relationship** — a parent, a child, a meaning (the predicate), and an order. ws calls its top record a *thing*; ji calls it a *document*. Same bones.

What ji took was the **data**. What it left behind was the **living tree** ws builds on top of that data — and the two runtime habits that make that tree hold together: **uniqueness** and **remember/forget**. This spec is about all three.

Source read: [ws Hierarchy.ts](../../../ws/src/lib/ts/managers/Hierarchy.ts). ji's side: [DB_Records.ts](../../ji/src/lib/ts/types/DB_Records.ts) (the record shapes), [DB_Common.ts](../../ji/src/lib/ts/database/DB_Common.ts) (the store), [Indexes.ts](../../ji/src/lib/ts/database/Indexes.ts) (the in-memory lookups), and [Documents.svelte](../../ji/src/lib/svelte/main/Documents.svelte) (the table).

## 2. Two runtime habits ji needs from ws

These matter more than any single tree behavior — they're the ground everything else stands on.

### Uniqueness

ws never makes two of the same thing. Every "create" is really a "find-or-create": before it builds a record it looks for one that already matches, and hands that back if it exists. A record matches by a stable key — most records by their **name** (a document too), a relationship by the trio of (meaning, parent, child). Two things of the same name, two links of the same parent to the same child — each returns the one that's already there, never a duplicate. Every id is unique across all record types, so nothing has to know a record's kind to tell two apart.

A document is unique by its **name alone, across the whole store** — the place it sits does not matter. So a drop whose name is already known anywhere is not a fresh document; it starts the dedup process in section 5.

ji already does this in patches: the one "contains" meaning is reused rather than remade. The spec's ask is to make find-or-create the *rule*, not the exception — every record kind gets one, keyed on what makes it the same.

### Remember / forget

ws keeps two copies of the truth: what's on disk, and a set of in-memory lookups (by id, by parent, by child, by type) that answer questions fast. **Remember** adds a record to every lookup it belongs in; **forget** removes it from every one. Persisting to disk is a *separate* step — remember/forget is only the live index. This split is why ws can drop a record from the screen instantly and settle the disk afterward.

ji has the seed of this: an `Indexes` object rebuilt on every change, and a dirty-flag tracker for what needs saving. The ws pattern is finer — remember/forget touch only the record that changed, instead of rebuilding every index from scratch. Whether ji needs that finer grain depends on how large its trees get; for now the rebuild-all is honest and simple, and this is noted as a later tightening, not a now.

## 3. What ws's hierarchy is

A graph, not a plain tree. A record can hang off more than one parent, and every connection carries a **meaning** — "contains" (the folder-like tree), "is tagged", "is related to", and others. Because a record can sit in more than one place, ws needs a name for *one particular place* it sits: a full path from the root down through the links that led there. ws calls this an **ancestry**. A record isn't open or closed — a *place it sits* is. The same record open in one spot can be closed in another.

On top of ancestries ws layers: open/close a branch, move a record to a new parent, reorder within a parent, focus (zoom a branch to be the temporary root), reveal (auto-open the closed branches above a selection), and add/duplicate/delete in place.

## 4. ji's shape — settled decisions

ji is **not** ws's full graph. Here is what ji is, decided:

### Documents: one home each

A document has exactly **one parent**. A drop makes one "contains" link and never a second. So a document is only ever in one place — which means documents need **no ancestry**. A folder is either open or closed, full stop; a document's spot is just "under its one folder". This keeps the document side of the tree as simple as the table already draws it.

### Tags: hierarchical, and multi-parent

Tags are a tree too — a tag can sit under another tag. And unlike a document, a tag **can have more than one parent**: the same tag may live under two different parent tags at once. That is exactly the case that needs an **ancestry** — a tag's identity is one thing, but its *places in the tree* are several, and each place opens and closes on its own. A place is told from its twin by the link that leads into it: one tag, two parents, two links, two places.

**How a tag comes to sit under another tag is TBD** — this spec settles that tags *can* nest and have several parents, not yet the act that nests them.

So ji splits cleanly:

- **Documents** — single parent, no ancestry, a plain nested tree.
- **Tags** — multiple parents, ancestries, the one place ji actually needs ws's full idea.

### Relationships already carry the split

ji's relationship record already has a flag saying whether it links documents or tags ([DB_Records.ts:40](../../ji/src/lib/ts/types/DB_Records.ts#L40), `isDocument`), and its parent and child ids "refer to either a document or a tag" ([DB_Records.ts:34](../../ji/src/lib/ts/types/DB_Records.ts#L34)). The model was built for this from the start: document relationships and tag relationships live side by side, told apart by the flag. Nothing in the data has to change to make tags hierarchical — the shape is already there; what's missing is the behavior that reads it.

### Order is set once

A record's order among its siblings is assigned **once, when it's created**, and not changed after. There is **no drag, no nudge, no reorder** — a document lands where the drop put it, a tag lands where it was made. (ws's move-right/left, move-up/down, and drag-reparent are all out of scope.) This drops the whole hardest half of ws's hierarchy — the part with cycle-guards and order-renumbering — and leaves a tree you can open, close, and read, but not rearrange.

This will evolve -- TBD.

### Open / closed is remembered

A folder's or tag-place's open-or-closed state **survives a reload**, saved the way ji already saves the details region's open sections. Reopen ji and the tree looks as you left it. The state is held as one set of ids — the id of the link that leads into each closed place. Because every id is unique, one set covers both trees, and a multi-parent tag's two places stay independent (each is reached by its own link).

## 5. Adding a document — drop and dedup processes

### The drop, in two passes

A drop counts before it saves. The first pass walks all folders and all files within the drop, recursively — no saving, only determine the total. The second pass saves, counting off as it goes. A status line stands where the family words stand and reads "captured 3 of 40", with a progress ring filling beside it. A drop landing on the table with no drop box open opens the drop box first, so the reporting happens there, where there's room.

### What's skipped or refused

- **An extension we don't accept** is skipped — logged, still counted, not saved.
- **A file over the one-file size limit** is refused out loud: a message on the dialog line below the status line, waiting for OK. Counted, not saved.

### A name already here — the dedup

Because a document is unique by name across the whole store, a drop whose name is already known **anywhere** — the same folder, a different folder, or the top level — MAY be a new document. It opens a dedup process (below) to decide based on date, sometimes presenting a dialog to involve the user. The place the name was found does not matter; only the name and the date decide.

- **Same name, same last-changed date** — the same file, wherever the match sits. It is silently ignored: nothing is written, nothing is removed, no message. The document already in the store is left exactly as it is, in its place.
- **Same name, a different date** — only a person can answer, so the processing pauses and presents a dialog line. The file is mentioned along with a checkbox for each pair of size and date. one or both checkboxes can be checked. An additional checkbox is presented "Always do this", which if checked no longer pauses for subsequent dedups. The OK button is disabled until one of the checkboxes is checked. Nothing is saved or removed until OK is clicked. OK dismisses the dialog and resumes the process.
    - **keep the one already here** — the dropped one is thrown away.
    - **keep the new one** — its words, size, date, and bytes are poured into the row that's already there, so that row's tags and folder survive; no second row appears.
    - **keep both** — the dropped one joins under a numbered name, preserving the extension ("notes (2).txt"), and **one** "is-duplicate-of" link is made between the two: parent the original, child the new copy. The meaning is two-way (either is a duplicate of the other), but it is stored as a single link, not one in each direction. The meaning itself is made once and reused; the link between a given pair is made once.

### Folders

A dropped folder whose name is already here is examined before it's trusted: its files are compared to those in the existing folder by name and date. If **none** match, the two are treated as different folders and a numbered one is made ("trip (2)"); otherwise it's the same folder, and its contents are worked through one at a time by the rules above, altering the folder already there. Each file inside still follows the store-wide name rule: a file whose name-and-date already sits anywhere in the store is silently ignored, so it does not get a second copy under this folder.

## 6. What ji has today

The **data** for both trees, and one read of the document side:

- Documents nest under folders through "contains" links, each with an order.
- The store can link a parent to a child at the end of the order, walk the whole graph parent-first (each row carrying its depth and its chain of ancestors), and delete a whole branch at once.
- The table draws that walk: folders lead their contents, indented per level.

What ji does **not** have:

- **No open/close.** Every folder is always open.
- **No tag tree.** Tags exist and can be placed on documents, but there's no showing of a tag under a tag, and no ancestry for a tag with two parents.
- **No move, no reorder** — and none wanted; order is set once.

## 7. The port, smallest-first

Each is its own small piece with its own test against the store.

1. **Find-or-create everywhere.** Make uniqueness the rule across every record kind, keyed on what makes each the same (a document by name — see the dedup process in section 5). Can ride along as the other pieces are built.
2. **Open and close a folder, remembered.** A folder row gets a triangle; closed, its subtree drops out of the walk. Needs one saved set of closed ids and a walk that skips a closed folder's subtree. No ancestry — documents have one parent.
3. **Show tags as a tree.** Read the tag-type relationships (the flag already tells them apart) and draw tags nested the way documents already nest. Single-parent tags first — the plain case.
4. **Tag ancestries — multi-parent tags.** The one place ws's ancestry idea earns its keep: a tag under two parents appears in two spots, each opening and closing on its own. This is the hard, interesting piece, and it comes last because it's the only one that needs the full path-based identity. (The act that nests one tag under another is TBD — see section 4.)

Out of scope, decided: move, reorder, drag-reparent, focus, and ws's sideways meanings (related, requires…). Reveal-on-select is a maybe-later, only if tag trees get deep.

## 8. Still open

- **How a tag comes to sit under another tag** — TBD. Tags can nest and can have several parents; the act that does the nesting is not yet designed.
- **Reveal-on-select for tags** — out for now; tag trees are not expected to run deep early.

## 9. Method

Same as the rest of ji: one behavior at a time, proved before the next. Nothing lands as a single big "hierarchy" — each numbered piece is small and tested on its own.

## 10. Testing

The cases that cover this spec, driven against the store the way the drop tests already are. Marked **exists** where a driven check is already written, **changed** where an existing check's assertions must move to match this spec, and **new** where none exists yet.

### 10.1 Uniqueness (section 2)

- Drop a name already in the store → no second document is made (unique by name). **done** — was name-and-date.
- Making the "contains" meaning twice returns the one meaning. **exists**
- Linking the same parent → child under the same meaning twice returns the one link, not two. **done**
- Making two tags of one name returns the one tag; the same tag on the same document twice is one link. **done**
- Two record kinds never collide — every id is unique across types. **done**

### 10.2 Drop: two passes and counting (section 5)

- The total counts every folder and file, recursively; the count reaches the total. **exists**
- An unaccepted extension is skipped but still counted. **exists**
- A file over the one-file size limit is refused, counted, not saved. **exists**
- A drop on the table opens the drop box first, so reporting happens there. **new** — component-level (lives in the view, not the store); needs a component test, not a driven store test.

### 10.3 Dedup by date (section 5)

- Same name, same date → silently ignored, wherever the match sits (same folder, another folder, the top level): nothing written, nothing removed, no dialog. **done** — dedup is store-wide by name.
- Same name, different date, **keep the one here** → the dropped one is thrown away; the stored one is untouched. **exists**
- …**keep the new one** → poured into the existing row; its tags and folder survive; no second row. **exists**
- …**keep both** → the dropped one is saved as "(2)". **exists**
- **"Always do this"** checked → later different-date collisions in this drop take the same choice without pausing. **changed** — wording was "do the same for the rest".
- An "always" choice does not carry into the next drop. **exists**
- OK stays disabled until at least one box is checked. **new** — component-level (the dialog is in the view); needs a component test.

### 10.4 Folders (section 5)

- A repeated folder with no file inside matching by name-and-date → a new numbered folder. **exists**
- A repeated folder with some matching → contents merge into the existing folder. **exists**
- The same name and date in a different folder is silently ignored (unique by name across the store); the second folder is made but stays empty. **done** — was "two documents kept".

### 10.5 Open / closed (section 4, port piece 2)

- Closing a folder drops its subtree from the walk. **new**
- Closed state survives a reload. **new**
- One id-set covers both trees; a multi-parent tag's two places open and close independently. **new**

### 10.6 Tags as a tree (section 4, port pieces 3–4)

- Tag-type relationships draw a tag nested under a tag. **new**
- A tag with two parents appears in two places. **new**

### 10.7 Not tested — nothing to cover yet

- How a tag gets its parent (TBD, section 8).
- Reveal-on-select (out, section 8).
- Fine-grain remember/forget (a later tightening, section 2).
