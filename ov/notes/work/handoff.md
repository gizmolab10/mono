# Handoff

My resume point for overview: the one thing to do next, and the context you can't read off the code. Everything still owed is in [code debt](code%20debt.md). What's finished is in the [work journal](work%20journal.md).

## Loose end — two buttons now follow the filters, not the screen

The count under the filters was changed to say how many guides the filters leave, counted before the folds. Two buttons key off that same number, so both moved with it: the show/hide folders button hides when it reads zero, and the unsorted button when it reads one or fewer.

Worth a look on screen: with a folder shut, the list can show fewer files than the count says, and those two buttons now answer to the count rather than to what is visible.

## Next — the two step triangles become one piece

The reading view draws its two fat triangles by hand: two buttons, two drawn shapes, the hold-to-keep-stepping timers, and the arrow keys, all sitting in the middle of a file that is mostly about reading a guide. Nothing else uses them yet, and something will.

### The shape of it

One piece that takes: whether back is possible, whether forward is possible, and what to do for each. It draws the two triangles, handles the click, and keeps the hold-to-repeat patter. The arrow keys stay where they are — they belong to the guide on screen, not to the triangles.

### Success

1. The reading view is shorter by the whole of the triangle drawing and the hold timers.
2. Stepping behaves exactly as it does now: click, hold to repeat after a pause, the forward triangle simply absent at the top of a link stack.
3. Nothing about the arrow keys changes.
4. The type check and the tests run clean.

### Then, in order

Taking a chosen tag out of every row's tag cell, and a checkbox in preferences for turning the hover hints off.

## Context

**The app as it stands.** A controls row (hamburger, build number), then two boxes: the details column on the left with the accent color picker, and the content box beside it. The content box does one of two things — looking through the guides, or reading one. Looking through means four filters (one project, one kind, any number of tags, and words looked for in titles and descriptions), a count, and the list: every folder and file, folders leading their contents, each folder opening and shutting and remembering which it was. With the folders hidden the list flattens to every file, sortable by any run of columns.

**Where the guides come from.** Overview reaches outside its own folder on purpose. The build learns only the addresses of every markdown file under each collection's guides folder; at launch each is read once, its five labels kept, and its text let go. Nothing about a guide's contents is held or saved. Index files are left out entirely — the folders do that job now. Last count: 135 files across mono, di, ws, ji and ov, all fully labeled.

**One top folder.** The four project folders hang under the shared one, the way they sit on disk, so climbing the folders above a guide can leave one project and reach another — which is what following a link between collections needs.

**Links inside a guide are live.** A heading moves down the page, another guide opens here, the web opens a new tab, and anything else says plainly it isn't part of the picture. While off the list the two triangles walk the stack of guides reached by links, and the missing forward triangle is the sign of being off it. The list's own run is untouched, and the count under the filters never moves because a link was followed.

**Only text that says outright it is a web address becomes a link.** The reader's guessing is off, because it read the bare words "CLAUDE.md" as a site in Moldova, whose ending is the same two letters markdown files use.

**A guide can be changed from inside the app.** Each outermost piece of a drawn guide carries the lines of the file it came from; with editing on, a click opens that piece in a box holding the file's own words, and leaving the box writes just those lines back. The five labels have their own form, with kind and tags picked from the app's own closed lists. Writing goes through the small local server — the one the log lines go to — which refuses anything that isn't a guide, and refuses again if the file no longer reads as the app last saw it. Command-clicking a file in the list opens it already editing.

**There is a test runner now.** `yarn test:run` for one pass, `yarn test` to watch; anything ending in `.test.ts` under the source folder is picked up. 53 tests as of this writing. New work is stubbed and tested before the code, and a step isn't done until both the tests and the type check are clean.

**A search row sits under the reading view's top row.** Every keystroke lights the first place those words turn up and moves there; the words are taken exactly as typed, spaces and all.

**What's saved between visits.** The accent color, which details sections are open, whether details shows at all, all four filters, which folders are shut, whether folders show, which columns sort and which way, where the list was scrolled, which operation is showing, and which guide is being read. The link stack is not saved: a page refresh comes back to the same guide with nothing behind it. Every name reads `ov_` then parts joined by underscores.

**One thing to know about the folds.** Which folders are shut is remembered always, but only applied while the folders are on screen. With them hidden the list is every file that survives the filters — otherwise a fold made in one view would quietly subtract from a count in another, which is exactly the confusion it caused once already.

**Method that holds.** One thing at a time, proved before the next. Every new path gets logging that carries the actual numbers behind each decision, so a claim about why can be answered by reading the log rather than guessing. The type check runs clean — no errors and no warnings — before anything is called done.
