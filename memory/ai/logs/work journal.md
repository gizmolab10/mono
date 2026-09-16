# Work Journal

What's been finished, newest first. ai's own since 15 September 2026, taken whole from ov's, Jonathan's decision; ov's stays as it is.

**Current** The plan in [music and ai](../zone/work/music%20and%20ai.md), ov's strip down into kb and ai: step 14 built and step 19 begun 15 September 2026, its working features table ticked a row at a time as each feature is tried by hand on ai. Steps 15 to 18 next: following a link and walking the link stack; making, renaming, moving and throwing away a markdown file; mending index files; handing a file to Obsidian, a code file to VSCode, and a file into a message.

## 2026-09-15 — zone/work/soon/repair staleness of files.md: 3 done

- [x] read guides tagged with 'stale'
    - [x] offer a rewrite of each -> new work file "rewritten guides"
- [x] add the 'stale' tag to everything listed
    - [x] the third entry is a folder
        - [x] add a stale flag to all its children guides — all ten in pre-flight
- [x] add a new repair button called 'stale files'
    - [x] calls handle_stale_files, which does...
    - [x] to each file with a stale tag
    - [x] add a new first subsection called 'proposed rewrite'
    - [x] use dispatcher.py to access the LLM model (currently used for analyzing errors)
        - [x] add a second use
        - [x] take a guide's content, return a few sentences, regarding...
        - [x] what this guide is for
        - [x] what should be removed
        - [x] add it to that subsection

## 2026-09-15 — zone/work/ov as knowledge bases.md: 11 done

- [x] 6. Rules. Ends with: a file added to a truth folder shows its project and kind without typing either.
    - Built 10 September 2026. The rules table holds what a rule reads, the file's name, its location or its content, the regex it matches, and the label it gives, a kind or a tag. The dispatcher runs every rule on every file changed or new at each look, and on every file when a rule is added or taken away: a file's rule labels are made exactly what the rules give, hand labels never touched, and a file no rule hits gets no row. A hand kind wins over a rule kind in ov, and the tags are both together. The details column gained a rules section to list, add and take away rules, and the list is relabeled from the db after each. No rule is written yet: the truth folders hold kinds of every sort (arch 55, howto 36, explain 33, specify 33), so which kind a truth file gets is Jonathan's rule to write there. 114 checks in `test_database.py`, the truth rule among them on a repo made for the run.
- [x] 5. The authors and provenance rows. Ends with: the editor shows both.
    - Built 10 September 2026. The sources table holds one row per author, each saying where the file came from and a date, or one row with no author where only that is said. `/set-sources` makes a file's rows exactly what is sent, `/sources` reads them, and `/all-labels` hands every file's back with its labels. The editor's information rows gained two: authors, names separated by commas, and from, a url or a person. Both live in the db alone and are written when the field is left. 99 checks in `test_database.py`.
- [x] 4. File watching. Ends with: a file moved in Finder keeps its tags.
    - Built 10 September 2026. Nothing on this machine reports changes as they happen without a package the dispatcher does not carry (neither fswatch nor watchdog is installed), so the dispatcher looks at the disk instead: a thread started at launch takes the listing and a stat per file every 3 seconds, and `/all-labels` takes the same look before answering, so ov's launch is never behind. `database.reconcile` does the work the Design's item 5 lays out: same path with a new size or time, the fingerprint is computed again (changed); a path gone whose bytes turn up at a path with no row, the row moves there with its labels and fields (moved); a path gone with no match, the row is marked missing and kept; a missing row whose path is back is found. `/rescan` asks for a look by hand. ov hangs a missing file where it sat, its name struck through, its hint and its click saying it is not on disk. Proved on a repo made for the run: 90 checks in `test_database.py`.
- [x] 3. The other four labels, title, description, use_when and date, read into the db, and the whole block removed from each file. Ends with: no file carries a block, and the editor shows all five from the db.
    - The four are fields on the files table, one each, as the Design section's (see below) item 2 (files table) lists them.
    - Built 10 September 2026. The files table gained the four columns, a db made before them is given them on open. `/scan` records them from every block (1099 fields across 369 files, and 21 older `type` lines read as the kind, `updated` as the date), `/all-labels` hands them back beside the labels, and `/set-fields` writes them. ov reads all five from the db, its editor writes every change there and never to the file, a new file is its heading alone, and a file the db has no row for gets its labels composed from its words when first opened. `/move-guide` and `/delete-guide` carry the db's row with the file. `/strip-block`, asked with a confirm word, took the whole block off 368 files and kept one, `memory/index.md`, whose block carries okf lines the db has no place for. `big-picture.py` writes no block and records its five in the db.
- [x] 2. The markdown collection read into the db, and its labels removed from each file. Ends with: the files list filtering from the db.
    - Built 10 September 2026. The dispatcher's `/scan` reads every listed file's kind and tags into the db as hand labels (485 files, 320 kinds, 779 tags, 153 whose block says neither), and `/all-labels` hands them all back in one answer. ov's files list filters from the db: `Files.ts` asks for every label beside the listing and takes each file's kind and tags from there, never from its block. Changing a kind or tags in the editor, composing labels for a bare file, and making a new file all write the db, and `Labels.ts` writes neither line into a block any more.
    - The removal ran the same day: `/strip-labels`, asked with a confirm word, took the kind and tags lines out of 332 files, and left title, description, use_when and date. The three readers of the lines now read the db through `tools/hub/database.py`: `inject-always.sh` and `test-always-tag.sh` for the `always` tag, and `big-picture.py` records its kind and tag there instead of writing them.
- [x] 1. The db, and the dispatcher reading and writing it. Ends with: a tag written and read back.
    - Built 10 September 2026. `tools/hub/database.py` makes `tools/hub/ov.db` (git-ignored) with the four tables and writes and reads labels; the dispatcher answers `/labels`, `/add-label` and `/remove-label`; `tools/hub/test_database.py` writes a tag and reads it back against a db of its own, 23 checks.
- [x] 1. Tagging a file in ov changes the db, never the file.
- [x] 2. The db holds each ov file's path, never its bytes.
- [x] 3. A file moved or edited in Finder keeps its tags in ov.
- [x] 4. Every file in ov shows its authors and where it came from.
- [x] 5. A file new to ov gets kinds and tags from its name, location and content, with nothing typed by hand.

## 2026-09-15 — zone/work/music and ai.md: 21 done

