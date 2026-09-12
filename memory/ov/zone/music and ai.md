# music and ai

kb is the library extracted from ov. mu and ai import kb to read music and ai files. ov stays as it is, a static reference of correctness: kb with the ai specialty must do everything ov does today, which is ov's working features, rows 1 to 87.

## kb

- [ ] files list: the list, the count row, the hierarchy from paths and the hierarchies by a label, each grouping the rows by one label's value, the folds, the sorting, the selecting, the stepping
    - [ ] the hierarchy's lookups as maps keyed by file id, built once and kept, in place of the array scans in `add_tagging`, `relabel` and `tag_names_of`, which are quadratic at load and at every narrowing
    - [ ] the list drawing only the rows in view, the rest as height, in place of one DOM row per file
- [ ] filter sections, browse and edit variants, generic: search, collection (music, ai), kind, tag. Extensible sections for a specialty's own, handed as two snippets, one for browse and one for edit: ai adds project to browse, and the four fields' rows to edit
- [ ] operation view: the files list, and the status line below it. A click on a row draws kb's editor frame, `Edit.svelte` and the label form's stack, with the specialty's own snippet inside it: ai's drawn words, music's player
- [ ] details column: preferences, rules, and a section a specialty adds, ai's repair
- [ ] drop box, panel's, pulled up from gallery
    - [ ] notice when a file or a folder is dropped, and dig through a folder
    - [ ] make a collection row for it, of the host's specialty, and read everything into the db
    - [ ] apply that specialty to it
- [ ] the db and kb's part of the dispatcher: the tables under schema, their routes, and the watcher's four outcomes, changed, moved, missing, found. The dispatcher is three things: the hub's routes, kb's routes, and one plugin per specialty, loaded from the host's folder and carrying that specialty's own routes
    - [ ] one walk per look, shared by reconcile and the rules, with a per-folder time check before any stat, in place of every folder walked and every file stated twice every 3 seconds, which is linear in files forever
    - [ ] one db connection per thread, the schema checked once, and a pass's per-file writes in one transaction, in place of an open, four creates and a column check per call, nineteen such calls and one per file in a scan or a rules pass
    - [ ] the fingerprint by size and time first, a hash only for a candidate match, and for a big file the first and last megabyte, in place of every byte hashed, gigabytes for music at the first scan and again on any deletion
    - [ ] `/all-labels` answered per collection, the columns the list needs first and the rest on open, in place of every label, field and source of every file in one JSON
    - [ ] the server threading its requests, and long work, a scan or a dump, in a thread that answers progress, in place of one request at a time blocking the hub, ov and ai until it ends
    - [ ] a rule change rerun for its own reads alone, and content rules skipped for a specialty whose files are not text, in place of every rule on every file, each read whole

## specialty

kb is a library, like panel and gallery. mu and ai import it. Each adds a schema, and some code, of its own: the specialty.

### what it is

1. **collection information.** A row in the collections table: a name, the specialty's name, the host's folder, and a root folder on the disk. All paths are relative to that root, and the routes refuse nothing under it that the specialty's listing rule lists. Collections are children of the root of the hierarchy.
2. **keys.** The labels a file of this specialty carries: for music, artist, album and title, each a row in the labels table written by the plugin inside the rules pass, so each row's who wrote this is rule, and the dispatcher's next look at the disk, which deletes every row on a changed file whose who wrote this is rule and makes new entries for what the rules give, makes new entries for these too instead of wiping them, and later letter. The kind is a file's: a hand or a rule gives it, or the plugin hard-wires one.
3. **plugin.** `plugin.py` in the host's folder, ai's or mu's, which the dispatcher imports from the folder the collection's row names. It reads and writes. Three jobs. Its listing rule says which files under the root are listed. On a file added or changed, inside the rules pass, it fills the labels as rule: music's reads the file's own tags, ai's reads the text for links and runs the content rules. And it carries the specialty's own routes, music's streaming among them. Its routes write files, as ai's save route does.
4. **hierarchies.** Which label a hierarchy groups by: music's are folder, artist, album and name, and later letter, ai's is the folders. The host names them, kb draws the list from any of them.
5. **operation view.** What the operation view shows when a row is clicked: music's player, ai's editor. The host hands kb a snippet for it, the way a host hands panel its snippets, and kb renders it with the clicked file.

