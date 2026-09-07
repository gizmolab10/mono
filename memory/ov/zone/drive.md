---
kind: analyze
title: "Drive"
description: "The one proposal being decided and implemented; it dissolves into truth when done."
tags: [now, weighed]
date: 2026-09-07
---
# Drive

## launch reads a few files at a time

### **Success criteria**

The list draws with every folder and file name as soon as the dispatcher's listing answers, before any file's words are read. The file the editor is presenting is read first, then the files whose rows are in view, then the rest, several at a time. When reading finishes, the counts the app says it found, the dead-link check and every filter answer exactly as they do today. Measured from the app's own log: the time from page load to the first drawn list, before and after. `yarn vitest` 336 pass, `yarn svelte-check` clean.

### **The fault**

`Files.load` awaits `hang_one_file` for every path the dispatcher lists, one after another, each a fetch of the file's whole text, and sets `w_ready` only when the last has answered. Nothing is drawn until then, and five hundred files are read in a chain.

### **The scheme**

1. **Hang first, read later.** `hang_one_file` splits in two: hanging a file under its folders needs only its path, so every file is hung from the listing alone; reading its words is a second act, per file.
2. **Two readies.** `w_listed` turns on once every file is hung — the list draws on it, names and folders only. `w_ready` keeps its meaning, every text read; the narrowing, the link relations and the dead-link check wait on it as now.
3. **Order.** The editor's remembered file is read first. Then the files whose rows `List_Files` has in view. Then the rest in batches — a fixed count of fetches in flight at once, `Promise.all` over each batch — rather than one at a time.
4. **Labels arrive.** A row drawn before its text is read shows its name and no kind or tags; each fills in as its text answers, since the row already reads its file's labels from the store.

### **What goes**

The single chain in `load`, and `w_ready` as the list's only gate.

### **What stays**

`site_of_file`, `project_at`, the folder shapes, `say_what_was_found` and its counts, the dead-link check.

### **Decided**

A kind or tag filter chosen while files are still arriving narrows as they arrive: each file's labels join the narrowing the moment its text answers, and the list re-narrows on each batch, not once at `w_ready`. Decided 7 September 2026.
