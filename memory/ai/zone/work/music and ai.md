# music and ai

kb is the library extracted from ov. mu and ai import kb to read music and ai files. ov is frozen forever, decided 12 September 2026 — every further change is made to ai, never ov. It stays as it is, a static reference of correctness: kb with the ai specialty must do everything ov does today, which is ov's working features, rows 1 to 89.

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

### ai's lexicon

Ticked when written into memory/ai's lexicon at step 4. It was, 12 September 2026.

## specialty

kb is a library, like panel and gallery. mu and ai are hosts — they import it. Each host provides a specialty — a schema, and some code.

### what it is

1. **collection information.** A row in the collections table of the host's own db: a name, the specialty's name, and a root folder on the disk. All paths are relative to that root. In ai every collection's root is the mono repo and the name alone differs, so a path stays what it is today, off the repo's top. A route reads or writes a file under the root only if the specialty's listing rule lists it, and refuses any other, the way today's routes refuse a path that is not a note. Collections are children of the root of the hierarchy.
2. **keys.** The labels a file of this specialty carries: for music, artist, album and title, each a row in the labels table written by the plugin inside the rules pass, so each row's who wrote this is rule, and the dispatcher's next look at the disk, which deletes every row on a changed file whose who wrote this is rule and makes new entries for what the rules give, makes new entries for these too instead of wiping them, and later letter. The kind is a file's: a hand or a rule gives it, or the plugin hard-wires one.
3. **plugin.** `plugin.py` in the host's folder, ai's or mu's, mono/ai or mono/mu, which the dispatcher imports from there, the folder its ports.json entry names. It reads and writes. Three jobs. Its listing rule says which files under the root are listed. On a file added or changed, inside the rules pass, it fills the labels as rule: music's reads the file's own tags, ai's reads the text for links and runs the content rules. And it carries the specialty's own routes, music's streaming among them. Its routes write files, as ai's save route does.
4. **hierarchies.** Which label a hierarchy groups by: music's are folder, artist, album and name, and later letter, ai's is the folders. Each host names them, kb draws the list from any of them.
5. **operation view.** What the operation view shows when a row is clicked: music's player, ai's editor. The host hands kb a snippet for it (the same way a host hands panel its snippets), and kb renders it with the clicked file.

Not kb's: the reading of a file's tags, the streaming of bytes, and vob. Those are the host's plugin's.

### ai specialty

The ai specialty is what ov does today, taken out of ov and made a host's: the markdown files of the memory system, the ones co and i read and write. The five things, and the code that comes with them:

1. **collection information.** One collection per project, as collection_of names them today: each memory folder, shared, core, ov and the rest, a project's own folder for its CLAUDE file, and shared for what sits at the repo's top. The mono repo is the root of every one.
2. **keys.** The five labels. kind and tag as rows in the labels table, written by hand, by a rule or by the ai. title, description, use_when and date as the four fields on the files row: those four are this specialty's and no other's. authors and from as rows in the sources table. The table below says what each holds.
3. **plugin.** Its listing rule is ov's today: every markdown file under memory, the CLAUDE files at the repo's top and one folder down, and a work note at a work folder's top or one folder down inside the named work folders, nothing deeper. On a markdown file added or changed it reads the links the file holds, so the back links can be worked out, and the db holds them, so ai reads no file at launch, where ov reads every file's text twelve at a time. It runs the content rules over it. It composes nothing. Its routes read a file's words and write them back, the ones ov's dispatcher has today.
4. **hierarchies.** One: the folders, the project folders on top under ai. The collection filter, kb's, narrows it by project, beside kind, tag and search, which looks in titles and descriptions, not content.
5. **operation view.** The editor: the file's words drawn from markdown, each piece opening for a change. The information rows, the db's fields as edit fields, with the title copied to and from the top heading and the file name. The kinds row and the tag areas. The back links. The search row.
6. **ai project code.** The steps under ov strip down: among them drawing markdown, composing labels for a bare file the first time it is opened, mending index files, following links and judging dead ones, opening a code file, and knowing the repo's note folders.

### music specialty

