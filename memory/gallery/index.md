---
description: gallery — a library lv and mj import: pages from md files, and one folder of pictures shown one at a time, with editing.
---
# gallery

A library two hosts import through the `gallery` alias: lv, whose code this was, and mj. Drag and drop, decided 9 September 2026: image files are dragged and dropped, and all of lv's code that supports this remains in gallery.

**Current state:** since 9 September 2026 nothing of lv's is left in it. The vineyard's pictures, its photo list, its icon and its home page are gone. In their place a sample page, `src/md/Home.md`, and three sample pictures under `src/assets/sample pictures`, which the tests read. The netlify functions stay, asking for `GALLERY_PASSPHRASE`. A host sets gallery's three switches in `Customizations.ts` before it mounts — the home page's name, the prefix its remembered values are saved under, whether the sidebar is drawn — and Persistence, Technical, S_Sidebar and Router read them only when asked, never while their files load. The stylesheet is two files: `Main.css` for the page shell, `Gallery.css` for the pictures, the edit button, the drop box and the file-and-caption table. lv imports Main.svelte and both stylesheets. mj imports Gallery.svelte, Edit.svelte, photosInFolder, technical and Gallery.css. gallery's own App.svelte and Main.ts are the smallest host of the library. No port, not in the hub, by decision. Check clean at 471 files, 122 tests pass and 4 are skipped, build 375 modules.

One registration is deliberately missing: the dispatcher's two collection lists, which decide whose files ov reads. Add `gallery` there when ov should list them.

## Truths

- [working features.md](truth/working%20features.md) — what the site does today, and what each thing cannot do; lv's, copied.
