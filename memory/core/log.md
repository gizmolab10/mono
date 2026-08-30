---
kind: analyze
title: core log
description: "<!-- consolidated: 29 August 2026 -->"
tags:
  - journal
  - now
date: 29 August 2026
---
# core log

## 30 August 2026
- D: every cross-folder import goes through the folder's barrel now — 22 files rewritten, default imports became named; same-folder imports stay direct so no barrel imports itself

- D: Colors holds no persistence — the three chosen colors are plain stores at defaults; remembering them is the host app's business (ov writes them back at startup); Preferences import gone
- D: each ts folder carries an index.ts re-exporting everything it offers, defaults by name
- D: the 13 ov-only tests deleted; the 11 whose subjects live in core remain
- D: create an index.ts file for each folder, with comprehensive imports
- D: delete everything that is unique to ov
- D: copy into it -> all files from **ov**
- D: [[create a project]] called **core** (do not add it to hub)