The music specialty is mu's: the files of a music library under a root folder i pick, anywhere on the disk. mu's own thinking is in its memory, [design](../../../mu/truth/design.md) and [project goal](../../../mu/zone/project%20goal.md), and the answers below draw on them. The five things, what is known of each, 11 September 2026. Each of its open questions is a substep of the plan's step that needs it, and the two for later are steps 30 and 31.

1. **collection information.** One row per root folder: the specialty's name, music, and the root, the folder dropped or picked. Every dropped folder is a collection of its own, for now, named for the folder, decided 11 September 2026. The library is the volume `/Volumes/muice myoozk`, decided 11 September 2026: an NTFS disk over USB, four top folders, Any Audio, HD Audio, MVE and MuSC-V, 18,219 files, 6227 of them flac, 1954 mp4, 1421 vob, and 3085 jpg beside them.
2. **keys.** artist, album and title, each a row in the labels table written by the plugin as rule, as what it is says. Several artists on one file, a duet, are one row each. The kind is one of four, music, images, text and video, decided 13 September 2026, one per file by its ending: music for mp3, m4a, flac, wav and shn, video for mp4, mpg, avi, mkv and vob, images for jpg, text for pdf and txt, the plugin giving it as rule. A song takes tags from a closed list of four, jazz, classical, rock and hifi, decided 13 September 2026, reversing no tags of 11 September: rows in the labels table, written by hand through the editor or by the ai, never by the plugin, since a file's own tags name none of the four.
3. **plugin.** `mu/plugin.py`. Its listing rule: under the root, files ending mp3, m4a, flac, wav, shn, mp4, mpg, avi, mkv and vob, the jpg cover art beside them, decided 11 September 2026, and archives, zip, rar and 7z, opened with unar, the one tool that opens all three, which the dispatcher runs and says how to install when it is missing, as project goal says. A pdf or txt beside a song is matched to the song by its name and attached to it. Its labels: the three, read from the file's own tags. Its routes: one that streams a file's bytes to the player, answering the range the browser asks for, and later one for vob, which runs ffmpeg on the dispatcher's side, since no browser plays MPEG-2.
4. **hierarchies.** Four now, by folder, by artist, by album and by name. Folder is the paths, as ai's. The other three group the rows by one label's value.
5. **operation view.** The player: the browser's own audio element for mp3, m4a and flac, its video element for mp4, inside kb's editor frame with the kinds row and the tag areas above it.
6. **mu project code.** What mu has today: the three files that draw panel, configured with its name alone, and its two bridges, Core.ts and Panel.ts. To come: a bridge to kb, the player as the operation view snippet, its filter sections, artist and album, `mu/plugin.py` with the tag reader and the streaming route, and its own build notes table.

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

### ai schema

Every key the ai specialty puts on a file, where it lives in the db, what it can hold, and who sets it.

| key                                        | lives in                                               | values                                                                                                                                                                                                                                                                                                                            | set by                                         |
| ------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| kind                                       | labels row, name kind                                  | one of five: analyze, arch, explain, howto, specify. music left the list 13 September 2026, mu's alone                                                                                                                                                                                                                             | hand, rule or ai; a hand kind wins             |
| tag                                        | labels rows, name tag, one per tag                     | the closed list of 39: always, born, build, data, debug, deploy, faster, geometry, incorporated, journal, keep, later, maybe, migrate, next, notes, now, plans, platform, port, program, proposal, prose, refactor, research, session, setup, soon, stale, style, tabled, team, test, tools, UX, vision, visual, waiting, weighed | hand, rule or ai; a tag shows whoever wrote it |
| title                                      | files row, field title                                 | one line, the human name, unique across every file                                                                                                                                                                                                                                                                                | hand, or composed from the first heading       |
| description                                | files row, field description                           | one sentence                                                                                                                                                                                                                                                                                                                      | hand, or composed from the first sentence      |
| use_when                                   | files row, field use_when, csv                         | phrases, as many as the file names, no closed list                                                                                                                                                                                                                                                                                | hand                                           |
| date                                       | files row, field date                                  | the last real change, year-month-day, or a date written out                                                                                                                                                                                                                                                                       | hand, or today when composed                   |
| author                                     | sources rows, one per author                           | names                                                                                                                                                                                                                                                                                                                             | hand                                           |
| came_from                                  | sources rows, beside each author                       | a url or a person                                                                                                                                                                                                                                                                                                                 | hand                                           |
| who wrote this                             | on every labels row, the column the code calls made_by | hand, rule or ai                                                                                                                                                                                                                                                                                                                  | whoever writes the row                         |
| project                                    | files row, in ai's db, as the file's collection        | the file's project (ov, ji and the rest), extracted from the path once when each file row is made or altered.                                                                                                                                                                                                                     | the dispatcher                                 |
| path, size, modified, fingerprint, missing | files row                                              | the disk's own facts about the file                                                                                                                                                                                                                                                                                               | the dispatcher's look                          |

