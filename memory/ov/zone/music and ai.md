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

- [x] **host** — ai or mu, they import the kb library (later ji as well)
- [x] **collection** — a folder of files (mu -> the folder dropped, aka the root; ai -> each project inside mono)
- [x] **db** — a host's sqlite file beside the dispatcher, ov.db, mu.db
- [x] **dump** — ov.sql or mu.sql, one per host, every table of the db as statements, from which a db is rebuilt
- [x] **author** — the name of who wrote a file (a person or a tool: jonathan, Jeff, co, big-picture.py). In `ai`, it is often entered by hand in the editor's information rows, thereafter taken as SOT, never verified. In `mu`, it can be the artist's name: whether the artist is a source or a label is 22b's question.
- [x] **plugin** — `plugin.py` in a host's folder, the code the dispatcher imports and runs for that host: its listing rule, its labeler and its own routes. The snippets and the configuration are the host's page's to hand kb, not the plugin's. Together with them it makes the host's specialty.

### ai's lexicon

Ticked when written into memory/ai's lexicon at step 4. It was, 12 September 2026.

- [x] **project** — essentially the same as a collection

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

The music specialty is mu's: the files of a music library under a root folder i pick, anywhere on the disk. mu's own thinking is in its memory, [design](../../mu/truth/design.md) and [project goal](../../mu/zone/project%20goal.md), and the answers below draw on them. The five things, what is known of each, 11 September 2026. Each of its open questions is a substep of the plan's step that needs it, and the two for later are steps 30 and 31.

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

- [x] 1. **Answer music's questions.** The four that steps 3 and 20 key on, answered 11 September 2026: every dropped folder is a collection of its own, for now, named for the folder, a song takes no tags, reversed 13 September 2026 to four, jazz, classical, rock and hifi, and several artists on one file are one row each. Every other open question is a substep of the step that needs it. Proof: no open checkbox here.
- [x] 2. **The backup and the dump.** Built 12 September 2026: `ov.db.before-step-2` saved, the ignore line widened, `/dump` and `/restore` in the dispatcher with `write_dump` and `restore` in database.py, `ov.sql` written and read back into `ov.restored.db`, every label the same, 125 checks in test_database.py and 39 in test_dispatcher.py, the always test and big-picture clean. The issue: the db is the SOT and the only home of every label. When the db goes, all the labels go. This is the fix. It creates two artifacts ( `ov.db.before-step-2` and `ov.sql`). Either one can restore the labels.
    - The **saved file**: `tools/hub/ov.db` is saved beside itself as `tools/hub/ov.db.before-step-2`, and after an error it is put back in place of `ov.db`, kept until step 3's ending holds, and every later step that touches a db does the same with its own number.
        - No db enters git, and the ignore line widens to `tools/hub/*.db*`.
    - The **dump**: a `/dump` route writes every table as plain text to `tools/hub/ov.sql`, committed at each step's ending, so the labels live in git even though `ov.db` does not, and after an error that the saved file does not cover, a lost disk, the dump is read back into a new db.
        - The dump is a **list of statements**, one that makes each table and one that inserts each row.
        - `ov.sql` is saved into git.
        - A dump needs to be verified, so a second request to the dispatcher makes an empty db file, named in the request, and runs those statements on it. The new file then holds every table and row the live db held when the dump was written. It is made in the dispatcher's own folder and nowhere else, and it never writes `ov.db`, the live db, whatever the request says.
        - Proof: a dump read back into `tools/hub/ov.restored.db` answers every label the same as `ov.db`.
    - Nothing below touches `ov.db` without `ov.db.before-step-2` in place.
        - With this step, we avoid the **high risk** of loss of every label (at steps 3, 6 and 21, the ones that touch `ov.db` or `database.py`)
        - Four things minimize the risk.
            - The saved file and the dump persist the labels, as backup.
            - Two hooks read the db on every turn:
                - inject-always.sh, which finds the files tagged always and puts them in front of me
                - test-always-tag.sh, which checks that it can
            - Both hooks reach into database.py for three things
                - `PLACE` — where the db is
                - `open_db` — how to open it
                - `all_labels` — every label on every file
                - To keep both hooks working, those three must keep their names and answer as they do today
        - A breakdown will show at once using `test-always-tag.sh` — run after every save of database.py, before the next message.