Not kb's: the reading of a file's tags, the streaming of bytes, and vob. Those are the host's plugin's.

### ai specialty

The ai specialty is what ov does today, taken out of ov and made a host's: the markdown files of the memory system, the ones co and i read and write. The five things, and the code that comes with them:

1. **collection information.** One collection, ai, its root the mono repo, since the CLAUDE files sit there and in each project's folder. The memory system's project folders, shared, core, ov and the rest, hang under it at the top of the hierarchy.
2. **keys.** The five labels. kind and tag as rows in the labels table, written by hand, by a rule or by the ai. title, description, use_when and date as the four fields on the files row: those four are this specialty's and no other's. authors and from as rows in the sources table. The table below says what each holds.
3. **plugin.** Its listing rule is ov's today: every markdown file under memory, the CLAUDE files at the repo's top and one folder down, and a work note at a work folder's top or one folder down inside the named work folders, nothing deeper. On a markdown file added or changed it reads the links the file holds, so the back links can be worked out, and the db holds them, so ai reads no file at launch, where ov reads every file's text twelve at a time. It runs the content rules over it. It composes nothing. Its routes read a file's words and write them back, the ones ov's dispatcher has today.
4. **hierarchies.** One: the folders, the project folders on top under ai. The ai specialty's own filter section narrows it by project, beside kb's kind, tag and search, which looks in titles and descriptions, not content.
5. **operation view.** The editor: the file's words drawn from markdown, each piece opening for a change. The information rows, the db's fields as edit fields, with the title copied to and from the top heading and the file name. The kinds row and the tag areas. The back links. The search row.
6. **ai project code.** The steps under ov strip down: among them drawing markdown, composing labels for a bare file the first time it is opened, mending index files, following links and judging dead ones, opening a code file, and knowing the repo's note folders.

### music specialty

The music specialty is mu's: the files of a music library under a root folder i pick, anywhere on the disk. mu's own thinking is in its memory, [design](../../mu/truth/design.md) and [project goal](../../mu/zone/project%20goal.md), and the answers below draw on them. The five things, what is known of each, 11 September 2026. Its open questions are gathered under open questions at the end.

1. **collection information.** One row per root folder: the specialty's name, music, the host's folder, mu, and the root, the folder dropped or picked. The library is the volume `/Volumes/muice myoozk`, decided 11 September 2026: an NTFS disk over USB, four top folders, Any Audio, HD Audio, MVE and MuSC-V, 18,219 files, 6227 of them flac, 1954 mp4, 1421 vob, and 3085 jpg beside them.
2. **keys.** artist, album and title, each a row in the labels table written by the plugin as rule, as what it is says. The kind is music for every file, hard-wired.
3. **plugin.** `mu/plugin.py`. Its listing rule: under the root, files ending mp3, m4a, flac, wav, shn, mp4, mpg, avi, mkv and vob, the jpg cover art beside them, decided 11 September 2026, and archives, zip, rar and 7z, opened with unar, the one tool that opens all three, which the dispatcher runs and says how to install when it is missing, as project goal says. A pdf or txt beside a song is matched to the song by its name and attached to it. Its labels: the three, read from the file's own tags. Its routes: one that streams a file's bytes to the player, answering the range the browser asks for, and later one for vob, which runs ffmpeg on the dispatcher's side, since no browser plays MPEG-2.
4. **hierarchies.** Four now, by folder, by artist, by album and by name. Folder is the paths, as ai's. The other three group the rows by one label's value.
5. **operation view.** The player: the browser's own audio element for mp3, m4a and flac, its video element for mp4, inside kb's editor frame with the kinds row and the tag areas above it.
6. **mu project code.** What mu has today: the three files that draw panel, with one switch, its name, and its two bridges, Core.ts and Panel.ts. To come: a bridge to kb, the player as the operation view snippet, its filter sections, artist and album, `mu/plugin.py` with the tag reader and the streaming route, and its own build notes table.

## tables

### kb tables

Every table in the db, what one row is, its columns, and who writes it. Four are built. The fifth, collections, is step 3b of ov strip down.

