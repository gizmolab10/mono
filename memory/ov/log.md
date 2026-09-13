# ov log

<!-- consolidated: 9 September 2026 -->

## 10 September 2026

- D: knowledge bases phase 2 built, short of the removal. dispatcher.py answers /scan (every listed file's kind and tags into the db as hand labels, run once on the real db: 485 files, 321 kinds, 780 tags, 152 with no block), /all-labels (every label in one answer) and /strip-labels (built, guarded by a confirm word, not run). database.py gained replace_labels, record_file and all_labels. Files.ts asks for every label beside the listing and takes kind and tags from the db, never the block, and writes the db first on any change, through Labels.ts's label_changes, which is tested. Edit_Filters.svelte and Edit_Markdown.svelte write the db before the file. The block is still written whole until the removal runs. 49 checks in test_database.py, 35 in test_dispatcher.py, ov 339 tests, check clean at 532 files
- D: the removal ran. /strip-labels, asked with a confirm word, took the kind and tags lines out of 332 files, left 1 untouched and passed over 152 the db holds nothing for. Labels.ts's label_block writes neither line any more, so a block still carrying them loses them when next written. test_database.py proves the scan and the strip on a repo made for the run, 58 checks. ov 341 tests, check clean
## 12 September 2026

- D: the plugin entry in kb's lexicon says plugin.py alone, the dispatcher-side code with its three jobs, the snippets and the configuration being the host's page's to hand kb, and the plugin's folder is the host's own, named by its ports.json entry, at what it is and in ov's lexicon, in place of the collections row, which no longer holds it
- D: plugin stays, in truth/decisions.md, and the five pacs against it, specialist, envoy, theme and its three, specialty with purpose, and savvy, are removed from the file
- D: pac for savvy in place of plugin, in truth/decisions.md, naming the code by what it provides, a host's knowledge of its own files: for, one everyday word saying whose and for what, no letter shared with specialty. Against, slang a reader asks about, a quality not a thing, know-how and expertise say the same plainer, and 35 lines. Deciding question: a plain word for knowledge, or the standard word for how it is loaded
- D: pac for specialty becoming purpose and plugin becoming specialty, in truth/decisions.md: for, plugin goes and no new word enters. Against, 46 lines and two headings move, every reader relearns specialty, purpose says why not what and is taken by the proposed rules, and specialty.py reads to no programmer where plugin.py reads to all. Deciding question: is plugin going worth that
- D: pac for theme, skin, specifics or custom in place of plugin, in truth/decisions.md: for all, the code is the host's own and the word plain, specifics best. Against, theme is core's word for the colors, skin says the look of a thing that draws nothing, custom is customizations' half, specifics has no singular and names a quality, and plugin is the standard word that names the file. Deciding question: does plugin fail to say whose the code is, or what it does
- D: three lines for step 3 in zone/music and ai.md: ai's collections rows are made at step 3 from the files rows and then by the look as a new one appears, the hosts at step 3 are ov and mu with ov the default and ai's entry naming ov.db from step 4 until ov is retired, said in adopt kb too, and a project in ai is a project's files, its memory folder and its CLAUDE file
- D: pac for envoy in place of plugin, in truth/decisions.md: for, it says whose the code is and where it works, one everyday word sharing no letter with specialty, and the three jobs read as a person's. Against, a metaphor a reader asks about where plugin is asked by nobody, envoy.py a poorer file name, the diplomacy not there, and 35 lines to change. Deciding question: whose and where, or what it is to a programmer
- D: pac for specialist in place of plugin, in truth/decisions.md: for, the family with specialty and plain English for code that does one thing well. Against, three letters from specialty in the same sentence, specialty already covering the code, plugin the standard word that names the file plugin.py, ji saying plugin architecture, and 35 lines to change. Deciding question: named by what it is to the dispatcher, or to the host
- D: adopt kb's configured value collection is host, ai or mu, which ports.json pairs with a db, since collection now means a project or a root folder. The type, the not-handed list and step 29 say host
- D: the nine fixes are in zone/music and ai.md and the proposal section is gone: ai's collections share the mono repo as root at what it is, the tables and step 3, author not editor and no login with the author question ticked, project a memory folder, db the file and dump the statements in the new lexicon, ai's collections as collection_of names them, no host's folder on a collections row, kb's collection filter as ai's project filter at hierarchies, step 25, the kb list and adopt kb, the project on the files row, and ports.json as the host list with a host parameter on a request
- I: zone/music and ai.md gained proposed fixes, nine, from the reading before step 3: ai's collections share the mono repo as root, author not editor and no login, project as a memory folder, db as the file and dump as the statements, ai's collections as collection_of names them, no host's folder on a collections row, one collection filter that is ai's project filter, the project on the files row, and ports.json as the host list with a db entry per host
- D: each file's row holds the name of the group at the top of its hierarchy, worked out once when the row is made: in ai's db the project, as collection_of gives today, so ai's rows are left as they are at step 3, and in mu's db the root folder. Step 3's line, the ai table's row, now project, and adopt kb's not-handed item say so
- D: step 2 built, the backup and the dump. ov.db saved beside itself as ov.db.before-step-2. The ignore line is tools/hub/*.db*, so every db file beside the dispatcher stays out of git and ov.sql goes in. database.py gained dump_place, write_dump and restore, the three stable calls untouched. The dispatcher answers /dump, writing every table as sqlite's own statements to ov.sql beside the db, and /restore with a .db name, making that file beside the db from the dump, refusing the live db's name, a name with a folder in it and a name that is not a .db. Proof: ov.sql written and read back into ov.restored.db, every label the same as ov.db, test_database.py 125, test_dispatcher.py 39, the always test four of four, big-picture 15
- D: step 3 built, one db per host and the collections table. ov.db saved beside itself as ov.db.before-step-3. ports.json names ov.db under ov and mu.db under mu, and database.py reads the pair into HOSTS at import: place_of answers a host's file, PLACE when told none, open_db is given the file to open, and every call takes a host, the three stable calls keeping their names and answers. The collections table sits beside the four, one row per collection, name, specialty and root, with collections, ensure_collections and add_collection to read and make rows. The dispatcher reads a host parameter on every db route, ov when none, refusing a host with no db, answers /collections and /add-collection, and its look makes a row per project the listing names, ai the specialty, the repo the root: 14 on the day. A refusal sent before the body is read now drops the body first, since the reset it caused reached the asker in place of the refusal. memory/filter tree, 23 missing files on the files rows, got no row, since the listing no longer has it. Proof: test_database.py 157 with two dbs, test_dispatcher.py 45, the always test four of four, big-picture 15, and ov's dump after against before differs by the 14 collections rows alone, 1116 labels in each
- D: zone/music and ai.md made ready for step 4: the row count is 89 in every place, five tables built, edgy 2 puts one db per host at step 3, ai's collections rows are the look's, mu.db exists empty, one dump per host, the lexicon checkboxes say when they are ticked, step 4 gives ai its ports.json db entry naming ov.db and moves adopt kb.md to memory/kb, step 5's configuration holds the host's name and not the collection information, and the ai host's entry file is main.ts, lowercase, decided, in truth/decisions.md and adopt kb
- D: step 4 of zone/music and ai.md corrected in five places: the CLAUDE files sit in mono/kb and mono/ai where ov's and mu's sit, gallery alone has no port and no servers entry, kb's one bridge is to core with panel's arriving at step 5 and ai bridging core and kb with panel's alias carried and named by no file, ai's main.ts does ov's main.ts's four jobs through kb's bridge and kb's Main.svelte is ov's App.svelte under that name, and step 5 joins 6, 8 and 9 as a step that moves no piece
- D: step 4 built, the two new projects. mono/kb is ov's src whole, App.svelte under the name Main.svelte and no main.ts, checking and testing alone with core_alias.test proving one bridge: 532 files clean, 338 tests. mono/ai is an empty host, main.ts doing ov's main.ts's jobs through the bridges Core.ts and Kb.ts, App.svelte drawing kb's page, Customizations.ts holding the name, core_alias.test proving the bridges and that nothing reaches through panel: 524 files clean, 5 tests, and it builds. ports.json has ai at 5187 with a db entry naming ov.db, the dispatcher restarted to read it, mono's workspaces and servers.sh have both, adopt kb.md moved to memory/kb/zone, and memory/kb and memory/ai each hold an index, a log, a lexicon and a map. Not done: the hub page's button and the dispatcher's COLLECTIONS, neither named by the step. ov untouched
- D: step 5 of zone/music and ai.md made ready: the configuration lists the name the controls row shows, kb draws a piece as today until the step that moves it, three substeps say kb's second bridge is Panel.ts with its alias and test, what kb hands panel's four from and that the hamburger is panel's, and what ai fills now, name, host, hierarchies and builds, against step 7's keys and step 9's prefix, with Saving.ts sending the host from step 5. A new question, 5c, asks whether panel's status line grows kb's offer or kb keeps its own, and the build is 5d. adopt kb corrected to match: ov's row shows no host name, builds.md is read in Main.svelte in kb, and its open section says three
- D: the name yields to the file's section in panel's controls row while a file is open, in truth/decisions.md, step 5's what kb hands panel and adopt kb
- D: step 5's paragraph says what adopt kb says of the snippets' arguments: the edit filter section takes the clicked file, and the operation view takes the file, the width and the height
- D: browse has filters above its list of files, search first, then collection, kind and tag, and a host's browse section is a filter among them, after tag, last above the list: 5a answered and ticked, in truth/decisions.md and adopt kb's snippet table
- D: 5b and 5c answered and ticked: a hierarchy names its label and its order within a group, and panel uses core's status line, which carries the offer, in place of its own words, corrected from core adding it, since core's has it. In truth/decisions.md and adopt kb, whose type gains Hierarchy and whose open section is empty
- D: step 5 built, the hand-over. kb's Customizations.ts, the eight facts with defaults naming no host, and Panel.ts, its second bridge, with the panel alias in its tsconfig and vitest config; Main.svelte draws panel and hands it kb's own four, Controls.svelte less the hamburger, Details.svelte and Operation.svelte inside panel's regions, and Status.ts's words and offer; Main.svelte takes the host's four snippets and hands each down to its place, the browse filter after tag in Browse_Filters.svelte, the edit filter section between the kinds and the tags in Edit_Filters.svelte, the details section below the rules in Details.svelte, and the operation view below the label form in Edit.svelte; Saving.ts sends the configured host with every ask; panel draws core's status line with the offer passed through; ai's main.ts fills name, prefix, host, hierarchies and the build notes table, builds.md moved to ai, before anything mounts. Proof: kb check clean at 541 files and 343 tests, core_alias proving two bridges and customizations.test every default naming no host, ai check clean at 532 files and building, panel 414, gallery 480, mu 417, lv 406 and mj 480 clean. Not looked at in a browser. adopt kb says built, kb's map, index, CLAUDE and lexicon, ai's map and index, and panel's index and log say so
- D: panel's details column sits on the accent, decided, so kb's column looks as ov's did. In truth/decisions.md, panel's Details.svelte, index and log
- D: panel's details column holds no gap above, as ov's does not, after Jonathan saw its top section about 15px too low: one gap, 7.8px, was panel's top padding, and the rest, if any remains, is to be measured in the browser
- D: panel's details column nudged further up, a big gap and a tiny gap in the end, 13.6px, Jonathan setting the rungs by eye, a negative top margin that is a nudge and not a cause
- D: panel's controls row hands its right end to the host as a flex box filling the row past the hamburger, in place of a spacer sharing the width, so kb's way back sits one gap off the hamburger as ov's did and not halfway across. In panel's Controls.svelte and log
- D: ov is frozen forever, from 12 September 2026 — the tolerate-ov-changing requirement is reverted; every further change goes to ai, or kb once the piece is kb's; the plan's intro, edgy 3 and step 9 say so, risk back to low
- D: ai first, re-decided over 11 September's music first, and the plan renumbered to match its order — first 1 to 3, the strip 4 to 19 (the plugin mechanism at step 6, ai's plugin first), music 20 to 24, then 25 to 32 unchanged; every cross-reference and saved-file name renumbered with it; the cost accepted: music's needs stay a guess until steps 20 to 24, and step 5's hand-over may be reshaped when they arrive

- D: ov is frozen forever, every further change made to ai, never ov, in truth/decisions.md and the intro of zone/music and ai.md
- D: ai on kb first, reversing music first, in truth/decisions.md. Jonathan reordered and renumbered the plan himself, 1 to 3 the questions, the backup and one db per host, 4 to 19 the strip with the plugin mechanism at step 6, 20 to 24 music, then kb's new work, the drop box, mu adopts kb and later. Co mended what the renumbering left stale: the plugin wrapping and its raising-plugin proof moved from step 20 to step 6, step 8 pointing at step 6 for the import, step 20 no longer waiting on ai's plugin, the edgy section's guard at step 6, and the step numbers in decisions.md, adopt kb.md and index.md
- D: the four db risk statements in the plan say low with step 2's four guards and high without, at step 2's own line and at steps 3, 5 and 11, since the high was written before the guards existed. The other five, low at step 9 and the first player, medium at the looking-proved steps and the ai call's wait, low at AnythingLLM staying on this machine, are unchanged
- D: slip is gone from zone/music and ai.md: an error, in plain words, and step 2's guards line says four things minimize the risk
- D: step 2 rewritten in Jonathan's shape, the issue first, the db the only home of every label, then the saved file and the dump as the two things a spoiled or lost ov.db is rebuilt from, the dump's read-back as its proof, and the guards in plain words. The risk high now sits at steps 3, 5 and 11, the ones that touch ov.db or database.py, each opening with its own saved file, the three stable calls and the always test after every save, and step 2 points at them
- D: label stays, decided over nine words, key, trait, field, aspect, attribute, fact, property, tuple and kvp, each pac in truth/decisions.md closed with it. The shared lexicon's label entry says what it is now, a name and a value on a file with who wrote it, a row in the db, never a line in the file and never the screen's text beside a control, and its kind, tag and brief entries follow
- D: pac for renaming label to kvp, key value pair, in truth/decisions.md: for, it says exactly a key and a value, three letters in the shape of the repo's names, the tables already head a column key, and it collides with nothing. Against, it is letters not a word, cannot be said, made plural or put in a compound, names two parts where the row has three, key already means two other things here, and label is the code's word in 32 files. Deciding question: the shape and nothing else, or a word that can be said and is the code's own
- D: pac for renaming label to tuple, in truth/decisions.md: for, a labels row is a triple, name, value and who wrote this, the word is every programmer's, no meaning of it is a screen's, and it collides with nothing in ov. Against, it names a shape not a role, every db row is a tuple, compounds read as code, it is not everyday English, and label is the code's word in 32 files, the hooks and the tests. Deciding question: named by its shape, or by its role

## 11 September 2026

- D: pac for property or prop in place of label, in truth/decisions.md: for property, the programmer's word for a name and a value on a thing, the old block's own word, plain in compounds, who wrote this reading right. Against, three syllables, and prop is Svelte's, in nine lines of ov's components and the shared lexicon. Deciding question: an object's property worth the rename, with prop out, or label, the code's own
- D: pac for fact in place of label, in truth/decisions.md: for, one plain syllable, the db's purpose in a word, a source built in so who wrote this completes it, and the files row's fields and the host's configuration are facts too, so the word stretches. Against, a fact is true and a suggested tag or a stale kind is not, compounds read oddly, three things answer to one word, and the code's word is label. Deciding question: true by being there, or a claim someone made
- D: pac for attribute in place of label, in truth/decisions.md: for, the one plain word carrying quality, measure and distinction, the standard technical word for a named value on a thing, and its verb says who gave it, so who wrote this reads right. Against, three syllables, the html sense already in six calls of Edit_Markdown.svelte, and label being the code's own word in the table, the column, Labels.ts and the routes. Deciding question: is the html sense the same meaning, worth the rename, or a second one
- D: pac for aspect in place of label, in truth/decisions.md: for, plain, unused in ov, and one way of seeing a file, which fits the hierarchies. Against, an aspect is shown not put on, so who wrote this, a rule and the ai read wrong, it names the name half of the pair, and aspect-oriented is a programmer's term. Deciding question: one way of seeing a file, or one thing someone wrote on it
- D: pac for field in place of label, in truth/decisions.md: for, the db's own word and a kind is one per file. Against, field already names the four columns on the files row in code, routes and the plan, a field is a column with no signature and a label a row, many per file, each with who wrote this. Deciding question: the storage, or the thing on the file with whoever wrote it
- D: pac for trait in place of label, in truth/decisions.md: for, a quality of a thing in plain English, colliding with nothing in ov. Against, a programmer's trait is shared behavior a type takes on, a trait is had and a label is put on, so who wrote this, a rule and the ai read wrong on it, artist, album and title are facts not qualities, and ji's db spec has the word. Deciding question: a quality the file has, or a thing someone put on it
- D: pac for key in place of label, in truth/decisions.md: for, one syllable and the dictionary's word for a name-value pair. Against, key already names the specialty's label names, the db's row key and File.ts's key_of, and label is the code's word in the table, the column, Labels.ts and the routes the hooks call. The shared lexicon's label entry is stale, saying the five lines at the top of a file. Deciding question: does key name the pair, or the name alone
- I: edgy updated: three edgy parts now, the db as the only home of every label with no saved file until step 2 added first, the plugin item naming the 30-second walk until step 5 and one db per host as a second guard, then the three copies, and one list for two hosts as the one to watch
- D: switches is gone from zone/music and ai.md, zone/adopt kb.md and truth/decisions.md, 19 uses: the facts a host hands kb are its configuration, set before anything mounts, and a value in it is configured
- D: the plugin guard is in step 4: every call into a plugin wrapped, a fault failing one file or one request and never the server, with a raising plugin in the proof. The edgy section points at it
- I: zone/music and ai.md gained an edgy section at the top: the design is reasonable, every piece existing already, with two edgy parts, a plugin imported into the one long-running dispatcher, its guard not yet in the plan, and three copies of ov's code through steps 9 to 24, and one to watch, one list for two hosts
- D: one db per host, in truth/decisions.md and the lexicon: ov.db is ai's until ov is retired, mu.db is mu's, both beside the dispatcher under one ignore line, open_db taking the file with PLACE the default so the hooks change nothing, and a path unique within its db. In zone/music and ai.md step 3 is one db per host and the collections table, with no rebuild and no re-keying, step 2's ignore line widens, step 4 imports the plugin from the host list's folder, step 5 scans into mu's db, 5f's WAL files are covered, step 11 names ai's db, the kb list, what it is, the tables and both specialty tables say whose db, and adopt kb's collection switch picks the db
- D: every question substep in the plan opens with question in bold, thirteen of them: 5e, new, before the threading work, which is 5f now with the rule rerun 5g and the library's row 5h, then 6a to 6c, 10a and 10b, 26a and 26b, 29a to 29c, 30a, 31a and 32a
- D: the three questions for later are steps 30 to 32 of the plan, vob through ffmpeg, the letter hierarchy and rules for the ai, each with its decision as a substep, and the open questions section is gone. The kb list's eleven sub-bullets, the performance fixes and the drop box's three, are gone too, since steps 5, 27 and 28 hold them
- D: every open question is a substep of the step that needs it, numbers kept: 6a to 6c before the reading as 6d, 10a and 10b before the hand-over as 10c, 26a and 26b before the grouping as 26c, and a new step 29, mu adopts kb, with the player's three as 29a to 29c and the build as 29d. Step 1 says its four answers. The open questions section keeps the three for later alone. adopt kb's open list points at 10a and 10b
- D: pac for putting every open question into the plan before the step that needs it, in truth/decisions.md: for, step 1 already works that way and the list never meets an unanswered question. Against, a second renumbering in one day, question steps with no proof, three questions for later that precede nothing, and the player's three preceding a step the list lacks, mu adopting kb. A middle way makes each a substep of its step, numbers kept, and adds step 29, mu adopts kb
- D: the plan section of zone/music and ai.md is one list of 28 steps, numbered through, under four headings: music first 1 to 8, ov strip down 9 to 24, kb's new work 25 to 27, the drop box 28. The backup and dump is step 2 whole, the strip's old step 3 is step 11, the ai plugin, the six performance fixes are step 5's substeps with the threading proposal inside 5e and the library's row as 5g, the music phases and the threading section are gone, and the two gaps under can these wait are folded into steps 3 and 5 and ticked. Every step number in decisions.md, adopt kb.md and index.md is renumbered
- D: pac for gathering every step of the plan into one section, in truth/decisions.md: for, one list and one numbering, the music phases and the threading lines being duplicates of music first's steps. Against, the strip's own intro rules fitting half the list, ten step numbers named in three other files, and the kb list being the what that kb's new work points at. A middle way keeps every number under one steps heading with four groups. Deciding question: one running numbering, or the middle way
- D: music first step 1 done: the four answers, one collection per dropped folder named for it, no tags on a song, one row per artist, ticked and folded into the music specialty, its table, the music rules, which no tags makes moot, adopt kb's tags fields and its open list, and truth/decisions.md. Two gaps added under can these wait: step 3's rebuild of the files table with foreign keys off, since the cascade deletes every labels row otherwise, and the library's row waiting for step 5, since one walk takes 30 seconds
- D: the open questions gathered at the end of zone/music and ai.md, out of the music specialty: seven for music first's step 1, with the threading proposal's decision beside them, five for kb after it, and three for later, rules for the ai, letter, and vob with mpg and avi. adopt kb's three stay in adopt kb.md. The answered ninth question is gone, its answer being in the listing rule
- D: the ninth music question answered: mpg, shn, avi, wav, mkv and the jpg cover art are listed, not passed over. The listing rule in the music specialty and in music first's step 4 names them, the question is ticked, and the vob question now names mpg and avi too, which the browser plays no better
- D: the music library is the volume /Volumes/muice myoozk, NTFS over USB, 18,219 files counted by ending, in truth/decisions.md, the music specialty's collection information and music first's step 5 proof. A ninth question under the plugin: 627 mpg, 233 shn, 231 avi, 217 wav, 146 mkv and 3085 jpg are on the disk and not in the listing rule
- D: music first decided, in truth/decisions.md and as the order in zone/music and ai.md: its eight steps on the dispatcher side first, the eight questions as step 1, strip steps 1 and 2 free to go ahead meanwhile, then the strip with step 3 reduced to 3a and 3c, then kb's new work with the two list fixes, then the music phases
- D: two decisions in truth/decisions.md: the hand-over's design is written now as a proposal in ov's zone, moving to memory/kb at strip step 1, and music's eight dispatcher-side questions are answered before strip step 3, steps 1 and 2 going ahead meanwhile. order and steps 2 and 3 in zone/music and ai.md say so
- I: zone/hand-over.md written, the hand-over proposed: eight switches, name, prefix, collection, kinds, tags, tag areas, hierarchies and builds, with ai's and mu's values, four snippets, the browse and edit filter sections, the details section and the operation view, where kb renders each and what ai and mu hand, five things not handed, the type, the proof, and three open questions
- D: pac for building the six threading lines now, in truth/decisions.md: for, the same lines under either order, a fault visible while a look is 0.04 seconds, sqlite keeping rows whole, a six-line revert, the hooks unchanged by WAL. Against, nothing asking for it, a test that cannot force the overlap, WAL's two files binding every future saved file made from the db to a checkpoint, and a slip stalling ov until a restart, risk low. Deciding question: is a proof by reading enough, or does done wait for the first long caller
- D: lexicon gained threaded server, python's ThreadingHTTPServer against HTTPServer, the dispatcher's base today
- I: zone/music and ai.md gained threading the dispatcher, a proposal, six lines and no mutex: ThreadingHTTPServer, BEGIN IMMEDIATE at the top of reconcile, the one read-then-write, WAL at open with the ignore line widened and 3a's saved file after a checkpoint, a snapshot for the sweep over RULED, and the test starting the threaded server and firing two rescans at once. It answers the mutex pac with neither side
- D: pac for a mutex around the look, in truth/decisions.md, against the watcher as the only thread that looks: the mutex is three lines and every caller gets a current look, but whatever holds it long holds every caller, so long work runs outside it in a thread of its own. The watcher alone needs no lock but answers up to 3 seconds stale and needs an Event for rescan and rule changes. Deciding question: a look the moment it is asked, or within 3 seconds
- D: pac for threading the dispatcher now, in truth/decisions.md: for, one line and its import, the db opened per call with writes in transactions, the watcher and the hub's long routes already threads, a look 0.04 seconds today. Against, five callers of the look sharing RULED and reconcile, so a lock is needed too, the suite starting a plain server, and nothing today asking for it. Deciding question: the lock now, or with the first thing that holds the server long, the ai call or music's scan. The earlier pac corrected: the hooks read the db file, not the server, so a call stalls the hub and ov alone
- D: pac for the proposed rules written to truth/decisions.md: for, the db, ov, the rules pass and ji's call already hold the pieces, hand and rule rows untouched, a whole-text answer for a bare file. Against, 13 bare files of 346 and 0 ai rows today, each composed on first opening, the single-threaded dispatcher stalling on every call, the three AnythingLLM settings in two places, the ai undefined in the lexicon and colliding with ai the host, and nothing for music until a song takes tags. Deciding question: worth it now, or after kb and the threading fix
- I: zone/music and ai.md's proposed rules split three ways: common, the mechanism in kb's part of the dispatcher, the instructions file, the rules pass, the sending, the ai rows and the accepting, then ai, its instructions, its words sent, a kind and tags written, the rerun button, then music, tags alone once a song takes them, name, path and the reader's three tags sent, the keys not the ai's, and no rerun over tens of thousands
- I: zone/music and ai.md gained rules for the ai, a proposal, under ai: the instructions as one markdown file in ai's folder, run inside the rules pass while the AI suggestions checkbox is on, sent with the file's words to AnythingLLM through the dispatcher with its own git-ignored settings file, the answer written as ai rows replacing the file's earlier ai rows, hand and rule rows untouched, accepted or declined in kb's editor. The leave open line points at it
- D: zone/music and ai.md reorganized: kb, specialty, schema, then a plan section holding order, ov strip down, music phases and the proposal, in that order, and leave open last. order says it is in force and the proposal says it is not decided. The kb list names hierarchies by a label and says a dropped folder gets the host's specialty. The music definition points at memory/mu's design and project goal, which answer archives, unar, and a pdf beside a song, matched by name, so those two questions are struck, vob points at project goal's own question, and a sixth item, mu project code, is added. The build notes table is defined at strip step 2. The letter row leaves the music table and the music definition, leave open keeps it. music differences is gone, its two items being the music definition's listing rule and the six performance fixes
- I: zone/music and ai.md gained a proposal, music first: eight steps on the dispatcher side, the questions answered, the backup, the collections table with ai and music rows and files keyed by collection and path, the plugin loaded from mu's folder, the six db performance fixes, the tag reader, the streaming route and a first player in mu, before ov is stripped, so kb is designed against a real second host and strip step 3 shrinks to 3a and 3c. The kb tables list is a table now, and the schema's music subsection is music differences
- I: zone/music and ai.md gained the music specialty definition and its key values table: the five things as far as they are known, one collection per root folder, artist, album and title as rows the plugin writes, kind music hard-wired, mu/plugin.py with its listing rule, its tag reader and its streaming route, four hierarchies and the player, and fifteen questions under them, the tag reader, tags for songs, title as row or field, artist as source, archives, pdf beside a song, vob, album under artist, track order, play on click, the steppers playing on, and cover art
- D: the nine performance fixes are in the plan and the section is gone: two under the files list, six under the db and the dispatcher, the music look in its phase 2, and the links in the db in the ai plugin's line. The order says kb's eight come before music
- I: performance bottlenecks in zone/music and ai.md, nine, biggest first, each with a fix proposed: the whole-tree look every 3 seconds, a db open per call, the whole-file fingerprint, the whole-library answer at launch, the hierarchy's per-file array scans, the list drawing every row, the one-at-a-time dispatcher, a rule change rerunning everything, and every file's text read at launch
- D: step 5 no longer builds the plugin import, which is 3c's
- D: the risky bits are in ov strip down's own lines, each at its step with its value: the three copies at step 1, the looking-proved steps in the intro, the live dispatcher and db and the new ground at step 3. The section is gone
- D: zone/ov as knowledge bases.md's Design brought up to date: the db is read and written through database.py by the dispatcher and the three tools, it is git-ignored with no backup yet and the dump is planned, a fifth table, collections, is planned, the files row carries the missing mark, a labels row says who wrote this, the watcher has four outcomes, and item 6 says what was built
- D: the risky bits carry a value each: the live dispatcher and db under step 3 high, the four steps proved by looking medium, the three copies low, the new ground built for one specialty medium
- D: five small fixes in zone/music and ai.md: kb's page named at step 1, project to the browse snippet and the four rows to the edit one, the preferences prefix among the switches' facts, the title tools going at step 7 with their moves at 13, and step 1's sentence excepting 3, 5 and 6. A section, the risky bits, says what no wording takes away and how each is held: the live dispatcher and db under step 3, the four steps proved by looking, the three copies, and the new ground built for one specialty
- D: four of the five are in the plan. Step 1 makes kb all of ov and ai an empty host, ov's suite running in kb. The editor's frame and the label form's stack are kb's, the kinds row and tag areas two kb components, the four rows ai's edit filter snippet, the drawn words ai's operation view snippet inside the frame. Restore refuses the live db. Step 5's proof runs from ov's folder and ai's. kb's page is Main.svelte, gallery's name for the same thing, said in step 2. The risks section is gone
- I: five more risks in zone/music and ai.md, each with a fix proposed: kb all of ov and ai an empty host at step 1, the editor's frame and the label form's stack kb's with the kinds row and tag areas as kb components, a restore that refuses the live db, step 5's proof run from each project, and kb's page named Main.svelte
- D: the seven fixes are in the plan and the risks section is gone. Step 3 is 3a to 3e, each with a proof, the hook's three calls into database.py held stable through them and the always test run after every save. The db never enters git, its dump does, with a restore route to prove it. Two filter snippets, browse and edit, the four fields' rows in the edit one. A claimed route is the plugin's for every caller. core_alias.test is rewritten per chain. memory/ai's working features gets a done column
- I: seven more risks in zone/music and ai.md, each with a fix proposed: step 3 as 3a to 3e, the db never in git and its dump restorable, the hook's three calls into database.py kept stable with the always test run after every save, two filter snippets, a claimed route answered by the plugin for every caller, core_alias.test rewritten per chain, and a done column for the 87 rows
- D: the seven corrections are in the plan itself and the risks section is gone. Line 3 names ov's 87 working feature rows as the test. Step 1 freezes ov and retires it at step 16. Step 2 is designed in memory/kb before any code. Step 3 saves the db beside itself first and puts a plain-text dump of it in git. Step 5 keeps the markdown routes at the dispatcher, a plugin claiming a route. Every step names its proof, a suite or a visual report. Step 16 ticks the 87 rows by hand in memory/ai. Music waits for its design. Jonathan decided the db wants a music file's artist, album and title alone
- I: seven risks in zone/music and ai.md, each with a correction proposed: a copy of the db before every step that touches it and a plain-text dump in git, the markdown routes staying at the dispatcher until ov is retired, step 2 designed before coded, ov's 87 working feature rows as the test against ov, each step's proof named as a suite or a visual report, ov frozen at step 1 and retired at step 16, and music not started until designed
- D: the labels column the code calls made_by is who wrote this in prose, in zone/music and ai.md: maker, made by and writer are gone from it
- D: a file's path is relative to its collection's root folder, wherever that root sits, mu's well outside the repo. A project's memory folder is for its development, not its runtime. Step 3 of ov strip down stands as written, and the ai collection's root is the mono repo, as line 37 says
- D: a host hands kb its specialty two ways: the facts, collection, keys, hierarchies and build notes, as switches filled before mount, and the drawing, filter section, details section and operation view, as snippets. Step 2 of ov strip down and the operation view line say so, the pac is decided
- D: a plugin writes its labels as rule, inside the rules pass, so the next look keeps them. Jonathan: a label need not say whether a plugin or a rule gave it. In truth/decisions.md and zone/music and ai.md
- D: reader is plugin, in zone/music and ai.md and the lexicon: a specialty's code in the dispatcher, plugin.py in the host's folder, which reads and writes, its listing rule, its labels and its routes
- I: two pacs in truth/decisions.md. How a plugin labels a file, a fourth maker or writing as rule inside the rules pass. How a host hands kb its specialty, switches set before mount or snippets at render
- D: zone/music and ai.md, six more fixes. The reader is imported from the folder the collection's row names, said in step 5 too. Its listing rule and labels alter no file, its routes may. ai/reader.py is made at step 3 with the listing rule, and step 5 moves the routes into it. Labels.ts and its test are two things, the composing going and label_changes staying. A reader's labels have rule for their maker. The specialty value carries a details section where a host has one
- D: zone/music and ai.md, twelve more fixes. A collection's row names the host's folder, where its reader is. A reader has three jobs, the listing rule, the labels and the specialty's own routes. The routes refuse nothing the listing rule lists, said once. Repair is a section the ai host adds to the details column. The drop box is built once, in the order's second item, and music's first phase uses it. kb has no port, as gallery and panel have none. Step 2 is the specialty value. The music labels question sits under open. The status line is in the kb list. Ten tag areas, four watcher outcomes
- D: zone/music and ai.md, the last contradictions, vaguenesses and gaps out. The ai collection's root is the repo's top, for the CLAUDE files. A specialty's reader is reader.py in the host's folder, imported by the specialty's name, with a listing rule that says what under the root is listed, ai's being ov's today. The specialty is a type kb declares, set on kb's switches before mount as gallery's customizations are. The dispatcher is three things, the hub's routes, kb's routes and one reader per specialty. saving.test and Operations.ts are each two things, one part going and one staying. Step 1 makes memory/kb and memory/ai, memory/ov staying with ov. Music gained a play phase, and an order section says strip down, then kb's new work, then music
- D: ov strip down is sixteen steps: the copy of ov into a kb library and an ai host first, the hand-back next, the collections table as a migration of the real db with the three path-reading tools re-pointed, the reader loading with the dispatcher's routes, the preferences prefix per host, the link stack with the links, is_design with the vocabulary, and the tests going with their pieces last
- D: ov strip down is twelve steps in order, each a checkbox with the same ending, kb runs without the piece and the ai host draws it: the note folders first, then the vocabulary, the dispatcher's routes, the four fields' rows, the editor's parts from the frame inward, and the file's buttons last
- D: zone/music and ai.md rewritten whole, every inconsistency, repeat and broken line out. kb is the library, ov the reference, said once. A collection is a row of name, specialty and root folder, said once. The kind is a file's. The reader alters no file and composes nothing. The operation view is kb's list until a row is clicked, then the specialty's. The drop box is panel's, drawn by kb. The one open question sits under open. kb entered the lexicon, and specialty says kb now. The index says so
- D: specialty is in the lexicon: the schema an app that uses ov brings, its collections, keys, reader, hierarchies and operation view
- D: zone/music and ai.md gained ov strip down: the twelve things the ai host will do that ov will no longer do, each named with the ov file that does it today, and what ov keeps
- D: zone/music and ai.md gained the ai specialty key values table: every key the ai specialty puts on a file, where it lives in the db, what it can hold, and who sets it, the six kinds and the 39 tags among them
- D: zone/music.md is zone/music and ai.md, Jonathan's rename. The ai specialty definition is written in it, the five things the ai host brings, the memory system's markdown files: one collection per memory folder, the five labels as rows and the four fields, a reader for links and content rules, the folders hierarchy with the filters, and the editor as its operation view, with what is this specialty's and not ov's

## 10 September 2026, continued

- I: proposal in zone/music.md, specialty: a new schema is introduced by the host of ov, never by ov, which is a library the way panel and gallery are. ov keeps the files row, labels, sources, rules, watcher, list, filters and the editor's frame. A host brings its collections, its labels, its reader, its hierarchies, its operation view and its kind
- D: zone/music.md, new: ov reads the music files, phase 7 of the roadmap as Jonathan rewrote it, moved there whole with the three decisions it needs first, the folder picker, where a music file lives in the db, and what is read. The roadmap points at it, and the index lists it
- D: AI suggestions, phase 7 of ov as knowledge bases, moved to the top of ji's ideas with its success line and the Design's item 8, since AnythingLLM is ji's. One line in each place says where it went
- D: music is a kind, the sixth, for the files of mu, the music collection. T_Kind in types/File.ts, the kind lists in develop/add a file.md and design/okf.md. Nothing gives it to a file until a rule or a hand does
- D: knowledge bases phase 6 built, the rules. database.py's add_rule, remove_rule, rules, set_rule_labels and clear_rule_labels. dispatcher.py's labels_by_rules tries each rule's regex against the file's name, its location or its content, read once and only when a rule asks, run_rules does every file changed or new since the rules last ran, or every file when a rule is added or taken away, and look is one look at the disk, reconcile then rules, which the watcher, /all-labels and /rescan all do. /rules lists, /add-rule and /remove-rule change and run everything. Saving.ts asks and tells, Files.ts prefers a hand kind over a rule kind and passes over what the AI suggests, and relabel_all puts the db on every record again. D_Rules.svelte in the details column lists, adds and takes away rules, core's T_Details gained rules for it. No rule is written in the real db, the truth kinds being mixed. 114 checks in test_database.py, ov 339 tests, check clean, core check clean
- D: knowledge bases phase 5 built, the sources. database.py's set_sources makes a file's rows exactly the authors sent, each saying where it came from and a date, or one row with no author where only that is said, and sources_of and all_sources read them. dispatcher.py answers /sources and /set-sources, and /all-labels hands every file's sources back with its labels. Saving.ts asks and tells, Files.ts keeps them beside the labels and writes them through write_sources, and Edit_Filters.svelte's information rows gained authors, names separated by commas, and from, a url or a person, written to the db when the field is left. The lexicon names sources and the two rows. 99 checks in test_database.py, ov 339 tests, check clean
- D: knowledge bases phase 4 built, the disk watched. database.py's files table gained a missing mark and reconcile: same path with a new size or time, the fingerprint computed again (changed), a path gone whose bytes are at a path with no row, the row moved there with its labels and fields (moved), a path gone with no match marked missing and kept, a missing row whose path is back found. dispatcher.py's rescan takes the listing and hands it to reconcile, a thread started at launch does so every 3 seconds, /all-labels does so before answering, and /rescan on request. Neither fswatch nor watchdog is on this machine, so the disk is asked, not told. A db open waits up to 5 seconds for the other thread. 90 checks in test_database.py on a repo made for the run, 35 in test_dispatcher.py
- D: ov shows a missing file. Files.ts hangs every row the db marks missing where it sat, with no address, reads nothing for it and takes its labels from the db. List_Files.svelte strikes its name through, its hint says it is not on disk, and a click says so along the bottom and opens nothing. ov 339 tests, check clean
- D: memory/index.md's block is off too, by hand: its three okf lines were co's, from 23 August 2026, and nothing read them. No memory file the dispatcher lists carries a block
- D: knowledge bases phase 3 built. database.py's files table gained title, description, use_when (csv) and date, a db made before them is given them on open, and record_file, set_fields, all_fields, move_path and delete_path came with them. dispatcher.py's labels_in_text reads all six lines of a block, type as the kind and updated as the date where the newer line is missing, and names any line the db has no place for. /scan records the fields, /all-labels hands them back beside the labels, /set-fields writes them, /move-guide and /delete-guide carry the row with the file, and /strip-block, asked with a confirm word, takes the whole block off every file the db holds and keeps one carrying an unknown line. The scan and the strip ran: 1099 fields across 369 files, 21 kinds from type lines, 368 blocks off, memory/index.md kept for its okf lines
- D: ov reads all five labels from the db. Files.ts keeps every file's fields beside its labels, read_one takes title, description, use_when and date from there and calls a file with no row unlabeled, write_fields sends the four to /set-fields, and create_beside writes a heading alone and puts the five in the db. Edit_Filters.svelte writes the db and never the file. Edit_Markdown.svelte composes labels for a bare file into the db. Labels.ts's blank_file is the heading alone, its block writers stay, called by nothing. big-picture.py writes no block. A route that reads no body drains it, since a body left unread reset the connection on the asker. 78 checks in test_database.py, 35 in test_dispatcher.py, 15 in test_big_picture.py, all four hold in test-always-tag.sh, ov 339 tests, check clean
- D: knowledge bases build order gained a phase 3, the other four labels into the db and the whole block out of every file, with where they live left open, label rows or file columns. File watching, authors, rules and AI suggestions moved up one to 4 through 7
- D: the three readers of the two lines read the db. inject-always.sh asks database.py which files wear the always tag and which are the explain kind, and says in one line when the db is not there. test-always-tag.sh takes the tag off and puts it on in the db, never in the file, all four hold. big-picture.py writes its block without kind and tags and records analyze and now in the db for the real file alone, 15 checks. collaborate/hooks.md says so
- D: the removal waits on Jonathan. inject-always.sh and test-always-tag.sh read the always tag off the files with grep, and big-picture.py writes a block with kind and tags. Each has to read the db before the lines can leave the files
- D: knowledge bases phase 1 built. tools/hub/database.py makes the db, tools/hub/ov.db, with the four tables, and writes and reads labels; a file's row is made from the disk when its first label is written. dispatcher.py answers /labels, /add-label and /remove-label with the same refusals as read-guide. test_database.py writes a tag and reads it back against a db of its own, 23 checks; test_dispatcher.py asks the running dispatcher for labels, 35 checks. The db file is git-ignored. The dispatcher was restarted to serve the routes

## 9 September 2026

- D: managers/Preferences.ts keeps the enum of ov's keys and makes one instance of core's Preferences with the ov_ prefix. The class is core's now, taken through Core.ts
- D: the outer div's class is app, not frame, in App.svelte. Check clean
- S: settled 25 dated lines of 6 to 8 September. The multi-select build is in working features rows 79 to 82, row 82 new (checkboxes as hit targets on the controls layer, hover on the checkbox alone) and row 80 now saying shut folders included. progeny is in the lexicon. The ancestry is in truth/controls.md. Launch reading is in row 78. The drive's dissolution is in index.md, consolidate.md and shared's decisions. The bridge rename is in the map and the lexicon. The notes-rooting line is superseded by the reorg, its Saving.ts gap carried into zone/ideas.md. Two done records and one settle record dismissed. The original work log below the rule carries forward untouched: untagged, finished work, whose one home would be zone/work/work journal.md

---

## original work log

Formerly: **code debt paid**.

- use claude fable to audit my md system
    - project separate for audit
        - tell it where my folders of md files live
- the kinds are five — analyze in, design and refer out
    - analyze added: a taking apart of something to find out how it works
    - fourteen files wearing design moved to explain, then design taken out of the list
    - refer taken out, and the kind a composed file starts at became analyze
    - a folder no longer decides a kind — a designs folder used to make its files designs, and
        with that kind gone no folder name says how a file reads
- a link no longer stops at the wrong file of that name
    - the climb passes over a file standing where the link does not say, and keeps going
    - a refusal names where the file of that name does sit
- the note line at the bottom of the reader says the whole account, not which kind of refusal
    - its words can be picked up and copied
    - it is registered while it is showing, and says so when it arrives and when it leaves
- the counting hook lost half of every complaint that followed a reply with a tool call
    - it counted entries, and every tool call is an entry of its own
    - it now passes over the ones holding no words, and a test proves the pair comes back whole
- tt for steppers -> name the file
    - both walks split in two — one says which file lies that way, the other goes there and
        asks the first, so what a stepper says and what pressing it opens are one answer
    - backing out past the bottom of the stack goes to where the reading began, a file like any
        other, so it names that file
    - a report is not a file, so stepping back to one keeps the plain words
- add a list of back links to the editor
    - every guide's links come out of the very text its labels are read from, at launch — one
        more look at words already in hand, and nothing kept but the addresses
    - the double-bracket form has to be turned into the ordinary one first, or a guide written
        the short way holds no link at all
    - answering a link needs every guide findable by where it sits, and that map is the
        narrowing's — asked before it, every lookup found nothing and said nothing
    - a section of its own below the words, drawn only where something points here
- adding a tag by hand does not work
    - Obsidian writes the tags one name to a line, and rewrites a file into that shape the
        moment its tags are touched there; the reading knew only the one-line shape
    - nothing was dropped and nothing was said, since nothing was read at all
    - the reading of the labels moved out of the manager into the label utility, where the
        writing already lived — in the manager it could not be tested without the whole app
- fix github vulnerabilities
- remember the scroll position in the fifo
    - a line is remembered, never a distance — it survives an edit that adds lines above it
    - one line per guide, so a guide reached twice down two paths keeps a place for each
    - written as the scrolling settles, never on the way out: by then the box is back at its top
    - the title stays at the box's top, so it was always the line at the top and had to be passed over
- scroll md -> soft pointers not clipped by title row
    - every button is put on the controls layer, and a fold mark is a button — so it and the
        title row held the same layer, and the mark came later in the page
- placeholder text and overstrike -> --lightgray
    - the two search fields, and a finished thing's struck-through words
- tagset active-- now, next, soon, later, tabled
- fix the folder no folder button at width.tiny (50px)
- every row of a table shows the line it came from
    - the number hangs off the row's first cell — anything drawn against a row becomes a cell of
        its own, which pushes every real cell one column along
    - a table wears no number itself, since a table's own drawing goes wherever the browser
        decides, which is down beside the second row and over the number already there
    - the line of dashes under the headings is drawn as nothing, so it carries no number
- where a file sits is called its path
    - `place` -> `path` wherever it means a file's location, in nine files
    - the everyday noun and verb keep the word — said in one place, holds its place in the run
    - on disk it is a path, on the web a url, and address is either one
- a file with no labels is marked as the one being worked on
    - the composed block wears `active` beside `stale`
- the editor's step marks repeat while held
    - a press and the first beat of the repeating are the same act, said once
    - the hover changing no longer stops the patter, so a mark redrawn under the cursor keeps
        beating
    - [[memory/ov/zone/work/soon/mouse ux]] — the pressed thing is remembered, and letting go elsewhere does nothing
- the count in the editor's top row holds one width, its words to the right
    - `width.tiny` — 80 — added to the one ladder of sizes, so nothing writes a number alone
- every picking row holds the same gap under its own line
    - the editor's search, kinds and tags rows asked for none, so they took the usual gap while
        browse's three asked for the big one — six rows, two different gaps
    - the search field is drawn two pixels lower, so it sits square under the line
    - one call says every section's gap below its own line, to its box and to its first ink
- one press is one act, wherever it ends
    - a row opens its file when the press is let go, so a file can be dragged into a folder
    - both folder marks act on release too — turning changes the mark's own shape, so acting on
        the way down moved it out from under the cursor and the row turned the folder straight back
    - the manager says a press once: a control that repeats begins with a beat, and that beat
        is the press
- the app lists the notes inside five folders of a work folder
    - `next`, `milestones`, `now`, `done`, `proposals` — 85 notes across four collections
    - the dispatcher walks them, its one door lets them be read and written, and the app places
        them; all three said the same thing before any of it worked
- links to a work note resolve, and a report says what it cannot find
    - the double-bracket form is turned into the ordinary one before a link is judged
    - where a link points is worked out from the file it sits in, never from the words it spells
    - a dead link names the likeliest file of that name — most shared folder words, then the
        fewest folder steps, and nothing at all where two are equal on both
    - pressing a row in a report looks for the words the link reads as, never its address
- a report is remembered whole, and says when it was made
- command with option on a file's row shows the folder it sits in, in the Finder
- the row number counts the file from one, the labels among the lines, the way Obsidian does
- the dead-link check follows links into work notes
    - only what reaches deeper than a work folder's own top is passed over, the same line the
        reading of a place in the repo draws
    - the count line says how many were passed over, and only when any were
- opening a piece for changing moves none of its words
    - the box stands inside the piece, with the piece's own words out of sight behind it, so the
        row number never leaves the element that draws it
    - the markdown the drawn page gives no width to — a heading's hashes, a thing to be done's
        brackets — stands out to the left, and the first word lands where it stood
    - a thing to be done that holds a list keeps that list on screen below the box
    - the manager's queued-rebuild mark is cleared whatever the waiting does, and redrawing the
        fold marks says so
- the details column folds behind words on lines, like everything else
    - its two banners went — the block, the shape behind it, and its fill
    - the column is one stack of sections on the page color, standing on the accent
    - a section can hold a different gap below what it shows, since the two sides are drawn
        against different things
- the record of one file is called a file
    - `Guide` -> `File`, `Filtered_Guide` -> `Filtered_File`, and the field on a row -> `file`
    - `Guide_Place` -> `File_Site`, `Pill_Place` -> `Pill_Placement`
- the hits manager pays its own way
    - the hover said only when it changes, and only the two elements that changed are stamped
    - a run of things arriving costs one rebuild, not one each
    - a scroll shifts rectangles by the distance scrolled, reading nothing from the browser
    - it checks itself: a rectangle that moved without saying so raises a box naming what to mend
- port Hits.ts from di
    - every control, every segment, every section and the two page areas hand it their press,
        their hover and their words
    - the empty-space rule is gone: a control beats a section, which beats the page, and within
        one kind the smaller area wins
    - a target says when it is out of sight, so a clipped thing holds no place at all
    - names follow one rule, and a repeat says so in the log
- register hamburger with hits manager
- 1/8 s fade the hover. too flashy,, annoying
- every gap around a line measured from the line's middle
    - a section holds it above and below alike, whatever its own line is drawn at
    - a folded section holds the one gap, and one asking for no gap stands flat
    - the title's slot in a file's words said once, and read by the line that closes it
- everything that can be pressed stands in front of the words around it
- the two colors are both chosen — a page picker beside the accent, and the hover a lean from the page toward the accent
- a word on a line masks it with a pill, so the line's cut ends never show past the curve
- whatever sits between a file's labels and its first heading is offered for removal, and holding a step mark stops at a file that raised something
- rename \_OKF -> Filters
- a word on a line is the caller's own — every clickable title built by its caller, handed to the line as a made element with the end or middle it stands at
- the picking control and both clears stand on their own lines, at the middle, and go when the section folds
- a row of tags holds a gap above itself only when a name rides above a pill in its topmost line
- the fill and the press of a section's bare background ask one question of one place
- a `+` in the editor's top row makes a file beside the one open and opens it
- a link naming a file of code opens it in VSCode, at the line it names
- any but — a file shows only if it wears none of the picked tags
- declaring a breakdown
    - a guide with the four steps: declare it, state the objective, take stock, try again
    - a `/br` skill that walks them on the spot
    - four phrases in keywords, two states in gates
- the assessment of mono's guides brought up to date
    - every one of the 55 files listed under its real folder, each with its own brief
    - every file name in it a working link
- kind renames — step became howto, wire became arch
- the settled diagnostic lines taken out — the tag timing, the remembered settings, the folds and the row count
- a clear that has nothing to clear grays and answers nothing
- tags
    - in Browse, the 'all' button became an 'any of'/'all of'/clear/invert segmented control
    - in Editor, just clear/invert
    - with 'all of' picked, a tag that would empty the list grays out
- work notes are files like any other
    - each project's work folder stands beside its guides
    - read, write, rename and throw away; anything deeper than its top stays out
- the kinds are six — work eliminated, step became howto
- a dispatcher button in the top row, starting it over without leaving the app
- things to be done
    - `- [ ]` and `- [x]` draw as a box, pressed to write the other letter back
    - a done item's words struck through; one holding a list gets a soft pointer
- every row shows the line of the file it begins on
    - a line the reader draws as nothing gets a row of its own, so none is missing
    - a row named twice shows its number once
    - one constant says where the numbers end; the pointer and the words follow from it
- trial run with ov work
    - follow a link that points outside the guides folders
        - add labels to work files
        - do NOT include code files
- tags
    - animate relayout on list files
    - when a tagset (area) is unfolded, move it to the first row of tags, all the others go to  new second row
- murky -> lexicon
    - ov/notes/guides/design/organize.md
- line the right edge of the folders button with the right edge of the first header text
- search files does not match against file name, just the labels
- whitespace around almond in header's thin line --gap-tight
- use Section in Browse
    - the picking rows, the three inside them, and the count row all draw their own line and hold their own gap
    - the table header's line moved to the top of its row, its words riding it and taking no height
- break the editor into four
    - the search, a guide's own labels, and a guide's own words each left with their own styling
    - the click rule became Hit_Empty_Space, named for what it answers
    - Browse and Editor moved up into the frame folder, the status line down into content
- typing in the search no longer re-reads and redraws the file on every letter
- scrolling content should not scroll title row
- mark the guides that are talking about finished work
- add new tag area -> progress
    - tagset -> propose, coding, done
- loc where labels are added when detected as missing
    - only add labels as and when a file is opened for editing
- mark 'stale' all guide files that contain completed tasks, phases, steps
- click in area below separator -> rules
    - click closes that section
    - hover lights up the clickable sep title
    - tags area is different
- eliminate purpose
    - design and work joined the kinds, said in a file's own labels
    - the purpose row, its remembered setting and its last-one-on rule all went
- one ladder of names across every kind of measurement
    - separator folded into thickness, the two being the same thing
    - the styling names follow the same ladder
    - the typeface got a name of its own, so it stops fighting the middle text size
- the top of a file reads as one fixture — a fixed slot for the title, a line across the page below it
    - the line belongs to the page, not to the title, so folding or opening the title never takes it away
    - a piece opened for changing holds the piece below it exactly where it stood
- the dispatcher's list is the app's whole picture — no build-time scan of the guide folders
    - nothing reloads the page when a guide is written, renamed, moved or thrown away
    - with the dispatcher not answering, the screen says so rather than sitting empty
- editor
    - a ⤴ button right of the trash, opening a message with the guide's words
    - click file name -> edit in place
        - ie, centered -> typing is a bitch?
- moving a file no longer restarts the app
- mo/pre-flight — replying became response, working became agency
- ji — a ⤴ button left of help; the chat stays on screen while the AI is unreachable
- a file added to the guides shows without a relaunch
    - the dispatcher says what is on disk; the app reads anything its prepared list missed
    - a file with no labels gets a block composed from its own words, marked stale
- editor — the file name is a field that reads as plain words until pointed at
    - leaving it, or Return, renames the file; Escape puts the old name back
    - the view follows the file to its new place rather than shutting
- editor — a trash mark at the right of the second row
    - pressing it asks `delete "<name>"?` in the row itself, the name stepping aside
    - the dispatcher gained a delete route, with the same refusals as moving
- editor — code blocks can be edited, and command-b/i/hyphen mark up what is picked
    - typing a bracket or a quote with words picked wraps them, and again unwraps
- rename the five kinds — specify, step, wire, explain, refer
- rename list files -> files, edit file -> edit
- svg
    - circle slash -> the opposite of whatever it overlays
    - filter unichar -> several horizontal lines of decreasing length
- scrollbars in list are too thin
    - one place says how thick, every scrolling box reads it
    - a thumb never shorter than a fifth of its lane
    - both thumbs drawn at once — the floored one, and a marker where the browser would have put it
- wider hover&click area around every sep = thickness
- edit — the file name centered in what the folders leave over
- list — the project column and the count read at the label size
- put success at the top of the proposal
- remove close button from edit
    - click anywhere in the two rows
    - other than the controls and the file name
    - goes to the list
    - hovering the empty part lights the whole area, out to the box's edges
- one search for both list and edit
    - same words, same lit place, surviving the walk between them and a reload
- a section's own soft pointer works while the title is folded
- edit file
    - search row above, controls row below
    - ancestry beside the steppers
    - same row height as the list, so nothing shifts on the way in and out
    - move close button to far right, adjusting other buttons
    - H1 soft pointer should also open/fold its own para content
    - remove the rename button, leave its handler as is
- rename view file -> edit file
    - remove the edit button and the is editing state
    - rewrite the code to remove executed when 'is editing' == false
- add show/hide soft_pointer for H2 - 6
    - in left-side margin, as with obsidian
    - H1 -> toggles all
- in list files, move show/hide filter button into **sep** below search box (clickable and hoverable)
    - clickable title says 'filters', unicode bold arrow, and comma separated list:
        - purposes, projects, kind, tags
    - when showing filters, keep both **seps**
        - this new one
        - the current unlabeled below the filters
- convert the two fat triangles in the view guide -> Steppers.svelte component
    - prop isVertical, alwaysShowBoth
- hover on seg -> make border around title pill border-box
- editing an md block
    - make the font and linespacing same as while just viewing
- add an anything llm button to the hub, top row, far left "LLM"
- the top clickable sep should say 'okf' when editing is turned on and nothing when it is off
- implement [[tags hierarchy]]
- drag and drop -> update both index files
- when folders are visible, implement drag and drop to move files from one folder to another
- steps to annotate for okf a file when adding it to the guides
- mark each listed guide regarding
    - match of: name or content
    - on click of the matched-content
        - copy search to view's search
        - on return to browse, clear the view's search
- count all the .md files
- while holding both command and option keys down, click on a file name opens it in obsidian
- add editing ability
    - stamp each piece with the lines it came from
    - click a piece to edit it, in the file's own words
    - swap those lines, leaving every other line untouched
    - draw the guide again from the changed text
    - a route that accepts writes, with two refusals
    - the five labels edited through their own form
- add a toggle button top left hide/show filters
- add search to view guides, a new second row
- bring internal hyperlinks to life
- translate md -> html, and display the html in the view document
- delay showing the app until hierarchy is loaded
- add two labels in the top row of view guide
    - kind at immediate right of fat triangles
    - tags to the immediate left of close button
- add show/hide folders button at far left of counts row, keep the counts centered
- add another segmented control/filter -> projects
    - above kinds
    - sep between them
- add sorting to filters, only when hiding folders
    - click on header label (kind, name, or tags)
        - once to sort ascending, again for descending
    - add a button next to hide show folders "unsorted"
        - appears only when (a) folders are hidden and (b) any of the sorts are invoked
- each row -> expand the clickable and tt responder to the entire row
