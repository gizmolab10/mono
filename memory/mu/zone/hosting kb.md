# hosting kb

kb is the library extracted from ov. mu and ai import kb to read music and ai files. ov is frozen forever, decided 12 September 2026 — every further change is made to ai, never ov. It stays as it is, a static reference of correctness: kb with the ai specialty must do everything ov does today, which is ov's working features, rows 1 to 89.

What both hosts need. ai's own part is [how ai hosts kb](../../ai/truth/design/how%20ai%20hosts%20kb.md), music's is [kb hosted by music](kb%20hosted%20by%20music.md).

## edgy

Reasonable, with three edgy parts and nothing crazy, 11 September 2026. Every piece exists already: gallery and panel are libraries that take a configuration and snippets from a host, the db module opens one sqlite file per call, and the dispatcher already runs the hub's long work in threads. Nothing new is needed but mutagen and ffmpeg.

1. **The db is the only home of every label.** In ai, these labels are hand curated, irreplaceable and must be immune to corruption. Steps 2 and 3 are **done** -> they guarantee this.
2. **A plugin imported into one long-running server.** mu's plugin and ai's run inside the dispatcher that ov, ai and the hooks use, so a fault in mu's tag reader can **stall or drop every host's requests**, and one walk of the library holds the server 30 seconds until step 21 threads it. The fixes: (a) in step 6, the plugin's calls are wrapped so that a fault fails just it and not the server, (b) one db per host, step 3, **built** 12 September 2026, so mu's writes and locks never touch ai's db
3. **Three copies of ov's code through sixteen steps.** kb, ai and the frozen ov live side by side from step 4 to step 19, and the full proof, the 89 rows ticked by hand, comes only at the end. The one-line rule holds it: a fix is made in kb or ai, never in ov.
4. **One library (kb) for two hosts**, not edgy until steps 26 and 29. ai's files are 346 notes and mu's are 18,219 songs, and the two will want different things on the screen. The best way to give each what it wants -> have the host hand kb a snippet which will draw the thing wanted, and which kb places onto the page.

## kb

- [ ] files list: the list, the count row, the hierarchy from paths and the hierarchies by a label, each grouping the rows by one label's value, the folds, the sorting, the selecting, the stepping
- [ ] filter sections, browse and edit variants, generic: search, collection (root folder or project), kind, tag. Extensible sections for a specialty's own, handed as two snippets, one for browse and one for edit: ai adds nothing to browse, since its projects are its collections, and the four fields' rows to edit
- [ ] operation view: the files list, and the status line below it. A click on a row draws kb's editor frame, `Edit.svelte` and the label form's stack, with the specialty's own snippet inside it: ai's drawn words, music's player
- [ ] details column: preferences, rules, and a section a specialty adds, ai's repair
- [ ] drop box, panel's, pulled up from gallery
- [ ] the db and kb's part of the dispatcher: one db per host, beside the dispatcher, ov's and mu's, mu's empty until step 20, each holding the tables under tables, their routes, and the watcher's four outcomes, changed, moved, missing, found. The dispatcher is three things: the hub's routes, kb's routes, and one plugin per specialty, loaded from the host's folder and carrying that specialty's own routes

## new lexicon

### kb's lexicon

Each entry is ticked when it is written into memory/kb's lexicon at step 4. All were, 12 September 2026.

## specialty

kb is a library, like panel and gallery. mu and ai are hosts — they import it. Each host provides a specialty — a schema, and some code.

### what it is

1. **collection information.** A row in the collections table of the host's own db: a name, the specialty's name, and a root folder on the disk. All paths are relative to that root. In ai every collection's root is the mono repo and the name alone differs, so a path stays what it is today, off the repo's top. A route reads or writes a file under the root only if the specialty's listing rule lists it, and refuses any other, the way today's routes refuse a path that is not a note. Collections are children of the root of the hierarchy.
2. **keys.** The labels a file of this specialty carries: for music, artist, album and title, each a row in the labels table written by the plugin inside the rules pass, so each row's who wrote this is rule, and the dispatcher's next look at the disk, which deletes every row on a changed file whose who wrote this is rule and makes new entries for what the rules give, makes new entries for these too instead of wiping them, and later letter. The kind is a file's: a hand or a rule gives it, or the plugin hard-wires one.
3. **plugin.** `plugin.py` in the host's folder, ai's or mu's, mono/ai or mono/mu, which the dispatcher imports from there, the folder its ports.json entry names. It reads and writes. Three jobs. Its listing rule says which files under the root are listed. On a file added or changed, inside the rules pass, it fills the labels as rule: music's reads the file's own tags, ai's reads the text for links and runs the content rules. And it carries the specialty's own routes, music's streaming among them. Its routes write files, as ai's save route does.
4. **hierarchies.** Which label a hierarchy groups by: music's are folder, artist, album and name, and later letter, ai's is the folders. Each host names them, kb draws the list from any of them.
5. **operation view.** What the operation view shows when a row is clicked: music's player, ai's editor. The host hands kb a snippet for it (the same way a host hands panel its snippets), and kb renders it with the clicked file.

