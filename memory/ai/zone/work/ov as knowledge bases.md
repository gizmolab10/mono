# knowledge bases

Every company ends up with knowledge nobody can find. i asked how they organize and browse it, then which of those approaches fit ov, mu and ji. Finally, a roadmap to flesh out ov to be better than the best available.

## roadmap: implement them all, on ov

### Build order

Each phase ending with something to look at:

- 7. read the music files: moved to [music and ai](music%20and%20ai.md), 10 September 2026, with the three decisions it needs first.

### Success

#### new features

- store tags and such in local storage or local db (not in properties in the files)
- store refs to on-disk files, not store the files, leave the files on disk
    - somehow notice when files change location or content
- incorporate authors and provenance
- create categories and tags from each file, based on the file's:
    - name
    - location
    - content

### Design

1. **One db, on disk.** A SQLite file next to the dispatcher (a whole database in one file, read by a standard library). Only the dispatcher's own module, `database.py`, reads and writes it: the dispatcher through its routes, and the three tools that import that module, `inject-always.sh`, `test-always-tag.sh` and `big-picture.py`, since 10 September 2026. Not the browser's local storage, which is tied to one browser, capped at a few megabytes, and erased with the browser's data. The file is git-ignored and has no backup yet: a saved file before every change to it and a plain-text dump in git are planned in [music and ai](music%20and%20ai.md), step 3a.
2. **Four tables**, and a fifth, collections, planned in [music and ai](music%20and%20ai.md): a name, the specialty's name, the host's folder, and a root folder on the disk, every path relative to that root.
    - files:
        - collection
        - path
        - size
        - modified date
        - missing mark (the file is gone from the disk and the row kept, since 10 September 2026)
        - all the remaining labels each in their own field:
            - title
            - description
            - use_when (the occasions the file is read on, several, kept as one csv field)
            - date (the last real change, the one the block carried, apart from the modified date above, which the disk says)
        - fingerprint (a short code computed from a file's bytes; same bytes, same code).
    - labels — One row per kind or tag, each saying who wrote this: hand, rule or ai, the column the code calls made_by:
        - file
        - name
        - value
    - sources:
        - file
        - author
        - where it came from (a url or a person)
        - date
    - rules:
        - reads (name, location or content)
        - pattern to match
        - label it gives (name and value)
3. **Files stay where they are.** ov already reads them in place through the dispatcher; the db keeps only the path.
4. **Labels leave the files.** The labels at the top of each markdown file move into the db, and OKF changes to match.
5. **Noticing changes.** The dispatcher looks at the disk every 3 seconds, and once more before every launch of ov: the listing, and a stat per file (called polling). Nothing on this machine reports changes as they happen without a package the dispatcher does not carry, neither fswatch nor watchdog, so the disk is asked, not told. At launch it rescans, for changes made while it was off. Built 10 September 2026, as the four outcomes below say.
    - same path, new fingerprint → content changed; update the row.
    - path gone, same fingerprint at a new path → moved; update the path, keep the labels.
    - path gone, no match → missing; the row is kept and the files list shows it, its name struck through.
    - a missing row whose path is back → found; the mark comes off.
6. **Authors and provenance.** Markdown files carry neither, so both are typed into two new information rows in the editor. Built 10 September 2026: authors, names separated by commas, and from, a url or a person, one row in the sources table per author, written when the field is left.
7. **Labels from rules.** When a file is added or changes, the dispatcher runs every rule on it. Rule labels are recomputed each time. A rule never changes or removes a hand label. Built 10 September 2026: a rule's pattern is a regex tried against what it reads, the file's name, its location (its path from the top of the repo) or its content, read once and only when a rule asks. The rules run at every look at the disk on the files changed or new since they last ran, and on every file when a rule is added or taken away. A file no rule hits gets no row. In ov a hand kind wins over a rule kind, the tags are both together, and the rules are listed, added and taken away in the details column's rules section.
8. **AI suggestions** went to the top of ji's ideas, 10 September 2026, words and all.

## the seven approaches

Most companies mix two or three.

1. **Wiki with a page hierarchy.** Pages sit in spaces, nested. Browse the hierarchy, follow links, or search. Confluence and Notion are the biggest; Confluence wins where Jira is already in use. SharePoint does this at Microsoft companies. Slab and Slite are smaller.
2. **Shared drives.** Plain folders of files in Google Drive, SharePoint or Box. The most common in practice. Easy to start, hard to keep tidy.
3. **Structured knowledge base.** Articles in fixed categories, with permissions and a publishing step. A wiki lets anyone edit; this does not. Often a customer help center. Document360, Zendesk, Helpjuice, Freshdesk.
4. **Verified cards.** Short entries, each with a named owner and a date to re-check it. Guru. Old information cannot stay around unnoticed.
5. **Docs in a git repository.** Markdown kept with the code, reviewed like code, built into a website. GitBook, Docusaurus, MkDocs, Backstage.
6. **AI search across everything.** One tool indexes the wiki, drives, Slack, email and tickets. Ask a question instead of browsing. Glean, Atlassian's Rovo, Microsoft Copilot. The fastest growing approach in 2026.
7. **Q&A site.** People post questions, others answer. Stack Overflow for Teams.

All seven organize with the same few tools: a hierarchy, tags, links between pages, templates, and a named owner per page with a review date. The owner rule matters most. Without it, content goes out of date in any tool.

## what fits ov, mu and ji

ov browses every markdown file in mono. mu browses my music, reading each file's own labels.

### ov and mu

1. **A folder hierarchy.** ov's browse list and mu's by-folder view.
2. **Filters by label**, several at once, each narrowing the list (called faceted filtering). ov's labels are kinds and tags. mu's are artist, album and letter.
3. **Search.** ov has it. mu needs it once the collection grows.

### ov only

1. **Links between files.** ov's editor already shows back links (the files that link to the open one). Obsidian does the same.
2. **Review dates.** Every file carries a date in its frontmatter. A filter for files not touched in N days is the verified-cards idea, minus the owner, since i am the only author.
3. **Docs in git.** mono already is this. ov browses it.

### mu, if it grows

1. **Links between people.** If mu shows who played on what, links from a track to its musicians and back work like ov's back links.

### ji

ji is where i drop documents, tag them, and ask an AI that has read them.

1. **AI search works best.** It is ji's whole point. Glean and Rovo index a company's tools; ji indexes my drops, and the AI store in AnythingLLM answers questions about them.
2. **Folders and tags support it.** A document sits in one folder. Tags nest, and one tag can sit under several. Filtering the list by tags is the same faceted filtering ov and mu use.
3. **The untagged inbox** lists documents with no tag yet, which shows what still needs one.

### neither ov nor mu

1. Publishing workflows and Q&A sites. Both assume many authors.
2. AI search across everything. ov's goals kept AI out at the start.

### combine them all

Three apps, one job: find a file, narrow the list, open it. i want one app that browses every collection, whatever it holds.

1. **One app, several collections.** ov becomes that app. A collection holds markdown (mono's projects), music (mu) or dropped documents (ji). mu is already a collection in ov's browse.
2. **Each collection says three things:** where its files come from, how their labels are read, and which hierarchies it offers.
    - markdown: files on disk, through the dispatcher; labels from the top of each file (kind, tags, date); the folder hierarchy.
    - music: files on disk; labels from inside each file (artist, album, title); by folder, artist, album, name and letter.
    - documents: drops into ji's store; tags from ji's store; the folder hierarchy and the tag hierarchy.
3. **Shared by all:** the files list, the filters stack (one filter per label), search, and the editor.
4. **Kept by one:** back links for markdown, a player for music, asking the AI for documents.
5. **Later:** the AI store reads every collection, so one question searches all three.

Open: ji keeps its records in the browser, not on disk. Either the dispatcher learns to read them, or ji's documents move to disk.