### music schema

Every key the music specialty puts on a file, where it lives in the db, what it can hold, and who sets it. A row with a question is not decided.

| key | lives in | values | set by |
| --- | --- | --- | --- |
| kind | labels row, name kind | one of four, music, images, text or video, by the file's ending, decided 13 September 2026 | the plugin, as rule |
| artist | labels row, name artist | the artist tag in the file, one row per artist, a duet two rows | the plugin, as rule |
| album | labels row, name album | the album tag in the file | the plugin, as rule |
| title | labels row, name title, or the files row's title field? | the title tag in the file, or the file's name when the tag is empty | the plugin, as rule |
| tag | labels rows, name tag, one per tag | the closed list of four: jazz, classical, rock, hifi, decided 13 September 2026 | hand or ai; a tag shows whoever wrote it |
| who wrote this | on every labels row, the column the code calls made_by | rule for what the plugin writes, hand for what a hand adds | whoever writes the row |
| collection | files row, in mu's db | the root folder's row, one per root | the dispatcher |
| path, size, modified, fingerprint, missing | files row | the disk's own facts, the fingerprint by size and time first for a big file | the dispatcher's look |
| description, use_when, date | files row | empty for music, the four fields being ai's | nobody |
| author, came_from | sources rows | empty, unless the artist is the author? | nobody yet |

## proposed rules

Not decided, its pac is in zone/proposals.md. The ai is the third writer of labels: rows whose who wrote this is ai, which ov passes over until one is accepted, and ji's top idea says how they are accepted. The rules table holds patterns, each tried against a name, a location or a content and giving one label. The ai reads what a plugin hands it instead, so its rules are instructions, plain words, not patterns. The mechanism is kb's, the same for every specialty. What each specialty puts into it is its own.

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

A song takes tags from a closed list of five, tag area genre -> {jazz, classical, rock}, tag area quality -> {low and high}, decided 13 September 2026, so the scan has tags to give a music file, and these rules apply. 

1. **The instructions.** No kind, since the plugin gives it by the file's ending. The five tags, with one line each on when it applies, and the answer, the tags as csv.
2. **What is sent.** A music file has no words: its name, its path and the three tags the reader found.
3. **What must be supplied by hand.** artist, album and title are the tag reader's rule rows. A file with empty tags is its name and folder, and a rules row gives one fixed value, so that is mu's plugin's parsing, not a suggestion.
4. **Scale.** One call per changed file over tens of thousands, so no rerun button, and the first scan of a library makes no calls: files changed after the checkbox is turned on alone.

Purpose: a song gets the tags a hand would give it. Goal: the same count, of the first fifty.

## plan

One list of steps, in the order they are done and now numbered, re-decided 12 September 2026: ai first. The answered questions and the shared ground first, steps 1 to 3, since both sides need them; then the strip of ov, steps 4 to 19, the plugin mechanism arriving at step 6 with ai's plugin as its first customer; then music, steps 20 to 24; then kb's new work, 25 to 27, the drop box, 28, mu adopts kb, 29, and three for later, 30 to 32. Each step names its proof, and a decision a step needs is a substep before its work, and where it has one, its risk. A step with parts has them as substeps.

### first, steps 1 to 3

Both sides need these, so they lead whatever order the rest runs in.

### ov strip down, steps 4 to 19

