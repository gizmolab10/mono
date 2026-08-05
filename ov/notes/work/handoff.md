# Handoff

My resume point for overview: the one thing to do next, and the context you can't read off the code. Everything still owed is in [code debt](code%20debt.md). What's finished is in the [work journal](work%20journal.md).

## Next — an AnythingLLM button on the hub

The hub's top row gets one more button at the far left, reading "LLM", which opens AnythingLLM. Nothing in overview changes; this is the hub's own row.

### Success

1. The button sits at the far left of the hub's top row and opens AnythingLLM.
2. Nothing else on that row moves.

### Then, in order

Work notes get their own tags — propose, design, progress, vital — under a seventh area called "work". Then the two step triangles come out of the reading view into one piece of their own, with props for running up-and-down and for always showing both. Then two drawn marks: a circle-slash that reverses whatever it sits on, and a filter mark of shortening lines. Then the separator gains a gap prop for the clear strips beside its line, and the question of where "reach" and "spacer" are actually used gets answered. Then a checkbox in preferences for turning the hover hints off.

## Context

**The app as it stands.** A controls row (hamburger, build number), then two boxes: the details column on the left with the accent color picker, and the content box beside it. The content box does one of two things — looking through the guides, or reading one. Looking through means five filters (which purposes show, one project, one kind, any number of tags, and words looked for in titles and descriptions), a count, and the list: every folder and file, folders leading their contents, each folder opening and shutting and remembering which it was. With the folders hidden the list flattens to every file, sortable by any run of columns.

**The picking rows fold.** Each row sits under a bar carrying its own word; pressing that word folds the row away and the word then says what is picked, as `purpose ➜ designs`. A bar is two pixels tall, so a clear strip the height of an ordinary control lies along it and takes the cursor for the whole length. The tags row is six area pills rather than twenty-four words — see the journal entry for 2026-08-04. All of it is remembered between visits.

**The words are short on purpose.** Five kinds — rule, howto, wiring, why, lookup — and twenty-four tags, none of them a gerund. Renaming one means changing the app's list, the six areas, every guide that wears it, and the three notes that spell the list out: `add a guide`, `okf`, and `tags hierarchy`. A remembered tag or kind no longer on either list is let go at launch, since otherwise it narrows the list to nothing with nothing left on screen to undo it.

**Where the guides come from.** Overview reaches outside its own folder on purpose. The build learns only the addresses of every markdown file under each collection's guides folder; at launch each is read once, its five labels kept, and its text let go. Nothing about a guide's contents is held or saved. Index files are left out entirely — the folders do that job now. Designs are swept the same way, from a designs folder beside each guides folder. Last count: 142 files across mono, di, ws, ji and ov, all fully labeled.

**One top folder.** The four project folders hang under the shared one, the way they sit on disk, so climbing the folders above a guide can leave one project and reach another — which is what following a link between collections needs.

**Links inside a guide are live.** A heading moves down the page, another guide opens here, the web opens a new tab, and anything else says plainly it isn't part of the picture. While off the list the two triangles walk the stack of guides reached by links, and the missing forward triangle is the sign of being off it. The list's own run is untouched, and the count under the filters never moves because a link was followed.

**Only text that says outright it is a web address becomes a link.** The reader's guessing is off, because it read the bare words "CLAUDE.md" as a site in Moldova, whose ending is the same two letters markdown files use.

**Files can be moved, and handed to Obsidian.** With the folders on screen a file can be dragged onto any folder, including one in another collection; the file moves on disk before anything on screen changes. Command-clicking a file in the list, or the edit button while reading, opens that guide in Obsidian instead — the repo is itself a vault, so a guide's place in the repo is also its place in the vault.

**A guide can be changed from inside the app.** Each outermost piece of a drawn guide carries the lines of the file it came from; with editing on, a click opens that piece in a box holding the file's own words, and leaving the box writes just those lines back. The five labels have their own form, with kind and tags picked from the app's own closed lists. Writing goes through the small local server — the one the log lines go to — which refuses anything that isn't a guide, and refuses again if the file no longer reads as the app last saw it. Command-clicking a file in the list opens it already editing.

**There is a test runner now.** `yarn test:run` for one pass, `yarn test` to watch; anything ending in `.test.ts` under the source folder is picked up. 116 tests as of this writing. New work is stubbed and tested before the code, and a step isn't done until both the tests and the type check are clean.

**A search row sits under the reading view's top row.** Every keystroke lights the first place those words turn up and moves there; the words are taken exactly as typed, spaces and all.

**What's saved between visits.** The accent color, which details sections are open, whether details shows at all, all five filters, which picking rows are folded, which tag areas are open, which folders are shut, whether folders show, which columns sort and which way, where the list was scrolled, which operation is showing, and which guide is being read. The link stack is not saved: a page refresh comes back to the same guide with nothing behind it. Every name reads `ov_` then parts joined by underscores.

**One thing to know about the folds.** Which folders are shut is remembered always, but only applied while the folders are on screen. With them hidden the list is every file that survives the filters — otherwise a fold made in one view would quietly subtract from a count in another, which is exactly the confusion it caused once already.

**Method that holds.** One thing at a time, proved before the next. Every new path gets logging that carries the actual numbers behind each decision, so a claim about why can be answered by reading the log rather than guessing. The type check runs clean — no errors and no warnings — before anything is called done.
