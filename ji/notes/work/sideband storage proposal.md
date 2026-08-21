# Sideband storage in AnythingLLM

> A place to keep small shared app data — not documents, not knowledge — that every browser sees, and that never leaks into search or answers.

## In plain words

Anything ji wants to keep in AnythingLLM without the AI ever seeing it goes in the description of a
file that is saved and never embedded. Three things worth noting:

1. To change a file, delete and re-add it
2. Cannot write part of the description
3. If someone else writes during the entire window between my read and my write, theirs is destroyed

## The need

Ji needs a shared memory that is not part of the AI feature.

- [ ] tags, relationships
- [ ] hidden (exchanges, files, folder's children)
- [ ] workspace-based file names (eg, intersection.tags, intersection.hidden.exchanges)

## What AnythingLLM can and can't do (all proven live)

- **The details fields do round-trip.** A string tucked into the document's `description` when it's saved comes back byte-for-byte when read. This is our spot.

Proven on the live instance: saved `{"hidden":[123,456],"note":"sideband test"}` into `description`, read it back exactly, deleted the scratch document. Not embedded at any point.

### AnythingLLM's SQLite store

AnythingLLM keeps its own bookkeeping in a single SQLite database file on the machine (`server/storage/anythingllm.db`), managed through the Prisma toolkit. That database is the relational store — 
1. the lists and records the app runs on:
    1. the workspaces
    2. one row per document (its name, its on-disk path, its details, whether it's pinned) <- **description**
    3. the users
    4. the API keys
    5. the saved chat messages
    6. the system settings.

Two things live *outside* that database, and the split is exactly why the sideband trick behaves the way it does:

- **The embeddings** (the vectors a search matches against) go to a separate vector database (LanceDB by default), in its own folder on disk.
- **Each document's actual text** is a parsed file on disk, not accessible.

Sources: [Desktop storage layout – AnythingLLM Docs](https://docs.anythingllm.com/installation-desktop/storage), [Prisma schema (workspace_documents) – GitHub](https://github.com/Mintplex-Labs/anything-llm/blob/master/server/prisma/schema.prisma), [LanceDB default vector store – AnythingLLM Docs](https://docs.anythingllm.com/setup/vector-database-configuration/local/lancedb).

## The design

**One small un-embedded document per kind of data**, under a fixed title of ji's own, with the real payload (a JSON string) living in its `description`.

- **Write.** Save a raw-text document under a title of ji's own (e.g. `ji-state`) and the `description` set to the JSON payload. Do *not* embed it. It becomes `ji-state.txt` in AnythingLLM's own document folder.
- **Read.** Ask for the full document list, find the one wearing that title, take its stored name, read that document's details, and pull the payload out of `description`. (After a write, the returned location can be remembered so the next read skips the list step.)
- **Update.** A raw-text save always makes a *new* file, so replacing means: delete the old document, then save the fresh one. On read, if more than one document wears the title, keep the newest and clear the rest.

### Read-merge-write — the last writer folds in, never wipes

A plain "replace the description" is dangerous when two browsers change it.

The rule that prevents it: **never write back the copy you were holding. Read the note fresh at the moment of the change, apply your one change onto that just-read copy, then write.** So each writer folds its change into whatever is actually there now, instead of overwriting with an old whole.

Three things make this safe in practice:

- **Keep every change additive, not a wholesale set.** The note is a set or a map, and a change is "add this id", "remove this id", "set this one key" — never "here is the entire new note". Merging is then a union or a single-key edit on the freshly-read value, so the order two browsers land in almost never matters.
- **Read immediately before writing, not earlier.** The danger is only the gap between reading and writing. Shrink it to one back-to-back read-then-write, so two browsers colliding inside that gap is rare.
- **Confirm, and retry once.** After writing, read the note back and check your change is present. If a colliding write beat you to it and your change is missing, do the read-merge-write once more. One retry closes all but a vanishing sliver.

What this does **not** add is a true lock — AnythingLLM offers none, so two writes in the very same instant still resolve to one winner. For the first uses (a hidden-list one or two people edit) that sliver is fine. A busy shared channel — many writers, fast — would need a real coordinator, and this scheme is the wrong tool for it.

### A whole small database as the payload

The payload doesn't have to be a flat list — it can be an *entire small database* written out to one string. Tables, relationships, tags, whatever ji keeps: encode the lot to JSON, keep that in `description`. To change it: read the string, decode it back into the database, alter *that*, re-encode, write.

The read-merge-write rule carries straight over, and matters even more here: **decode the string you just read, apply your one change to that, then re-encode and write.** Writing out a database you decoded from an *earlier* read throws away every change another browser made in between — the whole-database write is the ultimate "here is the entire new note". Read fresh, change, write, back-to-back.

**Room is generous — measured, not guessed.** On the live instance the `description` field round-tripped *exactly* at every size tried, from 1 KB up to 4 MB (it's a plain text column in AnythingLLM's SQLite store, which has no small limit). So a small database — kilobytes to a few megabytes — fits with room to spare. The real ceiling isn't the field; it's that **every read and every write moves the whole blob** over the network and re-encodes it, so a database that grows large makes each tiny edit expensive. Keep it modest, and split by purpose into separate notes (e.g. `intersection.tags`, `intersection.hidden`) so each edit only rewrites the part it touches.

### Endpoints used

- Save a string as a document: `POST /document/raw-text` — body carries the text and the details (title + description).
- List every stored document: `GET /documents`.
- Read one document's details: `GET /document/{name}` — where `name` is the stored file name (no folder in front).
- Remove a document: `DELETE /system/remove-documents` — already reachable through the proxy today.

### Proxy — three new doorways

The key-holding server only forwards ji's known calls. Three must be added to its allow-list:

- `POST /document/raw-text`
- `GET /documents`
- `GET /document/{name}`

(Remove-documents is already allowed.)

### ji side — a tiny shared-note helper

A small piece next to the AnythingLLM transport that offers two moves for a named note:

- **read(title)** → the parsed payload, or nothing if the note isn't there.
- **write(title, payload)** → replace the note with a fresh one.

Both log plainly: what title, how many bytes, found or not, replaced or created.

## Limits (know these going in)

- **It's per-instance, not per-workspace.** The note lives in AnythingLLM's whole document folder, not inside the "intersection" workspace. Fine for ji, which uses one workspace — but two different workspaces would share the same note.
- **Room is generous, but every edit moves the whole blob.** The details field round-tripped exactly up to 4 MB (measured), so a small database fits easily — the cap isn't the worry. The worry is that each read and write carries the *entire* payload and re-encodes it, so a large, often-edited store gets slow. Keep each note modest and split by purpose (see "A whole small database as the payload"). For genuinely large text, the only other path is to embed it and read it back through search — which puts it into the knowledge base, wrong for private app data.
- **No locking.** AnythingLLM offers no lock, so two writes in the very same instant resolve to one winner. Read-merge-write (above) keeps a *late* writer from wiping an *earlier* one's change, which is the real danger; only a true simultaneous collision loses, and that sliver is fine for the first uses. A busy shared channel would want a real coordinator.

## First use — hidden chat exchanges

The chat's "delete a question" can't truly remove one exchange (AnythingLLM only wipes the whole chat). Instead, a per-question control marks it hidden; the hidden list is one sideband note (`ji-hidden`). Every browser reads it and folds those exchanges out of view; a "show hidden" toggle brings them back. This is the concrete proof of the whole scheme, and it clears the chat "hidden/visible" and "delete hidden" debt items.

## Success

- Writing a note then reading it from a *second* browser returns the same payload.
- An un-embedded note never appears as a source in any answer and never shows in the workspace's own document list.
- Replacing a note leaves exactly one document under that title, not a growing pile.