The steps that take ov down to kb, in order, each naming the ov file that does the thing today. Every step ends the same way: kb runs without the piece, the ai host does it, and ov still does what it did. Each step names its proof: a suite, or a visual report naming what to look at. A piece that can be written over plain words before it moves is, and gets a test then. Steps 9, 10, 14 and 16 are proved by looking alone, **risk medium**: a fault passes a look and turns up later, and nothing is lost when it does. The 89 rows ticked by hand at the end hold it.

#### next

- [x] 15. **Follow a link, judge a dead one, and walk the link stack: kb keeps all three.** Rewritten 15 September 2026; nothing moves. Proved the same day: the following_links test among kb's 176; headless, the finished truth's link to code debt followed and the back stepper returning, the stack of one walked; the visual report pending.
    - `Following_Links.ts`, `Hierarchy.explore` and `likely_meant`, `find_dead_links` in `Files.ts` and `Report.svelte` stay kb's: the files manager reads every guide's links at launch, and a music file has none, so the readers cost mu nothing.
    - `Operations.ts` stays whole, the stepping through the list and the stack of files reached by links: only `follow_link` fills the stack, and the host's renderer calls it through the bridge.
    - Proof: following_links test as it is, a headless follow of a link and the steppers walking back, and a visual report of the same.
- [x] 16. **Make, rename, move and throw away a markdown file, links and index files mended: kb keeps all of it.** Rewritten 15 September 2026; nothing moves. Proved the same day headless: a throwaway file made beside drive.md through the new button, renamed through the name field, dropped onto ai's zone/work folder row with the page's own drag events, and thrown away through the delete question, the disk and the db checked at each step; the visual report pending.
    - `create_beside`, `rename`, `move` and `delete_one` in `Files.ts`, the file's four buttons in `Controls.svelte`, new, obsidian, send and delete with the delete question, and the rename behind the title tools that went at step 10.
    - Mending what pointed at a renamed or moved file is kb's too: it reads the link map kb builds at launch and follows each link with kb's own explore. Index files are step 17's.
    - Proof: headless, a throwaway file made beside a real one through the new button, renamed through the name field, moved by a drop onto a folder and thrown away through the delete question, the page's log read at each step and the disk checked; and a visual report of the four buttons.
- [x] 17. **Mend index files: kb keeps all of it.** Rewritten 23 September 2026; nothing moves. `Index_Files.ts`, `repair_indexes` and `mend_indexes` in `Files.ts`, the index files button in `D_Repair.svelte`: the mending is called from kb's own create, rename, move and delete, which step 16 kept, so it is kb's with them, and a music file's folder has no index to mend. Proved the same day: the index_files test, 38 among kb's; and the repair button pressed headless, the page's log read after: 116 folders looked at, 33 already right, 16 mended, 51 index files made, 16 refused as not guides, 33 links put right, 7 taken out, 27 added. The press wrote those 67 files into memory for real; kept or reverted is Jonathan's call.
- [ ] 18. **Hand a file to Obsidian, a code file to VSCode, and a file into a message.** `obsidian_link` in `Saving.ts`, `Opening_Code.ts`, the compose button in `Controls.svelte`. Proof: opening_code test, and a visual report of the three hand-offs.
- [ ] 19. **The tests go with their pieces.** Rewritten 15 September 2026 from the reading before it. 
    - After steps 14 to 18, whose pieces the tests belong to; nothing here moves before them. 
        - Begun the same day: `memory/ai/truth/working features.md` is made, 94 rows, none ticked; the tests wait.
    - To ai, with their pieces: following_links at step 15, index_files at step 17, opening_code at step 18. 
        - Gone already: tag_areas at step 7 with its lists, markdown_blocks, code_blocks and emphasis at step 11 with the drawing, labels' composing cases at step 12, searching at step 13 with the search.
    - Staying kb's, seven: core_alias, customizations, filters, tag_rows, wiki_links with plain_links and the two other link readers, labels with its writes, a brand new guide, a free name and a moment written out, and saving with address_of_file, renamed_path and moved_into; its reaches_under_work cases went at step 6, and its site_of_file, file_path_of and folder_path_of cases go at step 25 with those functions.
    - Every step ends with kb's and ai's suites, core's where core changed, and the dispatcher's tests clean.
    - `memory/ai/truth/working features.md` is made here: ov's table, every row as ov's words it, with a first column added, done, holding a checkbox per row. 
        - ov's table holds 94 rows today, numbered to 95 with 20 missing, six of them, 90 to 95, written for kb's and ai's own features this week. 
        - Every row is tried by hand on the ai host and ticked. ov is retired the day the last is ticked.