| table | one row per | columns | written by |
| --- | --- | --- | --- |
| files | file | collection, path relative to the collection's root, size, modified, fingerprint, missing, and the four fields title, description, use_when and date, which the ai specialty uses | the dispatcher's look, and the four fields by the editor and the plugin |
| labels | kind or tag on a file, and for music each of artist, album and title | file, name, value, and who wrote this, the column the code calls made_by: hand, rule or ai | hand through the editor, the rules pass, the plugin as rule, and the ai |
| sources | author of a file | file, author, came_from, a url or a person, and date | hand through the editor |
| rules | rule that gives a label | reads, one of name, location or content, pattern, and the name and value of the label it gives | hand through details |
| collections | root folder | name, the specialty's name, the host's folder where its plugin is, and the root folder on the disk, which every path is relative to and under which the routes refuse nothing the specialty's listing rule lists | ai's row made with the table, music's rows by the drop box |

### ai tables

Every key the ai specialty puts on a file, where it lives in the db, what it can hold, and who sets it.

| key | lives in | values | set by |
| --- | --- | --- | --- |
| kind | labels row, name kind | one of six: analyze, arch, explain, howto, music, specify | hand, rule or ai; a hand kind wins |
| tag | labels rows, name tag, one per tag | the closed list of 39: always, born, build, data, debug, deploy, faster, geometry, incorporated, journal, keep, later, maybe, migrate, next, notes, now, plans, platform, port, program, proposal, prose, refactor, research, session, setup, soon, stale, style, tabled, team, test, tools, UX, vision, visual, waiting, weighed | hand, rule or ai; a tag shows whoever wrote it |
| title | files row, field title | one line, the human name, unique across every file | hand, or composed from the first heading |
| description | files row, field description | one sentence | hand, or composed from the first sentence |
| use_when | files row, field use_when, csv | phrases, as many as the file names, no closed list | hand |
| date | files row, field date | the last real change, year-month-day, or a date written out | hand, or today when composed |
| author | sources rows, one per author | names | hand |
| came_from | sources rows, beside each author | a url or a person | hand |
| who wrote this | on every labels row, the column the code calls made_by | hand, rule or ai | whoever writes the row |
| collection | files row | ai, the one collection, its root the mono repo. The project is read off the path | the dispatcher |
| path, size, modified, fingerprint, missing | files row | the disk's own facts about the file | the dispatcher's look |

### music tables

Every key the music specialty puts on a file, where it lives in the db, what it can hold, and who sets it. A row with a question is not decided.

| key | lives in | values | set by |
| --- | --- | --- | --- |
| kind | labels row, name kind | music, for every file | the plugin, as rule |
| artist | labels row, name artist | the artist tag in the file, one row per artist? | the plugin, as rule |
| album | labels row, name album | the album tag in the file | the plugin, as rule |
| title | labels row, name title, or the files row's title field? | the title tag in the file, or the file's name when the tag is empty | the plugin, as rule |
| tag | labels rows, name tag | the 39, a list of music's own, or none? | hand or rule |
| who wrote this | on every labels row, the column the code calls made_by | rule for what the plugin writes, hand for what a hand adds | whoever writes the row |
| collection | files row | the root folder's row, one per root | the dispatcher |
| path, size, modified, fingerprint, missing | files row | the disk's own facts, the fingerprint by size and time first for a big file | the dispatcher's look |
| description, use_when, date | files row | empty for music, the four fields being ai's | nobody |
| author, came_from | sources rows | empty, unless the artist is the author? | nobody yet |

## proposed rules

Not decided, its pac is in truth/decisions.md. The ai is the third writer of labels: rows whose who wrote this is ai, which ov passes over until one is accepted, and ji's top idea says how they are accepted. The rules table holds patterns, each tried against a name, a location or a content and giving one label. The ai reads what a plugin hands it instead, so its rules are instructions, plain words, not patterns. The mechanism is kb's, the same for every specialty. What each specialty puts into it is its own.

### common rules

