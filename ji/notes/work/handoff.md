# Handoff

My resume point for ji: the one thing to do next, and the context you can't read off the code. What just finished is in the [work journal](work%20journal.md); everything still owed is in [code debt](code%20debt.md).

## Next — add fetch-documents to the AnythingLLM file, then merge constants into configuration

First unchecked in [code debt](code%20debt.md): **add fetch documents to the AnythingLLM file** — a call that reads back the list of documents the workspace already holds (so a fresh browser could show what's embedded, rather than only its own local list).

### Proposal — read back the workspace's embedded documents

**Why.** Today a browser only knows about documents it uploaded itself — the map from a ji document to its AnythingLLM location is saved per-browser. So a second computer, sharing the same AI workspace, sees an empty document list even though the workspace holds documents. This call asks AnythingLLM what's actually embedded.

**The call.** A new read in the AnythingLLM file, shaped exactly like the existing chat-history reader: find the workspace, ask for its detail, pull the embedded documents out of the answer, hand back a small list. Returns an empty list on any trouble, logs plainly, never throws — the same safe pattern as the rest of that file.

- **Endpoint to verify first.** AnythingLLM's workspace-detail read (its address is the workspace slug on its own) returns the workspace including the documents embedded in it. **Verify the exact address and the fields on each document against the running instance before writing** — I have not confirmed them, so the field names below are a guess to be checked.
- **What each document offers (to confirm):** a readable name (the filename ji uploaded it under) and its storage location (the same string ji already keeps to remove one). A size and a date may ride along.
- **Return shape.** A small record per document — at least name and location. Reuse or add a plain type beside the exchange type.

**Two things that gate it:**

1. **The proxy must be told about this call.** The proxy only forwards ji's known handful of calls — the workspace-detail read is not one of them, so through the proxy it would be refused (a "not allowed" answer). Add one matching rule to the proxy's allow list for the workspace-detail address, then restart the running proxy so it picks it up. (Directly on localhost this isn't needed — only the off-mac path goes through the proxy.)
2. **Read-only for now — decide before going further.** The fetched list is AnythingLLM's own view (names and locations), not ji documents. A fresh browser has no local record for them and no way to open their bytes (the bytes live in whatever browser first dropped them). So the first step is display-only: show the names of what's embedded. Turning that list back into real, openable ji documents (rebuilding the local records, re-linking, re-fetching bytes) is a separate, larger step — do not fold it in.

**Success.** On the second computer, the call returns the same document names the first computer uploaded; the number matches what AnythingLLM's own document picker shows. Proven by reading the log line the new call writes (how many documents it found).

## Context

**The app as it stands.** One always-on screen: a top bar (hamburger, the operations pill, the centered "Intersection" title, a help button), then a panel. The content region shows one view for the current operation (the switcher, Show_Operation): the documents list, the drop box, the document viewer, or the LLM ask box. The list carries a tag filter (a joined pill with an all/any toggle, both hiding when there aren't enough tags), a "search by name" box, and the family filter; below a rule, the table. The "ask" segment works only on the LLM store. The details region (preferences + data) collapses from the hamburger.

**The stores.** The document store is built and wired — design in [db spec](db%20spec.md) / [db proposal](db%20proposal.md), status in [db handoff](db%20handoff.md). The LLM store is built too — a local store mirrored to a running AnythingLLM for search-and-ask.

**Method that holds.** One thing at a time, proved before the next. Every silent breakage this month came from a path changed without re-running the proof — the erase looked fine until the log showed it clearing zero while the store held tens of megabytes, and the 2 GB movie killed the tab because nothing had ever handed a big file to that path.
