# Work journal

Reverse chronological log of finished work on ji (the Jeff intersection project).

## 2026-07-19 — what a document knows about itself

- **A document now records what it is, not just what to call it.** Alongside its name it keeps: the family it belongs to (picture, video, sound, pdf, web page, text, other), its file ending, the exact type the browser reported, its size in bytes, when the file was last changed, its own address in the store, and whether its words have been pulled out yet. Most of these are only knowable at the moment of the drop — the browser hands them over once and never again — so they're captured there and everything else is worked out later from what's kept.
- **Folders stopped pretending to be a file type.** "Folder" and "unknown" were entries in the list of file endings, which was a lie: neither is an ending. A folder is now marked by its family, with no ending and no bytes at all; an unrecognized file simply has no ending (and is skipped on the way in, as before). This needed an erase and re-drop, agreed in advance.
- **One idea instead of two.** The separate "how do we show this" list was the same four words as four of the families, so it's gone — asking a document how to show it now answers with a family, or nothing when a browser can't show it here. That also means adding a video or sound player later needs no new vocabulary.
- **The file knowledge moved onto the document itself.** Deciding a dropped file's kind, reading its bytes, and trimming a redundant ending all used to live with the drop handling; they now sit with the document, which is what they describe. The drop keeps only the browser wrangling — reading entries, walking folders — so the document stays free of any database ties. The two ways a document gets made (a file, a folder) now share one start and one finish, instead of repeating the same four lines.
- **Aimed at what comes next.** I read AnythingLLM's own source to see what it stores per document: the text body drives everything, and the rest — title, address, date, author, description — rides along on every piece and becomes the citation you see in an answer. The fields it fills with "Unknown" unless told otherwise are exactly the ones ji can now supply. The one real gap left is the extracted text, which each document now flags for itself.

## 2026-07-18 — the filter and header stay put while the list scrolls

- **Controls and header pinned.** The tag filter, the search box, and the column header now stay in place; only the list of documents scrolls beneath them. The rows moved into their own scrolling area and the header cells are held at the top.
- **Two table quirks solved.** The header wouldn't stay put at first: this table draws its grid as single shared lines between cells, and in that mode the browser ignores "stay pinned" on the header as a whole — so each header cell is pinned on its own instead. The closing line under the header kept scrolling away too, because a shared line between the header and the first row belongs to both; it's now drawn as its own line that stays with the header. A page-colored gap below that line also stays pinned, and the header text sits a few pixels higher.
- **Search box reacts to hover.** Hovering the search field lights it to the hover shade, matching the other controls. (A hover effect for the scroll bar was tried and taken back out — the browser drops the list's hover the moment the pointer reaches the bar, so it couldn't work cleanly.)

## 2026-07-17 — the details sections remember whether they were open

- **Preferences and data stay the way you leave them.** Inside the details region are two collapsible sections, "preferences" and "data". They opened fresh every reload. Now each remembers whether it was open or closed and comes back that way (open the first time), saved next to the other small settings. The whole region's show/hide was already remembered; this covers the two sections within it.

## 2026-07-17 — a jpeg counts as a jpg, and the tags title sits right

- **The extension drop now knows its aliases.** A "photo.jpg" in a jpeg row shows as "photo" now, not just "photo.jpeg". Rather than compare the ending to the format word, it reuses the same table that decides a dropped file's kind — so any extension that maps to the row's format is trimmed, which also covers htm/html and md/markdown. Folders and unmatched names still show whole.
- **Tags title moved right.** The heading over the tags column now hugs the right, lining up with the tags and buttons that sit at the right of each row.

## 2026-07-17 — filenames read cleaner, headers centered

- **A redundant extension drops off.** When a file's name ends in the same thing as its format ("notes.txt" in a text row), that ending is noise, so the list shows just "notes". Only an exact match is trimmed, and folders (which have no format) are left whole. The full name is still there for filtering and on hover. Making a jpeg count as a jpg is a small follow-up still open.
- **Long names cut off cleanly.** A name is capped at about 40% of the table's width and ends in an ellipsis when it runs long, its full text on hover. The cut-off is done on an inner piece of each row rather than the row cell itself, because cutting off at the cell was unreliable — that's why folder names were spilling while short file names looked fine.
- **Headers centered.** Each column's heading now sits centered over its column.
- **Empty ENTER backs out of adding a tag.** In the new-tag field, pressing RETURN with nothing typed closes the add-a-tag view instead of doing nothing.