- [x] 3. **One db per host, and the collections table.** Built 12 September 2026: `ov.db.before-step-3` saved, ports.json names `ov.db` under ov and `mu.db` under mu, `HOSTS` and `place_of` in database.py with every call taking a host and `open_db` given its file, the collections table with `collections`, `ensure_collections` and `add_collection`, the dispatcher's `host` parameter on every db route, `/collections` and `/add-collection`, and the look making a row per project, 14 on the day. A files row naming a collection the listing no longer has, memory/filter tree, 23 missing files, got no row. Proof: 157 checks in test_database.py with two dbs and 45 in test_dispatcher.py, the always test and big-picture clean, and ov's dump after against its dump before differs by the 14 collections rows alone, 1116 labels in each.
    - The four guards added during step 2 dropped the **risk** to low.
    - To begin, `ov.db` is duplicated as `tools/hub/ov.db.before-step-3`.
        - `PLACE`, `open_db` and `all_labels` keep their function names and answers
        - test-always-tag.sh is run after every save of database.py
    - Change `open_db` to expect to be given a file to open
    - Change every `database.py` call to expect to be given a host (ai or mu)
        - this accesses that host's db (eg, add_label, all_labels, reconcile, ...)
        - a call that doesn't mention a host — accesses  `PLACE`
        - The host list is ports.json: each host that has a db gets a db entry beside its port, `ov.db` under ov and `mu.db` under mu. A request names its host with a host parameter, ov when none. At step 3 the hosts are ov and mu, since ai has no entry until step 4 makes the project. Step 4 gives ai an entry naming `ov.db` as well, so ov and ai read one db until ov is retired at step 19.
    - The collections table — one row per collection
        - On the day of step 3, one row per collection already named on the files rows, ov, ji, shared and the rest. After that, the look adds a row the first time `collection_of` names a new one.
        - in the mu host, each is a dropped folder.
        - in ai, each is a project, ov, kb, mu and the rest, and the mono repo is the root of every one
    - Each file has a unique key — its path relative to its collection's root
    - Step 3 changes none of the existing data in `ov.db`.
        - It adds the collections table beside the four tables and teaches database.py which file to open.
    - Every answer comes from a host's single db.
        - `all_labels`, `all_fields`, `reconcile` and `/all-labels`
    - Proof: test_database.py and test_dispatcher.py with two dbs, test-always-tag.sh, test_big_picture.py, and ov's dump before against its dump after.

### ov strip down, steps 4 to 19

The steps that take ov down to kb, in order, each naming the ov file that does the thing today. Every step ends the same way: kb runs without the piece, the ai host does it, and ov still does what it did. Each step names its proof: a suite, or a visual report naming what to look at. A piece that can be written over plain words before it moves is, and gets a test then. Steps 9, 10, 14 and 16 are proved by looking alone, **risk medium**: a fault passes a look and turns up later, and nothing is lost when it does. The 89 rows ticked by hand at the end hold it.