1. **What the rules are.** One markdown file in the host's folder, beside its plugin, holding the instructions and the shape of the answer. A file rather than rules rows, since the text is prose and long, and a rules row is one regex tried per file. Edited in the editor like any file, and the details column's rules section links to it.
2. **When they run.** Inside the rules pass, after the pattern rules, on a file added or changed, and only while the preferences checkbox, AI suggestions, is on. A change to the instructions applies to files changed after it.
3. **What is sent, and where.** The instructions, then what the plugin hands over for the file, to the AnythingLLM workspace, through kb's part of the dispatcher, with the chat call ji makes, without the thread's history. The dispatcher cannot read ji's preferences, which live in the browser, so the base url, the key and the workspace name are in a file beside the dispatcher, git-ignored like the db. AnythingLLM runs on this machine, so nothing leaves it, **risk low**.
4. **What is written.** The labels the answer names, each on the specialty's closed lists, the rest dropped and said so in the log as a tag off the list is today. Written as labels rows with who wrote this ai, the file's earlier ai rows going first, the way the rules pass makes rule rows anew. No hand row and no rule row is touched. Time is the cost: one call per changed file, seconds each, in the rules pass's thread, so the look waits, **risk medium**, held by the checkbox, off until asked.
5. **How they are accepted.** kb's editor draws the ai rows apart in the kinds row and the tag areas, as suggestions. Accepting one writes a hand row and removes the ai row. Declining removes the ai row. Nothing else changes.

Proof: test_dispatcher.py with a stand-in for AnythingLLM answering a fixed reply, the rows written as ai, a hand row on the same file untouched, and a label off the list dropped.

### ai rules

1. **The instructions.** The six kinds with add a file's questions, the 39 tags with one line each on when it applies, and the answer, one kind and the tags as csv.
2. **What is sent.** The file's words.
3. **What is written.** A kind and tags.
4. **The rerun.** A button in the rules section runs the instructions over every file and says how many, since 500 files is 500 calls.

Purpose: a file nobody has labeled gets a kind and tags worth accepting, without a hand composing them. Goal: of the first fifty suggestions, the count accepted, written here.

### music rules

Applies once a song takes tags, the open question under keys. Until then the ai has nothing to give a music file.

1. **The instructions.** No kind, since music's is hard-wired. Tags alone, from whichever list keys settles on, with one line each.
2. **What is sent.** A music file has no words: its name, its path and the three tags the reader found.
3. **What is not the ai's.** artist, album and title are the tag reader's rule rows. A file with empty tags is its name and folder, and a rules row gives one fixed value, so that is mu's plugin's parsing, not a suggestion.
4. **Scale.** One call per changed file over tens of thousands, so no rerun button, and the first scan of a library makes no calls: files changed after the checkbox is turned on alone.

Purpose: a song gets the tags a hand would give it. Goal: the same count, of the first fifty.

## plan

### order

The order in force, decided 11 September 2026: music first.

1. music first, steps 1 to 8, on the dispatcher side. Its step 1 answers the seven questions gathered under open questions as its own. Strip steps 1 and 2 may go ahead meanwhile, since they touch no dispatcher code.
2. ov strip down, steps 1 to 16, with step 3 reduced to 3a and 3c. kb exists at the end of it, with ai as its first host.
3. kb's new work: the collection filter, hierarchies by a label, the drop box, and the two performance fixes under the files list, the six under the db being music first's step 5.
4. music phases: 1 is kb's drop box, and 2, 3 and 4 are done by music first's steps 3 to 8.

### ov strip down

The steps that take ov down to kb, in order, each naming the ov file that does the thing today. Every step ends the same way: kb runs without the piece, the ai host does it, and ov still does what it did. Each step names its proof: a suite, or a visual report naming what to look at. A piece that can be written over plain words before it moves is, and gets a test then. Steps 6, 7, 11 and 13 are proved by looking alone, **risk medium**: a fault passes a look and turns up later, and nothing is lost when it does. The 87 rows ticked by hand at the end hold it.

