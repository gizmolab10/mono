---
kind: analyze
title: "mj log"
description: "What mj decided, thought and reached, newest first; settled entries leave at each consolidation."
tags: [journal, now]
date: 2026-09-01
---
# mj log

<!-- consolidated: 9 September 2026 -->

## 9 September 2026

- D: the outer div's class is app, not frame, in App.svelte. Check clean
- S: settled 4 lines of 1 and 7 September. The name label, panel taken whole, the paths and the stylesheet are in index.md. The audit's one gap and its port fix are done and in index.md. The 1 September line was a settle record, dismissed. Not memory: mj/CLAUDE.md still says three files carry it
- D: mj imports gallery. The gallery alias in tsconfig.json and vite.config.ts, common/Gallery.ts as its bridge, Operation.svelte drawing gallery's Gallery.svelte under its one line with photosInFolder of a folder mj does not have yet, so it says no photos in mj. Customizations.ts holds home and prefix beside name, and Main.ts hands them to gallery before mounting. vite.config.ts names gallery's two plugins. gallery's stylesheet not taken, since its hamburger fights panel's. Aliases.test.ts, mj's first test. Check clean 471 files, 4 tests, build 171 modules
- D: gallery's edit button at the right end of the controls row, drawn while this browser's technical preference says true, pictures or none. Edit and technical come through the bridge. Controls.svelte styles it as it styles the hamburger, since gallery's stylesheet is not taken. Check clean, 4 tests, build
- D: Main.ts imports gallery's Gallery.css after core's stylesheet, so the drop box, the file-and-caption table and the edit button wear gallery's look. The edit button block in Controls.svelte is gone. Aliases.test.ts names Main.ts as a bridge for gallery too
- D: Operation.svelte centers the picture and its caption in the content box's height, a column flex with justify-content center while editing is off. While editing is on, the drop box and the table start at the top. The unused k import, left when the one line went, is gone
- D: D_Preferences.svelte moved from ov, the two color pickers, accent and page, drawn in the details column. Its imports read mj's Core.ts, which now takes core's debug. One fault of ov's not carried: its label reads var(-font-control), one dash, a name nothing pushes, so it inherits its font size. Here the label inherits it outright. mj remembers no color yet, so a pick lasts until the page reloads
- D: the details column is one stack, as ov's is. Its one section holds the preferences, under the word preferences on the separator above it, a press on which folds the section away and brings it back. Core.ts takes Action, T_Position, Separator and Stack. Whether the section is open is not remembered between visits
- D: two choices remembered between visits, whether the details column is shown and whether the preferences section is open, as mj.show_details and mj.preferences_open. managers/Preferences.ts, new, holds the two keys and one instance of core's Preferences under mj's prefix. Core.ts takes Preferences. App.svelte and Details.svelte read stores that save themselves
- D: the accent and the page color are remembered between visits, as mj.color_accent and mj.color_background. Main.ts reads each into core's store before mounting and writes every change back, the way ov's main.ts does. Two keys added to managers/Preferences.ts
- D: the controls row calls the project 2026 planting, in Customizations.ts. The home page name and the pictures folder still say mj
- D: the browser tab says our flourishing 2026 planting, in index.html. mj is to live at mj.jonathansand.me as a view-only site, with no netlify functions. Jonathan added its public address to the hub's ports file