Not kb's: the reading of a file's tags, the streaming of bytes, and vob. Those are the host's plugin's.

## plugin api

An API is a set of functions with what each takes and what each answers. 

Two apis meet at the dispatcher, the dispatcher api that the app calls, and the plugin api that the dispatcher calls. The dispatcher's api is what the page asks: one address per ask, listed in tools/hub/index.md, with a function behind each. A request names its host, and the dispatcher picks the host's db and the host's plugin by it. ov's asks name no host and go to ai's plugin and `ov.db` until ov is retired at step 19, since the two share both. The plugin's api is what the dispatcher's functions call: one `plugin.py` per host, imported from the host's folder, mono/ai or mono/mu, every call wrapped so a fault fails that file or that request and never the server. Four functions every plugin has, then the specialty's own, which the dispatcher's api calls where the host's plugin has them and refuses where it does not. ai's are made at step 6 and step 8, music's at steps 20, 22 and 23.

| function | takes | answers | called by |
| --- | --- | --- | --- |
| specialty | nothing: a value the plugin declares | the specialty's name, ai or music, written on the collections rows the look makes | the look, when a collection turns up |
| listed files | the collection's root folder | every file's path under the root that the listing rule lists, counting from the root, sorted | the look every 3 seconds, `/rescan` and `/list-files` |
| is listed | the root and one path | whether the listing rule lists that path | every function of the dispatcher's api that reads or writes a file under the root, which refuses any other |
| labels | the root and one file's path | the labels the plugin gives that file, each a name and a value, written as rule rows: ai's the links the file holds, as the ai specialty says, from step 14, music's artist, album and title from the file's own tags, step 22 | the rules pass, on a file added or changed |
| read | the root and one file's path | the file's words | `/read-guide`, ai's, step 8 |
| save | the root, one file's path, the whole text, and the text as it was when the file was opened | whether it was written, refused when the file changed since it was opened | `/save-guide`, ai's, step 8 |
| scan | the root and one file's path | what the file's own label block says: its kind, its tags and the four fields | `/scan`, ai's, step 8 |
| strip | the root and one file's path | the file rewritten with its label block off, or passed over and named when the block carries a line the db has no place for | `/strip-block`, ai's, step 8 |
| stream | the root, one file's path, and the range of bytes the browser asks for | those bytes and the content type, by the file's ending | music's streaming address, step 23 |

## tables

### kb tables

Every table in a host's db, what one row is, its columns, and who writes it. Each host has a db of its own beside the dispatcher, decided 11 September 2026: `tools/hub/ov.db` is ai's, keeping its name until ov is retired, and `tools/hub/mu.db` is mu's, one ignore line for both. ports.json names each host's db beside its port, and a host's folder is where its plugin is. All five are built, collections at step 3, 12 September 2026.

| table       | one row per                                                          | columns                                                                                                                                                                                                   | written by                                                                               |
| ----------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| files       | file                                                                 | collection, path relative to the collection's root and unique within the db, size, modified, fingerprint, missing, and the four fields title, description, use_when and date, which the ai specialty uses | the dispatcher's look, and the four fields by the editor and the plugin                  |
| labels      | kind or tag on a file, and for music each of artist, album and title | file, name, value, and who wrote this, the column the code calls made_by: hand, rule or ai                                                                                                                | hand through the editor, the rules pass, the plugin as rule, and the ai                  |
| sources     | author of a file                                                     | file, author, came_from, a url or a person, and date                                                                                                                                                      | hand through the editor                                                                  |
| rules       | rule that gives a label                                              | reads, one of name, location or content, pattern, and the name and value of the label it gives                                                                                                            | hand through details                                                                     |
| collections | a collection: a dropped root folder for mu, a project for ai, the mono repo the root of every ai one | name, the specialty's name, and the root folder on the disk, under which a route reads or writes only a file the specialty's listing rule lists                                                                     | ai's rows by the look, the first time the listing names one, music's rows by the drop box, and until it exists by `/add-collection` |

## proposed rules

Not decided, its pac is in zone/proposals.md. The ai is the third writer of labels: rows whose who wrote this is ai, which ov passes over until one is accepted, and ji's top idea says how they are accepted. The rules table holds patterns, each tried against a name, a location or a content and giving one label. The ai reads what a plugin hands it instead, so its rules are instructions, plain words, not patterns. The mechanism is kb's, the same for every specialty. What each specialty puts into it is its own.

### common rules

