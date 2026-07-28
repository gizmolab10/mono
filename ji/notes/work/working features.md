# working features

| # | Feature |
| --- | --- |
| 33 | Too-big files are turned away from the AI store with a message and a "do not ask again" tick that quiets the rest of that one drop, then resets for the next |
| 32 | Instant tooltips everywhere — one app tooltip that appears at once, centered just below the cursor, replacing the browser's slow native hints across the whole app |
| 31 | The AI store keeps its own content — each document's body and the whole record list are saved beside the documents in AnythingLLM (the body never comes back from its API) and read in at launch, so the store fills itself from AnythingLLM on any machine; screens hold their "empty store" decision until that read finishes, and an empty store opens the drop box in place of the list |
| 30 | The top bar and panel measure themselves — the centered title hides when the row is too narrow to hold it, and the operations view drops (details fill the width) when the window can't fit both; both measured from real on-screen widths, so a resize or a browser zoom triggers them |
| 29 | The AI answers a question live — words appear one at a time as the model writes them (pushed through the key-holding server, no polling), the spinning gear standing in for the ask button until the last word; the finished answer then settles into the saved conversation with its sources |
| 28 | A password screen sets up a new browser for the shared AI — on the AI store with the two settings missing, one field takes a password that writes them and drops to the list |
| 27 | The AI store shows what AnythingLLM actually holds — the true document count in the data readout and the AI's own documents as read-only rows in the table — the same on every machine, not only the one that dropped the files |
| 26 | Any browser, on any computer, reaches the mac's AnythingLLM through a small key-holding server and a free tunnel; two computers share one workspace, its changing address found through a fixed pointer link |
| 25 | A folder shows how many things are under it (after the filter, counting hidden ones too) in place of "---"; clicking the drop box or an open document returns to the list |
| 24 | The ask view is a running chat — the saved conversation newest-first, each question a header over its collapsible answer (with an expand/collapse-all toggle), resuming on refresh |
| 23 | Operations control in the top bar — list, drop, ask, tag; "ask" is inert off the LLM store |
| 22 | The content region shows one view for the current operation — the list, the drop box, the viewer, or the ask box |
| 21 | Filter the list by family, alongside the tag and name filters |
| 20 | The table's column header is its own row above the scroller, so the scrollbar runs beside the rows only |
| 19 | Ask the LLM store a question and get an answer plus the documents it drew from |
| 18 | An LLM store mirrored to a running AnythingLLM — two stores you can switch between, each with its own documents, tags, and tree |
| 17 | The viewer steps to the previous/next showable file (triangles, arrow keys, hold to auto-repeat) and survives a reload |
| 16 | Folders open and close, remembered across reloads; a fat triangle leads any row with things under it |
| 15 | A file under more than one parent shows once per parent; the later ones read lighter as "also here" |
| 14 | The table remembers where it was scrolled and returns there on reload or when the viewer closes |
| 13 | Every document knows its family (image, text, pdf, web page, video, audio, folder), whether it can be shown, and how ready its words are |
| 12 | Drop files and whole folders anywhere; subfolders recurse all the way down |
| 11 | Documents table — type, name, tags, and per-row edit-tags and delete |
| 10 | Filter the list by picked tags (all or any) and a name search |
| 9 | Create tags, and tag a document from its row |
| 8 | Two document stores in the browser's larger byte store, so big files don't overflow; erase all data for the active store, behind an "are you sure" |
| 7 | Drop dedup — a file is known by name and date; same date replaces the bytes, a different date asks (newer on top), with a "do the same for the rest" |
| 6 | Drop progress — a "captured n of x" count with a filling pie ring, and a cancel that stops between items |
| 5 | A file over 1 GB is refused with a clear message |
| 4 | Document viewer — pictures, pdf, a sandboxed web page, a video or sound player, or plain words |
| 3 | A collapsible details region — preferences and data — its open/closed state remembered |
| 2 | Pick the accent color; button text flips white or black by the accent's luminance |
| 1 | A build-notes popup, a build opener, an author credit, and a diagnostic log every message routes through |