- [x] **host** — ai or mu, they import the kb library (later ji as well)
- [x] **collection** — a folder of files (mu -> the folder dropped, aka the root; ai -> each project inside mono)
- [x] **db** — a host's sqlite file beside the dispatcher, ai.db, mu.db
- [x] **dump** — ov.sql or mu.sql, one per host, every table of the db as statements, from which a db is rebuilt
- [x] **author** — the name of who wrote a file (a person or a tool: jonathan, Jeff, co, code_debt.py). In `ai`, it is often entered by hand in the editor's information rows, thereafter taken as SOT, never verified. In `mu`, it can be the artist's name: whether the artist is a source or a label is 22b's question.
- [x] **plugin** — `plugin.py` in a host's folder, the code the dispatcher imports and runs for that host: its listing rule, its labeler and its own routes. The snippets and the configuration are the host's page's to hand kb, not the plugin's. Together with them it makes the host's specialty.
- [x] **project** — essentially the same as a collection
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
        - The host list is ports.json: each host that has a db gets a db entry beside its port, `ov.db` under ov and `mu.db` under mu. A request names its host with a host parameter, ov when none. At step 3 the hosts are ov and mu, since ai has no entry until step 4 makes the project. Step 4 gives ai an entry naming `ov.db` as well, so ov and ai read one db until ov is retired at step 19. Since 13 September 2026 ai reads `ai.db`, made from `ov.db` less the 23 rows of the removed memory/filter tree folder, ov has no db entry, and a request naming no host is ai's, so ov's frozen page reads `ai.db` too.
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
- [x] 4. **The two new projects.** Built 12 September 2026: mono/kb holds ov's src whole, App.svelte under the name Main.svelte and no main.ts, its core_alias.test proving one bridge, and mono/ai holds main.ts, App.svelte, Customizations.ts, `Core.ts` and `Kb.ts`, with a port, 5187, a db entry naming `ov.db` and a servers entry, both in mono's workspaces, ai's CLAUDE file in mono/ai and kb's in mono/kb, memory/kb and memory/ai each with a lexicon and a map, adopt kb.md moved to memory/kb/zone. Proof: kb check clean at 532 files and ov's suite 338 passing in it, ai check clean at 524 files, its core_alias test 5 passing, and ai builds. The hub page's button, under H, was added after, 13 September 2026. Not done, since the step does not name it: the dispatcher's COLLECTIONS, which lists neither new CLAUDE file until step 6 replaces it. 
    - A kb project, a library with its alias and bridge as libraries.md says, holding all of ov's code, its page, ov's App.svelte, under the name Main.svelte, gallery's name for the same thing.
    - An ai project, an empty host that imports kb and draws that page, the way mu draws panel: a main.ts, an App.svelte, a Customizations.ts and the bridges, nothing more. 
    - A library has no entry file, so ai's main.ts does what ov's does today, through kb's bridge, as libraries.md's fifth rule asks: reads the remembered colors into core's stores, pushes the layers, the sizes and the inks onto the page, hangs the guides before the app shows, and mounts the page. 
    - ai with a port, a db entry naming `ov.db` in ports.json, so ov and ai read one db until ov is retired (`ai.db` since 13 September 2026, ov's frozen page reading it as the default host), and a servers entry, kb with none of the three, as gallery has none. 
    - Each with a CLAUDE file in its code folder, mono/kb and mono/ai, where ov's and mu's sit, and a memory folder, memory/kb and memory/ai, holding a lexicon with the entries above written in, and a map, memory/kb holding adopt kb.md too, moved from memory/ai/zone. memory/ov stays with ov, the reference. 
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
- [x] 8. **The dispatcher's markdown routes.** Built 13 September 2026: read, save, scan and strip in `ai/plugin.py`, with label_block, KNOWN_KEYS, labels_in_text and without_block moved there from the dispatcher. The dispatcher's four address functions call the host's plugin through call_plugin and answer 409 where the plugin has no function or refuses. scan_labels and strip_blocks walk the listing and the db and call the plugin once per file. Proof: test_database.py 169, the block cases asking the plugin and a stub plugin lacking read and save refused, test_dispatcher.py 48 with a read through ai's plugin by name, the always test and big picture 15. Not looked at in a browser.
    - ai's own four functions of the plugin api (read, save, scan and strip) and the rows the table names. 
    - The code behind the four addresses moves into `ai/plugin.py`, made at step 6: labels_in_text, label_block and KNOWN_KEYS, which read one file's label block, as the plugin's scan, and the taking of one file's block off, as its strip. 
    - What the dispatcher keeps is its function for each address, `/read-guide`, `/save-guide`, `/scan` and `/strip-block`, which calls the host's plugin's function through call_plugin and refuses where the plugin has none, and the two loops, scan_labels and strip_blocks, which walk every listed file, call the plugin's scan or strip once per file, and read and write the db, the db's side, which stays. ov's asks name no host and run ai's plugin already, so nothing is kept unreached: the code moves, and that is all. 
    - One db, one dispatcher. Proof: test_dispatcher.py, the four addresses answering as before with a host named and with none; test_database.py, its label block cases moved with labels_in_text to read the plugin's, and a stub plugin lacking one of the four refused; test-always-tag.sh and test_big_picture.py.
- [x] 9. **The preferences prefix.** 
    - Built 14 September 2026: `new Preferences('ov_')` in kb's Preferences.ts is `new Preferences(() => customizations.prefix)`, read when asked, ai_ for ai, kb_ in kb's own tests, ov's frozen page keeping ov_. core's Preferences takes a prefix or a function answering it and gains adopt, which moves every value saved under another prefix and drops the old keys, two cases in core's preferences test. ai's Convert_Preferences.ts, imported by main.ts ahead of kb, sets kb's nine facts, the fill moved out of main.ts, then adopts ov_: the second file reaching kb through its alias, for the customizations alone, named in core_alias.test and in libraries.md's rule 2. 
    - Proof: headless, after a reload with two values seeded under ov_, 28 keys all under ai_ and none under ov_, the seeded value read back and show_details read at import; core clean at 470 files and 100 tests, kb at 540 and 324, ai at 534 and 15 and its build. 
    - The visual report is Jonathan's.
    - Proposed 9a to 9d, from the reading before the step, built as written; Hand_Over named Convert_Preferences by Jonathan.
- [x] 10. **Editing — the labels.** Built 14 September 2026 as the lines below say: ai's `Edit_Fields.svelte` draws the four rows and the title's two tools, App.svelte hands it as the edit filter section, Edit_More.svelte keeps the kind and the tags and draws `Kinds_Row.svelte` and `Tag_Rows.svelte`, Kb.ts hands show_status, save_file, file_path_of, title_from_name and the three types, ai's Core.ts hands hit_target. Proof: headless, ai's editor draws the six fields filled from the record and the four tools above the kinds row and the tag rows; kb clean at 542 files and 324 tests, ai at 537 and 15 and its build. The visual report is Jonathan's. Rewritten the same day from the reading before it. The same day, the title's four tools ride the information line again, centered, white, the information clickable's height: kb puts on the line whatever element the host's rows mark with the class rides-the-line.
    - `Edit_More.svelte`, Edit_Filters until 14 September 2026, holds the label form: one stack of the search, the information rows, the kinds row, the host's rows and the tag areas.
    - The information rows are four, holding six fields: title and date, brief, use when, authors and from, the last two the sources. 
        - They go to ai as the edit filter snippet, given the file, its words and a call that hands changed words back, so the edit_filter snippet type widens to those three in Main.svelte, Operation.svelte and Edit.svelte, which carry it down, and Edit_More renders it with the file, its text and a call that sets text, which Edit.svelte binds; drawn by an ai component of its own, `Edit_Fields.svelte`, which re-reads the six fields whenever the file it is given changes, as Edit_More does today, and saves each on blur.
    - The host slot moves up to where the information rows sit today, above the kinds row, so ai's rows take their place. adopt kb's row for the edit filter section says so.
    - What the snippet reaches through Kb.ts: files, there already, for write_fields, write_sources, sources_of and relabel, the tags read off files.hierarchy.tag_names_of, so the list is told as today; new, show_status from Status.ts, so a refusal, "not saved" and the reason, is said on the status line, no longer on the note line under the words, which only Edit.svelte reaches, the types File and Labels from File.ts and Source from Saving.ts, and for the title's two tools save_file and file_path_of from Saving.ts and title_from_name from Labels.ts. 
        - Through ai's Core.ts, new, hit_target from core's events, so each field keeps its hit id and its tip.
    - The host subsection takes the information subsection's fold and its clickable, kb's, so the rows fold as they do today.
    - The kinds row and the tag areas stay kb's, since every specialty has a kind and tags: two kb components of their own, `Kinds_Row.svelte` and `Tag_Rows.svelte`, taken out of Edit_More.svelte, which draws them as subsections of its stack as today. 
        - Each reads the form's kind and tags and calls back on a press; Edit_More keeps the form's state, the rides on the lines and save_filters, so neither component saves. kb's lexicon gains label form, information rows, kinds row and tag rows at the build, the two files named for the last two.
    - The title's two tools, the title copied to and from the top heading and the file name, go to ai with the rows, since copying from the heading sets the title field and copying onto the heading or the name reads the field's text, unsaved edits and all: they read the field and the words, write the words back through the call, and ai draws them in the title row, no longer riding the line above. Step 16 gives them their moves as written.
    - save_filters in Edit_More keeps writing the kind and the tags; the fields and the sources are written by ai's rows.
    - Proof: kb's check and tests unchanged, ai's check, a headless read that the four rows are drawn in ai's editor above the kinds row, and a visual report.
- [x] 11. **Draw markdown and put a changed piece back.** Built 14 September 2026 as the lines below say: `Edit_Markdown.svelte`, `Emphasis.ts` and the drawing half of `Markdown_Blocks.ts` are ai's, the link readers kb's in `Links.ts`, the three tests ai's and the readers' cases in wiki_links.test, App.svelte hands the operation view snippet and Edit.svelte draws it in Edit_Markdown's place, Kb.ts and ai's Core.ts hand what the drawer reaches for, ai's package.json declares markdown-it. Proof: headless, ai's editor draws the page, 375 stamped pieces, 27 named headings and 46 fold buttons for the plan itself, and the search finds a word 137 times and highlights one, so the html reached the frame; kb clean at 515 files and 218 tests in 11 files, ai at 541 files, 121 tests in 5 files, and its build. The change of a piece and the visual report are Jonathan's. Rewritten the same day from the reading before it.
    - `Edit_Markdown.svelte` and `Emphasis.ts` go to ai whole: the words turned into a page, each piece opening for a change, headings named, folds, where the reading was left. `Markdown_Blocks.ts` is cut: the link readers, links_in, plain_links, body_of and Link_In_Words, stay kb's in `utilities/Links.ts`, since Files.ts reads them at launch and a library never imports a host; the drawing, stamp_blocks, page_of, name_the_headings, boxes_for_tasks, flipped_task, markup_prefix, rules_as_rows, mark_the_links, words_for_link, numbers_out_of_code, lines_between, with_lines_replaced, still_reads and without_words_above_heading, goes to ai as `Markdown_Blocks.ts` there, importing the readers through Kb.ts.
    - The tests go with their code now, not at step 19: markdown_blocks, code_blocks and emphasis to ai, wiki_links staying with plain_links, its import the new file, and taking markdown_blocks' cases for links_in, plain_links and body_of, the readers' cases beside their code. ai's package.json takes markdown-it, which the drawing needs.
    - The ai operation view begins here: the words and their pieces alone, drawn as the operation view snippet inside kb's frame, `Edit.svelte` and the label form's stack, which stay kb's. The snippet takes the file, the width and the height, the words and a call that sets them, as step 10's does, a call handing the html back, for the search, and calls for drawn, redrawn and a note, which Edit.svelte answers as it answers Edit_Markdown today: the search told, the note line written. The type widens in Main.svelte, Operation.svelte and Edit.svelte, and adopt kb's row says so.
    - Edit.svelte draws the snippet in Edit_Markdown's place, and nothing there when no host hands one.
    - What Edit_Markdown reaches through Kb.ts, new: follow_link, halt_stepping, leaving_file, left_at_of and w_command_down from Operations.ts, offer_status from Status.ts, key_of from File.ts, read_file and path_of_address from Saving.ts, labels_for and today from Labels.ts until step 12 moves the composing, code_link_of and is_code_link from Opening_Code.ts until step 18, and the link readers from Links.ts; files, preferences, T_Preference, show_status, save_file and file_path_of are there. 
        - Through ai's Core.ts, new: T_Hit_Target, Point, hits, free_thumb and Free_Thumb, svg_paths, Separator, Direction, foldable_headings, hidden_pieces and top_headings; k, debug and hit_target are there.
    - Proof: kb's check and tests, three tests fewer; ai's check, tests and build; a headless read that ai's editor draws the page with its pieces, the folds and the headings named. The change of a piece and the visual report are Jonathan's.
- [x] 12. **Compose labels for an unlabeled file.** Built 14 September 2026 as the lines below say: composing labels is ai's `ts/utilities/Labels.ts` with its test, kb's Labels.ts keeps label_changes, today, blank_file, free_name, NAME_UNTIL_TOLD and moment_written_out and the label block code is gone with its five test groups, kind_when_new and tag_when_new are facts ai fills with analyze and now, Files.ts reads them for a new file, Edit_Markdown and Edit_Fields import from ai's file and Kb.ts hands today alone. Proof: headless, an unlabeled file written under memory, opened in ai's editor, got kind analyze and tags now and stale in the db, its title Unlabeled proof from its heading, its brief its first sentence and today's date, then went through delete-guide, the file and its row gone; kb clean at 515 files and 190 tests in 11 files, ai at 543 files, 130 tests in 6 files, and its build. Rewritten the same day from the reading before it.
    - `labels_for`, composing labels, goes to ai as `ts/utilities/Labels.ts`, with what only it reads: first_heading, first_words, kind_from_where and NEEDS_A_LOOK. title_from_name goes too, its other caller ai's Edit_Fields.svelte, which imports it there; Kb.ts drops it. Edit_Markdown.svelte imports labels_for from the new file and today through Kb.ts, which keeps handing it.
    - What stays in kb's `Labels.ts`: label_changes, the diff kb writes the db with; today, blank_file, free_name and NAME_UNTIL_TOLD, which Files.ts reads for a new file until step 16; moment_written_out, which Status.ts reads.
    - KIND_UNTIL_TOLD and TAG_WHEN_NEW leave kb for two customization facts, kind_when_new and tag_when_new, the kind and the tag a new or unlabeled file starts with, defaults an empty word each, naming no host, customizations.test proving it. ai's Customizations.ts holds analyze and now beside its kinds and tags, Convert_Preferences.ts fills the facts, Files.ts reads the facts for a new file and ai's composing labels reads ai's own. adopt kb's table has the two rows.
    - Dead since 10 September 2026, nothing calling them: label_block, with_labels_added, with_labels_replaced, labels_from and has_labels, which read and write a label block in a file's text, and quoted, value_after, tags_from, names_below and phrases_from behind them, are deleted, with the labels test's five groups for them: putting a composed block at the top of a file, writing the labels, putting the labels back into a file, the occasions a guide names, reading the tags off a file. Decided 14 September 2026 with this rewrite.
    - Two comments, in Files.ts and Labels.ts, said a composed file starts at refer; since 14 September 2026 they say KIND_UNTIL_TOLD.
    - Proof: labels test in both places, ai's holding labeling a file that has none and what the folders above a file say it is, kb's keeping the writes, a brand new guide, finding a free name and a moment written out; customizations test for the two facts; kb's check and tests; ai's check, tests and build; a headless read of an unlabeled file: a markdown file written under memory for the proof, which the look leaves without a row, opened in ai's editor and given its labels, analyze, now and stale, its first heading the title, the db asked to say so, then thrown away through the dispatcher's delete-guide, which drops the file and its row. The file is made for the proof so nothing of the repo's is labeled by it.
- [x] 13. **Search inside the html.** Built 15 September 2026 as the lines below say: `Search.svelte`, `Searching.ts` and searching.test are ai's, App.svelte hands the search row as the fifth snippet and wires its drawer to its search, Edit_More renders the row first in the label form's stack where the host hands one, Edit.svelte holds neither the search nor the html, the operation view snippet narrowed, the clear button empties the store alone, Kb.ts hands the three stores and ai's Core.ts gap_below_line and Steppers. Proof: headless, the row drawn in the label form; a word typed reads 1 of 3 with one place highlighted, the step forward reads 2 of 3, clearing leaves none; the dead links report, 255 findings, a finding pressed opens its file reading 1 of 1 with the link's words highlighted; kb clean at 512 files and 176 tests in 10 files, ai at 544 files, 135 tests in 7 files, and its build. The visual report is Jonathan's. Rewritten the same day from the reading before it.
    - `Search.svelte` and `Searching.ts` go to ai whole, with searching.test, which reads what_to_open alone: the field, the count, the steppers walking the places, the highlighting, which piece a search opens and which it folds. The bare prop and the form it hid, a section of its own with a fold clickable, went 15 September 2026, before the step: the search draws the field, the count and the steppers, and the stack it sits in the line, the gap and the fold word.
    - The search row is the fifth snippet, `search_row`, given the file's name, rendered in Edit_More.svelte's search_rows subsection, the first of the label form's stack, whose line, gap and fold word stay kb's: the show_search preference, the search word and the fold clickable are Edit_More's as today. The type travels through Main.svelte, Operation.svelte, Edit.svelte and Edit_More.svelte, and adopt kb's table has the row.
    - The wiring between the drawer and the search is ai's: App.svelte holds its Edit_Markdown and its Search, answers the drawer's drawn and redrawn by calling the search's forget and light_hit, reading w_search_for, which Report.svelte sets for a dead link, and w_search_at, as Edit.svelte's drawn does today, and hands the search the html its drawer set. Edit.svelte drops `find`, `page` and its drawn function, and Edit_More.svelte its find and page props and its call of the search, the snippet rendered in their place; the operation view snippet no longer takes the call handing the html back nor the calls for drawn and redrawn, its type narrowing to the file, the width and the height, the words, the call that sets them and the note, and adopt kb's row says so.
    - Edit_More's clear button, which empties w_search_text and called the search's light_hit, empties the store alone; ai's Search answers the store going empty itself, doing the three things light_hit did with an empty field: the highlighted words put back, the piece the search opened folded back, the place set to the first.
    - The stores stay kb's: w_search_text, the one value the list's search field and the editor's share, in Filters.ts; w_search_at and w_search_for in Operations.ts; the show_search preference. Kb.ts hands the three stores; T_Preference and preferences are there. Through ai's Core.ts, new: gap_below_line and Steppers; hit_target and debug are there.
    - Proof: searching test in ai; kb's check and tests, one test file fewer; ai's check, tests and build; a headless read that a word typed into ai's editor's search reads its count, highlights one place, and steps to the next; and that a dead link picked from a report opens the file with its words highlighted. The visual report of a place highlighted is Jonathan's.
- [x] 14. **Back links.** Built 15 September 2026 as the lines below say: `Back_Links.svelte` is ai's, its bare prop gone, App.svelte hands it as the sixth snippet and Edit.svelte renders it at the foot, the gathering kb's in Files.ts, Kb.ts hands open_view and ai's Core.ts Section, Action, T_Position and T_Edge. Proof: headless, a file one guide points at drew one pill, the log's count, and the pill pressed opened its file, the editor's title read as that file's; kb clean at 511 files and 176 tests in 10 files, ai at 544 files, 135 tests in 7 files, and its build. The visual report is Jonathan's. Rewritten the same day from the reading before it.
    - `Back_Links.svelte` goes to ai whole: the pills, one per file that points at the one being read, each opening its file, folded away under the back links word, the count said on the word while folded. 
        - The gathering stays kb's: Files.ts takes every file's links out of the text it reads at launch, follows each through its own link following, and mends the map of who points at whom after a write, a move or a deletion, w_pointing_at. 
        - Step 11 kept the link readers kb's for that reading and step 15 keeps the following kb's, so the map is kb's, empty for a host whose files hold no links.
    - The back links are the sixth snippet, `back_links`, given the file's key and its name, rendered by Edit.svelte at the foot where Back_Links is drawn today, below the note line, above the status line; nothing is drawn there where no host hands one. 
        - The type travels through Main.svelte, Operation.svelte and Edit.svelte, and adopt kb's table has the row.
    - The bare prop goes with the move, and the form it hid, the pills alone with no section: Edit.svelte renders the section of its own, with its line, its fold clickable and its band of accent while folded, and nothing renders it bare.
    - What Back_Links reaches through Kb.ts, new: open_view; files, whose w_pointing_at and hierarchy it reads, file_path_of, preferences and T_Preference are there. 
        - Through ai's Core.ts, new: Section, Action, T_Position and T_Edge; hit_target, k and debug are there.
    - Proof: kb's check and tests; ai's check, tests and build; a headless read that a file something points at, opened in ai's editor, draws as many pills as the log's count, and that a pill pressed opens its file, the editor's title read as that file's. 
        - The visual report of a back link opening its file is Jonathan's.

## 2026-09-15 — zone/work/inception into the new design.md: 5 done

- [x] handoff & code debt — done, 30–31 August 2026: each project's unpaid debt leads its zone (done sections dead at the door, git keeps them; ov, core, lv, ji); handoff dissolved — state to index.md, live work to zone, history to git; the old files sit in `_to_delete/`
- [x] File maps — done, 31 August 2026: seven moved whole into truth/ (di ×3, ji ×2, lv, ov); core's copy of ov's removed; the road maps stay, being plans
- [x] `guides/pre-flight/lexicon.md` — merged into memory/ai/truth/lexicon.md and removed, 29 August 2026
- [x] `memory/shared/notes/guides/pre-flight/` — done 7 September 2026: always, response and banned words folded into truth/conventions.md, the mono-wide lexicon into truth/lexicon.md; agency, keywords, gates, kinds of tasks, pitfalls and shorthand moved whole into truth/
- [x] `memory/shared/truth/shorthand.md`, the trigger surface — moved into truth/ 7 September 2026.

## 2026-09-15 — zone/work/adopting the ai memory design.md: 1 done

- [x] Mono's lexicon links to an ov lexicon that does not exist — fixed 7 September 2026: the shared lexicon links to `memory/ai/truth/lexicon.md`.

## 2026-09-15 — truth/design/ov - goals.md: 27 done

- [x] 1.1 New `ov/` folder beside ji
- [x] 1.2 The five root files: the page, the settings file, the typescript settings, the svelte settings, the vite settings
- [x] 1.3 Its own project instructions file and a `notes/work/` folder
- [x] 1.4 Dependencies: svelte, vite, typescript, the svelte vite plugin and tsconfig, svelte-check, color2k, Montserrat — nothing else
- [x] 1.5 Scripts: `dev`, `build`, `preview`, `check`
- [x] 1.6 A new entry in the shared ports file: 5185, plus the address of the `ov` folder on github. The vite settings read the port from there.
- [x] 1.7 `ov` added to the list of folders the top-level settings file treats as its own — without it, nothing installs.
- [x] 1.8 A list of files not worth keeping, matching ji's
- [x] 1.9 The one-line file that tells the type checker about vite's own extras, matching ji's
- [x] 2.1 Bring the numbers across — `Constants.ts` and `Configuration.ts` unchanged; `main.css` keeps its layer classes unchanged, but its catalogue of names was rewritten to match what is really pushed (ji's listed three names nothing pushes, and several belonging to screens overview doesn't have)
- [x] 2.2 Bring the support across, unchanged — `Colors.ts`, `Dirty.ts`, `Fonts.ts`, `Tooltip.ts`
- [x] 2.3 Bring `Debug.ts` across, with its log file named `ov`
- [x] 2.4 Trim `Preferences.ts` — read, write, remove, clear, and the remembering-store maker. Marker `ov_`. Nothing else. It says in the log, for each setting, whether it read back a saved value or fell back.
- [x] 2.5 Trim the section-names file — one entry, `preferences`
- [x] 2.6 Point the page at the launch file
- [x] 2.7 `main.ts` pushes the layers, sizes and inks, then reads three of them back off the page and says so in the log. No mounting yet — that line arrives with the app frame at 3.1.
- [x] 3.1 The app frame: the column on the left, content on the right, and the fits-or-doesn't math. It also mounts the app from the launch file.
- [x] 3.2 Its logging — the window width, the width both columns need, and which way the switch went
- [x] 3.3 The details column and its one section
- [x] 3.4 The collapsible banner
- [x] 3.5 The accent picker, and the hint on its swatch. It says in the log what color was picked, how bright it measured, and whether it was lifted for being too dark.
- [x] 3.6 The hint drawer, mounted once for the whole app
- [x] 3.7 `yarn check` — clean, zero errors and zero warnings
- [x] 4.1 The hub button beside ji, labeled `ov`, with the letter **O**
- [x] 4.2 The keystroke, and overview added to both of the hub's project lists
- [x] 4.3 The start-servers script: read overview's port, one line saying it runs `yarn dev` in the `ov` folder, and `ov` added to the names the script accepts
- [x] 4.4 Walk the success checks — five of the eight confirmed, three still want a pair of eyes (see below)

## 2026-09-15 — truth/design/action type.md: 5 done

- [x] for ALL ***clickable*** titles
    - [x] ***copy*** button creation from **separator** to caller
        - [x] Search — the first one, the pattern for the rest
        - [x] Editor_Filters (three) — filters, kinds, tags
        - [x] Browse_Filters (four) — filters, projects, kinds, tags
    - [x] place button in an **action** -> `position.left`
    - [x] add logic to use it — **Separator** lends each given **element** a place at its own end or middle
- [x] remove from **separator** and **section**
    - [x] all hover logic
    - [x] onclick
    - [x] title, and the whole-line press strip that went with it
- [x] define the position enum
- [x] define the action type -> types
    - [x] element -> button
    - [x] position
- [x] add an action prop
    - [x] Separator
    - [x] Section

## 2026-09-15 — the links after Obsidian's moves

Jonathan moved eight files from ai's zone into zone/work, consolidate.md to shared's zone and five of ov's old work notes into zone/work/next, in Obsidian, whose link updating writes a bare name or a vault path, neither resolving as a relative link. 41 links and 11 mentions in 24 files re-pointed, ai's index and kb's CLAUDE file put right, three dispatcher checks re-aimed at the plan file. organize and murk journal are one copy each, shared's, core's twins gone.

### Verification

- The dispatcher's tests pass; no link under memory still names the old places.
- Not looked at in a browser by Jonathan.

## 2026-09-15 — ten work notes are shared's

Jonathan's go on the pac in [decisions](../truth/decisions.md). Ten of ov's old work notes, none about the app ai is, moved from ai's zone to the top of shared's work folder through the dispatcher, rows following; ai's hits manager and mouse ux deleted, core's twins being the newer. Groups 3 and 4 of the pac wait at the top of ai's ideas as checkboxes.

### Verification

- 10 files moved, 2 deleted, 10 links and 1 mentions re-pointed in 4 files; dead links under memory 1487 before and 1457 after.
- Not looked at in a browser by Jonathan.

## 2026-09-15 — ov's truth and zone are ai's

Jonathan's decision in [decisions](../truth/decisions.md). decisions.md, the design folder and the whole zone moved from memory/ov to memory/ai through the dispatcher, each row following its file. ov's lexicon merged into ai's, every one of its 31 entries already kb's; its banned words became ai's own file, which the hooks read by the picked project's name; its working features gave ai's table row 96; its ideas are the second half of ai's. The map of ov files stays with ov's code, and ov's logs stay.

### Verification

- 31 files moved, 4 merged and deleted, 28 links and 56 mentions re-pointed in 29 files; dead links under memory 1426 before and 1425 after.
- Not looked at in a browser by Jonathan.

## 2026-09-15 — the editor's controls row and its edges

Jonathan's decisions of the day, each in [decisions](../truth/decisions.md), built after step 14 of the plan in [music and ai](../zone/work/music%20and%20ai.md). The way back sits at the far right of the controls row while a file is open, drawn as the report's close button, the round white one holding the svg cross; the file's section is on the accent, its text in the accent's text color, no gap between the hamburger and the steppers, the steppers edged black and faint. The open buttons sit at the far right while browsing, past the dispatcher and build buttons; ai's one is code debt, so the idea "button to open 'unfinished'" is done. The back links word rides the thin line at the section's foot, a gap below the pills, and keeps its place when they fold, so kb's idea "put the clickable on the bottom sep" is done. Every information element's edge and every clickable's edge is --thick-faint. The area's name on a big pill wears a micro edge, a new rung on core's thickness ladder, --thick-micro.

### Verification

- Headless: the back links word's top the same shown and folded; every faint and micro edge computed as one pixel on the headless screen, the browser rounding to a device pixel; no page errors.
- core clean at 470 files, 100 tests. kb clean at 511 files, 176 tests in 10 files. ai clean at 544 files, 135 tests in 7 files, and it builds.
- Not looked at in a browser by Jonathan.

## 2026-09-15 — the back links are ai's

Step 14 of the plan in [music and ai](../zone/work/music%20and%20ai.md). Back_Links.svelte left kb for ai, its bare prop and the form it hid gone. App.svelte hands it as the sixth snippet, given the file's key and its name, and Edit.svelte renders it at the foot, nothing there where no host hands one. The gathering stays kb's in Files.ts, the map of who points at whom read through Kb.ts, which also hands open_view; ai's Core.ts hands Section, Action, T_Position and T_Edge.

### Verification

- Headless: a file one guide points at drew one pill, the log's count; the pill, code debt, pressed opened its file, the editor's title Code debt; no page errors.
- kb clean at 511 files, 176 tests in 10 files. ai clean at 544 files, 135 tests in 7 files, and it builds.
- Not looked at in a browser by Jonathan.

## 2026-09-15 — the search row is ai's

Step 13 of the plan in [music and ai](../zone/work/music%20and%20ai.md). Search.svelte, Searching.ts and searching.test left kb for ai. App.svelte hands the search row as the fifth snippet, given the file's name, which Edit_More renders first in the label form's stack where a host hands one, and wires its drawer to its search: the html handed up, forget and light_hit on drawn and redrawn, a dead link's words from the report first. Edit.svelte holds neither the search nor the html, and the operation view snippet narrowed to the file, the width and the height, the words, the call that sets them and the note. Edit_More's clear button empties the store alone, and ai's Search answers the store going empty with the three things an empty field asked for. Kb.ts hands the three search stores, ai's Core.ts Steppers and gap_below_line. The bare prop had left Search.svelte the same day, with the section of its own it hid.

### Verification

- Headless: the row drawn in the label form; "step" typed reads 1 of 3 with one place highlighted, the forward stepper reads 2 of 3, clearing leaves none; the dead links report, 255 findings, a finding pressed opens its file reading 1 of 1 with the link's words highlighted; no page errors but one 404 for a resource the report's file asked for.
- kb clean at 512 files, 176 tests in 10 files. ai clean at 544 files, 135 tests in 7 files, and it builds.
- Not looked at in a browser by Jonathan.

## 2026-09-14 — composing labels is ai's

Step 12 of the plan in [music and ai](../zone/work/music%20and%20ai.md), which moved to kb's zone today and back the next day. labels_for left kb's Labels.ts for ai's ts/utilities/Labels.ts with first_heading, first_words, kind_from_where, NEEDS_A_LOOK and title_from_name, and its test cases with it; Edit_Markdown and Edit_Fields import from there. kb's Labels.ts keeps label_changes, today, blank_file, free_name, NAME_UNTIL_TOLD and moment_written_out, and the label block code, called by nothing since 10 September, is deleted with its five test groups. KIND_UNTIL_TOLD and TAG_WHEN_NEW became the facts kind_when_new and tag_when_new, empty in kb, analyze and now in ai, filled by Convert_Preferences and read by Files.ts for a new file. Kb.ts hands today alone of the three. The lexicons gained unlabeled file and composing labels.

### Verification

- Headless: an unlabeled file written under memory had no row and no labels; opened in ai's editor it got kind analyze and tags now and stale, its title from its heading, its brief from its first sentence and today's date, all in the db; delete-guide then dropped the file and its row, nothing left.
- kb clean at 515 files, 190 tests in 11 files. ai clean at 543 files, 130 tests in 6 files, and it builds.
- Not looked at in a browser by Jonathan.

## 2026-09-14 — the words are ai's

Step 11 of the plan in [music and ai](../zone/work/music%20and%20ai.md). Edit_Markdown.svelte and Emphasis.ts left kb whole for ai, and Markdown_Blocks.ts was cut: the drawing went with them, the link readers stayed kb's in utilities/Links.ts, since Files.ts reads every guide with them at launch and a library never imports a host. The three tests went with their code, the readers' cases joining kb's wiki_links.test. App.svelte hands the drawer as the operation view snippet, given the file, the width and the height, the words and a call that sets them, a call handing the html back for the search, and calls for drawn, redrawn and a note; Edit.svelte draws it where Edit_Markdown was and draws nothing there when no host hands one. Kb.ts hands the drawer's fourteen reaches into kb and ai's Core.ts its ten into core; ai's package.json declares markdown-it. kb's lexicon gained link readers.

### Verification

- Headless: ai's editor draws the plan's own page, 375 stamped pieces, 27 named headings, 46 fold buttons, the information rows and the back links around it, and the search finds a word 137 times and highlights one, so the html reached the frame; no page errors.
- kb clean at 515 files, 218 tests in 11 files. ai clean at 541 files, 121 tests in 5 files, and it builds.
- The change of a piece is not proved here. Not looked at in a browser by Jonathan.

## 2026-09-14 — the information rows are ai's

Step 10 of the plan in [music and ai](../zone/work/music%20and%20ai.md). The label form's four information rows and the title's two tools left kb's Edit_More.svelte for ai's Edit_Fields.svelte, handed back as the edit filter section, given the file, its words and a call that sets them, and drawn above the kinds row under the information fold. Edit_More keeps the kind and the tags and draws two kb components of their own, Kinds_Row.svelte and Tag_Rows.svelte. Kb.ts hands show_status, save_file, file_path_of, title_from_name and three types; ai's Core.ts hands hit_target. A refusal is said on the status line. kb's lexicon gained label form, kinds row and tag rows.

### Verification

- Headless: ai's editor draws the six fields filled from the record and the four tools above the kinds row and the tag rows, five kinds with the worn one picked, ten tag areas, every fold clickable present, no page errors.
- kb clean at 542 files, 324 tests. ai clean at 537 files, 15 tests, and it builds.
- Not looked at in a browser by Jonathan.

## 2026-09-14 — the back links at the foot

The back links left the label form's stack for the bottom of the edit view, a section of their own drawn by Back_Links, and the count follows the steppers in the controls row. Folded, the section is a band of accent at the very foot, reaching down over the gap the region holds below the view, its line the thin one; every folded section's black line is held in by --gap-huge at each side, in core's Section and Stack alike. Section gained line_down_when_folded, unused after Jonathan settled the band by hand. Back_Links logs how many guides point at the open guide and whether the section is drawn, shown or folded, which answered why nothing showed: the section was folded, as remembered.

### Verification

- Headless: the section drawn for core's CLAUDE file shown and folded, the band's bottom on the region's edge, no page color under it, measured. kb clean at 540 files, 324 tests; core at 470 and 100; ai at 534.
- Looked at by Jonathan, who settled the folded band's height, margin and line himself.

## 2026-09-14 — every remembered value is ai's

Step 9 of the plan in [music and ai](../zone/work/music%20and%20ai.md). kb's Preferences.ts reads the host's prefix off the customizations when asked, and core's Preferences takes a prefix or a function answering it and gains adopt, which moves every value saved under another prefix and drops the old keys. ai's Convert_Preferences.ts, imported by main.ts ahead of kb, sets kb's nine facts, the fill moved out of main.ts, then moves everything saved under ov_ under ai_: the second file reaching kb through its alias, for the customizations alone, which libraries.md's rule 2 and core_alias.test now allow by name.

### Verification

- Headless, after a reload with two values seeded under ov_: 28 keys, all under ai_, none under ov_, the seeded value read back, and show_details read at import.
- core clean at 470 files, 100 tests. kb clean at 540 files, 324 tests. ai clean at 534 files, 15 tests, and it builds.
- Not looked at in a browser by Jonathan.

## 2026-09-13 — ai reads its own db

ai.db, made from ov.db through sqlite's backup less the 23 rows under memory/filter tree, a folder a commit removed, which the list drew struck through. ports.json names ai.db under ai and no db under ov, PLACE is ai.db and the dispatcher's default host is ai, so ov's frozen page reads ai.db too. The dump is ai.sql and ov.sql is gone. The suites prove the hosts ai and mu, ov no longer. Decision in [decisions](../truth/decisions.md).

The hub page's dispatcher button had said ✓ without restarting anything. It now reads the dispatcher's start time before and after, says ✓ only when a later time answers, and says ✗ when the old process still answers or nothing does. Every action button says busy in place of doing nothing while another operation runs. A rule added or taken away under host ai runs on every file again, which it had not since ai began naming its host. [using rules](using%20rules.md) says how the rules section is used.

### Verification

- db suite 169, live suite 48 after the restart, always hook 4 of 4, big picture 15.
- The restarted dispatcher names the hosts ai and mu, and ai.db holds 348 files, 1111 labels and no row missing.
- Jonathan pressed the dispatcher button: a new process began at 7:41 PM, its start time answered, and the live suite passed 48 against it. The rules run under host ai is proved by the db suite alone.

## 2026-09-13 — the kinds, the tags and the tag areas are ai's

Step 7 of the plan in [music and ai](../music%20and%20ai.md). ai's Customizations.ts holds the five kinds, music dropped as mu's alone, the 39 tags and the ten tag areas, and ai's main.ts hands them to kb before anything mounts. T_Kind, ALL_TAGS and TAG_AREAS left kb: a file's kind is a word off the host's list, the five files that read the lists read the configuration, the two area functions that read them take the lists as arguments, and the fallback kind is the word analyze, ai's, in kb until step 12 moves the composing. The tag areas test moved to ai, reading ai's lists through kb's functions, and kb's labels test declares the tag words it reads off blocks.

Two more of mu's facts were decided the same day: its kinds are four, music, images, text and video, by the file's ending, and a song takes tags from a closed list of four, jazz, classical, rock and hifi, reversing no tags.

### Verification

- kb check clean at 540 files, 324 tests. ai check clean at 533 files, 15 tests, and it builds. Big picture 15.
- Looked at by Jonathan: the kinds row and the tag areas in ai, confirmed.

## 2026-09-13 — the listing rule is ai's plugin's

Step 6 of the plan in [music and ai](../music%20and%20ai.md). `ai/plugin.py` is the first plugin: the specialty's name, ov's listing rule moved whole from the dispatcher with ai and kb added to its projects, whether one path is listed, and the labels the plugin gives a file, none until step 14. The dispatcher imports each host's plugin from the host's folder and lists files, refuses paths and takes labels through it. ov's asks name no host and run ai's plugin, since the two share a db. The import and every call are wrapped: a fault is said in the log and fails that file or that request, never the server. The look writes the plugin's specialty on the collections rows, and the rules pass runs with no rules too, so a plugin's labels always land. The fields answer carries each file's collection, for step 25.

On the page the mirror of the listing rule went: WORK_FOLDERS, reaches_under_work and the listed line inside site_of_file, with their test cases, and Files.ts and Hierarchy.ts no longer judge a link into a work folder, since the dispatcher's listing is the whole truth. The bundle design, T_Bundle, project_at, file_path_of and site_of_file, waits for step 25, which replaces the projects row with the collection filter.

### Verification

- test_database.py 166, a stub plugin raising on one file failing that file alone. test_dispatcher.py 47, the two new CLAUDE files listed, the fields carrying collections.
- The listing after step 6 against before: 497 files, ai/CLAUDE.md and kb/CLAUDE.md the only additions.
- The always test, big picture 15, kb check clean at 541 files and 334 tests, ai 532 and building. Not looked at in a browser.

## 2026-09-13 — kb and ai stand, and kb's page is panel's

Two projects made at step 4 of the plan in [music and ai](../music%20and%20ai.md): mono/kb, a library holding all of ov's code, its page under the name Main.svelte and no entry file, and mono/ai, a host that draws that page and does what ov's main.ts did, through two bridges, Core.ts and Kb.ts. ai is registered at port 5187 with a db entry naming `ov.db`, in mono's workspaces, in servers.sh and on the hub page under H. memory/kb and memory/ai each hold an index, a log, a lexicon and a map, and adopt kb.md moved to memory/kb/zone. ov is untouched.

Step 5 built the hand-over, two ways. The facts: kb's Customizations.ts, eight fields whose defaults name no host, which ai's main.ts fills before anything mounts, the name, the prefix, the host, the hierarchies and the build notes table. The kinds, tags and tag areas wait for step 7 and the prefix for step 9. The drawing: kb's Main.svelte draws panel, through Panel.ts, kb's second bridge, and hands panel kb's own four, the controls row's right end without the hamburger, the details column and the operation view inside panel's regions, and the status line's words and offer. It takes four snippets from a host and hands each down to its place: a filter after tag, the edit filter section between the kinds and the tags, a details section below the rules, and the operation view below the label form. ai hands none yet, and kb draws every piece as before until the step that moves it. Every ask kb makes names the configured host.

Panel changed three ways for it. It draws core's status line, so the offer passes through. Its details column sits on the accent, with no gap above and a nudge up of a big gap and a tiny one, set by eye. Its controls row hands the host a box filling everything past the hamburger, in place of a spacer that shared the width, which had put kb's way back halfway across.

### Verification

- kb: check clean at 541 files, 343 tests, two bridges proved and every configuration default naming no host. ai: 532 files clean, 5 tests, and it builds.
- panel 414, gallery 480, mu 417, lv 406, mj 480, all clean. The dispatcher's suites 45 and 157, the always test, big picture 15.
- Looked at in the browser by Jonathan: the details column and the controls row put right by eye. The cause of the column's offset is not found.

## 2026-09-12 — every label lives in git, and each host gets a db

The db beside the dispatcher was the only home of every label. Step 2 of the plan in [music and ai](../music%20and%20ai.md) gave it two ways back: `ov.db.before-step-2`, the file saved beside itself, and `ov.sql`, every table as plain text, written by `/dump` and read back by `/restore` into a new db beside the live one, which is never written over. The ignore line widened to every db file beside the dispatcher, so the dump enters git and no db does.

Step 3 gave each host a db of its own. ports.json names one beside each host's port, `ov.db` under ov and `mu.db` under mu, and database.py reads the pair at import: every call takes a host and opens that host's file, ov's when told none, so the hooks' three calls, `PLACE`, `open_db` and `all_labels`, answer as before. Every db route of the dispatcher reads a `host` parameter the same way and refuses a host with no db. A fifth table, collections, holds one row per collection, its name, its specialty and its root folder: for ai one per project, made by the look the first time the listing names one, the repo the root of every one, fourteen on the day. For mu one per dropped folder, added through `/add-collection`. `/collections` lists a host's.

### Also

- **A refusal sent before the request's body was read** reset the connection, and the asker saw the reset in place of the refusal. `_note_place` drops the body before refusing now.
- **`__pycache__` folders are ignored**, and the five .pyc files git tracked are untracked, still on disk.

### Verification

- test_database.py: 157 checks against two dbs of its own. test_dispatcher.py: 45 against the running dispatcher.
- The always test four of four, big picture 15.
- ov's dump after step 3 against its dump before: the fourteen collections rows alone differ, 1116 labels in each.

## 2026-09-10 — every label leaves the files for a db

A db beside the dispatcher, `tools/hub/ov.db`, holds what a file does not say about itself. database.py makes it and is the only way to reach it, and only the dispatcher reads and writes it. Four tables. files: one row per file, made from the disk when its first label is written, holding its size, its time, its fingerprint and the four fields, title, description, use_when and date. labels: one row per kind or tag on a file, each saying who wrote it, hand, rule or ai. sources: one row per author, with where the file came from and a date. rules: one row per rule.

The label block left every memory file. `/scan` read every listed file's block into the db, 485 files, and `/strip-block`, asked with a confirm word, took the whole block off 368 of them, keeping memory/index.md for a line the db has no place for. Files.ts reads the five labels from the db, asked for in one answer at launch beside the listing, and the editor writes every change there and never to the file. A new file is its heading alone, its labels in the db. A file the db has no row for gets its labels composed from its words when first opened.

The dispatcher watches the disk: a look every 3 seconds, one before every launch of ov and one on `/rescan`. `reconcile` checks every row against the listing. A changed file gets its fingerprint computed again. A moved one is found by its bytes and keeps its labels under its new path. A gone one has its row say missing and is kept, and the list shows it where it sat, its name struck through. A missing one back at its path is found.

Rules give a file its kind and tags with nothing typed. Each reads the file's name, its location or its content, matches a regex and gives one label. `run_rules` does every file changed or new since the rules last ran, and every file when a rule is added or taken away. A hand label is never touched, and a hand kind wins over a rule kind. The details column's rules section lists, adds and takes away rules.

The editor's information rows show a file's authors, names separated by commas, and where it came from, a url or a person, written to the db when the field is left.

### Verification

- test_database.py, against a db and a repo made for the run: 23 checks at the first table, 99 by the sources. test_dispatcher.py, against the running dispatcher: 35.
- test_big_picture.py 15, the always test four of four, ov 339 tests, check clean.

## 2026-09-07 — picking many files at once

Browse's count row grew a pencil at its far left. Pressing it turns selecting on, and a slash lies across the pencil while it is off — the same mark and rule the folders button already uses for its own mode. The state is `w_edit_multiple`, a remembered boolean; `w_selected_files` holds the picked files by where they sit, also remembered.

While selecting, the file list grows a column at its far left, a checkbox in every row. A file's own checkbox picks that file; a folder's picks every file among its progeny — its own and every nested folder's, at any depth — read off the matched set rather than what is on screen, so a shut folder in between is reached all the same. The header of that column carries one more checkbox, centered on the divider, that picks every file at once; it shows only with more than one root, since one root's own checkbox already does that job.

Each checkbox is its own hit target, so pressing one never reaches the row's own click, and hovering one lights only itself — the row stays unlit, and the checkbox takes `--hover` off its `data-hit` stamp. Every checkbox sits on the controls layer. An `apply` button waits to the right of the pencil, shown only while selecting; it does nothing yet.

### Also

- **`progeny`** entered ov's lexicon: everything under a folder, files and folders, recursively — never *children*, which reads as one level.
- **Launch reads a few files at a time** now: the list draws from the dispatcher's listing alone, then the labels come in — the edited file first, the rows in view next, the rest twelve at a time — the list narrowing as each batch answers. Measured at 226 ms to the drawn list against 1958 ms for every label in.
- **The top row's ancestry** leaves the memory folder off: a file in the memory system starts at its project's folder there.

## 2026-08-19 — the kinds are five

`analyze` is a kind now: a taking apart of something to find out how it works. Two went out. Every screen reads the whole list off the one place it is written, so adding and removing reached the browse filters, the editor filters and the filter's own list with no further change.

**`design` moved to `explain`.** Fourteen files across the five collections wore it. Taking the kind out took something with it: a file's kind used to be guessed from the folders above it, and the only folder that ever spoke was `design` or `designs`. No folder name says how a file reads any more, so every path falls back and the stale mark asks for a real answer. Four test cases became one saying so.

**`refer` went too, and it was the fallback.** A composed file starts at `analyze` now.

### Also this session

- **The murk hook was keeping half of every complaint.** It took the second-to-last thing I had said and called it the reply that could not be read — but every tool call is an entry of its own, so for any reply that looked a file up first, that was a tool call holding no words. It wrote an empty string and said nothing about it. It passes over the wordless entries now, and a new test builds a conversation with thinking and two tool calls between the two replies to prove the pair comes back whole. Run against the old line, that test fails exactly the way the record did.
- **`stow` replaced `done` as a tag**, in the closed list, in the progress tagset, and on the twelve files wearing it. The `done` work folder and the `done` shorthand are untouched — neither is a tag.
- **The dispatcher's `/list-guides` route is `/list-files`**, on both sides and in its test.
- **The murk work split in two:** the nine strategies are a guide at `notes/guides/collaborate/avoid murk.md`; the case they came from stays as a record in `soon/`.

### Verification

- svelte-check: 532 files, 0 errors, 0 warnings.
- vitest: 410 tests, 0 failing. One fewer than before — three cases about what a folder says collapsed into one saying it says nothing.

## 2026-08-17 — a link no longer stops at the wrong file of that name

Following a link took the first file of that name found while climbing, and refused outright if its path disagreed with what the link said. Where two files share a name — a work note and the guide drawn out of it — the nearer one is often the file being read, so a link to the other opened nothing and named the file itself as the reason.

The climb passes over a file standing in the wrong place now and keeps going, and only refuses once every folder above has been looked in. The first one passed over is held for the message, so a refusal says where the file of that name does sit rather than saying it was not found.

**The note line at the bottom of the reader says the whole thing.** It used to say which kind of refusal it was — "a file outside the guides" — and nothing about which file or where. Its words can be picked up and copied, it is registered while it is showing, and its arriving and leaving now say so, since it takes its height from the words in it and everything above it moves.

## 2026-08-17 — the steppers name the file they would open

Pointing at either stepper said only which way it went — "previous file", "next file" — so the only way to learn which file was to press, which is the very thing the reader was deciding about. Each says the name now, on the list and on the stack of guides reached by links alike.

**One piece of code both picked the next file and opened it; that is two now.** One says which file lies that way, the other goes there and asks the first. So the name shown and the file opened are one answer, and the walking rule is written once.

The split settled a case the note had not: **backing out past the bottom of the stack goes to where the reading began**, which is a file like any other — so it names that file rather than falling back to the plain words. Stepping back to a report keeps them, since a report is not a file.

## 2026-08-17 — which guides point at this one

A guide said what it pointed at and nothing said what pointed at it, so one could be rewritten, moved or thrown away without ever seeing who was relying on it. A section below the words now names them, each one openable, and is drawn only where something points here.

**The links come out of each file's own text at launch**, in the moment its labels are read — the one moment that text is in hand, and it is let go straight after. Nothing is kept but the addresses. The dead-link walk could not fill this: it reads every file and runs only when asked.

Two faults, both silent, both found by measuring rather than reading:

**The double-bracket form has to be turned into the ordinary one first.** A guide written the short way, naming only `[[a name]]`, holds no ordinary link at all — so reading its raw text found nothing and said nothing.

**Answering a link needs every guide findable by where it sits, and that map is filled by the narrowing.** Asked before it, every lookup found nothing — and it was silent, since a guide that cannot be found is skipped before any link is counted. It read `0 of 0` rather than naming a failure.

## 2026-08-17 — a tag typed by hand went unread, and nothing said so

A file's tags can be written two ways. This app writes them all on one line; **Obsidian writes them one name to a line, and rewrites a file into that format the moment its tags are touched there.** The reading knew only the first, found nothing after the colon, and gave the file no tags at all.

**Nothing was dropped, so nothing was said.** The reading names by name every tag it turns away, and that silence was itself the clue — the file was not being half read, it was not being read.

The reading of the labels moved out of the manager and into the label utility, where the writing already lived. Both are plain work on text; in the manager the reading could not be tested without starting the whole app, which is why it had no test to fail.

## 2026-08-17 — coming back comes back to where you were

A guide left partway down opens where it was left, not at its top. That holds walking the link stack, stepping back to the list, and across a reload for the one guide being read. A link naming a heading still wins — the link says where to be.

**A line is remembered, never a distance.** The topmost piece names the line of the file it began on, and coming back looks for the piece carrying that line. A line survives an edit that adds lines above it; a distance does not. One line per guide, so a guide reached twice down two different paths keeps a place for each.

Two things had to be found on screen, neither visible from the code:

**The line is written as the scrolling settles, never on the way out.** By the time a guide is leaving, its box has already gone back to the top, and every reading taken there said the file's first line.

**The title stays at the box's top however far the words scroll**, so it was always the first piece at the top and answered every reading. Anything that stays put is passed over now.

## 2026-08-17 — a fold mark drawn over the row that had covered its words

Scrolled up, a heading's words went under the title row and its soft pointer was drawn whole across it. Both are covered by the same row, so the two disagreed.

**Every button is put on the controls layer**, and a fold mark is a button — so the mark and the title row held the same layer, and the mark, coming later in the page, won. The marks are on the common layer now and the title row is back on its own.

I guessed twice before measuring, and both guesses were wrong. What settled it was reading the computed layer off the browser: the mark said 2, the same as the row, where I had assumed `auto`.

## 2026-08-17 — handing a file on, and why Windows never could

The ⤴ mark hands the browser a `mailto:` address. Windows hands that to a program it knows about, and a browser tab is not one — so Gmail never sees it unless two separate things are set: Windows pointing `mailto:` at Chrome, and Chrome holding Gmail as its own handler. With Outlook holding the registration, the press works as designed and opens Outlook, which is a failure to whoever never uses it.

**ji proved the content is not the cause** — its ⤴ sends a bare address, 27 characters, and fails just the same.

**Overview has a second wall behind that one.** Gmail's handler caps at about 4,096 characters after encoding, and Chrome reaches Gmail by putting the whole `mailto:` inside a second address, so every escape is escaped again. Every guide in the repo is past the ceiling before the doubling — handoff.md alone comes to 4,289. Carrying a whole file to Gmail needs another way altogether.

The steps for a Windows machine are written into [ov installer](../zone/work/soon/ov%20installer.md).

**Nine dead links found in the work index.** Eight rows named files that had moved into `soon/`, and one sat under "More" with a top-level path. That folder has an index of its own now, and the parent goes through one row for it.

## 2026-08-17 — what a field is for, and what is already finished

Both read quieter than real words now, in the light gray. Two fields in the whole app carry placeholder words — browse's search and the editor's — and a finished thing's struck-through words were a shade too dark to read as done.

## 2026-08-17 — the sections design settled, and a word that answered nothing

A stack owns the gaps between its sections and draws a line centred in each one. Every distance is middle to middle, and a folded section is one number — `k.height.small` — from its own line to the next, with the accent filling that span and a hairline down its exact middle.

**The folded distance has a floor.** The two half gaps around a fold come out of it, so it can never be smaller than the widest pair's spacing on any screen. Below the floor a fold's height goes negative, the browser draws it at nothing, and that one pair reads wider than the rest — which looks like a spacing fault and is not.

**A line drawn below a stack must be pulled up half its own thickness.** The stack leaves its bottom edge exactly where that line's middle belongs; a line drawn below starts there instead.

**`closes` became `foot`** — who draws that line: the stack, whatever stands below it, or nobody. Nobody means a last fold has nothing to end against, so it comes down to its own line and nothing else.

**A word lent to a line was never given back.** A caller builds its fold word out of sight and the line takes it. When that line went, the word was taken off the page and left there — so the hits manager let its target go for good, and the word sat on screen answering nothing. It goes back to where it was built now.

[sections](sections.md) holds the design. [sections spec](sections%20spec.md) holds the instructions for putting it into di, ji and ws.

## 2026-08-17 — five words for how soon

`active` said a file was being worked on and nothing more. It is now **now**, and it stands in a tagset of its own beside **next**, **soon**, **later** and **tabled** — eight tagsets, thirty-four tags. Eighteen files' labels were rewritten, across four collections.

## 2026-08-16 — three filters found a folder of their own

Browse's filters, the editor's label form and the search moved into `src/lib/svelte/filter/`, and the list component became `List_Files.svelte` — the manager beside it is `files` now, so the two stopped sharing a name.

**The row numbers had vanished from the reader.** One page variable was never pushed — `--size-pointer` — and a `calc()` naming an undefined variable makes the browser drop the whole declaration. The page's left step-in fell back to nothing and every number was pushed off the edge.

## 2026-08-15 — a table stopped counting, and then counted twice

A table was one piece wearing one number, so the column beside the words skipped every row of it. Each row carries its own line now, and pressing anywhere along a row opens that one line.

**The number hangs off the row's first cell**, never off the row. Anything drawn against a row becomes a cell of its own, which pushed every real cell one column along and left the headings standing over the wrong words.

**A table wears no number itself.** A table's own drawing goes wherever the browser decides — which turned out to be down beside the second row, over the number already standing there.

**The line of dashes under the headings has no number**, since the reader draws it as nothing and there is no row to hang one on.

## 2026-08-15 — one word for where a file sits

`place` meant a file's location in some of the code and an ordinary spot in the rest — 195 uses, and about 70 of them the first kind. A link's target settled it: on disk it is a **path**, on the web a **url**, and **address** is the word for either.

**Nine files renamed**, the everyday noun and verb left alone. Said in one place, holds its place in the run — those keep the word.

## 2026-08-15 — the words hook rewrote code on its way to the screen

Several banned words are also the names of real things. The hook that swaps them ran over the whole reply with no exception, so a quoted CSS line arrived saying something the file does not say — a line read as wrong when the code was right.

**Anything between backticks is left exactly as written**, a fenced block and a snippet alike. Prose is still corrected, and the ban still holds for the words I choose in code: names, comments, log lines.

## 2026-08-14 — the count holds a width of its own

`4 of 10` at the far left of the editor's top row took exactly the width of its own characters, so the two step marks beside it moved as the numbers changed. It holds one width now, with its words at the right end — they finish against the marks, and the marks stand in one place from `1 of 9` to `218 of 218`.

**The width went on the ladder** as `width.tiny`, and onto the page like every other size, so nothing writes a lone number. Jonathan set it at 50.

## 2026-08-14 — six picking rows, two different gaps

The gap under the editor's search line read smaller than the others. It measured 7.77 below that line's middle, which is exactly the gap a section takes when it asks for none — and browse's three picking rows each ask for the big one, 9.72. Six rows doing the same job, two numbers between them.

**All six ask for the big one now.** The editor's search, kinds and tags rows join browse's projects, kinds and tags.

**The field is drawn two pixels lower**, so it sits square under the line. That is drawing only: its place in the row is unchanged, and nothing around it moves.

**One call now measures every section against the line above it**, two numbers each — to the top of its own box, and to the first ink inside it. A pill-shaped field draws its edge at its very top while a line of words holds empty space above the letters, so the same measured gap can read as two different gaps. Any next argument about a gap is now one press and a look at the log.

## 2026-08-14 — one rule said in three places, and none of them agreed

A link to `[[thin proxy proposal]]` would not open. The file is on disk; the app had never heard of it. Chasing that took the whole afternoon and turned up the same fault four times over.

**The line between what the app lists and what it does not was written in three places.** The dispatcher's walk decided what to send. Its one door decided what could be read and written. And the app's own reading of a place decided what to place. Each said "a work note only at the top of its work folder", in its own words, in its own language — so widening one changed nothing, widening two left every file listed and unreadable, and only widening all three worked. Each now says it draws the same line as the others, and names them.

**Five folders came in**: `next`, `milestones`, `now`, `done`, `proposals` — 85 notes across four collections. Anything deeper, and every other folder, stays out.

**The dead-link check was wrong in four separate ways**, each found by pressing the button and reading what it said. It never saw Obsidian's own `[[name]]` form at all, since that is turned into an ordinary link only when drawing. It read a link as the words it spells, so one written inside a work folder named no work folder and slipped past the test meant to pass it over. It skipped anything that merely resolved to a spot under a work folder, whether or not a file stood there — 119 dead links in one file, hidden. And a press on a row searched for the link's address, which lives in what the link points at and is never drawn on the page.

**It now names the likeliest file** for anything it cannot find: most shared folder words first, ties broken by the fewest folder steps from the file the link sits in, and nothing at all offered where two are equal on both. That rule came out of mono's own link-mending tool, which had been sitting in `notes/tools/docs/` the whole time.

**One press was doing two things.** The manager said the press and started the repeating, and the repeating begins with a beat at once — so every step mark stepped twice, and a back that went somewhere and then stepped again read as going nowhere. A row opened its file on the way down, which meant a drag could never begin. And a folder's mark acted on the way down while the row acted on the way up: the mark's shape turns when the folder does, so it moved out from under the cursor and the row turned the folder straight back. Everything in the list acts when the press is let go now.

## 2026-08-14 — a box that stands inside the piece it is changing

Opening a piece for changing moved its words. A heading jumped bigger-to-smaller and light-to-heavy; the hashes and the `- [ ]` took width the drawn page spends on nothing, so every first word slid right; and the row number in the left lane went up for one kind of piece and down for another.

**The first tries were arithmetic, and arithmetic was the wrong tool.** I copied the piece's lettering onto the box, measured the markup at the head of the line and stood it out to the left, took off half the leading, hung the number off the box, then off the box's place. Each one fixed some pieces and moved others, because each rested on my own model of where a given kind of piece hangs its number — and every kind hangs it somewhere slightly different.

**The log said it outright.** The first thing to be done in a list read right while every other one was two pixels low. That first one's number is drawn by the list, not by the item, and the list was never touched. So the rule was there all along: a number that never leaves the element that draws it never moves.

**So the box stands inside the piece now**, with the piece's own words held out of sight behind it. The piece keeps its place, its lettering, its gaps and its number; the box inherits the lot. The code that copied the lettering, the code that slid the box onto the piece's place, and four kinds of box styling all went. What is left is measured, never reasoned about: the markup's own width, and whatever is left over between where the words stood and where the box begins them.

**A thing to be done can hold a list of its own**, and that list has nothing to do with the one line being changed — so it comes back out to stand below the box while the item's own words are away.

**Two faults in the hits manager, either of which stops every press landing.** It marks that a rebuild is queued, waits, then clears the mark — and the clearing sat after the waiting rather than inside it, so a wait that never came back left the mark standing, and a standing mark turns away every later request. Since a target asks for a rebuild the moment it arrives, nothing would ever be measured again. And redrawing the fold marks adds rows and pointers across the whole page without telling the manager anything.

## 2026-08-13 — the details column folds the way everything else does

The column's two things — preferences and repair — each wore a banner: a full-width block with the title inside it, a fill arriving under the cursor, and a rounded shape drawn behind. Every other folding thing in the app is a line across with the word standing on it, masking the line behind it. Both are that now, and the banner's own drawing is gone.

**The column became one stack of sections.** The page color runs from the first line down to the last; the column's own gap above that first line, and whatever is left below the last, stand on the accent. A closing line is drawn under the last section only while it is open — folded, it stands one gap tall with its own hairline, and nothing below it draws another line.

**A section can now hold a different gap below what it shows.** Above its contents it gives back half its own line, since a gap is measured from a line's middle; below them the line that bounds the gap belongs to whatever comes next, and is not this section's to give back. The details column asks for that half on top of the gap above, so both sides draw as one gap and the contents sit centred.

**Three faults of my own, found on screen.** The word handed to the line was never bound, so the line was given nothing and no word appeared. The word and its section shared one name, and the manager keeps one target per name, so the section threw the word's away. And the column's width changes when it is shown or hidden with no window resize to report it — which the manager's own self-check named exactly, down to the eight pixels across and eight down.

## 2026-08-13 — the manager pays its own way, and a file is called a file

Reading the wiring back showed three costs it had added. The hovered target was written to a store on every move of the cursor, and every target listened, so ~75 callbacks ran where two elements changed. Scrolling rebuilt every rectangle, and each reading makes the browser settle its layout. And each target arriving asked for a full rebuild of its own, so forty rows cost forty rebuilds of forty rectangles.

**All three are gone.** The hover is said only when the answer changes, and the manager stamps the two elements itself — nothing listens for it any more. A run of things arriving joins one waiting rebuild. A scroll hands over the distance scrolled and every rectangle inside that box is moved by exactly that, reading nothing from the browser: asking which targets sit inside walks up from each element, which forces no layout.

**Against the old per-control wiring it is now about even** — better while the cursor moves, since the old code walked the page building class-name lists on every move in four places; slightly worse while scrolling, which used to cost nothing.

**The manager checks itself.** Every rectangle is held rather than read, so anything that moves without saying so leaves a control answering for a strip of the page it no longer stands on — and nothing on screen shows it. While the cursor rests on a target, its rectangle is read afresh once a second; a difference raises a box naming the target, its kind, the element, both readings, how far off in each direction, and the three ways to tell the manager. All three faults in the wiring session were that one fault in different clothes.

**A file is called a file.** The record for one guide was `Guide` and a filtered row was `Filtered_Guide`, in a folder called `File.ts`, held by a manager called `Files`, for a list that holds work notes as well as guides. Both are now `File` and `Filtered_File`, the field on a row is `file`, and two more names that had drifted went with them: where a file sits is a `File_Site`, and where a pill stands in a wrapping row is a `Pill_Placement`. The word *guide* stays wherever it means a guide.

## 2026-08-13 — one manager decides what the cursor is on

Every control used to watch the cursor for itself: its own press, its own hover rule, its own hint, and a rule walking up the page to work out whether a press had landed on something that answers. One manager decides now. The cursor is fed in once at the top of the app; it asks its own structure which targets hold that point and hands the press to one of them. A control beats a section, which beats the file's own words — and within one kind the one standing in the smaller area wins, since sections sit inside sections.

**What moved over.** Twenty-two buttons, thirteen segments, both stepper pairs, every field, nine sections, every row of the list, and two whole areas — the file's words, and the count row with the rows under it. Each says its name, what a press does and what to show while the cursor is on it, and carries no handler, no `:hover` rule and no hint of its own. The rule that walked the page is gone, file and tests.

**Three faults the wiring turned up, each found by measuring rather than guessing.** Pressing one tag reacted on another: a shut tag area keeps its tags at full size inside a box of no width, so four areas' tags stacked on one strip of the page. A target can now say it is out of sight and hold no place at all — the same thing `pointer-events: none` already tells the browser. Pressing a folder's triangle turned it over twice: the triangle handed its press to the manager and the row behind it never heard about that, so it fired its own. And the tags section answered nothing, because the whole filter form is a section too and covered it.

**Every rectangle is measured once and remembered**, so everything that moves one says so: a word moved onto a line, a fold, a tag area finishing its slide, the list scrolling, the file's words scrolling, the window resizing. A target arriving among others is measured again one drawing later, since the first reading is taken before the browser has laid the run out.

**Elsewhere.** A section's lower gap is the whole gap again — it was giving back half of a line it draws at its top, so the count row shrank whenever it drew one. The picked tags in the count row are cut to the space beside the count, at whole words, ending in an ellipsis. The editor's own folds are remembered between visits. And the two filter drawings were named for the screens they belong to: `Browse_Filters` and `Editor_Filters`.

## 2026-08-13 — a gap is measured from a line's middle, and nothing paints over a control

A line has thickness, so its edges move whenever that thickness changes; its middle does not. Every gap around a line is now measured from there — half the line is given back — so the same gap reads the same under the hair and under the heavy one. A section holds it above and below alike. Folded, it holds the one gap and nothing else, whatever gap it holds when open; a section asking for no gap at all stands flat, and the editor's label form does exactly that, so the words below it draw no line of their own and two heavy lines never touch.

**The title's slot was a number unrelated to any gap.** It is worked out now from the title's own line of words with that one gap above and below it, said once and read by both the title and the line that closes it off.

**Everything that can be pressed stands in front of the words around it.** One rule gives every button a place on the controls layer. The file's own sticky title had claimed that same layer, and being later in the document it painted over a word hanging down off the line above — so the title moved one layer down. It still covers the words running under it.

**Finding that took a measurement, twice.** Walking up from the word showed nothing above it that could cover it; asking which element actually stands at the word's lowest point named the title. Guessing had already failed on the same fault once.

**The fade of the hover.** Every hover fill arrives and goes over a third of a second, said once in the global stylesheet over the elements that take one, so no component carries its own copy of the timing. Crossing a row of pills used to flash each one in turn.

## 2026-08-12 — both colors are chosen now, and a word masks the line with its own shape

The page color used to be worked out from the accent. It is a choice of its own, remembered like the accent and picked beside it, so moving one leaves the other where it was put. Everything read off both — the hover, the readable text, the mild accent, the banner — is worked out in one place whenever either moves. The hover became a lean from the page a third of the way toward the accent, lifted a tenth toward white, so it holds for whichever pair is picked, light page or dark.

**A word on a line masks it with a pill.** The mask was a rectangle standing behind a pill-shaped word, which showed two ways: the line stopping short of the curve with a crescent of page color between, or the curve eating the middle of the line and leaving two square horns. One shape for both, and both went.

**A lit section says its own color to everything inside it.** Whatever paints itself to mask the line — a word, a name riding above a pill — reads that value, so it still matches while the section is filled. Finding this took a measurement: the log showed the word reading the right color and painting white anyway, because a second rule for "pressable, because the area around it says so" outranked it and painted white on purpose.

**A section's bare background answers a press and fills under the cursor**, the gap above and below its contents included. The two halves disagreed at first — the fill lit everywhere but inside the rows, the press worked only inside them — because each asked a different question of a different element. Both ask the section now, through a question narrower than the one deciding the way back to the list: a whole area is a background, not a thing that answers.

**Whatever sits between a file's labels and its first heading is offered for removal.** The words start at that heading, whatever its rank — not every file opens with a top-level one — and spaces holding a heading off the left edge count as characters to take out. Nothing is written unless the button is pressed; dismissing the line is the answer no. Holding a step mark or an arrow key stops at a file that raised something, and one more press goes on.

## 2026-08-12 — a word on a line is now the caller's own, and a bar only lends it a place

A section's line used to build the word that folds it, style it, and light it. It now takes made things instead: a caller writes its own control, hands over the element and where it wants to stand — left, middle or right — and the line only finds it a place. All eight clickable titles moved out, three in the file form and four in the filters and one in the search. With them went the line's `title`, its `onclick`, its hover styling, and the clear strip that made a two-pixel line worth aiming at.

**One thing to know about handing over a made element.** A caller writes its button out of sight, and the browser makes it one drawing later — so the line is handed nothing on the first drawing and the button on the next. That arrival is itself a change, so the line is told at once; nobody has to touch anything.

**The picking control and both clears moved onto their own lines**, standing at the middle. Each takes the fold word's own text size and edge, so the two boxes are the same height. Folded, whatever stands at the middle goes with what it acts on — the fold word stays, since it is the way back.

**A row of tags holds a gap above itself only when a name rides above a pill in its topmost line.** Which pills are in that line is measured: the run wraps, so nothing but measuring says. The reckoning lives in one place and is proved without a page.

**A bug of two halves.** The fill and the press disagreed: the fill lit everywhere but inside the rows, the press worked only inside them. They were asking different questions of different elements. Both now ask the section, and the question is narrower than the one that decides the way back to the list — a whole area is a background, not a thing that answers.

**Elsewhere.** A `+` in the editor's top row makes a file beside the one open and opens it, labeled to match the filters so it is one of the files on screen. A link ending `.ts` or `.svelte` hands off to VSCode at the line it names. The tags picking control gained **any but** — a file shows only if it wears none of the picked tags.

## 2026-08-11 — the tags row says how it is picking, and the guides were counted again

The tags row's `all` button became a control of four: **any of** and **all of** are states, remembered between visits; **clear** and **invert** are presses that change what is picked and never read as picked. The editor's own tags row got the two presses alone, since a file wears the tags it wears. All three rows' clear grays and answers nothing when there is nothing to clear.

**The decision the proposal left open.** With every picked tag required, the tags row cannot set its own filter aside: a tag worth offering is one worn by a file that already wears them all. So the picked tags stay in the question there, and a tag that would empty the list grays out.

**A defect I made and the log named.** The row's list of tags is worked out from the things it names, and it named the project, the kind and the words. My change made it read the picked tags too, so it went stale the moment they moved — pills vanished and stayed vanished. It names them now.

**The kinds are down to six and two were renamed.** `step` became `howto`, `wire` became `arch`, across eighty-three guide files, the app's own list, and the three notes that spell the six out.

**The assessment of mono's guides was a month stale.** It named eight folders including one that is gone, and a dozen files by names they no longer have. Every one of the 55 files is now listed under its real folder with its own brief, and every file name in it is a working link — 57 of them, each checked against disk. The thin and partial lists were re-checked file by file: one of the two "cut at a STOP marker" claims was wrong.

**Eighty log lines a session went.** The tag-area timing, the remembered settings, the three folding lines and the row count — each had settled its own question and none had been asked again. What stayed reports a decision whose values could still surprise, or a fault.

## 2026-08-11 — work notes joined the files, and every row learned its line number

A work note used to be a country the app could see into but never enter: links pointed at them and failed, and the dispatcher refused to hand one over. Now each project's work folder stands beside its guides, holding the notes at its top — and only those, since anything deeper would triple the list. They read, write, rename and go like any guide.

**The kinds are six.** `work` went, since a folder now says it; `step` became `howto`. Twenty-seven guide files were relabelled, along with the app's list and the two notes that spell the six out.

**A dispatcher button in the top row.** Changing the dispatcher's code used to mean walking to the hub. The button asks it to start over, then asks it for the guides every second and a half until it answers. Nothing is said in the status line — the button's own face is the whole report.

**Things to be done are boxes now.** A list item beginning with a pair of brackets draws as a rounded square: outlined while still to do, filled with a green check when done, its words struck through. Pressing one turns that single line's brackets over and writes the file back — the same road every other change takes. An item holding a list of its own gets the soft pointer a heading gets.

**Every row shows the line it begins on.** The number counts the rows shown, from one, with the labels left out; the two numbers that put words back still count the file itself. A line the reader draws as nothing — a blank line, a rule — gets a row of its own so the column has no holes, and where a list and its first item both name one row, the second claim is dropped.

**One constant holds the whole left lane.** It says where the numbers' right edge stands; the pointer is one gap past that, the words one gap past the pointer, and the title's step-out reads the same sum. Four rules that used to carry their own numbers now read from the one.

**Two lessons, both about measuring.** Asked why a soft pointer's neighbour jumped on hover, I measured inside the hover event — where the hover style is not on the element yet — and read the old picture twice, then reported that nothing moved. Measured two frames later it really was still, so the fault was in the painting: an edge on a fractional pixel is rounded afresh each repaint. Whole pixels and a paint surface of its own cured it. The second lesson is older and I repeated it: I asked Jonathan to paste the log. It is on disk, and reading it is the one thing I can always do.

## 2026-08-09 — every line on the list screen now owns the gap around it

The filters drew five lines by hand, each in a bare wrapper with the row it named as a sibling — so the gap between a line and its own row came from the stack rather than from either. All five are sections now, and the count row with them. The stack's own spacing went to zero in the same edit; without that, every row would have grown by one gap.

**Two sources of spacing were still stacking.** The content box put its own gap between the filters, the count and the list, on top of each section's own. The list screen now stacks its three parts flush.

**A section that holds subsections stands flat when folded.** It holds no gap of its own when it is open, so holding one when folded was a gap that existed in only one of the two states — and whatever follows holds its own already.

**The table header's line moved to the top of its row.** It ran through the middle of the words, so half that row stood between the count row and the line anyone actually measures to. The words now ride the line and take no height at all, the way a word on any other line does — which is what makes the gap above measurable to the line and the rows below stand clear under it. Two things had to follow: the header as a whole stands in front of the line, since lifting it made a world of its own that nothing inside could reach out of; and the line itself stepped back a layer, so a word drawn on it from outside is never painted over.

**Where guessing failed, the app measured.** Three rounds of reasoning about which gap was too big produced nothing; one round of asking the page for real numbers named both culprits at once.

## 2026-08-09 — the editor became four files, and the page stopped blinking

The editor was 1,941 lines and held four whole things that had nothing to say to each other. It is now 448: the top row, the way back to the list, and the two things the parts share — the whole file's text, and the line along the bottom that speaks up briefly. **Search** took the search row and the highlighting (239 lines). **File_Filters** took a guide's own labels (287). **File_Content** took reading the file, drawing it, folding it, and the box that changes one piece (1,052). Nothing on screen was meant to move.

**The rule about clicking bare space became Hit_Empty_Space**, named for what it answers rather than for one caller's purpose. It was called Leaving, which named no subject; then Leave_Editor, which named the caller — three components ask the same question and one of them may one day not be leaving anything.

**Names that had drifted.** The manager that holds every guide became Files. The list's filters became List_Filters, a file's own became File_Filters — the app calls both "filters" and the two were one keystroke apart. Browse and Editor moved up into the frame folder, since each is a whole screen; the status line moved down into content, since it is one thing the box shows.

**Typing in the search field re-read the file from disk on every letter.** Working the list out again handed the editor a fresh record of the very same file, and the read was tied to that record rather than to the file's place. Five letters, five reads, five redrawings — which is what blinked. The place is now one piece of text, the same from one record to the next, so nothing stirs. Proved by making the app measure: the log alternated read, measurement, read, measurement.

**A smaller blink underneath it.** Clearing the highlighted words folded away whatever piece had been opened to reach them, and the next place — usually inside that very piece — opened it again. The two answers are now worked out together, so a piece is only ever folded when the next place is somewhere else.

## 2026-08-08 — nothing is written to a file nobody asked about

A file added to the guides used to be given labels the moment the app read it — a hundred guesses made at launch, none of them looked at. Now a file with no labels is left exactly as it is and reads `---` in its kind column. The labels are composed the first time someone opens that file to edit: title and description from its own words, kind read off the folder it sits in, marked stale. The judging is the collaborator's, done on one file while it is in front of a person; correcting it is Jonathan's, on the file he is already looking at.

**A folder called design or designs makes its files designs**, one called work makes them work. Only the plural spelling was recognised at first, so ov's own design folder fell through — four tests now cover both spellings and the case where a word merely starts the same.

**A seventh area of tags: progress** — proposal, construct and done, joined by stale and think, which left `other`. The other six areas gather tags by what a guide is about; this one gathers by where a guide stands in its own life.

**A `none` button in the kinds row** leaves only the files carrying no labels at all, which is how they are found so they can be opened and given some. It grays out when every file the other filters leave already has labels. Those files also sort first rather than last: an empty kind used to be treated as a blank and pushed to the bottom, and it is a real state, not a missing one.

**The way back to the list grew.** The bare space among the label rows joins the two top rows, and the whole of it lights at once — one flag, so pointing at either end lights both. Two areas are left out, because a press already means something there: the run of tag areas shuts them all, and the line above them folds them away.

**A word on a line now shows its edge whenever it can be pressed**, and takes the hover fill only when the cursor is actually on that bar. Told to light by the area around it, it takes white instead. The kinds in the label form gained a line of their own that folds them away and then reads which kind the guide is.

**The file holding what a guide is became File.** It says what any file in the picture is — its kinds, its tags, its collections, its labels — so naming it after one of those was the wrong scale. Fourteen imports followed; one reached for it by a short name rather than the full path and had to be caught by the type check.

**The line between rows starts well in from the left.** Under the first column it is painted rather than drawn as an edge, which is how it can begin part-way across without the words beside it moving.

**One marker was drawn in the wrong place.** The words box reports how far down it starts from the box that wraps it — near zero — while the marker over its scrollbar was placed against the whole view, which starts far higher. Both now sit in the same box. The bar's own lane starts below the line across the page, and the marker moved and shortened to match.

## 2026-08-08 — a guide says what it is, once

Two questions were being asked about every guide, and they were the same question. One was asked by the folder a file sat in — a path under `designs` made it a design. The other was asked by the file's own words. Two answers meant two places to look and two ways to be wrong, and a whole picking row that carried nothing the kinds could not carry.

**Design and work joined the kinds**, so there are seven: the first five say how a guide reads, the last two say what it is about. That is a real difference and it is fine — a file is one of the seven, and the question is asked once.

**What went with the purpose row.** Its own remembered setting, its own toggling rule (the last one on could not be turned off — a rule that existed only because purpose was not a kind), and the side-by-side layout that measured two pickers against the width of the box so they could share a bar. Projects now has its own bar like kinds and tags.

**The sweep was small.** Three files sit under a designs folder across all five collections; they had said explain, refer and specify, and now say design. No file gained `work`: the app never lists work notes at all, so the kind is there for when they are swept in.

## 2026-08-08 — one ladder of names, and a top that holds still

Every kind of measurement now uses the same nine words — micro, faint, tiny, small, normal, big, fat, huge, pill — and a kind simply leaves out any step it has no use for. Before this, a gap called its middle `default`, a font called its middle `base`, a height called its middle `control`, and reaching for a size meant opening the file to check what this one happens to call it. Now it is one decision: pick the kind, pick the step.

**Only names changed.** Every number is exactly what it was, so nothing on screen moved. 267 lines across 21 files, plus the file of constants itself; the styling names follow the same ladder, so `--font-tiny` and `--gap-tiny` read as the same step of two ladders — which is what they are.

**Separator and thickness turned out to be one thing** — both are the thickness of a drawn line — so they collapsed into thickness, which gained the separator's heaviest step rather than losing any of its own.

**One real break came out of it.** The word for the typeface and the word for the middle text size became the same, and the one set from code wins, so every word on the page would have fallen back to Times. The typeface has a name of its own now.

**The top of a file is a fixture.** The title stands in a slot of fixed height, and the line beneath it belongs to the page rather than to the title — so the line stays whether the title is shown, folded, or open for changing, and everything after it always begins at the same place. Before, the line was the title's own bottom edge: folding the title took it away, and opening the title took it away again.

**A piece opened for changing holds what follows.** The box standing in for a piece is never quite that piece's height — different spacing above, a hair of room held inside it, whole-pixel rounding — so rather than accounting for each of those, the box measures where the piece below it stood and sets the room under itself to whatever puts it back. A subheading's box does the same for its own top, since the room above a subheading depends on what came before it. Both say in the log how far off they were.

**A heading is a row now.** Its fold mark used to be placed by two numbers that measured against different things — one against the heading's height, one against the mark's own — so neither could do the job alone and both were tuning knobs. The row holds the mark level with the words, and nothing says how far down it goes.

## 2026-08-07 — the disk is the only source of files

Overview used to learn which guides exist by scanning the five collections when its code was prepared. That scan is gone. The dispatcher — the small server on this machine that the log lines go to — is asked what is on disk, and that list is the whole picture: read in one pass, nothing settled in advance.

**Why it had to go.** Scanning put every guide into the dev server's own watched set, so writing to one reloaded the page under you. Renaming did it, moving did it, even mending an index did it. Two of those had a deliberate restart in them as well, from the days when a moved file really was invisible until the app started again; both are gone, and with them the routine that did the restarting.

**What it costs.** The dispatcher is required now. Without it there are no guides at all, so the screen says "the dispatcher is not answering — start it, then reload" rather than sitting empty. That is honest: the app could not save, move or delete anything without it either.

**One bug this settled on the way.** While the old scan and the new list both existed, a file moved since the code was prepared showed twice — once at its old place with no labels, once at its new one. With one source there is nothing left to disagree.

**A ⤴ button beside the trash.** It opens a new message addressed to Jonathan, the guide's name for a subject and its whole words in the body. Nothing is written, moved or thrown away by it. ji has one too, at the left of its help button, opening an empty message.

**ji's chat stopped hiding itself.** While the AI was unreachable the chat was replaced by a note — which left nothing on screen that would call the AI, so nothing ever noticed it come back, and the note sat there forever. The chat is always there now, with the note above it saying to ask anyway; asking is itself what finds out. The every-few-seconds check that watches the connection also runs while the chat is showing, and is counted rather than switched, so leaving the chat no longer takes it away from the AI store.

**Two of the standing rule files were renamed** — replying became response, working became agency — with every mention updated, the hook that loads them included.

## 2026-08-07 — a guide can be named, thrown away, and marked up

**The file's name is a field now.** It reads as plain words in the middle of the top row, takes a pill-shaped edge and the hover color when pointed at, and turns white while being typed in. Leaving it or pressing Return gives the file that name; Escape puts the old one back.

**Renaming used to close the view, and no longer does.** A guide is named by where it sits, so renaming moves it — and the view, still asking for the old place, found nothing and shut. Two things were wrong: the rename ended by restarting the whole app, which is no longer needed now that the app asks the disk what files exist; and the app's picture changed a full second before anything said so, while links in other guides were being mended. The move is now announced the moment the file lands, and whatever is reading that guide follows it — the stack of guides reached by links too.

**Throwing a guide away.** A trash mark sits at the right of the second row. Pressing it puts `delete "<name>"?` in the row itself, with a cross where the trash was to keep the guide; the name steps aside, since the question already says which file it means. Saying yes deletes the file, takes its line out of the index beside it, drops it from the list and goes back there. The dispatcher gained a delete route with the same refusals as moving: it must be a guide, inside the repo, and actually there.

**A new file no longer needs a relaunch.** The app's list of files is settled when its code is prepared, so anything added since was invisible. The dispatcher now says what is on disk, and the app reads whatever its prepared list missed. A file arriving with no labels gets a block composed from its own words — its first heading for a title, the first thing it says for a description — written to the file and marked `stale`, since no machine can judge which of the five kinds it really is.

**Editing gained a few hands.** A chunk of code is one piece now: the reader hung its line numbers on the words inside rather than the box around them, so only the words could be reached. Command with b, i or a hyphen makes what is picked heavy, slanted or struck through, and again undoes it — one star is slanted, two are heavy, three are both, so slanting heavy words adds to them rather than half-undoing them. Typing a bracket, brace or quote with words picked wraps them, and typing it again unwraps.

**The five kinds were renamed** to specify, step, wire, explain and refer, across a hundred guide files, the app's own list, and the two notes that spell them out.

## 2026-08-06 — the bars are catchable, and the thumb never a speck

Every bar was six pixels — chosen against the browser's heavy grey strip and overshot, so a bar was hard to catch and its thumb was a thread. They are fifteen now, and how thick they are is said once and read everywhere.

**What the earlier round got wrong.** The app-wide form of a bar's rule matches nothing at all, so deleting each box's own rule handed every bar back to the browser at its full default width. Each scrolling box has to name itself. A name inside those rules does work, though — that was the untested half of the old lesson — so all four bars read the one published thickness instead of a number typed out four times.

**A floor under the thumb.** The browser sets a thumb's length from how much of the contents fit on screen, so a long file shrank it to a speck. It is now never shorter than a fifth of its lane.

**Both thumbs at once.** To see whether that floor does anything, the list and the file both draw a thin marker where the browser alone would have put the thumb, laid over the real one — and only while the two differ. The arithmetic is one tested piece both views share. One bug fell out of it: folding a section changes how tall the words are but not the box holding them, so nothing told the marker to look again; folding now says so itself.

## 2026-08-06 — the way out is the whole top of the view

The way back to the list was a small circle at the far left — a lot of aim to demand for the commonest move in the app. It is gone. The two rows above the heavy line are one block now, and a press anywhere in it that isn't on something answering for itself goes back to the list. The things that answer are the step marks, the search field, the count between its marks, and the file's name. Escape still does the same, and the words themselves are left alone so nothing typed is lost by a stray press.

**The rule is proved without a page.** Walking up from the thing pressed to the block it sits in, every tag name and class name met along the way is gathered, and any one of them being a control settles it. That list of names is what the eight new tests exercise — the empty space leads back, each control does not, capitals read the same as small letters.

**Lighting only the empty part.** A block lights on its own whenever the cursor is anywhere inside it, controls included, which would have promised a way out where there wasn't one. So the same rule that decides a press also decides the light: the cursor is followed, and the block lights only while it is over empty space. The lit color reaches the box's left, right and top edges, since the space a box holds around its contents is part of the area being offered.

## 2026-08-05 — reading a file became editing a file

The reading view had a button that turned editing on and off, and a good half of it only ran while that was on. Editing is what the view is for, so the switch is gone: every file opens ready to change, a click on any piece opens that piece, the label form is always there, and the piece is named for what it now does. The way back is the close cross and the Escape key — a click on the words can no longer throw away what is being typed. The rename button went too, though the handler behind it stayed for whatever asks next.

**The top rows were rearranged, twice.** The search takes the first row now, with the count and its two step marks appearing beside the field once there is something to look for. The row below carries the way out at its far left, then the step marks, then the folders above the file, with the file's name pinned to the middle of the whole width so nothing beside it can shift the name. The file's own name row is gone.

**One pixel of drift.** Going from the list to a file and back moved everything a pixel. The search row was one pixel taller than the list's own top row, having been padded to stop it growing when the step marks arrive. The marks are now held to the row's height — they still show whole, since they are allowed to spill — and both rows are the same height again.

## 2026-08-05 — one search, wherever you are

The words looked for in the list and the words looked for inside a file were two separate fields, each forgotten on the way to the other. They are one value now, with which place is lit held beside it. Words typed in the list are already in the field when a file opens, and the first place they turn up is lit; stepping to the next file carries them along; and both come back after a reload. The consequence is deliberate and worth knowing: typing while reading also narrows the list behind it.

**Folding a section stopped fighting the title.** Folding the top heading used to force every section below it folded, which meant a section's own soft pointer could be pressed and nothing would happen. A file now follows the shared title fold until the reader presses one of its own section pointers; from that press the file keeps its own folds, so a single section can be opened while the title stays folded. Stepping to the next file still finds everything folded.

## 2026-08-05 — a file's own sections fold

Every heading below the first now carries a small soft pointer out in the left margin, the way Obsidian draws one: turned down while its section shows, sideways while folded. Pressing it hides everything that heading owns — up to the next heading of its own level or higher, so folding an outer one takes the inner ones with it. The top heading carries one too, folding every section at once, and it reads as open while any single one is still open. The folds belong to the file being read, so opening another starts with everything shown.

**Where the marks had to live.** They were being made from the start — the log said nine of them — but nothing showed, because a box that scrolls clips whatever sits outside it and each mark is placed left of its heading. The left inset moved from outside the box to inside it, and the marks now sit in that lane; the words did not move.

**The lesson, again.** Two rounds of guessing were wasted before one logged line said how many pieces were seen and how many marks were made. That answered it at once. Where the screen is the only witness, log the numbers rather than reason about the source.

## 2026-08-05 — the filters fold behind a word, like everything else

The button that hid the picking rows sat beside the search field, the last thing in the app still working that way. It is gone; the search field takes the whole row, and a heavy line under it carries one word that folds the whole set at a press anywhere along it. Shown, the word is just `filters`; folded, it says what every row holds — `filters ➜ designs, di, rule` — leaving out any row narrowing nothing, since "all" is not worth the room. The plain heavy line below the rows, and the gap under the word, are there only while the rows are.

## 2026-08-05 — the step marks became a piece of their own

The two fat triangles that walk from one file to the next were written out inside the reading view — shapes, sizes, the repeating hold, and the markup. They are now one piece anywhere can use, taking whether it can go back or forward, what to do for each, whether it runs up-and-down, whether both show even when one leads nowhere, and the hover words. The reading view uses it twice: once between the close cross and the edit button, and once either side of the search count. Seven tests cover which way each mark points, when it is drawn, when it answers, and the hold — one step at the press, a patter after the pause, never two beats at once, safe to release when nothing is held.

**Two small things while editing.** A piece's own words end with the blank line that separates it from the next; that line is now kept out of the box and put back on saving, so the file is unchanged either way, and the box no longer opens two lines tall for one line of words. And pressing the bar beside the words used to take the cursor off the box, which closed it — so scrolling threw you out of the piece. A press in the bar's lane is now noted and the box takes the cursor straight back.

## 2026-08-05 — the reading view reads like a page

**The words look like a page now.** Paragraphs step in and stand a gap apart, the six heading levels wear the colors Obsidian gives them, and a hairline runs under the top heading with room below it. Punctuation is left exactly as the file writes it — no curling quotes — so a piece never looks one way on the page and another in the box that edits it. That box now matches a paragraph's size, leading, spacing and step-in, and draws no edge at all, so opening and leaving a piece moves nothing.

**The top of the view was rearranged.** The button row keeps the close cross and the edit and rename buttons at its left, and the folders above the file at its right. The row below carries the file's name alone, twice the ordinary size, with the two step triangles at its far left. What the file is labeled — its kind and tags — moved to the line under the search row, which reads `okf ➜ rule, session, team` whether the label form is open or shut, and folds that form away when pressed; the OKF button is gone.

**Every scrollbar is 6px with an accent thumb and no track.** This took far too long, and the lesson is worth keeping: a scrollbar's own styling cannot read the sizes pushed onto the page — a name there silently falls back to the browser's fat bar — and the universal form of the rule never matched at all. Both bars are now styled by naming their own element, with plain numbers. Two places were also holding back a hardcoded 20px for a bar that no longer needs it.

**The collections stand on their own.** Each project used to hang under the shared folder on screen as well as on disk, so shutting mono took all four with it. The walk now starts at all five; the chain on disk is kept, since following a link from one project into another climbs it.

## 2026-08-04 — the tags gathered into areas, and every name shortened

Twenty-four tags in one flat row was more than an eye could scan. They now sit in six areas — ai, code, fix, harness, other, ux — each standing as a single pill that folds its tags away behind its own name. Shut, a pill reads its area's name, or the names of whatever inside it is picked, so a filter on is never invisible; a picked tag also fills the thin ring between the pill's two borders. Open, a cross takes the left end and the tags run as one unbroken row of segments at the right, with the area's name straddling the top edge over the cross. Opening one leaves the others as they are, picking a tag leaves it open, and which are open is remembered — the filters and the label form share one memory, so an area left open in one is open in the other. A tag nothing is left wearing simply goes; with one left the area steps aside and that tag stands as a plain pill; with none left the area is gone.

**Every word cut to its shortest true form.** The five kinds are now rule, howto, wiring, why and lookup. Fourteen tags were renamed — architecture became wire, collaboration became team, philosophy became vision, and testing, debugging, migration, refactoring, porting, code-style and session-start all lost their endings. Alphabetical order everywhere now ignores capitals, so UX sits between tools and vision rather than ahead of everything.

**One trap this sprung.** A tag picked last visit and since renamed narrows the list to nothing while no longer showing anywhere — nothing left to click to undo it. Anything remembered that is no longer on either closed list is now let go at launch.

**The separators earned their keep.** One bar can carry several words, spread evenly along it or held to its two ends; a word can be a button, and since a bar is two pixels tall a clear strip the height of an ordinary control lies along it so pointing anywhere lights the word and clicking anywhere presses it. Every filter row now folds away behind its own word, which then reads what is picked — `purpose ➜ designs` — and those folds are remembered.

## 2026-08-02 — guides can be moved, and handed to Obsidian

**Dragging a file into another folder.** With the folders on screen, a file can be picked up and dropped on any folder — the folder lights on the accent as the cursor crosses it, and its own folder never lights. The file moves on disk first; only if that works is the picture on screen changed, so nothing here can claim a move that didn't happen. A move can cross collections, since the four project folders hang under the shared one. Reading a moved guide needs no restart: its words come from wherever it now sits.

Four refusals, proved against the write server directly: a name already taken in the new folder, a folder that isn't there, a file that isn't there, and any path outside the guides folders.

**One bug worth remembering.** The drop did nothing at first: it let go of the file being carried before asking whether the file could land, so the answer was always no. Ask first, then let go.

**Handing a guide to Obsidian.** The repo is itself a vault, so a guide's place counting from the top of the repo is also its place in the vault. Command-clicking a file in the list opens it there; command with option opens it here for editing instead. Command-clicking the edit button in the reading view does the same. The hover words follow every case as the keys go down and up.

**Small things.** A "labels" toggle beside edit folds the label form away without leaving editing, and is remembered. The file that turns a guide's text into a page is now named for the markdown blocks it works with, so the word "block" means one thing in the code and another nowhere.

## 2026-08-02 — a guide can be changed from inside the app

Overview could only read. Now a guide can be edited where it is read, and the file on disk changes with it — one piece at a time, never a wholesale rewrite.

**The trap avoided.** Making the whole page typeable and turning it back into markdown on save would rewrite the entire file: every blank line, link style and indent becomes whatever the converter prefers, so a one-word fix lands as a rewritten file. Instead the page is never converted. Each outermost piece — paragraph, heading, list, quote, fenced code — is stamped as it is drawn with the lines of the file it came from, and a click opens that piece in a plain box holding the file's own words for those lines, hashes and dashes and all. Saving swaps just those lines. Every other line stays character for character what it was.

**Two guards on every write, and both refuse rather than risk.** The path must end in .md and sit inside a guides folder, and the file on disk must still read exactly as the app last saw it. Proved against the write route directly: a real write goes through leaving the file identical, a write claiming the wrong "before" text is refused, and a path outside the guides folders is refused.

**The five labels are edited as one thing**, through a small form — kind and tags picked from the app's own closed lists, never typed. After a successful write the list is told at once, so a new title or tag shows there without every file being read again.

**Getting in.** An edit toggle sits at the far left of the reading view, beside the close cross; holding the command key while clicking a file in the list opens it already editing, and the hover words say "edit" rather than "open" the moment the key goes down.

**Method.** Built in six steps, each stubbed and tested before any code: 53 tests now, covering the line numbers each piece claims, taking the labels off the top, putting typed words back in place of a run of lines, drawing a whole guide again after a change adds or removes lines, working out where a guide sits in the repo, and writing the labels back. Overview had no test runner before this; it has one now.

## 2026-08-01 — the filters fold away

A toggle at the far left of the top row hides the three picking rows — tags, kinds, projects — and their dividers, giving the list that height. The words looked for stay: the search field moved up beside the toggle and shows either way, since it is the one filter worth keeping in reach while the list is long. The choice is remembered across visits.

Two things settled while doing it: each divider now names the row *below* it rather than the one above, and the titles were cut to one word each — tags, kinds, projects.

## 2026-08-01 — searching the guide on screen

A second row under the reading view's top row holds one search field, the same pill as the list's, with the browser's own clear cross. Every keystroke lights the first place those words turn up and moves there; nothing lit is answer enough for a miss, so nothing flashes while the words are still being typed. What is typed is taken exactly as typed — a space counts like any other character, so two words are looked for together. The field belongs to the guide it was typed in, and empties when another guide opens.

**Two things came out of it.** Links now carry their own hover words, so pointing at one reads "follow this link" while the rest of the page still reads "back to the list". And the reader's habit of guessing at web addresses was turned off: it read the bare words "CLAUDE.md" as a site in Moldova, whose ending is the same two letters markdown files use, and clicking it left the app. Now only text that says outright it is a web address becomes a link.

**Left undone on purpose.** A link pointing outside the guides folders — a work note, a code file — still finds nothing. What it should do instead never came clear, so it sits in code debt rather than being half-built.

## 2026-08-01 — the links inside a guide came alive

A guide is full of links to other guides, and until now a click on one both shut the reading view and sent the browser off to the raw file. Counted across all five collections, the guides hold 505 links to a heading in the same guide, 222 to another guide, 183 to a code file or a note outside the guides, and 22 to the web. Each now does its own thing: move down the page, open that guide here, say plainly it isn't part of the picture, or open a new tab.

**Following a link.** Each guide knows the folders above it, so a link is answered by climbing that chain and taking the first guide of that name found beneath any folder on the way up. Before any of that: the heading is split off, the web spellings are put back to plain characters, and the file ending comes off — a guide is named without its ending everywhere else in the app, so the search works on plain names. An index file stops the search before it starts, since those are left out of the picture on purpose; a link naming one finds nothing, which is the right answer rather than a fault, as is a link naming a code file, whose name matches no guide.

**One top folder, not five.** For that climb to leave one project and reach another, the four project folders now hang under the shared one, since that is how they sit on disk. Every row indents one deeper, and the shared folder's count is now every matching file rather than only the shared ones.

**Headings had no names.** The markdown reader leaves them unnamed, so a link ending in "#naming" had nothing to land on. Each heading is now named after its own words — lowercased, anything that isn't a letter or number becoming a dash — which is how the writing tools make them, so the links already written in the guides line up.

**Stepping, while off the list.** Following a link puts that guide on a stack of its own, which starts empty each time reading begins from the list. While the stack holds anything the two triangles walk it rather than the list: back one down, forward one up, and the forward triangle is simply absent at the top — which is the visible sign of being off the list. Backing out past the bottom empties the stack and hands the triangles back to the list, wrapping at both ends as before. A link to a guide already on the stack backs up to it rather than adding it twice; a fresh link from partway down drops the guides above and lands on top. So the stack is always the path actually taken, and no guide is ever on it twice.

The list's own array is untouched: the count under the filters never moves because a link was followed, and a guide the filters hide still opens, because the reading view now finds a guide among all of them rather than only among the rows on screen.

## 2026-07-31 — the whole row answers, and hidden folders stop hiding

Clicking anywhere on a row now does what clicking its name used to: a file opens for reading, a folder opens or shuts. The hover hint moved with it, so the words follow the cursor across the whole row. The little triangle keeps its own click and stops it from reaching the row, so hitting the triangle on a folder doesn't toggle it twice.

A count that read "119 guides (of 135)" with nothing filtered gave away the second thing: three folders had been left shut from an earlier visit, and shutting a folder was still hiding its files even with the folders themselves off screen. Now, with the folders hidden, which ones were shut is set aside — remembered, not applied — and comes straight back the moment the folders do.

## 2026-07-30 — sorting, while the folders are hidden

With the folders off, the list is a flat run of files — and a flat run is a thing you can sort. With them on it isn't: a sort would have to either scramble the folders or sort inside each one, and neither is what anyone means by "sort by name". So sorting is offered only while the folders are hidden.

Clicking a column title walks it through three states: smallest first, largest first, then not sorting at all. More than one column can sort at once — the first decides, and each one after it only breaks a tie in the ones before, with a small number on the title saying where it comes in the order. Beside the show/hide folders button, a second button reading **unsorted** puts the list back to the order the walk gave it; it shows only when the folders are hidden, a sort is on, and there is more than one file to put in an order.

Three things settled along the way:

1. **Sorting by tags sorts on the whole string** the tags column shows — "architecture, data" — so what's on screen is exactly what it sorted by.
2. **A file with no tags sorts to the bottom**, both directions, rather than piling up at the top when the sort turns around.
3. **Turning the folders back on stops the sorting.** No sort is held in reserve, so there is never a hidden choice waiting to surprise anyone.

A project column also appears between kind and name, but only while the folders are hidden and no project is picked — with one picked, every row would read the same. When that column leaves, it stops sorting too.

## 2026-07-30 — a projects filter

Four collections of guides sit in this list, and the only way to see just one was to shut the other three folders by hand, then remember to open them again. Now a fourth control sits above the kinds, with a divider between them: an "all" segment first, then one per collection, the chosen one filled with the accent. One at a time — four collections is few enough that picking one is the whole point.

It was small, because the road was already built. The narrowing lives in the hierarchy and reads its filters from one place; this added one more to that place and one more line to the matching. Each file already carries which collection it belongs to, so there was nothing to look up.

**A project filter and a shut folder are the same idea from two directions**, and they can disagree — pick "di" while the di folder is shut and you see one folder and nothing else. They were left independent, letting the filter speak through the folder counts exactly as the other filters do. Having a project pick force its folder open would mean one control silently reaching into another.

## 2026-07-30 — two labels in the reading view's top row

Reading a guide showed its words and its name and nothing else. The two facts that put it in context — what kind of guidance it is, and what it's about — were on screen in the list and vanished the moment it opened. Now the kind sits immediately right of the two step triangles at the far left, the tags immediately left of the close button at the far right, and the name is pinned to the middle of the row itself, not centered in whatever space its neighbors leave over.

The real work was underneath. **One shared array, kept by the hierarchy** — the thing that already holds every folder, every file, and the tags on them. It holds what the filters and the folds leave, in the order shown, folders included. The list draws its rows from it and the reading view steps through it, so neither side can show something the other doesn't know about.

Each entry is a whole row, not a bare file: the guide together with the tags on it, how deep it sits, the folder chain above it, and whether it holds anything. A file doesn't carry its own tags — they're separate records linked to it — so looking them up is real work, done once as the row is built and never again.

Stepping is the reading view's own affair: moving forward or back it walks past any folder it meets until it lands on a file, wrapping at both ends. The fat triangles count files only — three folders around one file looks like four things, but there is only one guide to read.