- [ ] 1. **The two new projects.** A kb project, a library with its alias and bridge as libraries.md says, holding all of ov's code, and an ai project, an empty host that imports kb and draws its page, Main.svelte, gallery's name for the same thing, the way mu draws panel: a Main.ts, an App.svelte, a Customizations.ts and the bridges, nothing more. ai with a port and a servers entry, kb with neither, as gallery and panel have neither, and each with its memory folder, memory/kb and memory/ai, holding a CLAUDE file, a lexicon and a map. memory/ov stays with ov, the reference. What kb and ai need of it is written there again, and memory/ov keeps every file it has. ov is frozen from this day: no change to it after this step, and a fix found later is made in kb or ai, never in ov. It is retired the day step 16 ends. Three copies of the code live until then, **risk low**: the rule is one line, and a slip is a fix made twice. Every step below moves one piece from kb to ai, so ai fills as kb empties, save 3, 5 and 6, which change the dispatcher and a prefix. Proof: both new projects check clean, ov's suite passes in kb save core_alias.test, rewritten for kb's chain as libraries.md asks, its bridges to core and panel, and ai's own core_alias test proves its bridges to core, panel and kb, exactly one file per library reaching through its alias.
- [ ] 2. **The hand-over, two ways.** The facts as switches: one object kb declares in its common folder, which the host's Main.ts fills before anything mounts, the way lv and mj fill gallery's customizations, and every kb module reads when asked, holding the collection information, the keys, the hierarchies, the preferences prefix and the build notes table, `ov/src/lib/md/builds.md` today, the table of builds that the build button in the controls row opens, one per host. The drawing as snippets: the host's App.svelte draws kb's page, Main.svelte, the component that draws panel and hands it kb's own snippets, and hands it snippets, two for its filter sections, browse and edit, one for its details section, and one for its operation view, which kb renders with the clicked file, the way gallery's Main.svelte hands panel its snippets. Where a host hands no snippet, kb draws nothing there. Its design comes before any code, proposed in [adopt kb.md](adopt%20kb.md), decided 11 September 2026 to be written now, moving to memory/kb at step 1: the type kb declares, one field per fact, the four snippets with their arguments, the two filter sections and the details section taking nothing, the operation view taking the clicked file, and the panel region each renders in. The step ends when the ai host compiles against it. Every step below moves a piece into one or the other. Proof: kb's check clean with the ai host's specialty in.
- [ ] 3. **Know which folders of the repo hold notes.** `site_of_file`, `file_path_of`, `WORK_FOLDERS` and `reaches_under_work` in `Saving.ts`, `T_Bundle` and `project_at` in `File.ts`, and in the dispatcher `listed_files`, `is_listed_note` and `COLLECTIONS`. In their place, the collections table and the ai plugin's listing rule, in five parts, each with its own proof, before the rest, since every path keys on a collection's root after them. Through all five, the three things inject-always.sh calls in `database.py`, `PLACE`, `open_db` and `all_labels`, keep their names and their answers, test-always-tag.sh runs after every save of database.py before the next message, and where one of the three must change, the new code is written beside it under another name and swapped in one save. This step works on the one live dispatcher and db that ov, the hooks and every session use, **risk high**: the db alone holds every label, and a slip reaches every session's rules on the next turn. 3a's saved file, the dump, the three stable calls and the always test after every save hold it. And the collections table, the plugin and the listing rule are new ground, built for one specialty and meant for two, **risk medium**: what fits ai alone is rebuilt when music arrives, and nothing built for ai is lost by that. The eight questions under the music definition's collection information, keys and plugin, answered before this step begins, decided 11 September 2026, hold it.
    - [ ] 3a. **The backup and the dump.** `tools/hub/ov.db` is saved beside itself as `tools/hub/ov.db.before-step-3`, kept until step 3's ending holds, and every later step that touches the db does the same with its own number. The db itself never enters git and the ignore line stays. A `/dump` route writes every table as plain text to `tools/hub/ov.sql`, committed at each step's ending, and a `/restore` route reads it back into the file named in the ask, refusing `ov.db`, the live db, whatever the ask says. Proof: a dump restored into `tools/hub/ov.restored.db` answers every label the same. Nothing below touches the db without 3a's saved file in place.
    - [ ] 3b. **The collections table.** Built with its routes, and one row, ai, its root the mono repo. Proof: test_database.py and test_dispatcher.py.
    - [ ] 3c. **The ai plugin.** `ai/plugin.py` made with the listing rule in it, and the dispatcher importing a plugin from the folder a collection's row names. Proof: test_dispatcher.py listing the same files as before.
    - [ ] 3d. **The re-keying.** Every row of the real db re-keyed from a path off the repo's top to a collection and a path within its root. Proof: the dump before against the dump after, every label present under its new key.
    - [ ] 3e. **The three tools.** `inject-always.sh`, `test-always-tag.sh` and `big-picture.py`, which read the db by path, re-pointed. Proof: test-always-tag.sh and test_big_picture.py.
