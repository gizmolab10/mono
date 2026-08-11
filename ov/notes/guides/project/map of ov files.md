---
kind: refer
title: "Map (ov)"
description: "Every source file in overview, updated whenever files are added, moved, or removed."
tags: [journal, notes, program]
date: 2026-07-31
---

# Map — ov source

Overview's files. Update this when files are added, moved, or removed.

## root config

- `vite.config.ts` — the dev server (port 5185, read from the hub's ports file) and the build. It also lets the server reach outside this folder, which is what makes the guides in the other collections readable at all.
- `package.json` — two dependencies only: the color math and the markdown reader.
- `svelte.config.js`, `tsconfig.json` — the compiler and type-check settings.
- `vitest.config.ts` — the test runner: anything ending in `.test.ts` under the source folder.
- `index.html` — the page the app mounts into.
- `CLAUDE.md` — the project entry point.

## src/lib/svelte/main/ — the frame

- `App.svelte` — the root. Pushes the four theme colors onto the page whenever any of them changes, starts the one hover-hint watcher, and works out the layout from the real window width: details column and content box side by side, or — when the window is too narrow for both — details alone. Shows nothing but "setting up the overview browser..." until the guides are read. Reads the latest build number off the build-notes table and holds the backdrop that shows them.
- `Controls.svelte` — the row across the top, on the accent: the hamburger that shows or hides details, then the build-number button, then a spacer that takes up the rest so those two stay together at the left.
- `Details.svelte` — the collapsible column at the left, holding one section (preferences). Which sections are open is saved as a list of their names; all shut saves an empty list, and nothing saved at all means all open.
- `Operation.svelte` — the content box beside details. It shows exactly one of two things: reading a guide, or looking through them. A guide the list no longer shows closes itself rather than showing nothing.
- `Browse.svelte` — looking through the guides: the filters, the count row, and the list, stacked flush so each holds its own gap and nothing adds a second helping. The count row carries a show/hide folders button at the far left, an unsorted button beside it, and the count pinned to the middle of the whole row. The folders button hides when the filters leave nothing; the unsorted button shows only when the folders are hidden, a sort is on, and more than one file is left.
- `Editor.svelte` — the frame around one guide: the top row, and the three parts stacked under it. The row carries the step marks, the folders above the file, the file's name pinned to the middle of the whole width, and the three buttons at the far right — hand it to Obsidian, send it in a message, throw it away. A press anywhere in that block that isn't on one of its controls goes back to the list, and the block lights while the cursor is over an empty part of it; the Escape key does the same. Holding a step mark down keeps stepping, and the arrow keys do the same. Two things are shared rather than owned by any one part, so they live here: the whole file's text, which both the labels and a piece being changed write to, and the short line along the bottom that says what a dead link or a refused write has to say.
- `BuildNotes.svelte` — the build-history popup: a paged table read from the build-notes file, with close and up/down arrows.

## src/lib/svelte/content/ — what the content box shows

- `Status_Line.svelte` — one line of words along the bottom of the window: what just happened, or what went wrong. It is there only while there is something to say, clears itself after a few seconds, and a small cross takes it away at once.
- `Files.svelte` — the list itself: every folder and file, folders leading their contents, each row indented by how deep it sits. A row's whole width answers to a click — a file opens for reading, a folder opens or shuts — and carries the hover hint; the little triangle keeps its own click and stops it from reaching the row. The column titles are buttons while the folders are hidden: clicking one walks it through smallest first, largest first, and not sorting, and more than one column can sort at once, with a small number saying where each comes in the order. A project column appears between kind and name, but only while the folders are hidden and no project is picked. The header sits still above the scrolled rows and stands only as tall as its line: the line lies along its top edge and the titles are pulled out of the flow to ride it, taking no height, so whatever stands above measures its gap to the line and the rows stand clear below. The header as a whole stands in front of the line, since lifting it makes a world of its own that nothing inside can reach out of. The list remembers where it was scrolled. The line between rows starts well in from the left, painted under the first column rather than drawn as its edge. Whether there is actually a scrollbar is measured rather than assumed, since a stylesheet cannot ask.
- `Search.svelte` — looking through the guide on screen: the search row, and the one place highlighted in the words. The count and two step marks appear beside the field once there is something to look for, and walk the places found, wrapping at both ends. The words looked for are the very ones typed into the list's search, so they carry between the two screens and across a reload. A place inside a folded section is shown while it is highlighted; the piece already open is left alone when the next place is inside it, since folding and unfolding the same piece is what blinked on every keystroke.
- `File_Content.svelte` — one guide's own words. Its text is read here, turned from markdown into a page, held only while it is on screen, and let go on close. A click on any piece opens it in a box holding the file's own words for those lines; leaving the box writes just those lines back. Each heading is named after its own words so a link ending in a heading has something to land on. A click on a link follows it — down the page, to another guide, or out to a new tab — and a link that leads nowhere says why. The words are styled here — paragraphs stepped in and spaced, the six heading levels colored, a line under the top heading — and punctuation is left exactly as the file writes it, so a piece reads the same on the page as in the box that edits it. Every heading below the first carries a soft pointer in the left margin that folds its section away, and the top heading's folds them all; the left inset sits inside the scrolled box so those pointers are not clipped away. The bar beside the words carries a second marker showing where the browser alone would have put its thumb.
- `File_OKF.svelte` — what one guide is labeled: its title, its date, the line saying what it is for, its one kind, and its tags. Nothing is typed as free text where it matters — the kind and the tags are picked from the only lists the app accepts. The line above folds the whole form away and then says what the file is labeled; the kinds and the tags each fold behind their own word too. Any change writes the labels back to the file at once and tells the list, so what is on screen agrees with the file without every file being read again.
- `D_Preferences.svelte` — the accent color picker. **ji**
- `List_OKF.svelte` — the four filters across the top: words looked for in titles and descriptions, one project at a time, one kind at a time, and any number of tags. The kinds row also offers `none`, which leaves only the files carrying no labels at all. Each has its own bar with its own word above it. The search field takes the whole top row, and the heavy line under it carries one word that folds every picking row at a press — reading just `filters` while they show, and what each holds while they don't. Each row also folds behind its own word. Every fold is remembered. What kinds and tags exist isn't known until the files are read, so both lists fill themselves the moment that finishes.

## src/lib/svelte/support/ — the pieces the rest lean on

- `Steppers.svelte` — the two fat marks that step from one thing to the next. Ordinarily the one that leads nowhere is simply absent, since its absence says there is nothing that way; asked to show both, it is drawn anyway and left gray and unanswering, so the pair never changes width. Holding one down keeps stepping — one step at once, a pause, then a steady patter — and each pair keeps its own beat. Asked to run up-and-down, the marks turn and stack.
- `Big_Pill.svelte` — one area of tags standing as a single pill. Shut it is one word — the area's own name, or the names of whatever inside it is picked. Open it holds a cross at the left and its tags as one unbroken run of segments at the right, both inside a second border drawn within the first. Opening one leaves the others as they are, and picking a tag leaves it open. A tag nothing is left wearing goes; with one left the area steps aside and that tag stands as a plain pill; with none left the area is gone.
- `Separator.svelte` — a colored divider with little rounded flares at its ends, and one or more words sitting on it — spread evenly along its length, or held to its two ends. A word can be a button; since the line is a couple of pixels tall, a clear strip the height of an ordinary control lies along it, so pointing anywhere lights the word and clicking anywhere presses it. The line stands one layer above whatever it bounds but never in front of a word drawn on it from outside. **⟵ji**

- `Section.svelte` — one section of a page: a line across the top, then whatever it holds, with equal gap above and below. Stacks of these make a screen. The point is that a section owns its own spacing — nothing inside it and nothing beside it sets a margin to line itself up, which is the fault every gap it replaces came from. Folded, it holds no gap and stands one gap tall so its two lines never meet; folded while it holds subsections, it stands flat, since it holds no gap of its own when open either.
- `Hideable.svelte` — a collapsible titled banner. **⟵ji**
- `ToolTip.svelte` — the hover hint, drawn ourselves because the browser's own waits a second and can't be hurried. One is mounted at the app root. **⟵ji**

## src/lib/ts/ — logic

- `main.ts` — the entry point. Pushes the stacking layers, the sizes and the fixed inks onto the page, reads three of them back off the page to prove the bridge works, then reads every guide once before letting the app show itself.
- `common/Constants.ts` — the one source for every size. A base "comfortable tap" number (35) with groups derived from it — fonts, margins, gaps, radii, thicknesses, control heights, region widths. Change the base and the whole interface rescales together. **⟵ji**
- `common/Configuration.ts` — mirrors those numbers onto the page as plain style names, so ordinary stylesheets can read them: the stacking layers and sizes at startup, the fixed inks at startup, and the four theme colors whenever one changes. **⟵ji**
- `common/Debug.ts` — the diagnostic log. One call posts a plain-English line to the hub's log server, which writes `logs/ov.log`; the first line of a session overwrites, the rest append. Away from this machine every line gives up before it builds anything. A second call takes the same words and says nothing, for lines worth having only while something is being worked on.
- `common/Dirty.ts`, `common/Extensions.ts` — store wrappers and the additions to text and number handling. **⟵ji**
- `managers/Files.ts` — where the guides come from. The dispatcher is asked what markdown files sit under every collection's guides and designs folders, and that list is the whole picture — nothing is settled when the app's code is prepared, so a file added, moved or thrown away shows straight away. Each file is read once, its five labels kept, its text let go. Index files are left out entirely. A file arriving with no labels gets a block composed from its own words and marked stale. A tag not on the closed list is dropped and said so. Also renames, moves and throws away a guide — mending the links and the index beside it — and hands out the rows the hierarchy worked out, working them out again whenever any filter moves.
- `managers/Hierarchy.ts` — the folders, the files, and the tags on them, made fresh each launch out of the addresses. Holds the walk that turns the folder shape into a list with a depth on every row, and the narrowing: which rows survive the filters, which folders are kept because something inside them matched, how many matching files sit under each folder, and the sort. It also answers a link written inside a guide, by climbing the folders above that guide and taking the first guide of that name found beneath any of them. **⟵ji**, with the storage left behind.
- `managers/Filters.ts` — all the filters in one place, so the hierarchy can read them without reaching into anything that draws: the project, the kind, the tags, the words, which folders are shut, whether folders show at all, and which columns sort and which way.
- `managers/Operations.ts` — which of the two things the content box is doing, which guide is being read, and the stepping between guides. Off the list it walks the stack of guides reached by links — one down, one up, emptied by backing out of the bottom; on the list it walks the filtered run, past folders and wrapping at both ends. **⟵ji**, trimmed from seven modes to two.
- `managers/Status.ts` — whether there is anything to say along the bottom, and what. One call says a line and starts the few seconds after which it clears itself.
- `managers/Preferences.ts` — what the browser remembers between visits. Every name reads `ov_` then the parts joined by underscores, and the name in the code is the name in the browser. None of ji's renaming and sweeping code came over: overview has no old names to bring forward.
- `database/Indexes.ts` — the instant lookups (tags by file, files by tag, children by folder, parents by file), rebuilt whenever the records change. **⟵ji**
- `types/File.ts` — what a guide is: the seven kinds, the closed list of twenty-nine tags, the five collections, the five labels off a file's top, and a listed row — a guide together with the tags on it, how deep it sits, the folder chain above it, and whether it holds anything.
- `types/Tag_Areas.ts` — the tags gathered into eight areas, so twenty-nine words can be read a handful at a time. Seven gather by what a guide is about; `progress` gathers by where a guide stands in its own life. The areas are only a way of reading the list, not a second thing to filter by: every tag belongs to exactly one, and the tests prove the two lists agree. Also answers which of an area's tags are still worth showing, and what a shut area reads.
- `types/App.ts` — the two states the app can be in: setting up, and ready.
- `types/Details.ts` — the sections inside the details column, by name.
- `types/DB_Records.ts` — the record shapes the hierarchy keeps: tags, tag placements, folder links, and link meanings. **⟵ji**
- `types/Angle.ts`, `types/Coordinates.ts`, `types/Types.ts` — angle math, points and rectangles, shared types. **⟵ji**
- `utilities/Markdown_Blocks.ts` — turning a guide's text into the page on screen, and putting a change back into that text. Takes the five labels off the top, gives every outermost piece two numbers — the line it starts on and one past the line it ends on, counted from zero against the whole file — names the headings, and marks the links. Also hands one piece's own words back out of the file, swaps a run of lines for what was typed leaving every other line untouched, and answers whether those lines still read as they did when the piece was opened. Pieces sitting inside other pieces are left unmarked for now.
- `utilities/Index_Files.ts` — mending the two index files a move leaves lying: reading which file a bulleted link names, taking that line out of one index, and putting it into another in its alphabetical place. An index that lists files in more than one place gets a "More" heading, since nothing in it says which list the arrival belongs to.
- `utilities/Sections.ts` — which pieces of a drawn file each heading owns: everything after it up to the next heading of its own level or higher. Also which headings carry a folding mark, whether every section below the top is folded, and what goes out of sight for a given set of folds.
- `utilities/Thumb.ts` — where the browser alone would have drawn a scrollbar's thumb, and whether that differs from what is really drawn. A thumb is held to a floor — never shorter than a fifth of its lane — and this works out the marker laid over it showing the difference. Both the list and a file's words use it.
- `utilities/Emphasis.ts` — making a run of picked words heavy, slanted or struck through while a piece is open, and taking the marks off again. Stars stack — one is slanted, two are heavy, three are both — so slanting heavy words adds to them rather than half-undoing them. Also the marks that come in pairs: typing a bracket, brace or quote with words picked puts it before them and its partner after, and typing it again takes both off.
- `utilities/Hit_Empty_Space.ts` — what a press on the top of a file's view means. The two rows above the heavy line are mostly empty, and that empty space is the way back to the list; this says which things answer for themselves instead — the step marks, the search field, the count between its marks, and the file's name. Written over plain names so it can be proved without a page, and the same rule decides both the press and whether the area lights.
- `utilities/Sectioning.ts` — the arithmetic behind a section, kept out of the component so it can be proved without a page: how thick the line at a boundary is drawn, how much gap the section holds above and below what it shows, and how tall it stands while folded. A section holding subsections holds none of its own, since its children already hold one at those very boundaries — and folded, it stands flat for the same reason.
- `utilities/Searching.ts` — which piece a search has to open and which it can fold away again, worked out together from the piece open now and the piece the next place needs. Done in the wrong order it folded a piece and opened the same one again on every keystroke, which is what blinked.
- `utilities/Stepping.ts` — the plain rules behind the step marks: which way each points when the pair runs across or down, whether a mark is drawn and whether it answers, and the holding that repeats a step.
- `utilities/Labels.ts` — writing the five labels back to the top of a guide's file: the block itself, and swapping it into the file with every word below left alone. A file carrying no labels gets one put at the very top.
- `utilities/Saving.ts` — writing a changed guide back to its own file. Works out where a guide sits counting from the top of the repo, and hands the dispatcher the whole new text along with the text as it was when the guide was opened — which that server checks against the file before writing anything.
- `utilities/Colors.ts` — the color math, the four theme colors, and the fixed design colors including the ink black (never pure black). **⟵ji**
- `utilities/SVG_Paths.ts` — the drawn shapes: the hamburger, the close cross, the fat step triangles, and the soft pointer used for the folder marks. **⟵ji**
- `utilities/Tooltip.ts` — the plumbing behind the hover hint: the action any element uses to name its words, a store holding what's pointed at, and one watcher that follows the cursor and finds the nearest hinted thing under it. **⟵ji**

## src/lib/ts/tests/ — the tests

- `runner.test.ts` — proves the runner is wired up.
- `markdown_blocks.test.ts` — the line numbers each piece of a drawn guide claims, taking the labels off the top, putting typed words back in place of a run of lines, and drawing a whole guide again after a change.
- `saving.test.ts` — working out where a guide sits, counting from the top of the repo.
- `labels.test.ts` — writing the five labels back to the top of a file.
- `index_files.test.ts` — mending the index files a move leaves lying.
- `tag_areas.test.ts` — that the eight areas and the closed tag list agree exactly, what an area offers, and what a shut one reads.
- `stepping.test.ts` — which way each step mark points, whether it is drawn and whether it answers, and the holding that repeats a step.
- `sections.test.ts` — what each heading owns, which headings carry a folding mark, when the top one reads as folded, and what goes out of sight.

## src/lib/ — styles and data

- `main.css` — the global stylesheet; holds the stacking-layer classes that read the layer numbers pushed from Constants, and the one look every scrollbar wears. A scrollbar's own styling cannot read the sizes pushed onto the page, so the numbers there are written out plainly — a name silently falls back to the browser's own fat bar.
- `md/builds.md` — the build-notes table, read at runtime.

## src/ other

- `vite-env.d.ts` — the ambient types that let the build's raw-text and address imports type-check.

## notes/

- `guides/map.md` — this file.
- `guides/adding a guide.md` — what a new guide needs in order to show up in the app.
- `guides/pre-flight/banned words.md` — overview's own word substitutions.
- `work/index.md` — what's in the work folder.
- `work/working features.md` — what the app can do, newest first.
- `work/file layout.md` — where everything lives.
- `work/handoff.md` — where to pick up, and the context the code doesn't say.
- `work/code debt.md` — everything still owed, and what's done.
- `work/work journal.md` — what's been finished, newest first.
- `work/editing.md` — the plan for changing a guide from inside the app.

The proposal that started this project lives in ji, at `ji/notes/work/proposals/ov.md`.