1. **What the rules are.** One markdown file in the host's folder, beside its plugin, holding the instructions and the shape of the answer. A file rather than rules rows, since the text is prose and long, and a rules row is one regex tried per file. Edited in the editor like any file, and the details column's rules section links to it.
2. **When they run.** Inside the rules pass, after the pattern rules, on a file added or changed, and only while the preferences checkbox, AI suggestions, is on. A change to the instructions applies to files changed after it.
3. **What is sent, and where.** The instructions, then what the plugin hands over for the file, to the AnythingLLM workspace, through kb's part of the dispatcher, with the chat call ji makes, without the thread's history. The dispatcher cannot read ji's preferences, which live in the browser, so the base url, the key and the workspace name are in a file beside the dispatcher, git-ignored like the db. AnythingLLM runs on this machine, so nothing leaves it, **risk low**.
4. **What is written.** The labels the answer names, each on the specialty's closed lists, the rest dropped and said so in the log as a tag off the list is today. Written as labels rows with who wrote this ai, the file's earlier ai rows going first, the way the rules pass makes rule rows anew. No hand row and no rule row is touched. Time is the cost: one call per changed file, seconds each, in the rules pass's thread, so the look waits, **risk medium**, held by the checkbox, off until asked.
5. **How they are accepted.** kb's editor draws the ai rows apart in the kinds row and the tag areas, as suggestions. Accepting one writes a hand row and removes the ai row. Declining removes the ai row. Nothing else changes.

Proof: test_dispatcher.py with a stand-in for AnythingLLM answering a fixed reply, the rows written as ai, a hand row on the same file untouched, and a label off the list dropped.

## plan

One list of steps, in the order they are done and now numbered, re-decided 12 September 2026: ai first. The answered questions and the shared ground first, steps 1 to 3, since both sides need them; then the strip of ov, steps 4 to 19, the plugin mechanism arriving at step 6 with ai's plugin as its first customer; then music, steps 20 to 24; then kb's new work, 25 to 27, the drop box, 28, mu adopts kb, 29, and three for later, 30 to 32. Each step names its proof, and a decision a step needs is a substep before its work, and where it has one, its risk. A step with parts has them as substeps.

### first, steps 1 to 3

Both sides need these, so they lead whatever order the rest runs in.

### kb's new work, steps 25 to 27

What kb needs that ov never had, from the kb list at the top, since music does not fit without them.

- [ ] 25. **The collection filter.** A section among the browse filters, beside kind, tag and search, narrowing the list to one collection, a project in ai, a root folder in mu, read from the collections table. It takes over from the projects row, which draws `T_Bundle`, the closed list of thirteen project names in `File.ts`. The bundle design goes here: `T_Bundle` and `project_at`, and `file_path_of` and `site_of_file` in `Saving.ts`, a bundle and a path to a repo path and back, with their cases in saving.test, and is_design with them, which site_of_file computes off the path and Files.ts hangs designs under, always false today. In their place each file's row carries its collection and its path from the collection's root, which `/all-labels` and `/collections` carry from step 6, the hierarchy hanging each file from its row's collection and the files manager building each collection's top from the collections table. Smaller than its call sites say: since 14 September 2026 Saving.ts counts every path from the collection's own folder, memory's under memory, mono's the repo itself, a project's its folder, and is_design is always false, so a repo path is memory and the file's path for every file but the CLAUDE files. Proof: filters test, and a visual report of the list narrowed to each, and unchanged in ai with none picked.
- [ ] 26. **Hierarchies by a label.** The list grouped by one label's value, artist, album or name, beside the hierarchy from paths, the host naming which labels in its configuration. Proof: a test of the grouping, and a visual report of mu's list by artist.
    - [ ] 26a. **question** the shape of album: nested under artist, artist then album then song, or a flat list of albums.
    - [ ] 26b. **question** the order within an album: track order, which needs a track number the keys do not yet hold, or by name.
    - [ ] 26c. **Build the grouping** as this step says, in the shape 26a and 26b chose.
- [ ] 27. **The two list fixes.** Proof: ov's suite clean, and the list drawn with the library's 18,219 rows without a pause.
    - [ ] 27a. The hierarchy's lookups as maps keyed by file id, built once and kept, in place of the array scans in `add_tagging`, `relabel` and `tag_names_of`.
    - [ ] 27b. The list drawing only the rows in view, the rest as height, in place of one DOM row per file.

### the drop box, step 28

- [ ] 28. **The drop box.** panel's, pulled up from gallery, the folder picker music's first phase named. Proof: a visual report of a folder dropped, its row in the collections table and its files in the list.
    - [ ] 28a. Notice when a file or a folder is dropped, and dig through a folder.
    - [ ] 28b. Make a collection row for it, of the host's specialty, and read everything into the db.
    - [ ] 28c. Apply that specialty to it.

### later, step 32

- [ ] 32. **Rules for the ai.** The proposed rules section, common, ai's and music's, since a song takes four tags since 13 September 2026. Proof: as proposed rules says.
    - [ ] 32a. **question** whether to build them at all, the pac in zone/proposals.md: 13 bare files of 346 today, each composed the first time it is opened.
    - [ ] 32b. **Build them** as proposed rules says.