## 2026-07-17 — a row only lights when its file can be opened

- **Hover highlight, narrowed.** A row now lights on hover only when its document can actually be shown. Folders and the kinds a browser can't open (documents, spreadsheets, tiff pictures) stay dark, so the highlight promises what the click delivers. It rides the same can-be-shown check that already decides whether the name opens and shows the pointer. The edit-tags and trash buttons still work on every row, showable or not.

## 2026-07-17 — erasing truly empties the file store

- **Erase now clears every stored file, not only the ones still listed.** Before, erase deleted the bytes of each document the app currently knew about — so bytes left behind by an older save scheme, or by a save that failed partway, kept sitting in the browser's large store taking space. The log proved it: an erase reported clearing zero while the store held tens of megabytes. Erase now deletes the whole file-store outright, so nothing survives however or whenever it was written, and the space is given back at once — the store came down from 27 MB to about 31 KB.
- **When another tab blocks it, you're told.** The browser refuses to delete the file-store while another tab has the same app open, and that used to fail silently and look like erase did nothing. Now a plain alert names the app's address and asks you to close your other tabs of it and erase again. The browser gives no way to name each tab, so it points at the shared address.
- **Proven.** A test plants a stray file-entry with no matching document and confirms erase clears it; ten store tests pass and the type check is clean.

## 2026-07-17 — the document rows get quieter and clearer

- **The whole row lights on hover, as a pill.** Hovering a row fills it with the hover shade, its ends rounded into a pill. Moving onto the small action buttons at the right drops that fill — they act on their own, not the row. The highlight is tracked in code rather than the usual hover, because the buttons stand a hair taller than the row and the plain hover kept dropping out over them.
- **Click a name to open it.** A showable document opens by clicking its name — the eye button is gone. The name shows a pointer and lights on hover only when the file can actually be shown; other names and folders stay plain.
- **The bin, drawn and colored.** The trash icon is a drawn bin, not the multicolor emoji (which ignores color), stroked in a new darker, more vivid accent. That shade is derived from the accent — 30% less true luminance and 30% more saturation — and recomputed whenever the accent changes.
- **Adding tags when there are none yet.** When the store holds no tags to pick from, a row's pencil offers an "add tags" button that opens the tag view, the same as the top control. Its click was reaching the background clearer and undoing itself the instant it fired; stopped that.
- **One click on a tag, and done.** Picking a tag in a row's picker now toggles it and closes the picker in a single click.
- **Cleared the row-measuring scaffolding.** The debug flag and the code that logged each row's height are gone; the faint line under each row stays.

## 2026-07-16 — the "autofocus was blocked" warning, gone

- **The cursor lands in the new-tag field without a warning.** Opening that view put the cursor in the field using the browser's own auto-focus mark. But the browser only honors that mark when nothing is focused, and the field opens right after a click that leaves the "add tags" button holding focus — so the browser refused and warned each time. Now the field focuses itself the moment it appears, which works even while the button still holds focus. Same result on screen, no warning.

## 2026-07-16 — dropping a folder keeps its shape

- **A dropped folder now comes in whole.** Before, a folder landing on the drop box was ignored — the drop could only see a flat list of files. It now reads through the door the browser offers for folders, so it can step inside. Each folder becomes a stand-in document named for the folder, every file inside is saved and linked under it, and any folder within is handled the same way, all the way down.
- **The list shows the tree.** Documents are listed folders-first, each contents following its folder, and every row is pushed right 20px for each folder it sits inside — so the nesting reads at a glance. A folder row shows nothing in the format column. Every document the drop makes, folders and files at any depth, wears the tags chosen at drop time.
- **Filtering never orphans a match.** When a search or tag filter keeps a file, its folder chain is kept on screen too, so a match never shows indented under nothing.
- **One small store addition, and it's tested.** A folder link needs a named meaning ("contains"); the store now reuses the one meaning instead of making a fresh copy each time. Two new store tests cover the depth-and-chain walk and the reused meaning; all eight pass, and the type check is clean. The one thing only a browser can confirm — the actual folder drop and the indented rows — Jonathan checked by eye.

## 2026-07-16 — html views as a page, and a file's kind stops guessing wrong