### music, steps 20 to 24 — after the strip, re-decided 12 September 2026

The 11 September decision ran music first, so a real second host would say what kb must be before the strip. Re-decided 12 September 2026: ai first is better. The cost the reversal accepts is the one the old order avoided: until these five steps run, what music needs of kb is a guess, and the hand-over is designed from ov and ai alone — music's keys, hierarchies and view arrive after, and may reshape it.

- [ ] 20. **The plugin.** The dispatcher imports `plugin.py` from the host's folder, which its host list names — the mechanism is built at step 6 with ai's plugin as its first customer, mu's coming here: `mu/plugin.py` with the listing rule, files under the root ending mp3, m4a, flac, wav, shn, mp4, mpg, avi, mkv and vob, the jpg beside them, and archives, pdf and txt, as the music specialty says, its calls wrapped as step 6 wraps ai's. Proof: test_dispatcher.py with a temp root holding a file of each ending, all listed, and ov's listing the same as before.
- [ ] 21. **The look for a big collection.** **Risk low** with step 2's four guards, high without, since 21b, 21c and 21f change database.py: first `ov.db` is saved as `tools/hub/ov.db.before-step-21`, then through the step `PLACE`, `open_db` and `all_labels` keep their names and answers, and test-always-tag.sh is run after every save of database.py. Six performance fixes on the dispatcher side, each a substep, and the music collection's look on a longer interval than 3 seconds, or the OS's own reports. The two on the list's side are step 27. Proof: both db suites clean, a scan of the library, `/Volumes/muice myoozk`, 18,219 files, into mu's db, ending while the hub, ov and the hooks keep answering from ov's, and its seconds written into this file.
    - [ ] 21a. **One walk per look**, shared by reconcile and the rules, with a per-folder time check before any stat.
    - [ ] 21b. **One db connection per thread**, the schema checked once, and a pass's per-file writes in one transaction.
    - [ ] 21c. **The fingerprint by size and time first**, a hash only for a candidate match, and for a big file the first and last megabyte.
    - [ ] 21d. **`/all-labels` answered per collection**, the columns the list needs first and the rest on open.
    - [ ] 21e. **question** thread the dispatcher here, six lines and no mutex, the pac in zone/proposals.md, or with the first caller that holds it long?
    - [ ] 21f. **The server threading its requests**, and long work, a scan or a dump, in a thread that answers progress. With no mutex: sqlite's own write lock does the waiting, and a read waits on nothing, which answers the mutex pac in zone/proposals.md with neither side. Six lines. The server: The threaded server in place of `HTTPServer`, at the import and at the base class, in dispatcher.py. Its request threads are daemon, so the restart route's exit is not held. The one read-then-write: `reconcile` reads every row, then writes. Its block's first statement becomes `BEGIN IMMEDIATE`, so a second reconcile waits at the start, up to the connection's 5 seconds, then reads what the first left and finds nothing to do. Every other write in database.py begins with a write, an upsert or a delete, so sqlite already makes the second wait. Reads: `PRAGMA journal_mode = WAL` at open, one line after the foreign keys line, so a read never waits while a write commits. WAL keeps two files beside each db, covered by step 2's ignore line, and a saved file is made after a checkpoint, `PRAGMA wal_checkpoint`, or it is missing the last writes. RULED: The sweep of rows gone from the disk iterates over `list(RULED)`, a snapshot, in place of the dict. Its reads and one-key writes need nothing. The test: test_database.py starts the threaded server too, and one new check fires two rescans at once from two threads, both answering 200 and the db's rows the same after. Proof: test_database.py and test_dispatcher.py clean, test-always-tag.sh, and three looks timed as today, 0.04 seconds each.
    - [ ] 21g. **A rule change rerun for its own reads alone**, and content rules skipped for a specialty whose files are not text.
    - [ ] 21h. **The library's own row**, added here and not at step 20, since one walk of it with a stat per file takes 30 seconds, timed 11 September 2026.
