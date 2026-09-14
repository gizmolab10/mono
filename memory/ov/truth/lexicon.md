# ov lexicon

The words used in this project. When writing prose, comments, log lines, or test names, use these words exactly, even when near synonyms exist. If it's here, that's its name. Reaching for a word that is not here, say so and stop — do not invent one.

The shared [banned words](../../shared/truth/conventions.md) list holds the words that mean nothing to Jonathan, each with the word to use instead; ov's own [banned words](banned%20words.md) does the same for this project. The words every project says — guide, work note, collection, labels, kind, tag, brief — are not repeated here.

## Three views (details, browser, editor)

- **files list** — the screen showing every guide the filters leave. Never *the table*.
- **editor** — the screen showing one guide. Never *viewer*.
- **filters** — the things that narrow the list: search text, any number of projects, one kind, any number of tags.
- **count row** — the row above the files list, holding the folders button, how many files are left, and what is picked.
- **progeny** — everything under a folder: its own files and folders, and everything under any folder nested inside it, at any depth, recursively. Never *children*, which reads as one level only.
- **header row** — the row at the top of the files list naming its columns. Never *the titles row*.

## The elements

- **stack** — a run of sections, a gap between each pair, a separator standing centred in every gap. The gap belongs to the stack, and the stack owns every measurement in the app's spacing.
- **section** — one thing in a stack: plain markup, the clickable riding the separator above it, and whether it is folded. It names no gap and no separator of its own.
- **subsection** — a section of a stack that is itself a section of another stack.
- **separator** — the drawn divider between things. Never *line* in prose, never *divider*. Drawn with flares at each end.
- **clickable** — the pill button standing on a separator that folds the section below it away, and says what it hides while folded. Not: any other button; not a word in the file's contents.
- **information rows** — the rows of the editor's label form holding title, date, brief, use when, authors and from. Not: the kinds row, the tag rows.
- **rule** — a row in the db the dispatcher runs on every file added or changed: what it reads, the file's name, its location or its content, the regex it matches, and the label it gives, a kind or a tag. A rule never changes or removes a label a person put on.
- **kb** — the library extracted from ov, which mu and ai import: the files list, the filter sections, the operation view, the details column, the drop box, the db and the dispatcher's watcher. ov stays as it is, the reference kb is tested against.
- **plugin** — a specialty's code in the dispatcher, `plugin.py` in the host's folder, mono/ai or mono/mu, imported from there, the folder the host's ports.json entry names. It reads and writes: its listing rule says which files under the root are listed, it fills a file's labels when the file is added or changed, and it carries the specialty's own routes. Never *reader*.
- **specialty** — the schema, and the code, an app that imports kb brings: its collections, its keys, its plugin, its hierarchies and its operation view. mu brings music, ai brings the memory system's markdown files. kb never adds one of its own. Never *schema* on its own for this.
- **sources** — a file's authors and where it came from, a url or a person, with a date: rows in the db, one per author. Never *provenance* in prose.
- **pill** — a control shaped as a rounded lozenge.
- **tagset** — one area of tags standing as a single pill. Never *area pill*.
- **seg control** — the run of elements inside an elongated pill.
- **soft pointer** — the small triangle that folds a thing away. Never *mark*, never *arrow*, never *triangle*.
- **steppers** — the pair of fat triangles that step from one thing to the next.
- **gap** — empty space. Never *room*.

## Presenting a file

- **the html** — a guide's markdown turned into something readable. Never *the drawn page*, never *the rendered page*.
- **div** — one outermost div of the html: a paragraph, a heading, a table, a chunk of code. Never *block*, never *piece*, never *element*.
- **fold** — to hide a section's content. Its opposite is **unfold**. Never *collapse*, never *hide*.
- **highlighted** — marked on screen. Never *lit*.

## Everything else

- **dispatcher** — the small server that reads and writes files on this machine. Never *local server*, never *backend*.
- **threaded server** — python's ThreadingHTTPServer in http.server, which answers each request in a thread of its own, where HTTPServer, the dispatcher's base today, answers one at a time. Its request threads are daemon, so an exit is not held by one.
- **db** — a host's SQLite file beside the dispatcher, one per host, `tools/hub/ai.db` for ai since 13 September 2026, made from `ov.db`, and `tools/hub/mu.db` for mu to come, holding what the host's files do not say about themselves: files, labels, sources, rules, collections. Only the dispatcher reads and writes it, picking the file by the host a request names, ai when it names none, which is what ov's frozen page sends, ports.json pairing each host with its db. A label there is one kind or one tag on one file, each row saying who wrote this: hand, rule or ai, the column the code calls made_by. Never *database* in prose, never *store*.
- **ladder** — the nine increments every set of constants can define, smallest first: micro, faint, tiny, small, normal, big, fat, huge, pill. Sets can define only some of the increments.
