# kb lexicon

The words used in this project. When writing prose, comments, log lines, or test names, use these words exactly, even when near synonyms exist. If it's here, that's its name. Reaching for a word that is not here, say so and stop — do not invent one.

The shared [banned words](../../shared/truth/conventions.md) list holds the words that mean nothing to Jonathan, each with the word to use instead; ov's own [banned words](../../ai/truth/banned%20words.md) does the same for ov's code, which is kb's since 12 September 2026. The words every project says — guide, work note, collection, labels, kind, tag, brief — are not repeated here.

## kb, its hosts and its db

- **host** — ai or mu, they import the kb library (later ji as well)
- **collection** — a folder of files (mu -> the folder dropped, aka the root; ai -> each project inside mono)
- **dump** — ov.sql or mu.sql, one per host, every table of the db as statements, from which a db is rebuilt
- **api** — the functions one piece of code offers another, each with what it takes and what it answers. Two meet at the dispatcher: the dispatcher's, the addresses the page asks, and the plugin's, the functions the dispatcher's call, four every plugin has and then the specialty's own, tabled under plugin api in memory/ai/zone/work/music and ai.md.
- **configuration** — the facts a host hands kb before anything mounts: `customizations` in kb's common folder, one field per fact, which the host's main.ts fills. Never *switches*.
- **snippet** — a piece of drawing a host hands kb, svelte's word, which kb renders in one place. Six: the browse filter, the edit filter section, the search row, the details section, the operation view and the back links.
- **author** — the name of who wrote a file (a person or a tool: jonathan, Jeff, co, code_debt.py). In `ai`, it is often entered by hand in the editor's information rows, thereafter taken as SOT, never verified. In `mu`, it can be the artist's name: whether the artist is a source or a label is 22b's question.

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
- **information rows** — the four rows of the editor's label form holding title, date, brief, use when, authors and from, ai's since step 10 of the plan, handed to kb as the edit filter section and drawn above the kinds row. Not: the kinds row, the tag rows.
- **kinds row** — the row of the label form holding every kind on the host's closed list, the one the guide wears picked, `Kinds_Row.svelte`.
- **tag rows** — the rows of the label form holding the tag areas, every tag within reach, `Tag_Rows.svelte`. Not: the tag areas among the filters.
- **label form** — the section above a guide's words, `Edit_More.svelte`: one stack of the search, the host's rows, the kinds row and the tag rows, folding whole under the word on its line.
- **open button** — one segment of the segmented control at the left of the controls row while browsing, next to the hamburger, which opens one file in the editor; a segment fills under the cursor and none is ever current; its tip names the file, not the segment's title. A row of plain buttons until 17 September 2026; at the far right past the build number for part of 15 September 2026. The host names each in the configuration's open_buttons, a title and the key of the file; kb draws them as it draws the dispatcher and build buttons. ai's one is code debt, opening memory/shared/zone/code debt.md. Decided 14 September 2026.
- **bundle** — `T_Bundle` in File.ts, the field every file and folder record carries: which folder its path counts from. memory for every file under memory, mo for the repo itself, a project's id for that project's CLAUDE file. Not: the file's project, which project_at reads off a memory file's path. The name is from ov's first build, 30 July 2026, when each collection's guides were a Vite glob bundle; kept 14 September 2026, until step 25 of the plan deletes the enum.
- **unlabeled file** — a file the db holds no row for, `labeled` false on its record in File.ts: the list shows it with no kind, and its labels are composed the first time it is opened for editing. Decided 14 September 2026.
- **link readers** — body_of, links_in and plain_links in `utilities/Links.ts`, kb's since step 11 of the plan: what a guide's words point at, read out of the text alone with no html made. Files.ts reads every guide with them at launch; the drawing, ai's, reads two of them through Kb.ts. Not: the drawing, which is Markdown_Blocks.ts, ai's.
- **rule** — a row in the db the dispatcher runs on every file added or changed: what it reads, the file's name, its location or its content, the regex it matches, and the label it gives, a kind or a tag. A rule never changes or removes a label a person put on.
- **kb** — the library extracted from ov, which mu and ai import: the files list, the filter sections, the operation view, the details column, the drop box, the db and the dispatcher's watcher. ov stays as it is, the reference kb is tested against.
- **plugin** — `plugin.py` in a host's folder, mono/ai or mono/mu, the folder the host's ports.json entry names, the code the dispatcher imports and runs for that host: its listing rule, its labeler and its own routes. The snippets and the configuration are the host's page's to hand kb, not the plugin's. Together with them it makes the host's specialty. Never *reader*.
- **specialty** — the schema, and the code, an app that imports kb brings: its collections, its keys, its plugin, its hierarchies and its operation view. mu brings music, ai brings the memory system's markdown files. kb never adds one of its own. Never *schema* on its own for this.
- **sources** — a file's authors and where it came from, a url or a person, with a date: rows in the db, one per author. Never *provenance* in prose.
- **pill** — a control shaped as a rounded lozenge.
- **tagset** — one area of tags standing as a single pill. Never *area pill*.
- **seg control** — the run of elements inside an elongated pill.
- **soft pointer** — the small triangle that folds a thing away. Never *mark*, never *arrow*, never *triangle*.
- **steppers** — the pair of fat triangles that step from one thing to the next: the link stack while it holds anything, the open buttons while the reading began at one, since 17 September 2026, the list otherwise.
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