- [ ] 22. **The tag reader.** artist, album and title read from the file's own tags in mu's plugin inside the rules pass, written as rule, the kind with them, one of mu's four by the file's ending. Python's standard library reads no tags, and neither mutagen, a pip package reading mp3, m4a and flac tags, nor ffprobe is installed on this machine, 11 September 2026. mutagen unless step 1 says otherwise, and the plugin says how to install it when it is missing, as the mu project goal says for unar. Proof: a test folder of files with known tags, each read into its rows, and a file with no tags given its name as title.
    - [ ] 22a. **question** the title's home: a label row, as decided, or the title field on the files row, which the list already shows for ai? One or the other, since kb's list draws the title from one place.
    - [ ] 22b. **question** the artist's home: a label row, or a source, the author of the file? The sources table holds an author and where it came from already, and a hierarchy groups by a label's value.
    - [ ] 22c. **question** the reader, since python's standard library reads no tags: mutagen, a package, or ffprobe run as a tool, the way unar would be. mutagen unless said otherwise.
    - [ ] 22d. **Read the tags.** The reading as this step says, into the homes 22a and 22b chose, with the reader 22c chose.
- [ ] 23. **The streaming route.** A route in mu's plugin, given a collection and a path: the whole file, or the range the browser asks for answered with 206 and those bytes, the content type by ending. Proof: test_dispatcher.py asking a range and getting those bytes, and the browser's audio element playing a file from it.
- [ ] 24. **A first player in mu.** In mu's operation view, in place of its one line: the collection's rows from `/all-labels`, grouped by artist then album, a click playing the file through the audio element for mp3, m4a and flac and the video element for mp4. No hierarchy component, no filters, no folds. Proof: a visual report of a song played.

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

### mu adopts kb, step 29

- [ ] 29. **mu adopts kb.** The sixth item of the music specialty: a bridge to kb, mu's App.svelte drawing kb's page with mu's snippets, the player as the operation view snippet in place of step 24's first list, its filter sections, artist and album, its configured host, its four tags and their area, and its own build notes table. Proof: mu's alias test, that only its bridges name a library, and a visual report of the library browsed by artist and album and a song played.
    - [ ] 29a. **question** what a click does: play at once, or select, with a play button?
    - [ ] 29b. **question** what the steppers do: walk to the next song and play it, so an album plays through, or step alone?
    - [ ] 29c. **question** cover art: shown, from the file's tags, read by the same reader, or not?
    - [ ] 29d. **question** the tag area for mu's four tags, since kb draws tags by area: one area holding the four, or two, jazz, classical and rock as one and hifi as another?
    - [ ] 29e. **Build the player** as the music specialty's operation view says, with 29a to 29d in it.

### later, steps 30 to 32

- [ ] 30. **vob, mpg and avi.** A route in mu's plugin that runs ffmpeg on the dispatcher's side, since no browser plays them, as the mu project goal says. Proof: a vob played in the browser.
    - [ ] 30a. **question** when ffmpeg runs: once, into a cache, or as it plays? mu project goal's own open question.
    - [ ] 30b. **Build the route** the way 30a chose.
- [ ] 31. **The letter hierarchy.** A fifth music hierarchy, by first character, as what it is names. Proof: a visual report of the list by letter.
    - [ ] 31a. **question** of which label: artist, album or title?
    - [ ] 31b. **Build it** as step 26 built the others.
- [ ] 32. **Rules for the ai.** The proposed rules section, common, ai's and music's, since a song takes four tags since 13 September 2026. Proof: as proposed rules says.
    - [ ] 32a. **question** whether to build them at all, the pac in zone/proposals.md: 13 bare files of 346 today, each composed the first time it is opened.
    - [ ] 32b. **Build them** as proposed rules says.