- [ ] 4. **The vocabulary.** The six kinds and the 39 tags in `File.ts`, the ten tag areas in `Tag_Areas.ts`, and the is_design flag on a file: the ai specialty's keys, handed to kb's kinds row and tag areas. Proof: tag_areas test, and a visual report of the kinds row and the tag areas in the ai host.
- [ ] 5. **The dispatcher's markdown routes.** `/read-guide`, `/save-guide`, `/scan` of a label block and `/strip-block`: they are written into `ai/plugin.py` as well, made at step 3, and stay at the dispatcher until ov is retired: the dispatcher hands a route to a plugin only where a plugin claims it, so once ai's plugin claims a route, the plugin answers every caller, ov included, and the dispatcher's own code for that route is kept unreached until ov is retired, then taken out. One db, one dispatcher. The importing of a plugin is 3c's, not this step's. Proof: test_dispatcher.py run from ov's folder and from ai's, each with its own paths.
- [ ] 6. **The preferences prefix.** `Preferences.ts`'s ov_ becomes the host's, read off the switches, one prefix each, so kb's hosts remember apart. Proof: a visual report, a preference surviving a reload in each host and not crossing between them.
- [ ] 7. **The four fields' rows in the label form.** `Edit_Filters.svelte`: title, date, brief and use when. The kinds row and the tag areas stay kb's, since every specialty has a kind and tags: they become two kb components of their own, taken out of `Edit_Filters.svelte`, and the frame draws them. The four rows go to ai as the edit filter snippet, and with the title row its two tools, the title copied to and from the top heading and the file name, doing nothing until step 13 gives them their moves. Proof: a visual report of the four rows in the ai host's editor, between kb's kinds row and tag areas.
- [ ] 8. **Draw markdown and put a changed piece back.** `Edit_Markdown.svelte`, `Markdown_Blocks.ts`, `Emphasis.ts`: the words turned into a page, each piece opening for a change, headings named, folds, where the reading was left. The ai operation view begins here: the words and their pieces alone, drawn as the operation view snippet inside kb's frame, `Edit.svelte` and the label form's stack, which stay kb's. Proof: markdown_blocks, code_blocks and emphasis tests, and a visual report of a page drawn and a piece changed.
- [ ] 9. **Compose labels for a bare file.** `Labels.ts` is two things: `labels_for`, the composing, goes, the first heading, the first sentence, today, the fallback kind, the new and stale tags. `label_changes`, the diff kb writes the db with, stays. Proof: labels test, in both places.
- [ ] 10. **Search inside the drawn page.** `Search.svelte`, `Searching.ts`: the place highlighted, the fold opened for it. Proof: searching test, and a visual report of a place highlighted.
- [ ] 11. **Back links.** `Back_Links.svelte`, and in `Files.ts` the links gathered from every file's text and related. Proof: a visual report of a back link opening its file.
- [ ] 12. **Follow a link, judge a dead one, and walk the link stack.** `Following_Links.ts`, `Hierarchy.explore` and `likely_meant`, `Report.svelte`, `find_dead_links` in `Files.ts`. `Operations.ts` is two things: the stepping through the list, which stays kb's, and the stack of files reached by links that the steppers walk off the list, which goes. Proof: following_links test, and a visual report of a link followed and the steppers walking back.
- [ ] 13. **Make, rename, move and throw away a markdown file, links and index files mended.** `create_beside`, `rename`, `move` and `delete_one` in `Files.ts`, the file's four buttons in `Controls.svelte`, and the moves behind the title tools that went at step 7. Moving and throwing away a file are kb's; mending what pointed at it is not. Proof: a visual report of the four buttons.
- [ ] 14. **Mend index files.** `Index_Files.ts`, `repair_indexes` and `mend_indexes` in `Files.ts`, the index files button in `D_Repair.svelte`. Proof: index_files test, and a visual report of the repair button.
- [ ] 15. **Hand a file to Obsidian, a code file to VSCode, and a file into a message.** `obsidian_link` in `Saving.ts`, `Opening_Code.ts`, the compose button in `Controls.svelte`. Proof: opening_code test, and a visual report of the three hand-offs.
- [ ] 16. **The tests go with their pieces.** markdown_blocks, code_blocks, emphasis, searching, wiki_links, index_files, following_links, opening_code and tag_areas to the ai host, filters and core_alias stay kb's. labels is two things: its composing cases go, its label_changes cases stay. saving is two things: its site_of_file, file_path_of and reaches_under_work cases go, its address_of_file, renamed_path and moved_into cases stay. Every step ends with both suites and the db's checks clean. And every one of ov's 87 working feature rows is tried by hand on the ai host and ticked in memory/ai's working features file, ov's table with a first column added, done, holding a checkbox per row, the rows' words ov's, unchanged. ov is retired the day the last is ticked.

