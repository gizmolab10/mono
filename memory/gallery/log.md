---
kind: analyze
title: "gallery log"
description: "What gallery decided, thought and reached, newest first; settled entries leave at each consolidation."
tags: [journal, now]
date: 2026-09-01
---
# gallery log

<!-- consolidated: 9 September 2026 -->

## 9 September 2026

- D: Persistence.ts reads and writes through core's Preferences under the gallery. prefix. Its keys and named pairs stay. Stored forms unchanged
- I: proposal in zone/proposals.md, made for it. Router, Parser and Persistence sorted by core's rule: Parser library, Router library with the home page handed in, Persistence's mechanism library and its keys host. Undecided
- S: settled 1 line of 1 September. The rename is in index.md. The line was a settle record, dismissed
- D: nothing of lv's is left. The vineyard folder, the photo list, the icon and the home page are deleted. A sample page and three sample pictures take their place, and the tests read those. index.html says gallery. The netlify functions ask for GALLERY_PASSPHRASE. reorder.mts imports Order by its capitalized name
- D: the host sets gallery's switches. Customizations.ts holds home and prefix beside enable_sidebar. Persistence makes its Preferences on first use, Technical and S_Sidebar read the remembered value when asked, and Router resolves the home page when asked, so a host's values set after gallery's files load are the ones read. Renderer and Sidebar read router.page. Check clean 471 files, 122 tests pass, build 375 modules
- D: gallery's two questions answered by Jonathan in zone/proposals.md. Image files are dragged and dropped, and all of lv's code that supports this remains in gallery. Both leave questions.md
- D: lv and mj import gallery through the gallery alias, each with a bridge Gallery.ts beside Core.ts. lv takes Main.svelte and the stylesheet and deletes 34 files of its own. mj takes Gallery.svelte and photosInFolder into its operation view
- D: the stylesheet is cut in two. Main.css keeps the page shell and where the edit button sits. Gallery.css, new, holds the pictures, the edit button's look, the drop box and the file-and-caption table, so a host without the page shell can take it. gallery's own Main.ts imports both
- D: Gallery.css centers each picture and its caption on their own, block with auto margins, so a host without the parser's wrapper draws them centered too. No picture is drawn wider or taller than 500px, one number in one place, the style name gallery-photo-most on the root, read by the image and the movie rules. Both hosts take it
- D: the 700px cap moved from the image to the button around it, in Gallery.css. Written on the image as a share of the button, the cap was dropped while the button's width was found, so the button filled its box and the picture sat at its left. The image now takes the whole of a button that is as wide as the picture, and the auto margins center it
- D: no flash of the page behind a picture on a step. Gallery.svelte keys only the movie on its address, so a still is one element whose address is swapped and the picture up stays up until the next has arrived. The next picture and the one before are fetched as soon as one shows, so the swap has nothing to wait on
- D: a file moved past either end of the order comes out and goes in at the other end, the rest shifting one place, in Order.ts. Before, it swapped with the file at the far end, so the last moved down made the first last. Inside the run it still swaps with its neighbor. Order.test.ts proves both, and that two files swap either way. truth/working features.md says so