- **HTML opens as a page, safely.** An html document now renders in its own frame, sandboxed with no scripts — so the file's own markup and any scripts can't reach the app; it just shows as a page. Text, markdown, and rich text still show as text.
- **The view kept closing itself, found by the log.** Clicking the eye opened the view and then instantly shut it: the same click bubbled up to the click-anywhere-clears-it handler. The log told the story plainly — "Viewing document" was always followed by "Clicked out." The eye's click now stops there. (Then, on purpose, a click anywhere on an open document closes it, and the close became the shared cross in a black circle.)
- **A file's kind was decided only by its reported type, which lies.** A page from Chrome's "Save page as," and files that come in through the folder-reading path, often carry an empty or wrong type, so a .html never got the html kind and the viewer said "can't show." Now the kind is read from the filename extension first, with the reported type only as a fallback. The drop logs its kind decision, and the viewer logs the kind when it can't show something, so "can't show" is never a mystery again. Documents saved before this fix keep their old wrong kind — erase and re-drop to correct them.

## 2026-07-16 — each row gets view, edit, and trash

- **Three buttons per document row, in one column with its tags.** The last column, which held a single "edit tags" text button, is now quiet borderless icons: an eye to view, a pencil to edit tags, a bin to trash. They share the tags column — tag names on the left, buttons at the right. The eye is dark and dead on types a browser can't show, and simply blank on a folder row.
- **Opening a document.** The eye opens the file right in the content area (a new "view document" mode), showing pictures, pdfs, and text; the type decides how. The knowledge of which types are stored as text and which as wrapped bytes moved to a shared spot so the drop and the viewer read it the same way. This first viewer is basic — fleshing it out is its own next item.
- **Trashing, and folders.** The bin asks first: the three icons give way to two bordered buttons, "erase" and a round x (the shared cross). Erasing a folder takes everything inside it — a new delete-a-whole-branch step in the store that also removes every tag link and every relationship the deleted documents touched. Two store tests cover it.
- **Holding the row still, twice.** The bordered confirm buttons stand a touch taller than the icons; twice the row grew when they appeared, and twice it was a height leaking through — first the buttons stretching their cell, then, after the column merge, a flex child refusing to stay shorter than its content. Both fixed by pinning the button strip's height and telling it not to grow. Then the rows were trimmed a few dots shorter by his eye.

## 2026-07-16 — document bytes leave the tiny store, and the database files tidy up

- **A folder of real files stopped overflowing storage.** The bytes of each document were kept in browser storage, which holds only about five megabytes for the whole site — a folder of real PDFs blew past it and the save threw. The bytes now live in the browser's large store (IndexedDB), which holds far more; the small record lists stay in browser storage. Saving a document became a wait-for-it step, and the few places that save (the drop, the erase button) now wait for it. Type check clean, and the database tests pass, including two new ones for the deep-folder walk and the reused link-meaning.
- **A second overflow, from leftover copies.** After the move, a folder drop still overflowed — browser storage was still full of the old byte copies from before the move, so even the tiny record list couldn't fit. I added a one-time sweep to clear them, then Jonathan judged it unneeded (the erase button clears old data in one click) and I took it back out.
- **The database folder tidied.** The little "store changed" tick, the save-tracking helper, and the record shapes each moved to where they belong (the tick and shapes into shared spots, the save-tracker with the other plain types); the database test moved into a tests folder. One attempt to fold the tick into the registry was turned back — it would recreate the exact circular reference the tick was split out to avoid, and would have crashed the tests. The byte-store helper, briefly its own file, was folded back into the local store since nothing else used it.
- **Standing question, still open.** For private storage Jonathan does not want the app to copy the file in at all — the file already sits on disk. A reference could read it, but only with the user's approval each session, and remembering the reference across reloads needs the browser's large store anyway. Left undecided; the copy-into-IndexedDB path stands for now.

## 2026-07-16 — the "add documents" header becomes a real button