### music phases

1. **The folder picker.** kb's drop box, from the order's second item, handed a folder: dig through it.
2. **Where music files live in the db.** A row in the collections table, one per root folder. Its look is a longer interval than 3 seconds, or the OS's own reports, since a walk of tens of thousands of files does not carry over.
3. **What is read.** The file's own labels, artist, album and title. The kind `music` is hard wired for now.
4. **Play.** The player as music's operation view, the dispatcher streaming a file's bytes through a route of the music specialty's. mp4 plays as video. vob waits.

### music first

Decided 11 September 2026, the order above. The strip alone builds kb for a second host that is not designed. Until mu's plugin, streaming route and player are written, kb is ov taken apart and put back together for ai alone, and what music will need of kb is a guess. This proposal runs the other way: music's collection row, plugin, tag reader, streaming route and a first player first, on the dispatcher side, where the db is already generic, and the strip of ov second, once a real second host says what kb must be. ov is neither touched nor frozen through it: its fetch of `/all-labels` names no collection, and the dispatcher answers ai when none is named. The two hooks and big-picture.py read no collection column, so they change nothing either. What it costs: mu's first list, step 8, is thrown away when kb's list arrives, one component, **risk low**. What it saves: strip step 3 shrinks to 3a and 3c, and step 2's hand-over is designed with mu's keys, hierarchies and view real, not guessed.

1. **Answer music's questions.** The seven gathered under open questions as music first's, since steps 3 to 7 key on them. The five under kb wait for kb, and the rest for later. Proof: no open checkbox under music first's.
2. **The backup and the dump.** Step 3a as written, first, since every step below touches the live db and the dispatcher that ov, the hooks and every session use, **risk high**, held the same way: 3a's saved file, the dump, the three stable calls `PLACE`, `open_db` and `all_labels` keeping their names and their answers, and test-always-tag.sh after every save of database.py. Proof: as 3a says.
3. **The collections table.** Step 3b, with both kinds of row from the start: ai, its root the mono repo, and one music row per root folder, made by a route that adds a collection's row, which curl calls until kb's drop box exists. A file is keyed by its collection and its path relative to the root: the files table's UNIQUE on path becomes UNIQUE on collection and path, and the collection column, which today holds the project name that `collection_of` reads off the path, holds the collection's name. ai's paths are already off the repo's top, its root, so no path changes and step 3d is one UPDATE of the column, and the project is read off the path where it is asked for. `all_labels`, `all_fields`, `reconcile` and `/all-labels` answer for one collection, ai when none is named, so step 3e goes. Proof: test_database.py and test_dispatcher.py, test-always-tag.sh, test_big_picture.py, and the dump before against the dump after.
4. **The plugin.** The dispatcher imports `plugin.py` from the folder a collection's row names, mu's first: `mu/plugin.py` with the listing rule, files under the root ending mp3, m4a, flac, wav, shn, mp4, mpg, avi, mkv and vob, the jpg beside them, and archives, pdf and txt, as the music specialty says. ai's row names no plugin yet: `listed_files` serves ai until strip step 3c writes `ai/plugin.py`. Proof: test_dispatcher.py with a temp root holding a file of each ending, all listed, and ov's listing the same as before.
5. **The look for a big collection.** The six performance fixes under the db bullet of the kb list, and the music collection's look on a longer interval than 3 seconds, or the OS's own reports. The two under the files list bullet wait for kb. Proof: both db suites clean, a scan of the library, `/Volumes/muice myoozk`, 18,219 files, ending while the hub, ov and the hooks keep answering, and its seconds written into this file.
6. **The tag reader.** artist, album and title read from the file's own tags in mu's plugin inside the rules pass, written as rule, the kind music with them. Python's standard library reads no tags, and neither mutagen, a pip package reading mp3, m4a and flac tags, nor ffprobe is installed on this machine, 11 September 2026. mutagen unless step 1 says otherwise, and the plugin says how to install it when it is missing, as project goal says for unar. Proof: a test folder of files with known tags, each read into its rows, and a file with no tags given its name as title.
7. **The streaming route.** A route in mu's plugin, given a collection and a path: the whole file, or the range the browser asks for answered with 206 and those bytes, the content type by ending. Proof: test_dispatcher.py asking a range and getting those bytes, and the browser's audio element playing a file from it.
8. **A first player in mu.** In mu's operation view, in place of its one line: the collection's rows from `/all-labels`, grouped by artist then album, a click playing the file through the audio element for mp3, m4a and flac and the video element for mp4. No hierarchy component, no filters, no folds. Proof: a visual report of a song played.

