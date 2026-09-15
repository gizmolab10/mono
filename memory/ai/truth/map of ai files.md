# Map of ai files

ai's files. Update this when files are added, moved, or removed.

## root config

- [vite.config.ts](../../../ai/vite.config.ts) — the dev server (port 5187, read from the hub's ports file) and the build, with the three aliases, core, panel and kb. It also lets the server reach outside this folder, which is what makes the memory files readable at all.
- [vitest.config.ts](../../../ai/vitest.config.ts) — the test runner: anything ending in `.test.ts` under the source folder, and the aliases' third home.
- [svelte.config.js](../../../ai/svelte.config.js), [tsconfig.json](../../../ai/tsconfig.json) — the compiler and type-check settings, the three aliases among them.
- [package.json](../../../ai/package.json) — one dependency of its own since step 11 of the plan, markdown-it, which the drawing reads; the rest of what the page needs comes through kb. The scripts: check, test, dev and build.
- [index.html](../../../ai/index.html) — the page the app mounts into.
- [CLAUDE.md](../../../ai/CLAUDE.md) — the project entry point.

## plugin.py — the dispatcher's side

- [plugin.py](../../../ai/plugin.py) — the code the dispatcher imports and runs for ai, and for ov until it is retired, since the two share a db: the specialty's name, the listing rule with its lists of projects and work folders, moved whole from the dispatcher at step 6 of the plan, whether one path is listed, and the labels the plugin gives a file, none until step 14. Since step 8, ai's own four: read, one file's words, save, the whole text written when the file still reads as the page last saw it, scan, what one file's label block says, and strip, the block taken off one file, with the reading of a block behind them, moved from the dispatcher. The plugin api table in memory/ov/zone/music and ai.md says what each takes and answers.

## src/lib/svelte/main/ — the frame

- [App.svelte](../../../ai/src/lib/svelte/main/App.svelte) — the host of kb's page: draws Main.svelte and hands it two snippets. The edit filter section since step 10 of the plan, the information rows, given the file, its words and a call that sets them. The operation view since step 11, the words drawn as a page, given the file, the width and the height, the words and a call that sets them, a call that takes the html, and calls for drawn, redrawn and a note.

## src/lib/svelte/content/ — what the host hands kb

- [Edit_Fields.svelte](../../../ai/src/lib/svelte/content/Edit_Fields.svelte) — the information rows, ai's since step 10: title and date, brief, use when, authors and from, six fields on four rows, each written to the db on blur through kb's files manager, the four fields on the file's row and the sources as rows of their own, the list told after. A refusal is said on the status line. The title's two tools sit in the title row: the title copied to and from the top heading, and to and from the file's own name.
- [Edit_Markdown.svelte](../../../ai/src/lib/svelte/content/Edit_Markdown.svelte) — one guide's own words, ai's since step 11, drawn as the operation view inside kb's frame. The text is turned from markdown into the html, headings named after their own words so a link ending in a heading has something to reach, every link registered with the hits manager as it is drawn, a click on a link followed and a dead one said on the frame's note line. A click on any piece opens it in a box holding the file's own words for those lines, and leaving the box writes just those lines back through kb's save. Every heading below the first carries a fold button in the left margin, the top heading's folding them all; the bar beside the words carries a second marker where the browser alone would have put its thumb; where a guide was left is remembered as the scrolling settles. Changed words go back to the frame through the call it hands, and the html through another, so kb's search can look inside it.

## src/lib/ts/ — logic

- [main.ts](../../../ai/src/lib/ts/main.ts) — the entry point, ov's main.ts doing what a library cannot. Imports Convert_Preferences.ts first, which fills kb's facts, then reads the remembered colors into core's stores and writes changes back, pushes the stacking layers, the sizes and the fixed inks onto the page, reads three of them back off the page to prove they arrived, then hangs every guide from the dispatcher's listing before letting the app show itself; it names the order the labels are read in after — the file being edited, then the rows in view from the remembered top row, then the rest. It imports core's stylesheet itself, the one reach through an alias outside the bridges.
- [common/Core.ts](../../../ai/src/lib/ts/common/Core.ts) — everything ai adopts from core, one line each, through the "core" alias: the configuration calls, the sizes, the colors, the log, since step 9 the Preferences class, since step 10 hit_target, and since step 11 what the drawer reaches for: T_Hit_Target, Point, hits, free_thumb and its type, CHECKBOX and svg_paths, Direction, the three heading readers of Sections and Separator. **⟵core**
- [common/Kb.ts](../../../ai/src/lib/ts/common/Kb.ts) — everything ai imports from kb, one line each, through the "kb" alias: the page, kb's configuration, the files manager, the preferences, the operations, the app's two states, since step 10 the status line's show_status, save_file, file_path_of, title_from_name and the types File, Labels and Source, and since step 11 what the drawer reaches for: read_file and path_of_address, the five link and stepping calls of Operations, offer_status, key_of, labels_for and today until step 12, code_link_of and is_code_link until step 18, and the link readers. **⟵kb**
- [common/Customizations.ts](../../../ai/src/lib/ts/common/Customizations.ts) — what is true of ai and of no other host, the facts main.ts hands kb: the name, the prefix, the host, the one hierarchy, the folders by name, and since step 7 of the plan the five kinds, the closed list of 39 tags and the ten tag areas.
- [common/Convert_Preferences.ts](../../../ai/src/lib/ts/common/Convert_Preferences.ts) — imported by main.ts ahead of kb, so it runs before any kb module: sets kb's nine facts, the prefix among them, then moves every value saved under ov_ under ai_ and drops the old keys. The one file besides Kb.ts that reaches kb through its alias, for kb's customizations alone. **⟵kb**

## src/lib/ts/utilities/ — the drawing

- [Markdown_Blocks.ts](../../../ai/src/lib/ts/utilities/Markdown_Blocks.ts) — turning a guide's text into the html, and putting a change back into that text, ai's since step 11, cut from kb's file of the same name, whose link readers stayed kb's in Links.ts and are read through Kb.ts. Gives every outermost piece two numbers counted from zero against the whole file — the line it starts on and one past the line it ends on — plus the line it begins on counted from one for showing, and how deep it sits. Names the headings, gives every link the words its hover says, draws a list item's brackets as a box and turns one over on a press, and draws a rule as an ordinary row so it can carry a number. Also hands one piece's own words back out of the file, swaps a run of lines for what was typed leaving every other line untouched, answers whether those lines still read as they did when the piece was opened, clears whatever sits above the top heading, and says what markdown stands at the head of a line that the html gives no width to.
- [Emphasis.ts](../../../ai/src/lib/ts/utilities/Emphasis.ts) — making a run of picked words heavy, slanted or struck through while a piece is open, and taking the marks off again. Stars stack — one is slanted, two are heavy, three are both. Also the marks that come in pairs: typing a bracket, brace or quote with words picked puts it before them and its partner after, and typing it again takes both off.

## src/lib/ts/tests/ — the tests

- [markdown_blocks.test.ts](../../../ai/src/lib/ts/tests/markdown_blocks.test.ts) — the line numbers each piece of a drawn guide claims, putting typed words back in place of a run of lines, drawing a whole guide again after a change, the words a link's hover says, and which markdown at the head of a line the html gives no width to. The link readers' cases went to kb's wiki_links.test at step 11.
- [code_blocks.test.ts](../../../ai/src/lib/ts/tests/code_blocks.test.ts) — a chunk of code counting as one piece: its lines carried on the box and never on the words inside, the language the writer named kept, the fence lines claimed along with the code between them, and a plain paragraph left exactly as it was.
- [emphasis.test.ts](../../../ai/src/lib/ts/tests/emphasis.test.ts) — heavy, slanted and struck-through words going on and coming off, and the marks that come in pairs: which closes which, putting both either side of what is picked, taking them off from inside or just outside the picking, and typing one with nothing picked. Also that stars stack and that a strike and a heaviness are not each other's marks.

- [tag_areas.test.ts](../../../ai/src/lib/ts/tests/tag_areas.test.ts) — that the ten areas and the closed tag list agree exactly, what an area offers, and what a shut one reads, ai's lists through kb's functions.
- [core_alias.test.ts](../../../ai/src/lib/ts/tests/core_alias.test.ts) — that only the bridges reach through an alias: Core.ts and main.ts through core, main.ts for the stylesheet alone, Kb.ts and Convert_Preferences.ts through kb, and nothing through panel, whose alias is carried for the build.

## src/lib/ — data

- [md/builds.md](../../../ai/src/lib/md/builds.md) — the build notes table, ov's, handed to kb as the build notes fact.

## src/ other

- [vite-env.d.ts](../../../ai/src/vite-env.d.ts) — the ambient types that let the build's raw-text and address imports type-check.