- **The middle header is now a button, not just text on the rule.** It stands at the shared control height with a solid black edge, sits white at rest, lights to the hover shade, and rides a dot lower so its text lines up with the plain headings beside it.
- **Two rule bugs, chased in the wrong order first.** The line vanished, then a faint ghost line appeared. My first guesses (row height, then the browser's default line) were both wrong. The line vanished because a reset was wiping out the line set right before it. The faint ghost was the black rule showing through the header labels — the labels were partly see-through, so their masking cover let the rule bleed through. The cover was made solid and only the label text fades now.
- **Lesson, again:** every wrong guess here was a claim about cause I couldn't see. The real causes only showed once I read the exact lines and reasoned from what the page must be doing — not from the first plausible story.

## 2026-07-16 — the details controls fall in line, and text rides right

- **Three controls in the data area finally agree.** The color swatch was drawn from a different size than the rest — a bigger token meant for square buttons — so it stood taller than the erase button and the storage switcher beside it. It now uses the shared control height. The erase button and the switcher also weren't counting their border inside, so they sat a hair tall; both now do, along with the yes/no buttons that appear when you confirm an erase. All four match the rest of the app.
- **All control text was sitting low, and now doesn't.** Jonathan saw every control's text riding about two dots below where it should within its border — a quirk of the label font. One shared change fixed it everywhere at once: the space above the text was trimmed and the same amount given back below, so the text rides up without changing any control's height. Settled at one dot of space on top, three below, by his eye.

## 2026-07-16 — every control the same height

- **Eight controls, one height at last.** Two of them — the search box and the new-tag field — already stood right, because they counted their own border inside the height. The other six didn't: the all/any toggle, the tag pill, and the help button each stood a border-width taller, and the "add a tag", "done", and build-opener buttons had no set height at all, taking whatever their text and padding worked out to. All six now count the border inside, the way the two inputs already did — one small change each, nothing else touched, type check clean.
- **The one thing a browser still has to say.** The two plain buttons used to hold their text upright by padding alone; now a fixed height governs them. The help button has worked this way with the same numbers all along, so I expect them fine — but only a browser can prove text stays centered, and I can't open one.

## 2026-07-15 — the shared rules stop living inside di

- **The session-behavior helpers moved up to the repo root.** Eleven of them (the reply checks, the always-file injection, the pre-edit snapshot, the command guard, the type check) sat inside di's folder even though they fire in every project. They now live at the root and are wired from there — verified live after a restart.
- **One of them had been checking the wrong project all along.** The end-of-turn type check was pinned to di, so a whole session of ji work would never have caught a ji error. It now checks whichever project the file you edited belongs to; a file with nothing to check is ignored.
- **The word list split in two.** di's own vocabulary (smart objects, unifaces, placement, measurements) stays with di; the ~19 rules that apply to any prose moved to a shared list beside the shared rules file. Both are named the same and sit at the same spot under their own root — the pattern the always-files already use.
- **Nothing names di any more.** The on-screen word-swapper and the rule-injector both read the shared list plus the list of whichever project you're working in, found by name. So the swapper could finally move to the root too, and a new project can add its own list tomorrow with no code change.
- **The word-checker followed, and its notebook came with it.** The last helper still naming di now finds both lists by name like the others, and moved to the root. The shared notebook the reply-checkers scribble in travelled with it, and now keeps only its newest 500 lines instead of growing forever.
- **Banned words can now keep their endings.** A swap used to force one spelling: "copies" became "move". A new mark on a row says its two sides are the same kind of word, so the ending carries — "copies" becomes "moves", "absorbing" becomes "placing", "liars" becomes "bugs". Seven rows are marked. The mark stays off where the two sides differ in kind, because carrying an ending there invents words: "shipped" would become "doned", "panels" would become "detailses".
- **The mark nearly killed every swap silently.** An empty mark column made the reader collapse two columns into one, so every row was skipped and nothing swapped at all. A tab reads as ordinary space; the fix was a separator that can't be mistaken for one. Caught only because the check ran the *unmarked* rows too — testing just the new feature would have shown a clean pass on an empty list.
- **Deleted the map that kept rotting.** di's wordsmithing page was a pointers-only map to four other files. It had gone stale in four ways at once — it described a check-before-send that was deleted, named di's own hooks folder as the enforcer after everything moved out of it, called the word list one home when it is now two, and opened by claiming the always-file calls it when nothing has called it for a while. A map with no truth of its own, that nobody reads, and that needs a rewrite every time anything moves, costs more than it returns. Gone, and unlinked from di's guide index.
- **The tail of the move turned out to be shorter than written.** Two of the three leftover jobs were already done: all three reply checkers write to the moved notebook, and the dead helpers are gone (two deleted, the test moved beside what it tests, di left with only its own two). The written plan had claimed otherwise; the files said different.
- **A rule for me.** Twice I reformatted Jonathan's indentation to satisfy a linter and mangled correct lines doing it. New standing rule: tabs in code, four spaces in notes; never reformat indentation nobody asked me to touch; a linter that disagrees loses. The real fix was already sitting in di — a settings file telling the checker four spaces is correct. It now lives at the root, so it covers every project, and di's copy is gone.

## 2026-07-14 — more file types a drop keeps

- **Seven more formats.** A drop now also saves markdown, html, rich text, and svg (kept as their plain text), plus webp images and Word doc / docx files (kept as wrapped bytes). The specific text types are matched before the plain-text catch-all so markdown and html aren't flattened to plain text. Tiff was left out — a browser can't show one, so there'd be no preview later; Word files store the same way but we accepted them anyway. The "accepted types" hint under the drop box lists them all straight from the type list, so it stays current on its own.

## 2026-07-14 — cutting the di leftovers

- **Trimmed the saved settings.** The settings list came over whole from di, carrying dozens of keys ji never touches (edge thickness, grid opacity, view mode, orientation, help sidebar, and more). Cut every key with no reader — the list is down to the seven ji actually uses (the details toggle, the current add-mode, the active store, the more/less choice, and the accent and text colors). Also renamed the saved-settings name-tag from "di:" to "ji:", so old di-era settings are ignored and everything starts fresh.
- **Cut the unused colors.** ji copied di's whole color engine — slider thumb/track/tick, focus halo, selection, and an edge color that fed 3D-part tints. Nothing on ji's screen reads any of those. Removed them and the machinery that derived and published them; only the accent, its lightened background, the hover shade, and the text color remain, and the color publisher now sets just the four page-variables something reads.

## 2026-07-14 — a diagnostic log that lives in a file

- **One log address for every project.** The hub's little log server used to answer a separate address per topic (only di's, hard-wired to one file). It now answers a single address and reads the file name from the request — send `where=intersection` and it writes `logs/intersection.log`. The name is checked so it can't point outside the logs folder. di's two log senders moved to the new address; the old one is gone.
- **ji writes to its own log now.** A tiny helper sends each line to that address (overwrites once at the start of a session, appends the rest), so a whole session's reasoning ends up in one file you can read afterward instead of only in the browser console.
- **Every log line ji already prints now goes to the file.** Swapped all the console prints over to the helper (the two failure warnings left as-is). Confirmed end-to-end: lines land in `logs/intersection.log`, the first one truncates and the rest append, and a bad file name is refused.

