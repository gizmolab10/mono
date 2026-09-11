# gallery

A library two hosts import through the `gallery` alias: lv, whose code this was, and mj. Drag and drop, decided 9 September 2026: image files are dragged and dropped, and all of lv's code that supports this remains in gallery.

**Current state:** since 9 September 2026 nothing of lv's is left in it. The vineyard's pictures, its photo list, its icon and its home page are gone. In their place a sample page, `src/md/Home.md`, and three sample pictures under `src/assets/sample pictures`, which the tests read. The netlify functions stay, asking for `GALLERY_PASSPHRASE`. A host sets gallery's three switches in `Customizations.ts` before it mounts — the home page's name, the prefix its remembered values are saved under, whether the sidebar is drawn — and Persistence, Technical, S_Sidebar and Router read them only when asked, never while their files load. Since 10 September 2026 the page is panel's, imported through `Panel.ts`: the edit button at the right end of the controls row, the sidebar in the details column, the md file in the operation view, and the router's words on the status line while there are any. While editing is on, the operation view shows the drop box and the file-and-caption table of every folder the page names, in place of the md file. The stylesheet is two files: `Main.css` for what goes inside the regions, the sidebar's list and the md file, and `Gallery.css` for the pictures, the edit button, the drop box and the table. lv imports Main.svelte and both stylesheets. mj imports Gallery.svelte, Edit.svelte, photosInFolder, technical and Gallery.css. gallery's own App.svelte and Main.ts are the smallest host of the library. No port, not in the hub, by decision. Check clean at 471 files, 122 tests pass and 4 are skipped, build 375 modules.

One registration is deliberately missing: the dispatcher's two collection lists, which decide whose files ov reads. Add `gallery` there when ov should list them.

## Truths

- [working features.md](truth/working%20features.md) — what the site does today, and what each thing cannot do; lv's, copied.
