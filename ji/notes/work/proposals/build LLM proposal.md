# Proposal — build DB_LLM

DB API that talks to AnythingLLM

## Goal

Make the **LLM** store a place where you can *ask questions of your documents*. It's a second storage backend, `DB_LLM`, that fills the same seam the local store fills — but instead of only keeping bytes in the browser, it hands each document's words to AnythingLLM (running on the mac) so the whole store can be searched and questioned, with answers that cite the documents they came from. The **mine** store is untouched: two stores, two namespaces, switch between them.

## At a glance

- **What already stands.** The storage seam (`DB_Common`), the registry that builds one backend-and-tree per storage and switches between them, per-store namespacing (just fixed), and phase 1 (every document knows if it's *viewable* and how ready its words are — **ready** / **quick** / **heavy**, with a `text` slot to hold pulled words).
- **The one prerequisite.** AnythingLLM needs *words*. Only plain text and markdown arrive ready; everything else is quick or heavy with an empty `text`. The **extraction pass (phase 2)** — the quick/heavy words-pull that fills `text` and flips a document to ready — is what widens what can be sent. Fine to build against ready-as-is text first and let extraction widen it later.
- **The boundary.** **Localhost only** for now — ji and AnythingLLM on the same mac. External access (from a deployed ji) is a separate piece, scoped in [thin proxy proposal](thin%20proxy%20proposal.md).

## Design

**The store fills the existing seam.** The tree (Hierarchy) owns all the record logic; a backend only decides *where things live*. So `DB_LLM` keeps the record lists and the bytes **local**, namespaced `LLM`, exactly like the mine store — reusing the local behavior — and adds the AnythingLLM hooks on top. AnythingLLM only holds the searchable words; the tree stays ji's own shape.

Each seam method, for `DB_LLM`:

- **`load_list` / `save_list`** — local, `LLM` namespace (reuse the local store's browser-storage path).
- **`write_blob` / `read_blob` / `delete_blob`** — local bytes (IndexedDB, `LLM` namespace) so a document still opens in the viewer; **plus**, when a document has words, `write_blob` pushes them to the AnythingLLM workspace and `delete_blob` removes them. (Full mechanics under **Phase B**.)
- **`clear_blobs` / erase** — clears the local bytes *and* removes this store's documents from the workspace.

**The ask is new — not part of the seam.** `DB_Common` has no "ask" method; searching and answering is a fresh capability. A query path (a method on `DB_LLM`, or a small separate manager) sends a question to the workspace and returns the answer plus citations, mapped back to ji documents by their ids. The UI for asking is a later, separate piece; the plumbing comes first.

**AnythingLLM, concretely.** It runs locally (installed) and exposes a developer REST API — a base URL and an API key. Documents live in a **workspace**: upload a document, it chunks and embeds it; chat against the workspace and get answers with sources. Use **one workspace per LLM store** for now (per-person workspaces come with remote support). Each ji document is identified inside AnythingLLM by its **id**, so a cited passage maps straight back to the document it came from.

## The build, in phases

### Phase A — stand up the store

`DB_LLM` gives an empty, working `LLM` store you can switch to and drop into (records + bytes under the `LLM` namespace). Mostly falls out of the namespacing fix; `DB_LLM` is "the local store with a different name, plus the AnythingLLM hooks." Switching to LLM and dropping a text file stores and views it — no AnythingLLM yet.

### Phase B — mirror to AnythingLLM (the heart)

`write_blob(document_id, content)` is where a saved document both **lands locally** and **reaches AnythingLLM**. It's called once per document as it's saved (`add_document` sets the document's blob reference and calls it — [Hierarchy.ts:132-134](../../ji/src/lib/ts/managers/Hierarchy.ts#L132)). The content it receives is already split by kind: a **text** document arrives as its **words** (a string); every other kind arrives as its **raw bytes** (a Blob).

**What `DB_LLM`'s `write_blob` does**

1. **Store the bytes locally first** (IndexedDB, `LLM` namespace) so the viewer keeps working — reuse the local byte path, which already keys by the store's name ([DB_Local.ts:56-68](../../ji/src/lib/ts/database/DB_Local.ts#L56)). Bytes are never lost to an AnythingLLM hiccup.
2. **Then, if the content is words** (a string), upload them to the workspace, keyed by the **ji document id**, so they're searchable and a later citation maps back. If the content is raw bytes (a Blob), **store only** — its words arrive later from extraction, and the upload happens then.
3. **Never fail the save on an upload problem.** Store locally, upload second; if the upload fails (or AnythingLLM is down), keep the bytes and **mark the document's words as "pending upload"** so a later sync retries.

**The underpinnings to build**

- **A local byte store for the `LLM` namespace** — reuse the local store's IndexedDB helpers (extend or delegate), so `DB_LLM` gets local read/write/delete/clear for free under its own namespace.
- **A small AnythingLLM client (the transport).** Three calls only: *put an id's words into the workspace* (create or replace), *remove an id*, *ask a question*. `write_blob` uses the first; the ask path (Phase C) uses the third. Config — base URL and key — from the environment / a local-only preference; **localhost for now**.
- **A reference scheme.** Each uploaded document carries the **ji id** as its identifier inside AnythingLLM, so remove and citations line up. For a readable citation title, `DB_LLM` looks the document's **name** up from its own in-memory records by id — no need to widen the seam.
- **A pending-upload marker + a sync pass.** A small per-store set of document ids whose words still owe AnythingLLM — an upload failed, or the kind is binary and awaiting extraction. A "sync" pass drains it; **this is exactly the hook phase-2 extraction calls** when it finishes filling a document's `text`.

**What gets uploaded, by kind**

- **Ready text (txt, md):** content is words → upload now.
- **Quick / heavy (pdf, web, pictures, sound, video):** content is bytes → store only, mark pending; extraction fills `text`, the sync pass uploads.
- **Folders:** no bytes, nothing to upload.

**Order within Phase B**

- **B1 — local bytes for LLM.** Switch to LLM, drop a text file: it stores and views. No AnythingLLM yet.
- **B2 — the client + upload.** `write_blob` pushes ready-text words to the workspace on save; every push logs the id, name, and length. `delete_blob` / erase remove the id.
- **B3 — pending + sync.** The pending marker and the sync pass; wire phase-2 extraction into it so quick/heavy kinds upload once their words exist.

### Phase C — ask

A query path that questions the workspace and returns an answer with citations back to ji documents.

## Decisions (settled)

- **Record lists live local** (namespaced `LLM`) — the tree is ji's shape, not AnythingLLM's.
- **Sync is simple: push on save.** Revisit only if it turns out noisy.
- **Localhost-only for now.** ji and AnythingLLM on the same mac; the browser talks straight to it, so no key travels and nothing is exposed.
- **The seam stays as is.** `write_blob(document_id, content)` is enough — the string-vs-Blob of the content is the words-vs-bytes split, the id is the AnythingLLM reference, and the name is read from `DB_LLM`'s own records. No seam change.
- **Extracted `text` moves to IndexedDB** (carried into phase 2). It currently sits on the document record ([Document.ts:172](../../ji/src/lib/ts/types/Document.ts#L172)), and record lists save to browser storage (~5 MB, varies by person) — so once extraction fills `text`, the record lists would balloon and blow the limit. Storing `text` as a blob in IndexedDB, like the bytes, keeps browser storage to light metadata. (For the LLM store the words live in AnythingLLM anyway, so ji may not need `text` locally beyond what the viewer and extraction need.)

## Open

- **External access to the mac's AnythingLLM.** The moment a deployed ji must reach the mac, it needs a reachable address and must keep the key out of the browser — a thin proxy that holds the key, behind its own auth and a mesh or tunnel. Not a phase-A concern; scoped in [thin proxy proposal](thin%20proxy%20proposal.md).

## Success criteria

Switch to the **LLM** store, drop a text file, ask a question about it, and get an answer that cites that file — all while the **mine** store's documents, tags, and tree are untouched. Prove it end to end (drop → upload logged → ask → sourced answer) before widening to the quick/heavy kinds. And prove the safety net: with AnythingLLM down, the bytes still save, the document is marked pending, and a later sync uploads it.