After it, the order above: ov strip down with step 3 reduced to 3a and 3c, then kb's new work, then the music phases, of which 2, 3 and 4 are done by steps 3 to 8 and 1 is kb's drop box.

### threading the dispatcher, a proposal

Not decided. The performance fix under the kb list, the server threading its requests, with no mutex: sqlite's own write lock does the waiting, and a read waits on nothing. It answers the mutex pac in truth/decisions.md with neither side. Six lines.

1. **The server.** The threaded server in place of `HTTPServer`, at the import and at the base class, in dispatcher.py. Its request threads are daemon, so the restart route's exit is not held.
2. **The one read-then-write.** `reconcile` reads every row, then writes. Its block's first statement becomes `BEGIN IMMEDIATE`, so a second reconcile waits at the start, up to the connection's 5 seconds, then reads what the first left and finds nothing to do. Every other write in database.py begins with a write, an upsert or a delete, so sqlite already makes the second wait.
3. **Reads.** `PRAGMA journal_mode = WAL` at open, one line after the foreign keys line, so a read never waits while a write commits. WAL keeps two files beside the db, so the ignore line becomes `tools/hub/ov.db*`, and step 3a's saved file is made after a checkpoint, `PRAGMA wal_checkpoint`, or it is missing the last writes.
4. **RULED.** The sweep of rows gone from the disk iterates over `list(RULED)`, a snapshot, in place of the dict. Its reads and one-key writes need nothing.
5. **The test.** test_database.py starts the threaded server too, and one new check fires two rescans at once from two threads, both answering 200 and the db's rows the same after.

Proof: test_database.py and test_dispatcher.py clean, test-always-tag.sh, and three looks timed as today, 0.04 seconds each. Long work, music's scan and the ai call, stays outside this: a thread of its own, the kb list's other half.

## open questions

Every question this plan still needs answered, gathered from the music specialty and the proposals. adopt kb's three are in [adopt kb.md](adopt%20kb.md), under open.

### music first, step 1

The seven that steps 3 to 7 key on.

- [ ] every dropped folder is a collection of its own, for now
- [ ] a collection's name -> the folder's
- [ ] a song takes no tags at all
- [ ] Several artists on one file: one row each

#### can these wait?

- [ ] Is the title a label row, as decided, or the title field on the files row, which the list already shows for ai? One or the other, since kb's list draws the title from one place.
- [ ] Is the artist a source, the author of the file, rather than a label? The sources table holds an author and where it came from already.
- [ ] Which reader of a file's tags: python's standard library has none. A package, mutagen, or ffprobe run as a tool, the way unar would be.
- [ ] The threading proposal, decided or not, by step 5, which builds the six performance fixes.

### kb, after music first

The five under hierarchies and the operation view, which kb's list and editor frame answer.

- [ ] Is album nested under artist, artist then album then song, or a flat list of albums?
- [ ] Within an album, the songs in track order, which needs a track number the keys do not yet hold, or by name?
- [ ] Does a click play at once, or select, with a play button?
- [ ] Do the steppers walk to the next song and play it, so an album plays through?
- [ ] Cover art, from the file's tags: shown, and read by the same reader?

### leave these for later

- [ ] rules for the ai: proposed rules, under specialty, not decided.
- [ ] letter, for later: a hierarchy by first character, and of which label.
- [ ] vob, and mpg and avi, which the browser plays no better: ffmpeg once, into a cache, or as it plays? project goal's own open question.