## 2026-07-14 — the table headers become the controls

- **Header row on the rule.** Above the documents table sits a row of column labels — format, document name, tags, edit tags — each a pill floating on the rule (the same look as the data panel's more/less), left-aligned to its column. Format and the last one are inert; the middle two light up on hover, where their text swaps to "add a document" / "add a tag".
- **Headers open the add flows.** Clicking "document name" shows the drop box, clicking "tags" shows the new-tag field. So I pulled the old "Add a new document / tag" control out of the top bar entirely — the headers are the entry point now, and the top bar is just the hamburger and help.
- **A click on the empty background closes an add flow** back to the list, leaving the picked filters alone. The new-tag view also has its own "done".
- **Empty store leads with the drop box.** With no documents, the view opens straight to the drop box and hides the filter, the search box, and the headers — nothing to filter or list yet.
- **Tags are one joined control now.** The tag chips became a single segmented pill (still multi-select — several can be lit), used both in the filter and in a row's edit-tags picker. The all/any toggle moved inside it and hides when there are no tags, and an "add a tag" button sits just to its right.
- **Search box.** Switched it to the browser's own search field so it draws its own clear ×; gave it a set width; and made both text fields share the standard control height.
- **Tidied the folders.** Renamed the tags folder to actions, moved the drop box in beside the tag pieces, moved the documents view into main, and deleted the emptied documents folder.

## 2026-07-13 — more file types, and a hint of what's accepted

- **More types save.** A drop now keeps text, jpeg, png, gif, bmp, and pdf — text as its plain contents, the rest as a data-URL (their bytes base64-wrapped, ready to show). Anything else is skipped with a note.
- **Accepted-types hint.** Under "drop documents here" sits a smaller centered line listing the types a drop will keep, read straight from the type list so it can never go stale.
- **Browse shows the type.** The browse view is now a two-column table — each document's type beside its name.
- **Erase names the store.** The confirm reads "erase all your local data?" (or firebase), the buttons pinned left and the question centered in the space beside them.

## 2026-07-13 — a live filter, one source of truth

- **Search state in one place.** A small `Search` module now holds the picked tags, the filter text, and the all/any mode, plus one function that narrows the documents. Every view reads it, so nothing keeps its own copy.
- **All or any.** A little segmented control at the far left of the tag row switches whether a document must carry every picked tag or just one of them.
- **Filter as you type.** A "filter by name" box sits under the tags; typing narrows the list at once, alongside the tag filter.

## 2026-07-13 — the always-on layout

- **One screen, no view-switching.** Rebuilt the content area to the intersection spec: a full-width accent controls row at the top (hamburger left, "Add a new document / tag" centered, help button right), then the tag chips, a rule, and the documents table — all always shown. Clicking "add new document" swaps the table for the drop box; clicking it again returns.
- **Chips filter, all-must-match.** The tag chips at the top double as a filter — picking chips keeps only documents that carry **every** picked tag.
- **Build + credit moved to the frame.** The "Build N" opener and "built by" credit now pin to the frame's bottom-left at the frontmost layer; the details region lost its empty top banner.
- **Files reorganized.** The old `operations/` folder became `documents/`; the tag pieces moved to a `tags/` folder; Add → Add_Document, Browse → Documents. Activity and the Enumerations file are gone (the operation enum lives in Operations now).
- **A pile of hand-tweaks.** Controls row sized to its controls with no vertical gaps; documents content gets an even `--gap` margin; the drop box a `--gap-fat` inset on three sides; the tag chips centered; the storage switcher moved to the far right of its row; the divider rule made visible again after the flex-column change hid it.

## 2026-07-13 — erase, a remembered toggle, and data-panel polish

- **Erase all.** A far-left "erase" button on the switcher row wipes the active store after an inline "erase all your data? yes / no"; while it asks, the erase button and the switcher both hide. Only the active store is touched — the wipe clears every record and every blob and saves it empty. A driven test proves it stays empty after a reload.
- **Remembered more / less.** Whether the storage switcher is shown is now a saved setting, so the choice survives a reload.
- **Dropped the unsaved readout.** It always read zero — the local store saves each change the instant it happens — so it was pulled until it means something for a cloud store.
- **Layout tidy.** The switcher row got a fixed height so clicking erase no longer squashes it, the erase button was matched to the switcher's height, and the rule and the row were nudged a few pixels tighter without changing the space below.

## 2026-07-13 — the store meets the screen

- **Drop to save.** Dropping files on the add view now saves each text file into the active store — its name, its kind, its contents. Images and pdfs are skipped with a note until we decide how to hold binary bytes.
- **Browse lists names.** The browse view shows every saved file's name, live: a drop or a delete updates it at once, with a quiet "no documents yet" when empty. The browse segment shows it now; the arrival text still shows when nothing is picked.
- **A data readout.** A "data" panel in the details region reports the document, tag, and unsaved counts, plus a storage switcher tucked behind a small "more / less" label that floats on a broken rule. Only the local store is built, so the cloud segment sits dimmed until firestore.
- **One live tick.** All three stay current off a single "the store changed" signal the store nudges on every save and every switch.
- **A freeze, caught.** The browse list first locked the page — it rebuilt a brand-new list inside a repeating step, which the framework saw as "changed" and ran again, forever. Fixed by making the names and the counts derived values — pure formulas that can't retrigger themselves.

## 2026-07-13 — document store built

- **Built the database repository** from [[db spec]] and [[db proposal]]. It's the ws plugin store ported whole — a registry that swaps storages, a shared base carrying the save / load / add / delete, thin storage subclasses — but the data is ji's own: five records (documents, tags, tagging, relationships, predicates) plus the document bytes kept outside the store.
- **Records live in browser storage,** each storage under its own name so two never collide. The bytes go through a read-by-id / write-by-id seam; the local storage parks them in browser storage for now (real files on disk come later).
- **Reads run off in-memory lookups** rebuilt on load — never saved. List documents walks the parent graph from each root (a node can have many parents; the walk won't loop). Filter by tag is one lookup. An inbox lists the untagged. Delete is a cascade: drop the links and the bytes, no orphans left.
- **Only the local storage is built;** the cloud one (firestore + Google's file store) is a drop-in for later, no changes to the base. Proven with a driven test — save a document and list it back after a reload, tag and filter, ordered children under a parent, delete leaves nothing behind. Type-check clean.
- **Killed the earlier flat one-record store** — it was the wrong shape (a plugin engine, not a single localStorage call).

## 2026-07-12 — design tokens complete + ws store scouted

- **Everything is a token now.** Extended the one-source system past sizes to cover every remaining design value: paddings and the header margin, the table column widths, font weight, letter-spacing, the two ink blacks/whites/gray, the popup shadow, and the dimming opacities. Each lives once in Constants (or Colors), is mirrored to a CSS variable at startup, and read with `var(...)`. No size, color, font, weight, spacing, border, radius, inset, shadow, or opacity is hardcoded in a component anymore — only structural `100%` fills and `0` resets remain.
- **One knob for bold.** Font weight is a single base number with two derived weights (banner, title); the whole interface's weight moves with it.
- **Ink colors joined the color pattern.** `black` (`#1a1a1a`, never `#000`), `white`, and `gray` live in Colors and push through Configuration, same as the theme tokens.
- **Fonts read bolder.** Loaded the medium Montserrat weight and preload it, so the heavier text is a real face, not browser-faked. (A wider bold range would want the variable font, which isn't installed.)
- **Small UI.** The build-notes close button fills with the hover color on pointer-over.
- **Scouted ws's document store** and wrote `notes/work/db spec.md` — what the ws persistence engine does (registry, base CRUD, the kept storages, the localStorage primitive), minus airtable/bubble/hierarchy. Finding: don't port the framework (it drags in Firebase + a large engine); ji needs only the local pattern — one localStorage key holding a JSON list of records.

## 2026-07-11 — design tokens: every size derived from one base number

- **One source for all sizes.** Every hardcoded number in the components — corner radii, heights, gaps, insets, font sizes, border widths, icon sizes — now comes from a single Constants file, where almost everything is a fraction or multiple of one base "comfortable tap" size (35). Change that one number and the whole interface rescales together.
- **The bridge.** Plain stylesheets can't read the TypeScript Constants, so a startup step mirrors the values onto the page as CSS variables (stacking layers, then all the layout sizes). A small global stylesheet (`main.css`) holds the stacking-layer classes; every component reads the rest with `var(...)`. Colors already worked this way; layers, metrics, fonts, insets, thicknesses, and icon sizes now do too.
- **Swept in waves.** Went value-family by value-family (radii, heights, gaps, fonts, insets, borders, icon sizes), each time finding every occurrence, routing it through the bridge, and confirming none were left. A few values shifted a fraction of a pixel where a tidy ratio replaced a round number — intended.
- **Icons on the size scale.** The hamburger and close-cross svgs now take their drawing and render sizes from the size constants; the hamburger box was made to match its drawing, so the old "let it spill over" setting could go.
- **Small UI.** The build-notes close button now fills with the hover color on pointer-over.

## 2026-07-11 — segmented control, arrival default, font twitch

- **Renames + reshuffle.** The layout frame is now Intersection (was Main), the content region is Activity (was Content), and the details-toggle icon is Controls (was Hamburger). The operation names moved into their own file under common as a small enum (browse / add / search, stored as one-letter codes).
- **Segmented control.** The old "add" pill became one segmented control driven off a single list of the operations. It then moved into the Controls cluster, so the hamburger and the segments sit together as one fixed group at the top-left, visible whether details are open or closed.
- **Arrival default + toggle-off.** Clicking the segment that's already on clears the selection to nothing, which drops the content to the arrival landing. The app now opens with nothing selected (arrival), and a chosen operation still survives a reload.
- **Add view trim.** Removed the back arrow from the add view (and its now-dead click wiring); getting back to browse is the browse segment. The drop rectangle keeps top room so it clears the control cluster.
- **Font twitch fixed.** On refresh the segment pill twitched a few pixels because the web font swapped in after the first paint. Fixed by preloading the two Montserrat weights the instant the bundle runs, so the font is ready before first paint — no late swap, no reflow. The preload paths come from importing the same font files the CSS uses, so nothing hardcoded goes stale.

## 2026-07-10 — add-document flow (skeleton) and picker polish

- **Add flow, Phase 1.** New content-mode store (browse / add / search); an "add" pill next to the hamburger switches to add mode; the content area swaps to a new Add view with a large drop-here rectangle that logs the dropped files. Persistence, tags, and the document store are still to come.
- **Color picker rebuilt.** The accent picker no longer leans on the native color swatch — the visible circle is our own element (background `--accent`, `--hover` on hover) with the real color input laid invisibly on top to catch the click. That fixed the hover the native swatch kept ignoring.
- **Polish.** The hamburger paths gained a permanent black 0.5px outline (hover changes only the fill). The add pill got a black border and `--hover` fill. The preferences banner fills `--hover` on hover.

## 2026-07-10 — auto text color

- **Text adapts to the theme.** Text flips white/black by background luminance so it stays readable at any accent. Two derived colors, computed in Colors when the accent changes: the content text from `--bg`, the details-region text from the accent (`--text-on-accent`). Wired the "Intersection" text to `--text` and the details banner to `--text-on-accent`.
- **Hamburger recolor.** On the content (details hidden) it's fixed black, turning the accent color on hover. On the accent (details shown) it flips with the accent and hovers to its opposite (`--text-on-accent-hover`). The build-notes popup is left alone — a fixed white card.

## 2026-07-09 — author credit

- **Author credit.** Added a small "author: jonathan sand" link in the content region, stacked under the "Build N" opener in the bottom-left corner — 4px gap, left-aligned, font two-thirds the opener's size. It opens jonathansand.me in a new tab and turns the accent color on hover.

## 2026-07-07 — content, hamburger, preferences

- **Content component.** Pulled the centered "Intersection" text and the "Build N" opener into their own Content component; the opener moved to Content's bottom-left corner, white background.
- **Popup takes over.** While the build-notes popup is open, the details and content regions hide (only the popup shows over the frame). Its open/closed flag lifted up to the frame so it can hide them.
- **di's hamburger.** The details toggle now draws di's exact hamburger icon (from the ported path utility) as a reusable snippet, shown at the same top-left spot whether details is open or closed; transparent background, white on hover, and an overflow fix so its left edge isn't clipped.
- **Show-details persists.** The show/hide state is now a saved preference (through the ported Preferences), so it survives a reload.

## 2026-07-07 — details toggle

- **Details region collapses.** A "details" banner atop the region hides it on click, so the content fills the full width. A fixed button in the upper-left corner (colored to match) brings it back.

## 2026-07-07 — rename

- **Renamed `in` → `ji`** across the folder, hub references, workspace list, the project's own config/package/guide, and the slash command. Re-linked the workspace and confirmed a clean type-check. Netlify base directory and the git commit left for Jonathan.

## 2026-07-06 — build notes, the cross, and theming

- **Two-line title.** Split the centered "Intersection / Hey, bro!" onto two lines.
- **Build notes popup, ported from di.** A "Build N" opener button (pill border, hover fills light gray) opens a modal listing build history, paged ten at a time with up/down arrows and a close button. The build data comes straight from a markdown table read at runtime, so editing it refreshes live. Applied the same direct-read change back to di.
- **The close cross.** Ported di's full SVG-path utility (plus its geometry and prototype-extension files) and used it to draw di's real X in the close button, inside a circular border.
- **di's color system.** Ported di's Colors plus its preferences and canvas-stale helpers, added the color2k package, and lifted just the CSS-variable setter out of di's Configuration (leaving its engine behind). Wired it so the color stores push `--bg` / `--accent` / `--hover` onto the page — the theme variables di components expect.
- **di's layout skeleton.** Rebuilt Main around di's frame: a fixed full-window frame with a details region and a content region (di's "graph", renamed), di's spacing numbers inlined.
- **Preferences banner + accent picker.** A collapsible "preferences" banner in the details region holds di's accent color picker, wired to the ported Colors — choosing an accent recolors the theme live. Fixed a "missing bottoms" report by giving the details region the accent color so the banner and body stand out against it.

## 2026-07-05 — into the hub, onto the web

- **Added the project to the hub.** New entry in the hub's ports list (port 5184), a button + keyboard shortcut in the hub page, and a dev-server line in the launcher script. Fixed a leftover port clash — the project's dev config still pointed at lv's port — and added it to the repo's workspace list.
- **Wired the public site.** Pointed intersection.lol (via Dynadot DNS) at the Netlify site, set Netlify's base directory and build, and worked through a stuck Let's Encrypt certificate by removing and re-adding the domain.
