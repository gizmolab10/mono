# Handoff

My resume point for overview: the one thing to do next, and the context you can't read off the code. Everything still owed is in [code debt](code%20debt.md). What's finished is in the [work journal](work%20journal.md).

## Next — a search inside the guide being read

Named in code debt, not yet proposed: a search row under the reading view's top row, so a guide can be looked through while it is open.

Add a new row at the top, below the current top row, containing a search input field (with an 'x' for clearing it). when the field is not empty and the return key is typed, highlight the first match

## Brevity

The rule for following a link was written twice — once by me, once by Jonathan. His is a third the length and says the same thing. The difference applies to everything written here.

| Mine | His |
| --- | --- |
| Restated what a guide knows and how a collection is shaped before the first step | Named it in one clause — each guide knows its ancestry — and moved on |
| Spelled out the walk: drop a folder, ignore this one, add the rest | Said ascend the ancestry, and left the rest to the reader who knows what that means |
| Gave each step its reason inside the step | Gave the steps bare, reasons only where a reader would stop |
| Added a paragraph on index files after the list | Made it step 1 |

**The rule that falls out of it.** Say the thing once, in the place it belongs, and trust that the reader has read the rest of the file. Explaining ground already covered is not thoroughness — it buries the one new sentence in words the reader already owns.

## Context

**The app as it stands.** A controls row (hamburger, build number), then two boxes: the details column on the left with the accent color picker, and the content box beside it. The content box does one of two things — looking through the guides, or reading one. Looking through means four filters (one project, one kind, any number of tags, and words looked for in titles and descriptions), a count, and the list: every folder and file, folders leading their contents, each folder opening and shutting and remembering which it was. With the folders hidden the list flattens to every file, sortable by any run of columns.

**Where the guides come from.** Overview reaches outside its own folder on purpose. The build learns only the addresses of every markdown file under each collection's guides folder; at launch each is read once, its five labels kept, and its text let go. Nothing about a guide's contents is held or saved. Index files are left out entirely — the folders do that job now. Last count: 135 files across mono, di, ws, ji and ov, all fully labeled.

**One top folder.** The four project folders hang under the shared one, the way they sit on disk, so climbing the folders above a guide can leave one project and reach another — which is what following a link between collections needs.

**Links inside a guide are live.** A heading moves down the page, another guide opens here, the web opens a new tab, and anything else says plainly it isn't part of the picture. While off the list the two triangles walk the stack of guides reached by links, and the missing forward triangle is the sign of being off it. The list's own run is untouched, and the count under the filters never moves because a link was followed.

**What's saved between visits.** The accent color, which details sections are open, whether details shows at all, all four filters, which folders are shut, whether folders show, which columns sort and which way, where the list was scrolled, which operation is showing, and which guide is being read. The link stack is not saved: a page refresh comes back to the same guide with nothing behind it. Every name reads `ov_` then parts joined by underscores.

**One thing to know about the folds.** Which folders are shut is remembered always, but only applied while the folders are on screen. With them hidden the list is every file that survives the filters — otherwise a fold made in one view would quietly subtract from a count in another, which is exactly the confusion it caused once already.

**Method that holds.** One thing at a time, proved before the next. Every new path gets logging that carries the actual numbers behind each decision, so a claim about why can be answered by reading the log rather than guessing. The type check runs clean — no errors and no warnings — before anything is called done.
