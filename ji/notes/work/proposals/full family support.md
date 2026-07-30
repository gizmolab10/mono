# Full family support

Everything ji now decides about a file the moment it arrives, what changed to get here, and what's still owed. Written after the session that added spreadsheets and books.

## The seven families

video, sound, image, text, spreadsheet, book — and folder, which is structure rather than content and never shows in the family filter.

A pdf and a web page used to be families of their own. They aren't any more: both are words, so both are text. The viewer still draws each its own way, but it reads that from the file's ending, not from its family. One fewer thing to keep in step.

## The five answers, per ending

Every ending we accept has five things said about it. Each lives in its own list, so any one of them can be read straight off:

1. **Which family** — mostly from the browser's reported type, but a table or a book is told by its ending first (a table saved as plain text reports itself as text, and would otherwise land in text). Pictures, clips and sound also fall back to their ending, since a file dropped through the folder door often reports no type at all.
2. **Can it be shown here** — anything on the can't-be-shown list is a no; so is a folder, which has no ending. Everything else a browser draws for us.
3. **How ready its words are** — already plain words, a quick pull (strip the markup, read the document), or the heavy one (recognize a picture's writing, transcribe a clip's speech). Those three split every ending three ways, each ending in exactly one.
4. **Stored as words or as raw bytes** — the words kinds are saved as their own text; everything else hands its bytes over untouched, so a two-gigabyte movie costs nothing to store.
5. **Does the model need it converted first** — this one cuts across the other three rather than sitting beside them. It overlaps the quick kinds (svg, rtf, doc, epub) and the heavy ones, and touches the already-plain kinds not at all.

## What the AI accepts

Its own list is short: plain words, web pages, pdf, docx, three picture kinds, and mp3, wav, mp4, mpeg, ogg, oga, m4a, webm. Everything else we take has to be turned into something readable first.

Two of those sit oddly and have their own list: **docx and mpg** — a browser won't draw either, but the model reads both as they stand. Worth dropping, never openable.

One judgment call, written down so it isn't re-litigated: **csv is deliberately not on the needs-converting list.** A table saved as plain text is already words, and ji stores it as its own words and hands words over, not a file — so its ending never matters. If that turns out wrong, one line fixes it.

## What changed this session

- **Two new families**, with the endings named: spreadsheet (csv, numbers, qb) and book (epub, kfx, azw3, azw4).
- **Pdf and web page folded into text**, and the viewer told from the ending instead.
- **Two refusals lifted.** A dropped file used to be thrown away entirely when a browser couldn't show it — which quietly kept out Word files and the unplayable clips too. And the drop box hid those endings from its family words. Both gone: such files are saved and listed, their rows simply don't open, and the stepper skips them.
- **Three lists written down** that used to be implicit: the pictures, the can't-be-shown kinds, and the two the model reads unconverted. The pictures list was forced by the merge — a picture with no reported type had been recognized by how the viewer would draw it, and that reasoning no longer existed.
- **Numbers files taken in** — a spreadsheet, never showable, needs converting (it's a packed bundle, not words).

## Still owed

- **The rest of the spreadsheet endings.** Only csv, numbers and qb are in. The Excel family (xls, xlsx, xlsm, xlsb and the template forms), the other plain-text tables (tsv, tab, psv), ods and ots, gnumeric, and the old Lotus and Quattro Pro endings are all listed in code debt, none written.
- **A test of every kind with a real file of that kind** — built in code, dropped through the real save path, read back and checked on all five answers, with a completeness check so a newly added ending fails until someone says what it is.
- **Then valid documents, not just real bytes.** Nothing in ji reads inside a file yet, so real bytes are enough today. The moment the quick and heavy reading-out exists, those same samples have to be real documents — which needs its own research: proper reference samples per format, or failing that the smallest file that genuinely tests each reader (a picture with writing on it, a pdf with real pages, a book with chapters, a clip with speech).
- **A spreadsheet's several sheets.** Whenever conversion is built: turn each sheet into its own plain-text table under its own heading, rather than one nameless blob per workbook. Formulas, formatting and merged cells are lost either way; the original bytes stay, so the file can still be opened elsewhere.

## Where this lives

The whole of it is one file — the document type ([Document.ts](../../../src/lib/ts/types/Document.ts)): the families, the endings, the five lists, and the deciding. Nothing else needs to know how a file is classed; the list, the drop box, the viewer and the store all ask it.