- [x] 4. **The two new projects.** Built 12 September 2026: mono/kb holds ov's src whole, App.svelte under the name Main.svelte and no main.ts, its core_alias.test proving one bridge, and mono/ai holds main.ts, App.svelte, Customizations.ts, `Core.ts` and `Kb.ts`, with a port, 5187, a db entry naming `ov.db` and a servers entry, both in mono's workspaces, ai's CLAUDE file in mono/ai and kb's in mono/kb, memory/kb and memory/ai each with a lexicon and a map, adopt kb.md moved to memory/kb/zone. Proof: kb check clean at 532 files and ov's suite 338 passing in it, ai check clean at 524 files, its core_alias test 5 passing, and ai builds. The hub page's button, under H, was added after, 13 September 2026. Not done, since the step does not name it: the dispatcher's COLLECTIONS, which lists neither new CLAUDE file until step 6 replaces it. 
    - A kb project, a library with its alias and bridge as libraries.md says, holding all of ov's code, its page, ov's App.svelte, under the name Main.svelte, gallery's name for the same thing.
    - An ai project, an empty host that imports kb and draws that page, the way mu draws panel: a main.ts, an App.svelte, a Customizations.ts and the bridges, nothing more. 
    - A library has no entry file, so ai's main.ts does what ov's does today, through kb's bridge, as libraries.md's fifth rule asks: reads the remembered colors into core's stores, pushes the layers, the sizes and the inks onto the page, hangs the guides before the app shows, and mounts the page. 
    - ai with a port, a db entry naming `ov.db` in ports.json, so ov and ai read one db until ov is retired, and a servers entry, kb with none of the three, as gallery has none. 
    - Each with a CLAUDE file in its code folder, mono/kb and mono/ai, where ov's and mu's sit, and a memory folder, memory/kb and memory/ai, holding a lexicon with the entries above written in, and a map, memory/kb holding adopt kb.md too, moved from memory/ov/zone. memory/ov stays with ov, the reference. 
    - What kb and ai need of it is written again in memory/kb and memory/ai, and memory/ov keeps every file it has. 
    - ov is frozen forever, from 12 September 2026 — before this step, not at it: no change to ov, and every further change is made to ai (or kb, once the piece is kb's), never ov. It is retired the day step 19 ends. Three copies of the code live until then, **risk low**: the rule is one line, and an error is a fix made twice. Every step below moves one piece from kb to ai, so ai fills as kb empties, save 5, 6, 8 and 9, which build the hand-over and change the dispatcher and a prefix. 
    - Proof: both new projects check clean, ov's suite passes in kb save core_alias.test, rewritten for kb's chain as libraries.md asks, its one bridge, to core, panel's arriving at step 5 when Main.svelte draws panel, and ai's own core_alias test proves its bridges to core and kb, exactly one file per library reaching through its alias, panel's alias carried for the build and named by no file.
- [x] 5. **The hand-over, two ways.** Built 13 September 2026: kb's Customizations.ts, the eight facts with defaults naming no host, and Panel.ts, its second bridge, with the panel alias in its tsconfig and vitest config; Main.svelte draws panel and hands it kb's own four, Controls.svelte less the hamburger, Details.svelte and Operation.svelte inside panel's regions, and Status.ts's words and offer; Main.svelte takes the host's four snippets and hands each down to its place, the browse filter after tag in Browse_Filters.svelte, the edit filter section between the kinds and the tags in Edit_Filters.svelte, the details section below the rules in Details.svelte, and the operation view below the label form in Edit.svelte; Saving.ts sends the configured host with every ask; panel draws core's status line with the offer passed through; ai's main.ts fills name, prefix, host, hierarchies and the build notes table, builds.md moved to ai, before anything mounts. Proof: kb check clean at 541 files and 343 tests, core_alias proving two bridges and customizations.test every default naming no host, ai check clean at 532 files and building, panel 414, gallery 480, mu 417, lv 406 and mj 480 clean. Not looked at in a browser. 
    - The facts as configuration: one object kb declares in its common folder, which the host's main.ts fills before anything mounts, the way lv and mj fill gallery's customizations, and every kb module reads when asked, holding the name the controls row shows, the host's name, which ports.json pairs with its db, the keys, the hierarchies, the preferences prefix and the build notes table, `ov/src/lib/md/builds.md` today, the table of builds that the build button in the controls row opens, one per host. 
    - The drawing as snippets: the host's App.svelte draws kb's page, Main.svelte, the component that draws panel and hands it kb's own snippets, and hands it snippets, two for its filter sections, browse and edit, one for its details section, and one for its operation view, which kb renders with the clicked file, the way gallery's Main.svelte hands panel its snippets. 
    - Where a host hands no snippet, kb draws nothing there, once the piece has moved: until the step that moves a piece, kb draws it as today, so the editor's words stay on screen from here to step 11. 
    - Its design comes before any code, proposed in [adopt kb.md](../../kb/zone/adopt%20kb.md), decided 11 September 2026 to be written now, moving to memory/kb at step 4: the type kb declares, one field per fact, the four snippets with their arguments, the browse filter section and the details section taking nothing, the edit filter section taking the clicked file, the operation view taking the clicked file, the width and the height, and the panel region each renders in. 
    - The step ends when the ai host compiles against it. 
    - Every step below moves a piece into one or the other. Proof: kb's check clean with the ai host's specialty in.
    - **kb's second bridge.** `common/Panel.ts`, the panel alias in kb's tsconfig.json and vitest.config.ts, and core_alias.test proving two bridges, Core.ts and Panel.ts.
    - **What kb hands panel.** Panel.svelte takes four things: the right end of the controls row, the details column given its width, the operation view given its width and height, and words for the status line. 
        - kb's Main.svelte hands it Controls.svelte less the hamburger, which panel draws and whose press toggles kb's w_show_details, Details.svelte, Operation.svelte, and Status.ts's words, the offer as 5c decides. 
        - Panel's row keeps the host's name in its middle and renders the snippet at its right end, and kb's row while a file is open holds the file's own section across the row, so the name yields while a file is open, decided 13 September 2026.
    - **What ai fills at step 5.** name, host, hierarchies, folder alone, and builds, its own builds.md moved from kb. kinds, tags and tag_areas are filled since step 7, 13 September 2026, and prefix is read at step 9. 
        - Saving.ts sends the configured host with every ask from this step, so ai's asks name ai, whose ports.json entry names `ov.db`.
    - [x] 5a. **question** where the host's browse filter sits among kb's, answered 13 September 2026: browse has filters above its list of files, search first, then collection, kind and tag, and a host's browse section is a filter among them, after tag, last above the list.
    - [x] 5b. **question** what a configured hierarchy names, answered 13 September 2026: the label and its order within a group, which music's track order would need.
    - [x] 5c. **question** the status line's offer, answered 13 September 2026: panel uses core's status line, which carries the offer already, its props status, offer, ontake, onhide and onreport, in place of panel's own line of words, so kb's offer passes through panel. A change to panel, which gallery, lv, mj and mu draw.
    - [x] 5d. **Build the hand-over** as adopt kb.md says, with 5a, 5b and 5c in it. Built 13 September 2026, above.
- [x] 6. **The ai plugin, and which folders of the repo hold notes.** The dispatcher side and the page side, as plugin api says. Built 13 September 2026: `ov.db.before-step-6` saved. `ai/plugin.py` with SPECIALTY, listed_files, is_listed and labels, its list of note folders gaining ai and kb. In the dispatcher PLUGINS, load_plugins, plugin_for, call_plugin, files_listed_by and listed_by in place of listed_files, is_listed_note and COLLECTIONS, the import and every call wrapped, ov's asks going to ai's plugin, the look writing the plugin's specialty on the collections rows, and the rules pass taking the plugin's labels and running with no rules too. all_fields carries each file's collection. On the page WORK_FOLDERS, reaches_under_work and the listed line in site_of_file are gone, and Fields gains collection. Proof: test_database.py 166, a stub plugin raising on one file failing that file alone, test_dispatcher.py 47, the two new CLAUDE files listed and the fields carrying collections, the listing after against before differing by ai/CLAUDE.md and kb/CLAUDE.md alone, 497 files, the always test, big picture 15, kb check clean at 541 files and 334 tests, ai 532 and building. Not looked at in a browser.
    - **Risk low** with step 2's four guards, high without: first `ov.db` is saved as `tools/hub/ov.db.before-step-6`, then through the step `PLACE`, `open_db` and `all_labels` keep their names and answers, and test-always-tag.sh is run after every save of database.py, which changes here: the fields answer gains each file's collection.
    - **The dispatcher side.** `ai/plugin.py` is made, the first plugin, mu's coming at step 20, with the four functions every plugin has, the plugin api's first four rows: the specialty, ai, the listed files, ov's listing rule today with its list of note folders gaining ai and kb, so their two CLAUDE files are listed as step 4 promised, is listed, ov's refusal of a path that is not a note today, and labels, answering none until step 14. The dispatcher imports it from the host's folder its host list names, mono/ai, and wraps the import and every call, so a fault in one fails that file or that request, said in the log, and never the server: a plugin that fails to import leaves its host's listing empty and the server up. In the dispatcher `listed_files`, `is_listed_note` and `COLLECTIONS` go: the look, `/list-files` and every route that reads or writes a file ask the host's plugin, and the look writes the plugin's specialty on the collections rows it makes, in place of the word ai written into the dispatcher. A request that names no host, ov's, goes to ai's plugin, since ov and ai share `ov.db` until step 19. ai's own four, read, save, scan and strip, come at step 8.
    - **The page side.** What mirrors the listing rule goes, since the dispatcher's listing is the whole truth from here: `WORK_FOLDERS` and `reaches_under_work` in `Saving.ts`, and the one line inside `site_of_file` that says a work note deeper than the named folders is not listed. `/all-labels` carries each file's collection beside the four fields from this step, and `/collections` each collection's root, for step 25 to read. The bundle design stays until then: `T_Bundle` and `project_at` in `File.ts`, the project list the projects row draws and the hierarchy hangs every file from, and `file_path_of` and `site_of_file` in `Saving.ts`, its two halves, a bundle and a path to a repo path and back, thirty-five call sites in eight files. The reaches_under_work cases in saving.test go here, not at step 19.
    - Proof: test_dispatcher.py listing the same files as before and `/all-labels` carrying each file's collection, a plugin that raises on one file with the rest listed and the server still answering, test-always-tag.sh, test_big_picture.py, kb's check and suite clean, and a visual report of the list and the editor in ai unchanged.
- [x] 7. **The vocabulary.** Built 13 September 2026: ai's Customizations.ts holds the five kinds, the 39 tags and the ten tag areas, and ai's main.ts hands them to kb's configuration before anything mounts. T_Kind, ALL_TAGS and TAG_AREAS left File.ts and Tag_Areas.ts, kb's kind is a word, its readers, Browse_Filters, Edit_Filters, Files.ts, Filters.ts and Labels.ts, read customizations.kinds, tags and tag_areas, area_of and tags_without_area take the lists, and KIND_UNTIL_TOLD is the word analyze until step 12. The tag areas test moved to ai, reading ai's lists through kb's functions, and kb's labels test declares the words it reads off blocks. Proof: kb check clean at 540 files and 324 tests, ai check clean at 533 files, 15 tests with the tag areas test among them, and ai builds. Looked at 13 September 2026, the kinds row and the tag areas in ai: confirmed. The five kinds ai keeps of `T_Kind`'s six, analyze, arch, explain, howto and specify, music dropped as 7a says, the 39 tags in `File.ts` and the ten tag areas in `Tag_Areas.ts`: the ai specialty's keys, handed to kb's kinds row and tag areas as the configuration's kinds, tags and tag_areas, which ai's Customizations.ts fills from this step and every kb file that reads the three reads in their place. 
    - `T_Kind` is a type as well as a list, so kb's kind becomes a word: the kind on a file, the kind picked in browse and the kinds row hold a word off the configured list. 
    - Labels.ts's fallback kind, `T_Kind.analyze`, ai's word, waits for step 12, which moves the composing. 
    - The tag_areas test goes to ai here with the lists, since against kb's empty defaults it proves nothing. is_design is the bundle design's, computed by site_of_file, and goes at step 25. 
    - Proof: tag_areas test in ai, kb's check and suite clean, and a visual report of the kinds row and the tag areas in the ai host.
    - [x] 7a. **question** whether music stays among ai's six kinds, answered 13 September 2026: no. ai's kinds are five, and music is mu's alone, one of mu's four, which the plugin gives by the file's ending.
    - [x] 7b. **Hand the keys over** as this step says, with 7a in it. Built 13 September 2026, above.
- [ ] 8. **The dispatcher's markdown routes.** `/read-guide`, `/save-guide`, `/scan` of a label block and `/strip-block`: they are written into `ai/plugin.py` as well, made at step 6, and stay at the dispatcher until ov is retired: the dispatcher hands a route to a plugin only where a plugin claims it, so once ai's plugin claims a route, the plugin answers every caller, ov included, and the dispatcher's own code for that route is kept unreached until ov is retired, then taken out. One db, one dispatcher. The importing of a plugin is step 6's, not this step's. Proof: test_dispatcher.py run from ov's folder and from ai's, each with its own paths.
- [ ] 9. **The preferences prefix.** `Preferences.ts`'s ov_ becomes the host's, read off the configuration, one prefix each, so kb's hosts remember apart. Proof: a visual report, a preference surviving a reload in each host and not crossing between them.
- [ ] 10. **The four fields' rows in the label form.** `Edit_Filters.svelte`: title, date, brief and use when. The kinds row and the tag areas stay kb's, since every specialty has a kind and tags: they become two kb components of their own, taken out of `Edit_Filters.svelte`, and the frame draws them. The four rows go to ai as the edit filter snippet, and with the title row its two tools, the title copied to and from the top heading and the file name, doing nothing until step 16 gives them their moves. Proof: a visual report of the four rows in the ai host's editor, between kb's kinds row and tag areas.
- [ ] 11. **Draw markdown and put a changed piece back.** `Edit_Markdown.svelte`, `Markdown_Blocks.ts`, `Emphasis.ts`: the words turned into a page, each piece opening for a change, headings named, folds, where the reading was left. The ai operation view begins here: the words and their pieces alone, drawn as the operation view snippet inside kb's frame, `Edit.svelte` and the label form's stack, which stay kb's. Proof: markdown_blocks, code_blocks and emphasis tests, and a visual report of a page drawn and a piece changed.
- [ ] 12. **Compose labels for a bare file.** `Labels.ts` is two things: `labels_for`, the composing, goes, the first heading, the first sentence, today, the fallback kind, the new and stale tags. `label_changes`, the diff kb writes the db with, stays. Proof: labels test, in both places.
- [ ] 13. **Search inside the drawn page.** `Search.svelte`, `Searching.ts`: the place highlighted, the fold opened for it. Proof: searching test, and a visual report of a place highlighted.
- [ ] 14. **Back links.** `Back_Links.svelte`, and in `Files.ts` the links gathered from every file's text and related. Proof: a visual report of a back link opening its file.
- [ ] 15. **Follow a link, judge a dead one, and walk the link stack.** `Following_Links.ts`, `Hierarchy.explore` and `likely_meant`, `Report.svelte`, `find_dead_links` in `Files.ts`. `Operations.ts` is two things: the stepping through the list, which stays kb's, and the stack of files reached by links that the steppers walk off the list, which goes. Proof: following_links test, and a visual report of a link followed and the steppers walking back.
- [ ] 16. **Make, rename, move and throw away a markdown file, links and index files mended.** `create_beside`, `rename`, `move` and `delete_one` in `Files.ts`, the file's four buttons in `Controls.svelte`, and the moves behind the title tools that went at step 10. Moving and throwing away a file are kb's; mending what pointed at it is not. Proof: a visual report of the four buttons.
- [ ] 17. **Mend index files.** `Index_Files.ts`, `repair_indexes` and `mend_indexes` in `Files.ts`, the index files button in `D_Repair.svelte`. Proof: index_files test, and a visual report of the repair button.
- [ ] 18. **Hand a file to Obsidian, a code file to VSCode, and a file into a message.** `obsidian_link` in `Saving.ts`, `Opening_Code.ts`, the compose button in `Controls.svelte`. Proof: opening_code test, and a visual report of the three hand-offs.
- [ ] 19. **The tests go with their pieces.** markdown_blocks, code_blocks, emphasis, searching, wiki_links, index_files, following_links and opening_code to the ai host, tag_areas having gone at step 7 with its lists, filters and core_alias stay kb's. labels is two things: its composing cases go, its label_changes cases stay. saving's reaches_under_work cases went at step 6 and its site_of_file and file_path_of cases at step 25, each with their functions, and its address_of_file, renamed_path and moved_into cases stay. Every step ends with both suites and the db's checks clean. And every one of ov's 89 working feature rows is tried by hand on the ai host and ticked in memory/ai's working features file, ov's table with a first column added, done, holding a checkbox per row, the rows' words ov's, unchanged. ov is retired the day the last is ticked.

### music, steps 20 to 24 — after the strip, re-decided 12 September 2026

The 11 September decision ran music first, so a real second host would say what kb must be before the strip. Re-decided 12 September 2026: ai first is better. The cost the reversal accepts is the one the old order avoided: until these five steps run, what music needs of kb is a guess, and the hand-over is designed from ov and ai alone — music's keys, hierarchies and view arrive after, and may reshape it.

- [ ] 20. **The plugin.** The dispatcher imports `plugin.py` from the host's folder, which its host list names — the mechanism is built at step 6 with ai's plugin as its first customer, mu's coming here: `mu/plugin.py` with the listing rule, files under the root ending mp3, m4a, flac, wav, shn, mp4, mpg, avi, mkv and vob, the jpg beside them, and archives, pdf and txt, as the music specialty says, its calls wrapped as step 6 wraps ai's. Proof: test_dispatcher.py with a temp root holding a file of each ending, all listed, and ov's listing the same as before.
- [ ] 21. **The look for a big collection.** **Risk low** with step 2's four guards, high without, since 21b, 21c and 21f change database.py: first `ov.db` is saved as `tools/hub/ov.db.before-step-21`, then through the step `PLACE`, `open_db` and `all_labels` keep their names and answers, and test-always-tag.sh is run after every save of database.py. Six performance fixes on the dispatcher side, each a substep, and the music collection's look on a longer interval than 3 seconds, or the OS's own reports. The two on the list's side are step 27. Proof: both db suites clean, a scan of the library, `/Volumes/muice myoozk`, 18,219 files, into mu's db, ending while the hub, ov and the hooks keep answering from ov's, and its seconds written into this file.
    - [ ] 21a. **One walk per look**, shared by reconcile and the rules, with a per-folder time check before any stat.
    - [ ] 21b. **One db connection per thread**, the schema checked once, and a pass's per-file writes in one transaction.
    - [ ] 21c. **The fingerprint by size and time first**, a hash only for a candidate match, and for a big file the first and last megabyte.
    - [ ] 21d. **`/all-labels` answered per collection**, the columns the list needs first and the rest on open.
    - [ ] 21e. **question** thread the dispatcher here, six lines and no mutex, the pac in truth/decisions.md, or with the first caller that holds it long?
    - [ ] 21f. **The server threading its requests**, and long work, a scan or a dump, in a thread that answers progress. With no mutex: sqlite's own write lock does the waiting, and a read waits on nothing, which answers the mutex pac in truth/decisions.md with neither side. Six lines. The server: The threaded server in place of `HTTPServer`, at the import and at the base class, in dispatcher.py. Its request threads are daemon, so the restart route's exit is not held. The one read-then-write: `reconcile` reads every row, then writes. Its block's first statement becomes `BEGIN IMMEDIATE`, so a second reconcile waits at the start, up to the connection's 5 seconds, then reads what the first left and finds nothing to do. Every other write in database.py begins with a write, an upsert or a delete, so sqlite already makes the second wait. Reads: `PRAGMA journal_mode = WAL` at open, one line after the foreign keys line, so a read never waits while a write commits. WAL keeps two files beside each db, covered by step 2's ignore line, and a saved file is made after a checkpoint, `PRAGMA wal_checkpoint`, or it is missing the last writes. RULED: The sweep of rows gone from the disk iterates over `list(RULED)`, a snapshot, in place of the dict. Its reads and one-key writes need nothing. The test: test_database.py starts the threaded server too, and one new check fires two rescans at once from two threads, both answering 200 and the db's rows the same after. Proof: test_database.py and test_dispatcher.py clean, test-always-tag.sh, and three looks timed as today, 0.04 seconds each.
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

- [ ] 25. **The collection filter.** A section among the browse filters, beside kind, tag and search, narrowing the list to one collection, a project in ai, a root folder in mu, read from the collections table. It takes over from the projects row, which draws `T_Bundle`, the closed list of thirteen project names in `File.ts`. The bundle design goes here: `T_Bundle` and `project_at`, and `file_path_of` and `site_of_file` in `Saving.ts`, a bundle and a path to a repo path and back, with their cases in saving.test, and is_design with them, which site_of_file computes off the path and Files.ts hangs designs under, always false today. In their place each file's row carries its collection and its path from the collection's root, which `/all-labels` and `/collections` carry from step 6, the hierarchy hanging each file from its row's collection and the files manager building each collection's top from the collections table. Smaller than its thirty-five call sites say: ideas.md records that Saving.ts roots every collection at a notes folder that no longer exists, so every file falls to the memory rule already, a repo path is memory and the file's path, and is_design is always false. Proof: filters test, and a visual report of the list narrowed to each, and unchanged in ai with none picked.
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
    - [ ] 32a. **question** whether to build them at all, the pac in truth/decisions.md: 13 bare files of 346 today, each composed the first time it is opened.
    - [ ] 32b. **Build them** as proposed rules says.
