---
kind: explain
title: "Context"
description: ""
tags: [journal]
date: 2026-08-10
---
# Current context

**The app as it stands.** A controls row (hamburger, build number), then two boxes: the details column on the left with the accent color picker, and the content box beside it. The content box does one of two things — looking through the guides, or reading one. Looking through means five filters (which purposes show, one project, one kind, any number of tags, and words looked for in titles and descriptions), a count, and the list: every folder and file, folders leading their contents, each folder opening and shutting and remembering which it was. With the folders hidden the list flattens to every file, sortable by any run of columns.

**The picking rows fold.** Each row sits under a bar carrying its own word; pressing that word folds the row away and the word then says what is picked, as `purpose ➜ designs`. A bar is two pixels tall, so a clear strip the height of an ordinary control lies along it and takes the cursor for the whole length. The tags row is six area pills rather than twenty-four words — see the journal entry for 2026-08-04. All of it is remembered between visits.

**The words are short on purpose.** Five kinds — specify, step, wire, explain, refer — and twenty-four tags, none of them a gerund. Renaming one means changing the app's list, the six areas, every guide that wears it, and the three notes that spell the list out: `add a guide`, `okf`, and `tags hierarchy`. A remembered tag or kind no longer on either list is let go at launch, since otherwise it narrows the list to nothing with nothing left on screen to undo it.

**Where the guides come from.** Overview reaches outside its own folder on purpose. The build learns only the addresses of every markdown file under each collection's guides folder; at launch each is read once, its five labels kept, and its text let go. Nothing about a guide's contents is held or saved. Index files are left out entirely — the folders do that job now. Designs are swept the same way, from a designs folder beside each guides folder. Last count: 142 files across mono, di, ws, ji and ov, all fully labeled.

**One top folder on disk, five on screen.** The four project folders hang under the shared one the way they sit on disk, so climbing the folders above a guide can leave one project and reach another — which is what following a link between collections needs. The list, though, starts at all five, so shutting the shared folder never takes the projects with it.

**Links inside a guide are live.** A heading moves down the page, another guide opens here, the web opens a new tab, and anything else says plainly it isn't part of the picture. While off the list the two triangles walk the stack of guides reached by links, and the missing forward triangle is the sign of being off it. The list's own run is untouched, and the count under the filters never moves because a link was followed.

**Only text that says outright it is a web address becomes a link.** The reader's guessing is off, because it read the bare words "CLAUDE.md" as a site in Moldova, whose ending is the same two letters markdown files use.

**Files can be moved, and handed to Obsidian.** With the folders on screen a file can be dragged onto any folder, including one in another collection; the file moves on disk before anything on screen changes. Command-clicking a file in the list, or the edit button while reading, opens that guide in Obsidian instead — the repo is itself a vault, so a guide's place in the repo is also its place in the vault.

**A guide is changed where it is read.** There is no reading mode any more: every file opens ready to change. Each outermost piece of a drawn guide carries the lines of the file it came from, and a click opens that piece in a box holding the file's own words; leaving the box writes just those lines back. The five labels have their own form, with kind and tags picked from the app's own closed lists. Writing goes through the dispatcher — the one the log lines go to — which refuses anything that isn't a guide, and refuses again if the file no longer reads as the app last saw it.

**There is a test runner now.** `yarn test:run` for one pass, `yarn test` to watch; anything ending in `.test.ts` under the source folder is picked up. 123 tests as of this writing. New work is stubbed and tested before the code, and a step isn't done until both the tests and the type check are clean.

**One search serves both screens.** The words typed in the list and the words looked for inside a file are the same value, and which place is lit is held beside it. Every keystroke lights the first place those words turn up and moves there; the words are taken exactly as typed, spaces and all. Both survive the walk between screens and a reload — and typing while reading also narrows the list behind it.

**What's saved between visits.** The accent color, which details sections are open, whether details shows at all, all five filters, which picking rows are folded, which tag areas are open, which folders are shut, whether folders show, which columns sort and which way, where the list was scrolled, which operation is showing, which guide is being read, whether a file's title is folded, and which place the search has lit. The link stack is not saved: a page refresh comes back to the same guide with nothing behind it. Every name reads `ov_` then parts joined by underscores.

**One thing to know about the folds.** Which folders are shut is remembered always, but only applied while the folders are on screen. With them hidden the list is every file that survives the filters — otherwise a fold made in one view would quietly subtract from a count in another, which is exactly the confusion it caused once already.

**Method that holds.** One thing at a time, proved before the next. Every new path gets logging that carries the actual numbers behind each decision, so a claim about why can be answered by reading the log rather than guessing. The type check runs clean — no errors and no warnings — before anything is called done.
