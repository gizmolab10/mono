# Handoff

My resume point for overview: the one thing to do next, and the context you can't read off the code. Everything still owed is in [code debt](code%20debt.md). What's finished is in the [work journal](work%20journal.md).

## Loose end — two buttons now follow the filters, not the screen

The count under the filters was changed to say how many guides the filters leave, counted before the folds. Two buttons key off that same number, so both moved with it: the show/hide folders button hides when it reads zero, and the unsorted button when it reads one or fewer.

Worth a look on screen: with a folder shut, the list can show fewer files than the count says, and those two buttons now answer to the count rather than to what is visible.

## Next — say why each row matched, and carry the search into the guide

In browse, search matches agains titles OR descriptions. Mark this in each listed guide. Clicking the words-mark opens that guide with the search already filled in, first place highlighted.

TBD: when to clear the search.

### Settle first

**App keeps no content** — read once at launch, labels kept, the rest let go: 956,884 characters passed through on the last run, none of it stayed.

Searching inside the guides needs ws's word finder ported. It builds a letter-by-letter map as the files are read, so a search walks one letter at a time to the guides holding that word rather than looking through any text. What is held is the map, not the guides.

Source: `ws/src/lib/ts/types/Search_Node.ts` and `ws/src/lib/ts/managers/Search.ts`.

### Success

1. A guide matched only by its words is included, marked .words.
2. A guide matched only by its name is marked .name.
3. Clicking looks at the mark. For .words the view opens it with (a) the search filled in and (b) the first search match highlighted.
4. The count shown matches the number of marked rows.

## Context

**The app as it stands.** A controls row (hamburger, build number), then two boxes: the details column on the left with the accent color picker, and the content box beside it. The content box does one of two things — looking through the guides, or reading one. Looking through means four filters (one project, one kind, any number of tags, and words looked for in titles and descriptions), a count, and the list: every folder and file, folders leading their contents, each folder opening and shutting and remembering which it was. With the folders hidden the list flattens to every file, sortable by any run of columns.

**Where the guides come from.** Overview reaches outside its own folder on purpose. The build learns only the addresses of every markdown file under each collection's guides folder; at launch each is read once, its five labels kept, and its text let go. Nothing about a guide's contents is held or saved. Index files are left out entirely — the folders do that job now. Last count: 135 files across mono, di, ws, ji and ov, all fully labeled.

**One top folder.** The four project folders hang under the shared one, the way they sit on disk, so climbing the folders above a guide can leave one project and reach another — which is what following a link between collections needs.

**Links inside a guide are live.** A heading moves down the page, another guide opens here, the web opens a new tab, and anything else says plainly it isn't part of the picture. While off the list the two triangles walk the stack of guides reached by links, and the missing forward triangle is the sign of being off it. The list's own run is untouched, and the count under the filters never moves because a link was followed.

**Only text that says outright it is a web address becomes a link.** The reader's guessing is off, because it read the bare words "CLAUDE.md" as a site in Moldova, whose ending is the same two letters markdown files use.

**A search row sits under the reading view's top row.** Every keystroke lights the first place those words turn up and moves there; the words are taken exactly as typed, spaces and all.

**What's saved between visits.** The accent color, which details sections are open, whether details shows at all, all four filters, which folders are shut, whether folders show, which columns sort and which way, where the list was scrolled, which operation is showing, and which guide is being read. The link stack is not saved: a page refresh comes back to the same guide with nothing behind it. Every name reads `ov_` then parts joined by underscores.

**One thing to know about the folds.** Which folders are shut is remembered always, but only applied while the folders are on screen. With them hidden the list is every file that survives the filters — otherwise a fold made in one view would quietly subtract from a count in another, which is exactly the confusion it caused once already.

**Method that holds.** One thing at a time, proved before the next. Every new path gets logging that carries the actual numbers behind each decision, so a claim about why can be answered by reading the log rather than guessing. The type check runs clean — no errors and no warnings — before anything is called done.
