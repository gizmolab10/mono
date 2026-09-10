---
kind: analyze
title: "lv log"
description: "What lv decided, thought and reached, newest first; settled entries leave at each consolidation."
tags: [journal, now]
date: 2026-09-01
---
# lv log

<!-- consolidated: 9 September 2026 -->

## 9 September 2026

- D: Persistence.ts reads and writes through core's Preferences under the lv. prefix. Its keys and named pairs stay. Stored forms unchanged
- S: settled 2 lines. The Main.ts comment change is a code comment, kept by git, dismissed. The 1 September line was a settle record, dismissed. truth/structure.md already names Core.ts as what lv takes from core
- D: lv imports gallery. The gallery alias in tsconfig.json and vite.config.ts, common/Gallery.ts as its bridge, Main.ts importing gallery's stylesheet and handing gallery lv's three switches. App.svelte takes Main from the bridge. 34 files of lv's own deleted: six svelte components, the eleven utilities, the twelve tests, the four plugins and Main.css. vite.config.ts names gallery's plugins. The netlify functions import stamp and Order from gallery, Order by its capitalized name. Aliases.test.ts proves only Core.ts, Gallery.ts and Main.ts name an alias. Check clean 398 files, 4 tests, build 386 modules with the vineyard's pictures in it
- D: Main.ts imports gallery's two stylesheets, Main.css then Gallery.css, in place of the one. Nothing on screen changes. Aliases.test.ts expects both
- D: truth/working features.md says a file moved past either end of the order goes in at the other end, the rest shifting, as gallery's Order.ts now does
- D: netlify.toml holds a build rule beside the functions: Netlify builds lv only when lv, gallery or core changed since the last deploy. Takes effect on the push after this one
- D: lv's page is panel's now, through gallery. tsconfig.json and vite.config.ts carry the panel alias, since lv's build compiles gallery's page, while lv's code still names only core and gallery. Customizations.ts gains name, Little Cloud Vineyard, which Main.ts hands to gallery. enable_sidebar stays false, so the hamburger shows no column yet. Check clean 405 files, 4 tests, build
- D: no hamburger, since the sidebar switch is off. The home page's picture, its caption and the title grow and shrink with the window to fill the operation view, the page's border kept. The gallery line in Little Cloud Vineyard.md no longer names a height. Check clean 405 files, build
- D: one color for the accent and the page, so the regions and the space around them read as one. Customizations.ts holds it, color, and Main.ts sets core's two stores to it before anything draws. Its value is an estimate of the swatch Jonathan pasted, which reached no file, for him to correct
- D: the controls row shows no name. Customizations.ts hands gallery an empty one, since the page itself carries the site's name
