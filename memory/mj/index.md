---
description: mj — draws panel, and gallery's pictures inside it; what it is for is not written yet.
---
# mj

Brought up 1 September 2026. What mj is for is not written yet.

**Current state:** since 7 September 2026 mj draws panel — App.svelte holds the `.app` div and the width arithmetic, Controls a row with core's hamburger and the project's name, 2026 planting, centered on it, Details one stack of one section, the preferences taken from ov, the two color pickers under a word that folds them away, Operation the content box — on its own paths, App at svelte/App.svelte and the entry file Main.ts. Since 9 September 2026 mj imports gallery through the `gallery` alias and `common/Gallery.ts`: Gallery.svelte and photosInFolder, drawn in the operation view under its one line, showing mj's folder of pictures. mj has no pictures yet, so the component says no photos in mj. gallery's edit button sits at the right end of the controls row while this browser's technical preference, `mj.technical`, says true, and pressing it turns the operation view into gallery's drop box. `Customizations.ts` holds name, home and prefix, and Main.ts hands the last two to gallery before mounting. mj remembers four choices between visits, whether the details column is shown, whether the preferences section is open, the accent and the page color, through `managers/Preferences.ts`, one instance of core's Preferences under `mj.` with an enum of the four keys. Main.ts reads the two colors into core's stores before mounting and writes every change back. vite.config.ts names gallery's two plugins. Of gallery's two stylesheets mj takes Gallery.css, the look of the pictures, the edit button, the drop box and the file-and-caption table, and not Main.css, whose page shell and hamburger rules fight panel's. Everything from core arrives through `common/Core.ts`, and Main.ts takes core's stylesheet last. Aliases.test.ts, mj's first test, proves only the three bridges name an alias. Port 5185, in the hub under K, in mono's workspaces, ov's T_Bundle and the servers script. Checks clean at 472 files, 4 tests, build 171 modules. What mj is for is still not written.

## Truths

None yet.
