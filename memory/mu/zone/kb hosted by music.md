# kb hosted by music

The music host's part of [hosting kb](hosting%20kb.md), which holds what both hosts need: edgy, the kb list, what a specialty is, the plugin api, the kb tables, the common rules, and steps 1 to 3, 25 to 28 and 32. ai's part is [how ai hosts kb](../../ai/truth/design/how%20ai%20hosts%20kb.md).

## music specialty

The music specialty is mu's: the files of a music library under a root folder i pick, anywhere on the disk. mu's own thinking is in its memory, [design](../truth/design.md) and [project goal](project%20goal.md), and the answers below draw on them. The five things, what is known of each, 11 September 2026. Each of its open questions is a substep of the plan's step that needs it, and the two for later are steps 30 and 31.

1. **collection information.** One row per root folder: the specialty's name, music, and the root, the folder dropped or picked. Every dropped folder is a collection of its own, for now, named for the folder, decided 11 September 2026. The library is the volume `/Volumes/muice myoozk`, decided 11 September 2026: an NTFS disk over USB, four top folders, Any Audio, HD Audio, MVE and MuSC-V, 18,219 files, 6227 of them flac, 1954 mp4, 1421 vob, and 3085 jpg beside them.
2. **keys.** artist, album and title, each a row in the labels table written by the plugin as rule, as what it is says. Several artists on one file, a duet, are one row each. The kind is one of four, music, images, text and video, decided 13 September 2026, one per file by its ending: music for mp3, m4a, flac, wav and shn, video for mp4, mpg, avi, mkv and vob, images for jpg, text for pdf and txt, the plugin giving it as rule. A song takes tags from a closed list of four, jazz, classical, rock and hifi, decided 13 September 2026, reversing no tags of 11 September: rows in the labels table, written by hand through the editor or by the ai, never by the plugin, since a file's own tags name none of the four.
3. **plugin.** `mu/plugin.py`. Its listing rule: under the root, files ending mp3, m4a, flac, wav, shn, mp4, mpg, avi, mkv and vob, the jpg cover art beside them, decided 11 September 2026, and archives, zip, rar and 7z, opened with unar, the one tool that opens all three, which the dispatcher runs and says how to install when it is missing, as project goal says. A pdf or txt beside a song is matched to the song by its name and attached to it. Its labels: the three, read from the file's own tags. Its routes: one that streams a file's bytes to the player, answering the range the browser asks for, and later one for vob, which runs ffmpeg on the dispatcher's side, since no browser plays MPEG-2.
4. **hierarchies.** Four now, by folder, by artist, by album and by name. Folder is the paths, as ai's. The other three group the rows by one label's value.
5. **operation view.** The player: the browser's own audio element for mp3, m4a and flac, its video element for mp4, inside kb's editor frame with the kinds row and the tag areas above it.
6. **mu project code.** What mu has today: the three files that draw panel, configured with its name alone, and its two bridges, Core.ts and Panel.ts. To come: a bridge to kb, the player as the operation view snippet, its filter sections, artist and album, `mu/plugin.py` with the tag reader and the streaming route, and its own build notes table.

## music schema

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

## music rules

A song takes tags from a closed list of five, tag area genre -> {jazz, classical, rock}, tag area quality -> {low and high}, decided 13 September 2026, so the scan has tags to give a music file, and these rules apply. 

1. **The instructions.** No kind, since the plugin gives it by the file's ending. The five tags, with one line each on when it applies, and the answer, the tags as csv.
2. **What is sent.** A music file has no words: its name, its path and the three tags the reader found.
3. **What must be supplied by hand.** artist, album and title are the tag reader's rule rows. A file with empty tags is its name and folder, and a rules row gives one fixed value, so that is mu's plugin's parsing, not a suggestion.
4. **Scale.** One call per changed file over tens of thousands, so no rerun button, and the first scan of a library makes no calls: files changed after the checkbox is turned on alone.

Purpose: a song gets the tags a hand would give it. Goal: the same count, of the first fifty.

## plan

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

### mu adopts kb, step 29

- [ ] 29. **mu adopts kb.** The sixth item of the music specialty: a bridge to kb, mu's App.svelte drawing kb's page with mu's snippets, the player as the operation view snippet in place of step 24's first list, its filter sections, artist and album, its configured host, its four tags and their area, and its own build notes table. Proof: mu's alias test, that only its bridges name a library, and a visual report of the library browsed by artist and album and a song played.
    - [ ] 29a. **question** what a click does: play at once, or select, with a play button?
    - [ ] 29b. **question** what the steppers do: walk to the next song and play it, so an album plays through, or step alone?
    - [ ] 29c. **question** cover art: shown, from the file's tags, read by the same reader, or not?
    - [ ] 29d. **question** the tag area for mu's four tags, since kb draws tags by area: one area holding the four, or two, jazz, classical and rock as one and hifi as another?
    - [ ] 29e. **Build the player** as the music specialty's operation view says, with 29a to 29d in it.

### later, steps 30 and 31

- [ ] 30. **vob, mpg and avi.** A route in mu's plugin that runs ffmpeg on the dispatcher's side, since no browser plays them, as the mu project goal says. Proof: a vob played in the browser.
    - [ ] 30a. **question** when ffmpeg runs: once, into a cache, or as it plays? mu project goal's own open question.
    - [ ] 30b. **Build the route** the way 30a chose.
- [ ] 31. **The letter hierarchy.** A fifth music hierarchy, by first character, as what it is names. Proof: a visual report of the list by letter.
    - [ ] 31a. **question** of which label: artist, album or title?
    - [ ] 31b. **Build it** as step 26 built the others.
